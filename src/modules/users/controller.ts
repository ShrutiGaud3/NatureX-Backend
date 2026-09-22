import { Response } from 'express';
import { User } from './model';
import { AuthRequest } from '../auth/middleware';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).populate('organizationId', 'name type status');
    if (!user) {
      res.status(404).json({ success: false, message: 'User profile not found' });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      fatherOrHusbandName,
      photoUrl,
      dob,
      age: providedAge,
      gender,
      village,
      city,
      district,
      state,
      pincode,
      isDraft = false
    } = req.body;

    // Calculate age if dob is provided
    let age = providedAge;
    if (dob && !age) {
      const birthDate = new Date(dob);
      const diff = Date.now() - birthDate.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }

    const updateFields: any = {
      fullName,
      fatherOrHusbandName,
      photoUrl,
      dob,
      age,
      gender,
      village,
      city,
      district,
      state,
      pincode,
      status: isDraft ? 'draft' : 'submitted'
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] === undefined) delete updateFields[key];
    });

    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $set: updateFields },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: isDraft ? 'Profile draft saved successfully' : 'Profile completed successfully (Ready for KYC)',
      nextStep: isDraft ? 'profile_draft' : 'kyc_submission',
      data: user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLanguage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { language } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { $set: { preferredLanguage: language } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: `Preferred language updated to ${language === 'hi' ? 'Hindi' : 'English'}`,
      data: {
        id: user?._id,
        phone: user?.phone,
        preferredLanguage: user?.preferredLanguage
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).populate('organizationId', 'name type status');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, status, district, state, search, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (district) query.district = { $regex: String(district), $options: 'i' };
    if (state) query.state = { $regex: String(state), $options: 'i' };
    if (search) {
      query.$or = [
        { fullName: { $regex: String(search), $options: 'i' } },
        { phone: { $regex: String(search), $options: 'i' } },
        { village: { $regex: String(search), $options: 'i' } }
      ];
    }

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      count: users.length,
      data: users
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}`,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
