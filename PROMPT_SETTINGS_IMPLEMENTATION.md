# LLM Prompt Settings Implementation

## Overview

This implementation adds a complete UI and API system for managing LLM prompts used in the AI HR Bot. The system allows administrators to edit, create, and manage prompts through a web interface instead of hardcoding them in the bot handlers.

## Features Implemented

### 1. Database Layer
- **New Table**: `prompt_settings` with fields:
  - `id` (Primary key)
  - `name` (Unique prompt identifier)
  - `description` (Human-readable description)
  - `prompt_template` (The actual prompt with variable placeholders)
  - `category` (Grouping for organization)
  - `is_active` (Enable/disable prompts)
  - `created_at` / `updated_at` (Timestamps)

### 2. Backend API
- **Repository**: `PromptSettingsRepository` extending `BaseRepository`
- **Routes**: `/api/prompt-settings` with full CRUD operations:
  - `GET /api/prompt-settings` - List all prompts (with filtering)
  - `GET /api/prompt-settings/categories` - Get all categories
  - `GET /api/prompt-settings/:id` - Get prompt by ID
  - `GET /api/prompt-settings/name/:name` - Get prompt by name
  - `POST /api/prompt-settings` - Create new prompt
  - `PUT /api/prompt-settings/:id` - Update prompt
  - `DELETE /api/prompt-settings/:id` - Delete prompt

### 3. Prompt Service
- **PromptService**: Handles prompt template rendering and caching
- **Features**:
  - Template variable substitution using `{{variable}}` syntax
  - Automatic caching with 5-minute TTL
  - Fallback prompts when database is unavailable
  - Cache invalidation support

### 4. Frontend UI
- **Settings Page**: Complete UI for managing prompts
- **Features**:
  - List all prompts with category filtering
  - Create/Edit modal with form validation
  - Category management (existing + new categories)
  - Syntax highlighting for prompt templates
  - Active/inactive status toggle
  - Delete confirmation

### 5. Bot Integration
- **Updated Handlers**: All LLM prompts now use the PromptService
- **Migrated Prompts**:
  - `cv_analysis` - For analyzing uploaded CV files
  - `resume_analysis` - For analyzing resume text in chat
  - `interview_chat` - For conducting interview conversations

## Default Prompts

The system comes with three pre-configured prompts:

1. **CV Analysis** (`cv_analysis`)
   - Used when candidates upload CV files
   - Variables: `{{vacancy_context}}`, `{{file_name}}`, `{{file_content}}`

2. **Resume Analysis** (`resume_analysis`)
   - Used for text-based resume analysis
   - Variables: `{{job_description}}`, `{{resume}}`

3. **Interview Chat** (`interview_chat`)
   - Used during candidate interviews
   - Variables: `{{vacancy_context}}`, `{{conversation_context}}`, `{{question_count}}`, `{{candidate_message}}`

## Navigation

The Settings page is accessible via:
- Admin panel sidebar: **⚙️ Settings**
- Direct URL: `/settings`

## Variable System

Prompts support dynamic variables using the `{{variable_name}}` syntax:
- Variables are replaced at runtime with actual values
- Common variables include context data, user inputs, and system state
- Undefined variables are replaced with empty strings

## API Testing

All API endpoints have been tested and verified:
- ✅ GET operations (list, get by ID, get by name, categories)
- ✅ POST operations (create new prompts)
- ✅ PUT operations (update existing prompts)
- ✅ DELETE operations (remove prompts)
- ✅ Error handling and validation

## Files Added/Modified

### New Files:
- `src/database/migrations/003_add_prompt_settings.ts`
- `src/repositories/PromptSettingsRepository.ts`
- `src/routes/prompt-settings.ts`
- `src/services/prompt.service.ts`
- `admin-panel/src/services/promptSettingsService.ts`
- `admin-panel/src/pages/Settings.tsx`

### Modified Files:
- `src/server.ts` - Added prompt settings routes
- `src/repositories/index.ts` - Export new repository
- `src/bot/handlers.ts` - Integrated PromptService
- `admin-panel/src/App.tsx` - Added Settings route
- `admin-panel/src/components/Sidebar.tsx` - Added Settings navigation

## Usage

1. **Access Settings**: Navigate to the admin panel and click "Settings"
2. **View Prompts**: See all prompts organized by category
3. **Edit Prompt**: Click "Edit" to modify prompt template or settings
4. **Create Prompt**: Click "+ New Prompt" to add custom prompts
5. **Manage Categories**: Create new categories or use existing ones
6. **Toggle Status**: Enable/disable prompts using the active checkbox

## Technical Notes

- The system uses PostgreSQL JSONB for flexible prompt storage
- Prompts are cached in memory for performance
- The UI uses Preact for lightweight rendering
- All API responses follow a consistent success/error format
- The system maintains backward compatibility with fallback prompts

## Future Enhancements

Potential improvements for the system:
- Version history for prompt changes
- A/B testing for different prompt variations
- Import/export functionality for prompt templates
- Role-based access control for prompt editing
- Prompt performance analytics and metrics
