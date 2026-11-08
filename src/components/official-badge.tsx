import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** The white tick that marks official models and accounts. Hover for what it means. */
export function OfficialBadge({ kind = 'model', className = 'size-5' }: { kind?: 'model' | 'account'; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex shrink-0 cursor-help align-middle"><BadgeCheck className={cn('fill-foreground text-background', className)} aria-label="Official" /></span>
      </TooltipTrigger>
      <TooltipContent>{kind === 'account' ? 'Official account, verified by the affable team' : 'Official model from the affable team'}</TooltipContent>
    </Tooltip>
  )
}
