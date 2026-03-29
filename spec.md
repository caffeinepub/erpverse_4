# ERPVerse v89 – Taksit & Ödeme Planı

## Current State
ERPVerse has 88 released versions with comprehensive ERP modules. v88 added Yardım Masası. Invoices and subscriptions exist but there is no installment/payment plan management for spreading invoice payments over time.

## Requested Changes (Diff)

### Add
- New module: Taksit & Ödeme Planı (Installment & Payment Plan)
  - Create installment plans linked to customers/invoices
  - Define total amount, number of installments, start date, frequency (monthly/weekly/biweekly)
  - Auto-generate installment schedule (due dates + amounts)
  - Track payment status per installment (Bekliyor / Ödendi / Gecikti)
  - Mark individual installments as paid
  - Summary stats: total, paid, remaining, overdue
  - localStorage-based persistence (companyId scoped)
- New tab in OwnerDashboard under Finance group
- Translation keys for all UI text

### Modify
- OwnerDashboard.tsx: add Tab type, menu item, and render for new module

### Remove
- Nothing

## Implementation Plan
1. Create TaksitModule.tsx with full CRUD UI
2. Add tab to OwnerDashboard
