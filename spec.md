# ERPVerse v77 – Fiyat Teklifi & Proforma Fatura

## Current State
ERPVerse v76 has 76+ ERP modules. CRM module manages customers and opportunities. Invoice module handles billing. There is no intermediate quotation/proforma step between CRM opportunities and invoices.

## Requested Changes (Diff)

### Add
- New "Fiyat Teklifi" (Sales Quotation) tab in Owner/Manager dashboard
- Create quotation with: customer (from CRM), validity date, line items (product/service, qty, unit price, discount, VAT rate), notes
- Quotation statuses: Taslak (Draft), Gönderildi (Sent), Onaylandı (Approved), Reddedildi (Rejected), İptal
- Convert approved quotation to Proforma Fatura (Proforma Invoice)
- Convert proforma to final Invoice (links to existing invoice module)
- Quotation list with search/filter by status, customer, date
- Print/PDF view for quotation and proforma
- Audit log entries for quotation actions

### Modify
- OwnerDashboard: add Fiyat Teklifi menu item
- Personnel dashboard (manager role): add Fiyat Teklifi access based on permissions

### Remove
- Nothing removed

## Implementation Plan
1. Add quotation data model to localStorage (companyId-scoped)
2. Create QuotationModule component with list, create form, detail/status management
3. Add convert-to-proforma and convert-to-invoice actions
4. Add print view for quotation/proforma
5. Wire into OwnerDashboard sidebar menu
6. All text via t() translation function
