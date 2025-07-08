
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Award, Target, Shield, Calendar, TrendingUp } from 'lucide-react';
import { Badge as BadgeType, UserBadge } from '@/types/alerts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BadgesGalleryProps {
  allBadges: BadgeType[];
  userBadges: UserBadge[];
}

const BadgesGallery: React.FC<BadgesGalleryProps> = ({ allBadges, userBadges }) => {
  const [filter, setFilter] = useState<'all' | 'earned'>('all');

  const earnedBadgeIds = userBadges.map(ub => ub.badge_id);
  
  const filteredBadges = filter === 'earned' 
    ? allBadges.filter(badge => earnedBadgeIds.includes(badge.id))
    : allBadges;

  const getBadgeIcon = (code: string) => {
    switch (code) {
      case 'STREAK_30': return <Calendar className="h-8 w-8" />;
      case 'GOAL_DONE': return <Target className="h-8 w-8" />;
      case 'EMERGENCY_6M': return <Shield className="h-8 w-8" />;
      case 'GROWTH_POSITIVE': return <TrendingUp className="h-8 w-8" />;
      default: return <Trophy className="h-8 w-8" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Conquistas
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas ({allBadges.length})
          </Button>
          <Button
            variant={filter === 'earned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('earned')}
          >
            Conquistadas ({userBadges.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBadges.map((badge) => {
            const isEarned = earnedBadgeIds.includes(badge.id);
            const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
            
            return (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`p-4 rounded-lg border transition-all cursor-help ${
                      isEarned 
                        ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' 
                        : 'bg-muted/30 border-muted opacity-50 grayscale'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={isEarned ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}>
                        {getBadgeIcon(badge.code)}
                      </div>
                      <h3 className="font-medium text-sm">{badge.name}</h3>
                      {isEarned && userBadge && (
                        <Badge variant="secondary" className="text-xs">
                          {new Date(userBadge.earned_at).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                    {isEarned && userBadge && (
                      <p className="text-xs text-green-600 mt-2">
                        Conquistada em {new Date(userBadge.earned_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        
        {filteredBadges.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {filter === 'earned' 
              ? 'Você ainda não conquistou nenhuma badge. Continue usando o app!'
              : 'Nenhuma badge encontrada'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgesGallery;
