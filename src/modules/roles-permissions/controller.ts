import { Request, Response } from 'express';
import { Role } from './model';

export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: roles.length, data: roles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, key, description, permissions } = req.body;
    const role = await Role.create({ name, key, description, permissions });
    res.status(201).json({ success: true, message: 'Role created', data: role });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
