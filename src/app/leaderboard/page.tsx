'use client'

import { useEffect, useState } from 'react'
import { Crown, Rocket, Star, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type LeaderboardEntry = {
  user_id: string
  name: string
  avatar_url: string | null
  automations: number
}

// Placeholder for the card component we'll create next
const LeaderboardCard = ({
  user,
  rank,
  tier,
}: {
  user: LeaderboardEntry
  rank: number
  tier: string
}) => (
  <div
    className={cn(
      'mb-2 flex items-center rounded-lg border p-3 shadow-sm',
      tier === 'top1' ? 'border-brand-primary bg-brand-primary/10' : 'border-border bg-white'
    )}
  >
    <span className="text-text-secondary mr-4 w-8 text-center text-lg font-bold">{rank}</span>
    <Image
      src={user.avatar_url || `https://avatar.vercel.sh/${user.name}`}
      alt={user.name}
      width={40}
      height={40}
      className="mr-4 h-10 w-10 rounded-full"
    />
    <div className="flex-grow">
      <p className="text-text-primary font-semibold">{user.name}</p>
      <p className="text-text-secondary text-sm">{user.automations} automations</p>
    </div>
    {tier === 'top1' && <Crown className="text-brand-primary h-6 w-6" />}
  </div>
)

const TierHeader = ({
  icon,
  title,
  range,
}: {
  icon: React.ReactNode
  title: string
  range: string
}) => (
  <div className="mt-8 mb-4 flex items-center">
    <div className="text-brand-primary mr-3">{icon}</div>
    <div>
      <h2 className="text-text-primary text-xl font-bold">{title}</h2>
      <p className="text-text-secondary text-sm">{range}</p>
    </div>
  </div>
)

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard')
        const data = await response.json()
        setLeaderboard(data.leaderboard)
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  const top1 = leaderboard.slice(0, 1)
  const top5 = leaderboard.slice(1, 5)
  const top20 = leaderboard.slice(5, 20)
  const top100 = leaderboard.slice(20, 100)

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        Loading Leaderboard...
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <Trophy className="text-brand-primary mx-auto mb-4 h-16 w-16" />
          <h1 className="text-text-primary text-4xl font-extrabold tracking-tight sm:text-5xl">
            Community Leaderboard
          </h1>
          <p className="text-text-secondary mt-4 text-xl">
            See who is leading the charge in automation creation!
          </p>
        </header>

        <main>
          {leaderboard.length === 0 ? (
            <p className="text-text-secondary text-center">No contributions yet. Be the first!</p>
          ) : (
            <>
              {top1.length > 0 && (
                <section>
                  <TierHeader
                    icon={<Crown className="h-8 w-8" />}
                    title="Top Contributor"
                    range="Rank 1"
                  />
                  {top1.map((user, i) => (
                    <LeaderboardCard key={user.user_id} user={user} rank={i + 1} tier="top1" />
                  ))}
                </section>
              )}

              {top5.length > 0 && (
                <section>
                  <TierHeader
                    icon={<Star className="h-8 w-8" />}
                    title="Elite Contributors"
                    range="Ranks 2-5"
                  />
                  {top5.map((user, i) => (
                    <LeaderboardCard key={user.user_id} user={user} rank={i + 2} tier="top5" />
                  ))}
                </section>
              )}

              {top20.length > 0 && (
                <section>
                  <TierHeader
                    icon={<Rocket className="h-8 w-8" />}
                    title="Top 20 Power Users"
                    range="Ranks 6-20"
                  />
                  {top20.map((user, i) => (
                    <LeaderboardCard key={user.user_id} user={user} rank={i + 6} tier="top20" />
                  ))}
                </section>
              )}

              {top100.length > 0 && (
                <section>
                  <TierHeader
                    icon={<Trophy className="h-8 w-8" />}
                    title="Top 100 Champions"
                    range="Ranks 21-100"
                  />
                  {top100.map((user, i) => (
                    <LeaderboardCard key={user.user_id} user={user} rank={i + 21} tier="top100" />
                  ))}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
