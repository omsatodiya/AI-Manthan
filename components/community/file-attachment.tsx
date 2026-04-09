import {
  Download,
  FileArchive,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
} from 'lucide-react'
import type { MessageAttachment } from '@/lib/types/chat'
import { formatFileSize, isImageFile } from '@/lib/utils/file-utils'
import { Button } from '@/components/ui/button'

interface FileAttachmentProps {
  attachment: MessageAttachment
  isOwnMessage?: boolean
}

export const FileAttachment = ({ attachment, isOwnMessage }: FileAttachmentProps) => {
  const bucket = (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'chat-attachments').replace(/^['"]+|['"]+$/g, '')
  const extension = attachment.fileName.split('.').pop()?.toUpperCase() || 'FILE'

  const getAttachmentMeta = (fileType: string, ext: string) => {
    const normalized = `${fileType} ${ext}`.toLowerCase()
    if (normalized.includes('pdf')) {
      return { label: 'PDF', Icon: FileType2 }
    }
    if (
      normalized.includes('doc') ||
      normalized.includes('word') ||
      normalized.includes('text') ||
      normalized.includes('txt')
    ) {
      return { label: 'DOC', Icon: FileText }
    }
    if (
      normalized.includes('sheet') ||
      normalized.includes('excel') ||
      normalized.includes('csv') ||
      normalized.includes('xls')
    ) {
      return { label: 'XLS', Icon: FileSpreadsheet }
    }
    if (
      normalized.includes('zip') ||
      normalized.includes('rar') ||
      normalized.includes('7z') ||
      normalized.includes('tar') ||
      normalized.includes('gz')
    ) {
      return { label: 'ZIP', Icon: FileArchive }
    }
    if (
      normalized.includes('json') ||
      normalized.includes('xml') ||
      normalized.includes('javascript') ||
      normalized.includes('typescript')
    ) {
      return { label: 'CODE', Icon: FileCode2 }
    }
    if (normalized.includes('image')) {
      return { label: 'IMG', Icon: FileImage }
    }
    return { label: extension.slice(0, 4), Icon: FileText }
  }

  const attachmentMeta = getAttachmentMeta(attachment.fileType, extension)

  const extractPathFromAttachment = () => {
    if (attachment.id && !attachment.id.startsWith('http')) {
      return attachment.id
    }
    const url = attachment.fileUrl || ''
    if (!url) return null
    const publicMarker = `/storage/v1/object/public/${bucket}/`
    const signedMarker = `/storage/v1/object/sign/${bucket}/`
    const marker = url.includes(publicMarker) ? publicMarker : signedMarker
    const index = marker ? url.indexOf(marker) : -1
    if (index === -1) return null
    const raw = url.slice(index + marker.length).split('?')[0]
    return decodeURIComponent(raw)
  }

  const openAttachment = async (download: boolean) => {
    const filePath = extractPathFromAttachment()
    if (!filePath) {
      window.open(attachment.fileUrl, '_blank', 'noopener,noreferrer')
      return
    }
    try {
      const params = new URLSearchParams({
        path: filePath,
        bucket,
        download: download ? '1' : '0',
      })
      const response = await fetch(`/api/chat/attachment-url?${params.toString()}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || 'Failed to resolve attachment URL')
      }
      window.open(payload.url, '_blank', 'noopener,noreferrer')
    } catch {
      window.open(attachment.fileUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleOpen = () => {
    void openAttachment(false)
  }

  const handleDownload = () => {
    void openAttachment(true)
  }

  if (isImageFile(attachment.fileType)) {
    return (
      <div className="relative group">
        <img
          src={attachment.fileUrl}
          alt={attachment.fileName}
          className="rounded-lg max-w-[300px] h-auto cursor-pointer"
          onClick={handleOpen}
        />
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDownload}
        >
          <Download className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`w-full max-w-[320px] flex items-center gap-3 p-3 rounded-xl border text-left ${
        isOwnMessage
          ? 'bg-primary-foreground/10 border-primary-foreground/30'
          : 'bg-muted/80 border-border'
      } hover:bg-muted/70 transition-colors`}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleOpen()
        }
      }}
    >
      <div className="shrink-0 h-10 w-10 rounded-lg bg-background/90 border border-border flex items-center justify-center">
        <attachmentMeta.Icon className="size-5 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium font-sans truncate">{attachment.fileName}</p>
        <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
          <span className="uppercase">{attachmentMeta.label}</span>
          <span>•</span>
          <span>{formatFileSize(attachment.fileSize)}</span>
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={(event) => {
          event.stopPropagation()
          handleDownload()
        }}
      >
        <Download className="size-4" />
      </Button>
    </div>
  )
}
