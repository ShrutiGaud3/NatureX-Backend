import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ReportSnapshot } from './model';

export const requireReportsAccess = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  const role = user?.role;
  const roles = user?.roles || [];

  const isAuthorized =
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'project_developer' ||
    role === 'finance_manager' ||
    roles.includes('admin') ||
    roles.includes('super_admin') ||
    roles.includes('project_developer') ||
    roles.includes('finance_manager');

  if (!isAuthorized) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Analytics and reporting access requires manager, developer, or administrator privileges'
    });
    return;
  }
  next();
};

export const canAccessReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid report ID' });
      return;
    }

    const report = await ReportSnapshot.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report snapshot not found' });
      return;
    }

    const isAdmin =
      user?.role === 'admin' ||
      user?.role === 'super_admin' ||
      user?.roles?.includes('admin') ||
      user?.roles?.includes('super_admin');

    const isOwner = userId && report.generatedBy.toString() === userId.toString();

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view or manage this report'
      });
      return;
    }

    (req as any).report = report;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
