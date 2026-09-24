import { Request, Response, NextFunction } from 'express';

export const requireAuditAccess = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  const role = user?.role;
  const roles = user?.roles || [];

  const isAuthorized =
    role === 'admin' ||
    role === 'super_admin' ||
    role === 'compliance_officer' ||
    role === 'auditor' ||
    roles.includes('admin') ||
    roles.includes('super_admin') ||
    roles.includes('compliance_officer') ||
    roles.includes('auditor');

  if (!isAuthorized) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Viewing and managing immutable audit logs requires administrator or compliance auditor privileges'
    });
    return;
  }
  next();
};
