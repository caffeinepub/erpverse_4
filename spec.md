# ERPVerse

## Current State
v61 is deployed. All modules up to Physical Inventory Count (v61) are implemented. The app uses localStorage for all module data and has a large number of ERP modules in OwnerDashboard and PersonnelDashboard.

## Requested Changes (Diff)

### Add
- **Proje Maliyet Takibi (Project Cost Tracking)** module: a new module that lets users define per-project budgets, add cost entries (labor/material/overhead), auto-calculate labor cost from existing timesheet data (hours × hourly rate), and push approved costs as accounting expense entries.

### Modify
- OwnerDashboard: add new `projectcost` tab and import ProjectCostModule
- PersonnelDashboard: add new `projectcost` tab
- LanguageContext: add translation keys for the new module in all 8 languages

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/modules/ProjectCostModule.tsx` with: project list from localStorage, per-project budget field, cost entry form (type, description, amount, date), timesheet-based labor cost auto-calculation, budget vs actual comparison bar, export cost to accounting
2. Update OwnerDashboard: add `projectcost` to Tab type, add nav item, render ProjectCostModule
3. Update PersonnelDashboard: same additions
4. Update LanguageContext: add `projectcost.*` keys for all 8 languages
