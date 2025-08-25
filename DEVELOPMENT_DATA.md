# Development Data Configuration

## Events Data Source

The application can now dynamically choose between production and development event data based on environment configuration.

### How it works

Both `loadResources.ts` and the `Events` component will load:

- `index.json` for all environments

### Configuration

The system now uses a single data source for all environments.

### Files Modified

- `src/utils/loadResources.ts` - Updated `loadEvents()` function
- `src/components/Resources/Events.tsx` - Updated data loading logic

### Usage

The application now uses the same data source regardless of environment:

```bash
# All environments use index.json
npm run dev
npm run build && npm start
```

### Data Files

- `content/resources/events/index.json` - Events data for all environments

### Map Configuration

The application supports various map configuration options through environment variables:

#### Map Style & Appearance

- `NEXT_PUBLIC_MAP_STYLE_URL` - Map tile style URL (default: OpenFreeMap bright)
- `NEXT_PUBLIC_MAP_MARKER_COLOR` - Marker color (default: #0ea5e9)
- `NEXT_PUBLIC_MAP_MARKER_SIZE` - Marker size in pixels (default: 28)

#### Map Focus & Zoom

- `NEXT_PUBLIC_MAP_FOCUS_ZOOM` - Zoom level when focusing on a specific event (default: 16)

#### Map Tour Settings

- `NEXT_PUBLIC_MAP_TOUR_START_MS` - Delay before starting tour (default: 3000ms)
- `NEXT_PUBLIC_MAP_TOUR_FLY_MS` - Duration of fly animation (default: 900ms)
- `NEXT_PUBLIC_MAP_TOUR_HOLD_MS` - Time to hold on each marker (default: 4500ms)
- `NEXT_PUBLIC_MAP_TOUR_RESUME_MS` - Delay before resuming tour (default: 10000ms)
- `NEXT_PUBLIC_MAP_TOUR_ZOOM` - Zoom level during tour (default: 15)
- `NEXT_PUBLIC_MAP_TOUR_SEARCH_IDLE_MS` - Search idle timeout (default: 4000ms)
