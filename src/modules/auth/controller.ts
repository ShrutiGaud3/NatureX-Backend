import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OtpSession } from './model';
import { User } from '../users/model';
import { AuthRequest } from './middleware';

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, countryCode = '+91', deviceId } = req.body;
    const cleanPhone = phone.trim();

    // Check for cooldown (prevent spamming within 30 seconds)
    const recentSession = await OtpSession.findOne({
      phone: cleanPhone,
      createdAt: { $gt: new Date(Date.now() - 30 * 1000) }
    });

    if (recentSession) {
      res.status(429).json({
        success: false,
        message: 'Please wait 30 seconds before requesting a new OTP.'
      });
      return;
    }

    // 4-Digit Mock OTP (easily replaceable with SMS Gateway)
    const generatedOtp = '1234';
    const expiresInSeconds = 300; // 5 minutes
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    await OtpSession.create({
      phone: cleanPhone,
      countryCode,
      otp: generatedOtp,
      expiresAt,
      deviceId
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: cleanPhone,
        countryCode,
        expiresInSeconds,
        debugOtp: process.env.NODE_ENV !== 'production' ? generatedOtp : undefined
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' });
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  return sendOtp(req, res);
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    const cleanPhone = phone.trim();

    const session = await OtpSession.findOne({
      phone: cleanPhone,
      isVerified: false
    }).sort({ createdAt: -1 });

    if (!session) {
      res.status(400).json({
        success: false,
        message: 'No active OTP request found for this phone number. Please request a new OTP.'
      });
      return;
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
      return;
    }

    // Brute force protection
    if (session.attempts >= session.maxAttempts) {
      res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. This OTP session is locked. Please request a new OTP.'
      });
      return;
    }

    // Verify OTP match
    if (session.otp !== otp.trim()) {
      session.attempts += 1;
      await session.save();
      const remaining = session.maxAttempts - session.attempts;
      res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${remaining} attempts remaining.`
      });
      return;
    }

    // Mark session verified
    session.isVerified = true;
    await session.save();

    // Find or create User record
    let user = await User.findOne({ phone: cleanPhone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        phone: cleanPhone,
        role: 'unassigned',
        status: 'draft',
        preferredLanguage: 'en'
      });
    }

    const hasRole = user.role && user.role !== 'unassigned';

    let nextStep = 'role_selection';
    if (user.role === 'admin') nextStep = 'admin_dashboard';
    else if (user.role === 'farmer') nextStep = 'farmer_home';
    else if (user.role === 'organization' || user.role === 'project_developer') nextStep = 'org_dashboard';
    else if (user.role === 'field_agent') nextStep = 'agent_dashboard';

    // Issue JWT Token
    const secret = (process.env.JWT_SECRET || 'naturex_jwt_secret_key_change_in_production') as jwt.Secret;
    const token = jwt.sign(
      {
        id: user._id.toString(),
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId?.toString()
      },
      secret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: user.role === 'admin' ? 'Super Admin logged in successfully!' : 'OTP verified successfully!',
      data: {
        token,
        isNewUser,
        roleSelected: hasRole,
        nextStep,
        user: {
          id: user._id,
          phone: user.phone,
          fullName: user.fullName || null,
          role: user.role === 'unassigned' ? null : user.role,
          status: user.status,
          preferredLanguage: user.preferredLanguage
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Verification failed' });
  }
};

export const seedAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone = '9999999999', fullName = 'Super Admin' } = req.body;
    const cleanPhone = phone.trim();

    const adminUser = await User.findOneAndUpdate(
      { phone: cleanPhone },
      {
        $set: {
          fullName,
          phone: cleanPhone,
          role: 'admin',
          status: 'active',
          preferredLanguage: 'en'
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Super Admin account successfully provisioned for mobile: ${cleanPhone}`,
      data: {
        id: adminUser._id,
        phone: adminUser.phone,
        fullName: adminUser.fullName,
        role: adminUser.role,
        status: adminUser.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const selectRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Update user role
    user.role = role;
    await user.save();

    // Re-issue updated JWT Token with new role
    const secret = (process.env.JWT_SECRET || 'naturex_jwt_secret_key_change_in_production') as jwt.Secret;
    const token = jwt.sign(
      {
        id: user._id.toString(),
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId?.toString()
      },
      secret,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: `Role successfully selected as ${role}`,
      data: {
        token,
        nextStep: 'profile_setup',
        user: {
          id: user._id,
          phone: user.phone,
          fullName: user.fullName || null,
          role: user.role,
          status: user.status,
          preferredLanguage: user.preferredLanguage
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id).populate('organizationId', 'name type status');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
        fatherOrHusbandName: user.fatherOrHusbandName,
        photoUrl: user.photoUrl,
        dob: user.dob,
        age: user.age,
        village: user.village,
        city: user.city,
        district: user.district,
        state: user.state,
        pincode: user.pincode,
        preferredLanguage: user.preferredLanguage,
        role: user.role,
        status: user.status,
        organization: user.organizationId || null,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
