# ERPVerse

## Current State

ERPVerse is a full-stack ERP platform with 12 implemented modules: HR, Muhasebe, CRM, Envanter, Projeler, Satın Alma, Üretim, İş Akışı, Raporlama, Kalite, Depo, Bütçe. Supports 8 languages, multi-company access, role/permission matrix, notification system, approval workflows, audit logging, cross-module integrations, and PDF/Excel export.

## Requested Changes (Diff)

### Add
- **Varlık Yönetimi (Asset Management)** module: Track company assets (equipment, vehicles, IT hardware, etc.) with fields for asset name, category, serial number, purchase date, purchase value, current value (depreciation), location, assigned personnel, and status (active/maintenance/retired). Support add/edit/delete, depreciation calculation, maintenance history log per asset.
- **Müşteri Hizmetleri (Customer Service)** module: Support ticket management with fields for ticket number (auto), customer name, subject, description, priority (low/medium/high/critical), status (open/in-progress/resolved/closed), assigned personnel, created date, resolution notes. Support add/edit/delete, filtering by status and priority, basic SLA indicator (overdue flag if open > 3 days).
- Both modules integrated into OwnerDashboard and PersonnelDashboard module lists (with permission matrix support)
- Both modules added to Raporlama aggregation (asset count/value, ticket counts by status)
- Both modules use localStorage persistence
- All strings translated via t() in LanguageContext for all 8 languages

### Modify
- OwnerDashboard: add Varlık and Müşteri Hizmetleri to module navigation list and permission matrix
- PersonnelDashboard: add both modules to module navigation
- ReportingModule: include asset and support ticket summaries
- LanguageContext: add translation keys for both new modules in all 8 languages

### Remove
- Nothing removed

## Implementation Plan

1. Create `AssetModule.tsx` with full CRUD, depreciation display, maintenance log
2. Create `CustomerServiceModule.tsx` with ticket CRUD, filtering, overdue flag
3. Update OwnerDashboard to include both modules in navigation and role/permission matrix
4. Update PersonnelDashboard to include both modules
5. Update ReportingModule to show asset and ticket summaries
6. Update LanguageContext with all translation keys for both modules in 8 languages
