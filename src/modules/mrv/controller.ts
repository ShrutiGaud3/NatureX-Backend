import { Response } from 'express';
import mongoose from 'mongoose';
import { MrvRecord, MrvStatus } from './model';
import { Project } from '../projects/model';
import { Land } from '../lands/model';
import { AuthRequest } from '../auth/middleware';

// Helper to generate unique MRV code e.g. MRV-2024-7712
const generateMrvCode = (): string => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MRV-${year}-${randomSuffix}`;
};

// 1. Create MRV Report
export const createMrvRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      landParcelIds = [],
      monitoringCycleNumber = 1,
      reportingPeriod,
      methodology,
      remoteSensingData,
      quantification = {},
      evidenceIds = [],
      fieldVisitIds = [],
      notes
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project record not found.' });
      return;
    }

    const mrvCode = generateMrvCode();

    const baselineGrossImpact = Number(quantification.baselineGrossImpact) || 0;
    const reportingGrossImpact = Number(quantification.reportingGrossImpact) || 0;
    const grossDeltaImpact = reportingGrossImpact - baselineGrossImpact;

    const leakageDeductionPercent = Number(quantification.leakageDeductionPercent) || 5;
    const uncertaintyBufferPercent = Number(quantification.uncertaintyBufferPercent) || 10;
    const deductionFactor = Math.max(0, 1 - (leakageDeductionPercent + uncertaintyBufferPercent) / 100);

    const netClaimableCredits = Math.max(0, parseFloat((grossDeltaImpact * deductionFactor).toFixed(2)));

    const record = await MrvRecord.create({
      mrvCode,
      projectId,
      landParcelIds,
      monitoringCycleNumber,
      reportingPeriod: {
        startDate: new Date(reportingPeriod.startDate),
        endDate: new Date(reportingPeriod.endDate)
      },
      methodology,
      remoteSensingData: remoteSensingData ? {
        satelliteSource: remoteSensingData.satelliteSource || 'Sentinel-2',
        meanNdvi: Number(remoteSensingData.meanNdvi) || 0,
        baselineNdvi: Number(remoteSensingData.baselineNdvi) || 0,
        ndviDelta: parseFloat(((Number(remoteSensingData.meanNdvi) || 0) - (Number(remoteSensingData.baselineNdvi) || 0)).toFixed(3)),
        vegetationCoverPercent: remoteSensingData.vegetationCoverPercent,
        cloudCoverPercent: remoteSensingData.cloudCoverPercent,
        imageryDate: remoteSensingData.imageryDate ? new Date(remoteSensingData.imageryDate) : new Date()
      } : undefined,
      quantification: {
        baselineGrossImpact,
        reportingGrossImpact,
        grossDeltaImpact,
        leakageDeductionPercent,
        uncertaintyBufferPercent,
        netClaimableCredits,
        unit: quantification.unit || 'tCO2e'
      },
      evidenceIds,
      fieldVisitIds,
      submittedBy: req.user?.id,
      notes,
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      message: 'MRV Report created successfully.',
      data: record
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Remote Sensing & Carbon Delta Calculation Engine
export const calculateRemoteSensingDelta = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      satelliteSource = 'Sentinel-2',
      baselineNdvi = 0.38,
      currentNdvi = 0.65,
      totalAreaInAcres = 10.0,
      sequestrationFactorPerAcrePerNdviUnit = 4.2
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    const ndviDelta = parseFloat((currentNdvi - baselineNdvi).toFixed(3));
    const vegetationCoverPercent = parseFloat(Math.min(100, Math.max(0, currentNdvi * 125)).toFixed(1));

    // Biomass growth estimation
    const estimatedGrossSequestration = parseFloat(
      (ndviDelta * totalAreaInAcres * sequestrationFactorPerAcrePerNdviUnit).toFixed(2)
    );

    const leakageDeduction = 5; // 5%
    const bufferDeduction = 10; // 10%
    const claimableCredits = parseFloat(
      (estimatedGrossSequestration * (1 - (leakageDeduction + bufferDeduction) / 100)).toFixed(2)
    );

    res.status(200).json({
      success: true,
      message: 'Satellite remote sensing carbon calculation completed.',
      calculation: {
        satelliteSource,
        baselineNdvi,
        currentNdvi,
        ndviDelta,
        vegetationCoverPercent,
        totalAreaInAcres,
        estimatedGrossCarbonSequestration_tCO2e: estimatedGrossSequestration,
        deductions: {
          leakageDeductionPercent: leakageDeduction,
          uncertaintyBufferPercent: bufferDeduction
        },
        netClaimableCredits_tCO2e: claimableCredits
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. List All MRV Reports with Dynamic Filters & Pagination
export const listMrvReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      projectId,
      status,
      cycleNumber,
      methodology,
      page = '1',
      limit = '20'
    } = req.query;

    const filter: any = {};

    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;
    if (cycleNumber) filter.monitoringCycleNumber = Number(cycleNumber);
    if (methodology) filter.methodology = { $regex: String(methodology), $options: 'i' };

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      MrvRecord.find(filter)
        .populate('projectId', 'name code projectType standard status')
        .populate('landParcelIds', 'landName village district areaInAcres')
        .populate('submittedBy', 'fullName phone role')
        .sort({ monitoringCycleNumber: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      MrvRecord.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Project MRV Monitoring History
export const getProjectMrvHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const records = await MrvRecord.find({ projectId: req.params.projectId })
      .populate('projectId', 'name code projectType')
      .populate('submittedBy', 'fullName phone role')
      .populate('verificationDetails.verifierId', 'fullName phone role')
      .sort({ monitoringCycleNumber: 1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get MRV Report Details by ID
export const getMrvById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const record = await MrvRecord.findById(req.params.id)
      .populate('projectId', 'name code projectType standard status creditingPeriodYears')
      .populate('landParcelIds')
      .populate('evidenceIds')
      .populate('fieldVisitIds')
      .populate('submittedBy', 'fullName phone role')
      .populate('verificationDetails.verifierId', 'fullName phone role');

    if (!record) {
      res.status(404).json({ success: false, message: 'MRV report record not found.' });
      return;
    }

    res.status(200).json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Submit MRV Report for Verification
export const submitForVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const record = await MrvRecord.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: 'submitted',
          submittedAt: new Date()
        }
      },
      { new: true }
    );

    if (!record) {
      res.status(404).json({ success: false, message: 'MRV report record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'MRV Report submitted for independent verification.',
      data: record
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Review MRV Report (Admin / VVB Auditor Verification)
export const reviewMrvRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, auditOpinion = 'unqualified_pass', verifierOrganization, statementUrl, notes } = req.body;

    const statusMap: Record<string, MrvStatus> = {
      verify: 'verified',
      reject: 'rejected',
      clarify: 'clarification_required',
      under_review: 'under_review'
    };

    const targetStatus = statusMap[action] || 'verified';

    const updateData: any = {
      status: targetStatus,
      verificationDetails: {
        verifierId: req.user?.id,
        verifierOrganization: verifierOrganization || 'NatureX Technical Audit Panel',
        verifiedAt: new Date(),
        statementUrl,
        auditOpinion: targetStatus === 'verified' ? auditOpinion : undefined,
        notes: notes ? notes.trim() : undefined
      }
    };

    const record = await MrvRecord.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!record) {
      res.status(404).json({ success: false, message: 'MRV report record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `MRV report audit status updated to '${targetStatus}'.`,
      data: record
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Update MRV Report Draft
export const updateMrvReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { methodology, remoteSensingData, quantification, notes } = req.body;
    const updateData: any = {};

    if (methodology) updateData.methodology = methodology;
    if (remoteSensingData) updateData.remoteSensingData = remoteSensingData;
    if (notes !== undefined) updateData.notes = notes;

    if (quantification) {
      const baselineGrossImpact = Number(quantification.baselineGrossImpact) || 0;
      const reportingGrossImpact = Number(quantification.reportingGrossImpact) || 0;
      const grossDeltaImpact = reportingGrossImpact - baselineGrossImpact;
      const leakageDeductionPercent = Number(quantification.leakageDeductionPercent) || 5;
      const uncertaintyBufferPercent = Number(quantification.uncertaintyBufferPercent) || 10;
      const deductionFactor = Math.max(0, 1 - (leakageDeductionPercent + uncertaintyBufferPercent) / 100);
      const netClaimableCredits = Math.max(0, parseFloat((grossDeltaImpact * deductionFactor).toFixed(2)));

      updateData.quantification = {
        baselineGrossImpact,
        reportingGrossImpact,
        grossDeltaImpact,
        leakageDeductionPercent,
        uncertaintyBufferPercent,
        netClaimableCredits,
        unit: quantification.unit || 'tCO2e'
      };
    }

    const record = await MrvRecord.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!record) {
      res.status(404).json({ success: false, message: 'MRV report record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'MRV report draft updated successfully.',
      data: record
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Delete MRV Report
export const deleteMrvReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deleted = await MrvRecord.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'MRV report record not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'MRV report deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Aggregate MRV Quantification Statistics
export const getMrvStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const matchQuery: any = {};

    if (projectId && projectId !== 'all') {
      matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
    }

    const [statusStats, impactTotals, totalRecords] = await Promise.all([
      MrvRecord.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      MrvRecord.aggregate([
        { $match: { ...matchQuery, status: 'verified' } },
        {
          $group: {
            _id: null,
            totalGrossDelta: { $sum: '$quantification.grossDeltaImpact' },
            totalVerifiedCredits: { $sum: '$quantification.netClaimableCredits' }
          }
        }
      ]),
      MrvRecord.countDocuments(matchQuery)
    ]);

    const verifiedImpact = impactTotals[0] || { totalGrossDelta: 0, totalVerifiedCredits: 0 };

    res.status(200).json({
      success: true,
      totalRecords,
      totalVerifiedCredits: verifiedImpact.totalVerifiedCredits,
      totalGrossDelta: verifiedImpact.totalGrossDelta,
      byStatus: statusStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

