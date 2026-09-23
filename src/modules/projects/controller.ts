import { Response } from 'express';
import { Project, ProjectStatus } from './model';
import { Land } from '../lands/model';
import { AuthRequest } from '../auth/middleware';

// Helper to generate unique project codes e.g. PRJ-CAR-2024-8899
const generateProjectCode = (projectType: string): string => {
  const typePrefix = projectType.slice(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PRJ-${typePrefix}-${year}-${randomSuffix}`;
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      projectType,
      standard = 'naturex_internal',
      methodology,
      landId,
      startDate = new Date(),
      endDate,
      creditingPeriodYears = 20,
      estimatedImpact = 0,
      impactUnit,
      tags
    } = req.body;

    const land = await Land.findById(landId);
    if (!land) {
      res.status(404).json({ success: false, message: 'Specified land parcel not found' });
      return;
    }

    const defaultUnitMap: Record<string, string> = {
      carbon: 'tCO2e',
      water: 'kL_water_recharged',
      biodiversity: 'biodiversity_credits',
      agroforestry: 'tCO2e',
      regenerative_ag: 'tCO2e'
    };

    const unit = impactUnit || defaultUnitMap[projectType] || 'tCO2e';
    const code = generateProjectCode(projectType);

    const historyEntry = {
      status: 'draft' as ProjectStatus,
      changedBy: req.user?.id as any,
      note: 'Project initiated in draft mode.',
      changedAt: new Date()
    };

    const project = await Project.create({
      code,
      name: name.trim(),
      description: description ? description.trim() : undefined,
      projectType,
      standard,
      methodology: methodology ? methodology.trim() : undefined,
      landId,
      userId: req.user?.id,
      organizationId: req.user?.organizationId || land.organizationId,
      startDate,
      endDate,
      creditingPeriodYears,
      status: 'draft',
      impactMetrics: {
        estimated: Number(estimatedImpact) || 0,
        measured: 0,
        reviewed: 0,
        verified: 0,
        unit,
        status: 'estimated',
        lastUpdatedAt: new Date()
      },
      history: [historyEntry],
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully in draft mode.',
      nextStep: 'project_questionnaire_or_submit',
      data: project
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, projectType, standard, search, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (req.user?.role !== 'admin') {
      if (req.user?.organizationId) {
        query.$or = [{ userId: req.user.id }, { organizationId: req.user.organizationId }];
      } else {
        query.userId = req.user?.id;
      }
    }

    if (status) query.status = status;
    if (projectType) query.projectType = projectType;
    if (standard) query.standard = standard;
    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { code: { $regex: String(search), $options: 'i' } }
      ];
    }

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('landId', 'landName surveyNumber village district state areaInAcres status')
        .populate('userId', 'fullName phone role')
        .populate('organizationId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Project.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      count: projects.length,
      data: projects
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('landId')
      .populate('userId', 'fullName phone village district state preferredLanguage')
      .populate('organizationId', 'name type contactPhone contactEmail')
      .populate('assignedReviewerId', 'fullName phone role')
      .populate('assignedAuditorId', 'fullName phone role');

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, projectType, standard, methodology, creditingPeriodYears, startDate, endDate, tags } = req.body;
    const updateFields: any = {};

    if (name) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (projectType) updateFields.projectType = projectType;
    if (standard) updateFields.standard = standard;
    if (methodology !== undefined) updateFields.methodology = methodology.trim();
    if (creditingPeriodYears !== undefined) updateFields.creditingPeriodYears = Number(creditingPeriodYears);
    if (startDate) updateFields.startDate = startDate;
    if (endDate) updateFields.endDate = endDate;
    if (tags) updateFields.tags = tags;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const historyEntry = {
      status: 'submitted' as ProjectStatus,
      changedBy: req.user?.id as any,
      note: 'Project submitted for administrative and technical screening.',
      changedAt: new Date()
    };

    project.status = 'submitted';
    project.clarificationReason = undefined;
    project.rejectionReason = undefined;
    project.history.push(historyEntry);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Project submitted successfully for screening.',
      nextStep: 'pending_project_screening',
      data: project
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    if (['approved', 'active', 'completed'].includes(project.status)) {
      res.status(400).json({
        success: false,
        message: `Cannot delete a project in '${project.status}' stage.`
      });
      return;
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProjectImpact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { stage, amount, unit } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    project.impactMetrics[stage as 'estimated' | 'measured' | 'reviewed' | 'verified'] = Number(amount);
    project.impactMetrics.status = stage;
    if (unit) project.impactMetrics.unit = unit;
    project.impactMetrics.lastUpdatedAt = new Date();

    await project.save();

    res.status(200).json({
      success: true,
      message: `Impact metrics updated to ${stage} stage: ${amount} ${project.impactMetrics.unit}`,
      data: project.impactMetrics
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason, question, note, reviewerId, auditorId } = req.body;

    const statusTransitions: Record<string, ProjectStatus> = {
      screen_accept: 'accepted_for_data_collection',
      move_to_mrv: 'mrv',
      move_to_tech_review: 'technical_review',
      move_to_verification: 'verification',
      approve_final: 'approved',
      activate: 'active',
      complete: 'completed',
      reject: 'rejected',
      clarify: 'clarification',
      suspend: 'suspended'
    };

    const nextStatus = statusTransitions[action];
    const updateData: any = { status: nextStatus };

    if (action === 'reject') updateData.rejectionReason = reason;
    if (action === 'clarify') updateData.clarificationReason = question;
    if (reviewerId) updateData.assignedReviewerId = reviewerId;
    if (auditorId) updateData.assignedAuditorId = auditorId;

    const historyEntry = {
      status: nextStatus,
      changedBy: req.user?.id as any,
      note: note || `Project status transitioned to ${nextStatus}`,
      changedAt: new Date()
    };

    const project = await Project.findByIdAndUpdate(
      id,
      {
        $set: updateData,
        $push: { history: historyEntry }
      },
      { new: true }
    )
      .populate('landId', 'landName surveyNumber')
      .populate('userId', 'fullName phone role');

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Project pipeline stage updated to '${nextStatus}'`,
      data: project
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectsQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status = 'submitted', projectType, standard, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (projectType) query.projectType = projectType;
    if (standard) query.standard = standard;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('landId', 'landName surveyNumber village district state areaInAcres')
        .populate('userId', 'fullName phone role')
        .populate('organizationId', 'name type')
        .populate('assignedReviewerId', 'fullName phone role')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Project.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      count: projects.length,
      data: projects
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectsStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, draft, submitted, screening, mrv, techReview, verification, approved, active, completed, rejected, carbonCount, waterCount, bioCount, impactAgg] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'draft' }),
      Project.countDocuments({ status: 'submitted' }),
      Project.countDocuments({ status: 'screening' }),
      Project.countDocuments({ status: 'mrv' }),
      Project.countDocuments({ status: 'technical_review' }),
      Project.countDocuments({ status: 'verification' }),
      Project.countDocuments({ status: 'approved' }),
      Project.countDocuments({ status: 'active' }),
      Project.countDocuments({ status: 'completed' }),
      Project.countDocuments({ status: 'rejected' }),
      Project.countDocuments({ projectType: 'carbon' }),
      Project.countDocuments({ projectType: 'water' }),
      Project.countDocuments({ projectType: 'biodiversity' }),
      Project.aggregate([
        {
          $group: {
            _id: null,
            totalEstimatedImpact: { $sum: '$impactMetrics.estimated' },
            totalMeasuredImpact: { $sum: '$impactMetrics.measured' },
            totalVerifiedImpact: { $sum: '$impactMetrics.verified' }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProjects: total,
        pipeline: {
          draft,
          submitted,
          screening,
          mrv,
          technicalReview: techReview,
          verification,
          approved,
          active,
          completed,
          rejected
        },
        typeBreakdown: {
          carbon: carbonCount,
          water: waterCount,
          biodiversity: bioCount
        },
        aggregateImpact: {
          totalEstimated: impactAgg[0]?.totalEstimatedImpact || 0,
          totalMeasured: impactAgg[0]?.totalMeasuredImpact || 0,
          totalVerified: impactAgg[0]?.totalVerifiedImpact || 0
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

