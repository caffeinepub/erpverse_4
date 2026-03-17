# ERPVerse

## Current State
v53 -- Denetim İzi (Audit Log) panel eklendi. OwnerDashboard'da 48 tab mevcut. HR personel verileri localStorage'da `erpverse_hr_${companyId}` anahtarıyla saklanıyor. Her personelin name, role, department alanları var. Tab tipi bir union type olarak tanımlanmış.

## Requested Changes (Diff)

### Add
- `OrgChartPanel` React bileşeni: şirket personelini rol hiyerarşisine göre görsel ağaç yapısında gösteren panel
- OwnerDashboard'a `orgchart` tab'ı eklenmesi
- Tab type'a `orgchart` eklenmesi
- navItems'a OrgChart girişi eklenmesi

### Modify
- OwnerDashboard.tsx: Tab type, navItems, render switch'e orgchart eklenmesi

### Remove
- Hiçbir şey kaldırılmıyor

## Implementation Plan
1. `OrgChartPanel.tsx` oluştur:
   - localStorage'dan HR personel verisini oku
   - Sahibi (Owner) en üstte, altında Yöneticiler, altında İdareciler, en altta Personel
   - Her rol için kart: isim, departman, rol rozeti
   - Saf CSS/Tailwind ile tree layout (svg çizgileri ile bağlantı)
   - t() ile çevrilebilir tüm metinler
2. OwnerDashboard.tsx'e `orgchart` tab ekle (Tab type + navItem + render)
