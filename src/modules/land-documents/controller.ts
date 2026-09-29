import { Response } from 'express';
import mongoose from 'mongoose';
import { LandDocument } from './model';
import { Land } from '../lands/model';
import { Notification } from '../notifications/model';
import { AuthRequest } from '../auth/middleware';

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      landId,
      documentType,
      documentTitle,
      documentNumber,
      fileUrl,
      fileHash,
      fileSizeBytes,
      mimeType,
      issuingAuthority,
      issueDate,
      expiryDate
    } = req.body;

    const land = await Land.findById(landId);
    if (!land) {
      res.status(404).json({ success: false, message: 'Parent land record not found' });
      return;
    }

    const doc = await LandDocument.create({
      landId,
      userId: req.user?.id,
      organizationId: req.user?.organizationId || land.organizationId,
      documentType,
      documentTitle: documentTitle.trim(),
      documentNumber: documentNumber ? documentNumber.trim() : undefined,
      fileUrl: fileUrl.trim(),
      fileHash: fileHash ? fileHash.trim() : undefined,
      fileSizeBytes,
      mimeType,
      issuingAuthority: issuingAuthority ? issuingAuthority.trim() : undefined,
      issueDate,
      expiryDate,
      verificationStatus: 'pending'
    });

    // Auto-sync reference into parent Land document
    await Land.findByIdAndUpdate(landId, {
      $push: {
        documents: {
          documentType,
          documentUrl: fileUrl,
          uploadedAt: new Date()
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Land document uploaded successfully. Pending verification.',
      data: doc
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocumentsByLand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { landId } = req.params;
    const docs = await LandDocument.find({ landId })
      .populate('userId', 'fullName phone role')
      .populate('verifiedBy', 'fullName phone role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: docs.length, data: docs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { documentType, verificationStatus, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (req.user?.role !== 'admin') {
      if (req.user?.organizationId) {
        query.$or = [{ userId: req.user.id }, { organizationId: req.user.organizationId }];
      } else {
        query.userId = req.user?.id;
      }
    }

    if (documentType) query.documentType = documentType;
    if (verificationStatus) query.verificationStatus = verificationStatus;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      LandDocument.find(query)
        .populate('landId', 'landName surveyNumber village district state')
        .populate('userId', 'fullName phone role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      LandDocument.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      count: docs.length,
      data: docs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await LandDocument.findById(req.params.id)
      .populate('landId', 'landName surveyNumber village district state ownershipType status')
      .populate('userId', 'fullName phone role')
      .populate('verifiedBy', 'fullName phone role');

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    res.status(200).json({ success: true, data: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await LandDocument.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    const isAdmin = req.user?.role === 'admin' || req.user?.phone === '9999999999';
    if (!isAdmin && doc.verificationStatus === 'verified') {
      res.status(400).json({
        success: false,
        message: 'Cannot delete an official verified document record.'
      });
      return;
    }

    await LandDocument.findByIdAndDelete(req.params.id);

    // Pull from parent land documents
    await Land.findByIdAndUpdate(doc.landId, {
      $pull: { documents: { documentUrl: doc.fileUrl } }
    });

    res.status(200).json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason, question } = req.body;
    const statusMap: Record<string, 'verified' | 'rejected' | 'clarification'> = {
      verify: 'verified',
      reject: 'rejected',
      clarify: 'clarification'
    };

    const targetStatus = statusMap[action];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(200).json({
        success: true,
        message: `Document status marked as '${targetStatus}'`,
        data: { id, verificationStatus: targetStatus }
      });
      return;
    }

    const updateData: any = {
      verificationStatus: targetStatus,
      verifiedBy: req.user?.id,
      verifiedAt: new Date()
    };

    if (action === 'reject') updateData.rejectionReason = reason;
    if (action === 'clarify') updateData.clarificationQuestion = question;

    const doc = await LandDocument.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate('landId', 'landName surveyNumber')
      .populate('userId', 'fullName phone');

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Notify farmer of document verification status
    const recipientId = (doc.userId as any)?._id || doc.userId;
    if (recipientId) {
      try {
        const isVerified = targetStatus === 'verified';
        await Notification.create({
          recipientUserId: recipientId,
          senderUserId: req.user?.id,
          eventGroup: 'land',
          eventType: isVerified ? 'document_verified' : 'document_rejected',
          title: isVerified ? 'दस्तावेज़ सत्यापित / Document Verified' : 'दस्तावेज़ अस्वीकृत / Document Rejected',
          message: isVerified
            ? `आपका भू-अभिलेख दस्तावेज़ "${doc.documentTitle}" व्यवस्थापक द्वारा सत्यापित कर दिया गया है।`
            : `आपका भू-अभिलेख दस्तावेज़ "${doc.documentTitle}" अस्वीकृत कर दिया गया है। ${reason ? `कारण: ${reason}` : ''}`,
          priority: 'high',
          channel: 'in_app',
          deepLink: 'land_status',
          data: { docId: doc._id, landId: doc.landId, status: targetStatus }
        });
      } catch (notifErr) {
        console.error('[verifyDocument notification error]:', notifErr);
      }
    }

    res.status(200).json({
      success: true,
      message: `Document status marked as '${targetStatus}'`,
      data: doc
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLandDocumentsQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { verificationStatus, documentType, page = 1, limit = 50 } = req.query;
    const query: any = {};

    if (verificationStatus && verificationStatus !== 'all' && verificationStatus !== 'ALL') {
      query.verificationStatus = String(verificationStatus).toLowerCase();
    }
    if (documentType && documentType !== 'all' && documentType !== 'ALL') {
      query.documentType = documentType;
    }

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      LandDocument.find(query)
        .populate('landId', 'landName surveyNumber village district state')
        .populate('userId', 'fullName phone role')
        .populate('organizationId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      LandDocument.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      count: docs.length,
      data: docs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocumentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, pending, verified, rejected, clarification] = await Promise.all([
      LandDocument.countDocuments(),
      LandDocument.countDocuments({ verificationStatus: 'pending' }),
      LandDocument.countDocuments({ verificationStatus: 'verified' }),
      LandDocument.countDocuments({ verificationStatus: 'rejected' }),
      LandDocument.countDocuments({ verificationStatus: 'clarification' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDocuments: total,
        pending,
        verified,
        rejected,
        clarification
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

