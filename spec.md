# ERPVerse

## Current State
v50: Full Data Export/Import modülü mevcut. Sistemde v12'den beri audit log kaydı tutuluyor ancak kullanıcıya görsel bir ekranda sunulmuyor.

## Requested Changes (Diff)

### Add
- Sol menüye "Denetim İzi" (Audit Log) sekmesi eklenmesi
- Tüm modüllerdeki değişikliklerin (oluşturma, güncelleme, silme) listelenmesi
- Modül, eylem tipi ve tarih aralığına göre filtreleme
- Her kayıtta: zaman damgası, kullanıcı, modül, eylem, detay

### Modify
- OwnerDashboard: Denetim İzi sekmesi eklenmesi

### Remove
- Yok

## Implementation Plan
1. AuditLogModule component oluştur (filtreleme + tablo görünümü)
2. localStorage'dan mevcut audit log verilerini oku; yoksa demo kayıtlar oluştur
3. OwnerDashboard menüsüne sekme ekle
4. Modül bazlı log yazma helper'ını diğer modüllerde kullan (mevcut pattern'a uygun)
