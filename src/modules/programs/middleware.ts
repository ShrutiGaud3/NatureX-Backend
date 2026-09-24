import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Program } from './model';
import { Land } from '../lands/model';
import { Project } from '../projects/model';

export const checkProgramEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { landId, projectId, enrolledAcreage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid program ID' });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ success: false, message: 'Program not found' });
      return;
    }

    if (program.status !== 'active') {
      res.status(400).json({
        success: false,
        message: `Cannot enroll in a program with status '${program.status}'. Program must be 'active'.`
      });
      return;
    }

    // Check enrollment deadline if present
    if (program.timeline.enrollmentDeadline && new Date() > new Date(program.timeline.enrollmentDeadline)) {
      res.status(400).json({
        success: false,
        message: 'Program enrollment deadline has passed'
      });
      return;
    }

    // Validate Land
    if (!mongoose.Types.ObjectId.isValid(landId)) {
      res.status(400).json({ success: false, message: 'Invalid landId' });
      return;
    }

    const land = await Land.findById(landId);
    if (!land) {
      res.status(404).json({ success: false, message: 'Land parcel not found' });
      return;
    }

    // Validate Project
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid projectId' });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Check state eligibility if allowedStates specified
    if (program.eligibilityCriteria?.allowedStates && program.eligibilityCriteria.allowedStates.length > 0) {
      const isStateAllowed = program.eligibilityCriteria.allowedStates.some(
        (s) => s.toLowerCase() === land.state?.toLowerCase()
      );
      if (!isStateAllowed) {
        res.status(400).json({
          success: false,
          message: `Land state '${land.state}' is not eligible for this program. Allowed states: ${program.eligibilityCriteria.allowedStates.join(', ')}`
        });
        return;
      }
    }

    // Check acreage eligibility
    if (program.eligibilityCriteria?.minAcreage && enrolledAcreage < program.eligibilityCriteria.minAcreage) {
      res.status(400).json({
        success: false,
        message: `Enrolled acreage (${enrolledAcreage} acres) is less than the minimum required (${program.eligibilityCriteria.minAcreage} acres)`
      });
      return;
    }

    if (program.eligibilityCriteria?.maxAcreage && enrolledAcreage > program.eligibilityCriteria.maxAcreage) {
      res.status(400).json({
        success: false,
        message: `Enrolled acreage (${enrolledAcreage} acres) exceeds the maximum allowed (${program.eligibilityCriteria.maxAcreage} acres)`
      });
      return;
    }

    // Check duplicate enrollment for the same land in this program
    const alreadyEnrolled = program.enrollments.some(
      (e) => e.landId.toString() === landId.toString() && ['applied', 'verified', 'active'].includes(e.status)
    );

    if (alreadyEnrolled) {
      res.status(400).json({
        success: false,
        message: 'This land parcel is already enrolled or applied for this program'
      });
      return;
    }

    // Attach program, land, project for downstream usage
    (req as any).program = program;
    (req as any).land = land;
    (req as any).project = project;

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkProgramManager = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid program ID' });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ success: false, message: 'Program not found' });
      return;
    }

    const isAdmin =
      user.roles?.includes('admin') ||
      user.role === 'admin' ||
      user.roles?.includes('super_admin') ||
      user.role === 'super_admin';

    const isOwner =
      program.createdBy && userId && program.createdBy.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to manage this program'
      });
      return;
    }

    (req as any).program = program;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
