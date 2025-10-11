/**
 * Check if a message can be edited (within 1 minute of creation)
 */
export function canEditMessage(createdAt: string): boolean {
  const messageTime = new Date(createdAt).getTime()
  const currentTime = Date.now()
  const oneMinute = 60 * 1000 // 1 minute in milliseconds
  
  return currentTime - messageTime <= oneMinute
}

/**
 * Check if a message has been edited
 */
export function isMessageEdited(createdAt: string, updatedAt?: string): boolean {
  if (!updatedAt) return false
  return new Date(updatedAt).getTime() > new Date(createdAt).getTime()
}
