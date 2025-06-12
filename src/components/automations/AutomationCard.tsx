'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AutomationOverview } from '@/types/admin'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FormattedDate } from './FormattedDate'
import Link from 'next/link'
import { Crown, Rocket, Star, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutomationCardProps {
  automation: AutomationOverview
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getRankDetails = (rank: number | null | undefined) => {
  if (rank === null || rank === undefined)
    return { Icon: null, name: 'Unranked', color: 'text-text-secondary' }
  if (rank === 1) return { Icon: Crown, name: 'Top Contributor', color: 'text-brand-primary' }
  if (rank <= 5) return { Icon: Star, name: 'Elite Contributor', color: 'text-text-secondary' }
  if (rank <= 20) return { Icon: Rocket, name: 'Power User', color: 'text-text-secondary' }
  if (rank <= 100) return { Icon: Trophy, name: 'Top 100', color: 'text-text-secondary' }
  return { Icon: null, name: 'Contributor', color: 'text-text-secondary' }
}

export function AutomationCard({ automation }: AutomationCardProps) {
  const router = useRouter()
  const rankDetails = getRankDetails(automation.user.rank)

  return (
    <Card
      className="group flex h-full cursor-pointer flex-col overflow-hidden transition-shadow duration-200 hover:shadow-md"
      onClick={() => router.push(`/automations/${automation.id}`)}
    >
      <CardHeader>
        <CardTitle className="text-text-primary group-hover:text-brand-primary line-clamp-2 text-lg font-semibold transition-colors">
          {automation.title || 'Untitled Automation'}
        </CardTitle>
        <CardDescription className="text-text-secondary text-xs">
          Created on <FormattedDate dateString={automation.created_at} />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between space-y-4">
        <p className="text-text-secondary line-clamp-3 text-sm">
          {automation.description || 'No description provided.'}
        </p>
        <div className="space-y-3 border-t pt-3">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={automation.user.avatar_url} alt={automation.user.name} />
              <AvatarFallback>{getInitials(automation.user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-text-secondary text-xs">
                {automation.user.name.split(' ')[0]}
              </span>
              <Link href="/leaderboard" className="group mt-0.5 inline-block">
                <div
                  className={cn(
                    'inline-flex items-center space-x-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors group-hover:bg-gray-100',
                    automation.user.rank === 1 ? 'border-brand-primary' : 'border-border'
                  )}
                >
                  {rankDetails.Icon && (
                    <rankDetails.Icon className={cn('h-3 w-3 flex-shrink-0', rankDetails.color)} />
                  )}
                  <span className={cn('font-medium', rankDetails.color)}>{rankDetails.name}</span>
                </div>
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {(automation.tags || []).slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
