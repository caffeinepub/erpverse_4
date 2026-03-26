# ERPVerse v86 – Müşteri İletişim Geçmişi

## Current State
v85 is deployed. CRM module stores customers and opportunities in backend. CustomerAddressModule manages multiple addresses per customer. No communication history feature exists.

## Requested Changes (Diff)

### Add
- CustomerCommunicationModule.tsx: new module for logging and viewing customer communications (calls, emails, meetings, notes)
- Translation keys for all 8 languages (prefix: `comm.`)
- New `customercomm` tab in OwnerDashboard

### Modify
- LanguageContext.tsx: add `comm.*` translation keys for all 8 languages
- OwnerDashboard.tsx: add Tab type, import, navItem, and render for `customercomm`

### Remove
- Nothing removed

## Implementation Plan
1. Create CustomerCommunicationModule.tsx with:
   - Communication types: Call, Email, Meeting, Note
   - Fields: customer (from CRM list), type, subject, date, duration (for calls/meetings), notes, direction (inbound/outbound)
   - List view with filters by customer and type
   - Add/edit/delete communication records stored in localStorage (companyId scoped)
2. Add comm.* translation keys to all 8 language objects in LanguageContext.tsx
3. Update OwnerDashboard.tsx: add Tab, import module, add navItem under CRM group, render tab
