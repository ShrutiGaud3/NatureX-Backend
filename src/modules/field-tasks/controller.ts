import { Response } from 'express';
import mongoose from 'mongoose';
import { FieldTask, TaskStatus } from './model';
import { Project } from '../projects/model';
import { Land } from '../lands/model';
import { User } from '../users/model';
import { AuthRequest } from '../auth/middleware';

// Helper to generate unique task code e.g. TSK-2024-5542
const generateTaskCode = (): string => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `TSK-${year}-${randomSuffix}`;
};

// 1. Create a Field Task (Admin / Project Developer)
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      taskType = 'general',
      projectId,
      landId,
      visitId,
      assignedTo,
      priority = 'medium',
      dueDate,
      targetLocation
    } = req.body;

    const [project, agent] = await Promise.all([
      Project.findById(projectId),
      User.findById(assignedTo)
    ]);

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }
    if (!agent) {
      res.status(404).json({ success: false, message: 'Assigned agent not found.' });
      return;
    }

    if (landId) {
      const land = await Land.findById(landId);
      if (!land) {
        res.status(404).json({ success: false, message: 'Specified land parcel not found.' });
        return;
      }
    }

    const taskCode = generateTaskCode();

    const task = await FieldTask.create({
      taskCode,
      title: title.trim(),
      description: description ? description.trim() : undefined,
      taskType,
      projectId,
      landId: landId || undefined,
      visitId: visitId || undefined,
      assignedTo,
      assignedBy: req.user?.id,
      priority,
      dueDate: new Date(dueDate),
      targetLocation,
      status: 'assigned'
    });

    res.status(201).json({
      success: true,
      message: 'Field task assigned successfully.',
      data: task
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. List Tasks with Dynamic Query & Pagination
export const listTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      landId,
      visitId,
      assignedTo,
      assignedBy,
      status,
      taskType,
      priority,
      overdue,
      page = '1',
      limit = '20'
    } = req.query;

    const filter: any = {};

    if (projectId) filter.projectId = projectId;
    if (landId) filter.landId = landId;
    if (visitId) filter.visitId = visitId;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (assignedBy) filter.assignedBy = assignedBy;
    if (status) filter.status = status;
    if (taskType) filter.taskType = taskType;
    if (priority) filter.priority = priority;

    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $in: ['assigned', 'in_progress', 'reopened'] };
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      FieldTask.find(filter)
        .populate('projectId', 'name code projectType status')
        .populate('landId', 'landName village district state surveyNumber')
        .populate('assignedTo', 'fullName phone role')
        .populate('assignedBy', 'fullName phone role')
        .populate('verifiedBy', 'fullName phone role')
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(limitNum),
      FieldTask.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Task Details by ID
export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await FieldTask.findById(req.params.id)
      .populate('projectId', 'name code projectType standard status')
      .populate('landId', 'landName village district state surveyNumber areaInAcres coordinates')
      .populate('visitId')
      .populate('assignedTo', 'fullName phone role')
      .populate('assignedBy', 'fullName phone role')
      .populate('verifiedBy', 'fullName phone role')
      .populate('evidenceIds');

    if (!task) {
      res.status(404).json({ success: false, message: 'Field task not found.' });
      return;
    }

    res.status(200).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get My Assigned Tasks (Field Agent View)
export const getMyTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = { assignedTo: req.user?.id };

    if (status) filter.status = status;

    const tasks = await FieldTask.find(filter)
      .populate('projectId', 'name code projectType')
      .populate('landId', 'landName village district state surveyNumber')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Start Task (Field Agent Action)
export const startTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await FieldTask.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          startedAt: new Date(),
          status: 'in_progress'
        }
      },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Field task not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task started and marked as in-progress.',
      data: task
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Submit Task Completion (Field Agent Action)
export const submitTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { completionNotes, submissionData, evidenceIds } = req.body;

    const task = await FieldTask.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          completionNotes: completionNotes ? completionNotes.trim() : undefined,
          submissionData,
          evidenceIds: evidenceIds || [],
          completedAt: new Date(),
          status: 'submitted'
        }
      },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Field task not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Field task submitted for verification.',
      data: task
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Verify / Review Task (Admin / Project Developer Action)
export const verifyTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, notes, rejectionReason } = req.body;

    const statusMap: Record<string, TaskStatus> = {
      verify: 'verified',
      reject: 'rejected',
      reopen: 'reopened'
    };

    const targetStatus = statusMap[action] || 'verified';

    const updateData: any = {
      status: targetStatus,
      verifiedBy: req.user?.id,
      verifiedAt: new Date(),
      reviewNotes: notes ? notes.trim() : undefined
    };

    if (targetStatus === 'rejected') {
      updateData.rejectionReason = rejectionReason ? rejectionReason.trim() : notes;
    }

    const task = await FieldTask.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Field task not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Field task marked as '${targetStatus}'.`,
      data: task
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Update Task Details (Admin / Developer)
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, dueDate, assignedTo, targetLocation } = req.body;
    const updateData: any = {};

    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (targetLocation) updateData.targetLocation = targetLocation;

    const task = await FieldTask.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Field task not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Field task updated successfully.',
      data: task
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Cancel / Delete Task
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { permanent } = req.query;

    if (permanent === 'true' && req.user?.role === 'admin') {
      const deleted = await FieldTask.findByIdAndDelete(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Field task not found.' });
        return;
      }
      res.status(200).json({ success: true, message: 'Field task permanently deleted.' });
      return;
    }

    const cancelled = await FieldTask.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'cancelled' } },
      { new: true }
    );

    if (!cancelled) {
      res.status(404).json({ success: false, message: 'Field task not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Field task cancelled successfully.',
      data: cancelled
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Aggregate Task Statistics
export const getTaskStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const matchQuery: any = {};

    if (projectId && projectId !== 'all') {
      matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const now = new Date();

    const [statusStats, priorityStats, typeStats, overdueCount, total] = await Promise.all([
      FieldTask.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      FieldTask.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      FieldTask.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$taskType', count: { $sum: 1 } } }
      ]),
      FieldTask.countDocuments({
        ...matchQuery,
        dueDate: { $lt: now },
        status: { $in: ['assigned', 'in_progress', 'reopened'] }
      }),
      FieldTask.countDocuments(matchQuery)
    ]);

    res.status(200).json({
      success: true,
      total,
      overdueCount,
      byStatus: statusStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byPriority: priorityStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byType: typeStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

