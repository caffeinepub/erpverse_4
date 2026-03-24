# ERPVerse v79 – Teslimat & Sevkiyat Takibi

## Current State
v78 added Sales Order Management (SalesOrderManagementModule). The app has a full sales cycle: CRM → Quotation → Sales Order. However, there is no shipment/delivery tracking after orders are confirmed.

## Requested Changes (Diff)

### Add
- New `ShipmentTrackingModule.tsx` frontend module
- New `shipment-tracking` tab in OwnerDashboard menu
- Shipment records linked to sales orders: order reference, customer, cargo company, tracking number, estimated delivery date, status
- Status flow: Hazırlanıyor → Kargoya Verildi → Yolda → Teslim Edildi → İptal
- List view with filters by status and search by order/customer
- Create shipment form (link to sales order or manual entry)
- Status update action per shipment
- Translation keys for all UI text

### Modify
- `OwnerDashboard.tsx`: add import and tab case for `shipment-tracking`
- Add menu item for Teslimat & Sevkiyat Takibi in sidebar

### Remove
- Nothing

## Implementation Plan
1. Create `ShipmentTrackingModule.tsx` with full CRUD and status tracking
2. Add tab + menu item to OwnerDashboard
