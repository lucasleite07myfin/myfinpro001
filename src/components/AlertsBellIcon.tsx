
import React from 'react';
import { Bell, BellDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { AlertLog } from '@/types/alerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertsBellIconProps {
  alerts: AlertLog[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
}

const AlertsBellIcon: React.FC<AlertsBellIconProps> = ({
  alerts,
  unreadCount,
  onMarkAsRead
}) => {
  const navigate = useNavigate();
  const recentAlerts = alerts.filter(alert => !alert.read).slice(0, 3);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellDot className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 border-b">
          <h4 className="font-medium">Alertas</h4>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} não lidos
            </p>
          )}
        </div>
        
        {recentAlerts.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            Nenhum alerta novo
          </div>
        ) : (
          <>
            {recentAlerts.map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className="px-3 py-3 cursor-pointer"
                onClick={() => {
                  onMarkAsRead(alert.id);
                  navigate('/alertas');
                }}
              >
                <div className="space-y-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(alert.triggered_at, { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
            
            {unreadCount > 3 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="px-3 py-2 text-center text-sm text-primary cursor-pointer"
                  onClick={() => navigate('/alertas')}
                >
                  Ver todos os alertas
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="px-3 py-2 text-center text-sm cursor-pointer"
          onClick={() => navigate('/alertas')}
        >
          Gerenciar alertas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AlertsBellIcon;
