import { Router } from 'express';
import {
  saveLandPolygon,
  getPolygonByLandId,
  checkBoundaryOverlap,
  getAllPolygonsGeoJson,
  getGisStats
} from './controller';
import { validatePolygonPayload, validateCheckOverlap } from './validations';
import { requireLandAccessForGis } from './middleware';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';

const router = Router();

// Mapping Endpoints
router.post('/save', authenticate, validatePolygonPayload, requireLandAccessForGis, saveLandPolygon);
router.post('/check-overlap', authenticate, validateCheckOverlap, checkBoundaryOverlap);

// Query & Export Endpoints
router.get('/stats', authenticate, requireRole(['admin']), getGisStats);
router.get('/geojson', authenticate, getAllPolygonsGeoJson);
router.get('/:landId', authenticate, requireLandAccessForGis, getPolygonByLandId);

export default router;

