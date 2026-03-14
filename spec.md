# ERPVerse

## Current State
ERPVerse ERP - 30+ modules, sidebar nav with NotificationBell. All module data in localStorage. No cross-module search.

## Requested Changes (Diff)

### Add
- GlobalSearch component: search icon in sidebar near NotificationBell, opens modal overlay
- Modal text input with live results from all major localStorage modules grouped by module type
- Modules: HR personnel, CRM customers, Projects, Inventory, Tasks, Contracts, Invoices, Product catalog, Training, Suppliers
- Results show module badge + item name; clicking navigates to that module tab
- Added to both OwnerDashboard and PersonnelDashboard

### Modify
- OwnerDashboard: add GlobalSearch next to NotificationBell
- PersonnelDashboard: same

### Remove
- Nothing

## Implementation Plan
1. Create GlobalSearch.tsx component
2. Integrate into OwnerDashboard
3. Integrate into PersonnelDashboard
