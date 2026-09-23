import { Response } from 'express';
import mongoose from 'mongoose';
import { Evidence, IEvidence } from './model';
import { Project } from '../projects/model';
import { AuthRequest } from '../auth/middleware';

// Helper to construct GeoJSON Point from lat/lng
const buildGeoPoint = (captureLocation?: { latitude?: number; longitude?: number }) => {
  if (
    captureLocation &&
    typeof captureLocation.latitude === 'number' &&
    typeof captureLocation.longitude === 'number'
  ) {
    return {
      type: 'Point',
      coordinates: [captureLocation.longitude, captureLocation.latitude]
    };
  }
  return undefined;
};

// 1. Single Evidence Upload
export const uploadEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      landId,
      visitId,
      evidenceType,
      category = 'general',
      title,
      description,
      fileUrl,
      fileHash,
      fileSize,
      mimeType,
      captureLocation,
      capturedAt,
      deviceMetadata,
      metadata,
      tags
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project record not found.' });
      return;
    }

    const location = buildGeoPoint(captureLocation);

    const evidence = await Evidence.create({
      projectId,
      landId: landId || undefined,
      visitId: visitId || undefined,
      userId: req.user?.id,
      evidenceType,
      category,
      title: title.trim(),
      description: description ? description.trim() : undefined,
      fileUrl: fileUrl.trim(),
      fileHash,
      fileSize,
      mimeType,
      captureLocation,
      location,
      capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
      deviceMetadata,
      metadata,
      tags: tags || [],
      status: 'uploaded'
    });

    res.status(201).json({
      success: true,
      message: 'Evidence artifact uploaded successfully.',
      data: evidence
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Batch Evidence Upload
export const batchUploadEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { items } = req.body;
    const userId = req.user?.id;

    const recordsToInsert = items.map((item: any) => ({
      projectId: item.projectId,
      landId: item.landId || undefined,
      visitId: item.visitId || undefined,
      userId,
      evidenceType: item.evidenceType,
      category: item.category || 'general',
      title: item.title.trim(),
      description: item.description ? item.description.trim() : undefined,
      fileUrl: item.fileUrl.trim(),
      fileHash: item.fileHash,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
      captureLocation: item.captureLocation,
      location: buildGeoPoint(item.captureLocation),
      capturedAt: item.capturedAt ? new Date(item.capturedAt) : new Date(),
      deviceMetadata: item.deviceMetadata,
      metadata: item.metadata,
      tags: item.tags || [],
      status: 'uploaded'
    }));

    const inserted = await Evidence.insertMany(recordsToInsert);

    res.status(201).json({
      success: true,
      message: `Successfully uploaded batch of ${inserted.length} evidence artifacts.`,
      count: inserted.length,
      data: inserted
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. List Evidence with Dynamic Query & Pagination
export const listEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      landId,
      visitId,
      userId,
      evidenceType,
      category,
      status,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const filter: any = {};

    if (projectId) filter.projectId = projectId;
    if (landId) filter.landId = landId;
    if (visitId) filter.visitId = visitId;
    if (userId) filter.userId = userId;
    if (evidenceType) filter.evidenceType = evidenceType;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
        { tags: { $in: [new RegExp(String(search), 'i')] } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const [evidenceList, total] = await Promise.all([
      Evidence.find(filter)
        .populate('userId', 'fullName phone role')
        .populate('reviewedBy', 'fullName phone role')
        .populate('landId', 'landName village surveyNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Evidence.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: evidenceList,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Evidence by ID
export const getEvidenceById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const evidence = await Evidence.findById(req.params.id)
      .populate('projectId', 'name code projectType standard status')
      .populate('landId', 'landName village district state surveyNumber areaInAcres')
      .populate('visitId')
      .populate('userId', 'fullName phone role')
      .populate('reviewedBy', 'fullName phone role');

    if (!evidence) {
      res.status(404).json({ success: false, message: 'Evidence record not found.' });
      return;
    }

    res.status(200).json({ success: true, data: evidence });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Evidence for a specific Project
export const getEvidenceByProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { category, status } = req.query;

    const query: any = { projectId };
    if (category) query.category = category;
    if (status) query.status = status;

    const evidenceList = await Evidence.find(query)
      .populate('userId', 'fullName phone role')
      .populate('reviewedBy', 'fullName phone role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      projectId,
      count: evidenceList.length,
      data: evidenceList
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Aggregate Evidence Stats for a Project
export const getEvidenceStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const pId = new mongoose.Types.ObjectId(projectId);

    const [statusStats, typeStats, categoryStats] = await Promise.all([
      Evidence.aggregate([
        { $match: { projectId: pId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Evidence.aggregate([
        { $match: { projectId: pId } },
        { $group: { _id: '$evidenceType', count: { $sum: 1 } } }
      ]),
      Evidence.aggregate([
        { $match: { projectId: pId } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ])
    ]);

    const total = await Evidence.countDocuments({ projectId: pId });

    res.status(200).json({
      success: true,
      projectId,
      total,
      byStatus: statusStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byType: typeStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byCategory: categoryStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Update Evidence Metadata / Title
export const updateEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, tags, metadata } = req.body;
    const updateData: any = {};

    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (metadata) updateData.metadata = metadata;

    const evidence = await Evidence.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!evidence) {
      res.status(404).json({ success: false, message: 'Evidence record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Evidence details updated successfully.',
      data: evidence
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Review Evidence (Admin / Field Agent Review)
export const reviewEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, status, notes, rejectionReason } = req.body;

    const statusMap: Record<string, string> = {
      verify: 'verified',
      flag: 'flagged',
      reject: 'rejected',
      under_review: 'under_review',
      verified: 'verified',
      flagged: 'flagged',
      rejected: 'rejected'
    };

    const targetStatus = statusMap[action || status] || 'under_review';

    const evidence = await Evidence.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: targetStatus,
          reviewedBy: req.user?.id,
          reviewedAt: new Date(),
          reviewNotes: notes || undefined,
          rejectionReason: targetStatus === 'rejected' ? rejectionReason || notes : undefined
        }
      },
      { new: true }
    );

    if (!evidence) {
      res.status(404).json({ success: false, message: 'Evidence record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Evidence status updated to '${targetStatus}'.`,
      data: evidence
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Delete or Archive Evidence
export const deleteEvidence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { permanent } = req.query;

    if (permanent === 'true' && req.user?.role === 'admin') {
      const deleted = await Evidence.findByIdAndDelete(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Evidence record not found.' });
        return;
      }
      res.status(200).json({ success: true, message: 'Evidence permanently deleted.' });
      return;
    }

    // Soft delete -> mark as archived
    const archived = await Evidence.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'archived' } },
      { new: true }
    );

    if (!archived) {
      res.status(404).json({ success: false, message: 'Evidence record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Evidence archived successfully.',
      data: archived
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

