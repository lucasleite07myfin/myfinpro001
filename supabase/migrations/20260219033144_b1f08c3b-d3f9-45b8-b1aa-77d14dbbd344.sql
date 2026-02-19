CREATE UNIQUE INDEX idx_unique_recurring_transaction_per_month
ON public.transactions (user_id, recurring_expense_id, date_trunc('month', date::timestamp))
WHERE recurring_expense_id IS NOT NULL;