import { Request, Response } from 'express';
import { Role } from './model';
import { User } from '../users/model';
import { AuthRequest } from '../auth/middleware';

// Available System Permissions Catalog (Document Section 11 & 20)
export const SYSTEM_PERMISSIONS = [
  // User & Organization Permissions
  { category: 'Users', key: 'users:read', description: 'View user profiles and list' },
  { category: 'Users', key: 'users:manage', description: 'Create, update, and suspend users' },
  { category: 'Organizations', key: 'org:manage', description: 'Manage organization settings and members' },
  { category: 'Organizations', key: 'org:invite_farmer', description: 'Add and invite farmers to organization' },
  { category: 'KYC', key: 'kyc:view', description: 'View farmer KYC records' },
  { category: 'KYC', key: 'kyc:review', description: 'Approve, reject, and clarify KYC submissions' },

  // Land & GIS Permissions
  { category: 'Lands', key: 'lands:create', description: 'Register new land and draw boundaries' },
  { category: 'Lands', key: 'lands:view', description: 'View registered lands and polygons' },
  { category: 'Lands', key: 'lands:review', description: 'Screen and approve land records and conflicts' },

  // Projects & MRV Permissions
  { category: 'Projects', key: 'projects:create', description: 'Create and configure projects' },
  { category: 'Projects', key: 'projects:submit', description: 'Submit projects for admin review' },
  { category: 'Projects', key: 'projects:review', description: 'Screen, approve, and clarify projects' },
  { category: 'Evidence', key: 'evidence:upload', description: 'Upload geotagged field evidence' },
  { category: 'Evidence', key: 'evidence:approve', description: 'Approve or reject field evidence' },
  { category: 'Field Ops', key: 'field:assign', description: 'Assign field visits and tasks to agents' },
  { category: 'Field Ops', key: 'field:execute', description: 'Execute field visits and sync data' },
  { category: 'MRV', key: 'mrv:manage', description: 'Manage monitoring cycles and review findings' },
  { category: 'Verification', key: 'verification:manage', description: 'Assign ACVA verifier and record reports' },

  // Finance & Governance
  { category: 'Finance', key: 'finance:view', description: 'View financial rewards and ledgers' },
  { category: 'Finance', key: 'finance:settle', description: 'Approve and settle payouts' },
  { category: 'Reports', key: 'reports:view', description: 'Access KPI dashboards and reports' },
  { category: 'Audit', key: 'audit:view', description: 'Inspect immutable system audit logs' }
];

export const getPermissionsList = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      count: SYSTEM_PERMISSIONS.length,
      data: SYSTEM_PERMISSIONS
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 });
    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      res.status(404).json({ success: false, message: 'Role not found' });
      return;
    }
    res.status(200).json({ success: true, data: role });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, key, description, permissions = [] } = req.body;
    const cleanKey = key.trim().toLowerCase();

    const existingRole = await Role.findOne({ key: cleanKey });
    if (existingRole) {
      res.status(400).json({ success: false, message: `Role with key '${cleanKey}' already exists.` });
      return;
    }

    const role = await Role.create({
      name,
      key: cleanKey,
      description,
      permissions,
      isSystem: false,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, permissions, isActive } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      res.status(404).json({ success: false, message: 'Role not found' });
      return;
    }

    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;
    if (isActive !== undefined) role.isActive = isActive;

    await role.save();

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: role
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      res.status(404).json({ success: false, message: 'Role not found' });
      return;
    }

    if (role.isSystem) {
      res.status(400).json({
        success: false,
        message: 'System roles cannot be deleted.'
      });
      return;
    }

    await Role.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Role '${role.name}' deleted successfully.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Role '${role}' successfully assigned to user ${user.phone}`,
      data: {
        id: user._id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        status: user.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
