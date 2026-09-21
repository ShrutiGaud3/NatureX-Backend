import { Response } from 'express';
import { Project } from './model';
import { AuthRequest } from '../auth/middleware';

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, projectType, landId, startDate } = req.body;
    const project = await Project.create({
      name,
      description,
      projectType,
      landId,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      startDate,
      status: 'draft'
    });

    res.status(201).json({ success: true, message: 'Project created in draft mode', data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = req.user?.role === 'admin' ? {} : { userId: req.user?.id };
    const projects = await Project.find(query).populate('landId', 'landName village district state areaInAcres').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('landId')
      .populate('userId', 'fullName phone village');
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'submitted' } },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Project submitted for screening', data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason, question } = req.body;

    const statusTransitions: Record<string, string> = {
      approve_screening: 'accepted_for_data_collection',
      approve_mrv: 'technical_review',
      approve_final: 'approved',
      reject: 'rejected',
      clarify: 'clarification'
    };

    const nextStatus = statusTransitions[action] || action;
    const updateData: any = { status: nextStatus };
    if (action === 'reject') updateData.rejectionReason = reason;
    if (action === 'clarify') updateData.clarificationReason = question;

    const project = await Project.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    res.status(200).json({ success: true, message: `Project status updated to ${nextStatus}`, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
