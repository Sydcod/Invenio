# Invenio Inventory Management System - Detailed Development Plan

## 1. Introduction & Goal

This document provides a detailed, actionable development plan for the Invenio Inventory Management System. It is based on a thorough review of the existing codebase and the comprehensive research documents provided. The primary goal is to refactor the current application into a secure, scalable, multi-tenant SaaS platform.

---

## 2. Current State Analysis

-   **Authentication**: Implemented using NextAuth.js with Google and Email (Resend) providers. The setup is configured in `app/api/auth/[...nextauth]/route.ts` with options defined in `libs/next-auth.ts`. It uses a MongoDB adapter, meaning user records are already being created/managed in the database.
-   **User Model (`User.ts`)**: The current schema is designed for a single-tenant application and is tightly coupled with Stripe for individual user subscriptions. It includes fields for `customerId`, `priceId`, and `hasAccess`. It **lacks** the necessary structure for multi-tenancy (e.g., `organizationId`, roles).
-   **Frontend**: A polished landing page exists and a basic dashboard structure has been established at `app/dashboard/`. The dashboard layout already handles authentication checks using `getServerSession`, but is not multi-tenant aware.
-   **API Routes**: There are existing API routes for authentication, Stripe integration, and lead management, but no inventory management endpoints exist yet.
-   **Database Models**: Only `User.ts` and `Lead.ts` models exist. No inventory-related models have been created.

---

## 3. Phase 1: Core Architecture Refactoring for Multi-Tenancy

**Objective**: To fundamentally restructure the backend and authentication flow to support a multi-tenant architecture, making it the top priority before any feature development.

#### **Step 1.1: Establish Core Multi-Tenancy Models**

1.  **Create `Organization.ts` Model**: Create a new file `models/Organization.ts`. This model will be the central tenant record, holding information about the company, its subscription plan, and settings, as defined in the schema design document.
2.  **Refactor `User.ts` Model**: Overhaul the existing `models/User.ts` to align with the multi-tenant schema:
    -   **Add** `organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true }`.
    -   **Add** `role: { type: String, enum: ['owner', 'admin', 'manager', 'staff'], default: 'owner' }`.
    -   **Remove** the Stripe-related fields (`priceId`, `customerId`, `hasAccess`). Billing will be managed at the `Organization` level.
    -   **Add** a compound index to ensure email uniqueness *per organization*: `userSchema.index({ email: 1, organizationId: 1 }, { unique: true });`.

#### **Step 1.2: Adapt Authentication Flow for Organization Management**

1.  **Update NextAuth.js Callbacks (`libs/next-auth.ts`)**: The current auth flow creates users but doesn't handle organizations. This needs to be extended:
    -   **Add a `signIn` callback**: The current implementation doesn't have a signIn callback. Add this to intercept the first time a user signs in. When a new user is created by the adapter, create a corresponding `Organization` for them. Set their role to 'owner' and save the new `organizationId` to their user record.
    -   **Enhance the existing `session` callback**: The current session callback only adds the user ID (token.sub) to the session. Extend it to inject the user's `organizationId` and `role` into the session object.
    -   **Add a `jwt` callback**: This needs to be added to store organization data in the JWT token, ensuring it's available to the session callback.

#### **Step 1.3: Create Remaining Data Models**

1.  **Create Core Inventory Models**: Based on the schema document, create the following Mongoose models. Each schema **must** include the `organizationId` field to enforce tenant data isolation.
    -   `Product.ts`
    -   `Category.ts`
    -   `Supplier.ts`
    -   `Warehouse.ts`
    -   `PurchaseOrder.ts`
    -   `SalesOrder.ts`

---

## 4. Phase 2: Build Secure API & Frontend Foundation

**Objective**: To build the tenant-aware API endpoints and enhance the existing dashboard structure for multi-tenancy.

#### **Step 2.1: Implement Tenant-Aware API Endpoints**

1.  **Create API Routes**: For each new model, establish the API route structure (e.g., `app/api/products/route.ts` and `app/api/products/[productId]/route.ts`), following the pattern of existing API routes in `app/api/`.
2.  **Enforce Tenant Isolation**: In every API handler (`GET`, `POST`, `PUT`, `DELETE`), implement a security-first approach:
    -   Retrieve the user's session and extract the `organizationId`.
    -   If no `organizationId` is present, return a `401 Unauthorized` error.
    -   **Crucially**, inject `{ organizationId: session.user.organizationId }` into every Mongoose query to guarantee that all database operations are strictly scoped to the authenticated user's organization.

#### **Step 2.2: Enhance Existing Dashboard Structure**

1.  **Reorganize Routes**: Move the existing `app/dashboard` structure to use a route group pattern (`app/(app)/dashboard`) for better organization.
2.  **Extend Authentication Middleware**: The existing dashboard layout already handles basic authentication. Enhance it to verify not just that a user is logged in, but that they also have a valid `organizationId`.
3.  **Build Comprehensive Dashboard Shell**: Expand the current minimal dashboard UI to include:
    -   A sidebar navigation component with links to all inventory management sections
    -   A header showing the organization name and user information
    -   A settings dropdown for organization and user preferences

---

## 5. Phase 3: Develop Core Inventory Management Features

**Objective**: To build the primary inventory management modules on top of the secure, multi-tenant foundation.

#### **Step 3.1: Products Management Module**

1.  **Products List Page**: Create `app/(app)/products/page.tsx` with:
    - A data table component built with `shadcn/ui` for displaying products with sorting and filtering
    - Integration with the `/api/products` endpoint, ensuring all queries are tenant-aware
    - Pagination for handling large product catalogs
2.  **Product Detail View**: Create `app/(app)/products/[productId]/page.tsx` to show detailed product information
3.  **Add/Edit Product Forms**: Create reusable form components with field validation for creating and editing products

#### **Step 3.2: Build Category and Supplier Management**

1.  **Categories Module**: 
    - Create pages for listing, adding, and editing product categories
    - Implement a hierarchical category selector component for parent/child relationships
2.  **Suppliers Module**:
    - Build UI for managing supplier information and contact details
    - Create a supplier selection component for use in product forms
    - Implement supplier performance metrics dashboard

#### **Step 3.3: Implement Inventory Control Features**

1.  **Warehouse Management**:
    - Create interfaces for defining warehouses and storage locations
    - Build stock transfer functionality between locations
2.  **Purchase Order System**:
    - Develop UI for creating, tracking, and receiving purchase orders
    - Implement stock level updates based on order fulfillment
3.  **Sales Order Processing**:
    - Build order creation flow with product selection and quantity validation
    - Implement order status tracking and fulfillment workflows

#### **Step 3.4: Dashboard Overview and Reporting**

1.  **Main Dashboard**: Enhance `app/(app)/dashboard/page.tsx` to display:
    - Key inventory metrics and status cards
    - Low stock alerts and action items
    - Recent activity feed
2.  **Basic Reporting**: 
    - Implement inventory valuation reports
    - Create sales and purchase trend visualizations

---

## 6. Phase 4: Advanced Features, Testing & Deployment

**Objective**: To add high-value features and prepare the application for production.

#### **Step 4.1: Implement Team Management**

1.  **Team Settings Interface**: 
    - Create `app/(app)/settings/team/page.tsx` with a list of current organization members
    - Add user role management (owner, admin, manager, staff) with appropriate permissions
2.  **Invitation System**:
    - Build invitation form for adding new users to the organization
    - Create `app/api/invitations/route.ts` to handle invitation creation and management
    - Leverage the existing Resend integration to send branded invitation emails
    - Implement invitation acceptance flow that associates new users with the correct organization

#### **Step 4.2: Migrate Billing to Organization Level**

1.  **Adapt Existing Stripe Integration**: 
    - Modify the Stripe integration in `app/api/stripe/` to work with organizations instead of individual users
    - Move subscription data from `User` model to `Organization` model
    - Create organization-specific pricing plans in the Stripe dashboard
2.  **Organization Billing UI**:
    - Create `app/(app)/settings/billing/page.tsx` for organization owners to manage subscription
    - Implement plan comparison, upgrade/downgrade flows, and billing history
    - Show usage statistics relative to plan limits
3.  **Update Stripe Webhooks**:
    - Modify webhook handlers in `app/api/webhook/route.ts` to update organization subscription status
    - Implement feature access controls based on subscription tier

#### **Step 4.3: Testing**

1.  **Unit Testing**:
    - Write Jest tests for API routes focusing on tenant isolation
    - Create tests that verify correct organization-based data filtering
    - Test role-based permissions system
2.  **Integration Testing**:
    - Test full user flows including authentication, organization creation, and core features
    - Verify data isolation between organizations for all core models
3.  **Performance Testing**:
    - Test system performance with multiple organizations and large datasets
    - Implement and test database indexing strategies for multi-tenant queries

#### **Step 4.4: Deployment and Monitoring**

1.  **Production Configuration**:
    - Update environment variables in Vercel project settings
    - Configure MongoDB Atlas for production with appropriate scaling options
    - Set up proper CORS settings for production domains
2.  **Deployment Pipeline**:
    - Implement CI/CD workflow for automated testing and deployment
    - Configure staging environment for pre-production testing
3.  **Monitoring and Analytics**:
    - Implement error tracking and performance monitoring
    - Set up usage analytics to track key metrics by organization
    - Create administrative dashboard for system-wide monitoring
