import { Router, Request, Response } from 'express';
import { SystemSettingsRepository, CreateSystemSettingDto, UpdateSystemSettingDto } from '../repositories/SystemSettingsRepository.js';
import { LLMService } from '../services/llm.service.js';
import { logger } from '../utils/logger.js';

const router = Router();
const systemSettingsRepository = new SystemSettingsRepository();
const llmService = new LLMService();

/**
 * GET /api/settings
 * Get all system settings or filter by category
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;

    let settings;
    if (category) {
      settings = await systemSettingsRepository.findByCategory(category);
    } else {
      settings = await systemSettingsRepository.findAll();
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Error fetching system settings', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch system settings',
      },
    });
  }
});

/**
 * GET /api/settings/categories
 * Get all unique setting categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await systemSettingsRepository.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error fetching setting categories', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch setting categories',
      },
    });
  }
});

/**
 * PUT /api/settings/batch
 * Batch update multiple settings
 */
router.put('/batch', async (req: Request, res: Response) => {
  try {
    const updates: Array<{ key: string; value: string }> = req.body.updates;

    if (!Array.isArray(updates)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Updates must be an array of {key, value} objects',
        },
      });
      return;
    }

    await systemSettingsRepository.batchUpdate(updates);

    // Check if any LLM settings were updated
    const hasLLMUpdates = updates.some(update => update.key.startsWith('llm_'));
    if (hasLLMUpdates) {
      await llmService.reload();
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    logger.error('Error batch updating settings', { 
      updates: req.body, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update settings',
      },
    });
  }
});

/**
 * GET /api/settings/:key
 * Get setting by key
 */
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key!;
    const setting = await systemSettingsRepository.findByKey(key);

    if (!setting) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Setting not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    logger.error('Error fetching setting', { key: req.params.key, error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch setting',
      },
    });
  }
});

/**
 * POST /api/settings
 * Create a new setting
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateSystemSettingDto = req.body;

    // Validate required fields
    if (!data.key || data.value === undefined) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: key, value',
        },
      });
      return;
    }

    // Check if key already exists
    const existing = await systemSettingsRepository.findByKey(data.key);
    if (existing) {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_KEY',
          message: 'Setting with this key already exists',
        },
      });
      return;
    }

    const setting = await systemSettingsRepository.create(data);

    // Reload LLM service if it's an LLM setting
    if (data.category === 'llm') {
      await llmService.reload();
    }

    res.status(201).json({
      success: true,
      data: setting,
      message: 'Setting created successfully',
    });
  } catch (error) {
    logger.error('Error creating setting', { data: req.body, error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create setting',
      },
    });
  }
});

/**
 * PUT /api/settings/:key
 * Update setting by key
 */
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key!;
    const data: UpdateSystemSettingDto = req.body;

    const setting = await systemSettingsRepository.updateByKey(key, data);

    if (!setting) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Setting not found',
        },
      });
      return;
    }

    // Reload LLM service if it's an LLM setting
    if (setting.category === 'llm') {
      await llmService.reload();
    }

    res.json({
      success: true,
      data: setting,
      message: 'Setting updated successfully',
    });
  } catch (error) {
    logger.error('Error updating setting', { key: req.params.key, data: req.body, error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update setting',
      },
    });
  }
});

/**
 * DELETE /api/settings/:key
 * Delete setting by key
 */
router.delete('/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key!;

    const deleted = await systemSettingsRepository.deleteByKey(key);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Setting not found',
        },
      });
      return;
    }

    // Reload LLM service if it was an LLM setting
    if (key.startsWith('llm_')) {
      await llmService.reload();
    }

    res.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting setting', { key: req.params.key, error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete setting',
      },
    });
  }
});

/**
 * POST /api/settings/llm/test
 * Test current LLM connection
 */
router.post('/llm/test', async (req: Request, res: Response) => {
  try {
    const result = await llmService.testConnection();

    res.json({
      success: result.success,
      data: {
        provider: llmService.getCurrentProvider(),
        connected: result.success
      },
      message: result.success ? 'LLM connection successful' : 'LLM connection failed',
      error: result.error ? { message: result.error } : undefined
    });
  } catch (error) {
    logger.error('Error testing LLM connection', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to test LLM connection',
      },
    });
  }
});

export default router;
