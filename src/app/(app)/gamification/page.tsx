
import { placeholderUserProfile, placeholderBadges } from '@/lib/placeholder-data';
import { PointsDisplay } from '@/components/points-display';
import { BadgeIcon } from '@/components/badge-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, ShieldAlert, Star } from 'lucide-react';

export default function GamificationPage() {
  const user = placeholderUserProfile;
  const allBadges = placeholderBadges; // Simulating a list of all possible badges

  const earnedBadgeIds = new Set(user.earnedBadges.map(b => b.id));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tight flex items-center">
          <Trophy className="h-10 w-10 mr-3 text-primary" aria-hidden="true" />
          Achievements & Rewards
        </h1>
        <p className="text-xl text-muted-foreground">
          Track your points, badges, and see how you stack up!
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PointsDisplay points={user.points} />

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Star className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user.earnedBadges.length} / {allBadges.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Collect them all!</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">My Badge Collection</CardTitle>
          <CardDescription>Hover over a badge to see its details.</CardDescription>
        </CardHeader>
        <CardContent>
          {user.earnedBadges.length > 0 ? (
            <div className="flex flex-wrap gap-6">
              {user.earnedBadges.map(badge => (
                <div key={badge.id} className="flex flex-col items-center text-center">
                  <BadgeIcon badge={badge} size="lg" />
                  <p className="mt-2 text-sm font-medium">{badge.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShieldAlert className="h-16 w-16 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
              <p className="text-lg text-muted-foreground">No badges earned yet.</p>
              <p className="text-sm text-muted-foreground">Keep learning to unlock achievements!</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Unlockable Badges</CardTitle>
          <CardDescription>Discover badges you can still earn.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            {allBadges.filter(badge => !earnedBadgeIds.has(badge.id)).map(badge => (
              <div key={badge.id} className="flex flex-col items-center text-center opacity-60">
                <BadgeIcon badge={badge} size="lg" />
                <p className="mt-2 text-sm font-medium">{badge.name}</p>
              </div>
            ))}
            {allBadges.filter(badge => !earnedBadgeIds.has(badge.id)).length === 0 && (
              <p className="text-muted-foreground">You've collected all available badges! Congratulations!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Leaderboard */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Leaderboard feature coming soon.</p>
        </CardContent>
      </Card> */}
    </div>
  );
}
