import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem } from 'lucide-react';

interface PointsDisplayProps {
  points: number;
}

export function PointsDisplay({ points }: PointsDisplayProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Points</CardTitle>
        <Gem className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">{points.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground mt-1">Keep learning to earn more!</p>
      </CardContent>
    </Card>
  );
}
