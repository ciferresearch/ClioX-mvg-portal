# ClioX Schema.org Implementation Guide

## Overview

This directory contains the complete Schema.org structured data implementation for the ClioX project, designed to enhance search engine understanding and display of website content.

## Component Structure

```
src/components/@shared/Page/Seo/
├── index.tsx              # Main SEO component
├── SchemaManager.tsx      # Schema manager
├── Schemas/               # Various Schema components
│   ├── index.ts          # Export file
│   ├── OrganizationSchema.tsx    # Organization information
│   ├── WebSiteSchema.tsx        # Website information
│   ├── ArticleSchema.tsx        # Article information
│   ├── BreadcrumbSchema.tsx    # Breadcrumb navigation
│   └── DatasetSchema.tsx       # Dataset information (existing)
└── README.md             # This file
```

## Usage

### 1. Automatic Usage (Recommended)

In the main SEO component, SchemaManager automatically generates appropriate schemas based on page type:

```typescript
// In src/components/@shared/Page/Seo/index.tsx
<SchemaManager
  type={pageType} // Automatically detects page type
  title={title}
  description={pageDescription}
  url={canonical}
  // ... other properties
/>
```

### 2. Manual Usage of Specific Schemas

```typescript
import { ArticleSchema, BreadcrumbSchema } from '@shared/Page/Seo/Schemas'

// Article page
const articleSchema = ArticleSchema({
  title: 'Web1.0 to Web3.0',
  description: 'Article description...',
  author: 'ClioX Team',
  publishDate: '2025-06-05',
  url: 'https://cliox.org/articles/web-evolution'
})

// Breadcrumb navigation
const breadcrumbSchema = BreadcrumbSchema({
  items: [
    { name: 'Home', url: 'https://cliox.org' },
    { name: 'Articles', url: 'https://cliox.org/articles' },
    { name: 'Web Evolution', url: 'https://cliox.org/articles/web-evolution' }
  ]
})
```

## Schema Type Descriptions

### OrganizationSchema (Organization Information)

- **Purpose**: Describes basic information about the ClioX organization
- **Contains**: Name, description, contact information, areas of expertise, etc.
- **Application**: Included on all pages

### WebSiteSchema (Website Information)

- **Purpose**: Describes overall website information and functionality
- **Contains**: Website name, description, search functionality, etc.
- **Application**: Used on homepage

### ArticleSchema (Article Information)

- **Purpose**: Describes detailed information about article pages
- **Contains**: Title, author, publication date, content description, etc.
- **Application**: Used on article pages

### BreadcrumbSchema (Breadcrumb Navigation)

- **Purpose**: Describes page navigation hierarchy structure
- **Contains**: Navigation paths, page relationships, etc.
- **Application**: Used on pages with hierarchical structure

### DatasetSchema (Dataset Information)

- **Purpose**: Describes data asset information
- **Contains**: Dataset name, description, license, pricing, etc.
- **Application**: Used on asset pages

## Automatic Page Type Detection

SchemaManager automatically detects page types and applies appropriate schemas:

- **Homepage** (`/`) → `home` → WebSiteSchema + OrganizationSchema
- **Article pages** (`/articles/*`) → `article` → ArticleSchema + OrganizationSchema
- **Resource pages** (`/resources`) → `resource` → OrganizationSchema
- **Asset pages** (`/asset/*`) → `asset` → DatasetSchema + OrganizationSchema
- **Other pages** → `page` → OrganizationSchema

## Testing and Validation

### 1. Google Rich Results Test

Visit [Google Rich Results Test](https://search.google.com/test/rich-results) to test if schemas are working correctly.

### 2. Schema.org Validator

Visit [Schema.org Validator](https://validator.schema.org/) to validate schema syntax.

### 3. Browser Developer Tools

View generated JSON-LD script tags in page source code.

## Customization and Extension

### Adding New Schema Types

1. Create new schema components in the `Schemas/` directory
2. Add corresponding logic in `SchemaManager.tsx`
3. Export new components in `Schemas/index.ts`

### Modifying Existing Schemas

Directly edit the corresponding schema component files, and SchemaManager will automatically use the updated content.

## Important Notes

1. **Data Accuracy**: Ensure schema data is consistent with page content
2. **Privacy Protection**: Do not expose sensitive information in schemas
3. **Performance Considerations**: Schema data increases page size slightly, but impact is minimal
4. **SEO Effects**: Schemas don't directly improve rankings but enhance search result displays

## Frequently Asked Questions

### Q: Do schemas affect page loading speed?

A: Minimal impact, JSON-LD data is typically only a few KB.

### Q: How do I know if schemas are working?

A: Use Google Rich Results Test tool, or check for rich media results in Google search.

### Q: Can I use multiple schemas simultaneously?

A: Yes, SchemaManager automatically combines multiple schemas.

### Q: Do schemas need regular updates?

A: When page content changes, related schemas should also be updated.
