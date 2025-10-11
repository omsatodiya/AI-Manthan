'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface EditMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialContent: string
  onConfirm: (newContent: string) => void
}

export const EditMessageDialog = ({
  open,
  onOpenChange,
  initialContent,
  onConfirm,
}: EditMessageDialogProps) => {
  const [content, setContent] = useState(initialContent)

  useEffect(() => {
    if (open) {
      setContent(initialContent)
    }
  }, [open, initialContent])

  const handleConfirm = () => {
    if (content.trim() && content !== initialContent) {
      onConfirm(content.trim())
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
          <DialogDescription>
            Make changes to your message. You can only edit within 1 minute of sending.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          className="min-h-[100px]"
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!content.trim() || content === initialContent}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
