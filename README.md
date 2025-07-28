# Invenio - Enterprise Inventory Management System

<div align="center">
  <h1>Invenio</h1>
  
  <p align="center">
    <strong>A comprehensive inventory management solution built with Next.js, MongoDB, and modern web technologies</strong>
  </p>
  
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#api-documentation">API</a> •
    <a href="#contributing">Contributing</a>
  </p>
</div>

---

## Overview

Invenio is a powerful, enterprise-grade inventory management system designed to streamline operations for businesses of all sizes. Built with modern technologies and best practices, it offers real-time inventory tracking, comprehensive analytics, multi-warehouse support, and seamless integration capabilities.

### Key Benefits

- 📊 **Real-time Analytics** - Monitor inventory levels, sales trends, and business metrics in real-time
- 🏢 **Multi-warehouse Support** - Manage inventory across multiple locations effortlessly
- 📈 **Advanced Reporting** - Generate detailed reports for informed decision-making
- 🔄 **Automated Workflows** - Streamline procurement and order management processes
- 🌐 **B2B & B2C Ready** - Support for both business and consumer customers
- 🔒 **Enterprise Security** - Role-based access control and secure authentication

## Features

### Key Features

#### Inventory Management
- **Real-time Stock Tracking** - Monitor inventory levels across multiple warehouses
- **Product Catalog** - Comprehensive product management with categories
- **Stock Alerts** - Low-stock, out-of-stock, and dead stock notifications
- **Warehouse Management** - Multi-warehouse support with transfer capabilities
- **Inventory Status** - Track active, discontinued, and archived products

#### Order Management
- **Sales Orders** - Create, track, and manage customer orders
- **Purchase Orders** - Manage supplier orders and procurement
- **Order Status Tracking** - Monitor order lifecycle from creation to fulfillment
- **Customer Management** - Track customer information and order history
- **Supplier Management** - Maintain supplier details and performance

#### Analytics & Reporting
- **Interactive Dashboards** - Real-time business intelligence with dynamic filtering
- **Sales Analytics** - Revenue trends, order metrics, category performance
- **Inventory Analytics** - Stock levels, turnover rates, warehouse distribution
- **Customer Analytics** - Customer segments, top customers, purchase patterns
- **Procurement Analytics** - Supplier performance, procurement costs
- **Dynamic Reports** - Pre-built reports with customizable filters

#### Additional Features
- **Multi-warehouse Support** - Manage inventory across multiple locations
- **User Management** - Role-based access control
- **Email Notifications** - Automated alerts via Resend integration
- **API Integration** - RESTful API endpoints for all major operations
- **Mobile Responsive** - Fully responsive design for all devices
- **Secure Authentication** - NextAuth.js with Google OAuth support

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **DaisyUI** - Component library
- **Recharts** - Data visualization
- **React Hook Form** - Form management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **NextAuth.js** - Authentication
- **Stripe** - Payment processing
- **Resend** - Email service

### Infrastructure
- **Vercel** - Deployment platform
- **MongoDB Atlas** - Database hosting
- **AWS S3** - File storage (optional)
- **Cloudflare** - CDN and security

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB database (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/invenio.git
   cd invenio
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   
   Copy the environment template:
   ```bash
   cp .env.sample .env
   ```
   
   Configure the following environment variables:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Email Service
   RESEND_API_KEY=your_resend_api_key
   
   # Payment Processing
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Storage (Optional)
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   ```

4. **Database Setup**
   
   For local MongoDB:
   ```bash
   mongod --dbpath /path/to/data
   ```
   
   Or use MongoDB Atlas (recommended for production)

5. **Seed Database (Optional)**
   ```bash
   npm run seed
   # This will populate your database with sample data
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Initial Setup

1. **Create Admin Account** - First user registration becomes admin
2. **Configure Warehouses** - Set up your warehouse locations
3. **Add Products** - Import or manually add your product catalog
4. **Set Up Suppliers** - Add supplier information for procurement
5. **Configure Settings** - Customize system settings to your needs

## Architecture

### Directory Structure

```
invenio/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── (auth)/           # Authentication pages
├── components/            # React components
│   ├── dashboard/        # Dashboard components
│   └── ui/               # UI components
├── lib/                   # Utility functions
│   ├── db/               # Database utilities
│   └── utils/            # Helper functions
├── models/               # MongoDB models
├── public/               # Static assets
├── scripts/              # Utility scripts
└── types/                # TypeScript types
```

### Database Schema

Key collections in MongoDB:

- **products** - Product catalog with inventory tracking
- **salesorders** - Customer orders and fulfillment
- **purchaseorders** - Supplier orders and procurement
- **warehouses** - Warehouse locations and capacity
- **suppliers** - Supplier information and performance
- **users** - User accounts and permissions

## API Documentation

### Authentication

All API endpoints require authentication via NextAuth.js session or API key.

### Core Endpoints

#### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Orders
- `GET /api/orders/sales` - List sales orders
- `GET /api/orders/purchase` - List purchase orders
- `POST /api/orders/sales` - Create sales order
- `POST /api/orders/purchase` - Create purchase order

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/inventory` - Inventory analytics
- `GET /api/analytics/sales` - Sales analytics
- `GET /api/analytics/customers` - Customer analytics

#### Reports
- `GET /api/reports/:category/:reportId` - Generate specific report
- `GET /api/reports/filters` - Get available filter options

## Development

### Running Tests

```bash
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
npm run test:watch  # Run tests in watch mode
```

### Code Quality

```bash
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
npm run typecheck   # Run TypeScript checks
```

### Building for Production

```bash
npm run build       # Build production bundle
npm start          # Start production server
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic CI/CD

### Self-Hosted

1. Build the application
2. Set up reverse proxy (Nginx/Apache)
3. Configure SSL certificates
4. Set up process manager (PM2)
5. Configure monitoring and logging

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Support

- 📧 Email: support@invenio.com
- 📖 Documentation: [docs.invenio.com](https://docs.invenio.com)
- 💬 Discord: [Join our community](https://discord.gg/invenio)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/invenio/issues)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by the Invenio Team</p>
  <p>
    <a href="https://github.com/yourusername/invenio/stargazers">⭐ Star us on GitHub</a>
  </p>
</div>
