const INTENT_LABELS = {
  product_search: "Product search",
  store_finder: "Store finder",
  availability_check: "Availability",
  price_comparison: "Comparison",
  ambiguous: "Broad search"
}

export default function ResultMeta({ result }) {
  const intent = result.intent
  const filters = result.filters || {}
  const resultCount = result.results?.count || 0

  const intentLabel = INTENT_LABELS[intent] || intent

  return (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {/* Intent chip */}
      <span className="chip">{intentLabel}</span>

      {/* Filter chips - only render if not null */}
      {filters.brand && (
        <span className="chip">Brand: {filters.brand}</span>
      )}
      {filters.city && (
        <span className="chip">City: {filters.city}</span>
      )}
      {filters.store && (
        <span className="chip">Store: {filters.store}</span>
      )}
      {filters.max_price && (
        <span className="chip">Under ${filters.max_price}</span>
      )}

      {/* Result count */}
      {resultCount > 0 && (
        <span className="chip">{resultCount} results</span>
      )}

      <style jsx>{`
        .chip {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border: 1px solid var(--color-border-subtle);
          border-radius: 2px;
          font-size: 11px;
          color: var(--color-text-tertiary);
          font-family: var(--font-body);
          letter-spacing: 0.03em;
        }
      `}</style>
    </div>
  )
}
