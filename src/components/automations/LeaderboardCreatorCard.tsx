'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Rocket, Star, Trophy } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LeaderboardCreatorCardProps {
  name: string
  avatarUrl: string | null
  rank: number | null
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getRankDetails = (rank: number | null) => {
  if (rank === null) return { Icon: null, name: 'Unranked', color: 'text-text-secondary' }
  if (rank === 1) return { Icon: Crown, name: 'Top Contributor', color: 'text-brand-primary' }
  if (rank <= 5) return { Icon: Star, name: 'Elite Contributor', color: 'text-text-secondary' }
  if (rank <= 20) return { Icon: Rocket, name: 'Power User', color: 'text-text-secondary' }
  if (rank <= 100) return { Icon: Trophy, name: 'Top 100 Champion', color: 'text-text-secondary' }
  return { Icon: null, name: 'Contributor', color: 'text-text-secondary' }
}

export function LeaderboardCreatorCard({ name, avatarUrl, rank }: LeaderboardCreatorCardProps) {
  const { Icon, name: rankName, color } = getRankDetails(rank)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-text-primary">About the Creator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-text-primary font-semibold">{name}</p>

            <Link href="/leaderboard" className="group mt-1 inline-block">
              <div
                className={cn(
                  'inline-flex items-center space-x-1.5 rounded-full border px-2 py-0.5 transition-colors group-hover:bg-gray-100',
                  rank === 1 ? 'border-brand-primary' : 'border-border'
                )}
              >
                {Icon && <Icon className={cn('h-4 w-4 flex-shrink-0', color)} />}
                <span className="text-text-primary text-xs font-medium">{rankName}</span>
              </div>
            </Link>

            {rank !== null && (
              <p className="text-text-secondary mt-1 text-xs">Global Rank: #{rank}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
