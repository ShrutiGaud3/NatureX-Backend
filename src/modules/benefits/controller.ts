import { Response } from 'express';
import { BenefitLedger } from './model';
import { AuthRequest } from '../auth/middleware';

export const recordBenefit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, organizationId, projectId, amount, currency, benefitType, notes } = req.body;
    const ledger = await BenefitLedger.create({
      userId,
      organizationId,
      projectId,
      amount,
      currency,
      benefitType,
      notes,
      status: 'pending'
    });
    res.status(201).json({ success: true, message: 'Benefit obligation recorded', data: ledger });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyBenefits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = req.user?.role === 'admin' ? {} : { userId: req.user?.id };
    const records = await BenefitLedger.find(query)
      .populate('projectId', 'name projectType')
      .sort({ createdAt: -1 });

    const totalPaid = records
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalPending = records
      .filter((r) => ['pending', 'approved', 'initiated'].includes(r.status))
      .reduce((sum, r) => sum + r.amount, 0);

    res.status(200).json({
      success: true,
      summary: { totalPaid, totalPending, currency: 'INR' },
      count: records.length,
      data: records
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayoutStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, reconciliationReference, paymentMethod } = req.body;
    const updateData: any = { status, reconciliationReference, paymentMethod };
    if (status === 'paid') updateData.paidAt = new Date();

    const record = await BenefitLedger.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    res.status(200).json({ success: true, message: `Payout status updated to ${status}`, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
