import { Request, Response } from 'express';
import { VerificationCase } from './model';

export const createVerificationCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, assignedAgencyName, acvaRegistrationNumber, verifierUserId } = req.body;
    const vCase = await VerificationCase.create({
      projectId,
      assignedAgencyName,
      acvaRegistrationNumber,
      verifierUserId,
      status: 'initiated'
    });
    res.status(201).json({ success: true, message: 'Verification case initiated', data: vCase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVerificationByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const vCase = await VerificationCase.findOne({ projectId: req.params.projectId });
    if (!vCase) {
      res.status(404).json({ success: false, message: 'Verification case not found for this project' });
      return;
    }
    res.status(200).json({ success: true, data: vCase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitVerificationDecision = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, auditReportUrl, externalRegistryReference, decisionNotes } = req.body;
    const vCase = await VerificationCase.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          auditReportUrl,
          externalRegistryReference,
          decisionNotes,
          decisionDate: new Date(),
          isLocked: true
        }
      },
      { new: true }
    );
    res.status(200).json({ success: true, message: `Verification decision recorded: ${status}`, data: vCase });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
