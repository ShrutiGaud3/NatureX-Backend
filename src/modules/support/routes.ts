import { Router } from 'express';
import { createTicket, getMyTickets, replyTicket } from './controller';
import { validateCreateTicket, validateReplyTicket } from './validations';
import { authenticate } from '../auth/middleware';
import { checkTicketAccess } from './middleware';

const router = Router();

router.post('/', authenticate, checkTicketAccess, validateCreateTicket, createTicket);
router.get('/', authenticate, checkTicketAccess, getMyTickets);
router.post('/:id/reply', authenticate, checkTicketAccess, validateReplyTicket, replyTicket);

export default router;
