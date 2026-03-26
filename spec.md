# ERPVerse

## Current State
v84 with OKR Management. 84 modules implemented. CRM module has basic customer records but no address management.

## Requested Changes (Diff)

### Add
- CustomerAddressModule.tsx: New module for managing multiple delivery/invoice addresses per customer
- Translations for all 8 languages (addr.* keys)
- New nav item 'customeraddress' in OwnerDashboard

### Modify
- OwnerDashboard.tsx: Add import, tab type, nav item, render
- LanguageContext.tsx: Add addr.* translations for all 8 languages

### Remove
- Nothing

## Implementation Plan
- Create CustomerAddressModule with: address list grouped by customer, type filter (delivery/invoice/general), add/edit form, default address toggle, search
- Add translations
- Integrate into OwnerDashboard as new tab
