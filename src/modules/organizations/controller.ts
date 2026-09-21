import { Response } from 'express';
import { Organization } from './model';
import { AuthRequest } from '../auth/middleware';

export const createOrg = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, registrationNumber, contactEmail, contactPhone, address, district, state } = req.body;
    const org = await Organization.create({
      name,
      type,
      registrationNumber,
      contactEmail,
      contactPhone,
      address,
      district,
      state,
      createdBy: req.user?.id,
      members: [{ userId: req.user?.id, role: 'admin', joinedAt: new Date() }]
    });

    res.status(201).json({ success: true, message: 'Organization created successfully', data: org });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrgDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }
    res.status(200).json({ success: true, data: org });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitForVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'submitted' } },
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Organization submitted for verification', data: org });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
