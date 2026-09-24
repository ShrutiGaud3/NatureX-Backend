import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Program, IProgramEnrollment } from './model';

const generateProgramCode = (type: string = 'carbon'): string => {
  const prefix = type.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PRG-${prefix}-${year}-${rand}`;
};

const generateEnrollmentCode = (): string => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ENR-${Date.now().toString(36).toUpperCase()}-${rand}`;
};

// 1. Create Program
export const createProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;
    const {
      programCode,
      name,
      sponsorName,
      description,
      programType,
      financials,
      eligibilityCriteria,
      targets,
      timeline,
      status
    } = req.body;

    const code = programCode || generateProgramCode(programType);

    // Check code uniqueness
    const existing = await Program.findOne({ programCode: code });
    if (existing) {
      res.status(400).json({ success: false, message: `Program code '${code}' already exists` });
      return;
    }

    const program = await Program.create({
      programCode: code,
      name,
      sponsorName,
      description,
      programType: programType || 'carbon_incentive',
      financials: {
        budgetTotal: financials?.budgetTotal || 0,
        disbursedAmount: financials?.disbursedAmount || 0,
        incentivePerAcre: financials?.incentivePerAcre || 0,
        incentivePerCredit: financials?.incentivePerCredit || 0,
        currency: financials?.currency || 'INR'
      },
      eligibilityCriteria: {
        minAcreage: eligibilityCriteria?.minAcreage ?? 0.5,
        maxAcreage: eligibilityCriteria?.maxAcreage ?? 100.0,
        allowedStates: eligibilityCriteria?.allowedStates || [],
        eligibleProjectTypes: eligibilityCriteria?.eligibleProjectTypes || [],
        requiredPractices: eligibilityCriteria?.requiredPractices || []
      },
      targets: {
        targetFarmers: targets?.targetFarmers || 100,
        enrolledFarmersCount: 0,
        targetAcreage: targets?.targetAcreage || 500,
        enrolledAcreage: 0
      },
      timeline: {
        startDate: timeline?.startDate ? new Date(timeline.startDate) : new Date(),
        endDate: timeline?.endDate ? new Date(timeline.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        enrollmentDeadline: timeline?.enrollmentDeadline ? new Date(timeline.enrollmentDeadline) : undefined
      },
      status: status || 'active',
      enrollments: [],
      createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Program created successfully',
      data: program
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get All Programs (Filtered & Paginated)
export const getPrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      programType,
      state,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (programType) {
      query.programType = programType;
    }

    if (state) {
      query['eligibilityCriteria.allowedStates'] = { $regex: new RegExp(state as string, 'i') };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { sponsorName: { $regex: search as string, $options: 'i' } },
        { programCode: { $regex: search as string, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [programs, total] = await Promise.all([
      Program.find(query)
        .populate('createdBy', 'fullName email phone organization')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Program.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: programs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Program Stats
export const getProgramStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await Program.aggregate([
      {
        $group: {
          _id: null,
          totalPrograms: { $sum: 1 },
          activePrograms: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalBudget: { $sum: '$financials.budgetTotal' },
          totalDisbursed: { $sum: '$financials.disbursedAmount' },
          totalTargetAcreage: { $sum: '$targets.targetAcreage' },
          totalEnrolledAcreage: { $sum: '$targets.enrolledAcreage' },
          totalEnrolledFarmers: { $sum: '$targets.enrolledFarmersCount' }
        }
      }
    ]);

    const result = stats[0] || {
      totalPrograms: 0,
      activePrograms: 0,
      totalBudget: 0,
      totalDisbursed: 0,
      totalTargetAcreage: 0,
      totalEnrolledAcreage: 0,
      totalEnrolledFarmers: 0
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get My Enrollments (Logged-in user)
export const getMyEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const programs = await Program.find({ 'enrollments.userId': userObjectId })
      .populate('enrollments.projectId', 'name title projectCode status standard')
      .populate('enrollments.landId', 'landName areaInAcres state district village surveyNumber')
      .lean();

    const userEnrollments: any[] = [];

    programs.forEach((prog) => {
      const myEnrolls = prog.enrollments.filter(
        (e: any) => e.userId.toString() === userId.toString()
      );
      myEnrolls.forEach((e: any) => {
        userEnrollments.push({
          ...e,
          program: {
            _id: prog._id,
            programCode: prog.programCode,
            name: prog.name,
            sponsorName: prog.sponsorName,
            programType: prog.programType,
            financials: prog.financials,
            status: prog.status
          }
        });
      });
    });

    res.status(200).json({
      success: true,
      count: userEnrollments.length,
      data: userEnrollments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Program By ID
export const getProgramById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid program ID' });
      return;
    }

    const program = await Program.findById(id)
      .populate('createdBy', 'fullName email phone organization')
      .populate('enrollments.userId', 'fullName email phone')
      .populate('enrollments.projectId', 'name title projectCode status standard')
      .populate('enrollments.landId', 'landName areaInAcres state district village surveyNumber')
      .populate('enrollments.verifiedBy', 'fullName email');

    if (!program) {
      res.status(404).json({ success: false, message: 'Program not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: program
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Update Program
export const updateProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid program ID' });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ success: false, message: 'Program not found' });
      return;
    }

    if (updates.name) program.name = updates.name;
    if (updates.sponsorName) program.sponsorName = updates.sponsorName;
    if (updates.description !== undefined) program.description = updates.description;
    if (updates.programType) program.programType = updates.programType;
    if (updates.status) program.status = updates.status;

    if (updates.financials) {
      program.financials = {
        ...program.financials,
        ...updates.financials
      };
    }

    if (updates.eligibilityCriteria) {
      program.eligibilityCriteria = {
        ...program.eligibilityCriteria,
        ...updates.eligibilityCriteria
      };
    }

    if (updates.targets) {
      program.targets = {
        ...program.targets,
        ...updates.targets
      };
    }

    if (updates.timeline) {
      if (updates.timeline.startDate) program.timeline.startDate = new Date(updates.timeline.startDate);
      if (updates.timeline.endDate) program.timeline.endDate = new Date(updates.timeline.endDate);
      if (updates.timeline.enrollmentDeadline !== undefined) {
        program.timeline.enrollmentDeadline = updates.timeline.enrollmentDeadline
          ? new Date(updates.timeline.enrollmentDeadline)
          : undefined;
      }
    }

    await program.save();

    res.status(200).json({
      success: true,
      message: 'Program updated successfully',
      data: program
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Delete Program
export const deleteProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid program ID' });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ success: false, message: 'Program not found' });
      return;
    }

    const hasActiveEnrollments = program.enrollments.some((e) =>
      ['applied', 'verified', 'active'].includes(e.status)
    );

    if (hasActiveEnrollments) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete program with active enrollments. Please update status to closed instead.'
      });
      return;
    }

    await Program.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Program deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Enroll in Program
export const enrollInProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const { projectId, landId, enrolledAcreage, userId } = req.body;

    const program = (req as any).program || (await Program.findById(id));
    if (!program) {
      res.status(404).json({ success: false, message: 'Program not found' });
      return;
    }

    // Target beneficiary user (farmer ID from auth, or specified by developer/agent)
    const beneficiaryId = userId || user?.id || user?._id;

    const enrollmentCode = generateEnrollmentCode();
    const newEnrollment: IProgramEnrollment = {
      enrollmentCode,
      userId: new mongoose.Types.ObjectId(beneficiaryId),
      projectId: new mongoose.Types.ObjectId(projectId),
      landId: new mongoose.Types.ObjectId(landId),
      enrolledAcreage,
      status: 'applied',
      appliedAt: new Date(),
      totalPayoutEarned: 0
    };

    program.enrollments.push(newEnrollment);

    // Update targets
    program.targets.enrolledAcreage = (program.targets.enrolledAcreage || 0) + enrolledAcreage;
    program.targets.enrolledFarmersCount = (program.targets.enrolledFarmersCount || 0) + 1;

    await program.save();

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in program',
      data: {
        programId: program._id,
        programName: program.name,
        enrollment: newEnrollment
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Review Enrollment Status & Award Payouts
export const reviewEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, enrollmentCode } = req.params;
    const reviewer = (req as any).user;
    const reviewerId = reviewer?.id || reviewer?._id;
    const { status, rejectionReason, totalPayoutEarned } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid program ID' });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ success: false, message: 'Program not found' });
      return;
    }

    const enrollmentIndex = program.enrollments.findIndex(
      (e) => e.enrollmentCode === enrollmentCode
    );

    if (enrollmentIndex === -1) {
      res.status(404).json({ success: false, message: 'Enrollment record not found' });
      return;
    }

    const enrollment = program.enrollments[enrollmentIndex];
    enrollment.status = status;
    enrollment.verifiedAt = new Date();
    if (reviewerId) {
      enrollment.verifiedBy = new mongoose.Types.ObjectId(reviewerId);
    }

    if (status === 'rejected') {
      enrollment.rejectionReason = rejectionReason;
    } else {
      enrollment.rejectionReason = undefined;
    }

    if (totalPayoutEarned !== undefined) {
      const payoutDiff = totalPayoutEarned - (enrollment.totalPayoutEarned || 0);
      enrollment.totalPayoutEarned = totalPayoutEarned;
      program.financials.disbursedAmount = (program.financials.disbursedAmount || 0) + payoutDiff;
    }

    await program.save();

    res.status(200).json({
      success: true,
      message: `Enrollment status updated to '${status}' successfully`,
      data: {
        programId: program._id,
        enrollment
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Withdraw / Remove Enrollment
export const withdrawEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, enrollmentCode } = req.params;
    const user = (req as any).user;
    const userId = user?.id || user?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid program ID' });
      return;
    }

    const program = await Program.findById(id);
    if (!program) {
      res.status(404).json({ success: false, message: 'Program not found' });
      return;
    }

    const enrollment = program.enrollments.find((e) => e.enrollmentCode === enrollmentCode);
    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Enrollment not found' });
      return;
    }

    // Only allow owner or admin to withdraw
    const isOwner = userId && enrollment.userId && enrollment.userId.toString() === userId.toString();
    const isAdmin =
      user.roles?.includes('admin') ||
      user.role === 'admin' ||
      user.roles?.includes('super_admin') ||
      user.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Access denied: You can only withdraw your own enrollment' });
      return;
    }

    if (['completed'].includes(enrollment.status)) {
      res.status(400).json({ success: false, message: 'Cannot withdraw a completed enrollment' });
      return;
    }

    enrollment.status = 'withdrawn';
    program.targets.enrolledAcreage = Math.max(0, (program.targets.enrolledAcreage || 0) - enrollment.enrolledAcreage);
    program.targets.enrolledFarmersCount = Math.max(0, (program.targets.enrolledFarmersCount || 0) - 1);

    await program.save();

    res.status(200).json({
      success: true,
      message: 'Enrollment withdrawn successfully',
      data: enrollment
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
