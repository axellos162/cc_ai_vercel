# Database Schema Documentation

This document describes the database schema used in the CC AI project, which appears to be an e-commerce product scraping and analysis system with AI-powered embeddings.

## Overview

The database uses **PostgreSQL** with the **pgvector** extension for vector similarity search capabilities. The schema is designed to store scraped product data from various e-commerce stores, organize products by brands, and generate AI embeddings for intelligent product matching and recommendations.

## Extensions

- **pgvector**: Enables vector data types and similarity search operations for AI embeddings

## Tables

### 1. stores
Stores information about e-commerce websites being scraped.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique store identifier |
| name | text | NOT NULL | Store name |
| city | text | | Store location city |
| state | text | | Store location state |
| lat | numeric | | Store latitude coordinate |
| lng | numeric | | Store longitude coordinate |
| domain | text | UNIQUE, NOT NULL | Store's unique domain name |
| website | text | | Store's website URL |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |

### 2. brands
Stores brand information and metadata for product categorization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique brand identifier |
| name | text | UNIQUE, NOT NULL | Brand name |
| style_tags | text[] | DEFAULT '{}' | Array of style-related tags |
| price_segment | text | | Brand's price category (e.g., luxury, mid-range) |
| style_description | text | | Textual description of brand's style |
| top_categories | text[] | | Array of main product categories |
| metadata_updated_at | timestamptz | | Last metadata update timestamp |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |

### 3. products
Core table storing scraped product information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique product identifier |
| shopify_product_id | bigint | NOT NULL | Original Shopify product ID |
| store_id | uuid | REFERENCES stores(id) ON DELETE CASCADE | Foreign key to stores table |
| brand_id | uuid | REFERENCES brands(id) | Foreign key to brands table |
| title | text | NOT NULL | Product title |
| description | text | | Product description |
| category | text | | Product category |
| price | numeric | | Original product price |
| discounted_price | numeric | | Discounted/sale price if applicable |
| images | text[] | DEFAULT '{}' | Array of product image URLs |
| shopify_updated_at | timestamptz | | Last update timestamp from Shopify |
| last_scraped_at | timestamptz | DEFAULT now() | Last scraping timestamp |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |

**Unique Constraint**: `UNIQUE(shopify_product_id, store_id)` - Prevents duplicate products per store

### 4. variants
Stores product variants (size, color combinations) and inventory data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique variant identifier |
| product_id | uuid | REFERENCES products(id) ON DELETE CASCADE | Foreign key to products table |
| shopify_variant_id | bigint | NOT NULL, UNIQUE | Original Shopify variant ID |
| size | text | | Product size |
| color | text | | Product color |
| inventory_count | integer | DEFAULT 0 | Available inventory count |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |

### 5. product_embeddings
Stores AI-generated embeddings for individual products to enable similarity search.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique embedding identifier |
| product_id | uuid | REFERENCES products(id) ON DELETE CASCADE, UNIQUE | Foreign key to products table |
| embedding | vector(1536) | | 1536-dimensional vector embedding |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |

### 6. brand_embeddings
Stores AI-generated embeddings for brands based on their product portfolio.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique embedding identifier |
| brand_id | uuid | REFERENCES brands(id) ON DELETE CASCADE, UNIQUE | Foreign key to brands table |
| embedding | vector(1536) | | 1536-dimensional vector embedding |
| product_count | int | NOT NULL | Number of products used to generate embedding |
| created_at | timestamptz | DEFAULT now() | Record creation timestamp |
| updated_at | timestamptz | DEFAULT now() | Last update timestamp |

## Relationships

```
stores (1) ──── (many) products
brands (1) ──── (many) products
products (1) ──── (many) variants
products (1) ──── (1) product_embeddings
brands (1) ──── (1) brand_embeddings
```

## Indexes

The schema includes several indexes for optimal query performance:

### Standard B-tree Indexes
- `idx_products_store_id`: Fast lookups of products by store
- `idx_products_brand_id`: Fast lookups of products by brand
- `idx_products_shopify_updated_at`: Efficient sorting/filtering by update time
- `idx_variants_product_id`: Fast lookups of variants by product

### Vector Indexes (IVFFlat)
- `idx_product_embeddings_embedding`: Enables fast cosine similarity search on product embeddings
- `idx_brand_embeddings_embedding`: Enables fast cosine similarity search on brand embeddings

Both vector indexes use the `ivfflat` method with 100 lists and `vector_cosine_ops` for cosine similarity operations.

## Key Features

1. **Multi-store Support**: Can scrape and store products from multiple e-commerce stores
2. **Brand Intelligence**: Maintains rich brand metadata including style tags and price segments
3. **Variant Tracking**: Handles product variants (size/color) with inventory counts
4. **AI-Powered Similarity**: Uses 1536-dimensional embeddings (likely OpenAI) for product and brand similarity
5. **Shopify Integration**: Designed specifically for scraping Shopify-based stores
6. **Temporal Tracking**: Tracks creation, update, and scraping timestamps
7. **Cascade Deletes**: Maintains referential integrity with proper cascade relationships

## Usage Patterns

This schema supports several key use cases:
- Product catalog aggregation across multiple stores
- Brand-based product discovery and analysis
- Inventory tracking and monitoring
- AI-powered product recommendations via embedding similarity
- Temporal analysis of product updates and pricing changes
