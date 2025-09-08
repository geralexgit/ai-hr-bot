# I18n Implementation Summary

This document describes the internationalization (i18n) implementation for the AI HR Bot project, with Russian as the default language and English as a fallback.

## Overview

The project now supports multiple languages (Russian and English) across both the backend Telegram bot and the admin panel frontend.

## Backend Implementation (Telegram Bot)

### I18n Service (`src/services/i18n.service.ts`)

- **Default Language**: Russian (`ru`)
- **Fallback Language**: English (`en`)
- **Framework**: i18next
- **Initialization**: Automatic initialization in bot handlers constructor

### Key Features

1. **Translation Keys**: All user-facing messages use translation keys
2. **Variable Interpolation**: Support for dynamic content using `{{variable}}` syntax
3. **Language Switching**: Runtime language switching capability
4. **Fallback Mechanism**: Falls back to English if Russian translation is missing

### Updated Components

- `src/bot/handlers.ts`: All bot messages now use i18n service
- Bot messages for:
  - Greetings and vacancy selection
  - Error messages
  - Help text
  - File upload responses
  - Interview completion messages

### Translation Keys (Examples)

```typescript
// Russian
greeting: 'Привет, {{name}}! Я HR-ассистент. Выберите вакансию, которая вас интересует:'
no_vacancies: 'К сожалению, в данный момент нет активных вакансий. Попробуйте позже.'
error_loading_vacancies: 'Произошла ошибка при загрузке вакансий. Попробуйте позже.'

// English
greeting: 'Hello, {{name}}! I am an HR assistant. Please select a vacancy that interests you:'
no_vacancies: 'Unfortunately, there are no active vacancies at the moment. Please try again later.'
error_loading_vacancies: 'An error occurred while loading vacancies. Please try again later.'
```

## Frontend Implementation (Admin Panel)

### I18n Setup (`admin-panel/src/i18n.ts`)

- **Default Language**: Russian (`ru`)
- **Fallback Language**: English (`en`)
- **Framework**: i18next (custom Preact integration)
- **Initialization**: Automatic initialization in main.tsx before app render
- **Custom Hook**: `useI18n` hook for Preact compatibility

### Updated Components

1. **main.tsx**: I18n initialization before app render
2. **hooks/useI18n.ts**: Custom hook for Preact compatibility
3. **Sidebar.tsx**: Navigation menu translations
4. **Dashboard.tsx**: Dashboard content and statistics
5. **Settings.tsx**: Settings page and forms
6. **Header.tsx**: Language selector integration
7. **LanguageSelector.tsx**: Language switching component

### Language Selector

A dropdown component in the header allows users to switch between Russian and English:

```typescript
<select value={i18n.language} onChange={handleLanguageChange}>
  <option value="ru">Русский</option>
  <option value="en">English</option>
</select>
```

### Translation Keys (Examples)

```typescript
// Navigation
dashboard: 'Панель управления' / 'Dashboard'
vacancies: 'Вакансии' / 'Vacancies'
candidates: 'Кандидаты' / 'Candidates'
settings: 'Настройки' / 'Settings'

// Dashboard
active_vacancies: 'Активные вакансии' / 'Active Vacancies'
total_candidates: 'Всего кандидатов' / 'Total Candidates'
interviews_today: 'Интервью сегодня' / 'Interviews Today'
success_rate: 'Процент успеха' / 'Success Rate'
```

## Usage

### Backend (Bot)

```typescript
import { i18nService } from '../services/i18n.service.js';

// Initialize with Russian (default)
await i18nService.initialize('ru');

// Use translations
const message = i18nService.t('greeting', { name: userName });
this.bot.sendMessage(chatId, message);

// Change language
await i18nService.changeLanguage('en');
```

### Frontend (Admin Panel)

```typescript
import { useI18n } from '../hooks/useI18n';

function MyComponent() {
  const { t, i18n } = useI18n();
  
  return (
    <div>
      <h1>{t('dashboard_title')}</h1>
      <button onClick={() => i18n.changeLanguage('en')}>
        Switch to English
      </button>
    </div>
  );
}
```

## File Structure

```
src/
├── services/
│   └── i18n.service.ts          # Backend i18n service
└── bot/
    └── handlers.ts              # Updated with i18n calls

admin-panel/src/
├── main.tsx                     # App entry with i18n initialization
├── i18n.ts                      # Frontend i18n configuration
├── hooks/
│   └── useI18n.ts               # Custom i18n hook for Preact
├── components/
│   ├── LanguageSelector.tsx     # Language switching component
│   ├── Header.tsx               # Updated with language selector
│   └── Sidebar.tsx              # Updated with translations
└── pages/
    ├── Dashboard.tsx            # Updated with translations
    └── Settings.tsx             # Updated with translations
```

## Build and Deployment

Both backend and frontend build successfully with the new i18n implementation:

```bash
# Backend
npm run build

# Frontend
npm run build:ui
```

## Default Behavior

- **Bot Language**: Russian by default, all messages display in Russian
- **Admin Panel Language**: Russian by default, users can switch to English via the language selector
- **Fallback**: If a translation key is missing in Russian, it falls back to English
- **Persistence**: Language selection persists during the session

## Future Enhancements

1. **Language Persistence**: Store user language preference in database
2. **Additional Languages**: Easy to add more languages by extending the resource files
3. **Context-Aware Translations**: Different translations based on user context
4. **Pluralization**: Support for plural forms in different languages
5. **Date/Time Localization**: Format dates and times according to locale
