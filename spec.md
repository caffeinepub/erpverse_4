# ERPVerse v84

## Current State
v83 added İşe Giriş Onboarding Süreci. The app has 80+ modules. OwnerDashboard has a Tab union type and navItems array. The last tab added was 'Onboarding'. PersonnelDashboard exists separately for staff.

## Requested Changes (Diff)

### Add
- New module file: `src/frontend/src/modules/OKRModule.tsx`
  - Owner/Manager view: create OKR periods, define Objectives per employee, set Key Results with target values and units, update current values, see progress bars per KR and overall objective score
  - Personnel view (in PersonnelSelfService): read-only view of their own OKRs with progress
  - Statuses: Aktif, Tamamlandı, İptal
  - Period types: Aylık, Çeyrek, Yıllık
  - Integration: employee list from HR module (localStorage)
- Add 'okr' tab to OwnerDashboard Tab type and navItems (icon: Target, color: amber)
- Add OKR section to PersonnelSelfServiceModule (read-only personal OKRs)

### Modify
- `OwnerDashboard.tsx`: import OKRModule, add 'okr' to Tab union, add navItem, add render case
- `PersonnelSelfServiceModule.tsx`: add personal OKR tab (read-only)

### Remove
- Nothing

## Implementation Plan
1. Create OKRModule.tsx with full CRUD for objectives/KRs (localStorage key: `erp_okr_{companyId}`)
2. Add okr tab to OwnerDashboard
3. Add read-only OKR view to PersonnelSelfServiceModule
4. All text via t() with Turkish defaults
