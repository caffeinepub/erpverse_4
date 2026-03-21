# ERPVerse – v73: Müşteri Kredi Limiti

## Current State
v72 itibarıyla İşe Alım Süreci modülü eklenmiş, CRM ve HR verileri backend'de tutuluyor. Onaylı özellik listesinde sıradaki Müşteri Kredi Limiti.

## Requested Changes (Diff)

### Add
- `CustomerCreditModule` bileşeni: CRM müşterilerine kredi limiti tanımlama, kullanılan borç miktarı girişi, kalan limit ve doluluk oranı görüntüleme, limit aşımında uyarı gösterimi
- OwnerDashboard'a `creditlimit` tab'ı ekleme
- localStorage key: `erpverse_credit_limits_{companyId}`

### Modify
- `OwnerDashboard.tsx`: creditlimit tab ve nav item ekleme, CustomerCreditModule import

### Remove
- Yok

## Implementation Plan
1. `CustomerCreditModule.tsx` oluştur: müşteri listesini CRM'den oku, her müşteri için kredi limiti ve kullanılan tutar tanımla, doluluk progress bar, limit aşımı kırmızı uyarı
2. OwnerDashboard'a tab ve nav item ekle
