import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SupportTicket, ITicketResponse } from './model';

const generateTicketCode = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `TCK-${year}-${rand}`;
};

const generateResponseCode = (): string => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RSP-${Date.now().toString(36).toUpperCase()}-${rand}`;
};

// 1. Create Support Ticket
export const createTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const {
      projectId,
      landId,
      category,
      subject,
      description,
      priority = 'medium',
      attachments
    } = req.body;

    const ticketCode = generateTicketCode();

    const ticket = await SupportTicket.create({
      ticketCode,
      userId: new mongoose.Types.ObjectId(userId),
      projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
      landId: landId ? new mongoose.Types.ObjectId(landId) : undefined,
      category,
      subject,
      description,
      priority,
      status: 'open',
      attachments: attachments || [],
      responses: []
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: ticket
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Tickets (Filtered & Paginated)
export const getTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      category,
      priority,
      assignedTo,
      userId,
      projectId,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    if (userId) query.userId = userId;
    if (projectId) query.projectId = projectId;

    if (search) {
      query.$or = [
        { ticketCode: { $regex: search as string, $options: 'i' } },
        { subject: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('userId', 'fullName phone email role')
        .populate('assignedTo', 'fullName email role')
        .populate('projectId', 'name title projectCode')
        .populate('landId', 'landName state district')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      SupportTicket.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: tickets
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Support KPI Metrics & Analytics Dashboard
export const getTicketStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [statusStats, categoryStats, ratingStats] = await Promise.all([
      SupportTicket.aggregate([
        {
          $group: {
            _id: null,
            totalTickets: { $sum: 1 },
            openTickets: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
            inProgressTickets: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            waitingTickets: { $sum: { $cond: [{ $eq: ['$status', 'waiting_on_farmer'] }, 1, 0] } },
            resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            closedTickets: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
          }
        }
      ]),
      SupportTicket.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      SupportTicket.aggregate([
        { $match: { 'resolutionDetails.satisfactionRating': { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$resolutionDetails.satisfactionRating' },
            ratedCount: { $sum: 1 }
          }
        }
      ])
    ]);

    const summary = statusStats[0] || {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      waitingTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0
    };

    const ratingInfo = ratingStats[0] || { avgRating: 5.0, ratedCount: 0 };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          ...summary,
          averageSatisfactionRating: parseFloat((ratingInfo.avgRating || 5.0).toFixed(2)),
          totalRatedTickets: ratingInfo.ratedCount
        },
        byCategory: categoryStats
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Current User's Personal Tickets
export const getMyTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const { status, category } = req.query;
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) query.status = status;
    if (category) query.category = category;

    const tickets = await SupportTicket.find(query)
      .populate('projectId', 'name title projectCode')
      .populate('landId', 'landName state district')
      .populate('assignedTo', 'fullName email')
      .sort({ createdAt: -1 });

    const openCount = tickets.filter((t) => ['open', 'in_progress', 'waiting_on_farmer'].includes(t.status)).length;
    const resolvedCount = tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length;

    res.status(200).json({
      success: true,
      summary: { total: tickets.length, open: openCount, resolved: resolvedCount },
      count: tickets.length,
      data: tickets
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Single Ticket Details by ID (Thread & Attachments)
export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const ticket = await SupportTicket.findById(id)
      .populate('userId', 'fullName phone email role')
      .populate('assignedTo', 'fullName phone email role')
      .populate('projectId', 'name title projectCode projectType standard')
      .populate('landId', 'landName state district areaInAcres')
      .populate('responses.senderId', 'fullName email role phone')
      .populate('resolutionDetails.resolvedBy', 'fullName email');

    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Update Ticket Details
export const updateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { category, subject, description, priority, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' });
      return;
    }

    if (category) ticket.category = category;
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (priority) ticket.priority = priority;
    if (status) ticket.status = status;

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: ticket
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Reply in Ticket Discussion Thread
export const replyTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const { message, attachments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' });
      return;
    }

    const isStaff =
      user?.role === 'admin' ||
      user?.role === 'super_admin' ||
      user?.role === 'support_agent' ||
      user?.roles?.includes('admin') ||
      user?.roles?.includes('super_admin');

    const responseCode = generateResponseCode();

    const newResponse: ITicketResponse = {
      responseCode,
      senderId: new mongoose.Types.ObjectId(userId),
      senderRole: isStaff ? 'support_staff' : user?.role || 'farmer',
      message,
      attachments: attachments || [],
      sentAt: new Date()
    };

    ticket.responses.push(newResponse);

    // Update status based on respondent
    if (isStaff) {
      ticket.status = 'waiting_on_farmer';
    } else {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Reply posted to ticket thread successfully',
      data: {
        ticketId: ticket._id,
        ticketCode: ticket.ticketCode,
        status: ticket.status,
        response: newResponse
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Assign Ticket to Support Staff
export const assignTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' });
      return;
    }

    ticket.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    if (ticket.status === 'open') ticket.status = 'in_progress';

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Support ticket assigned successfully',
      data: ticket
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Resolve Support Ticket
export const resolveTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const { resolutionSummary } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' });
      return;
    }

    ticket.status = 'resolved';
    ticket.resolutionDetails = {
      ...ticket.resolutionDetails,
      resolvedAt: new Date(),
      resolvedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      resolutionSummary
    };

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Support ticket resolved successfully',
      data: ticket
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Rate Ticket Resolution (Farmer / Beneficiary Feedback)
export const rateTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const { satisfactionRating, feedbackNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' });
      return;
    }

    if (userId && ticket.userId.toString() !== userId.toString()) {
      res.status(403).json({
        success: false,
        message: 'Only the beneficiary who created this ticket can rate its resolution'
      });
      return;
    }

    ticket.resolutionDetails = {
      ...ticket.resolutionDetails,
      satisfactionRating,
      feedbackNotes
    };
    ticket.status = 'closed';

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Thank you for your feedback! Ticket closed.',
      data: ticket
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Delete Ticket
export const deleteTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid ticket ID' });
      return;
    }

    const ticket = await SupportTicket.findByIdAndDelete(id);
    if (!ticket) {
      res.status(404).json({ success: false, message: 'Support ticket not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Support ticket deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
