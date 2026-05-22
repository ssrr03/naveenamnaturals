"# Naveenam Naturals E-Commerce Platform

## Overview

A complete e-commerce platform for selling natural/organic products. The platform consists of three main components:
- **Backend API**: Express.js server with product management, orders, shipping, and combos
- **Admin Dashboard**: Next.js admin interface for managing products, orders, and combos
- **Customer Website**: Next.js frontend for customers to browse and purchase products

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MySQL 8+
- Git

### Installation

1. **Clone Repository**
```bash
git clone <repo-url>
cd naveenamnaturals
```

2. **Setup Backend**
```bash
cd adminnode
npm install
cp .env.example .env
npm start
```

3. **Setup Admin Dashboard**
```bash
cd ../panel
npm install
cp .env.example .env
npm run dev
```

4. **Setup Website**
```bash
cd ../Website
npm install
cp .env.example .env
npm run dev
```

## 📋 Features

### Products & Inventory
- Product management with variants (sizes, prices)
- Category organization with hierarchy
- Stock tracking
- Product images and SEO metadata
- Product reviews and ratings

### Combos (NEW!)
- Bundle multiple products together
- Automatic discount calculation
- Combo pricing and stock tracking
- Admin interface for combo management
- Public API for combo display
- Website component for showing combos

### Orders & Shipping
- Order management with status tracking
- Shipping integration (TPC Globe API)
- Order status updates
- Customer order history
- Shipment tracking

### Admin Features
- Dashboard with analytics
- Product management
- Order management
- Customer management
- Coupon management
- Combo management
- Shipping configuration
- Homepage slider management
- Email notifications

### Customer Features
- Browse products
- Search and filter
- Shopping cart
- Checkout process
- Order tracking
- Customer reviews
- Account management

## 📁 Project Structure

```
naveenamnaturals/
├── adminnode/                 # Backend API (Express.js)
│   ├── src/
│   │   ├── models/           # Database models (Sequelize)
│   │   ├── controllers/      # Business logic
│   │   ├── routes/           # API routes
│   │   ├── services/         # External services (TPC, Email)
│   │   ├── middlewares/      # Auth, validation
│   │   └── config/           # Database, JWT config
│   ├── migrations/           # Database migrations
│   └── server.js            # Express app
├── panel/                     # Admin Dashboard (Next.js)
│   ├── app/                  # Next.js pages and routes
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utilities
├── Website/                   # Customer Website (Next.js)
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities
└── docs/                      # Documentation

```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=naveenamnaturals_db
DB_USER=root
DB_PASSWORD=

JWT_SECRET=your_jwt_secret_key
PORT=5005

# TPC Globe Shipping
TPC_API_KEY=your_api_key
TPC_API_URL=https://api-sandbox.tpcglobe.com/v1

# Email (SendGrid/SMTP)
SENDGRID_API_KEY=your_key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email
SMTP_PASSWORD=your_password
```

**Admin Dashboard (.env.local)**:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5005/api
```

**Website (.env.local)**:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5005/api
```

## 🎨 Recent Features

### Combo Feature (Latest)
Bundle multiple products and offer at discounted prices.

**Key Features**:
- Create/edit/delete product combos
- Automatic discount calculation
- Admin interface for combo management
- Public API endpoints
- Website component for displaying combos
- Category and tag organization
- SEO optimization

**Quick Setup**:
```bash
# Apply database migrations
cd adminnode
npm run migrate-all

# Restart services
npm start
```

**Usage**:
- Access admin panel at `/combos`
- Display on website with `<CombosDisplay />`
- API: `GET /api/combos`

See [COMBO_FEATURE_GUIDE.md](./COMBO_FEATURE_GUIDE.md) for complete documentation.

## 📚 API Documentation

### Base URL
```
http://localhost:5005/api
```

### Key Endpoints

#### Products
- `GET /products` - List products
- `GET /products/:id` - Get product details
- `POST /admin/products` - Create product (admin)
- `PUT /admin/products/:id` - Update product (admin)
- `DELETE /admin/products/:id` - Delete product (admin)

#### Combos
- `GET /combos` - List public combos
- `GET /combos/slug/:slug` - Get combo by slug
- `POST /admin/combos` - Create combo (admin)
- `GET /admin/combos` - List combos (admin)
- `PUT /admin/combos/:id` - Update combo (admin)
- `DELETE /admin/combos/:id` - Delete combo (admin)

#### Orders
- `GET /orders` - List orders (admin)
- `GET /orders/:id` - Get order details
- `POST /orders` - Create order
- `PATCH /orders/:id/status` - Update order status

#### Shipping
- `POST /shipping/check-pincode` - Check serviceability
- `POST /shipping/create-shipment` - Create shipment
- `GET /shipping/track/:awb` - Track shipment

See full API documentation in [API_DOCS.md](./API_DOCS.md)

## 🏗️ Database

### Key Tables
- `products` - Product information
- `product_variants` - Product sizes/options
- `categories` - Product categories
- `combos` - Bundled products
- `combo_items` - Items in combos
- `orders` - Customer orders
- `order_items` - Items in orders
- `customers` - Customer accounts
- `coupons` - Discount coupons
- `reviews` - Product reviews

### Migrations
All database migrations are in `adminnode/migrations/` and run automatically on startup.

## 🔐 Authentication

### Admin Authentication
- JWT-based authentication
- Admin-only endpoints protected
- Role-based access control

### Customer Authentication
- Customer signup/login
- JWT tokens
- Order history tracking

## 📦 Dependencies

### Backend
- Express.js 5.1.0
- Sequelize 6.35.2
- MySQL2 3.6.5
- JWT
- Multer (file uploads)
- SendGrid (emails)

### Admin Dashboard
- Next.js 15.5.15
- React 19.1.0
- TypeScript
- Tailwind CSS
- Radix UI
- Tabler Icons

### Website
- Next.js 15.5.9
- React 19.1.0
- TypeScript
- Tailwind CSS
- Swiper (sliders)

## 🚀 Deployment

### Backend Deployment
```bash
cd adminnode
npm install --production
npm start
```

### Frontend Deployment
```bash
# Admin Dashboard
cd panel
npm run build
npm start

# Customer Website
cd Website
npm run build
npm start
```

### Environment Setup
1. Set all required environment variables
2. Configure MySQL database
3. Configure external services (SendGrid, TPC)
4. Run migrations
5. Start services

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Code Style
- ESLint for JavaScript/TypeScript
- Prettier for formatting

### Database Debugging
```bash
# MySQL console
mysql -u root -p naveenamnaturals_db

# View migrations status
SELECT * FROM SequelizeMeta;
```

## 🐛 Troubleshooting

### Backend Won't Start
1. Check MySQL is running
2. Verify database exists
3. Check .env variables
4. Check port 5005 is available

### Admin Dashboard Issues
1. Clear `.next` folder: `rm -rf .next`
2. Restart dev server
3. Check API_BASE_URL in .env

### Website Not Loading
1. Check API connection
2. Clear browser cache
3. Check Next.js build

## 📞 Support

For issues or questions:
1. Check existing documentation
2. Review API documentation
3. Check browser console for errors
4. Check server logs

## 📝 Documentation Files

- [COMBO_FEATURE_GUIDE.md](./COMBO_FEATURE_GUIDE.md) - Complete combo feature documentation
- [COMBO_SETUP_GUIDE.md](./COMBO_SETUP_GUIDE.md) - Combo feature setup and testing
- [API_DOCS.md](./API_DOCS.md) - Complete API reference
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database schema documentation

## 🎯 Roadmap

- [ ] Add time-limited combo promotions
- [ ] Implement combo analytics
- [ ] Advanced inventory management
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Payment gateway integration (Stripe/Razorpay)
- [ ] Customer loyalty program

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Naveenam Naturals Development Team
" 
