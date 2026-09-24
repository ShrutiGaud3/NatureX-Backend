import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketStats,
  getMyTickets,
  getTicketById,
  updateTicket,
  replyTicket,
  assignTicket,
  resolveTicket,
  rateTicket,
  deleteTicket
} from './controller';
import {
  validateCreateTicket,
  validateReplyTicket,
  validateResolveTicket,
  validateRateTicket,
  validateAssignTicket
} from './validations';
import { authenticate } from '../auth/middleware';
import { requireRole } from '../roles-permissions/middleware';
import {
  requireSupportStaff,
  canAccessTicket
} from './middleware';

const router = Router();

// Stats & My Tickets (must precede /:id)
router.get('/stats', authenticate, requireSupportStaff, getTicketStats);
router.get('/my-tickets', authenticate, getMyTickets);
router.get('/tickets/stats', authenticate, requireSupportStaff, getTicketStats);
router.get('/tickets/my-tickets', authenticate, getMyTickets);

// List & Create Tickets
router.post('/tickets', authenticate, validateCreateTicket, createTicket);
router.post('/', authenticate, validateCreateTicket, createTicket);

router.get('/tickets', authenticate, requireSupportStaff, getTickets);
router.get('/', authenticate, requireSupportStaff, getTickets);

// Single Ticket Details & Updates
router.get('/tickets/:id', authenticate, canAccessTicket, getTicketById);
router.get('/:id', authenticate, canAccessTicket, getTicketById);

router.put('/tickets/:id', authenticate, canAccessTicket, updateTicket);
router.put('/:id', authenticate, canAccessTicket, updateTicket);

router.delete('/tickets/:id', authenticate, requireRole(['admin', 'super_admin']), deleteTicket);
router.delete('/:id', authenticate, requireRole(['admin', 'super_admin']), deleteTicket);

// Interactive actions: Reply, Assign, Resolve, Rate
router.post('/tickets/:id/reply', authenticate, canAccessTicket, validateReplyTicket, replyTicket);
router.post('/:id/reply', authenticate, canAccessTicket, validateReplyTicket, replyTicket);

router.patch('/tickets/:id/assign', authenticate, requireSupportStaff, validateAssignTicket, assignTicket);
router.patch('/:id/assign', authenticate, requireSupportStaff, validateAssignTicket, assignTicket);

router.patch('/tickets/:id/resolve', authenticate, requireSupportStaff, validateResolveTicket, resolveTicket);
router.patch('/:id/resolve', authenticate, requireSupportStaff, validateResolveTicket, resolveTicket);

router.patch('/tickets/:id/rate', authenticate, canAccessTicket, validateRateTicket, rateTicket);
router.patch('/:id/rate', authenticate, canAccessTicket, validateRateTicket, rateTicket);

export default router;
