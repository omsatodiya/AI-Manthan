import { redirect } from 'next/navigation'
import { getCurrentUserAction } from '@/app/actions/auth'
import { CoinsBadgesSection } from '@/components/coin-badge/coins-badges-section'
// ...your other existing imports

const ProfilePage = async () => {
  const currentUser = await getCurrentUserAction()

  if (!currentUser) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Your existing profile header/info */}
        <div className="space-y-6">
        </div>

        {/* New Coins & Badges Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Community Activity</h2>
          <CoinsBadgesSection
            userId={currentUser.id}
            userName={currentUser.name}
            tenantId={currentUser.tenantId ?? null}
          />
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
