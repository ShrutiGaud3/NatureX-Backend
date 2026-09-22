import { Response } from 'express';
import { KYC } from './model';
import { AuthRequest } from '../auth/middleware';

export const saveDraftKyc = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      documentType,
      documentNumber,
      nameOnDocument,
      dobOnDocument,
      frontImageUrl,
      backImageUrl,
      selfieUrl,
      consentAgreed = false,
      consentText
    } = req.body;

    const kyc = await KYC.findOneAndUpdate(
      { userId: req.user?.id },
      {
        $set: {
          documentType,
          documentNumber,
          nameOnDocument,
          dobOnDocument,
          frontImageUrl,
          backImageUrl,
          selfieUrl,
          consentAgreed,
          consentTimestamp: consentAgreed ? new Date() : undefined,
          consentText,
          status: 'draft'
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'KYC draft saved successfully.',
      nextStep: 'kyc_submission',
      data: kyc
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitKyc = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      documentType,
      documentNumber,
      nameOnDocument,
      dobOnDocument,
      frontImageUrl,
      backImageUrl,
      selfieUrl,
      consentAgreed,
      consentText
    } = req.body;

    const existingKyc = await KYC.findOne({ userId: req.user?.id });

    const historyEntry = {
      status: 'submitted',
      changedBy: req.user?.id as any,
      note: 'KYC documents submitted by user for verification.',
      changedAt: new Date()
    };

    const kyc = await KYC.findOneAndUpdate(
      { userId: req.user?.id },
      {
        $set: {
          documentType,
          documentNumber,
          nameOnDocument,
          dobOnDocument,
          frontImageUrl,
          backImageUrl,
          selfieUrl,
          consentAgreed,
          consentTimestamp: new Date(),
          consentText: consentText || undefined,
          status: 'submitted',
          clarificationQuestion: undefined,
          clarificationReply: undefined,
          rejectionReason: undefined
        },
        $push: { history: historyEntry }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'KYC documents submitted successfully. Verification pending admin review.',
      nextStep: 'pending_kyc_approval',
      data: kyc
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyKyc = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const kyc = await KYC.findOne({ userId: req.user?.id }).populate('userId', 'fullName phone role village district state');
    if (!kyc) {
      res.status(404).json({
        success: false,
        message: 'No KYC submission found for current user.',
        nextStep: 'kyc_submission'
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: kyc
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const replyClarification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reply, updatedFrontImageUrl, updatedBackImageUrl, updatedDocumentNumber } = req.body;

    const kyc = await KYC.findOne({ userId: req.user?.id });
    if (!kyc) {
      res.status(404).json({ success: false, message: 'KYC record not found.' });
      return;
    }

    if (kyc.status !== 'clarification') {
      res.status(400).json({
        success: false,
        message: `Cannot submit clarification reply when KYC status is '${kyc.status}'.`
      });
      return;
    }

    const updateFields: any = {
      clarificationReply: reply,
      status: 'submitted'
    };

    if (updatedFrontImageUrl) updateFields.frontImageUrl = updatedFrontImageUrl;
    if (updatedBackImageUrl) updateFields.backImageUrl = updatedBackImageUrl;
    if (updatedDocumentNumber) updateFields.documentNumber = updatedDocumentNumber;

    const historyEntry = {
      status: 'submitted',
      changedBy: req.user?.id as any,
      note: `User replied to clarification: ${reply}`,
      changedAt: new Date()
    };

    const updatedKyc = await KYC.findByIdAndUpdate(
      kyc._id,
      {
        $set: updateFields,
        $push: { history: historyEntry }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Clarification reply submitted successfully. Status moved back to submitted.',
      data: updatedKyc
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getKycQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, documentType, search, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (documentType) query.documentType = documentType;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [list, total] = await Promise.all([
      KYC.find(query)
        .populate('userId', 'fullName phone role village district state preferredLanguage')
        .populate('reviewedBy', 'fullName phone role')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      KYC.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      count: list.length,
      data: list
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getKycById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const kyc = await KYC.findById(id)
      .populate('userId', 'fullName phone role village city district state pincode preferredLanguage status')
      .populate('reviewedBy', 'fullName phone role');

    if (!kyc) {
      res.status(404).json({ success: false, message: 'KYC record not found.' });
      return;
    }

    res.status(200).json({ success: true, data: kyc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewKyc = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason, question } = req.body;

    const statusMap: Record<string, 'approved' | 'rejected' | 'clarification' | 'suspended'> = {
      approve: 'approved',
      reject: 'rejected',
      clarify: 'clarification',
      suspend: 'suspended'
    };

    const targetStatus = statusMap[action];
    const updateData: any = {
      status: targetStatus,
      reviewedBy: req.user?.id,
      reviewedAt: new Date()
    };

    let historyNote = `KYC status changed to ${targetStatus} by admin/reviewer.`;
    if (action === 'reject') {
      updateData.rejectionReason = reason;
      historyNote = `KYC rejected. Reason: ${reason}`;
    }
    if (action === 'clarify') {
      updateData.clarificationQuestion = question;
      historyNote = `Clarification requested: ${question}`;
    }

    const historyEntry = {
      status: targetStatus,
      changedBy: req.user?.id as any,
      note: historyNote,
      changedAt: new Date()
    };

    const kyc = await KYC.findByIdAndUpdate(
      id,
      {
        $set: updateData,
        $push: { history: historyEntry }
      },
      { new: true }
    ).populate('userId', 'fullName phone role village district state');

    if (!kyc) {
      res.status(404).json({ success: false, message: 'KYC record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `KYC successfully updated to '${targetStatus}'.`,
      data: kyc
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getKycStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, submitted, approved, clarification, rejected, suspended, draft] = await Promise.all([
      KYC.countDocuments(),
      KYC.countDocuments({ status: 'submitted' }),
      KYC.countDocuments({ status: 'approved' }),
      KYC.countDocuments({ status: 'clarification' }),
      KYC.countDocuments({ status: 'rejected' }),
      KYC.countDocuments({ status: 'suspended' }),
      KYC.countDocuments({ status: 'draft' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        submitted,
        approved,
        clarification,
        rejected,
        suspended,
        draft
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

