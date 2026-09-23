import { Response } from 'express';
import { QuestionnaireTemplate, ProjectAnswer } from './model';
import { Project } from '../projects/model';
import { AuthRequest } from '../auth/middleware';

// Helper to calculate questionnaire completion percentage
const calculateCompletion = (template: any, answersObj: Record<string, any>): number => {
  if (!template || !template.sections || template.sections.length === 0) return 100;

  let totalQuestions = 0;
  let answeredQuestions = 0;

  for (const section of template.sections) {
    for (const q of section.questions) {
      totalQuestions++;
      const val = answersObj[q.questionKey];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        answeredQuestions++;
      }
    }
  }

  if (totalQuestions === 0) return 100;
  return Math.round((answeredQuestions / totalQuestions) * 100);
};

export const getTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectType, includeInactive } = req.query;
    const query: any = {};

    if (includeInactive !== 'true') query.isActive = true;
    if (projectType) query.projectType = projectType;

    const templates = await QuestionnaireTemplate.find(query).sort({ projectType: 1, version: -1 });
    res.status(200).json({ success: true, count: templates.length, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTemplateByType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectType } = req.params;
    const template = await QuestionnaireTemplate.findOne({
      projectType: projectType.toLowerCase(),
      isActive: true
    }).sort({ version: -1 });

    if (!template) {
      res.status(404).json({
        success: false,
        message: `No active questionnaire template found for project type '${projectType}'`
      });
      return;
    }
    res.status(200).json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectType, title, description, version = 1, sections } = req.body;

    const template = await QuestionnaireTemplate.create({
      projectType: projectType.toLowerCase(),
      title: title.trim(),
      description: description ? description.trim() : undefined,
      version,
      sections
    });

    res.status(201).json({
      success: true,
      message: 'Questionnaire template created successfully',
      data: template
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, sections, isActive, version } = req.body;
    const updateData: any = {};

    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (sections) updateData.sections = sections;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (version !== undefined) updateData.version = Number(version);

    const template = await QuestionnaireTemplate.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!template) {
      res.status(404).json({ success: false, message: 'Questionnaire template not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Questionnaire template updated successfully',
      data: template
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveAnswers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, answers, isFinalSubmit = false } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project record not found' });
      return;
    }

    // Find latest active template for this project's type
    const template = await QuestionnaireTemplate.findOne({
      projectType: project.projectType,
      isActive: true
    }).sort({ version: -1 });

    if (!template) {
      res.status(404).json({
        success: false,
        message: `No active questionnaire template found for project type '${project.projectType}'`
      });
      return;
    }

    const completionPercentage = calculateCompletion(template, answers);
    const status = isFinalSubmit ? 'submitted' : 'draft';

    const projectAnswer = await ProjectAnswer.findOneAndUpdate(
      { projectId },
      {
        $set: {
          templateId: template._id,
          userId: req.user?.id,
          version: template.version,
          status,
          answers,
          completionPercentage,
          reviewNotes: undefined
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: isFinalSubmit
        ? 'Questionnaire answers submitted successfully for technical baseline review.'
        : 'Questionnaire draft saved successfully.',
      completionPercentage,
      status,
      data: projectAnswer
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectAnswers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const answers = await ProjectAnswer.findOne({ projectId: req.params.projectId })
      .populate('templateId')
      .populate('userId', 'fullName phone role')
      .populate('reviewedBy', 'fullName phone role');

    if (!answers) {
      res.status(404).json({
        success: false,
        message: 'No questionnaire answers recorded for this project.',
        nextStep: 'fill_questionnaire'
      });
      return;
    }

    res.status(200).json({ success: true, data: answers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewProjectAnswers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { action, notes } = req.body;

    const statusMap: Record<string, 'approved' | 'clarification' | 'rejected'> = {
      approve: 'approved',
      clarify: 'clarification',
      reject: 'rejected'
    };

    const targetStatus = statusMap[action];

    const answer = await ProjectAnswer.findOneAndUpdate(
      { projectId },
      {
        $set: {
          status: targetStatus,
          reviewedBy: req.user?.id,
          reviewedAt: new Date(),
          reviewNotes: notes
        }
      },
      { new: true }
    );

    if (!answer) {
      res.status(404).json({ success: false, message: 'Questionnaire submission not found for this project' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Questionnaire answers marked as '${targetStatus}'`,
      data: answer
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const seedDefaultQuestionnaires = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const defaultTemplates = [
      {
        projectType: 'carbon',
        title: 'Agricultural Carbon Baseline & Land Management Questionnaire',
        description: 'Comprehensive historical management and practice transition survey for carbon crediting.',
        version: 1,
        sections: [
          {
            sectionKey: 'baseline_farming_practices',
            title: 'Historical Land & Tillage Baseline',
            description: 'Farming practices over the last 3 crop cycles.',
            displayOrder: 1,
            questions: [
              {
                questionKey: 'historical_tillage_type',
                label: 'What has been the primary tillage practice over the last 3 years?',
                type: 'dropdown',
                required: true,
                options: ['conventional_deep_tillage', 'reduced_tillage', 'zero_till_no_till'],
                helpText: 'Select the predominant tillage method.'
              },
              {
                questionKey: 'synthetic_nitrogen_kg_per_acre',
                label: 'Average synthetic nitrogen fertilizer applied per acre per year (kg)',
                type: 'number',
                unit: 'kg/acre',
                required: true,
                placeholder: 'e.g. 50'
              },
              {
                questionKey: 'crop_residue_burned',
                label: 'Was crop residue burned on this land parcel in past seasons?',
                type: 'yes-no',
                required: true
              }
            ]
          },
          {
            sectionKey: 'planned_carbon_interventions',
            title: 'Planned Regenerative Carbon Interventions',
            description: 'New agricultural practices being introduced for carbon sequestration.',
            displayOrder: 2,
            questions: [
              {
                questionKey: 'cover_crop_species',
                label: 'Which cover crop species will be planted between cash crop cycles?',
                type: 'multi-select',
                required: true,
                options: ['cowpea_lobia', 'dhaincha_sesbania', 'sunn_hemp', 'mustard', 'clover']
              },
              {
                questionKey: 'biochar_application_rate_ton_per_acre',
                label: 'Planned biochar application rate (tons/acre)',
                type: 'number',
                unit: 'tons/acre',
                required: false,
                placeholder: '0 if not applicable'
              }
            ]
          }
        ]
      },
      {
        projectType: 'water',
        title: 'Water Stewardship & Irrigation Efficiency Questionnaire',
        description: 'Survey for groundwater replenishment and micro-irrigation interventions.',
        version: 1,
        sections: [
          {
            sectionKey: 'water_source_and_irrigation',
            title: 'Irrigation Baseline & Source Infrastructure',
            displayOrder: 1,
            questions: [
              {
                questionKey: 'primary_water_source',
                label: 'Primary source of irrigation water',
                type: 'dropdown',
                required: true,
                options: ['borewell', 'canal', 'farm_pond', 'river', 'rainfed_only']
              },
              {
                questionKey: 'irrigation_method_transition',
                label: 'Irrigation method being adopted under project',
                type: 'dropdown',
                required: true,
                options: ['drip_irrigation', 'micro_sprinklers', 'alternate_wetting_drying', 'furrow_with_mulch']
              },
              {
                questionKey: 'pumping_hours_per_season',
                label: 'Average groundwater pumping hours per season',
                type: 'number',
                unit: 'hours',
                required: true
              }
            ]
          }
        ]
      },
      {
        projectType: 'agroforestry',
        title: 'Agroforestry Tree Planting & Biomass Survey',
        description: 'Species composition, tree density, and biomass projection survey.',
        version: 1,
        sections: [
          {
            sectionKey: 'tree_species_planning',
            title: 'Tree Species & Planting Density',
            displayOrder: 1,
            questions: [
              {
                questionKey: 'selected_tree_species',
                label: 'Tree species selected for planting',
                type: 'multi-select',
                required: true,
                options: ['teak_sagwan', 'guava_amrood', 'lemon_nimbu', 'mango_aam', 'neem', 'bamboo']
              },
              {
                questionKey: 'total_trees_to_be_planted',
                label: 'Total count of saplings to be planted',
                type: 'number',
                unit: 'count',
                required: true
              },
              {
                questionKey: 'planting_pattern',
                label: 'Planting layout pattern',
                type: 'dropdown',
                required: true,
                options: ['boundary_bund_plantation', 'block_plantation', 'alley_cropping_rows', 'silvopasture']
              }
            ]
          }
        ]
      }
    ];

    const results = [];
    for (const t of defaultTemplates) {
      const saved = await QuestionnaireTemplate.findOneAndUpdate(
        { projectType: t.projectType, version: t.version },
        { $set: t },
        { new: true, upsert: true }
      );
      results.push(saved);
    }

    res.status(200).json({
      success: true,
      message: 'Default Project Questionnaire templates seeded successfully.',
      count: results.length,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

