import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import TelegramBot from 'node-telegram-bot-api';

export interface FileUploadResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
}

export class FileStorageService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];

  constructor(uploadDir: string = 'uploads') {
    this.uploadDir = path.resolve(uploadDir);
    this.ensureUploadDirectory();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info('Created upload directory', { uploadDir: this.uploadDir });
    }
  }

  /**
   * Download file from Telegram and store it locally
   */
  async downloadTelegramFile(
    bot: TelegramBot,
    fileId: string,
    fileName: string,
    candidateId: number
  ): Promise<FileUploadResult> {
    try {
      // Get file info from Telegram
      const file = await bot.getFile(fileId);
      
      if (!file.file_path) {
        throw new Error('File path not available from Telegram');
      }

      // Check file size
      if (file.file_size && file.file_size > this.maxFileSize) {
        throw new Error(`File size ${file.file_size} exceeds maximum allowed size ${this.maxFileSize}`);
      }

      // Validate file extension
      const extension = path.extname(fileName).toLowerCase();
      if (!this.allowedExtensions.includes(extension)) {
        throw new Error(`File extension ${extension} is not allowed. Allowed: ${this.allowedExtensions.join(', ')}`);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedFileName = this.sanitizeFileName(fileName);
      const uniqueFileName = `${candidateId}_${timestamp}_${sanitizedFileName}`;
      const localFilePath = path.join(this.uploadDir, uniqueFileName);

      // Download file from Telegram
      const fileBuffer = await bot.downloadFile(fileId, this.uploadDir);
      
      // Rename to our unique filename
      const tempPath = path.join(this.uploadDir, path.basename(file.file_path));
      try {
        await fs.rename(tempPath, localFilePath);
      } catch {
        // If rename fails, try copying the buffer directly
        await fs.writeFile(localFilePath, fileBuffer);
      }

      // Get file stats
      const stats = await fs.stat(localFilePath);

      logger.info('File uploaded successfully', {
        originalName: fileName,
        savedAs: uniqueFileName,
        size: stats.size,
        candidateId
      });

      return {
        filePath: localFilePath,
        fileName: uniqueFileName,
        fileSize: stats.size
      };

    } catch (error) {
      logger.error('Failed to download Telegram file', {
        fileId,
        fileName,
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get file content as text (for PDF/DOC parsing in the future)
   */
  async getFileContent(filePath: string): Promise<string> {
    try {
      const extension = path.extname(filePath).toLowerCase();
      
      // For now, only handle text files directly
      if (extension === '.txt') {
        return await fs.readFile(filePath, 'utf-8');
      }

      // For other formats, we'll return a placeholder
      // In a real implementation, you'd use libraries like:
      // - pdf-parse for PDF files
      // - mammoth for DOCX files
      // - textract for general document parsing
      return `[Document uploaded: ${path.basename(filePath)}]`;

    } catch (error) {
      logger.error('Failed to read file content', {
        filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info('File deleted', { filePath });
    } catch (error) {
      logger.error('Failed to delete file', {
        filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filePath: string): Promise<{ size: number; createdAt: Date; modifiedAt: Date }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      logger.error('Failed to get file stats', {
        filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Sanitize filename to prevent directory traversal and other issues
   */
  private sanitizeFileName(fileName: string): string {
    // Remove any path separators and dangerous characters
    return fileName
      .replace(/[\/\\]/g, '_')
      .replace(/[<>:"|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 100); // Limit length
  }

  /**
   * Get upload directory path
   */
  getUploadDir(): string {
    return this.uploadDir;
  }

  /**
   * List all files in upload directory
   */
  async listFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.uploadDir);
      return files.filter(file => !file.startsWith('.'));
    } catch (error) {
      logger.error('Failed to list files', {
        uploadDir: this.uploadDir,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Clean up old files (older than specified days)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    try {
      const files = await this.listFiles();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }

      logger.info('Cleanup completed', { deletedCount, daysOld });
      return deletedCount;

    } catch (error) {
      logger.error('Failed to cleanup old files', {
        daysOld,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}
