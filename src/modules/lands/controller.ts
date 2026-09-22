import { Response } from 'express';
import { Land } from './model';
import { AuthRequest } from '../auth/middleware';

const CONVERSION_ACRES_TO_HA = 0.404686;
const CONVERSION_ACRES_TO_SQM = 4046.86;

export const createLand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      landName,
      surveyNumber,
      ownershipType = 'owned',
      currentCrop,
      irrigationSource = 'rainfed',
      soilType,
      village,
      block,
      district,
      state,
      pincode,
      areaInAcres,
      documents
    } = req.body;

    const acres = Number(areaInAcres);
    const areaInHectares = parseFloat((acres * CONVERSION_ACRES_TO_HA).toFixed(4));
    const calculatedAreaSqM = parseFloat((acres * CONVERSION_ACRES_TO_SQM).toFixed(2));

    const land = await Land.create({
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      landName: landName.trim(),
      surveyNumber: surveyNumber ? surveyNumber.trim() : undefined,
      ownershipType,
      currentCrop: currentCrop ? currentCrop.trim() : undefined,
      irrigationSource,
      soilType: soilType ? soilType.trim() : undefined,
      village: village.trim(),
      block: block ? block.trim() : undefined,
      district: district.trim(),
      state: state.trim(),
      pincode: pincode ? pincode.trim() : undefined,
      areaInAcres: acres,
      areaInHectares,
      calculatedAreaSqM,
      status: 'draft',
      documents: documents || []
    });

    res.status(201).json({
      success: true,
      message: 'Land parcel registered successfully in draft mode.',
      nextStep: 'gis_boundary_mapping_or_submit',
      data: land
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyLands = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, district, state, search, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (req.user?.role !== 'admin') {
      if (req.user?.organizationId) {
        query.$or = [{ userId: req.user.id }, { organizationId: req.user.organizationId }];
      } else {
        query.userId = req.user?.id;
      }
    }

    if (status) query.status = status;
    if (district) query.district = { $regex: String(district), $options: 'i' };
    if (state) query.state = { $regex: String(state), $options: 'i' };
    if (search) {
      query.$or = [
        { landName: { $regex: String(search), $options: 'i' } },
        { surveyNumber: { $regex: String(search), $options: 'i' } },
        { village: { $regex: String(search), $options: 'i' } }
      ];
    }

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [lands, total] = await Promise.all([
      Land.find(query)
        .populate('userId', 'fullName phone role')
        .populate('organizationId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Land.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      count: lands.length,
      data: lands
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLandById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const land = await Land.findById(req.params.id)
      .populate('userId', 'fullName phone role village district state preferredLanguage')
      .populate('organizationId', 'name type contactPhone contactEmail')
      .populate('reviewedBy', 'fullName phone role');

    if (!land) {
      res.status(404).json({ success: false, message: 'Land parcel not found' });
      return;
    }

    res.status(200).json({ success: true, data: land });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      landName,
      surveyNumber,
      ownershipType,
      currentCrop,
      irrigationSource,
      soilType,
      village,
      block,
      district,
      state,
      pincode,
      areaInAcres,
      documents
    } = req.body;

    const updateFields: any = {};
    if (landName) updateFields.landName = landName.trim();
    if (surveyNumber !== undefined) updateFields.surveyNumber = surveyNumber.trim();
    if (ownershipType) updateFields.ownershipType = ownershipType;
    if (currentCrop !== undefined) updateFields.currentCrop = currentCrop.trim();
    if (irrigationSource) updateFields.irrigationSource = irrigationSource;
    if (soilType !== undefined) updateFields.soilType = soilType.trim();
    if (village) updateFields.village = village.trim();
    if (block !== undefined) updateFields.block = block.trim();
    if (district) updateFields.district = district.trim();
    if (state) updateFields.state = state.trim();
    if (pincode !== undefined) updateFields.pincode = pincode.trim();
    if (documents) updateFields.documents = documents;

    if (areaInAcres !== undefined) {
      const acres = Number(areaInAcres);
      updateFields.areaInAcres = acres;
      updateFields.areaInHectares = parseFloat((acres * CONVERSION_ACRES_TO_HA).toFixed(4));
      updateFields.calculatedAreaSqM = parseFloat((acres * CONVERSION_ACRES_TO_SQM).toFixed(2));
    }

    const land = await Land.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!land) {
      res.status(404).json({ success: false, message: 'Land record not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Land parcel details updated successfully',
      data: land
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitLand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) {
      res.status(404).json({ success: false, message: 'Land record not found' });
      return;
    }

    land.status = 'submitted';
    land.clarificationReason = undefined;
    land.rejectionReason = undefined;
    await land.save();

    res.status(200).json({
      success: true,
      message: 'Land parcel submitted successfully for GIS screening and review.',
      nextStep: 'pending_land_screening',
      data: land
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) {
      res.status(404).json({ success: false, message: 'Land record not found' });
      return;
    }

    if (land.status === 'approved') {
      res.status(400).json({
        success: false,
        message: 'Cannot delete an approved land parcel with active enrollments.'
      });
      return;
    }

    await Land.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Land record deleted successfully.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLandsQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, hasConflict, district, state, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (hasConflict !== undefined) query.hasConflict = hasConflict === 'true';
    if (district) query.district = { $regex: String(district), $options: 'i' };
    if (state) query.state = { $regex: String(state), $options: 'i' };

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [lands, total] = await Promise.all([
      Land.find(query)
        .populate('userId', 'fullName phone role village district state')
        .populate('organizationId', 'name type')
        .populate('reviewedBy', 'fullName phone role')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Land.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      count: lands.length,
      data: lands
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewLand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason, question, notes } = req.body;

    const statusMap: Record<string, 'approved' | 'rejected' | 'clarification' | 'conflict'> = {
      approve: 'approved',
      reject: 'rejected',
      clarify: 'clarification',
      conflict: 'conflict'
    };

    const targetStatus = statusMap[action];
    const updateData: any = {
      status: targetStatus,
      hasConflict: action === 'conflict',
      reviewedBy: req.user?.id,
      reviewedAt: new Date()
    };

    if (action === 'reject') updateData.rejectionReason = reason;
    if (action === 'clarify') updateData.clarificationReason = question;
    if (action === 'conflict') updateData.conflictNotes = notes;

    const land = await Land.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate('userId', 'fullName phone role')
      .populate('organizationId', 'name type');

    if (!land) {
      res.status(404).json({ success: false, message: 'Land record not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Land parcel marked as '${targetStatus}'.`,
      data: land
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLandsStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, draft, submitted, approved, clarification, rejected, conflict, acreageAgg] = await Promise.all([
      Land.countDocuments(),
      Land.countDocuments({ status: 'draft' }),
      Land.countDocuments({ status: 'submitted' }),
      Land.countDocuments({ status: 'approved' }),
      Land.countDocuments({ status: 'clarification' }),
      Land.countDocuments({ status: 'rejected' }),
      Land.countDocuments({ status: 'conflict' }),
      Land.aggregate([
        {
          $group: {
            _id: null,
            totalAcres: { $sum: '$areaInAcres' },
            totalHectares: { $sum: '$areaInHectares' }
          }
        }
      ])
    ]);

    const totalAcres = acreageAgg[0]?.totalAcres || 0;
    const totalHectares = acreageAgg[0]?.totalHectares || 0;

    res.status(200).json({
      success: true,
      data: {
        totalLands: total,
        draft,
        submitted,
        approved,
        clarification,
        rejected,
        conflict,
        totalAcres: parseFloat(totalAcres.toFixed(2)),
        totalHectares: parseFloat(totalHectares.toFixed(2))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

