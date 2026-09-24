import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { VerificationCase } from './model';
import { Project } from '../projects/model';

const generateVerificationCode = (standard: string = 'naturex'): string => {
  const prefix = standard.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `VVB-${prefix}-${year}-${rand}`;
};

const generateCertificateNumber = (vintage: number): string => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `NCX-CERT-${vintage}-${rand}`;
};

// 1. Initiate Verification Case
export const createVerificationCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    const {
      projectId,
      assignedAgencyName,
      acvaRegistrationNumber,
      leadAuditorName,
      verifierUserId,
      verificationStandard = 'naturex_internal',
      auditType = 'hybrid',
      vintageYear = new Date().getFullYear(),
      monitoringPeriod,
      quantification,
      metadata
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid projectId' });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const verificationCode = generateVerificationCode(verificationStandard);

    const vCase = await VerificationCase.create({
      verificationCode,
      projectId: new mongoose.Types.ObjectId(projectId),
      assignedAgencyName,
      acvaRegistrationNumber,
      leadAuditorName,
      verifierUserId: verifierUserId
        ? new mongoose.Types.ObjectId(verifierUserId)
        : userId
        ? new mongoose.Types.ObjectId(userId)
        : undefined,
      verificationStandard,
      auditType,
      vintageYear,
      monitoringPeriod: {
        startDate: monitoringPeriod?.startDate ? new Date(monitoringPeriod.startDate) : undefined,
        endDate: monitoringPeriod?.endDate ? new Date(monitoringPeriod.endDate) : undefined
      },
      quantification: {
        claimedCredits: quantification?.claimedCredits || 0,
        verifiedCredits: 0,
        bufferDeductions: quantification?.bufferDeductions || 0,
        netIssuanceCredits: 0
      },
      status: 'initiated',
      isLocked: false,
      metadata
    });

    res.status(201).json({
      success: true,
      message: 'VVB verification case initiated successfully',
      data: vCase
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Verification Cases (Filtered & Paginated)
export const getVerificationCases = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      assignedAgencyName,
      verificationStandard,
      projectId,
      vintageYear,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (assignedAgencyName) query.assignedAgencyName = new RegExp(assignedAgencyName as string, 'i');
    if (verificationStandard) query.verificationStandard = verificationStandard;
    if (projectId) query.projectId = projectId;
    if (vintageYear) query.vintageYear = parseInt(vintageYear as string, 10);

    if (search) {
      query.$or = [
        { verificationCode: { $regex: search as string, $options: 'i' } },
        { assignedAgencyName: { $regex: search as string, $options: 'i' } },
        { certificateNumber: { $regex: search as string, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [cases, total] = await Promise.all([
      VerificationCase.find(query)
        .populate('projectId', 'name title projectCode standard status')
        .populate('verifierUserId', 'fullName email role phone')
        .populate('decisionBy', 'fullName email role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      VerificationCase.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: cases
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Verification Analytics & KPI Stats
export const getVerificationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [statusStats, standardStats, creditsStats] = await Promise.all([
      VerificationCase.aggregate([
        {
          $group: {
            _id: null,
            totalCases: { $sum: 1 },
            approvedCases: { $sum: { $cond: [{ $in: ['$status', ['approved', 'certified']] }, 1, 0] } },
            inAuditCases: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['initiated', 'desk_review', 'site_audit', 'report_submitted']] },
                  1,
                  0
                ]
              }
            },
            rejectedCases: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
          }
        }
      ]),
      VerificationCase.aggregate([
        { $group: { _id: '$verificationStandard', count: { $sum: 1 } } }
      ]),
      VerificationCase.aggregate([
        { $match: { status: { $in: ['approved', 'certified'] } } },
        {
          $group: {
            _id: null,
            totalVerifiedCredits: { $sum: '$quantification.verifiedCredits' },
            totalNetIssuanceCredits: { $sum: '$quantification.netIssuanceCredits' }
          }
        }
      ])
    ]);

    const summary = statusStats[0] || { totalCases: 0, approvedCases: 0, inAuditCases: 0, rejectedCases: 0 };
    const credits = creditsStats[0] || { totalVerifiedCredits: 0, totalNetIssuanceCredits: 0 };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          ...summary,
          totalVerifiedCreditsIssued: credits.totalVerifiedCredits,
          totalNetIssuanceCredits: credits.totalNetIssuanceCredits
        },
        byStandard: standardStats
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Verification Cases for Specific Project
export const getVerificationByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid projectId' });
      return;
    }

    const cases = await VerificationCase.find({ projectId: new mongoose.Types.ObjectId(projectId) })
      .populate('verifierUserId', 'fullName email role')
      .populate('decisionBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Single Verification Case Details by ID
export const getVerificationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid verification ID' });
      return;
    }

    const vCase = await VerificationCase.findById(id)
      .populate('projectId', 'name title projectCode standard status creditingPeriodYears')
      .populate('verifierUserId', 'fullName email role phone')
      .populate('decisionBy', 'fullName email role');

    if (!vCase) {
      res.status(404).json({ success: false, message: 'Verification case not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: vCase
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Update Verification Case Details (pre-approval)
export const updateVerificationCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      assignedAgencyName,
      leadAuditorName,
      auditType,
      vintageYear,
      monitoringPeriod,
      quantification,
      status
    } = req.body;

    const vCase = await VerificationCase.findById(id);
    if (!vCase) {
      res.status(404).json({ success: false, message: 'Verification case not found' });
      return;
    }

    if (assignedAgencyName) vCase.assignedAgencyName = assignedAgencyName;
    if (leadAuditorName) vCase.leadAuditorName = leadAuditorName;
    if (auditType) vCase.auditType = auditType;
    if (vintageYear) vCase.vintageYear = vintageYear;
    if (status) vCase.status = status;

    if (monitoringPeriod) {
      vCase.monitoringPeriod = {
        startDate: monitoringPeriod.startDate ? new Date(monitoringPeriod.startDate) : vCase.monitoringPeriod?.startDate,
        endDate: monitoringPeriod.endDate ? new Date(monitoringPeriod.endDate) : vCase.monitoringPeriod?.endDate
      };
    }

    if (quantification) {
      vCase.quantification = {
        ...vCase.quantification,
        ...quantification
      };
    }

    await vCase.save();

    res.status(200).json({
      success: true,
      message: 'Verification case updated successfully',
      data: vCase
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Submit VVB Audit Report
export const submitAuditReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { auditReportUrl, auditFindingsSummary } = req.body;

    const vCase = await VerificationCase.findById(id);
    if (!vCase) {
      res.status(404).json({ success: false, message: 'Verification case not found' });
      return;
    }

    vCase.auditReportUrl = auditReportUrl;
    if (auditFindingsSummary) vCase.auditFindingsSummary = auditFindingsSummary;
    vCase.status = 'report_submitted';

    await vCase.save();

    res.status(200).json({
      success: true,
      message: 'VVB Audit report submitted successfully',
      data: vCase
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Submit Final Approval / Rejection Decision
export const submitVerificationDecision = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    const {
      status,
      decisionNotes,
      verifiedCredits = 0,
      bufferDeductions = 0,
      externalRegistryReference
    } = req.body;

    const vCase = await VerificationCase.findById(id);
    if (!vCase) {
      res.status(404).json({ success: false, message: 'Verification case not found' });
      return;
    }

    const netIssuance = Math.max(0, verifiedCredits - bufferDeductions);

    vCase.status = status;
    vCase.decisionNotes = decisionNotes;
    vCase.decisionDate = new Date();
    vCase.decisionBy = userId ? new mongoose.Types.ObjectId(userId) : undefined;
    if (externalRegistryReference) vCase.externalRegistryReference = externalRegistryReference;

    if (status === 'approved') {
      vCase.quantification = {
        claimedCredits: vCase.quantification?.claimedCredits || 0,
        verifiedCredits,
        bufferDeductions,
        netIssuanceCredits: netIssuance
      };

      // Update associated Project status to approved/verified
      await Project.findByIdAndUpdate(vCase.projectId, {
        $set: {
          status: 'approved',
          'impactMetrics.verified': netIssuance,
          'impactMetrics.status': 'verified',
          'impactMetrics.lastUpdatedAt': new Date()
        }
      });
    }

    await vCase.save();

    res.status(200).json({
      success: true,
      message: `Verification decision recorded: ${status.toUpperCase()}`,
      data: vCase
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Issue Official Issuance Certificate
export const issueCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { certificateUrl, certificateNumber, externalRegistryReference } = req.body;

    const vCase = await VerificationCase.findById(id);
    if (!vCase) {
      res.status(404).json({ success: false, message: 'Verification case not found' });
      return;
    }

    if (vCase.status !== 'approved' && vCase.status !== 'certified') {
      res.status(400).json({
        success: false,
        message: `Cannot issue certificate for a verification case with status '${vCase.status}'. Case must be 'approved'.`
      });
      return;
    }

    const certNum = certificateNumber || generateCertificateNumber(vCase.vintageYear);
    const certUrl = certificateUrl || `https://registry.naturex.earth/certificates/${certNum}.pdf`;

    vCase.status = 'certified';
    vCase.certificateNumber = certNum;
    vCase.certificateUrl = certUrl;
    if (externalRegistryReference) vCase.externalRegistryReference = externalRegistryReference;
    vCase.isLocked = true;

    await vCase.save();

    res.status(200).json({
      success: true,
      message: 'Official Carbon Credit Issuance Certificate generated and locked',
      data: {
        verificationCode: vCase.verificationCode,
        certificateNumber: certNum,
        certificateUrl: certUrl,
        netIssuanceCredits: vCase.quantification?.netIssuanceCredits,
        isLocked: true
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Delete Verification Case (if not locked)
export const deleteVerificationCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vCase = await VerificationCase.findById(id);
    if (!vCase) {
      res.status(404).json({ success: false, message: 'Verification case not found' });
      return;
    }

    if (vCase.isLocked) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete a locked and certified verification case'
      });
      return;
    }

    await VerificationCase.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Verification case deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
