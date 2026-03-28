# ERPVerse

## Current State
v86 -- Müşteri İletişim Geçmişi eklendi. 85+ modül mevcut.

## Requested Changes (Diff)

### Add
- SurveyModule.tsx: Müşteri Memnuniyet Anketi modülü (yıldız puanlama, kategori, yorum, istatistikler)
- 8 dil için survey.* çevirileri
- OwnerDashboard'a "survey" tab'ı

### Modify
- LanguageContext.tsx: 8 dilde survey çevirileri eklendi
- OwnerDashboard.tsx: Tab tipi, import, menü ve render güncellendi

### Remove
- Yok

## Implementation Plan
- SurveyModule: localStorage tabanlı, şirket izolasyonlu, 1-5 yıldız, kategori filtresi, istatistik paneli
- OwnerDashboard entegrasyonu
