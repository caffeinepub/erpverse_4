# ERPVerse

## Current State
v56 build with 55+ ERP modules. Last added: Kalite Kontrol Checklist (QualityChecklistModule).

## Requested Changes (Diff)

### Add
- KPI Hedef Yönetimi (KPI Goal Management) module
  - KPI tanımlama: başlık, kategori (Satış/HR/Üretim/Finans/Genel), hedef değer, birim, başlangıç/bitiş tarihi
  - KPI güncelleme: mevcut değer girişi, ilerleme yüzdesi otomatik hesaplanır
  - Durum takibi: Aktif/Tamamlandı/Gecikmeli (otomatik bitiş tarihine göre)
  - Departman bazlı filtreleme
  - Progress bar ile görsel ilerleme gösterimi
  - localStorage'a kaydedilir
  - OwnerDashboard ve PersonnelDashboard'a eklenir

### Modify
- OwnerDashboard: Tab type + nav item + render for "kpi"
- PersonnelDashboard: same additions
- translations: kpi.* keys added

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/modules/KPIModule.tsx`
2. Add `kpi` tab to OwnerDashboard
3. Add `kpi` tab to PersonnelDashboard
4. Add translation keys
