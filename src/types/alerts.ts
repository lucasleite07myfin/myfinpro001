
export type AlertRuleType = 'overspend' | 'low_balance' | 'unusual_tx' | 'bill_due';
export type NotificationChannel = 'email' | 'push' | 'sms';

export interface AlertRule {
  id: string;
  name: string;
  rule_type: AlertRuleType;
  category_id?: string;
  account_id?: string;
  threshold_value?: number;
  threshold_percent?: number;
  days_before_due?: number;
  notification_channel: NotificationChannel[];
  is_active: boolean;
  owner: string;
  created_at: Date;
}

export interface AlertLog {
  id: string;
  alert_rule_id: string;
  message: string;
  triggered_at: Date;
  read: boolean;
  owner: string;
  alert_rule?: AlertRule;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: Date;
  owner: string;
  badge?: Badge;
}

export interface HealthSnapshot {
  id: string;
  snapshot_date: string;
  savings_rate_pct: number;
  debt_income_pct: number;
  months_emergency_fund: number;
  net_worth_growth_12m: number;
  owner: string;
}
