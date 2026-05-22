# Combo Feature Setup & Deployment Guide

## Prerequisites

- Node.js 16+ installed
- All three services running (backend, admin dashboard, website)
- MySQL database connected
- Git configured

## Installation Steps

### 1. Apply Database Migrations

Run the migration scripts to create the necessary tables:

```bash
cd adminnode

# Run all migrations (including combo migrations)
npm run migrate-all
```

This will:
- Create `combos` table with proper indexing
- Create `combo_items` junction table
- Set up foreign key relationships
- Create necessary indexes for performance

### 2. Restart Backend Service

The backend will automatically pick up the new models from `src/models/index.js`:

```bash
# If using nodemon (auto-restart)
# Just save any file to trigger reload
# Or manually restart the backend

npm start  # In adminnode directory
```

Verify in console logs:
```
✅ Combo routes registered at /api/combos
```

### 3. Verify Admin Dashboard Routes

The admin dashboard should automatically include the new Combos menu item in the sidebar.

Check:
- Sidebar now shows "Combos" menu item with box icon
- Routes work:
  - `/combos` - List page
  - `/combos/new` - Create page
  - `/combos/:id` - Edit page

## Testing the Feature

### Backend API Testing

Use Postman or curl to test the API:

#### 1. Create a Combo
```bash
curl -X POST http://localhost:5005/api/admin/combos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_admin_token>" \
  -d '{
    "name": "Test Combo",
    "slug": "test-combo",
    "description": "A test combo",
    "comboPrice": 499,
    "originalPrice": 699,
    "categoryId": 1,
    "tag": "new",
    "items": [
      {
        "productId": 1,
        "quantity": 1
      },
      {
        "productId": 2,
        "quantity": 2
      }
    ]
  }'
```

#### 2. Get All Combos (Admin)
```bash
curl http://localhost:5005/api/admin/combos \
  -H "Authorization: Bearer <your_admin_token>"
```

#### 3. Get Public Combos
```bash
curl http://localhost:5005/api/combos
```

#### 4. Get Combo by Slug
```bash
curl http://localhost:5005/api/combos/slug/test-combo
```

### Admin Dashboard Testing

1. **Navigate to Combos**: 
   - Open admin dashboard at http://localhost:3000
   - Click "Combos" in sidebar

2. **Create a Combo**:
   - Click "New Combo" button
   - Fill in form:
     - Name: "Premium Skincare Bundle"
     - Add at least 2 products
     - Set prices (e.g., 1999 original, 1499 combo)
     - Click "Create Combo"

3. **View Combo List**:
   - Should see created combo in list
   - Verify product count, pricing, discount %

4. **Edit Combo**:
   - Click edit icon on any combo
   - Modify details and save

5. **Toggle Status**:
   - Click eye icon to toggle active/inactive
   - Verify it reflects in list

6. **Delete Combo**:
   - Click delete icon
   - Confirm deletion

### Website Testing

1. **Display Combos Component**:
   - Add to homepage or product page:
   ```tsx
   import CombosDisplay from '@/components/combos-display';
   
   export default function Page() {
     return <CombosDisplay limit={6} />;
   }
   ```

2. **Verify Public API**:
   - Check browser Network tab
   - Should call `/api/combos`
   - Only active combos should be returned

3. **Combo Card Display**:
   - Verify combo images load
   - Check discount badge shows correct percentage
   - Verify "Add to Cart" button (may need cart integration)

## Performance Considerations

### Database Indexes
The migrations create indexes on:
- `slug` (unique) - for slug lookups
- `categoryId` - for category filtering
- `isActive` - for public combo queries
- `tag` - for tag filtering

### Query Optimization
Combo queries include related data:
- Products and variants for each combo item
- Category information
- All necessary relationships in single query

## Troubleshooting

### Issue: "Combo routes not registered"

**Solution**:
1. Verify route file exists: `adminnode/src/routes/combo.routes.js`
2. Check server.js registration: `app.use("/api", comboRoutes);`
3. Restart backend service

### Issue: "Creating combo returns 400 error"

**Check**:
1. Name, slug, comboPrice, originalPrice are all required
2. Slug must be unique
3. At least one product must be added in items
4. Authentication token is valid
5. User has admin role

Example valid payload:
```json
{
  "name": "Bundle Deal",
  "slug": "bundle-deal-unique",
  "comboPrice": 999,
  "originalPrice": 1299,
  "items": [
    {
      "productId": 1,
      "quantity": 1
    }
  ]
}
```

### Issue: Combos not showing on website

**Check**:
1. Combo is marked as `isActive: true`
2. Run fresh API call: `http://localhost:5005/api/combos`
3. Component is imported correctly
4. Network tab shows successful API response

### Issue: Discount not calculating

**Solution**:
- Discount is auto-calculated when:
  - `originalPrice > comboPrice`
  - Both prices have valid decimal values
- Manual calculation: `(originalPrice - comboPrice) / originalPrice * 100`

## Database Schema Verification

Check if tables were created correctly:

```sql
-- In MySQL console
USE naveenamnaturals_db;

-- Check combos table
DESCRIBE combos;

-- Check combo_items table
DESCRIBE combo_items;

-- Verify relationships
SELECT * FROM combos LIMIT 1;
SELECT * FROM combo_items LIMIT 1;
```

## Integration with Shopping Cart (Future)

When implementing cart functionality:

1. **Add Combo to Cart**:
   ```javascript
   // Add all items in the combo
   const addComboToCart = async (comboId) => {
     const combo = await fetch(`/api/combos/${comboId}`).then(r => r.json());
     combo.items.forEach(item => {
       addToCart({
         productId: item.productId,
         variantId: item.variantId,
         quantity: item.quantity,
         source: 'combo',
         comboId: comboId
       });
     });
   };
   ```

2. **Apply Combo Discount**:
   - Track combo-related items in cart
   - Apply combo discount instead of individual pricing
   - Calculate savings automatically

3. **Stock Validation**:
   - Check if all products in combo are in stock
   - Show out-of-stock message if any item unavailable

## Deployment Checklist

- [ ] All migrations applied to production database
- [ ] Backend service restarted
- [ ] Admin dashboard showing Combos menu
- [ ] At least one test combo created
- [ ] Public API endpoint responding with combos
- [ ] Website component displays combos
- [ ] Edit functionality working
- [ ] Delete functionality working
- [ ] Inactive combos not visible on public site
- [ ] Active/inactive toggle working

## Monitoring

### Useful SQL Queries for Monitoring

```sql
-- Count total combos
SELECT COUNT(*) as total_combos, COUNT(CASE WHEN isActive THEN 1 END) as active FROM combos;

-- Top selling combos
SELECT c.name, COUNT(*) as sales FROM combos c 
JOIN combo_items ci ON c.id = ci.comboId 
GROUP BY c.id ORDER BY sales DESC LIMIT 10;

-- Combos by category
SELECT cat.name, COUNT(c.id) as combo_count 
FROM categories cat 
LEFT JOIN combos c ON cat.id = c.categoryId 
GROUP BY cat.id;

-- Products in most combos
SELECT p.name, COUNT(ci.id) as times_included 
FROM products p 
JOIN combo_items ci ON p.id = ci.productId 
GROUP BY p.id ORDER BY times_included DESC LIMIT 10;
```

## Next Steps

1. Test all CRUD operations thoroughly
2. Integrate combo cart functionality
3. Add combo display on homepage
4. Set up combo analytics
5. Create promotional combo campaigns
6. Implement time-limited combos (future)

---

For detailed API documentation, see [COMBO_FEATURE_GUIDE.md](./COMBO_FEATURE_GUIDE.md)
