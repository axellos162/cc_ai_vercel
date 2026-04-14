You are continuing to build the CONCEPT COMMERCE Next.js application.
The project already has a working Query API at POST /api/v1/query.
You are now building the frontend.

AESTHETIC DIRECTION:
Dark and elegant. Think high-fashion editorial. Think a luxury concept store
that exists online. Every detail should feel considered and refined.
Not flashy. Not generic. Silent luxury with a precise, typographic sensibility.

---

INSTALL FONTS

In src/app/layout.js, import these Google Fonts using next/font/google:
- Display font: "Cormorant Garamond" — weights 300, 400, 500
  Used for large headings, product titles, brand names
- Body font: "DM Sans" — weights 300, 400, 500
  Used for all UI text, labels, inputs, metadata

---

GLOBAL CSS

Create src/app/globals.css with the following design tokens as CSS variables.
Do not use Tailwind's default color palette for brand colors — define custom
ones here and reference them in Tailwind config.

:root {
  /* Background layers */
  --color-bg-base:       #0a0a0a;   /* page background */
  --color-bg-surface:    #111111;   /* card, sidebar surfaces */
  --color-bg-elevated:   #1a1a1a;   /* hover states, inputs */
  --color-bg-overlay:    #222222;   /* modals, popovers */

  /* Borders */
  --color-border-subtle: #1f1f1f;
  --color-border-default:#2e2e2e;
  --color-border-strong: #444444;

  /* Text */
  --color-text-primary:  #f0ede8;   /* warm off-white, primary text */
  --color-text-secondary:#8a8680;   /* muted labels, metadata */
  --color-text-tertiary: #4a4845;   /* very muted, hints */
  --color-text-accent:   #c9b99a;   /* warm gold accent — sale prices,
                                        hover states, active elements */

  /* Functional */
  --color-sale:          #c9b99a;   /* highlighted sale price */
  --color-sale-bg:       #1e1a14;   /* sale badge background */

  /* Spacing rhythm */
  --space-page-x: 48px;            /* horizontal page padding */
  --space-page-y: 32px;            /* vertical page padding */

  /* Typography */
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-body:    "DM Sans", system-ui, sans-serif;

  /* Transitions */
  --transition-base: 200ms ease;
  --transition-slow: 400ms ease;
}

Set body defaults:
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;

---

TAILWIND CONFIG

Extend tailwind.config.js to include the custom color tokens and fonts:

  theme: {
    extend: {
      colors: {
        bg: {
          base:     'var(--color-bg-base)',
          surface:  'var(--color-bg-surface)',
          elevated: 'var(--color-bg-elevated)',
          overlay:  'var(--color-bg-overlay)',
        },
        border: {
          subtle:  'var(--color-border-subtle)',
          default: 'var(--color-border-default)',
          strong:  'var(--color-border-strong)',
        },
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary:  'var(--color-text-tertiary)',
          accent:    'var(--color-text-accent)',
        },
        sale: 'var(--color-sale)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body:    'var(--font-body)',
      },
    }
  }

---

LAYOUT SHELL

Create src/app/layout.js:

- HTML lang="en"
- Dark color scheme meta tag:
  <meta name="color-scheme" content="dark">
- Page title: "CONCEPT COMMERCE"
- Import globals.css
- Import and apply both Google Fonts via next/font/google
- The body renders {children} directly — no wrapper nav or sidebar at this stage
- No default padding on body — each page controls its own spacing

---

HOME PAGE SHELL

Create src/app/page.js

This is the main chat page. It is a client component ("use client").

State to initialise (all useState):
  - turns: []            ← array of { query, result } objects (chat history)
  - inputValue: ""       ← controlled input
  - isLoading: false     ← true while API call is in flight

The page renders:
  1. <HomeView> when turns.length === 0 (centered search engine homepage state)
  2. <ChatView> when turns.length > 0 (chat history + bottom input)

HomeView and ChatView are defined in the next prompt. For now, render
placeholder divs with the correct labels so the layout shell is testable.

The page must export a default async function for Next.js, but since it uses
client hooks, the entire component must be "use client".

---

BACKTESTING

1. Run npm run dev — confirm no errors, page loads at localhost:3000
2. Confirm background is #0a0a0a (near-black), not white
3. Confirm Cormorant Garamond and DM Sans are loading (check Network tab)
4. Confirm CSS variables are present on :root in DevTools
5. Confirm Tailwind classes like bg-bg-surface resolve correctly by adding a
   temporary test div: <div className="bg-bg-surface p-4 text-text-accent">test</div>
   It should render as a dark surface with warm gold text. Remove after confirming.