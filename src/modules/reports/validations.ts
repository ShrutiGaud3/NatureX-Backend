import { Request, Response, NextFunction } from 'express';

const VALID_REPORT_TYPES = [
  'executive_summary',
  'project_funnel',
  'land_registry',
  'financial_payout',
  'field_ops',
  'carbon_impact',
  'mrv_audit'
];

const VALID_FORMATS = ['json', 'csv', 'pdf'];

export const validateGenerateReport = (req: Request, res: Response, next: NextFunction): void => {
  const { reportType, title, format } = req.body;

  if (!reportType || !VALID_REPORT_TYPES.includes(reportType)) {
    res.status(400).json({
      success: false,
      message: `reportType is required and must be one of: ${VALID_REPORT_TYPES.join(', ')}`
    });
    return;
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ success: false, message: 'Report title is required' });
    return;
  }

  if (format && !VALID_FORMATS.includes(format)) {
    res.status(400).json({
      success: false,
      message: `format must be one of: ${VALID_FORMATS.join(', ')}`
    });
    return;
  }

  next();
};

export const validateExportReport = (req: Request, res: Response, next: NextFunction): void => {
  const { format } = req.query;

  if (format && !VALID_FORMATS.includes(format as string)) {
    res.status(400).json({
      success: false,
      message: `format must be one of: ${VALID_FORMATS.join(', ')}`
    });
    return;
  }

  next();
};
