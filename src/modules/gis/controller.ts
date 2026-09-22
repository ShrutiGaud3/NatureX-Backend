import { Response } from 'express';
import { LandPolygon } from './model';
import { Land } from '../lands/model';
import { AuthRequest } from '../auth/middleware';

// Earth radius in meters
const EARTH_RADIUS_METERS = 6378137;

// Spherical polygon area calculation in square meters (standard geodesy approximation)
const calculatePolygonArea = (coords: number[][]): number => {
  if (coords.length < 4) return 0;
  let total = 0;
  const rad = Math.PI / 180;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const x1 = p1[0] * rad;
    const y1 = p1[1] * rad;
    const x2 = p2[0] * rad;
    const y2 = p2[1] * rad;
    total += (x2 - x1) * (2 + Math.sin(y1) + Math.sin(y2));
  }
  const area = Math.abs((total * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2.0);
  return Math.round(area * 100) / 100;
};

// Calculate perimeter distance along polygon vertices using Haversine formula
const calculatePerimeter = (coords: number[][]): number => {
  if (coords.length < 2) return 0;
  let perimeter = 0;
  const rad = Math.PI / 180;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];

    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    perimeter += EARTH_RADIUS_METERS * c;
  }

  return Math.round(perimeter * 100) / 100;
};

// Calculate arithmetic centroid and bounding box of coordinates
const calculateCentroidAndBbox = (coords: number[][]) => {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  let sumLng = 0, sumLat = 0;
  const pointCount = coords.length - 1; // Exclude duplicate closing point

  for (let i = 0; i < pointCount; i++) {
    const [lng, lat] = coords[i];
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    sumLng += lng;
    sumLat += lat;
  }

  const centroid = [
    parseFloat((sumLng / pointCount).toFixed(6)),
    parseFloat((sumLat / pointCount).toFixed(6))
  ];
  const bbox = [minLng, minLat, maxLng, maxLat];

  return { centroid, bbox };
};

export const saveLandPolygon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { landId, coordinates, mappingMethod = 'manual_pin', gpsAccuracyMeters } = req.body;

    const land = await Land.findById(landId);
    if (!land) {
      res.status(404).json({ success: false, message: 'Parent land record not found' });
      return;
    }

    const areaSqM = calculatePolygonArea(coordinates);
    const acres = parseFloat((areaSqM / 4046.86).toFixed(4));
    const hectares = parseFloat((acres * 0.404686).toFixed(4));
    const perimeterMeters = calculatePerimeter(coordinates);
    const { centroid, bbox } = calculateCentroidAndBbox(coordinates);

    // Spatial overlap detection with other registered lands using MongoDB 2dsphere $geoIntersects
    const overlappingPolygons = await LandPolygon.find({
      landId: { $ne: landId },
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          }
        }
      }
    }).populate('landId', 'landName surveyNumber village district');

    const hasOverlap = overlappingPolygons.length > 0;
    const overlappingLands = overlappingPolygons.map((p: any) => ({
      landId: p.landId?._id || p.landId,
      landName: p.landId?.landName,
      surveyNumber: p.landId?.surveyNumber
    }));

    const polygon = await LandPolygon.findOneAndUpdate(
      { landId },
      {
        $set: {
          userId: req.user?.id,
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          },
          calculatedAreaSqM: areaSqM,
          calculatedAcres: acres,
          calculatedHectares: hectares,
          perimeterMeters,
          centroid: {
            type: 'Point',
            coordinates: centroid
          },
          bbox,
          overlapStatus: hasOverlap ? 'overlap_detected' : 'clean',
          overlappingLands,
          mappingMethod,
          gpsAccuracyMeters
        },
        $inc: { version: 1 }
      },
      { new: true, upsert: true }
    );

    // Sync calculated metrics & conflict flags to the parent Land record
    await Land.findByIdAndUpdate(landId, {
      $set: {
        calculatedAreaSqM: areaSqM,
        areaInAcres: acres,
        areaInHectares: hectares,
        hasConflict: hasOverlap,
        status: hasOverlap ? 'conflict' : land.status === 'draft' ? 'draft' : land.status,
        conflictNotes: hasOverlap ? `Overlaps detected with ${overlappingPolygons.length} existing parcel(s).` : undefined
      }
    });

    res.status(200).json({
      success: true,
      message: hasOverlap
        ? 'Boundary mapped with OVERLAP WARNING. Boundary conflict flagged.'
        : 'Boundary polygon saved and verified clean without spatial overlaps.',
      data: {
        polygonId: polygon._id,
        landId,
        areaSqM,
        acres,
        hectares,
        perimeterMeters,
        centroid,
        bbox,
        overlapStatus: polygon.overlapStatus,
        hasOverlap,
        overlappingLandsCount: overlappingLands.length,
        overlappingLands
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkBoundaryOverlap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { coordinates, excludeLandId } = req.body;

    const areaSqM = calculatePolygonArea(coordinates);
    const acres = parseFloat((areaSqM / 4046.86).toFixed(4));
    const perimeterMeters = calculatePerimeter(coordinates);
    const { centroid, bbox } = calculateCentroidAndBbox(coordinates);

    const query: any = {
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          }
        }
      }
    };

    if (excludeLandId) {
      query.landId = { $ne: excludeLandId };
    }

    const overlappingPolygons = await LandPolygon.find(query).populate('landId', 'landName surveyNumber village district');
    const hasOverlap = overlappingPolygons.length > 0;

    res.status(200).json({
      success: true,
      hasOverlap,
      overlapCount: overlappingPolygons.length,
      metrics: {
        areaSqM,
        acres,
        perimeterMeters,
        centroid,
        bbox
      },
      overlappingLands: overlappingPolygons.map((p: any) => ({
        landId: p.landId?._id || p.landId,
        landName: p.landId?.landName,
        surveyNumber: p.landId?.surveyNumber,
        village: p.landId?.village,
        district: p.landId?.district
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPolygonByLandId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const polygon = await LandPolygon.findOne({ landId: req.params.landId }).populate('landId', 'landName surveyNumber ownershipType status');
    if (!polygon) {
      res.status(404).json({
        success: false,
        message: 'No boundary polygon mapped for this land parcel.',
        nextStep: 'map_gis_boundary'
      });
      return;
    }
    res.status(200).json({ success: true, data: polygon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllPolygonsGeoJson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const polygons = await LandPolygon.find().populate('landId', 'landName surveyNumber status village district');

    const features = polygons.map((poly: any) => ({
      type: 'Feature',
      geometry: poly.geometry,
      properties: {
        polygonId: poly._id,
        landId: poly.landId?._id,
        landName: poly.landId?.landName,
        surveyNumber: poly.landId?.surveyNumber,
        status: poly.landId?.status,
        village: poly.landId?.village,
        district: poly.landId?.district,
        acres: poly.calculatedAcres,
        hectares: poly.calculatedHectares,
        areaSqM: poly.calculatedAreaSqM,
        overlapStatus: poly.overlapStatus,
        centroid: poly.centroid?.coordinates
      }
    }));

    res.status(200).json({
      type: 'FeatureCollection',
      count: features.length,
      features
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGisStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalMapped, cleanCount, overlapCount, acreageAgg] = await Promise.all([
      LandPolygon.countDocuments(),
      LandPolygon.countDocuments({ overlapStatus: 'clean' }),
      LandPolygon.countDocuments({ overlapStatus: 'overlap_detected' }),
      LandPolygon.aggregate([
        {
          $group: {
            _id: null,
            totalAcres: { $sum: '$calculatedAcres' },
            totalHectares: { $sum: '$calculatedHectares' },
            totalSqM: { $sum: '$calculatedAreaSqM' }
          }
        }
      ])
    ]);

    const totalAcres = acreageAgg[0]?.totalAcres || 0;
    const totalHectares = acreageAgg[0]?.totalHectares || 0;

    res.status(200).json({
      success: true,
      data: {
        totalMappedParcels: totalMapped,
        cleanParcels: cleanCount,
        overlapConflicts: overlapCount,
        totalMappedAcres: parseFloat(totalAcres.toFixed(2)),
        totalMappedHectares: parseFloat(totalHectares.toFixed(2))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

