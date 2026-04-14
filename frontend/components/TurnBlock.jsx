import ProductGridResult from './results/ProductGridResult'
import StoreMapResult from './results/StoreMapResult'
import AvailabilityResult from './results/AvailabilityResult'
import ComparisonResult from './results/ComparisonResult'
import DualResult from './results/DualResult'
import BrandSimilarityResult from './results/BrandSimilarityResult'
import ErrorResult from './results/ErrorResult'

export default function TurnBlock({ turn, onSearchBrands }) {
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
        return <ProductGridResult data={data} result={result} />
      case 'store_map':
        return <StoreMapResult data={data} filters={filters} result={result} />
      case 'availability':
        return <AvailabilityResult data={data} result={result} />
      case 'comparison':
        return <ComparisonResult data={data} result={result} />
      case 'dual':
        return <DualResult data={data} filters={filters} result={result} />
      case 'brand_similarity':
        return <BrandSimilarityResult result={result} onSearchBrands={onSearchBrands} />
      default:
        return <ErrorResult message="Unknown result type" />
    }
  }

  return (
    <div>
      {/* Query line with arrow prefix */}
      <div className="flex items-start gap-2 mb-6">
        <span className="text-text-tertiary text-sm">→</span>
        <p className="font-body text-sm text-text-secondary">{query}</p>
      </div>

      {/* Result area */}
      <div>
        {renderResult()}
      </div>

      {/* Divider */}
      <hr 
        className="border-none border-t border-border-subtle mt-12"
      />
    </div>
  )
}
