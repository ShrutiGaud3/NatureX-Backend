import { Response, NextFunction } from 'express';
import { AuthRequest } from '../auth/middleware';
import { User } from './model';

export const requireActiveUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact support.'
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requireSelfOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role === 'admin' || req.params.id === req.user?.id) {
    return next();
  }
  res.status(403).json({
    success: false,
    message: 'Access denied: You can only access your own profile.'
  });
};
