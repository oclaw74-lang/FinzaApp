import { cn } from '@/lib/utils'

// Maintains animate-pulse for backward compatibility with tests
// shimmer provides the premium visual effect in the browser
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse shimmer rounded-md', className)} />
}
