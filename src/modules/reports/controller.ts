import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ReportSnapshot } from './model';
import { User } from '../users/model';
import { Land } from '../lands/model';
import { Project } from '../projects/model';
import { BenefitLedger } from '../benefits/model';
import { MrvRecord } from '../mrv/model';
import { FieldVisit } from '../field-visits/model';
import { FieldTask } from '../field-tasks/model';

const generateReportCode = (prefix: string = 'RPT'): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${year}-${rand}`;
};

// 1. Executive Analytics Dashboard Overview
export const getExecutiveDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      usersByRole,
      landsStats,
      projectsStats,
      financialsStats,
      mrvStats,
      fieldOpsStats
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Land.aggregate([
        {
          $group: {
            _id: null,
            totalLands: { $sum: 1 },
            totalAcreage: { $sum: '$areaInAcres' },
            approvedLands: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            approvedAcreage: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$areaInAcres', 0] }
            }
          }
        }
      ]),
      Project.aggregate([
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            totalEstimatedCredits: { $sum: '$impactMetrics.estimated' }
          }
        }
      ]),
      BenefitLedger.aggregate([
        {
          $group: {
            _id: null,
            totalObligations: { $sum: '$amount' },
            totalDisbursed: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] }
            },
            pendingDisbursals: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['pending', 'approved', 'initiated', 'processing']] },
                  '$amount',
                  0
                ]
              }
            }
          }
        }
      ]),
      MrvRecord.aggregate([
        {
          $group: {
            _id: null,
            totalAssessments: { $sum: 1 },
            verifiedAssessments: {
              $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
            },
            totalNetCarbonDelta: { $sum: '$quantification.netImpactCreditable' }
          }
        }
      ]),
      Promise.all([
        FieldVisit.countDocuments(),
        FieldVisit.countDocuments({ status: 'completed' }),
        FieldTask.countDocuments(),
        FieldTask.countDocuments({ status: 'completed' })
      ])
    ]);

    const lands = landsStats[0] || { totalLands: 0, totalAcreage: 0, approvedLands: 0, approvedAcreage: 0 };
    const projects = projectsStats[0] || { totalProjects: 0, activeProjects: 0, totalEstimatedCredits: 0 };
    const financials = financialsStats[0] || { totalObligations: 0, totalDisbursed: 0, pendingDisbursals: 0 };
    const mrv = mrvStats[0] || { totalAssessments: 0, verifiedAssessments: 0, totalNetCarbonDelta: 0 };

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          byRole: usersByRole
        },
        lands,
        projects,
        financials,
        mrv,
        fieldOperations: {
          totalVisits: fieldOpsStats[0],
          completedVisits: fieldOpsStats[1],
          totalTasks: fieldOpsStats[2],
          completedTasks: fieldOpsStats[3]
        },
        platformGeneratedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Dynamically Generate Report Snapshot
export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const { reportType, title, format = 'json', periodStart, periodEnd, filters = {} } = req.body;

    let summaryMetrics: any = {};
    let detailedData: any[] = [];

    const dateFilter: any = {};
    if (periodStart && periodEnd) {
      dateFilter.createdAt = { $gte: new Date(periodStart), $lte: new Date(periodEnd) };
    }

    if (reportType === 'executive_summary') {
      const [userCount, landCount, projectCount, benefitSum] = await Promise.all([
        User.countDocuments(),
        Land.countDocuments(),
        Project.countDocuments(),
        BenefitLedger.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
      ]);
      summaryMetrics = {
        totalUsers: userCount,
        totalLands: landCount,
        totalProjects: projectCount,
        totalBenefitsAllocated: benefitSum[0]?.total || 0
      };
      detailedData = await Project.find().select('name projectType standard status creditingPeriodYears').lean();
    } else if (reportType === 'land_registry') {
      const query: any = { ...dateFilter };
      if (filters.state) query.state = new RegExp(filters.state, 'i');
      if (filters.status) query.status = filters.status;

      detailedData = await Land.find(query)
        .populate('userId', 'fullName phone')
        .select('landName village district state areaInAcres status ownershipType')
        .lean();

      const totalAcreage = detailedData.reduce((acc: number, curr: any) => acc + (curr.areaInAcres || 0), 0);
      summaryMetrics = {
        totalParcels: detailedData.length,
        totalAcreage,
        averagePlotSize: detailedData.length > 0 ? parseFloat((totalAcreage / detailedData.length).toFixed(2)) : 0
      };
    } else if (reportType === 'financial_payout') {
      const query: any = { ...dateFilter };
      if (filters.projectId) query.projectId = filters.projectId;
      if (filters.status) query.status = filters.status;

      detailedData = await BenefitLedger.find(query)
        .populate('userId', 'fullName phone')
        .populate('projectId', 'name projectType')
        .select('transactionCode amount currency benefitType status deductions payoutDetails createdAt')
        .lean();

      const totalGross = detailedData.reduce((acc: number, curr: any) => acc + curr.amount, 0);
      const totalPaid = detailedData
        .filter((d: any) => d.status === 'paid')
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

      summaryMetrics = {
        totalTransactions: detailedData.length,
        totalGrossAmount: totalGross,
        totalPaidAmount: totalPaid,
        totalPendingAmount: totalGross - totalPaid
      };
    } else if (reportType === 'carbon_impact' || reportType === 'mrv_audit') {
      const query: any = { ...dateFilter };
      if (filters.projectId) query.projectId = filters.projectId;

      detailedData = await MrvRecord.find(query)
        .populate('projectId', 'name projectType standard')
        .select('mrvCode reportingPeriod methodology quantification status')
        .lean();

      const totalCredits = detailedData.reduce(
        (acc: number, curr: any) => acc + (curr.quantification?.netImpactCreditable || 0),
        0
      );
      summaryMetrics = {
        totalAssessments: detailedData.length,
        totalNetCreditsIssued: totalCredits
      };
    } else {
      // Default: project_funnel
      detailedData = await Project.find(dateFilter)
        .populate('landId', 'landName state areaInAcres')
        .lean();

      summaryMetrics = {
        totalProjects: detailedData.length,
        activeProjects: detailedData.filter((p: any) => p.status === 'active').length
      };
    }

    const reportCode = generateReportCode();

    const report = await ReportSnapshot.create({
      reportCode,
      title,
      reportType,
      format,
      periodStart: periodStart ? new Date(periodStart) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
      filters,
      summaryMetrics,
      detailedData,
      status: 'ready',
      generatedBy: new mongoose.Types.ObjectId(userId)
    });

    res.status(201).json({
      success: true,
      message: 'Report snapshot generated successfully',
      data: report
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. List Generated Reports
export const listReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      reportType,
      status,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    if (reportType) query.reportType = reportType;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { reportCode: { $regex: search as string, $options: 'i' } },
        { title: { $regex: search as string, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [reports, total] = await Promise.all([
      ReportSnapshot.find(query)
        .select('-detailedData')
        .populate('generatedBy', 'fullName email role')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      ReportSnapshot.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: reports
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Report Details by ID
export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid report ID' });
      return;
    }

    const report = await ReportSnapshot.findById(id).populate(
      'generatedBy',
      'fullName email phone role'
    );

    if (!report) {
      res.status(404).json({ success: false, message: 'Report snapshot not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Export Report Data (CSV or JSON output)
export const exportReportData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid report ID' });
      return;
    }

    const report = await ReportSnapshot.findById(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    if (format === 'csv') {
      const data = report.detailedData || [];
      if (data.length === 0) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${report.reportCode}.csv"`);
        res.status(200).send('No data available');
        return;
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row: any) =>
        Object.values(row)
          .map((val: any) => `"${typeof val === 'object' ? JSON.stringify(val).replace(/"/g, '""') : val}"`)
          .join(',')
      );
      const csvContent = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${report.reportCode}.csv"`);
      res.status(200).send(csvContent);
      return;
    }

    res.status(200).json({
      success: true,
      reportCode: report.reportCode,
      title: report.title,
      reportType: report.reportType,
      summaryMetrics: report.summaryMetrics,
      data: report.detailedData
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Project Impact Analytics
export const getProjectImpactReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const [benefits, mrvList] = await Promise.all([
      BenefitLedger.find({ projectId: new mongoose.Types.ObjectId(projectId) }),
      MrvRecord.find({ projectId: new mongoose.Types.ObjectId(projectId) })
    ]);

    const totalDisbursed = benefits
      .filter((b: any) => b.status === 'paid')
      .reduce((sum: number, b: any) => sum + b.amount, 0);

    const totalCreditsSequestered = mrvList.reduce(
      (sum: number, m: any) => sum + (m.quantification?.netImpactCreditable || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project._id,
          code: project.code,
          name: project.name,
          projectType: project.projectType,
          standard: project.standard,
          status: project.status
        },
        impactMetrics: {
          totalCarbonOffset_tCO2e: totalCreditsSequestered,
          estimatedImpact: project.impactMetrics?.estimated || 0,
          verifiedImpact: project.impactMetrics?.verified || 0,
          impactUnit: project.impactMetrics?.unit || 'tCO2e',
          totalFarmersBenefitted: benefits.length,
          totalDisbursedPayoutsINR: totalDisbursed,
          sdgImpacts: [
            { sdg: 13, name: 'Climate Action', status: 'Active' },
            { sdg: 15, name: 'Life on Land', status: 'Active' },
            { sdg: 1, name: 'No Poverty', status: 'Active' }
          ]
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Delete Report Snapshot
export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid report ID' });
      return;
    }

    const report = await ReportSnapshot.findByIdAndDelete(id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Report snapshot deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
