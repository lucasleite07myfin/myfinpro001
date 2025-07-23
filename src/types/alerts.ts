export interface AlertRule {
  id: string;
  name: string;
  ruleType: 'overspend' | 'low_balance' | 'unusual_tx' | 'bill_due';
  categoryId?: string;
  accountId?: string;
  thresholdValue?: number;
  thresholdPercent?: number;
  daysBeforeDue?: number;
  notificationChannel: ('email' | 'push' | 'sms')[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertLog {
  id: string;
  alertRuleId?: string;
  message: string;
  triggeredAt: Date;
  read: boolean;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  createdAt?: Date;
}

export interface UserBadge {
  id: string;
  badgeId: string;
  earnedAt: Date;
  badge?: Badge;
}

export interface HealthSnapshot {
  id: string;
  snapshotDate: Date;
  savingsRatePct?: number;
  debtIncomePct?: number;
  monthsEmergencyFund?: number;
  netWorthGrowth12m?: number;
  createdAt: Date;
}