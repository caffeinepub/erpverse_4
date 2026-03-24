# ERPVerse v81 – Prim & Komisyon Yönetimi

## Current State
- v80 has ReturnRMAModule added
- PayrollModule exists with employee salary/bonus fields
- CRM module (backend) has customer/opportunity data
- HR module (backend) has employee data
- KPI module has target tracking
- OwnerDashboard has many modules loaded via tab system
- All UI uses t() for translations, localStorage for per-company data keyed by companyId

## Requested Changes (Diff)

### Add
- New `PrimKomisyonModule.tsx` component
  - **Prim Kuralları** tab: define bonus rules (name, type: satış-bazlı/hedef-bazlı/sabit, calculation basis, rate/amount, assigned employees)
  - **Hesapla** tab: select period (month/year), calculate bonuses per employee based on rules, show breakdown table (base salary, sales amount, target achievement %, calculated bonus)
  - **Ödemeler** tab: list calculated bonus payments, mark as paid, transfer to payroll
  - Integration: reads employees from HR localStorage data, reads sales from CRM/Sales localStorage
  - Stored in `erpverse_primkomiyon_{companyId}` localStorage key
- Add tab `primkomiyon` to OwnerDashboard with label key `primKomiyon.title`
- Add translation keys for `primKomiyon.*` in LanguageContext for all 8 languages

### Modify
- `OwnerDashboard.tsx`: add Tab type `primkomiyon`, add menu item, add import and render
- `LanguageContext.tsx` (or translations file): add translation keys for new module

### Remove
- Nothing

## Implementation Plan
1. Create `PrimKomisyonModule.tsx` with 3 tabs: Kurallar, Hesapla, Ödemeler
2. Rule types: sales-based (% of sales total), target-based (% if KPI target met), fixed (flat amount)
3. Calculation: per selected month, sum CRM closed-won opportunities + sales invoices for each employee, apply rule
4. Payment tracking: calculated bonuses can be marked as Ödendi, with option to add to payroll
5. Update OwnerDashboard to include new tab
6. Add all translation strings
