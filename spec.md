# ERPVerse

## Current State
v63 with 60+ ERP modules. OwnerDashboard has a Tab union type and renders modules by tab key. LanguageContext has TR/EN (and 6 more) translation keys. Modules are added as standalone React components in src/frontend/src/modules/.

## Requested Changes (Diff)

### Add
- **EFaturaModule** (src/frontend/src/modules/EFaturaModule.tsx): E-Fatura / E-Arşiv module
  - Two tabs: E-Fatura and E-Arşiv
  - Create electronic invoices with GİB-compatible fields: fatura no (auto-generated UBL format: EF-YYYYMMDD-XXXX), alıcı VKN/TCKN, alıcı unvan, fatura tarihi, vade tarihi, kalemler (ürün, miktar, birim fiyat, KDV oranı), notlar
  - Invoice list with status: Taslak, Gönderildi, İptal
  - "GİB Formatında İndir" button (downloads JSON representation)
  - E-Arşiv tab: same structure for archive invoices (non-EDI invoices stored electronically)
  - Data persisted in localStorage
- Translation keys for efatura module in TR and EN
- "efatura" tab added to OwnerDashboard Tab type, modules list, and render section

### Modify
- OwnerDashboard.tsx: add Tab "efatura", import EFaturaModule, add to modules list with icon, add render case
- LanguageContext.tsx: add efatura translation keys for TR and EN

### Remove
- Nothing

## Implementation Plan
1. Create EFaturaModule.tsx with full functionality
2. Add efatura translation keys to LanguageContext (TR + EN sections)
3. Update OwnerDashboard: Tab type, import, modules list entry, render
