import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function PostCardSkeleton() {
  return (
    <Card className="gap-0 py-0 rounded-xl animate-pulse">
      <CardContent className="px-4 pt-4 pb-3">
        <div className="flex gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 pt-0.5 space-y-2">
            <div className="flex gap-2">
              <div className="h-3.5 w-24 rounded-full bg-muted" />
              <div className="h-3.5 w-12 rounded-full bg-muted" />
            </div>
            <div className="h-2.5 w-16 rounded-full bg-muted" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3.5 w-full rounded-full bg-muted" />
          <div className="h-3.5 w-4/5 rounded-full bg-muted" />
          <div className="h-3.5 w-2/3 rounded-full bg-muted" />
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="bg-transparent border-0 px-4 py-2 gap-2">
        <div className="h-7 w-16 rounded-lg bg-muted" />
        <div className="h-7 w-20 rounded-lg bg-muted" />
      </CardFooter>
    </Card>
  );
}
