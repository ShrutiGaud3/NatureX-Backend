import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { BenefitLedger } from './model';

export const requireFinanceAccess = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  const role = user?.role;
  const roles = user?.roles || [];

  const isAuthorized =
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'finance_manager' ||
    role === 'project_developer' ||
    roles.includes('admin') ||
    roles.includes('super_admin') ||
    roles.includes('finance_manager') ||
    roles.includes('project_developer');

  if (!isAuthorized) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Only finance, project developer, or admin accounts can perform this action'
    });
    return;
  }
  next();
};

export const requireAdminOrFinance = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  const role = user?.role;
  const roles = user?.roles || [];

  const isAuthorized =
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'finance_manager' ||
    roles.includes('admin') ||
    roles.includes('super_admin') ||
    roles.includes('finance_manager');

  if (!isAuthorized) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Payout approval and reconciliation requires finance manager or admin authorization'
    });
    return;
  }
  next();
};

export const canAccessBenefit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid benefit ID' });
      return;
    }

    const benefit = await BenefitLedger.findById(id);
    if (!benefit) {
      res.status(404).json({ success: false, message: 'Benefit record not found' });
      return;
    }

    const isAdmin =
      user?.role === 'admin' ||
      user?.role === 'super_admin' ||
      user?.roles?.includes('admin') ||
      user?.roles?.includes('super_admin') ||
      user?.role === 'project_developer';

    const isBeneficiary = userId && benefit.userId.toString() === userId.toString();

    if (!isAdmin && !isBeneficiary) {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this benefit record'
      });
      return;
    }

    (req as any).benefit = benefit;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
