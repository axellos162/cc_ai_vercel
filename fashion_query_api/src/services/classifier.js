import { openai, CHAT_MODEL } from '../lib/openai.js';
import { INTENTS, SORT_OPTIONS } from '../lib/constants.js';

const CITY_ALIASES = {
  // New York
  "nyc": "New York",
  "new york city": "New York",
  "new york, ny": "New York",
  "ny": "New York",
  "n.y.c.": "New York",
  "n.y.": "New York",
  "the city": "New York",
  "the big apple": "New York",
  "manhattan": "New York",
  "brooklyn": "New York",
  "the bronx": "New York",
  "queens": "New York",
  "staten island": "New York",

  // Los Angeles
  "la": "Los Angeles",
  "l.a.": "Los Angeles",
  "l.a": "Los Angeles",
  "los angeles, ca": "Los Angeles",
  "la, ca": "Los Angeles",
  "lax": "Los Angeles",
  "the city of angels": "Los Angeles",
  "socal": "Los Angeles",
  "so cal": "Los Angeles",
  "hollywood": "Los Angeles",
  "west hollywood": "Los Angeles",
  "weho": "Los Angeles",
  "beverly hills": "Los Angeles",
  "silver lake": "Los Angeles",
  "echo park": "Los Angeles",
  "los feliz": "Los Angeles",
  "venice": "Los Angeles",
  "santa monica": "Los Angeles",
  "culver city": "Los Angeles",
  "melrose": "Los Angeles",

  // San Francisco
  "sf": "San Francisco",
  "s.f.": "San Francisco",
  "san fran": "San Francisco",
  "san francisco, ca": "San Francisco",
  "sf, ca": "San Francisco",
  "the bay": "San Francisco",
  "bay area": "San Francisco",
  "the mission": "San Francisco",
  "soma": "San Francisco",
  "the castro": "San Francisco",
  "haight": "San Francisco",
  "hayes valley": "San Francisco",
  "nob hill": "San Francisco",
  "north beach": "San Francisco",

  // Chicago
  "chi": "Chicago",
  "chi-town": "Chicago",
  "chitown": "Chicago",
  "chicago, il": "Chicago",
  "the windy city": "Chicago",
  "the loop": "Chicago",
  "wicker park": "Chicago",
  "logan square": "Chicago",
  "river north": "Chicago",
  "lincoln park": "Chicago",

  // Miami
  "mia": "Miami",
  "miami, fl": "Miami",
  "the 305": "Miami",
  "305": "Miami",
  "south beach": "Miami",
  "sobe": "Miami",
  "wynwood": "Miami",
  "brickell": "Miami",
  "coral gables": "Miami",
  "coconut grove": "Miami",

  // Austin
  "atx": "Austin",
  "austin, tx": "Austin",
  "austin texas": "Austin",
  "keep austin weird": "Austin",
  "east austin": "Austin",
  "south congress": "Austin",
  "soco": "Austin",
  "sixth street": "Austin",

  // Houston
  "hou": "Houston",
  "houston, tx": "Houston",
  "h-town": "Houston",
  "htown": "Houston",
  "the bayou city": "Houston",
  "space city": "Houston",
  "montrose": "Houston",
  "the heights": "Houston",
  "midtown houston": "Houston",

  // Dallas
  "dfw": "Dallas",
  "dallas, tx": "Dallas",
  "big d": "Dallas",
  "the metroplex": "Dallas",
  "deep ellum": "Dallas",
  "uptown dallas": "Dallas",
  "oak lawn": "Dallas",

  // Washington DC
  "dc": "Washington",
  "d.c.": "Washington",
  "washington dc": "Washington",
  "washington, dc": "Washington",
  "the district": "Washington",
  "dmv": "Washington",
  "the dmv": "Washington",
  "dupont circle": "Washington",
  "georgetown": "Washington",
  "adams morgan": "Washington",
  "capitol hill": "Washington",

  // Boston
  "bos": "Boston",
  "boston, ma": "Boston",
  "beantown": "Boston",
  "the hub": "Boston",
  "back bay": "Boston",
  "south end boston": "Boston",
  "newbury street": "Boston",
  "fenway": "Boston",

  // Seattle
  "sea": "Seattle",
  "seattle, wa": "Seattle",
  "the emerald city": "Seattle",
  "emerald city": "Seattle",
  "the pacific northwest": "Seattle",
  "pnw": "Seattle",
  "capitol hill seattle": "Seattle",
  "fremont seattle": "Seattle",
  "ballard": "Seattle",
  "belltown": "Seattle",

  // Portland
  "pdx": "Portland",
  "portland, or": "Portland",
  "portland oregon": "Portland",
  "rose city": "Portland",
  "stumptown": "Portland",
  "the pearl": "Portland",
  "pearl district": "Portland",
  "alberta arts district": "Portland",
  "division street": "Portland",

  // Nashville
  "nash": "Nashville",
  "nashville, tn": "Nashville",
  "nash vegas": "Nashville",
  "nashvegas": "Nashville",
  "music city": "Nashville",
  "the gulch": "Nashville",
  "east nashville": "Nashville",
  "12 south": "Nashville",
  "twelve south": "Nashville",

  // Atlanta
  "atl": "Atlanta",
  "atlanta, ga": "Atlanta",
  "the a": "Atlanta",
  "hotlanta": "Atlanta",
  "the atl": "Atlanta",
  "ponce city": "Atlanta",
  "buckhead": "Atlanta",
  "midtown atlanta": "Atlanta",
  "little five points": "Atlanta",
  "west midtown": "Atlanta",

  // Philadelphia
  "phl": "Philadelphia",
  "philly": "Philadelphia",
  "philadelphia, pa": "Philadelphia",
  "the city of brotherly love": "Philadelphia",
  "fishtown": "Philadelphia",
  "old city": "Philadelphia",
  "rittenhouse": "Philadelphia",
  "northern liberties": "Philadelphia",

  // New Orleans
  "nola": "New Orleans",
  "new orleans, la": "New Orleans",
  "the big easy": "New Orleans",
  "nawlins": "New Orleans",
  "the crescent city": "New Orleans",
  "the quarter": "New Orleans",
  "french quarter": "New Orleans",
  "magazine street": "New Orleans",
  "marigny": "New Orleans",
  "bywater": "New Orleans",

  // Las Vegas
  "lv": "Las Vegas",
  "las vegas, nv": "Las Vegas",
  "vegas": "Las Vegas",
  "sin city": "Las Vegas",
  "the strip": "Las Vegas",
  "downtown vegas": "Las Vegas",
  "fremont street": "Las Vegas",

  // Denver
  "den": "Denver",
  "denver, co": "Denver",
  "the mile high city": "Denver",
  "mile high city": "Denver",
  "rino": "Denver",
  "river north denver": "Denver",
  "lodo": "Denver",
  "cherry creek": "Denver",
  "capitol hill denver": "Denver",

  // Minneapolis
  "msp": "Minneapolis",
  "minneapolis, mn": "Minneapolis",
  "the twin cities": "Minneapolis",
  "twin cities": "Minneapolis",
  "mini apple": "Minneapolis",
  "the mini apple": "Minneapolis",
  "uptown minneapolis": "Minneapolis",
  "north loop": "Minneapolis",

  // Phoenix
  "phx": "Phoenix",
  "phoenix, az": "Phoenix",
  "the valley": "Phoenix",
  "valley of the sun": "Phoenix",
  "scottsdale": "Phoenix",
  "tempe": "Phoenix",

  // San Diego
  "sd": "San Diego",
  "san diego, ca": "San Diego",
  "america's finest city": "San Diego",
  "north park": "San Diego",
  "hillcrest": "San Diego",
  "little italy san diego": "San Diego",
  "gaslamp": "San Diego",

  // Detroit
  "det": "Detroit",
  "detroit, mi": "Detroit",
  "the d": "Detroit",
  "motown": "Detroit",
  "corktown": "Detroit",
  "midtown detroit": "Detroit",
  "eastern market": "Detroit",

  // Pittsburgh
  "pit": "Pittsburgh",
  "pittsburgh, pa": "Pittsburgh",
  "the burgh": "Pittsburgh",
  "pgh": "Pittsburgh",
  "steel city": "Pittsburgh",
  "lawrenceville": "Pittsburgh",
  "east liberty": "Pittsburgh",

  // Charlotte
  "clt": "Charlotte",
  "charlotte, nc": "Charlotte",
  "the queen city": "Charlotte",
  "noda": "Charlotte",
  "plaza midwood": "Charlotte",
  "south end charlotte": "Charlotte",

  // Raleigh
  "ral": "Raleigh",
  "raleigh, nc": "Raleigh",
  "the triangle": "Raleigh",
  "research triangle": "Raleigh",
  "glenwood south": "Raleigh",

  // Salt Lake City
  "slc": "Salt Lake City",
  "salt lake city, ut": "Salt Lake City",
  "salt lake": "Salt Lake City",
  "the salt flats": "Salt Lake City",

  // Kansas City
  "kc": "Kansas City",
  "kansas city, mo": "Kansas City",
  "kcmo": "Kansas City",
  "the crossroads": "Kansas City",
  "crossroads arts district": "Kansas City",
  "the plaza": "Kansas City",
  "westport kc": "Kansas City",

  // San Antonio
  "sat": "San Antonio",
  "san antonio, tx": "San Antonio",
  "sa": "San Antonio",
  "alamo city": "San Antonio",
  "the riverwalk": "San Antonio",
  "pearl district san antonio": "San Antonio",

  // Columbus
  "cmh": "Columbus",
  "columbus, oh": "Columbus",
  "cbus": "Columbus",
  "short north": "Columbus",
  "german village": "Columbus",
  "clintonville": "Columbus",

  // Indianapolis
  "ind": "Indianapolis",
  "indianapolis, in": "Indianapolis",
  "indy": "Indianapolis",
  "broad ripple": "Indianapolis",
  "fountain square": "Indianapolis",
  "mass ave": "Indianapolis",

  // Memphis
  "mem": "Memphis",
  "memphis, tn": "Memphis",
  "bluff city": "Memphis",
  "beale street": "Memphis",
  "south main memphis": "Memphis",

  // Baltimore
  "bal": "Baltimore",
  "baltimore, md": "Baltimore",
  "charm city": "Baltimore",
  "bmore": "Baltimore",
  "hampden": "Baltimore",
  "fell's point": "Baltimore",
  "federal hill": "Baltimore",

  // Richmond
  "ric": "Richmond",
  "richmond, va": "Richmond",
  "rva": "Richmond",
  "river city": "Richmond",
  "the fan": "Richmond",
  "scott's addition": "Richmond",
  "carytown": "Richmond",
};

const BRAND_ALIASES = {
  // Common shortenings
  "acne": "Acne Studios",
  "dsquared": "Dsquared2",
  "d squared": "Dsquared2",
  "apc": "A.P.C.",
  "a.p.c": "A.P.C.",
  "ysl": "Saint Laurent",
  "saint laurent paris": "Saint Laurent",
  "comme": "Comme des Garçons",
  "cdg": "Comme des Garçons",
  "comme des garcons": "Comme des Garçons",
  "margiela": "Maison Margiela",
  "mm6": "MM6 Maison Margiela",
  "miu": "Miu Miu",
  "prada sport": "Prada",
  "rl": "Ralph Lauren",
  "polo": "Ralph Lauren",
  "polo ralph lauren": "Ralph Lauren",
  "ck": "Calvin Klein",
  "calvin": "Calvin Klein",
  "mk": "Michael Kors",
  "tb": "Tory Burch",
  "mcq": "Alexander McQueen",
  "mcqueen": "Alexander McQueen",
  "balenci": "Balenciaga",
  "balenciagga": "Balenciaga",
  "guci": "Gucci",
  "louie": "Louis Vuitton",
  "lv": "Louis Vuitton",
  "louis": "Louis Vuitton",
  "loewe": "Loewe",
  "aw": "Alexander Wang",
  "wang": "Alexander Wang",
  "rick": "Rick Owens",
  "rick owens drkshdw": "Rick Owens",
  "drkshdw": "Rick Owens",
  "owens": "Rick Owens",
  "raf": "Raf Simons",
  "jacq": "Jacquemus",
  "jil": "Jil Sander",
  "lemaire paris": "Lemaire",
  "issey": "Issey Miyake",
  "pleats please": "Issey Miyake",
  "ami paris": "AMI",
  "ami alexandre mattiussi": "AMI",
  "kenzo paris": "Kenzo",
  "givenchy paris": "Givenchy",
  "off white": "Off-White",
  "off-white c/o": "Off-White",
  "virgil": "Off-White",
  "palm": "Palm Angels",
  "fear of god essentials": "Fear of God",
  "fog": "Fear of God",
  "essentials": "Fear of God",
  "a cold wall": "A-Cold-Wall*",
  "acw": "A-Cold-Wall*",
  "stone isle": "Stone Island",
  "si": "Stone Island",
  "cp": "C.P. Company",
  "cp company": "C.P. Company",
  "north face": "The North Face",
  "tnf": "The North Face",
  "new bal": "New Balance",
  "nb": "New Balance",
  "nikes": "Nike",
  "adidas originals": "Adidas",
  "three stripes": "Adidas",
  "ye": "Yeezy",
  "kanye": "Yeezy",
  "toteme paris": "Toteme",
  "totême": "Toteme",
  "agl": "Agolde",
  "agolde denim": "Agolde",
  "ganni copenhagen": "Ganni",
  "stine goya copenhagen": "Stine Goya",
  "saks potts cph": "Saks Potts",
  "rotate birger christensen": "Rotate",
  "cecilie bahnsen cph": "Cecilie Bahnsen",
};

const CATEGORY_SYNONYMS = {
  // Bottoms
  "denim": "jeans",
  "denims": "jeans",
  "jean": "jeans",
  "trousers": "pants",
  "trouser": "pants",
  "slacks": "pants",
  "chinos": "pants",
  "cargos": "cargo pants",
  "cargo": "cargo pants",
  "leggings": "pants",
  "joggers": "pants",
  "sweatpants": "pants",
  "trackpants": "pants",
  "shorts": "shorts",
  "bermudas": "shorts",
  "mini": "skirt",
  "midi": "skirt",
  "maxi": "skirt",

  // Tops
  "tee": "t-shirt",
  "tees": "t-shirts",
  "tee shirt": "t-shirt",
  "tee shirts": "t-shirts",
  "tank": "tank top",
  "tanks": "tank tops",
  "polo shirt": "polo",
  "button down": "shirt",
  "button up": "shirt",
  "oxford": "shirt",
  "flannel": "shirt",
  "blouse": "top",
  "camisole": "top",
  "cami": "top",
  "crop": "crop top",
  "tube": "tube top",
  "bodysuit": "top",
  "knit": "knitwear",
  "knits": "knitwear",
  "jumper": "sweater",
  "jumpers": "sweaters",
  "pullover": "sweater",
  "hoodie": "sweatshirt",
  "hoody": "sweatshirt",
  "zip up": "sweatshirt",
  "crewneck": "sweatshirt",
  "crew neck": "sweatshirt",
  "fleece": "sweatshirt",

  // Outerwear
  "coat": "outerwear",
  "coats": "outerwear",
  "jacket": "jacket",
  "jackets": "jacket",
  "puffer": "jacket",
  "parka": "jacket",
  "windbreaker": "jacket",
  "rain jacket": "jacket",
  "trench": "coat",
  "trench coat": "coat",
  "blazer": "blazer",
  "sport coat": "blazer",
  "overcoat": "coat",
  "peacoat": "coat",
  "pea coat": "coat",
  "fur": "coat",
  "fur coat": "coat",
  "shearling": "coat",
  "leather jacket": "jacket",
  "bomber": "jacket",
  "varsity": "jacket",

  // Dresses
  "dress": "dress",
  "dresses": "dress",
  "frock": "dress",
  "gown": "dress",
  "slip dress": "dress",
  "wrap dress": "dress",
  "shirt dress": "dress",
  "mini dress": "dress",
  "midi dress": "dress",
  "maxi dress": "dress",
  "cocktail dress": "dress",

  // Footwear
  "trainers": "sneakers",
  "trainer": "sneakers",
  "kicks": "sneakers",
  "runners": "sneakers",
  "running shoes": "sneakers",
  "tennis shoes": "sneakers",
  "plimsolls": "sneakers",
  "high tops": "sneakers",
  "low tops": "sneakers",
  "shoe": "shoes",
  "boot": "boots",
  "ankle boot": "boots",
  "ankle boots": "boots",
  "chelsea boot": "boots",
  "chelsea boots": "boots",
  "combat boot": "boots",
  "combat boots": "boots",
  "loafer": "loafers",
  "mule": "mules",
  "sandal": "sandals",
  "slide": "slides",
  "clog": "clogs",
  "heel": "heels",
  "pump": "heels",
  "stiletto": "heels",
  "wedge": "heels",
  "flat": "flats",
  "ballet flat": "flats",
  "mary jane": "flats",

  // Accessories
  "bag": "bags",
  "bags": "bags",
  "purse": "bags",
  "handbag": "bags",
  "tote": "bags",
  "clutch": "bags",
  "crossbody": "bags",
  "shoulder bag": "bags",
  "backpack": "bags",
  "fanny pack": "bags",
  "belt bag": "bags",
  "bum bag": "bags",
  "wallet": "accessories",
  "card holder": "accessories",
  "belt": "accessories",
  "belts": "accessories",
  "hat": "hats",
  "cap": "hats",
  "beanie": "hats",
  "bucket hat": "hats",
  "beret": "hats",
  "scarf": "accessories",
  "scarves": "accessories",
  "gloves": "accessories",
  "socks": "accessories",
  "sunglasses": "accessories",
  "shades": "accessories",
  "sunnies": "accessories",
  "glasses": "accessories",
  "specs": "accessories",
  "jewelry": "accessories",
  "jewellery": "accessories",
  "necklace": "accessories",
  "bracelet": "accessories",
  "ring": "accessories",
  "earrings": "accessories",
  "watch": "accessories",

  // Suits and formalwear
  "suit": "suits",
  "suits": "suits",
  "tuxedo": "suits",
  "tux": "suits",
  "waistcoat": "vest",
  "gilet": "vest",

  // Swimwear / Activewear
  "swimwear": "swimwear",
  "swimsuit": "swimwear",
  "bikini": "swimwear",
  "swim trunks": "swimwear",
  "board shorts": "swimwear",
  "activewear": "activewear",
  "workout clothes": "activewear",
  "gym wear": "activewear",
  "sports bra": "activewear",
  "legging": "activewear",

  // Loungewear / Sleepwear
  "loungewear": "loungewear",
  "pajamas": "loungewear",
  "pyjamas": "loungewear",
  "pjs": "loungewear",
  "robe": "loungewear",
};

const SYSTEM_PROMPT = `You are a fashion retail search intent classifier. Given a user query, return
ONLY a valid JSON object. No markdown, no explanation, no code fences.

The JSON must follow this schema exactly:
{
  "intent": one of: "product_search" | "store_finder" | "availability_check" | "price_comparison" | "similar_products" | "brand_similarity" | "ambiguous",
  "filters": {
    "brand": string | null,
    "brands": string[] | null,         // for price_comparison with 2+ brands
    "category": string | null,
    "city": string | null,
    "state": string | null,
    "price_min": number | null,
    "price_max": number | null,
    "price_around": number | null      // for "around $X" — caller applies ± buffer
  },
  "exclude_brands": string[] | null,   // for similar_products - brands to exclude
  "sort": one of: "relevance" | "discount" | "price_asc" | "price_desc" | null,
  "raw_query": string                  // the original query, unchanged
}

Intent classification rules:
- "product_search": user wants to find/browse products. e.g. "find me acne studios jeans in SF"
- "store_finder": user wants to know which stores carry a brand. e.g. "which stores in Austin carry Agolde"
- "availability_check": user asks if a specific store carries a brand. e.g. "does Nordstrom SF carry Toteme"
- "price_comparison": user wants to compare prices between two brands. e.g. "which is cheaper, Toteme or Agolde"
- "similar_products": user wants products similar to previously shown items. e.g. "show me similar from other brands", "find similar jeans", "comparable products"
- "brand_similarity": user wants to find brands similar to a specific brand. e.g. "brands like Rick Owens", "what brands are similar to Acne Studios", "find alternatives to A.P.C.", "brands comparable to Comme des Garçons". Extract the target brand into filters.brand. Do NOT confuse with similar_products (which finds similar individual products). brand_similarity finds entire BRANDS that are similar.
- "ambiguous": query could reasonably be product_search OR store_finder. e.g. "good denim in LA"

Similar products intent rules:
- Triggered by phrases like: "similar", "like these", "comparable", "alternatives", "like that", "same style"
- Often combined with: "from other brands", "different brands", "other options", "alternative brands"
- Examples: "show me similar from other brands", "find similar jeans", "like these but cheaper"
- If the query mentions excluding brands, add them to "exclude_brands" array
- Can include additional filters (price, location, category) which should be extracted normally

Price extraction rules:
- "under $200" or "less than $200" → price_max: 200, price_min: null
- "over $100" or "more than $100" → price_min: 100, price_max: null
- "around $250" or "about $250" → price_around: 250 (NOT price_min/price_max)
- "$100 to $200" or "between $100 and $200" → price_min: 100, price_max: 200
- No price mentioned → all price fields null

Brand extraction rules:
- For price_comparison, extract both brands into the "brands" array
- For similar_products with brand exclusion, extract brands to exclude into "exclude_brands" array
- For all other intents, put the single brand in "brand"
- Normalise brand names to title case
- If no brand is mentioned, set brand/brands/exclude_brands to null`;

function normaliseFilters(filters) {
  const norm = { ...filters };

  if (norm.city) {
    const key = norm.city.toLowerCase().trim();
    norm.city = CITY_ALIASES[key] ?? norm.city;
  }

  if (norm.brand) {
    const key = norm.brand.toLowerCase().trim();
    norm.brand = BRAND_ALIASES[key] ?? norm.brand;
  }

  if (norm.brands && Array.isArray(norm.brands)) {
    norm.brands = norm.brands.map(b => {
      const key = b.toLowerCase().trim();
      return BRAND_ALIASES[key] ?? b;
    });
  }

  if (norm.category) {
    const key = norm.category.toLowerCase().trim();
    norm.category = CATEGORY_SYNONYMS[key] ?? norm.category;
  }

  return norm;
}

export async function classifyQuery(queryString, context = null) {
  try {
    // Check if context is available
    const hasContext = context && context.previous_product_ids && context.previous_product_ids.length > 0;

    // Include context hint in user message if available
    const userMessage = hasContext
      ? `${queryString}\n[Note: User has previous query context available]`
      : queryString;

    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0,
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ]
    });

    const content = response.choices[0].message.content.trim();
    const parsed = JSON.parse(content);

    const validIntents = Object.values(INTENTS);
    if (!validIntents.includes(parsed.intent)) {
      parsed.intent = INTENTS.AMBIGUOUS;
    }

    // If similar_products intent but no context, fallback to product_search
    if (parsed.intent === INTENTS.SIMILAR_PRODUCTS && !hasContext) {
      console.warn('similar_products intent detected but no context provided, falling back to product_search');
      parsed.intent = INTENTS.PRODUCT_SEARCH;
    }

    // For similar_products intent, inherit missing filters from previous context
    if (parsed.intent === INTENTS.SIMILAR_PRODUCTS && context && context.previous_filters) {
      // Inherit category if not specified in current query
      if (!parsed.filters.category && context.previous_filters.category) {
        parsed.filters.category = context.previous_filters.category;
        console.log(`Inherited category from previous query: ${parsed.filters.category}`);
      }
      // Inherit location filters if not specified in current query
      if (!parsed.filters.city && context.previous_filters.city) {
        parsed.filters.city = context.previous_filters.city;
      }
      if (!parsed.filters.state && context.previous_filters.state) {
        parsed.filters.state = context.previous_filters.state;
      }
    }

    parsed.filters = normaliseFilters(parsed.filters);
    return parsed;
  } catch (error) {
    console.error('Classifier error:', error.message);
    const fallback = {
      intent: INTENTS.AMBIGUOUS,
      filters: {
        brand: null,
        brands: null,
        category: null,
        city: null,
        state: null,
        price_min: null,
        price_max: null,
        price_around: null
      },
      exclude_brands: null,
      sort: null,
      raw_query: queryString
    };
    fallback.filters = normaliseFilters(fallback.filters);
    return fallback;
  }
}
