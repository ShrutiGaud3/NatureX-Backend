import { Request, Response } from 'express';
import { AuditLog } from './model';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resourceType, resourceId, actorId } = req.query;
    const query: any = {};
    if (resourceType) query.resourceType = resourceType;
    if (resourceId) query.resourceId = resourceId;
    if (actorId) query.actorId = actorId;

    const logs = await AuditLog.find(query).populate('actorId', 'fullName phone role').sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { actorId, actorRole, action, resourceType, resourceId, oldStatus, newStatus, reason, metadata } = req.body;
    const log = await AuditLog.create({
      actorId,
      actorRole,
      action,
      resourceType,
      resourceId,
      oldStatus,
      newStatus,
      reason,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata
    });
    res.status(201).json({ success: true, message: 'Audit entry created', data: log });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
