import { Response } from 'express';
import { BankProfile } from './model';
import { AuthRequest } from '../auth/middleware';

const maskNumber = (accNum: string) => {
  if (accNum.length < 4) return accNum;
  return 'X'.repeat(accNum.length - 4) + accNum.slice(-4);
};

export const saveBankProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { accountHolderName, accountNumber, ifscCode, bankName, branch } = req.body;
    const maskedAccountNumber = maskNumber(accountNumber);

    const profile = await BankProfile.findOneAndUpdate(
      { userId: req.user?.id },
      {
        $set: {
          accountHolderName,
          accountNumber,
          maskedAccountNumber,
          ifscCode: ifscCode.toUpperCase(),
          bankName,
          branch,
          status: 'submitted'
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Bank profile saved successfully',
      data: {
        id: profile._id,
        accountHolderName: profile.accountHolderName,
        maskedAccountNumber: profile.maskedAccountNumber,
        ifscCode: profile.ifscCode,
        bankName: profile.bankName,
        status: profile.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBankProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await BankProfile.findOne({ userId: req.user?.id }).select('-accountNumber');
    if (!profile) {
      res.status(404).json({ success: false, message: 'Bank profile not found' });
      return;
    }
    res.status(200).json({ success: true, data: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
