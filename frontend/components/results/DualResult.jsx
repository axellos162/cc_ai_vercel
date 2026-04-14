import ResultMeta from '../ResultMeta'
import StoreMapResult from './StoreMapResult'
import ProductGridResult from './ProductGridResult'

export default function DualResult({ data, filters, result }) {
  const storeData = data?.store_map || {}
  const productData = data?.product_grid || {}

  return (
    <div>
      {result && <ResultMeta result={result} />}

      {/* Explanation label */}
      <p 
        className="font-body text-text-tertiary mb-8"
        style={{ fontSize: '12px' }}
      >
        We found both stores and products matching your search.
      </p>

      {/* Store map section */}
      <div>
        <div 
          className="font-body text-text-tertiary uppercase mb-3"
          style={{
            fontSize: '10px',
            letterSpacing: '0.15em'
          }}
        >
          STORES
        </div>
        
        {/* StoreMapResult with custom height */}
        <div style={{ '--map-height': '360px' }}>
          <StoreMapResult 
            data={storeData} 
            result={result} 
            filters={filters}
          />
        </div>
      </div>

      {/* Divider */}
      <hr 
        className="border-none border-t border-border-subtle"
        style={{ margin: '40px 0' }}
      />

      {/* Product grid section */}
      <div>
        <div 
          className="font-body text-text-tertiary uppercase mb-3"
          style={{
            fontSize: '10px',
            letterSpacing: '0.15em'
          }}
        >
          PRODUCTS
        </div>
        
        <ProductGridResult 
          data={productData} 
          result={result}
        />
      </div>
    </div>
  )
}
