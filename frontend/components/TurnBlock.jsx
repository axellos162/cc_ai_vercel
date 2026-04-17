import ProductGridResult from './results/ProductGridResult'
import StoreMapResult from './results/StoreMapResult'
import AvailabilityResult from './results/AvailabilityResult'
import ComparisonResult from './results/ComparisonResult'
import DualResult from './results/DualResult'
import BrandSimilarityResult from './results/BrandSimilarityResult'
import ErrorResult from './results/ErrorResult'

export default function TurnBlock({ turn, onSearchBrands, onAuthRequired }) {
  const { query, result } = turn

  // Render result based on type or error state
  const renderResult = () => {
    // If result is not ok, show error
    if (result.ok === false) {
      return <ErrorResult message={result.error || "Something went wrong"} />
    }

    // Route by result type
    const resultType = result.results?.type
    const data = result.results?.data
    const filters = result.filters

    switch (resultType) {
      case 'product_grid':
        return <ProductGridResult data={data} result={result} onAuthRequired={onAuthRequired} />
      case 'store_map':
        return <StoreMapResult data={data} filters={filters} result={result} />
      case 'availability':
        return <AvailabilityResult data={data} result={result} />
      case 'comparison':
        return <ComparisonResult data={data} result={result} onAuthRequired={onAuthRequired} />
      case 'dual':
        return <DualResult data={data} filters={filters} result={result} onAuthRequired={onAuthRequired} />
      case 'brand_similarity':
        return <BrandSimilarityResult result={result} onSearchBrands={onSearchBrands} />
      default:
        return <ErrorResult message="Unknown result type" />
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Query line with enhanced styling */}
      <div className="flex items-start gap-3 mb-8 group">
        <span
          className="font-mono text-text-accent"
          style={{
            fontSize: '14px',
            fontWeight: 500,
            marginTop: '2px',
            opacity: 0.6,
            transition: 'opacity var(--transition-base)'
          }}
        >
          →
        </span>
        <p
          className="font-body text-text-secondary group-hover:text-text-primary"
          style={{
            fontSize: '15px',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
            transition: 'color var(--transition-base)'
          }}
        >
          {query}
        </p>
      </div>

      {/* Result area with subtle entry animation */}
      <div style={{ animationDelay: '100ms' }} className="animate-fade-in">
        {renderResult()}
      </div>

      {/* Enhanced divider with gradient */}
      <div className="mt-16 mb-12 relative">
        <div
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--color-border-subtle) 20%, var(--color-border-subtle) 80%, transparent)',
            position: 'relative'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '-4px',
            transform: 'translateX(-50%)',
            width: '8px',
            height: '8px',
            background: 'var(--color-bg-base)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '50%'
          }}
        />
      </div>
    </div>
  )
}
