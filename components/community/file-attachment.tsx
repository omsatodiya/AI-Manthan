import { Download, FileIcon } from 'lucide-react'
import type { MessageAttachment } from '@/lib/types/chat'
import { formatFileSize, getFileIcon, isImageFile } from '@/lib/utils/file-utils'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface FileAttachmentProps {
  attachment: MessageAttachment
  isOwnMessage?: boolean
}

export const FileAttachment = ({ attachment, isOwnMessage }: FileAttachmentProps) => {
  const handleDownload = () => {
    window.open(attachment.fileUrl, '_blank')
  }

  if (isImageFile(attachment.fileType)) {
    return (
      <div className="relative group">
        <Image
          src={attachment.fileUrl}
          alt={attachment.fileName}
          width={300}
          height={200}
          className="rounded-lg max-w-[300px] h-auto cursor-pointer"
          onClick={handleDownload}
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
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        isOwnMessage ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'
      } cursor-pointer hover:bg-opacity-80 transition-colors`}
      onClick={handleDownload}
    >
      <div className="text-2xl">{getFileIcon(attachment.fileType)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.fileName}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
      </div>
      <Button size="icon" variant="ghost" onClick={handleDownload}>
        <Download className="size-4" />
      </Button>
    </div>
  )
}
