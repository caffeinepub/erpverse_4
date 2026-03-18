# ERPVerse

## Current State
v62 - Proje Maliyet Takibi eklendi. 62 modül aktif. OwnerDashboard'da tab sistemi mevcut.

## Requested Changes (Diff)

### Add
- SalesForecastModule: aylık satış hedefi girişi, CRM/Satış verilerinden gerçekleşen hesaplama, hedef-gerçekleşen karşılaştırma bar grafikleri, trend analizi
- OwnerDashboard'a 'salesforecast' tab ve nav item
- ALL_MODULES listesine 'SalesForecast' eklenmesi
- Çeviri anahtarları: modules.SalesForecast, salesforecast.title vb.

### Modify
- OwnerDashboard.tsx: yeni tab ve import eklenmesi

### Remove
- Yok

## Implementation Plan
1. SalesForecastModule.tsx oluştur (hedef giriş formu, gerçekleşen hesaplama, karşılaştırma grafik, trend)
2. OwnerDashboard.tsx güncelle (import, Tab type, navItems, render)
