import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AdminConfig } from './model';

// 1. Get Configs (Filtered & Paginated)
export const getConfigs = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const isSuperAdmin =
      user?.role === 'admin' ||
      user?.role === 'super_admin' ||
      user?.roles?.includes('admin') ||
      user?.roles?.includes('super_admin');

    const { category, search, page = '1', limit = '50' } = req.query;

    const query: any = isSuperAdmin ? {} : { isPublic: true };

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { configKey: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [configs, total] = await Promise.all([
      AdminConfig.find(query)
        .populate('updatedBy', 'fullName email role')
        .sort({ category: 1, configKey: 1 })
        .skip(skip)
        .limit(limitNum),
      AdminConfig.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: configs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Public Configs & Feature Flags Map
export const getPublicConfigs = async (req: Request, res: Response): Promise<void> => {
  try {
    const configs = await AdminConfig.find({ isPublic: true });
    const configMap: Record<string, any> = {};

    configs.forEach((c) => {
      configMap[c.configKey] = c.configValue;
    });

    res.status(200).json({
      success: true,
      data: configMap
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Single Config by Key
export const getConfigByKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const cleanKey = key.trim().toUpperCase();

    const config = await AdminConfig.findOne({ configKey: cleanKey }).populate(
      'updatedBy',
      'fullName email role'
    );

    if (!config) {
      res.status(404).json({ success: false, message: `Configuration key '${cleanKey}' not found` });
      return;
    }

    res.status(200).json({
      success: true,
      data: config
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Create or Upsert Configuration
export const setConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    const { configKey, configValue, category = 'system', description, isPublic = false, tags } = req.body;
    const cleanKey = configKey.trim().toUpperCase();

    const config = await AdminConfig.findOneAndUpdate(
      { configKey: cleanKey },
      {
        $set: {
          configKey: cleanKey,
          configValue,
          category,
          description,
          isPublic,
          tags: tags || [],
          updatedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Configuration '${cleanKey}' saved successfully`,
      data: config
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Update Config by Key
export const updateConfigByKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const { configValue, description, isPublic, tags, category } = req.body;

    const cleanKey = key.trim().toUpperCase();

    const config = await AdminConfig.findOne({ configKey: cleanKey });
    if (!config) {
      res.status(404).json({ success: false, message: `Configuration key '${cleanKey}' not found` });
      return;
    }

    if (configValue !== undefined) config.configValue = configValue;
    if (description !== undefined) config.description = description;
    if (isPublic !== undefined) config.isPublic = isPublic;
    if (category) config.category = category;
    if (tags) config.tags = tags;
    if (userId) config.updatedBy = new mongoose.Types.ObjectId(userId);

    await config.save();

    res.status(200).json({
      success: true,
      message: `Configuration '${cleanKey}' updated successfully`,
      data: config
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Delete Config by Key
export const deleteConfigByKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const cleanKey = key.trim().toUpperCase();

    const config = await AdminConfig.findOneAndDelete({ configKey: cleanKey });
    if (!config) {
      res.status(404).json({ success: false, message: `Configuration key '${cleanKey}' not found` });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Configuration '${cleanKey}' deleted successfully`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Toggle System Maintenance Mode
export const toggleMaintenanceMode = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const { enabled, message, estimatedDuration } = req.body;

    const config = await AdminConfig.findOneAndUpdate(
      { configKey: 'PLATFORM_MAINTENANCE_MODE' },
      {
        $set: {
          configKey: 'PLATFORM_MAINTENANCE_MODE',
          configValue: {
            enabled,
            message: message || 'NATUREX Platform is currently undergoing scheduled maintenance.',
            estimatedDuration: estimatedDuration || '30 minutes',
            toggledAt: new Date()
          },
          category: 'system',
          description: 'Global master switch to put platform in maintenance mode',
          isPublic: true,
          updatedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Maintenance mode ${enabled ? 'ENABLED' : 'DISABLED'}`,
      data: config.configValue
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. System Health & Infrastructure Check
export const getSystemHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap: Record<number, string> = {
      0: 'Disconnected',
      1: 'Connected (Healthy)',
      2: 'Connecting',
      3: 'Disconnecting'
    };

    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      success: true,
      status: 'OPERATIONAL',
      service: 'NATUREX Climate & Nature Platform Core API',
      timestamp: new Date().toISOString(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
        },
        database: {
          status: dbStatusMap[dbState] || 'Unknown',
          readyState: dbState
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Seed Production Master Configs
export const seedMasterConfigs = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    const defaultConfigs = [
      {
        configKey: 'PLATFORM_DEFAULT_CURRENCY',
        configValue: 'INR',
        category: 'payout_rules',
        description: 'Default settlement currency for carbon benefits and payouts',
        isPublic: true
      },
      {
        configKey: 'FEATURE_SATELLITE_MRV_AUTO_CALC',
        configValue: true,
        category: 'feature_flags',
        description: 'Enable automated Sentinel-2 NDVI vegetative delta computation in MRV pipeline',
        isPublic: true
      },
      {
        configKey: 'PAYOUT_MIN_THRESHOLD_INR',
        configValue: 500,
        category: 'payout_rules',
        description: 'Minimum threshold in INR required to disburse direct bank payouts',
        isPublic: true
      },
      {
        configKey: 'PLATFORM_SUPPORT_EMAIL',
        configValue: 'support@naturex.earth',
        category: 'system',
        description: 'Primary customer support helpdesk contact email',
        isPublic: true
      },
      {
        configKey: 'PLATFORM_MAINTENANCE_MODE',
        configValue: { enabled: false },
        category: 'system',
        description: 'Global master switch to put platform in maintenance mode',
        isPublic: true
      }
    ];

    const results: any[] = [];
    for (const c of defaultConfigs) {
      const doc = await AdminConfig.findOneAndUpdate(
        { configKey: c.configKey },
        {
          $set: {
            ...c,
            updatedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined
          }
        },
        { new: true, upsert: true }
      );
      results.push(doc);
    }

    res.status(200).json({
      success: true,
      message: `Successfully seeded ${results.length} master configurations`,
      count: results.length,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
