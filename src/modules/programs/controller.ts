import { Request, Response } from 'express';
import { Program } from './model';

export const createProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, sponsorName, description, budgetTotal, eligibleProjectTypes } = req.body;
    const program = await Program.create({
      name,
      sponsorName,
      description,
      budgetTotal,
      eligibleProjectTypes,
      status: 'active'
    });
    res.status(201).json({ success: true, message: 'Program created successfully', data: program });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    const programs = await Program.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: programs.length, data: programs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const enrollProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, projectId } = req.body;
    const program = await Program.findByIdAndUpdate(
      programId,
      { $push: { enrolledProjects: { projectId, status: 'applied', enrolledAt: new Date() } } },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Project enrolled in program', data: program });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
