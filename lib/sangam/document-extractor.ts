/**
 * Document Content Extractor
 * Extracts text content from various document types for embedding generation
 */

import type { MessageAttachment } from '@/lib/types/chat';
import { geminiService } from './gemini';

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
      let text = await this.extractTextFromBuffer(arrayBuffer, fileType);

      if (!text || text.trim().length === 0) {
        return null;
      }

      // Normalize text (handle common encoding issues)
      text = this.normalizeText(text);

      // Smart Refinement: If text is fragmented or noisy, use Groq to restructure it
      if (this.shouldRefineText(text)) {
        console.log(`[DocumentExtractor] Fragmented text detected for ${fileName}, refining with Groq...`);
        text = await geminiService.refineExtractedText(text, fileName);
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
    fileType: string
  ): Promise<string> {
    try {
      if (fileType === 'text/plain' || fileType === 'text/csv') {
        // Handle plain text files
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(buffer);
      }

      if (fileType === 'application/pdf') {
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
      console.log('[DocumentExtractor] Attempting PDF extraction with pdf-parse...');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      
      // Ensure we are using a clean Node.js Buffer from the ArrayBuffer
      const nodeBuffer = Buffer.from(new Uint8Array(buffer));
      
      const result = await pdfParse(nodeBuffer);
      const text = typeof result?.text === 'string' ? result.text.trim() : '';
      
      if (text.length > 10) {
        console.log(`[DocumentExtractor] Successfully extracted ${text.length} chars from PDF`);
        return text;
      }
      
      console.warn('[DocumentExtractor] pdf-parse returned empty or very short text');
      return 'PDF document uploaded (no extractable text found)';
    } catch (error) {
      console.error('[DocumentExtractor] Error extracting PDF text:', error);
      // Return a specific error string that we can filter later
      return 'PDF document uploaded (text extraction failed)';
    }
  }

  /**
   * Extract text from image files using OCR
   */
  private async extractTextFromImage(buffer: ArrayBuffer, fileType: string): Promise<string> {
    try {
      console.log(`[DocumentExtractor] Extracting text from image (${fileType}) using Groq Vision OCR...`);
      
      const nodeBuffer = Buffer.from(buffer);
      const base64Image = nodeBuffer.toString('base64');
      
      const extractedText = await geminiService.extractTextFromImage(base64Image, fileType);
      
      if (extractedText) {
        return extractedText;
      }
      
      return 'Image document content (OCR failed to extract readable text)';
    } catch (error) {
      console.error('Error extracting image text with Groq Vision:', error);
      return 'Image document content (OCR extraction failed)';
    }
  }

  /**
   * Normalize extracted text to fix common encoding and whitespace issues
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/[^\x20-\x7E\n]/g, (char) => {
        // Basic mapping for common non-ASCII characters if needed
        const charCode = char.charCodeAt(0);
        if (charCode === 8211 || charCode === 8212) return '-'; // En/Em dash
        if (charCode === 8216 || charCode === 8217) return "'"; // Smart quotes
        if (charCode === 8220 || charCode === 8221) return '"'; // Smart double quotes
        return char;
      })
      .replace(/ +/g, ' ') // Collapse multiple spaces
      .replace(/\n\n+/g, '\n\n') // Collapse multiple newlines
      .trim();
  }

  /**
   * Determine if the text is fragmented enough to warrant Groq refinement
   */
  private shouldRefineText(text: string): boolean {
    if (text.length < 100) return false;

    // Check for high density of line breaks relative to text length (indicates fragmentation)
    const lineCount = text.split('\n').length;
    const fragmentationRatio = lineCount / (text.length / 50); // Average 50 chars per line
    
    // Check for common FAQ/List patterns that might be broken
    const hasBrokenLists = /[•\-\d]\s*\n\s*[A-Z]/.test(text);
    
    return fragmentationRatio > 1.5 || hasBrokenLists || text.includes('');
  }

  /**
   * Extract text from Word documents using mammoth library
   */
  private async extractTextFromWord(buffer: ArrayBuffer): Promise<string> {
    try {
      // Use require for mammoth as it has issues with dynamic import
      // eslint-disable-next-line @typescript-eslint/no-require-imports
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
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const XLSX = require('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      let extractedText = '';
      
      // Extract text from all sheets
      workbook.SheetNames.forEach((sheetName: string) => {
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
    
    // Filter out our internal "failure" strings
    if (text.includes('(no extractable text found)') || text.includes('(text extraction failed)')) {
      return false;
    }

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
