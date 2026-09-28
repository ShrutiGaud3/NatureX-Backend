import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../auth/middleware';
import { User } from './model';

export const requireActiveUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id && !req.user?.phone) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    let user = req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)
      ? await User.findById(req.user.id)
      : null;

    if (!user && req.user?.phone) {
      user = await User.findOne({ phone: req.user.phone });
      if (user) {
        req.user.id = user._id.toString();
      }
    }

    // Auto-create/recover user if phone is authenticated but record missing
    if (!user && req.user?.phone) {
      user = await User.create({
        phone: req.user.phone,
        role: req.user.role || 'farmer',
        status: 'draft',
        preferredLanguage: 'en'
      });
      req.user.id = user._id.toString();
    }

    if (!user) {
      res.status(401).json({ success: false, message: 'User session has expired. Please log in again.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact support.'
      });
      return;
    }

    (req as any).activeUser = user;
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requireSelfOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const role = req.user?.role || '';
  if (role === 'admin' || role === 'super_admin' || req.params.id === req.user?.id) {
    return next();
  }
  res.status(403).json({
    success: false,
    message: 'Access denied: You can only access your own profile.'
  });
};

