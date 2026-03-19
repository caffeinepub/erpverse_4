# ERPVerse v72 – İşe Alım Süreci (Recruitment)

## Current State
ERPVerse v71 has Expense Management (ExpenseModule) as the latest addition. OwnerDashboard has ~1312 lines and supports ~50+ module tabs. The backend stores HR employees, CRM customers, and opportunities. Other modules use localStorage.

## Requested Changes (Diff)

### Add
- `RecruitmentModule.tsx` – New module for full recruitment lifecycle:
  - **Pozisyon Yönetimi (Job Positions)**: Create open positions with title, department, required skills, description, status (Açık/Kapalı/Beklemede)
  - **Aday Takibi (Candidate Tracking)**: Add candidates to positions with name, email, phone, application date, CV notes
  - **Mülakat Yönetimi (Interview Management)**: Schedule interviews for candidates, set date/time, interviewer, result (Bekliyor/Geçti/Kaldı)
  - **Kanban/Status view**: Candidates move through stages: Başvurdu → İnceleniyor → Mülakat → Teklif → İşe Alındı / Reddedildi
  - **Özet kartları**: Total positions, open positions, total candidates, hired count
- Add "recruitment" tab to OwnerDashboard tab list and import RecruitmentModule
- Add translation keys for recruitment module in all 8 languages

### Modify
- `OwnerDashboard.tsx`: Add "recruitment" to Tab type, add tab entry in tabs array under HR section, add render condition for RecruitmentModule

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/modules/RecruitmentModule.tsx` with full recruitment UI using localStorage for data persistence
2. Add recruitment tab import and render to OwnerDashboard.tsx
3. Add translation keys to LanguageContext or translations file
