# ERPVerse

## Current State
SalesModule has quotes, orders, and opportunities tabs. Quotes can have status: draft/sent/accepted/rejected. InvoiceTab (inside AccountingModule) stores invoices in `erp_invoices_{cid}` localStorage key. Invoice interface has: id, customerName, description, amount, dueDate, status, createdAt.

## Requested Changes (Diff)

### Add
- "Faturaya Dönüştür" (Convert to Invoice) button on accepted quotes in SalesModule
- When clicked, creates a new invoice entry in `erp_invoices_{cid}` localStorage with status "draft", customer from quote, amount from quote, and description referencing the quote number
- Shows a notification confirming the conversion
- Marks the quote with a `convertedToInvoice: true` flag so the button is disabled/hidden after conversion
- Translation keys for the new button and notification in all 8 languages

### Modify
- SalesQuote interface: add optional `convertedToInvoice?: boolean` field
- Quotes table row: show "Faturaya Dönüştür" button only for accepted quotes that haven't been converted yet

### Remove
- Nothing removed

## Implementation Plan
1. Update SalesQuote interface to add `convertedToInvoice?: boolean`
2. Add `convertToInvoice` handler function in SalesModule that creates invoice in localStorage and marks quote as converted
3. Add button in quotes table row, visible only for accepted quotes not yet converted
4. Add translation keys for new strings
