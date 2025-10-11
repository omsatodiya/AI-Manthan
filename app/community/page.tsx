import React from 'react'
import { redirect } from 'next/navigation'
import { RealtimeChat } from '@/components/community/realtime-chat'
import { getCurrentUserAction } from '@/app/actions/auth'

const CommunityPage = async () => {
  // Fetch current user from auth action
  const currentUser = await getCurrentUserAction()

  // Redirect to login if not authenticated
  if (!currentUser) {
    redirect('/login') // Adjust the login path as needed
  }

  return (
    <div className="h-screen w-full">
      <RealtimeChat
        userId={currentUser.id}
        username={currentUser.name}
        tenantId={currentUser.tenantId ?? undefined} // pass tenant scope
      />
    </div>
  )
}

export default CommunityPage
