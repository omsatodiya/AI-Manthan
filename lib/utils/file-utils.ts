/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Check if file type is an image
 */
export function isImageFile(fileType: string): boolean {
  return fileType.startsWith('image/')
}

/**
 * Check if file type is a document
 */
export function isDocumentFile(fileType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ]
  return documentTypes.includes(fileType)
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType: string): string {
  if (isImageFile(fileType)) return '🖼️'
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('word') || fileType.includes('document')) return '📝'
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
  if (fileType.includes('text')) return '📃'
  return '📎'
}

/**
 * Validate file size (max 10MB)
 */
export function validateFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return fileSize <= maxSizeBytes
}

/**
 * Validate file type
 */
export function validateFileType(fileType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ]
  return allowedTypes.includes(fileType)
}
