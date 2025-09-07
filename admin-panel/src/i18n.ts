import i18n from 'i18next';

const resources = {
  ru: {
    translation: {
      // Navigation
      dashboard: 'Панель управления',
      vacancies: 'Вакансии',
      candidates: 'Кандидаты',
      reports: 'Отчеты',
      settings: 'Настройки',
      
      // Dashboard
      dashboard_title: 'Панель управления',
      active_vacancies: 'Активные вакансии',
      total_candidates: 'Всего кандидатов',
      interviews_today: 'Интервью сегодня',
      success_rate: 'Процент успеха',
      recent_activity: 'Последняя активность',
      evaluation_distribution: 'Распределение оценок',
      average_scores: 'Средние баллы',
      overall: 'Общий',
      technical: 'Технические',
      communication: 'Коммуникация',
      problem_solving: 'Решение задач',
      no_recent_activity: 'Нет недавней активности',
      no_evaluations_yet: 'Оценок пока нет',
      proceed: 'Продолжить',
      reject: 'Отклонить',
      clarify: 'Уточнить',
      
      // Common
      loading: 'Загрузка...',
      loading_dashboard: 'Загрузка панели управления...',
      loading_prompts: 'Загрузка промптов...',
      loading_llm_settings: 'Загрузка настроек LLM...',
      error_loading_dashboard: 'Ошибка загрузки панели управления',
      error_loading_prompts: 'Ошибка загрузки промптов',
      no_data_available: 'Нет доступных данных',
      retry: 'Повторить',
      save: 'Сохранить',
      cancel: 'Отмена',
      edit: 'Редактировать',
      delete: 'Удалить',
      create: 'Создать',
      update: 'Обновить',
      saving: 'Сохранение...',
      testing: 'Тестирование...',
      
      // Settings
      settings_title: 'Настройки',
      llm_prompts: 'LLM Промпты',
      llm_configuration: 'Конфигурация LLM',
      new_prompt: '+ Новый промпт',
      filter_by_category: 'Фильтр по категории',
      all_categories: 'Все категории',
      no_prompts_found: 'Промпты не найдены',
      no_prompts_in_category: 'Промптов в категории {{category}} не найдено',
      
      // Prompt Modal
      edit_prompt: 'Редактировать промпт',
      create_new_prompt: 'Создать новый промпт',
      name: 'Название',
      category: 'Категория',
      new_category: '+ Новая категория',
      enter_new_category: 'Введите название новой категории',
      description: 'Описание',
      prompt_template: 'Шаблон промпта',
      prompt_template_hint: 'Используйте плейсхолдеры вида {{variable_name}} для динамического контента',
      active: 'Активен',
      inactive: 'Неактивен',
      created: 'Создан',
      updated: 'Обновлен',
      confirm_delete_prompt: 'Вы уверены, что хотите удалить этот промпт?',
      
      // LLM Configuration
      llm_provider: 'LLM Провайдер',
      current_provider: 'Текущий провайдер',
      ollama_local: 'Ollama (Локальный)',
      perplexity_api: 'Perplexity API',
      ollama_configuration: 'Конфигурация Ollama',
      perplexity_configuration: 'Конфигурация Perplexity',
      base_url: 'Базовый URL',
      model: 'Модель',
      api_key: 'API Ключ',
      enter_perplexity_api_key: 'Введите ваш Perplexity API ключ',
      test_connection: 'Тестировать соединение',
      save_settings: 'Сохранить настройки',
      llm_settings_saved: 'Настройки LLM успешно сохранены',
      failed_to_save_settings: 'Не удалось сохранить настройки',
      successfully_connected: 'Успешно подключено к {{provider}}',
      connection_failed: 'Соединение не удалось',
      connection_test_failed: 'Тест соединения не удался',
      
      // Errors
      error_occurred: 'Произошла ошибка',
      unexpected_error: 'Произошла неожиданная ошибка',
      failed_to_load: 'Не удалось загрузить {{item}}',
      
      // Vacancies
      job_vacancies: 'Вакансии',
      job_vacancies_title: 'Вакансии',
      job_vacancies_subtitle: 'Управляйте вашими возможностями найма',
      add_vacancy: 'Добавить вакансию',
      add_new_vacancy: 'Добавить новую вакансию',
      edit_vacancy: 'Редактировать вакансию',
      vacancy_title: 'Название вакансии',
      vacancy_description: 'Описание вакансии',
      requirements: 'Требования',
      evaluation_weights: 'Веса оценки',
      technical_skills: 'Технические навыки',
      loading_vacancies: 'Загрузка вакансий...',
      failed_to_fetch_vacancies: 'Не удалось загрузить вакансии',
      confirm_delete_vacancy: 'Вы уверены, что хотите удалить вакансию "{{title}}"? Это действие нельзя отменить.',
      no_vacancies_yet: 'Вакансий пока нет',
      no_vacancies_description: 'Начните строить свой рекрутинговый процесс, создав первую вакансию.',
      create_first_vacancy: 'Создать первую вакансию',
      created: 'Создано',
      technical_skills_required: 'Необходимые технические навыки',
      experience_requirements: 'Требования к опыту',
      evaluation_criteria: 'Критерии оценки',
      years: 'лет',
      more: 'еще',
      active: 'Активна',
      inactive: 'Неактивна',
      deleting: 'Удаление...',
      network_error_delete_vacancy: 'Произошла сетевая ошибка при удалении вакансии',
      
      // Candidates
      candidates_title: 'Кандидаты',
      candidates_subtitle: 'Нажмите на любого кандидата, чтобы просмотреть историю разговора',
      candidate_name: 'Имя кандидата',
      telegram_user: 'Пользователь Telegram',
      first_name: 'Имя',
      last_name: 'Фамилия',
      username: 'Имя пользователя',
      unknown_candidate: 'Неизвестный кандидат',
      loading_candidates: 'Загрузка кандидатов...',
      failed_to_load_candidates: 'Не удалось загрузить кандидатов',
      try_again: 'Попробовать еще раз',
      total_candidates_count: 'Всего: {{count}} кандидатов',
      no_candidates_yet: 'Кандидатов пока нет',
      no_candidates_description: 'Кандидаты появятся здесь, как только начнут подавать заявки на вакансии.',
      candidate: 'Кандидат',
      vacancy_applied: 'Подал заявку на вакансию',
      no_applications: 'Нет заявок',
      not_evaluated: 'Не оценен',
      no_cv_uploaded: 'Резюме не загружено',
      preview_cv: 'Просмотр резюме',
      registered: 'Зарегистрирован',
      showing_results: 'Показано с {{from}} по {{to}} из {{total}} результатов',
      previous: 'Предыдущая',
      next: 'Следующая',
      
      // File operations
      file: 'Файл',
      uploaded: 'Загружено',
      cv_uploaded: 'Резюме загружено',
      
      // Time and dates
      today: 'Сегодня',
      yesterday: 'Вчера',
      days_ago: '{{count}} дней назад',
      hours_ago: '{{count}} часов назад',
      minutes_ago: '{{count}} минут назад',
      
      // Status and recommendations
      recommendation: 'Рекомендация',
      score: 'Балл',
      evaluation: 'Оценка',
      interview_status: 'Статус интервью',
      completed: 'Завершено',
      in_progress: 'В процессе',
      pending: 'Ожидает',
      
      // Language selector
      language: 'Язык',
      russian: 'Русский',
      english: 'English'
    }
  },
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      vacancies: 'Vacancies',
      candidates: 'Candidates',
      reports: 'Reports',
      settings: 'Settings',
      
      // Dashboard
      dashboard_title: 'Dashboard',
      active_vacancies: 'Active Vacancies',
      total_candidates: 'Total Candidates',
      interviews_today: 'Interviews Today',
      success_rate: 'Success Rate',
      recent_activity: 'Recent Activity',
      evaluation_distribution: 'Evaluation Distribution',
      average_scores: 'Average Scores',
      overall: 'Overall',
      technical: 'Technical',
      communication: 'Communication',
      problem_solving: 'Problem Solving',
      no_recent_activity: 'No recent activity',
      no_evaluations_yet: 'No evaluations yet',
      proceed: 'Proceed',
      reject: 'Reject',
      clarify: 'Clarify',
      
      // Common
      loading: 'Loading...',
      loading_dashboard: 'Loading dashboard...',
      loading_prompts: 'Loading prompts...',
      loading_llm_settings: 'Loading LLM settings...',
      error_loading_dashboard: 'Error Loading Dashboard',
      error_loading_prompts: 'Error Loading Prompts',
      no_data_available: 'No data available',
      retry: 'Retry',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      create: 'Create',
      update: 'Update',
      saving: 'Saving...',
      testing: 'Testing...',
      
      // Settings
      settings_title: 'Settings',
      llm_prompts: 'LLM Prompts',
      llm_configuration: 'LLM Configuration',
      new_prompt: '+ New Prompt',
      filter_by_category: 'Filter by Category',
      all_categories: 'All Categories',
      no_prompts_found: 'No prompts found',
      no_prompts_in_category: 'No prompts found in {{category}} category',
      
      // Prompt Modal
      edit_prompt: 'Edit Prompt',
      create_new_prompt: 'Create New Prompt',
      name: 'Name',
      category: 'Category',
      new_category: '+ New Category',
      enter_new_category: 'Enter new category name',
      description: 'Description',
      prompt_template: 'Prompt Template',
      prompt_template_hint: 'Use placeholders like {{variable_name}} for dynamic content',
      active: 'Active',
      inactive: 'Inactive',
      created: 'Created',
      updated: 'Updated',
      confirm_delete_prompt: 'Are you sure you want to delete this prompt?',
      
      // LLM Configuration
      llm_provider: 'LLM Provider',
      current_provider: 'Current Provider',
      ollama_local: 'Ollama (Local)',
      perplexity_api: 'Perplexity API',
      ollama_configuration: 'Ollama Configuration',
      perplexity_configuration: 'Perplexity Configuration',
      base_url: 'Base URL',
      model: 'Model',
      api_key: 'API Key',
      enter_perplexity_api_key: 'Enter your Perplexity API key',
      test_connection: 'Test Connection',
      save_settings: 'Save Settings',
      llm_settings_saved: 'LLM settings saved successfully',
      failed_to_save_settings: 'Failed to save settings',
      successfully_connected: 'Successfully connected to {{provider}}',
      connection_failed: 'Connection failed',
      connection_test_failed: 'Connection test failed',
      
      // Errors
      error_occurred: 'An error occurred',
      unexpected_error: 'An unexpected error occurred',
      failed_to_load: 'Failed to load {{item}}',
      
      // Vacancies
      job_vacancies: 'Job Vacancies',
      job_vacancies_title: 'Job Vacancies',
      job_vacancies_subtitle: 'Manage your recruitment opportunities',
      add_vacancy: 'Add Vacancy',
      add_new_vacancy: 'Add New Vacancy',
      edit_vacancy: 'Edit Vacancy',
      vacancy_title: 'Vacancy Title',
      vacancy_description: 'Vacancy Description',
      requirements: 'Requirements',
      evaluation_weights: 'Evaluation Weights',
      technical_skills: 'Technical Skills',
      loading_vacancies: 'Loading vacancies...',
      failed_to_fetch_vacancies: 'Failed to fetch vacancies',
      confirm_delete_vacancy: 'Are you sure you want to delete the vacancy "{{title}}"? This action cannot be undone.',
      no_vacancies_yet: 'No vacancies yet',
      no_vacancies_description: 'Start building your recruitment pipeline by creating your first job vacancy.',
      create_first_vacancy: 'Create Your First Vacancy',
      created: 'Created',
      technical_skills_required: 'Technical Skills Required',
      experience_requirements: 'Experience Requirements',
      evaluation_criteria: 'Evaluation Criteria',
      years: 'years',
      more: 'more',
      active: 'Active',
      inactive: 'Inactive',
      deleting: 'Deleting...',
      network_error_delete_vacancy: 'Network error occurred while deleting vacancy',
      
      // Candidates
      candidates_title: 'Candidates',
      candidates_subtitle: 'Click on any candidate to view their conversation history',
      candidate_name: 'Candidate Name',
      telegram_user: 'Telegram User',
      first_name: 'First Name',
      last_name: 'Last Name',
      username: 'Username',
      unknown_candidate: 'Unknown Candidate',
      loading_candidates: 'Loading candidates...',
      failed_to_load_candidates: 'Failed to load candidates',
      try_again: 'Try Again',
      total_candidates_count: 'Total: {{count}} candidates',
      no_candidates_yet: 'No candidates yet',
      no_candidates_description: 'Candidates will appear here once they start applying for vacancies.',
      candidate: 'Candidate',
      vacancy_applied: 'Vacancy Applied',
      no_applications: 'No applications',
      not_evaluated: 'Not evaluated',
      no_cv_uploaded: 'No CV uploaded',
      preview_cv: 'Preview CV',
      registered: 'Registered',
      showing_results: 'Showing {{from}} to {{to}} of {{total}} results',
      previous: 'Previous',
      next: 'Next',
      
      // File operations
      file: 'File',
      uploaded: 'Uploaded',
      cv_uploaded: 'CV Uploaded',
      
      // Time and dates
      today: 'Today',
      yesterday: 'Yesterday',
      days_ago: '{{count}} days ago',
      hours_ago: '{{count}} hours ago',
      minutes_ago: '{{count}} minutes ago',
      
      // Status and recommendations
      recommendation: 'Recommendation',
      score: 'Score',
      evaluation: 'Evaluation',
      interview_status: 'Interview Status',
      completed: 'Completed',
      in_progress: 'In Progress',
      pending: 'Pending',
      
      // Language selector
      language: 'Language',
      russian: 'Русский',
      english: 'English'
    }
  }
};

// Initialize i18n
i18n.init({
  lng: 'ru', // Default to Russian
  fallbackLng: 'en',
  resources,
  interpolation: {
    escapeValue: false
  },
  debug: false,
  react: {
    useSuspense: false // Disable suspense for compatibility with Preact
  }
});

export default i18n;
