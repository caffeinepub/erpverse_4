# ERPVerse v90 – Ürün Varyant Yönetimi

## Current State
v89 itibarıyla ERPVerse'de Ürün/Hizmet Kataloğu mevcut. Ürünler tek tip olarak tanımlanıyor; aynı ürünün farklı beden, renk veya özellik kombinasyonları için ayrı varyant yönetimi yok.

## Requested Changes (Diff)

### Add
- Ürün Varyant Yönetimi modülü: ürünlere varyant grubu (beden, renk, materyal vb.) ve varyant seçenekleri (S/M/L/XL, Kırmızı/Mavi vb.) tanımlama
- Her varyant kombinasyonu için SKU, fiyat ve stok miktarı girişi
- Varyant listesi tablosu: varyant kodu, değerleri, fiyat, stok, durum
- Ürün bazlı varyant özeti (kaç varyant, toplam stok)
- Tüm UI metinleri t() ile çevrilebilir

### Modify
- Sol menüde "Ürün Varyantları" sekmesi olarak eklenir (Envanter veya Katalog grubunda)

### Remove
- Yok

## Implementation Plan
1. ProductVariantManagement bileşeni oluştur
2. Varyant grubu tanımlama formu (grup adı + seçenekler)
3. Varyant kombinasyonu tablosu (SKU, fiyat, stok)
4. localStorage ile company-isolated veri saklama
5. Menüye ekleme (Owner ve yetkili personel)
