import { Response } from 'express';
import mongoose from 'mongoose';
import { ReviewFinding, FindingStatus } from './model';
import { Project } from '../projects/model';
import { AuthRequest } from '../auth/middleware';

// Helper to generate unique finding code e.g. REV-2024-8192
const generateFindingCode = (): string => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `REV-${year}-${randomSuffix}`;
};

// 1. Create Technical Review Finding / Clarification (Admin / Technical Auditor)
export const createFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      entityType,
      entityId,
      category = 'general',
      severity = 'major',
      title,
      description,
      assignedTo
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project record not found.' });
      return;
    }

    const findingCode = generateFindingCode();

    const finding = await ReviewFinding.create({
      findingCode,
      projectId,
      entityType,
      entityId,
      category,
      severity,
      title: title.trim(),
      description: description.trim(),
      raisedBy: req.user?.id,
      assignedTo: assignedTo || undefined,
      status: 'open',
      responses: []
    });

    res.status(201).json({
      success: true,
      message: 'Technical audit finding created successfully.',
      data: finding
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. List Review Findings with Query Filters & Pagination
export const listFindings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      entityType,
      severity,
      status,
      category,
      page = '1',
      limit = '20'
    } = req.query;

    const filter: any = {};

    if (projectId) filter.projectId = projectId;
    if (entityType) filter.entityType = entityType;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (category) filter.category = category;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const [findings, total] = await Promise.all([
      ReviewFinding.find(filter)
        .populate('projectId', 'name code projectType standard status')
        .populate('raisedBy', 'fullName phone role')
        .populate('assignedTo', 'fullName phone role')
        .populate('resolvedBy', 'fullName phone role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ReviewFinding.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: findings,
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

// 3. Get Findings by Project
export const getFindingsByProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, severity } = req.query;
    const query: any = { projectId: req.params.projectId };

    if (status) query.status = status;
    if (severity) query.severity = severity;

    const findings = await ReviewFinding.find(query)
      .populate('raisedBy', 'fullName phone role')
      .populate('assignedTo', 'fullName phone role')
      .populate('resolvedBy', 'fullName phone role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: findings.length,
      data: findings
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Finding Details by ID
export const getFindingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const finding = await ReviewFinding.findById(req.params.id)
      .populate('projectId', 'name code projectType standard status')
      .populate('raisedBy', 'fullName phone role')
      .populate('assignedTo', 'fullName phone role')
      .populate('resolvedBy', 'fullName phone role')
      .populate('responses.respondedBy', 'fullName phone role')
      .populate('responses.evidenceIds');

    if (!finding) {
      res.status(404).json({ success: false, message: 'Review finding not found.' });
      return;
    }

    res.status(200).json({ success: true, data: finding });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Submit Clarification Response to Finding (Project Developer / Field Agent)
export const respondToFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, evidenceIds } = req.body;

    const responseItem = {
      respondedBy: req.user?.id as any,
      message: message.trim(),
      evidenceIds: evidenceIds || [],
      createdAt: new Date()
    };

    const newStatus: FindingStatus = evidenceIds && evidenceIds.length > 0 ? 'evidence_submitted' : 'under_clarification';

    const finding = await ReviewFinding.findByIdAndUpdate(
      req.params.id,
      {
        $push: { responses: responseItem },
        $set: { status: newStatus }
      },
      { new: true }
    );

    if (!finding) {
      res.status(404).json({ success: false, message: 'Review finding not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Clarification response submitted successfully.',
      data: finding
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Resolve / Reopen / Close Finding (Admin / Technical Auditor)
export const resolveFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, resolutionSummary } = req.body;

    const statusMap: Record<string, FindingStatus> = {
      resolve: 'resolved',
      reopen: 'reopened',
      close: 'closed'
    };

    const targetStatus = statusMap[action] || 'resolved';

    const updateData: any = {
      status: targetStatus,
      resolutionSummary: resolutionSummary ? resolutionSummary.trim() : undefined
    };

    if (targetStatus === 'resolved' || targetStatus === 'closed') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user?.id;
    }

    const finding = await ReviewFinding.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!finding) {
      res.status(404).json({ success: false, message: 'Review finding not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Audit finding marked as '${targetStatus}'.`,
      data: finding
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Update Finding Details (Admin)
export const updateFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, severity, category, assignedTo } = req.body;
    const updateData: any = {};

    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (severity) updateData.severity = severity;
    if (category) updateData.category = category;
    if (assignedTo) updateData.assignedTo = assignedTo;

    const finding = await ReviewFinding.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!finding) {
      res.status(404).json({ success: false, message: 'Review finding not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Review finding details updated.',
      data: finding
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Delete Finding (Admin Only)
export const deleteFinding = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await ReviewFinding.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Review finding not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Review finding deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Aggregate Review Finding Statistics
export const getReviewStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const matchQuery: any = {};

    if (projectId && projectId !== 'all') {
      matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const [statusStats, severityStats, categoryStats, total] = await Promise.all([
      ReviewFinding.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      ReviewFinding.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      ReviewFinding.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      ReviewFinding.countDocuments(matchQuery)
    ]);

    res.status(200).json({
      success: true,
      total,
      byStatus: statusStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      bySeverity: severityStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byCategory: categoryStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

