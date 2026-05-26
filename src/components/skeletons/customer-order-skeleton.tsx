import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function CustomerOrderItemSkeleton() {
  return (
    <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/40">
      <Skeleton className="w-10 h-10 rounded-md flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-28 mb-1.5" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}

interface CustomerOrderSkeletonProps {
  itemCount?: number
}

export function CustomerOrderSkeleton({ itemCount = 2 }: CustomerOrderSkeletonProps) {
  return (
    <Card className="border-l-4 border-l-muted-foreground/20 animate-pulse">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-md" />
            <div>
              <Skeleton className="h-4 w-24 mb-1.5" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-3 w-16 mb-1.5 ml-auto" />
            <Skeleton className="h-6 w-14 ml-auto" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {/* Progress timeline */}
        <div className="flex items-center mb-4 px-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-2 w-8 mt-1.5 rounded" />
              </div>
              {i < 3 && <div className="flex-1 h-0.5 mx-1 mb-5 bg-muted rounded" />}
            </div>
          ))}
        </div>
        {/* Items */}
        <div className="space-y-1.5">
          {[...Array(itemCount)].map((_, i) => (
            <CustomerOrderItemSkeleton key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
