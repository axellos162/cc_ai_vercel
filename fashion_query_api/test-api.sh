#!/bin/bash

echo "======================================"
echo "API INTEGRATION TESTS"
echo "======================================"
echo ""

# Test 1: Product Search
echo "Test 1: Product Search"
echo "Query: find me jeans"
curl -s -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "find me jeans"}' | jq -c '{ok, intent, type: .results.type, product_count: (.results.data.products // [] | length)}'
echo ""
echo ""

# Test 2: Product Search with Price Filter
echo "Test 2: Product Search with Price Filter"
echo "Query: find me jeans under \$200"
curl -s -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "find me jeans under $200"}' | jq -c '{ok, intent, type: .results.type, product_count: (.results.data.products // [] | length), max_price: [.results.data.products[]?.effective_price] | max}'
echo ""
echo ""

# Test 3: Product Search with Client Sort Override
echo "Test 3: Product Search with Client Sort Override"
echo "Query: find me jeans (sort: discount)"
curl -s -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "find me jeans", "sort": "discount"}' | jq -c '{ok, intent, sort, type: .results.type}'
echo ""
echo ""

# Test 4: Store Finder
echo "Test 4: Store Finder"
echo "Query: which stores in austin carry agolde"
curl -s -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "which stores in austin carry agolde"}' | jq -c '{ok, intent, type: .results.type, store_count: (.results.data.stores // [] | length)}'
echo ""
echo ""

# Test 5: Availability Check
echo "Test 5: Availability Check"
echo "Query: does any store in san francisco carry toteme"
curl -s -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "does any store in san francisco carry toteme"}' | jq -c '{ok, intent, type: .results.type, available: .results.data.available}'
echo ""
echo ""

# Test 6: Price Comparison
echo "Test 6: Price Comparison"
echo "Query: which is cheaper, toteme or agolde"
curl -s -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "which is cheaper, toteme or agolde"}' | jq -c '{ok, intent, type: .results.type, brand_a: .results.data.brand_a.name, brand_b: .results.data.brand_b.name}'
echo ""
echo ""

# Test 7: Ambiguous Query
echo "Test 7: Ambiguous Query"
echo "Query: good denim in los angeles"
curl -s -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "good denim in los angeles"}' | jq -c '{ok, intent, type: .results.type, has_products: (.results.data.product_grid.products != null), has_stores: (.results.data.store_map.stores != null)}'
echo ""
echo ""

# Test 8: Invalid Request
echo "Test 8: Invalid Request (missing query)"
curl -s -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{}' | jq -c '{ok, error}'
echo ""
echo ""

# Test 9: Invalid Sort
echo "Test 9: Invalid Sort"
curl -s -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "jeans", "sort": "random"}' | jq -c '{ok, error}'
echo ""
echo ""

echo "======================================"
echo "ALL TESTS COMPLETE"
echo "======================================"
