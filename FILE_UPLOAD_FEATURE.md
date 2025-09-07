# File Upload Feature - CV/Resume Support

This document describes the file upload functionality implemented for the AI HR Bot system.

## Overview

The bot now supports file uploads from candidates, specifically CVs and resumes. When candidates interact with the bot, they can upload their resume files which are then analyzed and stored for HR review.

## Features

### 1. **File Upload Support**
- Supports PDF, DOC, DOCX, and TXT file formats
- Maximum file size: 10MB
- Files are stored locally in the `uploads/` directory
- Automatic file validation and sanitization

### 2. **Database Storage**
- CV information is stored in the `candidates` table
- Document messages are tracked in the `dialogues` table
- File metadata including path, name, and size are preserved

### 3. **Bot Integration**
- Users can upload files at any time during the interview process
- Files are automatically analyzed using the LLM service
- CV content is used to provide contextual interview questions

### 4. **Admin Panel Integration**
- CV information is displayed in the dialogue history modal
- Document upload count is shown in message statistics
- File details (name, size, upload date) are visible to HR managers

## Technical Implementation

### Database Schema Changes

#### Candidates Table
```sql
ALTER TABLE candidates 
ADD COLUMN cv_file_path VARCHAR(500),
ADD COLUMN cv_file_name VARCHAR(255),
ADD COLUMN cv_file_size INTEGER,
ADD COLUMN cv_uploaded_at TIMESTAMP;
```

#### Dialogues Table
```sql
ALTER TABLE dialogues 
ADD COLUMN document_file_path VARCHAR(500),
ADD COLUMN document_file_name VARCHAR(255),
ADD COLUMN document_file_size INTEGER;

-- Updated message_type constraint
ALTER TABLE dialogues 
ADD CONSTRAINT dialogues_message_type_check 
CHECK (message_type IN ('text', 'audio', 'system', 'document'));
```

### File Storage Service

The `FileStorageService` handles:
- File downloads from Telegram
- File validation and sanitization
- Local storage management
- File content extraction (basic)
- Cleanup operations

### Bot Handlers

New document handler:
- Validates file types and sizes
- Downloads files from Telegram
- Updates candidate records
- Triggers CV analysis
- Stores dialogue records

## Usage

### For Candidates
1. Start a conversation with the bot using `/start`
2. Select a vacancy
3. Upload your CV/resume as a document
4. The bot will analyze your CV and ask relevant questions
5. Continue with the interview process

### For HR Managers
1. View candidate dialogues in the admin panel
2. See CV upload information in the candidate summary
3. Review document messages in the conversation timeline
4. Access file details including upload date and size

## File Security

- Files are stored with sanitized names
- Directory traversal protection
- File size limits enforced
- Only allowed file extensions accepted
- Unique file naming to prevent conflicts

## Migration

To apply the database changes to an existing installation:

```bash
npm run build
node dist/run-migration.js
```

Or using tsx directly:
```bash
tsx run-migration.ts
```

## Configuration

The file upload feature uses the following configuration:
- Upload directory: `uploads/` (created automatically)
- Max file size: 10MB
- Allowed extensions: `.pdf`, `.doc`, `.docx`, `.txt`, `.rtf`

## Future Enhancements

1. **Advanced File Parsing**
   - PDF text extraction using pdf-parse
   - DOCX parsing using mammoth
   - Structured data extraction

2. **File Management**
   - File download endpoints for HR managers
   - Automatic cleanup of old files
   - Cloud storage integration (S3, Google Drive)

3. **Enhanced Analysis**
   - Skills extraction from CVs
   - Experience timeline analysis
   - Education verification

4. **Security Improvements**
   - File virus scanning
   - Encrypted file storage
   - Access logging and audit trails

## Error Handling

The system handles various error scenarios:
- Invalid file types
- Files too large
- Network errors during download
- Storage failures
- Analysis errors

All errors are logged and user-friendly messages are provided to candidates.

## Monitoring

File upload activities are logged with:
- Candidate information
- File details
- Success/failure status
- Error messages
- Timestamps

This enables monitoring and debugging of the file upload functionality.
