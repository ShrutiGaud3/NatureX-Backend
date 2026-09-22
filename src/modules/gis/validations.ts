import { Request, Response, NextFunction } from 'express';

const VALID_MAPPING_METHODS = ['gps_walk', 'manual_pin', 'kml_import', 'shapefile_import'];

export const validatePolygonPayload = (req: Request, res: Response, next: NextFunction): void => {
  const { landId, coordinates, mappingMethod } = req.body;

  if (!landId) {
    res.status(400).json({ success: false, message: 'landId is required' });
    return;
  }

  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 4) {
    res.status(400).json({
      success: false,
      message: 'Polygon must have at least 4 coordinate points with the first and last point identical (closed ring).'
    });
    return;
  }

  for (let i = 0; i < coordinates.length; i++) {
    const pt = coordinates[i];
    if (!Array.isArray(pt) || pt.length !== 2 || typeof pt[0] !== 'number' || typeof pt[1] !== 'number') {
      res.status(400).json({
        success: false,
        message: `Invalid coordinate point at index ${i}. Each point must be [longitude, latitude].`
      });
      return;
    }
    const [lng, lat] = pt;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      res.status(400).json({
        success: false,
        message: `Coordinate out of bounds at index ${i}: [${lng}, ${lat}]. Longitude must be between -180 and 180, Latitude between -90 and 90.`
      });
      return;
    }
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    res.status(400).json({
      success: false,
      message: 'Polygon must be a closed loop. The first coordinate and last coordinate must be identical.'
    });
    return;
  }

  if (mappingMethod && !VALID_MAPPING_METHODS.includes(mappingMethod)) {
    res.status(400).json({
      success: false,
      message: `mappingMethod must be one of: ${VALID_MAPPING_METHODS.join(', ')}`
    });
    return;
  }

  next();
};

export const validateCheckOverlap = (req: Request, res: Response, next: NextFunction): void => {
  const { coordinates } = req.body;

  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 4) {
    res.status(400).json({
      success: false,
      message: 'Coordinates array of at least 4 points (closed ring) is required to check overlap.'
    });
    return;
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    res.status(400).json({
      success: false,
      message: 'Polygon must be closed: first and last coordinates must match.'
    });
    return;
  }

  next();
};

