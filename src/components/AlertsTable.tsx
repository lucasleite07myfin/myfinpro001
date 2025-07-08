
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Plus, Eye, EyeOff } from 'lucide-react';
import { AlertLog } from '@/types/alerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AddAlertRuleModal from './AddAlertRuleModal';

interface AlertsTableProps {
  alerts: AlertLog[];
  onMarkAsRead: (id: string) => void;
  onCreateRule: () => void;
  unreadCount: number;
}

const AlertsTable: React.FC<AlertsTableProps> = ({
  alerts,
  onMarkAsRead,
  onCreateRule,
  unreadCount
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const filteredAlerts = showOnlyUnread 
    ? alerts.filter(alert => !alert.read)
    : alerts;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas Inteligentes
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-6">
              {unreadCount} não lidos
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlyUnread(!showOnlyUnread)}
          >
            {showOnlyUnread ? (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Todos
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Não lidos
              </>
            )}
          </Button>
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nova Regra
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {showOnlyUnread ? 'Nenhum alerta não lido' : 'Nenhum alerta encontrado'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition-colors ${
                  alert.read 
                    ? 'bg-muted/30 border-muted' 
                    : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm ${alert.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(alert.triggered_at, { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                  {!alert.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAsRead(alert.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <AddAlertRuleModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen}
          onSuccess={() => {
            setIsModalOpen(false);
            onCreateRule();
          }}
        />
      </CardContent>
    </Card>
  );
};

export default AlertsTable;
