import { Response } from 'express';
import { SupportTicket } from './model';
import { AuthRequest } from '../auth/middleware';

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, category, subject, message, priority } = req.body;
    const ticket = await SupportTicket.create({
      userId: req.user?.id,
      projectId,
      category,
      subject,
      message,
      priority
    });
    res.status(201).json({ success: true, message: 'Support ticket submitted', data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = req.user?.role === 'admin' ? {} : { userId: req.user?.id };
    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const replyTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          responses: {
            senderId: req.user?.id,
            message,
            sentAt: new Date()
          }
        },
        $set: { status: 'in_progress' }
      },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Reply sent', data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
