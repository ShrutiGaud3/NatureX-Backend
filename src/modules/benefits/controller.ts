import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BenefitLedger } from './model';
import { User } from '../users/model';
import { Project } from '../projects/model';
import { BankProfile } from '../bank-payout-profile/model';

const generateTransactionCode = (prefix: string = 'BEN'): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${year}-${rand}`;
};

// 1. Create / Record Benefit Obligation
export const recordBenefit = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const {
      transactionCode,
      userId,
      organizationId,
      projectId,
      programId,
      landId,
      benefitType,
      calculationBasis,
      amount,
      deductions,
      currency = 'INR',
      notes,
      metadata
    } = req.body;

    const code = transactionCode || generateTransactionCode('BEN');

    // Calculate deductions
    const platformFee = deductions?.platformFee || 0;
    const fpoFee = deductions?.fpoFee || 0;
    const taxTds = deductions?.taxTds || 0;
    const totalDeductions = platformFee + fpoFee + taxTds;
    const netAmount = Math.max(0, amount - totalDeductions);

    // Look up beneficiary bank profile if available
    let bankDetails: any = {};
    const bankProfile = await BankProfile.findOne({ userId });
    if (bankProfile) {
      bankDetails = {
        bankAccountId: bankProfile._id,
        bankAccountNumberMasked: bankProfile.maskedAccountNumber,
        ifscCode: bankProfile.ifscCode,
        upiId: bankProfile.upiId
      };
    }

    const ledger = await BenefitLedger.create({
      transactionCode: code,
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: organizationId ? new mongoose.Types.ObjectId(organizationId) : undefined,
      projectId: new mongoose.Types.ObjectId(projectId),
      programId: programId ? new mongoose.Types.ObjectId(programId) : undefined,
      landId: landId ? new mongoose.Types.ObjectId(landId) : undefined,
      benefitType,
      calculationBasis: calculationBasis || {},
      amount,
      deductions: {
        platformFee,
        fpoFee,
        taxTds,
        netAmount
      },
      currency,
      status: 'pending',
      payoutDetails: bankDetails,
      notes,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'Benefit obligation recorded successfully',
      data: ledger
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Bulk Distribute / Calculate Benefits for Multiple Farmers
export const bulkDistributeBenefits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, programId, benefitType, allocations, currency = 'INR', notes } = req.body;

    const createdRecords: any[] = [];

    for (const alloc of allocations) {
      const code = generateTransactionCode('BEN');
      const platformFee = alloc.deductions?.platformFee || 0;
      const fpoFee = alloc.deductions?.fpoFee || 0;
      const taxTds = alloc.deductions?.taxTds || 0;
      const netAmount = Math.max(0, alloc.amount - (platformFee + fpoFee + taxTds));

      const record = await BenefitLedger.create({
        transactionCode: code,
        userId: new mongoose.Types.ObjectId(alloc.userId),
        projectId: new mongoose.Types.ObjectId(projectId),
        programId: programId ? new mongoose.Types.ObjectId(programId) : undefined,
        landId: alloc.landId ? new mongoose.Types.ObjectId(alloc.landId) : undefined,
        benefitType,
        calculationBasis: alloc.calculationBasis || {},
        amount: alloc.amount,
        deductions: { platformFee, fpoFee, taxTds, netAmount },
        currency,
        status: 'pending',
        notes: alloc.notes || notes
      });

      createdRecords.push(record);
    }

    res.status(201).json({
      success: true,
      message: `Successfully generated ${createdRecords.length} benefit allocation records`,
      count: createdRecords.length,
      data: createdRecords
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get All Benefits (Filtered & Paginated)
export const getBenefits = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      benefitType,
      projectId,
      userId,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (benefitType) query.benefitType = benefitType;
    if (projectId) query.projectId = projectId;
    if (userId) query.userId = userId;

    if (search) {
      query.$or = [
        { transactionCode: { $regex: search as string, $options: 'i' } },
        { 'payoutDetails.transactionReference': { $regex: search as string, $options: 'i' } },
        { notes: { $regex: search as string, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [benefits, total] = await Promise.all([
      BenefitLedger.find(query)
        .populate('userId', 'fullName phone email role')
        .populate('projectId', 'name title projectCode projectType standard')
        .populate('landId', 'landName state district areaInAcres')
        .populate('approvedBy', 'fullName email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      BenefitLedger.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: benefits
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Benefit KPI Financial Statistics
export const getBenefitStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    const matchQuery: any = {};
    if (projectId) matchQuery.projectId = new mongoose.Types.ObjectId(projectId as string);

    const stats = await BenefitLedger.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAllocations: { $sum: 1 },
          totalGrossAmount: { $sum: '$amount' },
          totalPaidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
          },
          totalPendingAmount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending', 'approved', 'initiated', 'processing']] },
                '$amount',
                0
              ]
            }
          },
          totalFailedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, '$amount', 0] }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          pendingCount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['pending', 'approved', 'initiated', 'processing']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const byType = await BenefitLedger.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$benefitType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalAllocations: 0,
      totalGrossAmount: 0,
      totalPaidAmount: 0,
      totalPendingAmount: 0,
      totalFailedAmount: 0,
      paidCount: 0,
      pendingCount: 0
    };

    res.status(200).json({
      success: true,
      data: {
        summary: result,
        byBenefitType: byType
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get My Benefit Ledger (Beneficiary Personal View)
export const getMyBenefitLedger = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'User not authenticated' });
      return;
    }

    const records = await BenefitLedger.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate('projectId', 'name title projectCode projectType standard')
      .populate('landId', 'landName state district areaInAcres')
      .sort({ createdAt: -1 });

    const totalGross = records.reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = records
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + (r.deductions?.netAmount ?? r.amount), 0);

    const totalPending = records
      .filter((r) => ['pending', 'approved', 'initiated', 'processing'].includes(r.status))
      .reduce((sum, r) => sum + (r.deductions?.netAmount ?? r.amount), 0);

    res.status(200).json({
      success: true,
      summary: {
        totalGrossAllocated: totalGross,
        totalPaidDisbursed: totalPaid,
        totalPendingDisbursement: totalPending,
        currency: 'INR'
      },
      count: records.length,
      data: records
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Benefit By ID
export const getBenefitById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid benefit ID' });
      return;
    }

    const benefit = await BenefitLedger.findById(id)
      .populate('userId', 'fullName phone email role')
      .populate('projectId', 'name title projectCode projectType standard')
      .populate('landId', 'landName state district areaInAcres')
      .populate('approvedBy', 'fullName email');

    if (!benefit) {
      res.status(404).json({ success: false, message: 'Benefit record not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: benefit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Update Benefit Details (if Pending)
export const updateBenefit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, deductions, notes, metadata } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid benefit ID' });
      return;
    }

    const benefit = await BenefitLedger.findById(id);
    if (!benefit) {
      res.status(404).json({ success: false, message: 'Benefit record not found' });
      return;
    }

    if (!['pending', 'approved'].includes(benefit.status)) {
      res.status(400).json({
        success: false,
        message: `Cannot edit benefit record with status '${benefit.status}'`
      });
      return;
    }

    if (amount !== undefined) benefit.amount = amount;
    if (deductions) {
      const platformFee = deductions.platformFee ?? benefit.deductions?.platformFee ?? 0;
      const fpoFee = deductions.fpoFee ?? benefit.deductions?.fpoFee ?? 0;
      const taxTds = deductions.taxTds ?? benefit.deductions?.taxTds ?? 0;
      const netAmount = Math.max(0, benefit.amount - (platformFee + fpoFee + taxTds));
      benefit.deductions = { platformFee, fpoFee, taxTds, netAmount };
    }
    if (notes !== undefined) benefit.notes = notes;
    if (metadata !== undefined) benefit.metadata = metadata;

    await benefit.save();

    res.status(200).json({
      success: true,
      message: 'Benefit record updated successfully',
      data: benefit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Approve Benefit for Payout
export const approveBenefit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid benefit ID' });
      return;
    }

    const benefit = await BenefitLedger.findById(id);
    if (!benefit) {
      res.status(404).json({ success: false, message: 'Benefit record not found' });
      return;
    }

    if (benefit.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Benefit record is already ${benefit.status}`
      });
      return;
    }

    benefit.status = 'approved';
    benefit.approvedBy = userId ? new mongoose.Types.ObjectId(userId) : undefined;
    benefit.approvedAt = new Date();

    await benefit.save();

    res.status(200).json({
      success: true,
      message: 'Benefit obligation approved for payout',
      data: benefit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Process / Execute Payout (Bank Transfer / UPI UTR Confirmation)
export const processPayout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { payoutMethod = 'bank_transfer', transactionReference, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid benefit ID' });
      return;
    }

    const benefit = await BenefitLedger.findById(id);
    if (!benefit) {
      res.status(404).json({ success: false, message: 'Benefit record not found' });
      return;
    }

    if (['paid'].includes(benefit.status)) {
      res.status(400).json({
        success: false,
        message: 'Benefit payout has already been completed and paid'
      });
      return;
    }

    benefit.status = 'paid';
    benefit.payoutDetails = {
      ...benefit.payoutDetails,
      payoutMethod,
      transactionReference,
      reconciliationReference: transactionReference,
      paidAt: new Date()
    };
    if (notes) benefit.notes = notes;

    await benefit.save();

    res.status(200).json({
      success: true,
      message: `Payout of ₹${benefit.deductions?.netAmount ?? benefit.amount} disbursed successfully`,
      data: benefit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Patch Payout Status (Reconcile / Mark Failed / Reversed)
export const updatePayoutStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reconciliationReference, paymentMethod, failureReason, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid benefit ID' });
      return;
    }

    const benefit = await BenefitLedger.findById(id);
    if (!benefit) {
      res.status(404).json({ success: false, message: 'Benefit record not found' });
      return;
    }

    benefit.status = status;
    if (!benefit.payoutDetails) benefit.payoutDetails = {};

    if (paymentMethod) benefit.payoutDetails.payoutMethod = paymentMethod;
    if (reconciliationReference) {
      benefit.payoutDetails.reconciliationReference = reconciliationReference;
      benefit.payoutDetails.transactionReference = reconciliationReference;
    }
    if (status === 'paid') benefit.payoutDetails.paidAt = new Date();
    if (status === 'failed') benefit.payoutDetails.failureReason = failureReason;
    if (notes) benefit.notes = notes;

    await benefit.save();

    res.status(200).json({
      success: true,
      message: `Payout status updated to '${status}' successfully`,
      data: benefit
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Delete / Void Benefit Obligation (if pending)
export const deleteBenefit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid benefit ID' });
      return;
    }

    const benefit = await BenefitLedger.findById(id);
    if (!benefit) {
      res.status(404).json({ success: false, message: 'Benefit record not found' });
      return;
    }

    if (benefit.status === 'paid') {
      res.status(400).json({
        success: false,
        message: 'Cannot delete a benefit obligation that has already been paid out'
      });
      return;
    }

    await BenefitLedger.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Benefit obligation record deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
