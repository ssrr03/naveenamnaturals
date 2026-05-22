# Combo Feature Documentation

## Overview

The Combo feature allows administrators to bundle multiple products together and offer them at a discounted price. This encourages customers to purchase more products and increases average order value.

## Database Schema

### Combos Table (`combos`)

Stores the combo information and pricing details.

| Field | Type | Description |
|-------|------|-------------|
| id | INT (PK) | Unique identifier |
| name | VARCHAR(200) | Combo name |
| slug | VARCHAR(200) | URL-friendly identifier (unique) |
| description | LONGTEXT | Detailed description |
| comboPrice | DECIMAL(10,2) | Final discounted price |
| originalPrice | DECIMAL(10,2) | Original price (sum of products) |
| discount | DECIMAL(5,2) | Discount percentage (0-100) |
| images | JSON | Array of image URLs |
| categoryId | INT (FK) | Reference to category |
| productCount | INT | Number of products in combo |
| tag | VARCHAR(50) | Tag (new, sale, bestseller, trending) |
| isActive | BOOLEAN | Visibility status |
| stock | INT | Combo stock tracking |
| sold | INT | Number of combos sold |
| metaTitle | VARCHAR(255) | SEO title |
| metaDescription | LONGTEXT | SEO description |
| seoKeywords | JSON | SEO keywords array |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

### Combo Items Table (`combo_items`)

Stores the products that are included in each combo.

| Field | Type | Description |
|-------|------|-------------|
| id | INT (PK) | Unique identifier |
| comboId | INT (FK) | Reference to combo |
| productId | INT (FK) | Reference to product |
| variantId | INT (FK) | Reference to specific variant (optional) |
| quantity | INT | Quantity of this product in combo |
| sortOrder | INT | Display order in combo |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

## API Endpoints

### Admin Endpoints (Requires Authentication)

#### Create Combo
- **Method**: POST
- **Path**: `/api/admin/combos`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Summer Care Bundle",
  "slug": "summer-care-bundle",
  "description": "Complete summer skincare routine",
  "comboPrice": 1499,
  "originalPrice": 1999,
  "categoryId": 1,
  "tag": "sale",
  "images": ["combo1.jpg"],
  "items": [
    {
      "productId": 1,
      "variantId": 5,
      "quantity": 1
    },
    {
      "productId": 2,
      "variantId": null,
      "quantity": 2
    }
  ]
}
```

**Response**:
```json
{
  "message": "Combo created successfully",
  "data": {
    "id": 1,
    "name": "Summer Care Bundle",
    "comboPrice": 1499,
    "originalPrice": 1999,
    "discount": 25,
    "items": [...],
    "category": {...}
  }
}
```

#### Get All Combos (Admin)
- **Method**: GET
- **Path**: `/api/admin/combos?limit=10&offset=0&isActive=true&categoryId=1&tag=sale`
- **Query Parameters**:
  - `limit`: Number of records per page (default: 10)
  - `offset`: Number of records to skip (default: 0)
  - `isActive`: Filter by active status (optional)
  - `categoryId`: Filter by category (optional)
  - `tag`: Filter by tag (optional)

#### Get Combo by ID (Admin)
- **Method**: GET
- **Path**: `/api/admin/combos/:id`

#### Update Combo
- **Method**: PUT
- **Path**: `/api/admin/combos/:id`
- **Request Body**: Same as create (all fields optional)

#### Delete Combo
- **Method**: DELETE
- **Path**: `/api/admin/combos/:id`

### Public Endpoints (No Authentication)

#### Get All Combos (Public)
- **Method**: GET
- **Path**: `/api/combos?limit=10&offset=0`
- **Response**: List of active combos with full product details

#### Get Combo by Slug
- **Method**: GET
- **Path**: `/api/combos/slug/:slug`
- **Response**: Single combo with all product details

## Admin Interface

### Combos Management Page

Located at `/combos` in the admin dashboard.

Features:
- View all combos in a table format
- Filter combos by status, category, and tag
- Sort combos by creation date
- Quick view of pricing, discount, and product count
- Toggle combo active/inactive status
- Edit and delete combos

### Create/Edit Combo Form

Located at `/combos/new` (create) and `/combos/:id` (edit).

Features:
- **Basic Information**: Name, slug, description
- **Pricing**: Original price, combo price (auto-calculates discount)
- **Category & Tag**: Assign category and promotional tag
- **Products**: Add/remove/reorder products in the combo
- **Variants**: Optionally select specific variants for products
- **Status**: Toggle active/inactive

## Frontend Components

### CombosDisplay Component

Located at `Website/src/components/combos-display.tsx`

Displays combos on the customer website with:
- Product images with fallback
- Discount percentage badge
- Promotional tag badge
- Product count
- Price comparison (original vs combo price)
- Savings amount
- Add to cart button

Usage:
```tsx
import CombosDisplay from '@/components/combos-display';

export default function Page() {
  return (
    <div>
      <CombosDisplay limit={6} />
    </div>
  );
}
```

## Database Migration

Run these migration files to set up the combo feature:

1. `015_create_combos_table.sql` - Creates combos table
2. `016_create_combo_items_table.sql` - Creates combo_items table

Execute migrations:
```bash
cd adminnode
npm run migrate-all
```

## Key Features

### Automatic Discount Calculation
- Discount percentage is automatically calculated based on:
  - Original Price (sum of individual products)
  - Combo Price (the discounted bundled price)
- Formula: `discount = ((originalPrice - comboPrice) / originalPrice) * 100`

### Product Flexibility
- Combos can include any combination of products
- Specific product variants can be selected
- Quantity can be set for each product (e.g., 2 units of the same product)

### Stock Management
- Combo stock can be tracked separately from individual product stock
- Optionally tied to included product stock

### SEO Friendly
- Slug-based URLs for better SEO
- Meta title, description, and keywords fields
- Proper canonical URLs on frontend

### Visibility Control
- Toggle active/inactive status for quick enable/disable
- Combos marked inactive won't appear on public website
- Admin can still view and edit inactive combos

### Tags & Categories
- Organize combos with categories
- Quick promotional tags (new, sale, bestseller, trending)
- Filter combos by tags in admin panel

## Frontend Workflow

### Displaying Combos

1. **Homepage Integration**:
   ```tsx
   import CombosDisplay from '@/components/combos-display';
   
   export default function HomePage() {
     return (
       <main>
         {/* Other sections */}
         <CombosDisplay limit={6} />
       </main>
     );
   }
   ```

2. **Combo Detail Page**:
   - Create route `/combo/[slug]` to display individual combo
   - Show all included products with quantities
   - Display total original price vs combo price
   - Show what customer saves

3. **Add to Cart**:
   - Click "Add to Cart" on combo
   - Add all combo items to cart with specified quantities
   - Apply combo discount if applicable

## Inventory Considerations

When tracking combo stock:
- Option 1: Manual stock entry for each combo
- Option 2: Automatic calculation based on included products (requires cart/checkout logic)
- Option 3: Hybrid approach (check stock when adding to cart)

Recommended: Automatic calculation for flexibility and accuracy.

## Future Enhancements

- Combo analytics (most popular combos, conversion rate)
- Time-limited combo promotions (start/end dates)
- Combo quantity limits
- Exclusion rules (can't use with certain coupons)
- Tiered combos (buy 2 get 10% off, buy 3 get 15% off)
- Customer recommendations based on purchase history

## Troubleshooting

### Combo not appearing on website
1. Check `isActive` status is `true`
2. Verify combo has products assigned
3. Check category is active and visible
4. Clear browser cache and refresh

### Discount not calculated correctly
1. Ensure `originalPrice` > `comboPrice`
2. Check decimal precision (max 2 decimal places)
3. Verify discount field is populated (should be auto-calculated)

### Can't save combo
1. Check required fields: name, slug, comboPrice, originalPrice
2. Verify slug is unique
3. Check at least one product is added
4. Verify authentication token is valid

## Code References

- **Models**: `adminnode/src/models/combo.model.js`, `adminnode/src/models/comboItem.model.js`
- **Controller**: `adminnode/src/controllers/combo.controller.js`
- **Routes**: `adminnode/src/routes/combo.routes.js`
- **Admin UI**: `panel/app/combos/`, `panel/components/combo-form.tsx`, `panel/components/combos-table.tsx`
- **Website Component**: `Website/src/components/combos-display.tsx`
- **Database**: `adminnode/migrations/015_*.sql`, `adminnode/migrations/016_*.sql`
