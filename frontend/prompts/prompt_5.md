Continue building CONCEPT COMMERCE.

Build three result renderers: the store map, the availability answer,
and the brand comparison.

---

CREATE: src/components/results/StoreMapResult.jsx

Props:
  - data: { stores: Store[] }
  - result: full API response (for ResultMeta)
  - filters: the filters object from the API response

Where Store is:
  { id, name, city, state, lat, lng, brand_name, product_count, sample_images }

Structure:
  1. <ResultMeta result={result} />

  2. Map + sidebar layout:
     - A flex row container, height: 520px
     - Left: map area, flex: 1
     - Right: sidebar, width: 320px, only visible when a marker is selected
       (width: 0, overflow: hidden when nothing selected —
       animate width with transition: width 300ms ease)

MAP SETUP:
  - Use @vis.gl/react-google-maps APIProvider + Map components
  - Load the API key from process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  - Map options:
    disableDefaultUI: true
    gestureHandling: "cooperative"
    colorScheme: "DARK"   ← use Google Maps dark color scheme natively
  - On mount, fit the map bounds to show all store markers using
    google.maps.LatLngBounds — extend it with each store's lat/lng,
    then call map.fitBounds(bounds, padding: 60)
  - Use a ref to access the map instance for fitBounds

MARKERS:
  - Use the AdvancedMarkerElement from @vis.gl/react-google-maps
  - Custom marker design: a small circle, 10px diameter
    Background: var(--color-text-accent) — the warm gold
    Border: 2px solid var(--color-bg-base)
    Border-radius: 50%
    Cursor: pointer
  - Selected marker: 14px diameter, border: 2px solid var(--color-text-primary)
  - On marker click: set selectedStore state to that store object
  - Clicking the map background (not a marker) deselects

SIDEBAR (rendered when selectedStore is not null):
  - Background: var(--color-bg-surface)
  - Border-left: 1px solid var(--color-border-subtle)
  - Padding: 24px
  - overflow-y: auto

  Sidebar content:
  - Close button: top-right "×", DM Sans 16px, color: var(--color-text-tertiary),
    hover: var(--color-text-primary), cursor: pointer, onClick: deselect
  - Store name: Cormorant Garamond, 22px, weight 400, color: var(--color-text-primary)
  - City + state: DM Sans, 12px, color: var(--color-text-secondary), margin-top: 4px
  - Brand carried: DM Sans, 11px, uppercase, letter-spacing: 0.08em,
    color: var(--color-text-accent), margin-top: 12px
  - Product count: "{n} items available", DM Sans, 11px,
    color: var(--color-text-tertiary), margin-top: 2px

  Sample images grid (products available at this store):
  - Margin-top: 20px
  - Label: "Available now" — DM Sans 10px, uppercase, letter-spacing: 0.1em,
    color: var(--color-text-tertiary), margin-bottom: 8px
  - 2-column grid, gap: 1px
  - Each image: aspect ratio 3/4, object-fit: cover, background: var(--color-bg-elevated)
  - Show up to 6 images from selectedStore.sample_images
  - If no images: show a single line "No preview available" in
    var(--color-text-tertiary), 11px

  Store count summary below the map (always visible, below the map+sidebar row):
  - "{n} stores found in {city}" — DM Sans, 11px, color: var(--color-text-tertiary),
    margin-top: 12px

---

CREATE: src/components/results/AvailabilityResult.jsx

Props:
  - data: { available, store_name, city, brand_name, sample_images }
  - result: full API response

Structure:
  1. <ResultMeta result={result} />

  2. Availability answer block:
     Large status line:
     - If available === true:
         A "✓" character, color: var(--color-text-accent), font-size: 18px
         Followed by: "{brand_name} is available at {store_name}, {city}"
         Cormorant Garamond, 24px, weight 300, color: var(--color-text-primary)
     - If available === false:
         A "·" character, color: var(--color-text-tertiary), font-size: 18px
         Followed by: "We couldn't find {brand_name} in {city}"
         Cormorant Garamond, 24px, weight 300, color: var(--color-text-secondary)

  3. If available and sample_images.length > 0:
     Label: "From the collection" — DM Sans, 10px, uppercase, letter-spacing: 0.1em,
     color: var(--color-text-tertiary), margin-top: 32px, margin-bottom: 12px

     Images: a horizontal row of up to 6 images
     Each image: width: 140px, aspect-ratio: 3/4, object-fit: cover,
     background: var(--color-bg-elevated)
     Gap: 1px between images (same grid-line effect as product grid)
     Row overflows horizontally on narrow screens (overflow-x: auto)

---

CREATE: src/components/results/ComparisonResult.jsx

Props:
  - data: { brand_a: { name, products[] }, brand_b: { name, products[] } }
  - result: full API response

Structure:
  1. <ResultMeta result={result} />

  2. On desktop (>= 768px): two columns side by side, gap: 1px
     On mobile (< 768px): swipeable tabs (see below)

  DESKTOP LAYOUT:
  Each column:
  - Header: brand name in Cormorant Garamond, 18px, uppercase,
    letter-spacing: 0.15em, color: var(--color-text-primary)
    Below header: average effective price across all products in that brand's results:
    "avg. $000" — DM Sans, 11px, color: var(--color-text-tertiary)
    Border-bottom: 1px solid var(--color-border-subtle), padding-bottom: 12px
    margin-bottom: 16px

  Each column renders a vertical list of ComparisonProductRow components (not cards).

  CREATE src/components/ComparisonProductRow.jsx:
  Props: product (same Product shape as ProductCard)
  Design — a horizontal row, height: 72px:
  - Left: image, 48x64px, object-fit: cover, background: var(--color-bg-elevated)
  - Right of image, padding-left: 12px:
    - Title: Cormorant Garamond, 14px, weight 400, max 1 line, ellipsis
    - Category: DM Sans, 10px, color: var(--color-text-tertiary)
    - Price: same logic as ProductCard (struck-through + sale or single price)
  - Bottom border: 1px solid var(--color-border-subtle)
  - Hover: background var(--color-bg-elevated)
  - Cursor: pointer, links to store website same as ProductCard

  Show first 8 products per brand. If more, show "See all {n}" link
  in DM Sans, 11px, color: var(--color-text-accent).

  MOBILE LAYOUT (swipeable tabs):
  - Two tab labels at top: brand_a.name and brand_b.name
  - Active tab: border-bottom 1px solid var(--color-text-accent),
    color: var(--color-text-primary)
  - Inactive tab: color: var(--color-text-tertiary)
  - Below tabs: render the active brand's product list
  - Implement tab switching with useState — no swipe library needed for Phase 2

---

BACKTESTING

1. Submit "which stores in Austin carry Agolde" — confirm map renders dark,
   gold markers appear, map fits bounds to show all markers
2. Click a marker — confirm sidebar slides in with store name, brand,
   product count, and sample images
3. Click map background or × — confirm sidebar closes
4. Submit "does any store in SF carry Toteme" — confirm availability result
   renders with ✓ or · and the brand name, store name, and images if available
5. Submit "which is cheaper, Toteme or Agolde" — confirm comparison renders
   two columns on desktop with headers, avg prices, and product rows
6. Resize to 600px — confirm comparison switches to tab layout
7. Confirm all three result types use the dark color scheme throughout
   with no white or light backgrounds appearing