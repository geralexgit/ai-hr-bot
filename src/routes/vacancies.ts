import express from 'express';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { CreateVacancyDto, UpdateVacancyDto, Vacancy } from '../types/index.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const vacancyRepository = new VacancyRepository();

// GET /vacancies - List all vacancies
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;

    let vacancies;
    if (search && typeof search === 'string') {
      vacancies = await vacancyRepository.search(search);
    } else if (status === 'active' || status === 'inactive') {
      vacancies = await vacancyRepository.findByStatus(status);
    } else {
      vacancies = await vacancyRepository.findAll();
    }

    const response: ApiResponse<Vacancy[]> = {
      success: true,
      data: vacancies,
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch vacancies', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_VACANCIES_ERROR',
        message: 'Failed to fetch vacancies',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// GET /vacancies/:id - Get single vacancy
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid vacancy ID',
        },
      };
      return res.status(400).json(response);
    }

    const vacancy = await vacancyRepository.findById(id);
    if (!vacancy) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VACANCY_NOT_FOUND',
          message: 'Vacancy not found',
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Vacancy> = {
      success: true,
      data: vacancy,
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to fetch vacancy', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FETCH_VACANCY_ERROR',
        message: 'Failed to fetch vacancy',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// POST /vacancies - Create new vacancy
router.post('/', async (req, res) => {
  try {
    const createData: CreateVacancyDto = req.body;

    // Basic validation
    if (!createData.title || !createData.description) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title and description are required',
        },
      };
      return res.status(400).json(response);
    }

    const vacancy = await vacancyRepository.create(createData);

    const response: ApiResponse<Vacancy> = {
      success: true,
      data: vacancy,
      message: 'Vacancy created successfully',
    };

    res.status(201).json(response);
    return;
  } catch (error) {
    logger.error('Failed to create vacancy', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'CREATE_VACANCY_ERROR',
        message: 'Failed to create vacancy',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// PUT /vacancies/:id - Update vacancy
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid vacancy ID',
        },
      };
      return res.status(400).json(response);
    }

    const updateData: UpdateVacancyDto = req.body;

    const vacancy = await vacancyRepository.update(id, updateData);
    if (!vacancy) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VACANCY_NOT_FOUND',
          message: 'Vacancy not found',
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Vacancy> = {
      success: true,
      data: vacancy,
      message: 'Vacancy updated successfully',
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to update vacancy', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UPDATE_VACANCY_ERROR',
        message: 'Failed to update vacancy',
      },
    };

    res.status(500).json(response);
    return;
  }
});

// DELETE /vacancies/:id - Delete vacancy
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid vacancy ID',
        },
      };
      return res.status(400).json(response);
    }

    const deleted = await vacancyRepository.delete(id);
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VACANCY_NOT_FOUND',
          message: 'Vacancy not found',
        },
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Vacancy deleted successfully',
    };

    res.json(response);
    return;
  } catch (error) {
    logger.error('Failed to delete vacancy', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id: req.params.id,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'DELETE_VACANCY_ERROR',
        message: 'Failed to delete vacancy',
      },
    };

    res.status(500).json(response);
    return;
  }
});

export default router;
