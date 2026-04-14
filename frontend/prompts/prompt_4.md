Continue building CONCEPT COMMERCE.

Build the product grid renderer. This is the most common result type —
it renders for "product_search" and the product half of "dual".

---

CREATE: src/components/results/ProductGridResult.jsx

Props:
  - data: { products: Product[] }

Where Product is:
  {
    id, title, description, category,
    price, discounted_price, effective_price,
    images,
    brand: { name },
    store: { name, city, state, lat, lng }
  }

Structure:
  1. <ResultMeta result={...} /> — passed down as a prop called `result`
     (the full API response, not just data)

  2. Section header line:
     Left side: brand name(s) present in results, comma-separated,
     in Cormorant Garamond 13px, color: var(--color-text-secondary),
     letter-spacing: 0.08em, uppercase
     Right side: total count "{n} items", DM Sans 11px,
     color: var(--color-text-tertiary)
     These two sit on the same line, space-between.

  3. Product grid:
     CSS Grid, auto-fill columns, minmax(220px, 1fr), gap: 1px
     The 1px gap between cards creates a subtle grid line effect —
     the gap IS the border between cards (the page background shows through).

  4. Lazy loading:
     Show first 12 products immediately.
     Render a "Load more" button below the grid if products.length > 12.
     Each click reveals 12 more. No infinite scroll — explicit button.

     Load more button design:
     - Full width, height: 40px
     - Background: transparent
     - Border: 1px solid var(--color-border-default)
     - Border-radius: 2px
     - Font: DM Sans, 12px, letter-spacing: 0.1em, uppercase
     - Color: var(--color-text-secondary)
     - Hover: border-color var(--color-border-strong),
              color var(--color-text-primary)
     - Text: "Load {remaining} more" where remaining = total - currently shown

---

CREATE: src/components/ProductCard.jsx

Props:
  - product: Product object (see shape above)

Behaviour:
  - Entire card is a link: clicking opens the store's website in a new tab.
    The store website URL is constructed as:
    https://{store.domain}
    Note: the store domain is available in the API response. If not present,
    omit the link and render as a div.

Design:
  - Background: var(--color-bg-surface)
  - No border (the 1px grid gap acts as the border)
  - No border-radius — sharp corners only
  - Cursor: pointer
  - Hover: background transitions to var(--color-bg-elevated)
  - Transition: background var(--transition-base)

  IMAGE AREA:
  - Aspect ratio: 3/4 (portrait — standard fashion product ratio)
  - Background: var(--color-bg-elevated) as fallback while image loads
  - Use Next.js <Image> component with fill layout inside a relative container
  - Object-fit: cover
  - Show first image in product.images array. If images is empty, show a
    placeholder div with the aspect ratio maintained and a centered "·" in
    var(--color-text-tertiary)

  INFO AREA:
  - Padding: 12px
  - Brand name: DM Sans, 10px, uppercase, letter-spacing: 0.1em,
    color: var(--color-text-secondary), margin-bottom: 4px
  - Product title: Cormorant Garamond, 15px, weight 400,
    color: var(--color-text-primary), line-height: 1.3,
    max 2 lines then truncate with ellipsis
  - Store + city: DM Sans, 10px, color: var(--color-text-tertiary),
    margin-top: 6px
    Format: "{store name} · {city}"

  PRICE AREA (below store line, margin-top: 8px):
  - If discounted_price exists and discounted_price < price:
      Show original price: DM Sans, 11px, color: var(--color-text-tertiary),
      text-decoration: line-through
      Show sale price on same line, margin-left: 6px:
      DM Sans, 12px, color: var(--color-sale), font-weight: 500
      Show a small "SALE" badge:
      background: var(--color-sale-bg), color: var(--color-sale),
      font-size: 9px, padding: 1px 4px, letter-spacing: 0.08em,
      margin-left: 6px
  - If no discount:
      Show price only: DM Sans, 12px, color: var(--color-text-secondary)
  - Format prices as: $000 (no decimals if .00, otherwise 2 decimal places)
    Use: price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`

---

BACKTESTING

1. Submit "find me jeans" — confirm product grid renders with portrait cards
2. Confirm the 1px gap grid line effect is visible between cards
3. Confirm hovering a card shifts its background subtly
4. If your data has more than 12 products for the query, confirm "Load more"
   button appears and loads the next 12 on click
5. Confirm discounted products show struck-through original price + gold sale price
6. Confirm non-discounted products show single price in muted color
7. Confirm clicking a card opens a new tab (or does nothing gracefully if
   store domain is unavailable)
8. Submit "find me jeans under $200" — confirm all visible products have
   effective_price <= 200
9. Resize to 1024px width — confirm grid reflows to fewer columns gracefully