# Development Data Configuration

## Events Data Source

The application can now dynamically choose between production and development event data based on environment configuration.

### How it works

Both `loadResources.ts` and the `Events` component will automatically load:

- `index-dev.json` when in development mode
- `index.json` for production

### Configuration

The system checks for either of these conditions to use development data:

1. `NODE_ENV === 'development'`
2. `NEXT_PUBLIC_USE_DEV_DATA === 'true'` (environment variable)

### Files Modified

- `src/utils/loadResources.ts` - Updated `loadEvents()` function
- `src/components/Resources/Events.tsx` - Updated data loading logic

### Usage

**For development:**

```bash
# Automatically uses dev data when NODE_ENV=development
npm run dev

# Or explicitly set the flag
NEXT_PUBLIC_USE_DEV_DATA=true npm run dev
```

**For production:**

```bash
# Uses production data (index.json)
npm run build && npm start
```

### Data Files

- `content/resources/events/index.json` - Production events (1 event)
- `content/resources/events/index-dev.json` - Development events (6 events)

The development file contains more test events for better testing and development experience.
