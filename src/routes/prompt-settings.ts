import { Router, Request, Response } from 'express';
import { PromptSettingsRepository, CreatePromptSettingDto, UpdatePromptSettingDto } from '../repositories/PromptSettingsRepository.js';
import { logger } from '../utils/logger.js';

const router = Router();
const promptSettingsRepository = new PromptSettingsRepository();

/**
 * GET /api/prompt-settings
 * Get all prompt settings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const activeOnly = req.query.active === 'true';

    let promptSettings;
    if (category) {
      promptSettings = await promptSettingsRepository.findByCategory(category);
    } else if (activeOnly) {
      promptSettings = await promptSettingsRepository.findActive();
    } else {
      promptSettings = await promptSettingsRepository.findAll();
    }

    res.json({
      success: true,
      data: promptSettings,
    });
  } catch (error) {
    logger.error('Error fetching prompt settings', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch prompt settings',
      },
    });
  }
});

/**
 * GET /api/prompt-settings/categories
 * Get all unique categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await promptSettingsRepository.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error fetching prompt categories', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch prompt categories',
      },
    });
  }
});

/**
 * GET /api/prompt-settings/:id
 * Get prompt setting by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id!);
    
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid prompt setting ID',
        },
      });
      return;
    }

    const promptSetting = await promptSettingsRepository.findById(id);

    if (!promptSetting) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Prompt setting not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: promptSetting,
    });
  } catch (error) {
    logger.error('Error fetching prompt setting', { id: req.params.id, error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch prompt setting',
      },
    });
  }
});

/**
 * GET /api/prompt-settings/name/:name
 * Get prompt setting by name
 */
router.get('/name/:name', async (req: Request, res: Response) => {
  try {
    const name = req.params.name!;
    const promptSetting = await promptSettingsRepository.findByName(name);

    if (!promptSetting) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Prompt setting not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: promptSetting,
    });
  } catch (error) {
    logger.error('Error fetching prompt setting by name', { name: req.params.name, error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch prompt setting',
      },
    });
  }
});

/**
 * POST /api/prompt-settings
 * Create a new prompt setting
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreatePromptSettingDto = req.body;

    // Validate required fields
    if (!data.name || !data.promptTemplate || !data.category) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: name, promptTemplate, category',
        },
      });
      return;
    }

    // Check if name already exists
    const existing = await promptSettingsRepository.findByName(data.name);
    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_NAME',
          message: 'Prompt setting with this name already exists',
        },
      });
      return;
    }

    const promptSetting = await promptSettingsRepository.create(data);

    res.status(201).json({
      success: true,
      data: promptSetting,
      message: 'Prompt setting created successfully',
    });
  } catch (error) {
    logger.error('Error creating prompt setting', { data: req.body, error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create prompt setting',
      },
    });
  }
});

/**
 * PUT /api/prompt-settings/:id
 * Update prompt setting by ID
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id!);
    const data: UpdatePromptSettingDto = req.body;

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid prompt setting ID',
        },
      });
      return;
    }

    // Check if trying to update name and it already exists
    if (data.name) {
      const existing = await promptSettingsRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: 'Prompt setting with this name already exists',
          },
        });
        return;
      }
    }

    const promptSetting = await promptSettingsRepository.update(id, data);

    if (!promptSetting) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Prompt setting not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: promptSetting,
      message: 'Prompt setting updated successfully',
    });
  } catch (error) {
    logger.error('Error updating prompt setting', { id: req.params.id, data: req.body, error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update prompt setting',
      },
    });
  }
});

/**
 * DELETE /api/prompt-settings/:id
 * Delete prompt setting by ID
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id!);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid prompt setting ID',
        },
      });
      return;
    }

    const deleted = await promptSettingsRepository.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Prompt setting not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Prompt setting deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting prompt setting', { id: req.params.id, error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete prompt setting',
      },
    });
  }
});

export default router;
