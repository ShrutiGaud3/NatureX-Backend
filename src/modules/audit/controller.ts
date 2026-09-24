import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuditLog } from './model';

const generateLogCode = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `AUD-${year}-${rand}`;
};

// 1. Record Single Audit Log
export const createAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const userRole = user?.role || 'system';

    const {
      action,
      resourceType,
      resourceId,
      resourceCode,
      oldValues,
      newValues,
      oldStatus,
      newStatus,
      reason,
      severity = 'info',
      metadata
    } = req.body;

    const logCode = generateLogCode();

    const log = await AuditLog.create({
      logCode,
      actorId: new mongoose.Types.ObjectId(userId),
      actorRole: userRole,
      action,
      resourceType,
      resourceId,
      resourceCode,
      oldValues,
      newValues,
      oldStatus,
      newStatus,
      reason,
      severity,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Audit log entry recorded successfully',
      data: log
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Batch Record Audit Logs
export const batchCreateAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const userRole = user?.role || 'system';
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      res.status(400).json({ success: false, message: 'logs must be a non-empty array' });
      return;
    }

    const docs = logs.map((l: any) => ({
      logCode: generateLogCode(),
      actorId: l.actorId ? new mongoose.Types.ObjectId(l.actorId) : new mongoose.Types.ObjectId(userId),
      actorRole: l.actorRole || userRole,
      action: l.action,
      resourceType: l.resourceType,
      resourceId: l.resourceId,
      resourceCode: l.resourceCode,
      oldValues: l.oldValues,
      newValues: l.newValues,
      oldStatus: l.oldStatus,
      newStatus: l.newStatus,
      reason: l.reason,
      severity: l.severity || 'info',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      metadata: l.metadata
    }));

    const result = await AuditLog.insertMany(docs);

    res.status(201).json({
      success: true,
      message: `Successfully recorded ${result.length} audit log entries`,
      count: result.length,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get All Audit Logs (Filtered & Paginated)
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      resourceType,
      resourceId,
      actorId,
      action,
      severity,
      startDate,
      endDate,
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;
    if (actorId) query.actorId = new mongoose.Types.ObjectId(actorId as string);
    if (action) query.action = { $regex: new RegExp(action as string, 'i') };
    if (severity) query.severity = severity;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    if (search) {
      query.$or = [
        { logCode: { $regex: search as string, $options: 'i' } },
        { action: { $regex: search as string, $options: 'i' } },
        { resourceCode: { $regex: search as string, $options: 'i' } },
        { reason: { $regex: search as string, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'fullName phone email role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: logs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Audit Trail Metrics & KPI Analytics
export const getAuditStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      last24hLogs,
      byResourceType,
      bySeverity,
      topActions
    ] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      AuditLog.aggregate([
        { $group: { _id: '$resourceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalLogs,
        last24hLogs,
        byResourceType,
        bySeverity,
        topActions
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Resource-Specific History & Timeline
export const getResourceTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resourceType, resourceId } = req.params;

    const timeline = await AuditLog.find({ resourceType, resourceId })
      .populate('actorId', 'fullName phone email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      resourceType,
      resourceId,
      count: timeline.length,
      data: timeline
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Single Audit Log Details by ID
export const getAuditLogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid audit log ID' });
      return;
    }

    const log = await AuditLog.findById(id).populate('actorId', 'fullName phone email role');

    if (!log) {
      res.status(404).json({ success: false, message: 'Audit log entry not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Export Audit Logs (CSV / JSON)
export const exportAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resourceType, severity, format = 'json' } = req.query;
    const query: any = {};
    if (resourceType) query.resourceType = resourceType;
    if (severity) query.severity = severity;

    const logs = await AuditLog.find(query)
      .populate('actorId', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    if (format === 'csv') {
      if (logs.length === 0) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
        res.status(200).send('No data available');
        return;
      }

      const headers = 'LogCode,Action,ResourceType,ResourceId,Severity,Actor,OldStatus,NewStatus,Reason,CreatedAt\n';
      const rows = logs.map((l: any) =>
        `"${l.logCode}","${l.action}","${l.resourceType}","${l.resourceId}","${l.severity}","${l.actorId?.fullName || l.actorRole}","${l.oldStatus || ''}","${l.newStatus || ''}","${l.reason || ''}","${l.createdAt}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
      res.status(200).send(headers + rows);
      return;
    }

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
