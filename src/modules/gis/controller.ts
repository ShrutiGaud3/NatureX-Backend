import { Request, Response } from 'express';
import { LandPolygon } from './model';
import { Land } from '../lands/model';

// Spherical polygon area calculation in square meters (standard geodesy approximation)
const calculatePolygonArea = (coords: number[][]): number => {
  const radius = 6378137; // Earth radius in meters
  if (coords.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const rad = Math.PI / 180;
    const x1 = p1[0] * rad;
    const y1 = p1[1] * rad;
    const x2 = p2[0] * rad;
    const y2 = p2[1] * rad;
    total += (x2 - x1) * (2 + Math.sin(y1) + Math.sin(y2));
  }
  const area = Math.abs((total * radius * radius) / 2.0);
  return Math.round(area * 100) / 100;
};

export const saveLandPolygon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { landId, coordinates } = req.body;
    const areaSqM = calculatePolygonArea(coordinates);
    const acres = Math.round((areaSqM / 4046.86) * 100) / 100;

    // Check for overlaps with other approved lands
    const overlaps = await LandPolygon.find({
      landId: { $ne: landId },
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          }
        }
      }
    });

    const hasOverlap = overlaps.length > 0;

    const polygon = await LandPolygon.findOneAndUpdate(
      { landId },
      {
        $set: {
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          },
          calculatedAreaSqM: areaSqM,
          calculatedAcres: acres,
          centroid: {
            type: 'Point',
            coordinates: coordinates[0]
          }
        },
        $inc: { version: 1 }
      },
      { new: true, upsert: true }
    );

    // Update land calculated area
    await Land.findByIdAndUpdate(landId, {
      $set: {
        calculatedAreaSqM: areaSqM,
        areaInAcres: acres,
        areaInHectares: Math.round(acres * 0.404686 * 100) / 100,
        hasConflict: hasOverlap,
        status: hasOverlap ? 'conflict' : 'draft'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Polygon saved and area calculated successfully',
      data: {
        polygon,
        hasOverlap,
        overlappingLandCount: overlaps.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPolygonByLandId = async (req: Request, res: Response): Promise<void> => {
  try {
    const polygon = await LandPolygon.findOne({ landId: req.params.landId });
    if (!polygon) {
      res.status(404).json({ success: false, message: 'Polygon not found for this land' });
      return;
    }
    res.status(200).json({ success: true, data: polygon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
