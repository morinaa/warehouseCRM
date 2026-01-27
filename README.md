# TestCodex Frontend

## Recent UX/RBAC updates
- **CountrySelect** typeahead added and reused across Super Admin, Buyer, Supplier, and Product forms for consistent country capture (full scrollable list, search-as-you-type).
- **Product origin** captured via origin country field in product creation/edit.
- **Category / Channel suggestions** now use shared datalists; free-typed values are saved in Title Case for consistency (e.g., "food" → "Food").
- **Quick Add removed** from the global header to keep nav focused and avoid accidental creates.
- **Order workflow split**: Buyer states (`draft`, `pending_buyer_approval`, `rejected_by_buyer`, `sent_to_supplier`) and Supplier states (`accepted_by_supplier`, `rejected_by_supplier`, then `shipped/completed`). Buyer managers/admins approve & send; suppliers accept/reject. Suppliers never see drafts/pending approvals.
- **Dashboards scoped**: Superadmin keeps full control tower; company users see only their scoped data.

## Running tests
```bash
npm install
npm run test:run
```

## Notes
- Storage key: `wholesale-crm-mock-v12` (clean data; only superadmin is seeded).
- Superadmin credentials: `super@signalwholesale.com / demo123`. Create all other data via the UI.
