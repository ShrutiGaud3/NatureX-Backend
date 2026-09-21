import { Response } from 'express';
import { ReportSnapshot } from './model';
import { AuthRequest } from '../auth/middleware';
import { User } from '../users/model';
import { Land } from '../lands/model';
import { Project } from '../projects/model';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLands = await Land.countDocuments();
    const approvedLands = await Land.countDocuments({ status: 'approved' });
    const totalProjects = await Project.countDocuments();
    const carbonProjects = await Project.countDocuments({ projectType: 'carbon' });
    const waterProjects = await Project.countDocuments({ projectType: 'water' });
    const biodiversityProjects = await Project.countDocuments({ projectType: 'biodiversity' });

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers },
        lands: { total: totalLands, approved: approvedLands },
        projects: {
          total: totalProjects,
          byType: {
            carbon: carbonProjects,
            water: waterProjects,
            biodiversity: biodiversityProjects
          }
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reportType, periodStart, periodEnd, summaryData } = req.body;
    const report = await ReportSnapshot.create({
      reportType,
      periodStart,
      periodEnd,
      summaryData,
      generatedBy: req.user?.id
    });
    res.status(201).json({ success: true, message: 'Report generated successfully', data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
