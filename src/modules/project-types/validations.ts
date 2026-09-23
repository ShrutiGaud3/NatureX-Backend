import { Request, Response, NextFunction } from 'express';

const VALID_CATEGORIES = ['climate', 'water', 'nature', 'agriculture', 'forestry'];
const KEY_SLUG_REGEX = /^[a-z0-9_]+$/;

export const validateCreateProjectType = (req: Request, res: Response, next: NextFunction): void => {
  const { key, name, category, impactUnit } = req.body;

  if (!key || typeof key !== 'string' || !KEY_SLUG_REGEX.test(key.trim().toLowerCase())) {
    res.status(400).json({
      success: false,
      message: 'Key is required and must be a lowercase slug using letters, numbers, and underscores (e.g., agroforestry_carbon).'
    });
    return;
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ success: false, message: 'ProjectType name is required.' });
    return;
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({
      success: false,
      message: `category must be one of: ${VALID_CATEGORIES.join(', ')}`
    });
    return;
  }

  if (!impactUnit || typeof impactUnit !== 'string' || impactUnit.trim().length === 0) {
    res.status(400).json({ success: false, message: 'impactUnit is required (e.g. tCO2e, kL_water_recharged).' });
    return;
  }

  next();
};

export const validateUpdateProjectType = (req: Request, res: Response, next: NextFunction): void => {
  const { category, key } = req.body;

  if (key && !KEY_SLUG_REGEX.test(key.trim().toLowerCase())) {
    res.status(400).json({
      success: false,
      message: 'Key must be a valid lowercase alphanumeric slug with underscores.'
    });
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

export const validateToggleStatus = (req: Request, res: Response, next: NextFunction): void => {
  const { isActive } = req.body;
  if (isActive === undefined || typeof isActive !== 'boolean') {
    res.status(400).json({ success: false, message: 'isActive boolean flag is required' });
    return;
  }
  next();
};

