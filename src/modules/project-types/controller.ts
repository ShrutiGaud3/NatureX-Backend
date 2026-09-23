import { Request, Response } from 'express';
import { ProjectType } from './model';

export const getProjectTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, includeInactive } = req.query;
    const query: any = {};

    if (includeInactive !== 'true') {
      query.isActive = true;
    }
    if (category) {
      query.category = category;
    }

    const types = await ProjectType.find(query).sort({ displayOrder: 1, createdAt: 1 });
    res.status(200).json({ success: true, count: types.length, data: types });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectTypeByKeyOrId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyOrId } = req.params;
    let type = null;

    if (keyOrId.match(/^[0-9a-fA-F]{24}$/)) {
      type = await ProjectType.findById(keyOrId);
    }
    if (!type) {
      type = await ProjectType.findOne({ key: keyOrId.toLowerCase() });
    }

    if (!type) {
      res.status(404).json({ success: false, message: 'Project type not found' });
      return;
    }

    res.status(200).json({ success: true, data: type });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProjectType = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      key,
      name,
      category = 'climate',
      description,
      defaultStandard = 'naturex_internal',
      eligibleMethodologies = [],
      allowedPractices = [],
      requiredEvidenceTypes = [],
      impactUnit = 'tCO2e',
      defaultCreditingPeriodYears = 20,
      iconUrl,
      isActive = true,
      displayOrder = 0
    } = req.body;

    const existing = await ProjectType.findOne({ key: key.trim().toLowerCase() });
    if (existing) {
      res.status(400).json({
        success: false,
        message: `Project type with key '${key}' already exists.`
      });
      return;
    }

    const type = await ProjectType.create({
      key: key.trim().toLowerCase(),
      name: name.trim(),
      category,
      description: description ? description.trim() : undefined,
      defaultStandard,
      eligibleMethodologies,
      allowedPractices,
      requiredEvidenceTypes,
      impactUnit: impactUnit.trim(),
      defaultCreditingPeriodYears,
      iconUrl,
      isActive,
      displayOrder
    });

    res.status(201).json({
      success: true,
      message: 'Project type catalog entry created successfully',
      data: type
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProjectType = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      category,
      description,
      defaultStandard,
      eligibleMethodologies,
      allowedPractices,
      requiredEvidenceTypes,
      impactUnit,
      defaultCreditingPeriodYears,
      iconUrl,
      isActive,
      displayOrder
    } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description.trim();
    if (defaultStandard) updateData.defaultStandard = defaultStandard;
    if (eligibleMethodologies) updateData.eligibleMethodologies = eligibleMethodologies;
    if (allowedPractices) updateData.allowedPractices = allowedPractices;
    if (requiredEvidenceTypes) updateData.requiredEvidenceTypes = requiredEvidenceTypes;
    if (impactUnit) updateData.impactUnit = impactUnit.trim();
    if (defaultCreditingPeriodYears !== undefined) updateData.defaultCreditingPeriodYears = Number(defaultCreditingPeriodYears);
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);

    const type = await ProjectType.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!type) {
      res.status(404).json({ success: false, message: 'Project type not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project type updated successfully',
      data: type
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleProjectTypeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive } = req.body;
    const type = await ProjectType.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true }
    );

    if (!type) {
      res.status(404).json({ success: false, message: 'Project type not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Project type '${type.name}' is now ${isActive ? 'active' : 'inactive'}`,
      data: type
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProjectType = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = await ProjectType.findByIdAndDelete(req.params.id);
    if (!type) {
      res.status(404).json({ success: false, message: 'Project type not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Project type deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const seedDefaultProjectTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const defaults = [
      {
        key: 'carbon',
        name: 'Carbon Sequestration & Offsets',
        category: 'climate',
        description: 'Verified soil and biomass carbon sequestration on agricultural and degraded lands.',
        defaultStandard: 'verra_vcs',
        eligibleMethodologies: ['VM0042', 'VM0017', 'VM0007'],
        allowedPractices: ['zero_tillage', 'cover_cropping', 'biochar_addition', 'crop_residue_retention', 'agroforestry_planting'],
        requiredEvidenceTypes: ['soil_sample_lab_report', 'geo_tagged_photo', 'drone_ndvi_orthomosaic', 'farmer_logbook'],
        impactUnit: 'tCO2e',
        defaultCreditingPeriodYears: 20,
        displayOrder: 1
      },
      {
        key: 'water',
        name: 'Water Conservation & Recharge Impact',
        category: 'water',
        description: 'Groundwater recharge structures, micro-irrigation efficiency, and watershed regeneration.',
        defaultStandard: 'gold_standard',
        eligibleMethodologies: ['GS-WTR-01', 'GS-WTR-02'],
        allowedPractices: ['drip_irrigation_adoption', 'farm_pond_construction', 'check_dam', 'percolation_tank'],
        requiredEvidenceTypes: ['flow_meter_readings', 'water_table_depth_log', 'geo_tagged_photo', 'civil_completion_cert'],
        impactUnit: 'kL_water_recharged',
        defaultCreditingPeriodYears: 15,
        displayOrder: 2
      },
      {
        key: 'biodiversity',
        name: 'Biodiversity Stewardship & Habitat Restoration',
        category: 'nature',
        description: 'Flora and fauna habitat restoration, wildlife corridor protection, and pollinator strips.',
        defaultStandard: 'art_trees',
        eligibleMethodologies: ['NATUREX-BIO-01', 'PLAN-VIVO-BIO'],
        allowedPractices: ['native_tree_plantation', 'pollinator_hedgerows', 'organic_pest_management', 'wetland_restoration'],
        requiredEvidenceTypes: ['biodiversity_species_audit', 'drone_canopy_cover', 'geo_tagged_photo'],
        impactUnit: 'biodiversity_credits',
        defaultCreditingPeriodYears: 25,
        displayOrder: 3
      },
      {
        key: 'agroforestry',
        name: 'Agroforestry & Tree-Based Farming',
        category: 'forestry',
        description: 'Integrating multi-tier fruit, timber, and medicinal trees with traditional field crops.',
        defaultStandard: 'verra_vcs',
        eligibleMethodologies: ['VM0042', 'AR-ACM0003'],
        allowedPractices: ['horticulture_tree_plantation', 'bund_plantation', 'silvopasture', 'alley_cropping'],
        requiredEvidenceTypes: ['geo_tagged_tree_count', 'drone_canopy_biomass', 'nursery_sapling_receipts'],
        impactUnit: 'tCO2e',
        defaultCreditingPeriodYears: 30,
        displayOrder: 4
      },
      {
        key: 'regenerative_ag',
        name: 'Regenerative Agriculture Practices',
        category: 'agriculture',
        description: 'Comprehensive whole-farm regenerative transitions reducing synthetic inputs and enhancing soil health.',
        defaultStandard: 'naturex_internal',
        eligibleMethodologies: ['NATUREX-REGEN-01'],
        allowedPractices: ['multi_species_cover_crops', 'zero_chemical_fertilizer', 'composting_vermicompost', 'crop_rotation'],
        requiredEvidenceTypes: ['soil_organic_carbon_test', 'fertilizer_purchase_invoices', 'farm_management_diary'],
        impactUnit: 'tCO2e',
        defaultCreditingPeriodYears: 20,
        displayOrder: 5
      }
    ];

    const results = [];
    for (const item of defaults) {
      const type = await ProjectType.findOneAndUpdate(
        { key: item.key },
        { $set: item },
        { new: true, upsert: true }
      );
      results.push(type);
    }

    res.status(200).json({
      success: true,
      message: 'Default NatureX project types catalog seeded successfully.',
      count: results.length,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

