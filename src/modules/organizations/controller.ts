import { Request, Response } from 'express';
import { Organization } from './model';
import { User } from '../users/model';
import { AuthRequest } from '../auth/middleware';
import { Land } from '../lands/model';
import { Project } from '../projects/model';

export const createOrg = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      type,
      registrationNumber,
      contactEmail,
      contactPhone,
      address,
      district,
      state,
      pincode,
      documents = []
    } = req.body;

    const org = await Organization.create({
      name,
      type,
      registrationNumber,
      contactEmail,
      contactPhone,
      address,
      district,
      state,
      pincode,
      documents,
      status: 'draft',
      createdBy: req.user?.id,
      members: [
        {
          userId: req.user?.id as any,
          role: 'admin',
          joinedAt: new Date()
        }
      ]
    });

    // Link organizationId to creating user
    await User.findByIdAndUpdate(req.user?.id, {
      $set: { organizationId: org._id, role: 'organization' }
    });

    res.status(201).json({
      success: true,
      message: 'Organization profile created in draft mode. Please submit for verification.',
      nextStep: 'organization_verification',
      data: org
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrganization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || !user.organizationId) {
      res.status(404).json({
        success: false,
        message: 'No organization associated with this account. Please create one.'
      });
      return;
    }

    const org = await Organization.findById(user.organizationId)
      .populate('createdBy', 'fullName phone')
      .populate('members.userId', 'fullName phone role status');

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found.' });
      return;
    }

    res.status(200).json({ success: true, data: org });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrgDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findById(req.params.id)
      .populate('createdBy', 'fullName phone')
      .populate('members.userId', 'fullName phone role status');

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    res.status(200).json({ success: true, data: org });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrg = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, registrationNumber, contactEmail, contactPhone, address, district, state, pincode, documents } = req.body;

    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          registrationNumber,
          contactEmail,
          contactPhone,
          address,
          district,
          state,
          pincode,
          documents
        }
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: org
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitOrgForVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'submitted' } },
      { new: true }
    );

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Organization submitted for Super Admin verification successfully.',
      nextStep: 'admin_verification_pending',
      data: org
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrgDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orgId = req.params.id;
    const org = await Organization.findById(orgId);

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    const totalLands = await Land.countDocuments({ organizationId: orgId });
    const totalProjects = await Project.countDocuments({ organizationId: orgId });

    res.status(200).json({
      success: true,
      data: {
        organization: {
          id: org._id,
          name: org.name,
          type: org.type,
          status: org.status
        },
        kpis: {
          totalFarmers: org.associatedFarmers.length,
          activeFarmers: org.associatedFarmers.filter((f) => f.status === 'active').length,
          totalTeamMembers: org.members.length,
          totalLands,
          totalProjects
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const inviteFarmer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, fullName, village } = req.body;
    const cleanPhone = phone.trim();
    const org = await Organization.findById(req.params.id);

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    // Check if farmer already invited/associated
    const alreadyExists = org.associatedFarmers.some((f) => f.phone === cleanPhone);
    if (alreadyExists) {
      res.status(400).json({ success: false, message: `Farmer with mobile ${cleanPhone} is already in this organization.` });
      return;
    }

    // Check if user already registered on NatureX
    const existingUser = await User.findOne({ phone: cleanPhone });
    let farmerStatus: 'active' | 'invited' = 'invited';

    if (existingUser) {
      farmerStatus = 'active';
      existingUser.organizationId = org._id as any;
      await existingUser.save();
    }

    org.associatedFarmers.push({
      farmerId: existingUser ? (existingUser._id as any) : undefined,
      phone: cleanPhone,
      fullName: fullName || existingUser?.fullName,
      village: village || existingUser?.village,
      status: farmerStatus,
      invitedAt: new Date(),
      joinedAt: existingUser ? new Date() : undefined
    });

    await org.save();

    res.status(201).json({
      success: true,
      message: existingUser
        ? `Farmer ${cleanPhone} is an existing NATUREX user and has been directly linked!`
        : `Invitation recorded for farmer ${cleanPhone}. They will be linked when they login.`,
      data: org.associatedFarmers[org.associatedFarmers.length - 1]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkImportFarmers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { farmers } = req.body;
    const org = await Organization.findById(req.params.id);

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const f of farmers) {
      const cleanPhone = String(f.phone).trim();
      const alreadyExists = org.associatedFarmers.some((item) => item.phone === cleanPhone);
      if (alreadyExists) {
        skippedCount++;
        continue;
      }

      const existingUser = await User.findOne({ phone: cleanPhone });
      if (existingUser) {
        existingUser.organizationId = org._id as any;
        await existingUser.save();
      }

      org.associatedFarmers.push({
        farmerId: existingUser ? (existingUser._id as any) : undefined,
        phone: cleanPhone,
        fullName: f.fullName || existingUser?.fullName,
        village: f.village || existingUser?.village,
        status: existingUser ? 'active' : 'invited',
        invitedAt: new Date(),
        joinedAt: existingUser ? new Date() : undefined
      });

      addedCount++;
    }

    await org.save();

    res.status(200).json({
      success: true,
      message: `Bulk import completed: ${addedCount} farmers imported, ${skippedCount} duplicates skipped.`,
      data: {
        addedCount,
        skippedCount,
        totalFarmers: org.associatedFarmers.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrgFarmers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    res.status(200).json({
      success: true,
      count: org.associatedFarmers.length,
      data: org.associatedFarmers
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, role = 'project_manager' } = req.body;
    const cleanPhone = phone.trim();
    const org = await Organization.findById(req.params.id);

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    // Find or create user account for team member
    let memberUser = await User.findOne({ phone: cleanPhone });
    if (!memberUser) {
      memberUser = await User.create({
        phone: cleanPhone,
        role: 'organization',
        status: 'active',
        organizationId: org._id
      });
    } else {
      memberUser.organizationId = org._id as any;
      await memberUser.save();
    }

    const alreadyMember = org.members.some((m) => m.userId.toString() === memberUser?._id.toString());
    if (alreadyMember) {
      res.status(400).json({ success: false, message: 'User is already a team member of this organization.' });
      return;
    }

    org.members.push({
      userId: memberUser._id as any,
      role,
      joinedAt: new Date()
    });

    await org.save();

    res.status(201).json({
      success: true,
      message: `Team member with role '${role}' added successfully.`,
      data: {
        userId: memberUser._id,
        phone: memberUser.phone,
        role,
        joinedAt: new Date()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrgMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const org = await Organization.findById(req.params.id).populate('members.userId', 'fullName phone role status');
    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    res.status(200).json({
      success: true,
      count: org.members.length,
      data: org.members
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const org = await Organization.findById(id);

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    org.members = org.members.filter((m) => m.userId.toString() !== memberId);
    await org.save();

    // Unset user's organizationId
    await User.findByIdAndUpdate(memberId, { $unset: { organizationId: 1 } });

    res.status(200).json({
      success: true,
      message: 'Team member removed successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Super Admin Endpoints
export const getAdminOrgQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status = 'submitted' } = req.query;
    const orgs = await Organization.find({ status })
      .populate('createdBy', 'fullName phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orgs.length,
      data: orgs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminReviewOrg = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason, question } = req.body;

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      clarify: 'clarification',
      suspend: 'suspended'
    };

    const updateData: any = {
      status: statusMap[action],
      verifiedBy: req.user?.id,
      verifiedAt: new Date()
    };

    if (action === 'reject') updateData.rejectionReason = reason;
    if (action === 'clarify') updateData.clarificationReason = question;

    const org = await Organization.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Organization status updated to ${updateData.status}`,
      data: org
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
