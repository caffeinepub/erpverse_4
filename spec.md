# ERPVerse v75 – Cari Hesap Yönetimi

## Current State
ERPVerse is a modular ERP with 70+ features. v74 added Subscription/Recurring Invoice. The app uses localStorage for most modules and backend canister for Auth, HR, and CRM. All UI text uses t() for translation.

## Requested Changes (Diff)

### Add
- **Cari Hesap Yönetimi** module in OwnerDashboard left menu
  - Two tabs: Müşteri Cari (customer accounts) and Tedarikçi Cari (supplier accounts)
  - Each account shows: name, total debt (borç), total credit (alacak), net balance (bakiye)
  - Ability to add manual transactions: type (Fatura/Ödeme/İade/Virman), amount, description, date
  - Transaction history list per account with running balance
  - Color-coded balance: green = credit (alacak fazlası), red = debt (borç fazlası), gray = zero
  - Summary cards at top: total receivables (toplam alacak), total payables (toplam borç), net position
  - Accounts auto-populated from CRM customers (from localStorage crm_customers) and Purchasing suppliers (from localStorage purchasing_suppliers)
  - LocalStorage key: cari_hesap_[companyId]

### Modify
- OwnerDashboard: add "Cari Hesap" menu item

### Remove
- Nothing removed

## Implementation Plan
1. Create CariHesapModule.tsx component with:
   - Summary cards (toplam alacak, toplam borç, net)
   - Tabs: Müşteri Cari / Tedarikçi Cari
   - Account list with balance indicators
   - Transaction modal: add transaction (Fatura/Ödeme/İade/Virman), amount, description, date
   - Per-account transaction history with running balance calculation
   - Data stored in localStorage with companyId isolation
2. Add Cari Hesap menu item to OwnerDashboard navigation
