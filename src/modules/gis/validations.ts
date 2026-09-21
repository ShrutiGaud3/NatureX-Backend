import { Request, Response, NextFunction } from 'express';

export const validatePolygonPayload = (req: Request, res: Response, next: NextFunction): void => {
  const { landId, coordinates } = req.body;
  if (!landId) {
    res.status(400).json({ success: false, message: 'landId is required' });
    return;
  }
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 4) {
    res.status(400).json({
      success: false,
      message: 'Polygon must have at least 4 coordinates with the first and last point identical (closed ring).'
    });
    return;
  }
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    res.status(400).json({ success: false, message: 'First and last coordinates of polygon must match to close polygon' });
    return;
  }
  next();
};
