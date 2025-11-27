import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function MenuItemSkeleton() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-3 sm:p-4">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

