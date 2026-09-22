import { Response } from 'express';
import { BankProfile } from './model';
import { AuthRequest } from '../auth/middleware';

const maskNumber = (accNum: string): string => {
  const clean = accNum.trim();
  if (clean.length <= 4) return clean;
  return 'X'.repeat(clean.length - 4) + clean.slice(-4);
};

export const saveBankProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
      branchName,
      accountType = 'savings',
      upiId,
      passbookOrChequeUrl
    } = req.body;

    const maskedAccountNumber = maskNumber(accountNumber);

    const profile = await BankProfile.findOneAndUpdate(
      { userId: req.user?.id },
      {
        $set: {
          accountHolderName: accountHolderName.trim(),
          accountNumber: accountNumber.trim(),
          maskedAccountNumber,
          ifscCode: ifscCode.trim().toUpperCase(),
          bankName: bankName?.trim(),
          branchName: branchName?.trim(),
          accountType,
          upiId: upiId?.trim(),
          passbookOrChequeUrl,
          isVerified: false,
          status: 'submitted',
          rejectionReason: undefined
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Bank payout profile saved successfully. Pending verification.',
      data: {
        id: profile._id,
        accountHolderName: profile.accountHolderName,
        maskedAccountNumber: profile.maskedAccountNumber,
        ifscCode: profile.ifscCode,
        bankName: profile.bankName,
        branchName: profile.branchName,
        accountType: profile.accountType,
        upiId: profile.upiId,
        passbookOrChequeUrl: profile.passbookOrChequeUrl,
        isVerified: profile.isVerified,
        status: profile.status,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyBankProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await BankProfile.findOne({ userId: req.user?.id }).select('-accountNumber');
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'No bank payout profile found for the current user.',
        nextStep: 'setup_bank_profile'
      });
      return;
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBankQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query: any = {};

    if (status) query.status = status;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [list, total] = await Promise.all([
      BankProfile.find(query)
        .select('-accountNumber')
        .populate('userId', 'fullName phone role village district state')
        .populate('verifiedBy', 'fullName phone role')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      BankProfile.countDocuments(query)
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

export const getBankProfileById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const profile = await BankProfile.findById(id)
      .select('-accountNumber')
      .populate('userId', 'fullName phone role village district state pincode preferredLanguage')
      .populate('verifiedBy', 'fullName phone role');

    if (!profile) {
      res.status(404).json({ success: false, message: 'Bank profile record not found' });
      return;
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewBankProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const isApprove = action === 'verify';
    const updateData: any = {
      isVerified: isApprove,
      status: isApprove ? 'verified' : 'rejected',
      verifiedBy: req.user?.id,
      verifiedAt: new Date()
    };

    if (!isApprove && reason) {
      updateData.rejectionReason = reason;
    }

    const profile = await BankProfile.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .select('-accountNumber')
      .populate('userId', 'fullName phone role village district state');

    if (!profile) {
      res.status(404).json({ success: false, message: 'Bank profile record not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Bank profile successfully marked as ${profile.status}`,
      data: profile
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBankStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, submitted, verified, rejected, draft] = await Promise.all([
      BankProfile.countDocuments(),
      BankProfile.countDocuments({ status: 'submitted' }),
      BankProfile.countDocuments({ status: 'verified' }),
      BankProfile.countDocuments({ status: 'rejected' }),
      BankProfile.countDocuments({ status: 'draft' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        submitted,
        verified,
        rejected,
        draft
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

