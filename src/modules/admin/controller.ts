import { Response } from 'express';
import { AdminConfig } from './model';
import { AuthRequest } from '../auth/middleware';

export const getConfigs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isSuperAdmin = req.user?.role === 'admin';
    const query = isSuperAdmin ? {} : { isPublic: true };
    const configs = await AdminConfig.find(query);
    res.status(200).json({ success: true, count: configs.length, data: configs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { configKey, configValue, category, description, isPublic } = req.body;
    const config = await AdminConfig.findOneAndUpdate(
      { configKey },
      {
        $set: {
          configValue,
          category: category || 'system',
          description,
          isPublic: isPublic || false,
          updatedBy: req.user?.id
        }
      },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, message: 'Configuration saved', data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
