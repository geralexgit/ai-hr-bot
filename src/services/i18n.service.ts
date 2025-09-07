import i18n from 'i18next';

interface TranslationResources {
  [key: string]: {
    [key: string]: string;
  };
}

interface I18nResources {
  [key: string]: {
    translation: {
      [key: string]: string;
    };
  };
}

const resources: TranslationResources = {
  ru: {
    // Bot messages
    greeting: 'Привет, {{name}}! Я HR-ассистент. Выберите вакансию, которая вас интересует:',
    no_vacancies: 'К сожалению, в данный момент нет активных вакансий. Попробуйте позже.',
    select_vacancy_first: 'Пожалуйста, сначала выберите вакансию с помощью команды /start',
    vacancy_not_found: 'Вакансия не найдена. Попробуйте выбрать другую.',
    error_vacancy_selection: 'Произошла ошибка при выборе вакансии. Попробуйте еще раз.',
    error_loading_vacancies: 'Произошла ошибка при загрузке вакансий. Попробуйте позже.',
    
    // Vacancy selection
    vacancy_selected: 'Отлично! Вы выбрали вакансию: "{{title}}"\n\n{{description}}\n\nТеперь давайте проведем интервью. Вы можете:\n1. Загрузить свое резюме (PDF, DOC, DOCX, TXT)\n2. Или просто рассказать о себе и своем опыте работы\n\nНачнем!',
    
    // File upload
    file_too_large: 'Файл слишком большой. Максимальный размер: 10MB',
    unsupported_format: 'Неподдерживаемый формат файла. Поддерживаются: PDF, DOC, DOCX, TXT',
    file_upload_error: 'Произошла ошибка при загрузке файла. Попробуйте еще раз.',
    file_name_error: 'Не удалось получить имя файла. Попробуйте загрузить файл заново.',
    user_error: 'Произошла ошибка при определении пользователя. Попробуйте /start',
    
    // CV Analysis
    cv_analysis_title: '📄 Анализ вашего резюме:',
    cv_strengths: '✅ Сильные стороны:',
    cv_gaps: '⚠️ Области для обсуждения:',
    cv_first_question: '❓ Первый вопрос:',
    cv_uploaded_success: '📄 Ваше резюме успешно загружено и проанализировано!',
    cv_analysis_fallback: 'К сожалению, не удалось выполнить автоматический анализ, но мы можем продолжить интервью. Расскажите о своем опыте работы и ключевых навыках.',
    tell_about_experience: 'Расскажите подробнее о своем опыте работы.',
    
    // Interview
    interview_error: 'Произошла ошибка при обработке сообщения. Попробуйте еще раз.',
    interview_completed: '🎯 Интервью завершено!\n\nСпасибо за участие в собеседовании. Мы тщательно рассмотрим ваши ответы и свяжемся с вами в ближайшее время с результатами.\n\nХорошего дня! 😊',
    evaluation_processing: 'Интервью завершено! Мы обработаем ваши ответы и свяжемся с вами в ближайшее время.',
    
    // Help
    help_title: 'Я HR-ассистент для проведения интервью и анализа резюме.',
    help_features: 'Возможности:\n• Загрузка резюме (PDF, DOC, DOCX, TXT файлы)\n• Интерактивное интервью по выбранной вакансии\n• Анализ соответствия требованиям вакансии',
    help_usage: 'Как использовать:\n1. Выберите вакансию командой /start\n2. Загрузите резюме или расскажите о себе\n3. Отвечайте на вопросы интервью',
    help_commands: 'Команды:\n/start - начать выбор вакансии\n/help - показать эту справку\n/clear - очистить историю разговора',
    
    // Clear
    history_cleared: 'История разговора очищена.',
    
    // Resume analysis format
    resume_format_error: 'Пожалуйста, укажите вакансию и резюме в формате:\nВакансия: [описание]\nРезюме: [текст]',
    resume_analysis_title: 'Анализ резюме:\n\n',
    resume_analysis_error: 'Ошибка при анализе резюме. Попробуйте еще раз.',
    
    // Common
    error_occurred: 'Произошла ошибка. Попробуйте еще раз.',
    loading: 'Загрузка...',
    retry: 'Повторить'
  },
  en: {
    // Bot messages
    greeting: 'Hello, {{name}}! I am an HR assistant. Please select a vacancy that interests you:',
    no_vacancies: 'Unfortunately, there are no active vacancies at the moment. Please try again later.',
    select_vacancy_first: 'Please select a vacancy first using the /start command',
    vacancy_not_found: 'Vacancy not found. Please try selecting another one.',
    error_vacancy_selection: 'An error occurred while selecting the vacancy. Please try again.',
    error_loading_vacancies: 'An error occurred while loading vacancies. Please try again later.',
    
    // Vacancy selection
    vacancy_selected: 'Great! You have selected the vacancy: "{{title}}"\n\n{{description}}\n\nNow let\'s conduct an interview. You can:\n1. Upload your resume (PDF, DOC, DOCX, TXT)\n2. Or simply tell us about yourself and your work experience\n\nLet\'s begin!',
    
    // File upload
    file_too_large: 'File is too large. Maximum size: 10MB',
    unsupported_format: 'Unsupported file format. Supported formats: PDF, DOC, DOCX, TXT',
    file_upload_error: 'An error occurred while uploading the file. Please try again.',
    file_name_error: 'Could not get file name. Please try uploading the file again.',
    user_error: 'An error occurred while identifying the user. Please try /start',
    
    // CV Analysis
    cv_analysis_title: '📄 Analysis of your resume:',
    cv_strengths: '✅ Strengths:',
    cv_gaps: '⚠️ Areas for discussion:',
    cv_first_question: '❓ First question:',
    cv_uploaded_success: '📄 Your resume has been successfully uploaded and analyzed!',
    cv_analysis_fallback: 'Unfortunately, automatic analysis could not be performed, but we can continue with the interview. Please tell us about your work experience and key skills.',
    tell_about_experience: 'Tell us more about your experience.',
    
    // Interview
    interview_error: 'An error occurred while processing the message. Please try again.',
    interview_completed: '🎯 Interview completed!\n\nThank you for participating in the interview. We will carefully review your answers and contact you shortly with the results.\n\nHave a great day! 😊',
    evaluation_processing: 'Interview completed! We will process your answers and contact you soon.',
    
    // Help
    help_title: 'I am an HR assistant for conducting interviews and analyzing resumes.',
    help_features: 'Features:\n• Resume upload (PDF, DOC, DOCX, TXT files)\n• Interactive interview for selected vacancy\n• Analysis of compliance with vacancy requirements',
    help_usage: 'How to use:\n1. Select a vacancy using /start command\n2. Upload your resume or tell us about yourself\n3. Answer interview questions',
    help_commands: 'Commands:\n/start - start vacancy selection\n/help - show this help\n/clear - clear conversation history',
    
    // Clear
    history_cleared: 'Conversation history cleared.',
    
    // Resume analysis format
    resume_format_error: 'Please specify the vacancy and resume in the format:\nVacancy: [description]\nResume: [text]',
    resume_analysis_title: 'Resume analysis:\n\n',
    resume_analysis_error: 'Error analyzing resume. Please try again.',
    
    // Common
    error_occurred: 'An error occurred. Please try again.',
    loading: 'Loading...',
    retry: 'Retry'
  }
};

class I18nService {
  private initialized = false;

  async initialize(language: string = 'ru'): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      i18n.init({
        lng: language,
        fallbackLng: 'en',
        resources: {
          ru: { translation: resources.ru || {} },
          en: { translation: resources.en || {} }
        } as I18nResources,
        interpolation: {
          escapeValue: false
        },
        debug: false
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          this.initialized = true;
          resolve();
        }
      });
    });
  }

  t(key: string, options?: any): string {
    if (!this.initialized) {
      console.warn('I18n not initialized, falling back to key:', key);
      return key;
    }
    return i18n.t(key, options) as string;
  }

  changeLanguage(language: string): Promise<any> {
    return i18n.changeLanguage(language);
  }

  getCurrentLanguage(): string {
    return i18n.language || 'ru';
  }

  getSupportedLanguages(): string[] {
    return ['ru', 'en'];
  }
}

export const i18nService = new I18nService();
export { i18n };
