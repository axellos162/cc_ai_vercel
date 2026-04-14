You are building a Next.js application called `fashion-query-api`. This is a
brand new project. It will serve as the backend Query API for a fashion product
search application. The data lives in an existing Supabase database populated
by a separate scraper project.

---

SCAFFOLD

Run:
  npx create-next-app@latest fashion-query-api \
    --typescript=false \
    --eslint=false \
    --tailwind=false \
    --app \
    --src-dir \
    --import-alias "@/*"

Then set up the following structure inside the project:

fashion-query-api/
├── .env.local              ← secrets, gitignored
├── .env.local.example      ← committed, empty values
├── .gitignore              ← ensure .env.local is listed
├── AGENTS.md               ← (will be added separately)
├── package.json
└── src/
    ├── app/
    │   └── api/
    │       └── v1/
    │           └── query/
    │               └── route.js     ← API endpoint
    ├── lib/
    │   ├── db.js            ← Supabase client
    │   ├── openai.js        ← OpenAI client
    │   └── constants.js     ← shared constants
    └── services/
        ├── classifier.js    ← intent classification
        ├── search.js        ← pgvector + SQL search
        └── response.js      ← response shaping

---

ENVIRONMENT

.env.local must contain:
  SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  OPENAI_API_KEY=

.env.local.example must be committed with the same keys but empty values.

---

src/lib/db.js

- Import createClient from @supabase/supabase-js
- Read SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from process.env
- Export a single supabase client instance as a named export `supabase`
- This file is the only place the Supabase client is instantiated

---

src/lib/openai.js

- Import OpenAI from the `openai` package
- Read OPENAI_API_KEY from process.env
- Export a single OpenAI client instance as a named export `openai`
- Export a named constant `CHAT_MODEL = "gpt-4o-mini"` 
- Export a named constant `EMBEDDING_MODEL = "text-embedding-3-small"`
- All model references throughout the codebase must import from this file.
  Never hardcode model names anywhere else. This makes switching models trivial.

---

src/lib/constants.js

Export the following constants:

  // Intents
  export const INTENTS = {
    PRODUCT_SEARCH: "product_search",
    STORE_FINDER:   "store_finder",
    AVAILABILITY:   "availability_check",
    COMPARISON:     "price_comparison",
    AMBIGUOUS:      "ambiguous",
  };

  // Sort options
  export const SORT_OPTIONS = {
    RELEVANCE:   "relevance",
    DISCOUNT:    "discount",
    PRICE_ASC:   "price_asc",
    PRICE_DESC:  "price_desc",
  };

  // Defaults
  export const DEFAULT_SORT    = SORT_OPTIONS.RELEVANCE;
  export const EMBEDDING_DIM   = 1536;
  export const PRICE_AROUND_BUFFER = 50; // ± buffer for "around $X" queries

---

DEPENDENCIES

Install:
  npm install @supabase/supabase-js openai

No other dependencies are needed for this phase.

---

next.config.js

Ensure the runtime is Node (not Edge):
  /** @type {import('next').NextConfig} */
  const nextConfig = {};
  export default nextConfig;

The route.js file will declare Node runtime explicitly (covered in Prompt 2).

---

BACKTESTING

1. Run `npm run dev` and confirm the dev server starts with no errors.
2. Run this to confirm both clients initialise:
   node -e "
     import('./src/lib/db.js').then(async ({supabase}) => {
       const {error} = await supabase.from('products').select('count').limit(1);
       console.log('Supabase:', error ? 'FAIL ' + error.message : 'OK');
     });
   "
3. Confirm .env.local is listed in .gitignore.
4. Confirm CHAT_MODEL and EMBEDDING_MODEL are only defined in src/lib/openai.js
   and not hardcoded anywhere else.