/**
 * Document Content Extractor
 * Extracts text content from various document types for embedding generation
 */

import type { MessageAttachment } from '@/lib/types/chat';

export interface ExtractedContent {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    extractedAt: string;
  };
}

export class DocumentExtractor {
  /**
   * Extract text content from a document attachment
   */
  async extractContent(attachment: MessageAttachment): Promise<ExtractedContent | null> {
    try {
      const { fileName, fileType, fileSize, fileUrl } = attachment;

      // Check if it's a document type we can process
      if (!this.isProcessableDocument(fileType)) {
        return null;
      }

      // Fetch the file content
      const response = await fetch(fileUrl);
      if (!response.ok) {
        console.error(`Failed to fetch document: ${response.statusText}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const text = await this.extractTextFromBuffer(arrayBuffer, fileType, fileName);

      if (!text || text.trim().length === 0) {
        return null;
      }

      return {
        text: text.trim(),
        metadata: {
          fileName,
          fileType,
          fileSize,
          extractedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error extracting document content:', error);
      return null;
    }
  }

  /**
   * Check if a file type can be processed for text extraction
   */
  private isProcessableDocument(fileType: string): boolean {
    const processableTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      // Image types for OCR
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp'
    ];
    return processableTypes.includes(fileType);
  }

  /**
   * Extract text from file buffer based on file type
   */
  private async extractTextFromBuffer(
    buffer: ArrayBuffer, 
    fileType: string, 
    fileName: string
  ): Promise<string> {
    try {
      if (fileType === 'text/plain' || fileType === 'text/csv') {
        // Handle plain text files
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(buffer);
      }

      if (fileType === 'application/pdf') {
        // Handle PDF files with OCR
        return await this.extractTextFromPDF(buffer);
      }

      if (fileType.includes('word') || fileType.includes('document')) {
        // Handle Word documents
        return await this.extractTextFromWord(buffer);
      }

      if (fileType.includes('excel') || fileType.includes('sheet')) {
        // Handle Excel files
        return await this.extractTextFromExcel(buffer);
      }

      if (fileType.startsWith('image/')) {
        // Handle image files with OCR
        return await this.extractTextFromImage(buffer, fileType);
      }

      // Fallback: try to decode as text
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    } catch (error) {
      console.error(`Error extracting text from ${fileType}:`, error);
      return '';
    }
  }

  /**
   * Extract text from PDF using OCR
   */
  private async extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    try {
      console.log('Extracting text from PDF using OCR...');
      
      // For now, return a placeholder since Tesseract.js has issues with Next.js SSR
      // TODO: Implement proper OCR solution or use alternative approach
      console.log('PDF OCR temporarily disabled due to Next.js compatibility issues');
      return 'PDF document content (OCR temporarily disabled - contains scanned text or images)';
    } catch (error) {
      console.error('Error extracting PDF text with OCR:', error);
      return 'PDF document content (OCR extraction failed)';
    }
  }

  /**
   * Extract text from image files using OCR
   */
  private async extractTextFromImage(buffer: ArrayBuffer, fileType: string): Promise<string> {
    try {
      console.log(`Extracting text from image (${fileType}) using OCR...`);
      
      // For now, return a placeholder since Tesseract.js has issues with Next.js SSR
      // TODO: Implement proper OCR solution or use alternative approach
      console.log('Image OCR temporarily disabled due to Next.js compatibility issues');
      return 'Image document content (OCR temporarily disabled - contains text that could be extracted)';
    } catch (error) {
      console.error('Error extracting image text with OCR:', error);
      return 'Image document content (OCR extraction failed)';
    }
  }

  /**
   * Extract text from Word documents using mammoth library
   */
  private async extractTextFromWord(buffer: ArrayBuffer): Promise<string> {
    try {
      // Use require for mammoth as it has issues with dynamic import
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      
      if (result && result.value) {
        return result.value.trim();
      }
      
      return '';
    } catch (error) {
      console.error('Error extracting Word text:', error);
      return '';
    }
  }

  /**
   * Extract text from Excel files using xlsx library
   */
  private async extractTextFromExcel(buffer: ArrayBuffer): Promise<string> {
    try {
      // Use require for xlsx as it has issues with dynamic import
      const XLSX = require('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      let extractedText = '';
      
      // Extract text from all sheets
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_csv(worksheet);
        
        if (sheetData && sheetData.trim()) {
          extractedText += `Sheet: ${sheetName}\n${sheetData}\n\n`;
        }
      });
      
      return extractedText.trim();
    } catch (error) {
      console.error('Error extracting Excel text:', error);
      return '';
    }
  }

  /**
   * Create a summary of the extracted content for embedding
   */
  createContentSummary(extractedContent: ExtractedContent): string {
    const { text, metadata } = extractedContent;
    
    // Return full content without truncation for better embedding quality
    return `Document: ${metadata.fileName}
Type: ${metadata.fileType}
Size: ${this.formatFileSize(metadata.fileSize)}
Content: ${text}`;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if a document has enough content to be useful for embeddings
   */
  isContentUseful(extractedContent: ExtractedContent): boolean {
    const { text } = extractedContent;
    
    // For OCR content, be more lenient since OCR might have some errors
    if (text.length < 20) return false; // Lower threshold for OCR
    
    // Check for meaningful word patterns (lower threshold for OCR)
    const words = text.split(/\s+/).filter(word => word.length > 1); // Allow shorter words for OCR
    if (words.length < 5) return false; // Lower threshold for OCR
    
    // Check for common document patterns (more lenient for OCR)
    const hasDocumentPatterns = /[A-Za-z]{2,}/.test(text) || /\d+/.test(text);
    
    return hasDocumentPatterns;
  }
}

// Export singleton instance
export const documentExtractor = new DocumentExtractor();
