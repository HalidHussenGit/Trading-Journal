# Database Schema Documentation

> Generated from the `public` schema.

## Table: `users`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| id | uuid | NO |
| username | text | NO |
| password_hash | text | NO |
| created_at | timestamp with time zone | NO |

### Relationships

*No foreign keys*

---

## Table: `accounts`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| id | uuid | NO |
| user_id | uuid | NO |
| name | text | NO |
| broker_or_firm | text | NO |
| account_type | text | NO |
| currency | text | NO |
| initial_balance | numeric | NO |
| current_balance | numeric | NO |
| default_risk_percent | numeric | NO |
| daily_loss_limit_percent | numeric | YES |
| max_drawdown_percent | numeric | YES |
| trading_style | text | YES |
| status | text | NO |
| notes | text | YES |
| is_archived | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### Relationships

- `user_id` references `users`(`id`)

---

## Table: `setups`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| id | uuid | NO |
| user_id | uuid | NO |
| name | text | NO |
| description | text | YES |
| market | text | YES |
| instrument | text | YES |
| timeframes | ARRAY | NO |
| sessions | ARRAY | NO |
| direction | text | NO |
| entry_model | text | YES |
| stop_loss_model | text | YES |
| take_profit_model | text | YES |
| minimum_rr | numeric | YES |
| default_risk_percent | numeric | YES |
| rules | ARRAY | NO |
| invalid_conditions | ARRAY | NO |
| notes | text | YES |
| status | text | NO |
| is_archived | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### Relationships

- `user_id` references `users`(`id`)

---

## Table: `setup_checklist_items`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| id | uuid | NO |
| setup_id | uuid | NO |
| name | text | NO |
| description | text | YES |
| required | boolean | NO |
| order_index | integer | NO |
| active | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### Relationships

- `setup_id` references `setups`(`id`)

---

## Table: `tags`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| id | uuid | NO |
| user_id | uuid | NO |
| name | text | NO |
| color | text | YES |

### Relationships

- `user_id` references `users`(`id`)

---

## Table: `trades`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| id | uuid | NO |
| user_id | uuid | NO |
| account_id | uuid | NO |
| setup_id | uuid | YES |
| symbol | text | NO |
| direction | text | NO |
| status | text | NO |
| trade_date | date | NO |
| trade_time | time without time zone | YES |
| session | text | YES |
| timeframe | text | YES |
| market_condition | text | YES |
| tags | ARRAY | NO |
| violations | ARRAY | NO |
| planned_entry | numeric | YES |
| planned_stop_loss | numeric | YES |
| planned_take_profit | numeric | YES |
| planned_risk_percent | numeric | YES |
| planned_risk_amount | numeric | YES |
| planned_rr | numeric | YES |
| planned_position_size | numeric | YES |
| planned_point_value | numeric | YES |
| planned_contract_size | numeric | YES |
| planned_leverage | numeric | YES |
| actual_entry | numeric | YES |
| actual_exit | numeric | YES |
| actual_position_size | numeric | YES |
| actual_fees | numeric | YES |
| actual_commission | numeric | YES |
| actual_swap | numeric | YES |
| actual_slippage | numeric | YES |
| actual_exit_reason | text | YES |
| result_status | text | YES |
| result_net_pl | numeric | YES |
| result_gross_pl | numeric | YES |
| result_r_multiple | numeric | YES |
| result_holding_time_minutes | integer | YES |
| checklist_snapshot | jsonb | NO |
| psych_pre_trade_emotion | text | YES |
| psych_confidence_rating | integer | YES |
| psych_focus_rating | integer | YES |
| psych_stress_rating | integer | YES |
| psych_patience_rating | integer | YES |
| psych_energy_rating | integer | YES |
| psych_post_trade_emotion | text | YES |
| quality_setup | integer | YES |
| quality_execution | integer | YES |
| quality_risk_management | integer | YES |
| quality_psychology | integer | YES |
| quality_discipline | integer | YES |
| quality_overall | numeric | YES |
| journal_thesis | text | YES |
| journal_what_went_well | text | YES |
| journal_what_went_wrong | text | YES |
| journal_followed_plan | text | YES |
| journal_interfered_during_trade | boolean | NO |
| journal_moved_stop_loss | boolean | NO |
| journal_closed_early | boolean | NO |
| journal_hesitated_on_entry | boolean | NO |
| journal_revenge_or_overtraded | boolean | NO |
| journal_lessons_learned | text | YES |
| journal_what_to_do_differently | text | YES |
| is_archived | boolean | NO |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### Relationships

- `user_id` references `users`(`id`)
- `account_id` references `accounts`(`id`)
- `setup_id` references `setups`(`id`)

---

## Table: `trade_exits`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| id | uuid | NO |
| trade_id | uuid | NO |
| level_name | text | NO |
| exit_price | numeric | NO |
| size_percent | numeric | NO |
| size_quantity | numeric | YES |
| realized_pl | numeric | YES |
| realized_r | numeric | YES |
| exit_reason | text | YES |
| exit_timestamp | timestamp with time zone | NO |

### Relationships

- `trade_id` references `trades`(`id`)

---

## Table: `trade_screenshots`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| id | uuid | NO |
| trade_id | uuid | NO |
| category | text | NO |
| caption | text | YES |
| storage_path | text | NO |
| preview_url | text | YES |
| order_index | integer | NO |
| created_at | timestamp with time zone | NO |

### Relationships

- `trade_id` references `trades`(`id`)

---

## Table: `trade_timeline_events`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| id | uuid | NO |
| trade_id | uuid | NO |
| event_type | text | NO |
| description | text | YES |
| event_timestamp | timestamp with time zone | NO |

### Relationships

- `trade_id` references `trades`(`id`)

---

## Table: `trading_days`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| id | uuid | NO |
| user_id | uuid | NO |
| day | date | NO |
| did_trade | boolean | NO |
| trade_count | integer | NO |
| daily_pl | numeric | NO |
| daily_r | numeric | NO |
| no_trade_reason | text | YES |
| no_trade_notes | text | YES |
| emotional_state | text | YES |
| energy_rating | integer | YES |
| focus_rating | integer | YES |
| discipline_score | integer | YES |
| notes | text | YES |
| created_at | timestamp with time zone | NO |
| updated_at | timestamp with time zone | NO |

### Relationships

- `user_id` references `users`(`id`)

---

## Table: `settings`

**Row Level Security (RLS) Enabled:** false

### Columns

| Column | Type | Nullable |
|---|---|---|
| user_id | uuid | NO |
| theme | text | NO |
| currency | text | NO |
| date_format | text | NO |
| timezone | text | NO |
| default_account_id | uuid | YES |
| default_setup_id | uuid | YES |
| default_risk_percent | numeric | NO |
| normal_risk_max_percent | numeric | YES |
| warning_risk_max_percent | numeric | YES |
| critical_risk_max_percent | numeric | YES |
| autosave_interval_ms | integer | NO |
| autosave_enabled | boolean | NO |
| hard_checklist_enforcement | boolean | NO |
| hard_risk_warnings | boolean | NO |
| no_trade_reminders | boolean | NO |
| storage_persisted | boolean | YES |
| updated_at | timestamp with time zone | NO |

### Relationships

- `default_setup_id` references `setups`(`id`)
- `user_id` references `users`(`id`)
- `default_account_id` references `accounts`(`id`)
