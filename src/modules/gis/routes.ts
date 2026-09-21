import { Router } from 'express';
import { saveLandPolygon, getPolygonByLandId } from './controller';
import { validatePolygonPayload } from './validations';
import { validateGisBoundary } from './middleware';
import { authenticate } from '../auth/middleware';

const router = Router();

router.post('/save', authenticate, validatePolygonPayload, validateGisBoundary, saveLandPolygon);
router.get('/:landId', authenticate, getPolygonByLandId);

export default router;
