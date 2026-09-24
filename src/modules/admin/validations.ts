import { Request, Response, NextFunction } from 'express';

const VALID_CATEGORIES = [
  'system',
  'feature_flags',
  'payout_rules',
  'mrv_parameters',
  'maps_gis',
  'notifications',
  'storage_s3',
  'compliance'
];

export const validateAdminConfig = (req: Request, res: Response, next: NextFunction): void => {
  const { configKey, configValue, category } = req.body;

  if (!configKey || typeof configKey !== 'string' || !configKey.trim()) {
    res.status(400).json({ success: false, message: 'configKey is required and must be a non-empty string' });
    return;
  }

  if (configValue === undefined) {
    res.status(400).json({ success: false, message: 'configValue is required' });
    return;
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({
      success: false,
      message: `category must be one of: ${VALID_CATEGORIES.join(', ')}`
    });
    return;
  }

  next();
};

export const validateToggleMaintenance = (req: Request, res: Response, next: NextFunction): void => {
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    res.status(400).json({
      success: false,
      message: 'enabled field is required and must be a boolean (true/false)'
    });
    return;
  }

  next();
};
