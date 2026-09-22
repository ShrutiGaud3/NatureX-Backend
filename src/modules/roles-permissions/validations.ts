import { Request, Response, NextFunction } from 'express';

export const validateCreateRole = (req: Request, res: Response, next: NextFunction): void => {
  const { name, key, permissions } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ success: false, message: 'Role name is required.' });
    return;
  }

  if (!key || typeof key !== 'string' || !/^[a-z0-9_]+$/.test(key.trim().toLowerCase())) {
    res.status(400).json({
      success: false,
      message: 'Role key is required and must contain only lowercase letters, numbers, and underscores (e.g. project_manager).'
    });
    return;
  }

  if (permissions && !Array.isArray(permissions)) {
    res.status(400).json({ success: false, message: 'Permissions must be an array of strings.' });
    return;
  }

  next();
};

export const validateUpdateRole = (req: Request, res: Response, next: NextFunction): void => {
  const { name, permissions } = req.body;

  if (name && (typeof name !== 'string' || name.trim().length === 0)) {
    res.status(400).json({ success: false, message: 'Role name must be a valid string.' });
    return;
  }

  if (permissions && !Array.isArray(permissions)) {
    res.status(400).json({ success: false, message: 'Permissions must be an array of strings.' });
    return;
  }

  next();
};

export const validateAssignUserRole = (req: Request, res: Response, next: NextFunction): void => {
  const { userId, role } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, message: 'userId is required.' });
    return;
  }

  if (!role || typeof role !== 'string') {
    res.status(400).json({ success: false, message: 'Valid role string is required.' });
    return;
  }

  next();
};
