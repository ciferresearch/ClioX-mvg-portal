# Dev Seed Utilities

Small helpers to seed IndexedDB for local testing without a working Provider.

## What this does

- Writes mock rows to Dexie/IndexedDB tables:
  - `textAnalysises` (TextAnalysis)
  - `cameroonGazettes` (Cameroon Gazette)
- Each row uses a mock job id: `mock-<timestamp>` and includes all visualization fields (date/email distribution, sentiment, wordcloud, document summary).
- Reads sample files from:
  - TextAnalysis: `public/samples/text/*` → fallback `public/samples/*`
  - Cameroon: `public/samples/cameroon/*` → fallback `public/samples/*`

## Enable

1. Add to `.env` (and restart dev server):

```
NEXT_PUBLIC_ENABLE_DEV_SEED=true
```

## How to use

- URL trigger (auto-seed on page mount):
  - TextAnalysis: `/usecases/textAnalysis?seed=text`
  - Cameroon: `/usecases/cameroonGazette?seed=cameroon`
- Console helpers (available only with the env flag):

```js
// Seed
await window.__dev.seed('text')
await window.__dev.seed('cameroon')

// Clear
await window.__dev.clear('text')
await window.__dev.clear('cameroon')
```

## Verify

- Browser DevTools → Application → IndexedDB → `portal-clioX-indexed-db`
- Click the store name (not its indexes): `textAnalysises` or `cameroonGazettes`
- Use the refresh button if needed

## Notes

- In dev-seed mode, pages will NOT auto-clear IndexedDB on unmount to allow iterative testing.
- Samples are split:
  - TextAnalysis: `public/samples/text/`
  - Cameroon: `public/samples/cameroon/`

## Cleanup (when Provider is back)

- Remove `src/dev/*`
- Remove conditional seed calls from pages (TextAnalysis/CameroonGazette)
- Delete `NEXT_PUBLIC_ENABLE_DEV_SEED` from `.env`

## Troubleshooting

- If no records appear:
  - Ensure `.env` flag is set and dev server restarted
  - Open the store itself (not the `job`/`result` index)
  - Try console seeding and check for errors
  - Open sample files directly in the browser (e.g. `/samples/text/date_distribution.csv`) to confirm they load
