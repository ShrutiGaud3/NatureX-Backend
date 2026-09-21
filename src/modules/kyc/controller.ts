import { Response } from 'express';
import { KYC } from './model';
import { AuthRequest } from '../auth/middleware';

export const submitKyc = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { documentType, documentNumber, frontImageUrl, backImageUrl, consentAgreed } = req.body;
    const kyc = await KYC.findOneAndUpdate(
      { userId: req.user?.id },
      {
        $set: {
          documentType,
          documentNumber,
          frontImageUrl,
          backImageUrl,
          consentAgreed,
          consentTimestamp: new Date(),
          status: 'submitted'
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, message: 'KYC submitted successfully', data: kyc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyKyc = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const kyc = await KYC.findOne({ userId: req.user?.id });
    if (!kyc) {
      res.status(404).json({ success: false, message: 'KYC record not found' });
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

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      clarify: 'clarification',
      suspend: 'suspended'
    };

    const updateData: any = {
      status: statusMap[action],
      reviewedBy: req.user?.id,
      reviewedAt: new Date()
    };

    if (action === 'reject') updateData.rejectionReason = reason;
    if (action === 'clarify') updateData.clarificationQuestion = question;

    const kyc = await KYC.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!kyc) {
      res.status(404).json({ success: false, message: 'KYC record not found' });
      return;
    }

    res.status(200).json({ success: true, message: `KYC marked as ${updateData.status}`, data: kyc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getKycQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status = 'submitted' } = req.query;
    const list = await KYC.find({ status }).populate('userId', 'fullName phone village district state');
    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
