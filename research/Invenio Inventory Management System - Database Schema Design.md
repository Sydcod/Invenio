# Invenio Inventory Management System - Database Schema Design

## Executive Summary

This document presents a comprehensive database schema design for the Invenio inventory management system, inspired by modern inventory management platforms and designed to support a full-featured SaaS application. The schema encompasses all core functionalities including inventory management, sales operations, procurement, customer relationship management, financial tracking, and comprehensive reporting capabilities.

The database design follows MongoDB document-based architecture principles while maintaining relational integrity through careful reference management and embedded document strategies. This approach provides the flexibility needed for a modern SaaS application while ensuring data consistency and optimal query performance.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Entity Models](#core-entity-models)
3. [Sales Management Schema](#sales-management-schema)
4. [Procurement Management Schema](#procurement-management-schema)
5. [Financial Management Schema](#financial-management-schema)
6. [Reporting and Analytics Schema](#reporting-and-analytics-schema)
7. [User Management and Authentication](#user-management-and-authentication)
8. [System Configuration and Settings](#system-configuration-and-settings)
9. [Data Relationships and Integrity](#data-relationships-and-integrity)
10. [Performance Optimization Strategies](#performance-optimization-strategies)

---

## Architecture Overview

The Invenio database schema is designed around a microservices-friendly architecture that supports both operational efficiency and analytical reporting. The schema follows a hybrid approach combining normalized relational concepts with MongoDB's document flexibility, enabling rapid development while maintaining data integrity.

### Design Principles

The database architecture adheres to several key principles that ensure scalability, maintainability, and performance. First, the schema employs a domain-driven design approach where each major business function (inventory, sales, procurement, finance) has its own logical grouping of collections with clear boundaries and responsibilities. This separation allows for independent scaling and development of different system components.

Second, the design prioritizes query performance through strategic denormalization and embedded documents for frequently accessed data relationships. For example, customer information is embedded in sales orders to reduce join operations, while maintaining a separate customers collection for comprehensive customer management.

Third, the schema supports multi-tenancy through organization-based data isolation, enabling the SaaS model where multiple businesses can use the same application instance while maintaining complete data separation and security.

### Collection Strategy

The database employs a carefully planned collection strategy that balances normalization with MongoDB's document-oriented strengths. Core entities like items, customers, and vendors are maintained as separate collections to support complex queries and reporting. Transactional data like orders and invoices embed relevant reference data to optimize read performance while maintaining references to master data for consistency.

Audit trails and historical data are handled through a combination of embedded version history and separate audit collections, ensuring complete traceability without impacting operational performance. This approach supports both real-time operations and comprehensive historical reporting required for business intelligence and compliance.

---


## Core Entity Models

The core entity models form the foundation of the Invenio inventory management system, representing the essential business objects that drive all operational and analytical functions. These models are designed to support the complete inventory lifecycle from procurement through sales, while maintaining the flexibility needed for diverse business requirements.

### Organization Model

The Organization model serves as the top-level tenant container, enabling multi-tenant SaaS functionality while maintaining complete data isolation between different business entities.

```javascript
// organizations collection
{
  _id: ObjectId,
  name: String, // "Acme Corporation"
  slug: String, // "acme-corp" - URL-friendly identifier
  domain: String, // "acme.com" - for email domain verification
  subscription: {
    plan: String, // "starter", "professional", "enterprise"
    status: String, // "active", "suspended", "cancelled"
    billingCycle: String, // "monthly", "annual"
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    features: [String], // enabled feature flags
    limits: {
      users: Number,
      items: Number,
      orders: Number,
      storage: Number // in MB
    }
  },
  settings: {
    timezone: String, // "America/New_York"
    currency: String, // "USD"
    dateFormat: String, // "MM/DD/YYYY"
    numberFormat: String, // "1,234.56"
    fiscalYearStart: String, // "01-01"
    defaultWarehouse: ObjectId,
    taxSettings: {
      enabled: Boolean,
      defaultRate: Number,
      taxInclusive: Boolean
    }
  },
  branding: {
    logo: String, // URL to logo image
    primaryColor: String, // "#1976d2"
    secondaryColor: String, // "#424242"
    customDomain: String // "inventory.acme.com"
  },
  contact: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    phone: String,
    email: String,
    website: String
  },
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

### User Management Model

The User model handles authentication, authorization, and user preferences within the context of an organization, supporting role-based access control and detailed activity tracking.

```javascript
// users collection
{
  _id: ObjectId,
  organizationId: ObjectId, // reference to organizations
  email: String, // unique within organization
  password: String, // hashed
  profile: {
    firstName: String,
    lastName: String,
    avatar: String, // URL to profile image
    phone: String,
    title: String, // "Inventory Manager"
    department: String // "Operations"
  },
  role: {
    name: String, // "admin", "manager", "user", "viewer"
    permissions: [String], // granular permissions array
    customPermissions: {
      inventory: {
        view: Boolean,
        create: Boolean,
        edit: Boolean,
        delete: Boolean
      },
      sales: {
        view: Boolean,
        create: Boolean,
        edit: Boolean,
        delete: Boolean,
        approve: Boolean
      },
      purchases: {
        view: Boolean,
        create: Boolean,
        edit: Boolean,
        delete: Boolean,
        approve: Boolean
      },
      reports: {
        view: Boolean,
        export: Boolean,
        advanced: Boolean
      },
      settings: {
        view: Boolean,
        edit: Boolean,
        users: Boolean,
        billing: Boolean
      }
    }
  },
  preferences: {
    language: String, // "en", "es", "fr"
    theme: String, // "light", "dark", "auto"
    notifications: {
      email: Boolean,
      browser: Boolean,
      lowStock: Boolean,
      orderUpdates: Boolean,
      systemAlerts: Boolean
    },
    dashboard: {
      layout: String, // "default", "compact", "detailed"
      widgets: [String], // enabled widget IDs
      defaultView: String // "dashboard", "inventory", "sales"
    }
  },
  authentication: {
    lastLogin: Date,
    loginCount: Number,
    failedAttempts: Number,
    lockedUntil: Date,
    passwordChangedAt: Date,
    twoFactorEnabled: Boolean,
    twoFactorSecret: String,
    recoveryTokens: [String]
  },
  status: String, // "active", "inactive", "pending", "suspended"
  invitedBy: ObjectId, // reference to user who sent invitation
  invitedAt: Date,
  activatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Item/Product Model

The Item model represents the core inventory entity, supporting complex product hierarchies, variants, and comprehensive tracking capabilities essential for modern inventory management.

```javascript
// items collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  sku: String, // unique within organization
  name: String,
  description: String,
  category: {
    id: ObjectId, // reference to categories
    name: String, // denormalized for performance
    path: String // "Electronics > Computers > Laptops"
  },
  type: String, // "simple", "variant", "bundle", "service"
  status: String, // "active", "inactive", "discontinued"
  
  // Product Information
  specifications: {
    brand: String,
    model: String,
    manufacturer: String,
    weight: {
      value: Number,
      unit: String // "kg", "lb", "g"
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String // "cm", "in"
    },
    color: String,
    size: String,
    material: String,
    customFields: [
      {
        name: String,
        value: String,
        type: String // "text", "number", "date", "boolean"
      }
    ]
  },
  
  // Pricing Information
  pricing: {
    cost: Number, // purchase cost
    markup: Number, // percentage
    sellingPrice: Number,
    msrp: Number, // manufacturer suggested retail price
    currency: String,
    priceHistory: [
      {
        price: Number,
        effectiveDate: Date,
        reason: String,
        changedBy: ObjectId
      }
    ],
    tierPricing: [
      {
        minQuantity: Number,
        price: Number,
        discountPercent: Number
      }
    ]
  },
  
  // Inventory Tracking
  inventory: {
    trackQuantity: Boolean,
    currentStock: Number,
    availableStock: Number, // current - reserved
    reservedStock: Number,
    incomingStock: Number, // from pending purchase orders
    reorderPoint: Number,
    reorderQuantity: Number,
    maxStockLevel: Number,
    minStockLevel: Number,
    stockValue: Number, // calculated field
    averageCost: Number,
    lastCostUpdate: Date,
    stockMethod: String, // "FIFO", "LIFO", "Average"
    
    // Multi-location inventory
    locations: [
      {
        warehouseId: ObjectId,
        warehouseName: String,
        quantity: Number,
        reserved: Number,
        available: Number,
        reorderPoint: Number,
        maxLevel: Number,
        binLocation: String
      }
    ]
  },
  
  // Supplier Information
  suppliers: [
    {
      vendorId: ObjectId,
      vendorName: String,
      supplierSku: String,
      cost: Number,
      leadTime: Number, // days
      minOrderQuantity: Number,
      isPrimary: Boolean,
      lastOrderDate: Date,
      reliability: Number // 1-5 rating
    }
  ],
  
  // Media and Documentation
  media: {
    primaryImage: String, // URL
    images: [String], // array of URLs
    documents: [
      {
        name: String,
        url: String,
        type: String, // "manual", "specification", "certificate"
        uploadedAt: Date
      }
    ]
  },
  
  // Sales Information
  sales: {
    taxable: Boolean,
    taxCategory: String,
    salesAccount: String, // accounting integration
    salesDescription: String,
    unitOfMeasure: String, // "each", "box", "kg"
    salesHistory: {
      totalSold: Number,
      totalRevenue: Number,
      lastSaleDate: Date,
      averageSalePrice: Number,
      topCustomers: [
        {
          customerId: ObjectId,
          customerName: String,
          quantity: Number,
          revenue: Number
        }
      ]
    }
  },
  
  // Variants (for configurable products)
  variants: [
    {
      id: ObjectId,
      sku: String,
      name: String,
      attributes: {
        color: String,
        size: String,
        style: String
      },
      pricing: {
        cost: Number,
        sellingPrice: Number
      },
      inventory: {
        currentStock: Number,
        reorderPoint: Number
      },
      isActive: Boolean
    }
  ],
  
  // Bundle Components (for bundle products)
  bundleComponents: [
    {
      itemId: ObjectId,
      itemName: String,
      quantity: Number,
      cost: Number
    }
  ],
  
  // Compliance and Quality
  compliance: {
    serialNumberTracking: Boolean,
    batchTracking: Boolean,
    expirationTracking: Boolean,
    warrantyPeriod: Number, // months
    certifications: [String],
    hazardousMaterial: Boolean,
    restrictions: [String]
  },
  
  // Analytics and Performance
  analytics: {
    turnoverRate: Number,
    daysOnHand: Number,
    profitMargin: Number,
    demandForecast: Number,
    seasonalityFactor: Number,
    abcClassification: String, // "A", "B", "C"
    velocityCode: String, // "fast", "medium", "slow"
    lastAnalysisDate: Date
  },
  
  // Audit Trail
  audit: {
    createdBy: ObjectId,
    createdAt: Date,
    updatedBy: ObjectId,
    updatedAt: Date,
    version: Number,
    changeHistory: [
      {
        field: String,
        oldValue: String,
        newValue: String,
        changedBy: ObjectId,
        changedAt: Date,
        reason: String
      }
    ]
  },
  
  isActive: Boolean,
  tags: [String], // for categorization and search
  notes: String
}
```

### Category Model

The Category model provides hierarchical organization of items, supporting unlimited nesting levels and comprehensive categorization features.

```javascript
// categories collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,
  description: String,
  parentId: ObjectId, // null for root categories
  path: String, // "Electronics/Computers/Laptops"
  level: Number, // 0 for root, 1 for first level, etc.
  sortOrder: Number,
  
  // Category Properties
  properties: {
    icon: String, // icon class or URL
    color: String, // hex color code
    image: String, // category image URL
    isVisible: Boolean,
    allowProducts: Boolean, // can contain products directly
    requiresApproval: Boolean // new products need approval
  },
  
  // Default Settings for Items in Category
  defaults: {
    taxCategory: String,
    unitOfMeasure: String,
    reorderPoint: Number,
    markup: Number,
    warrantyPeriod: Number
  },
  
  // Category Attributes (for filtering)
  attributes: [
    {
      name: String, // "Brand", "Color", "Size"
      type: String, // "text", "number", "select", "multiselect"
      required: Boolean,
      options: [String], // for select types
      defaultValue: String
    }
  ],
  
  // Statistics
  stats: {
    itemCount: Number,
    totalValue: Number,
    averagePrice: Number,
    lastUpdated: Date
  },
  
  // SEO and Display
  seo: {
    slug: String, // URL-friendly name
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  
  createdBy: ObjectId,
  createdAt: Date,
  updatedBy: ObjectId,
  updatedAt: Date,
  isActive: Boolean
}
```

### Warehouse/Location Model

The Warehouse model supports multi-location inventory management with detailed location tracking and capacity management.

```javascript
// warehouses collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,
  code: String, // unique identifier
  type: String, // "warehouse", "store", "dropship", "virtual"
  
  // Location Information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Contact Information
  contact: {
    manager: String,
    phone: String,
    email: String,
    hours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    }
  },
  
  // Capacity and Layout
  capacity: {
    totalArea: Number, // square feet/meters
    storageArea: Number,
    maxWeight: Number, // kg/lbs
    zones: [
      {
        name: String, // "Receiving", "Picking", "Shipping"
        area: Number,
        capacity: Number,
        temperature: {
          min: Number,
          max: Number,
          unit: String // "C", "F"
        }
      }
    ],
    binLocations: [
      {
        code: String, // "A1-B2-C3"
        zone: String,
        aisle: String,
        rack: String,
        shelf: String,
        bin: String,
        capacity: Number,
        currentOccupancy: Number,
        itemTypes: [String] // allowed item types
      }
    ]
  },
  
  // Operational Settings
  operations: {
    isReceiving: Boolean,
    isShipping: Boolean,
    isPicking: Boolean,
    isDefault: Boolean,
    priority: Number, // for allocation logic
    costCenter: String,
    
    // Automation Settings
    autoAllocate: Boolean,
    pickingMethod: String, // "FIFO", "LIFO", "FEFO"
    cycleCountFrequency: Number, // days
    lastCycleCount: Date
  },
  
  // Integration Settings
  integrations: {
    wms: {
      enabled: Boolean,
      provider: String,
      apiEndpoint: String,
      credentials: String // encrypted
    },
    shipping: {
      carriers: [String],
      defaultCarrier: String,
      rateShop: Boolean
    }
  },
  
  // Statistics
  stats: {
    totalItems: Number,
    totalValue: Number,
    utilizationPercent: Number,
    inboundToday: Number,
    outboundToday: Number,
    lastActivity: Date
  },
  
  createdBy: ObjectId,
  createdAt: Date,
  updatedBy: ObjectId,
  updatedAt: Date,
  isActive: Boolean
}
```

---


## Sales Management Schema

The Sales Management Schema encompasses all customer-facing operations from lead generation through payment collection, designed to support the complete sales lifecycle while maintaining detailed audit trails and enabling comprehensive analytics.

### Customer Model

The Customer model serves as the central repository for all customer-related information, supporting both B2B and B2C scenarios with flexible contact management and comprehensive relationship tracking.

```javascript
// customers collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  customerNumber: String, // auto-generated unique identifier
  type: String, // "individual", "business"
  
  // Basic Information
  profile: {
    // For individuals
    firstName: String,
    lastName: String,
    title: String, // "Mr.", "Ms.", "Dr."
    
    // For businesses
    companyName: String,
    businessType: String, // "corporation", "llc", "partnership"
    taxId: String,
    website: String,
    
    // Common fields
    displayName: String, // computed field for UI display
    email: String,
    phone: String,
    mobile: String,
    fax: String
  },
  
  // Address Information
  addresses: [
    {
      id: ObjectId,
      type: String, // "billing", "shipping", "both"
      isPrimary: Boolean,
      label: String, // "Home", "Office", "Warehouse"
      street1: String,
      street2: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      deliveryInstructions: String,
      isActive: Boolean
    }
  ],
  
  // Contact Persons (for business customers)
  contacts: [
    {
      id: ObjectId,
      firstName: String,
      lastName: String,
      title: String,
      department: String,
      email: String,
      phone: String,
      mobile: String,
      role: String, // "primary", "billing", "technical", "purchasing"
      isPrimary: Boolean,
      notes: String
    }
  ],
  
  // Financial Information
  financial: {
    creditLimit: Number,
    creditUsed: Number,
    creditAvailable: Number, // calculated field
    paymentTerms: String, // "Net 30", "COD", "Prepaid"
    paymentMethod: String, // "check", "credit_card", "ach", "wire"
    currency: String,
    taxExempt: Boolean,
    taxExemptNumber: String,
    taxCategory: String,
    
    // Credit Assessment
    creditRating: String, // "A", "B", "C", "D"
    creditScore: Number,
    lastCreditReview: Date,
    creditHistory: [
      {
        date: Date,
        rating: String,
        score: Number,
        notes: String,
        reviewedBy: ObjectId
      }
    ]
  },
  
  // Sales Information
  sales: {
    salesRep: {
      id: ObjectId,
      name: String,
      email: String
    },
    customerSince: Date,
    lastOrderDate: Date,
    totalOrders: Number,
    totalRevenue: Number,
    averageOrderValue: Number,
    lifetimeValue: Number,
    
    // Segmentation
    segment: String, // "VIP", "Regular", "New", "At Risk"
    priority: String, // "high", "medium", "low"
    source: String, // "website", "referral", "advertising"
    
    // Preferences
    preferredShipping: String,
    preferredPayment: String,
    communicationPreferences: {
      email: Boolean,
      sms: Boolean,
      phone: Boolean,
      mail: Boolean
    },
    
    // Pricing
    priceLevel: String, // "retail", "wholesale", "vip"
    discountPercent: Number,
    specialPricing: [
      {
        itemId: ObjectId,
        itemSku: String,
        price: Number,
        effectiveDate: Date,
        expirationDate: Date
      }
    ]
  },
  
  // Marketing and Engagement
  marketing: {
    tags: [String],
    campaigns: [
      {
        campaignId: ObjectId,
        campaignName: String,
        joinDate: Date,
        status: String // "active", "completed", "opted_out"
      }
    ],
    loyaltyProgram: {
      enrolled: Boolean,
      points: Number,
      tier: String,
      joinDate: Date
    },
    emailSubscriptions: {
      newsletter: Boolean,
      promotions: Boolean,
      orderUpdates: Boolean,
      productUpdates: Boolean
    }
  },
  
  // Support and Service
  support: {
    tickets: [
      {
        ticketId: ObjectId,
        subject: String,
        status: String,
        priority: String,
        createdDate: Date,
        resolvedDate: Date
      }
    ],
    satisfaction: {
      averageRating: Number,
      lastSurveyDate: Date,
      npsScore: Number
    },
    notes: [
      {
        id: ObjectId,
        note: String,
        type: String, // "general", "complaint", "compliment", "follow_up"
        createdBy: ObjectId,
        createdAt: Date,
        isPrivate: Boolean
      }
    ]
  },
  
  // Integration Data
  integrations: {
    crmId: String, // external CRM system ID
    accountingId: String, // accounting system ID
    ecommerceId: String, // e-commerce platform ID
    lastSync: Date,
    syncErrors: [String]
  },
  
  status: String, // "active", "inactive", "prospect", "suspended"
  createdBy: ObjectId,
  createdAt: Date,
  updatedBy: ObjectId,
  updatedAt: Date
}
```

### Sales Order Model

The Sales Order model captures the complete order lifecycle from quotation through fulfillment, supporting complex order scenarios including partial shipments, backorders, and order modifications.

```javascript
// salesOrders collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  orderNumber: String, // auto-generated unique identifier
  type: String, // "quote", "order", "recurring", "return"
  status: String, // "draft", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"
  
  // Customer Information (denormalized for performance)
  customer: {
    id: ObjectId,
    customerNumber: String,
    name: String,
    email: String,
    phone: String,
    type: String // "individual", "business"
  },
  
  // Order Dates
  dates: {
    orderDate: Date,
    requestedDate: Date,
    promisedDate: Date,
    shippedDate: Date,
    deliveredDate: Date,
    cancelledDate: Date
  },
  
  // Addresses
  billingAddress: {
    name: String,
    company: String,
    street1: String,
    street2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  
  shippingAddress: {
    name: String,
    company: String,
    street1: String,
    street2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String,
    deliveryInstructions: String
  },
  
  // Line Items
  lineItems: [
    {
      id: ObjectId,
      item: {
        id: ObjectId,
        sku: String,
        name: String,
        description: String,
        category: String
      },
      quantity: {
        ordered: Number,
        shipped: Number,
        backordered: Number,
        cancelled: Number,
        returned: Number
      },
      pricing: {
        unitPrice: Number,
        listPrice: Number,
        cost: Number,
        discountPercent: Number,
        discountAmount: Number,
        lineTotal: Number,
        taxAmount: Number,
        taxRate: Number
      },
      warehouse: {
        id: ObjectId,
        name: String,
        binLocation: String
      },
      fulfillment: {
        status: String, // "pending", "allocated", "picked", "shipped"
        allocatedAt: Date,
        pickedAt: Date,
        shippedAt: Date,
        trackingNumber: String
      },
      notes: String
    }
  ],
  
  // Financial Summary
  totals: {
    subtotal: Number,
    discountAmount: Number,
    discountPercent: Number,
    taxAmount: Number,
    shippingAmount: Number,
    handlingAmount: Number,
    total: Number,
    paidAmount: Number,
    balanceDue: Number,
    currency: String
  },
  
  // Shipping Information
  shipping: {
    method: String, // "standard", "expedited", "overnight"
    carrier: String, // "UPS", "FedEx", "USPS"
    service: String, // "Ground", "2-Day", "Next Day"
    cost: Number,
    weight: Number,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    signatureRequired: Boolean,
    insuranceValue: Number
  },
  
  // Payment Information
  payment: {
    terms: String, // "Net 30", "COD", "Prepaid"
    method: String, // "credit_card", "check", "ach", "cash"
    dueDate: Date,
    status: String, // "pending", "partial", "paid", "overdue"
    
    // Payment Schedule (for terms)
    schedule: [
      {
        dueDate: Date,
        amount: Number,
        status: String,
        paidDate: Date,
        paidAmount: Number
      }
    ]
  },
  
  // Sales Information
  sales: {
    salesRep: {
      id: ObjectId,
      name: String,
      email: String,
      commission: Number
    },
    source: String, // "website", "phone", "email", "walk_in"
    channel: String, // "direct", "partner", "online"
    campaign: String,
    referenceNumber: String, // customer PO number
    
    // Recurring Order Information
    recurring: {
      isRecurring: Boolean,
      frequency: String, // "weekly", "monthly", "quarterly"
      nextOrderDate: Date,
      endDate: Date,
      remainingOrders: Number
    }
  },
  
  // Fulfillment Tracking
  fulfillment: {
    warehouse: {
      id: ObjectId,
      name: String
    },
    priority: String, // "low", "normal", "high", "urgent"
    pickList: {
      generated: Boolean,
      generatedAt: Date,
      generatedBy: ObjectId,
      printed: Boolean,
      printedAt: Date
    },
    packingSlip: {
      generated: Boolean,
      generatedAt: Date,
      printed: Boolean,
      printedAt: Date
    },
    
    // Shipment Tracking
    shipments: [
      {
        id: ObjectId,
        shipmentNumber: String,
        carrier: String,
        service: String,
        trackingNumber: String,
        weight: Number,
        cost: Number,
        shippedDate: Date,
        deliveredDate: Date,
        lineItems: [
          {
            lineItemId: ObjectId,
            quantity: Number
          }
        ]
      }
    ]
  },
  
  // Document References
  documents: {
    quote: {
      id: ObjectId,
      number: String,
      generatedAt: Date
    },
    invoice: {
      id: ObjectId,
      number: String,
      generatedAt: Date
    },
    packingSlip: {
      id: ObjectId,
      number: String,
      generatedAt: Date
    }
  },
  
  // Communication Log
  communications: [
    {
      id: ObjectId,
      type: String, // "email", "phone", "note"
      subject: String,
      content: String,
      direction: String, // "inbound", "outbound"
      createdBy: ObjectId,
      createdAt: Date,
      attachments: [String]
    }
  ],
  
  // Workflow and Approvals
  workflow: {
    requiresApproval: Boolean,
    approvalStatus: String, // "pending", "approved", "rejected"
    approvedBy: ObjectId,
    approvedAt: Date,
    rejectionReason: String,
    
    // Approval History
    approvals: [
      {
        step: String,
        status: String,
        approver: ObjectId,
        approverName: String,
        date: Date,
        comments: String
      }
    ]
  },
  
  // Integration and External References
  integrations: {
    ecommerceOrderId: String,
    crmOpportunityId: String,
    erpOrderId: String,
    lastSync: Date
  },
  
  // Audit Trail
  audit: {
    createdBy: ObjectId,
    createdAt: Date,
    updatedBy: ObjectId,
    updatedAt: Date,
    version: Number,
    
    // Change History
    changes: [
      {
        field: String,
        oldValue: String,
        newValue: String,
        changedBy: ObjectId,
        changedAt: Date,
        reason: String
      }
    ]
  },
  
  notes: String,
  internalNotes: String, // not visible to customer
  tags: [String]
}
```

### Invoice Model

The Invoice model handles all billing operations with support for complex invoicing scenarios including partial invoicing, recurring billing, and multi-currency operations.

```javascript
// invoices collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  invoiceNumber: String, // auto-generated unique identifier
  type: String, // "standard", "recurring", "credit_memo", "debit_memo"
  status: String, // "draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled"
  
  // Related Documents
  salesOrder: {
    id: ObjectId,
    orderNumber: String
  },
  
  // Customer Information (denormalized)
  customer: {
    id: ObjectId,
    customerNumber: String,
    name: String,
    email: String,
    phone: String
  },
  
  // Invoice Dates
  dates: {
    invoiceDate: Date,
    dueDate: Date,
    paidDate: Date,
    sentDate: Date,
    viewedDate: Date,
    lastReminderDate: Date
  },
  
  // Billing Information
  billingAddress: {
    name: String,
    company: String,
    street1: String,
    street2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  
  // Line Items
  lineItems: [
    {
      id: ObjectId,
      type: String, // "product", "service", "shipping", "discount", "tax"
      item: {
        id: ObjectId,
        sku: String,
        name: String,
        description: String
      },
      quantity: Number,
      unitPrice: Number,
      discountPercent: Number,
      discountAmount: Number,
      lineTotal: Number,
      taxRate: Number,
      taxAmount: Number,
      
      // Reference to sales order line item
      salesOrderLineId: ObjectId,
      
      // Accounting
      accountCode: String,
      taxCode: String
    }
  ],
  
  // Financial Totals
  totals: {
    subtotal: Number,
    discountAmount: Number,
    taxAmount: Number,
    shippingAmount: Number,
    adjustmentAmount: Number,
    total: Number,
    paidAmount: Number,
    creditAmount: Number,
    balanceDue: Number,
    currency: String,
    exchangeRate: Number // if multi-currency
  },
  
  // Payment Terms and Information
  payment: {
    terms: String, // "Net 30", "Net 15", "Due on Receipt"
    method: String, // "check", "credit_card", "ach", "wire"
    dueDate: Date,
    lateFee: Number,
    lateFeePercent: Number,
    
    // Payment Schedule (for installments)
    schedule: [
      {
        installmentNumber: Number,
        dueDate: Date,
        amount: Number,
        status: String, // "pending", "paid", "overdue"
        paidDate: Date,
        paidAmount: Number
      }
    ]
  },
  
  // Tax Information
  tax: {
    taxable: Boolean,
    taxExempt: Boolean,
    taxExemptReason: String,
    taxJurisdiction: String,
    
    // Tax Breakdown
    taxes: [
      {
        name: String, // "Sales Tax", "VAT", "GST"
        rate: Number,
        amount: Number,
        jurisdiction: String
      }
    ]
  },
  
  // Recurring Invoice Information
  recurring: {
    isRecurring: Boolean,
    frequency: String, // "weekly", "monthly", "quarterly", "annually"
    startDate: Date,
    endDate: Date,
    nextInvoiceDate: Date,
    remainingInvoices: Number,
    parentInvoiceId: ObjectId, // reference to template invoice
    
    // Recurring Settings
    autoSend: Boolean,
    autoCharge: Boolean,
    escalationEnabled: Boolean,
    escalationPercent: Number
  },
  
  // Communication and Delivery
  delivery: {
    method: String, // "email", "mail", "portal", "manual"
    emailAddress: String,
    sentCount: Number,
    lastSent: Date,
    viewCount: Number,
    lastViewed: Date,
    
    // Email Settings
    emailSubject: String,
    emailMessage: String,
    attachments: [String]
  },
  
  // Collections and Follow-up
  collections: {
    remindersSent: Number,
    lastReminderDate: Date,
    nextReminderDate: Date,
    collectionStatus: String, // "current", "overdue", "collections", "write_off"
    
    // Collection Actions
    actions: [
      {
        type: String, // "reminder", "phone_call", "letter", "collection_agency"
        date: Date,
        notes: String,
        performedBy: ObjectId,
        result: String
      }
    ]
  },
  
  // Document Generation
  document: {
    template: String, // template used for generation
    generatedAt: Date,
    pdfUrl: String,
    pdfSize: Number,
    customFields: [
      {
        name: String,
        value: String
      }
    ]
  },
  
  // Integration References
  integrations: {
    accountingId: String, // QuickBooks, Xero, etc.
    paymentProcessorId: String,
    lastSync: Date,
    syncStatus: String,
    syncErrors: [String]
  },
  
  // Audit Trail
  audit: {
    createdBy: ObjectId,
    createdAt: Date,
    updatedBy: ObjectId,
    updatedAt: Date,
    version: Number,
    
    // Status History
    statusHistory: [
      {
        status: String,
        date: Date,
        changedBy: ObjectId,
        notes: String
      }
    ]
  },
  
  notes: String,
  internalNotes: String,
  tags: [String]
}
```

---


## Procurement Management Schema

The Procurement Management Schema handles all supplier-related operations from vendor management through goods receipt, designed to optimize purchasing processes while maintaining comprehensive supplier performance tracking and cost management.

### Vendor/Supplier Model

The Vendor model serves as the comprehensive supplier database, supporting complex vendor relationships, performance tracking, and procurement optimization.

```javascript
// vendors collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  vendorNumber: String, // auto-generated unique identifier
  type: String, // "supplier", "manufacturer", "distributor", "service_provider"
  
  // Basic Information
  profile: {
    companyName: String,
    legalName: String,
    dbaName: String, // doing business as
    businessType: String, // "corporation", "llc", "partnership", "sole_proprietorship"
    taxId: String,
    dunsNumber: String,
    website: String,
    yearEstablished: Number,
    employeeCount: Number,
    annualRevenue: Number
  },
  
  // Contact Information
  contacts: [
    {
      id: ObjectId,
      type: String, // "primary", "accounting", "sales", "technical", "shipping"
      firstName: String,
      lastName: String,
      title: String,
      department: String,
      email: String,
      phone: String,
      mobile: String,
      fax: String,
      isPrimary: Boolean,
      notes: String
    }
  ],
  
  // Address Information
  addresses: [
    {
      id: ObjectId,
      type: String, // "billing", "shipping", "remit_to", "headquarters"
      isPrimary: Boolean,
      name: String, // location name
      street1: String,
      street2: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String,
      fax: String,
      hours: String,
      shippingInstructions: String,
      isActive: Boolean
    }
  ],
  
  // Financial Information
  financial: {
    paymentTerms: String, // "Net 30", "2/10 Net 30", "COD"
    currency: String,
    creditLimit: Number,
    creditRating: String, // "A", "B", "C", "D"
    paymentMethod: String, // "check", "ach", "wire", "credit_card"
    
    // Banking Information
    banking: {
      bankName: String,
      accountNumber: String, // encrypted
      routingNumber: String,
      swiftCode: String,
      iban: String
    },
    
    // Tax Information
    tax: {
      taxId: String,
      taxExempt: Boolean,
      taxExemptNumber: String,
      w9OnFile: Boolean,
      w9Date: Date,
      form1099Required: Boolean
    }
  },
  
  // Procurement Information
  procurement: {
    preferredVendor: Boolean,
    approvedVendor: Boolean,
    approvalDate: Date,
    approvedBy: ObjectId,
    
    // Performance Metrics
    performance: {
      rating: Number, // 1-5 scale
      onTimeDelivery: Number, // percentage
      qualityRating: Number, // 1-5 scale
      priceCompetitiveness: Number, // 1-5 scale
      responsiveness: Number, // 1-5 scale
      lastEvaluation: Date,
      
      // Historical Performance
      history: [
        {
          period: String, // "2024-Q1"
          onTimeDelivery: Number,
          qualityRating: Number,
          orderAccuracy: Number,
          responseTime: Number, // hours
          defectRate: Number,
          evaluatedBy: ObjectId,
          evaluatedAt: Date
        }
      ]
    },
    
    // Purchasing Statistics
    statistics: {
      totalOrders: Number,
      totalSpend: Number,
      averageOrderValue: Number,
      lastOrderDate: Date,
      firstOrderDate: Date,
      averageLeadTime: Number, // days
      
      // Current Year Stats
      currentYear: {
        orders: Number,
        spend: Number,
        returns: Number,
        disputes: Number
      }
    }
  },
  
  // Product and Service Catalog
  catalog: [
    {
      id: ObjectId,
      itemId: ObjectId, // reference to items collection
      vendorSku: String,
      vendorPartNumber: String,
      description: String,
      unitPrice: Number,
      currency: String,
      minimumOrderQuantity: Number,
      leadTime: Number, // days
      availability: String, // "in_stock", "limited", "discontinued"
      lastUpdated: Date,
      
      // Pricing Tiers
      pricingTiers: [
        {
          minQuantity: Number,
          price: Number,
          effectiveDate: Date,
          expirationDate: Date
        }
      ]
    }
  ],
  
  // Certifications and Compliance
  compliance: {
    certifications: [
      {
        type: String, // "ISO9001", "ISO14001", "OSHA", "FDA"
        number: String,
        issuedBy: String,
        issuedDate: Date,
        expirationDate: Date,
        documentUrl: String
      }
    ],
    
    // Insurance Information
    insurance: {
      generalLiability: {
        carrier: String,
        policyNumber: String,
        coverage: Number,
        expirationDate: Date
      },
      workersCompensation: {
        carrier: String,
        policyNumber: String,
        expirationDate: Date
      },
      productLiability: {
        carrier: String,
        policyNumber: String,
        coverage: Number,
        expirationDate: Date
      }
    },
    
    // Diversity Information
    diversity: {
      minorityOwned: Boolean,
      womanOwned: Boolean,
      veteranOwned: Boolean,
      smallBusiness: Boolean,
      disadvantagedBusiness: Boolean,
      certifyingAgency: String,
      certificationNumber: String
    }
  },
  
  // Communication and Support
  support: {
    preferredCommunication: String, // "email", "phone", "portal"
    timeZone: String,
    businessHours: String,
    emergencyContact: {
      name: String,
      phone: String,
      email: String
    },
    
    // Service Level Agreements
    sla: {
      responseTime: Number, // hours
      resolutionTime: Number, // hours
      availability: Number, // percentage
      penaltyClause: String
    }
  },
  
  // Contract and Agreement Information
  contracts: [
    {
      id: ObjectId,
      type: String, // "master_agreement", "blanket_po", "contract"
      number: String,
      title: String,
      startDate: Date,
      endDate: Date,
      value: Number,
      currency: String,
      status: String, // "active", "expired", "terminated"
      autoRenew: Boolean,
      renewalTerms: String,
      documentUrl: String,
      
      // Key Terms
      terms: {
        paymentTerms: String,
        deliveryTerms: String,
        warrantyPeriod: Number,
        returnPolicy: String,
        cancellationPolicy: String
      }
    }
  ],
  
  // Integration and External Systems
  integrations: {
    erpVendorId: String,
    accountingVendorId: String,
    ecommerceVendorId: String,
    supplierPortalId: String,
    lastSync: Date,
    syncStatus: String
  },
  
  // Risk Assessment
  risk: {
    riskLevel: String, // "low", "medium", "high", "critical"
    riskFactors: [String], // "financial", "geographic", "regulatory", "operational"
    lastAssessment: Date,
    assessedBy: ObjectId,
    
    // Risk Mitigation
    mitigation: [
      {
        risk: String,
        strategy: String,
        implementedDate: Date,
        effectiveness: String
      }
    ]
  },
  
  status: String, // "active", "inactive", "suspended", "terminated"
  createdBy: ObjectId,
  createdAt: Date,
  updatedBy: ObjectId,
  updatedAt: Date,
  
  notes: String,
  tags: [String]
}
```

### Purchase Order Model

The Purchase Order model manages the complete procurement process from requisition through receipt, supporting complex approval workflows and detailed tracking.

```javascript
// purchaseOrders collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  poNumber: String, // auto-generated unique identifier
  type: String, // "standard", "blanket", "contract", "emergency"
  status: String, // "draft", "pending_approval", "approved", "sent", "acknowledged", "partial", "received", "closed", "cancelled"
  
  // Vendor Information (denormalized)
  vendor: {
    id: ObjectId,
    vendorNumber: String,
    name: String,
    email: String,
    phone: String
  },
  
  // Requisition Information
  requisition: {
    id: ObjectId,
    number: String,
    requestedBy: ObjectId,
    requestedDate: Date,
    department: String,
    justification: String
  },
  
  // Purchase Order Dates
  dates: {
    orderDate: Date,
    requestedDate: Date,
    promisedDate: Date,
    expectedDate: Date,
    receivedDate: Date,
    closedDate: Date,
    cancelledDate: Date
  },
  
  // Delivery Information
  delivery: {
    method: String, // "pickup", "delivery", "drop_ship"
    address: {
      name: String,
      company: String,
      street1: String,
      street2: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      phone: String
    },
    warehouse: {
      id: ObjectId,
      name: String,
      code: String
    },
    instructions: String,
    contactPerson: String,
    contactPhone: String
  },
  
  // Line Items
  lineItems: [
    {
      id: ObjectId,
      lineNumber: Number,
      item: {
        id: ObjectId,
        sku: String,
        name: String,
        description: String,
        vendorSku: String,
        vendorPartNumber: String
      },
      quantity: {
        ordered: Number,
        received: Number,
        remaining: Number,
        cancelled: Number,
        returned: Number
      },
      pricing: {
        unitCost: Number,
        listPrice: Number,
        discountPercent: Number,
        discountAmount: Number,
        lineTotal: Number,
        taxAmount: Number,
        taxRate: Number
      },
      delivery: {
        requestedDate: Date,
        promisedDate: Date,
        leadTime: Number, // days
        warehouse: {
          id: ObjectId,
          name: String
        }
      },
      receiving: {
        status: String, // "pending", "partial", "complete", "over_received"
        receipts: [
          {
            receiptId: ObjectId,
            receiptNumber: String,
            quantity: Number,
            date: Date,
            receivedBy: ObjectId,
            condition: String, // "good", "damaged", "defective"
            notes: String
          }
        ]
      },
      notes: String
    }
  ],
  
  // Financial Totals
  totals: {
    subtotal: Number,
    discountAmount: Number,
    taxAmount: Number,
    shippingAmount: Number,
    handlingAmount: Number,
    total: Number,
    receivedValue: Number,
    remainingValue: Number,
    currency: String,
    exchangeRate: Number
  },
  
  // Payment Terms
  payment: {
    terms: String, // "Net 30", "2/10 Net 30", "COD"
    method: String, // "check", "ach", "wire", "credit_card"
    currency: String,
    
    // Early Payment Discount
    earlyPayment: {
      discountPercent: Number,
      discountDays: Number,
      netDays: Number
    }
  },
  
  // Shipping and Freight
  shipping: {
    method: String, // "ground", "air", "ocean", "truck"
    carrier: String,
    service: String,
    cost: Number,
    terms: String, // "FOB Origin", "FOB Destination", "CIF", "DDP"
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  
  // Approval Workflow
  approval: {
    required: Boolean,
    status: String, // "pending", "approved", "rejected"
    approvalLimit: Number,
    
    // Approval Chain
    approvers: [
      {
        level: Number,
        approver: {
          id: ObjectId,
          name: String,
          email: String
        },
        status: String, // "pending", "approved", "rejected"
        date: Date,
        comments: String,
        delegatedTo: ObjectId
      }
    ],
    
    // Approval Rules
    rules: {
      amountThreshold: Number,
      departmentApproval: Boolean,
      budgetApproval: Boolean,
      vendorApproval: Boolean
    }
  },
  
  // Budget and Cost Center
  budget: {
    costCenter: String,
    budgetCode: String,
    projectCode: String,
    glAccount: String,
    budgetYear: Number,
    budgetRemaining: Number,
    
    // Budget Allocation
    allocation: [
      {
        costCenter: String,
        percentage: Number,
        amount: Number
      }
    ]
  },
  
  // Contract Reference
  contract: {
    id: ObjectId,
    number: String,
    type: String,
    terms: String
  },
  
  // Communication Log
  communications: [
    {
      id: ObjectId,
      type: String, // "email", "phone", "fax", "portal"
      direction: String, // "sent", "received"
      subject: String,
      content: String,
      date: Date,
      contactPerson: String,
      attachments: [String]
    }
  ],
  
  // Quality and Inspection
  quality: {
    inspectionRequired: Boolean,
    inspectionCriteria: String,
    qualityStandards: [String],
    
    // Inspection Results
    inspections: [
      {
        receiptId: ObjectId,
        inspector: ObjectId,
        date: Date,
        result: String, // "passed", "failed", "conditional"
        defects: [String],
        notes: String,
        photos: [String]
      }
    ]
  },
  
  // Integration References
  integrations: {
    erpPoId: String,
    accountingPoId: String,
    supplierPortalId: String,
    lastSync: Date,
    syncStatus: String
  },
  
  // Audit Trail
  audit: {
    createdBy: ObjectId,
    createdAt: Date,
    updatedBy: ObjectId,
    updatedAt: Date,
    version: Number,
    
    // Change History
    changes: [
      {
        field: String,
        oldValue: String,
        newValue: String,
        changedBy: ObjectId,
        changedAt: Date,
        reason: String
      }
    ],
    
    // Status History
    statusHistory: [
      {
        status: String,
        date: Date,
        changedBy: ObjectId,
        notes: String
      }
    ]
  },
  
  notes: String,
  internalNotes: String,
  tags: [String]
}
```

### Purchase Receipt Model

The Purchase Receipt model tracks all incoming inventory with detailed receiving information, quality control, and discrepancy management.

```javascript
// purchaseReceipts collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  receiptNumber: String, // auto-generated unique identifier
  type: String, // "standard", "return", "transfer", "adjustment"
  status: String, // "draft", "received", "inspected", "posted", "cancelled"
  
  // Purchase Order Reference
  purchaseOrder: {
    id: ObjectId,
    poNumber: String,
    vendor: {
      id: ObjectId,
      name: String,
      vendorNumber: String
    }
  },
  
  // Receipt Information
  receipt: {
    receivedDate: Date,
    receivedBy: ObjectId,
    receivedByName: String,
    warehouse: {
      id: ObjectId,
      name: String,
      code: String
    },
    
    // Delivery Information
    delivery: {
      carrier: String,
      trackingNumber: String,
      deliveryMethod: String,
      driverName: String,
      vehicleInfo: String,
      deliveryTime: Date,
      signedBy: String
    }
  },
  
  // Received Items
  lineItems: [
    {
      id: ObjectId,
      purchaseOrderLineId: ObjectId,
      lineNumber: Number,
      item: {
        id: ObjectId,
        sku: String,
        name: String,
        description: String,
        vendorSku: String
      },
      quantity: {
        ordered: Number,
        received: Number,
        accepted: Number,
        rejected: Number,
        variance: Number // received - ordered
      },
      pricing: {
        unitCost: Number,
        totalCost: Number,
        landedCost: Number // including freight, duties, etc.
      },
      
      // Location Information
      location: {
        warehouse: {
          id: ObjectId,
          name: String
        },
        binLocation: String,
        zone: String,
        aisle: String,
        rack: String,
        shelf: String
      },
      
      // Quality Control
      quality: {
        inspectionRequired: Boolean,
        inspected: Boolean,
        inspectedBy: ObjectId,
        inspectionDate: Date,
        condition: String, // "good", "damaged", "defective", "expired"
        qualityGrade: String, // "A", "B", "C"
        defects: [String],
        photos: [String],
        notes: String
      },
      
      // Lot and Serial Tracking
      tracking: {
        lotNumber: String,
        serialNumbers: [String],
        expirationDate: Date,
        manufacturingDate: Date,
        batchCode: String,
        countryOfOrigin: String
      },
      
      // Discrepancies
      discrepancy: {
        hasDiscrepancy: Boolean,
        type: String, // "quantity", "quality", "price", "item"
        description: String,
        reportedBy: ObjectId,
        reportedDate: Date,
        resolution: String,
        resolvedBy: ObjectId,
        resolvedDate: Date
      },
      
      notes: String
    }
  ],
  
  // Financial Information
  totals: {
    subtotal: Number,
    freight: Number,
    duties: Number,
    taxes: Number,
    total: Number,
    currency: String,
    exchangeRate: Number
  },
  
  // Shipping and Packaging
  shipping: {
    packages: [
      {
        packageNumber: String,
        weight: Number,
        dimensions: {
          length: Number,
          width: Number,
          height: Number,
          unit: String
        },
        condition: String, // "good", "damaged"
        contents: [String] // line item IDs
      }
    ],
    
    // Freight Information
    freight: {
      carrier: String,
      service: String,
      cost: Number,
      weight: Number,
      billOfLading: String,
      proNumber: String
    }
  },
  
  // Documentation
  documents: {
    packingSlip: {
      number: String,
      date: Date,
      received: Boolean
    },
    invoice: {
      number: String,
      date: Date,
      amount: Number,
      received: Boolean
    },
    billOfLading: {
      number: String,
      date: Date,
      received: Boolean
    },
    certificates: [
      {
        type: String, // "COA", "COC", "FDA", "customs"
        number: String,
        date: Date,
        url: String
      }
    ]
  },
  
  // Inventory Impact
  inventory: {
    posted: Boolean,
    postedDate: Date,
    postedBy: ObjectId,
    
    // Inventory Transactions
    transactions: [
      {
        itemId: ObjectId,
        transactionType: String, // "receipt", "adjustment", "return"
        quantity: Number,
        unitCost: Number,
        totalCost: Number,
        warehouseId: ObjectId,
        binLocation: String
      }
    ]
  },
  
  // Returns and Rejections
  returns: [
    {
      id: ObjectId,
      lineItemId: ObjectId,
      quantity: Number,
      reason: String, // "damaged", "defective", "wrong_item", "overshipment"
      disposition: String, // "return_to_vendor", "scrap", "rework"
      returnDate: Date,
      returnedBy: ObjectId,
      vendorNotified: Boolean,
      vendorNotificationDate: Date,
      rmaNumber: String,
      notes: String
    }
  ],
  
  // Integration References
  integrations: {
    erpReceiptId: String,
    wmsReceiptId: String,
    accountingEntryId: String,
    lastSync: Date
  },
  
  // Audit Trail
  audit: {
    createdBy: ObjectId,
    createdAt: Date,
    updatedBy: ObjectId,
    updatedAt: Date,
    version: Number,
    
    // Receipt History
    history: [
      {
        action: String, // "created", "received", "inspected", "posted"
        date: Date,
        performedBy: ObjectId,
        notes: String
      }
    ]
  },
  
  notes: String,
  internalNotes: String
}
```

---


## Financial Management Schema

The Financial Management Schema handles all monetary transactions, payment processing, and financial reporting requirements, providing comprehensive tracking of cash flow, accounts receivable, and accounts payable operations.

### Payment Received Model

The Payment Received model tracks all incoming payments from customers, supporting multiple payment methods and complex payment scenarios including partial payments and payment allocations.

```javascript
// paymentsReceived collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  paymentNumber: String, // auto-generated unique identifier
  type: String, // "payment", "prepayment", "refund", "credit_memo_application"
  status: String, // "pending", "cleared", "bounced", "cancelled", "refunded"
  
  // Customer Information (denormalized)
  customer: {
    id: ObjectId,
    customerNumber: String,
    name: String,
    email: String
  },
  
  // Payment Information
  payment: {
    date: Date,
    amount: Number,
    currency: String,
    exchangeRate: Number,
    method: String, // "cash", "check", "credit_card", "ach", "wire", "paypal"
    reference: String, // check number, transaction ID, etc.
    
    // Payment Method Details
    details: {
      // For checks
      checkNumber: String,
      bankName: String,
      checkDate: Date,
      
      // For credit cards
      cardType: String, // "visa", "mastercard", "amex"
      lastFourDigits: String,
      authorizationCode: String,
      transactionId: String,
      
      // For ACH/Wire
      bankAccount: String, // masked
      routingNumber: String,
      wireReference: String,
      
      // For online payments
      gatewayTransactionId: String,
      gatewayResponse: String,
      processingFee: Number
    }
  },
  
  // Deposit Information
  deposit: {
    depositDate: Date,
    bankAccount: {
      id: ObjectId,
      name: String,
      accountNumber: String // masked
    },
    depositSlip: String,
    deposited: Boolean,
    depositedBy: ObjectId,
    clearingDate: Date,
    cleared: Boolean
  },
  
  // Payment Allocation
  allocations: [
    {
      id: ObjectId,
      type: String, // "invoice", "credit_memo", "prepayment", "overpayment"
      document: {
        id: ObjectId,
        number: String,
        type: String,
        date: Date,
        originalAmount: Number,
        outstandingAmount: Number
      },
      allocatedAmount: Number,
      discountTaken: Number,
      writeOffAmount: Number,
      allocationDate: Date,
      notes: String
    }
  ],
  
  // Unapplied Amount
  unapplied: {
    amount: Number,
    reason: String, // "overpayment", "prepayment", "unidentified"
    disposition: String // "credit_to_account", "refund", "hold"
  },
  
  // Processing Information
  processing: {
    processor: String, // "stripe", "square", "paypal", "authorize_net"
    processingFee: Number,
    netAmount: Number,
    processingDate: Date,
    settlementDate: Date,
    batchId: String,
    
    // Gateway Response
    gateway: {
      responseCode: String,
      responseMessage: String,
      avsResult: String,
      cvvResult: String,
      riskScore: Number
    }
  },
  
  // Reconciliation
  reconciliation: {
    reconciled: Boolean,
    reconciledDate: Date,
    reconciledBy: ObjectId,
    bankStatementDate: Date,
    bankReference: String,
    discrepancy: {
      amount: Number,
      reason: String,
      resolved: Boolean,
      resolution: String
    }
  },
  
  // Refund Information
  refund: {
    refunded: Boolean,
    refundDate: Date,
    refundAmount: Number,
    refundMethod: String,
    refundReference: String,
    refundReason: String,
    refundedBy: ObjectId,
    originalPaymentId: ObjectId
  },
  
  // Integration References
  integrations: {
    accountingEntryId: String,
    bankTransactionId: String,
    gatewayTransactionId: String,
    lastSync: Date
  },
  
  // Audit Trail
  audit: {
    createdBy: ObjectId,
    createdAt: Date,
    updatedBy: ObjectId,
    updatedAt: Date,
    version: Number,
    
    // Status History
    statusHistory: [
      {
        status: String,
        date: Date,
        changedBy: ObjectId,
        reason: String,
        notes: String
      }
    ]
  },
  
  notes: String,
  internalNotes: String
}
```

### Bill/Vendor Invoice Model

The Bill model handles all vendor invoices and bills, supporting complex approval workflows and detailed expense tracking.

```javascript
// bills collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  billNumber: String, // vendor's invoice number
  internalNumber: String, // our internal reference number
  type: String, // "invoice", "credit_memo", "debit_memo", "expense"
  status: String, // "draft", "pending_approval", "approved", "paid", "overdue", "disputed"
  
  // Vendor Information (denormalized)
  vendor: {
    id: ObjectId,
    vendorNumber: String,
    name: String,
    email: String,
    phone: String
  },
  
  // Purchase Order Reference
  purchaseOrder: {
    id: ObjectId,
    poNumber: String,
    totalAmount: Number
  },
  
  // Bill Dates
  dates: {
    billDate: Date,
    receivedDate: Date,
    dueDate: Date,
    paidDate: Date,
    approvedDate: Date,
    postedDate: Date
  },
  
  // Line Items
  lineItems: [
    {
      id: ObjectId,
      type: String, // "item", "service", "expense", "freight", "tax"
      
      // Item Information
      item: {
        id: ObjectId,
        sku: String,
        name: String,
        description: String,
        vendorSku: String
      },
      
      // Purchase Order Reference
      poLineId: ObjectId,
      receiptLineId: ObjectId,
      
      // Quantities and Pricing
      quantity: Number,
      unitCost: Number,
      totalCost: Number,
      
      // Tax Information
      taxable: Boolean,
      taxRate: Number,
      taxAmount: Number,
      taxCode: String,
      
      // Accounting
      account: {
        code: String,
        name: String,
        type: String // "expense", "asset", "cogs"
      },
      costCenter: String,
      project: String,
      department: String,
      
      // Approval
      approved: Boolean,
      approvedBy: ObjectId,
      approvedDate: Date,
      
      notes: String
    }
  ],
  
  // Financial Totals
  totals: {
    subtotal: Number,
    discountAmount: Number,
    taxAmount: Number,
    shippingAmount: Number,
    total: Number,
    paidAmount: Number,
    balanceDue: Number,
    currency: String,
    exchangeRate: Number
  },
  
  // Payment Terms
  payment: {
    terms: String, // "Net 30", "2/10 Net 30", "Due on Receipt"
    method: String, // "check", "ach", "wire", "credit_card"
    dueDate: Date,
    
    // Early Payment Discount
    discount: {
      available: Boolean,
      percent: Number,
      days: Number,
      amount: Number,
      discountDate: Date
    }
  },
  
  // Approval Workflow
  approval: {
    required: Boolean,
    status: String, // "pending", "approved", "rejected"
    totalLimit: Number,
    
    // Approval Chain
    approvers: [
      {
        level: Number,
        approver: {
          id: ObjectId,
          name: String,
          email: String
        },
        status: String, // "pending", "approved", "rejected"
        date: Date,
        comments: String,
        amountLimit: Number
      }
    ],
    
    // Approval Rules
    rules: {
      amountThreshold: Number,
      departmentApproval: Boolean,
      budgetApproval: Boolean,
      poMatchRequired: Boolean,
      receiptMatchRequired: Boolean
    }
  },
  
  // Three-Way Matching
  matching: {
    poMatched: Boolean,
    receiptMatched: Boolean,
    priceMatched: Boolean,
    quantityMatched: Boolean,
    
    // Variances
    variances: [
      {
        type: String, // "price", "quantity", "tax", "freight"
        lineItemId: ObjectId,
        expected: Number,
        actual: Number,
        variance: Number,
        variancePercent: Number,
        tolerance: Number,
        withinTolerance: Boolean,
        reason: String
      }
    ]
  },
  
  // Budget and Cost Allocation
  budget: {
    budgetYear: Number,
    costCenter: String,
    department: String,
    project: String,
    budgetCode: String,
    
    // Budget Impact
    budgetAmount: Number,
    spentToDate: Number,
    remainingBudget: Number,
    overBudget: Boolean,
    overBudgetAmount: Number
  },
  
  // Document Management
  documents: {
    originalInvoice: {
      filename: String,
      url: String,
      uploadedDate: Date,
      uploadedBy: ObjectId
    },
    supportingDocs: [
      {
        type: String, // "receipt", "contract", "po", "email"
        filename: String,
        url: String,
        uploadedDate: Date,
        uploadedBy: ObjectId
      }
    ]
  },
  
  // Dispute Management
  dispute: {
    disputed: Boolean,
    disputeDate: Date,
    disputedBy: ObjectId,
    reason: String, // "pricing", "quantity", "quality", "unauthorized"
    description: String,
    status: String, // "open", "resolved", "escalated"
    resolution: String,
    resolvedDate: Date,
    resolvedBy: ObjectId,
    
    // Communication Log
    communications: [
      {
        date: Date,
        type: String, // "email", "phone", "meeting"
        contact: String,
        summary: String,
        followUpRequired: Boolean,
        followUpDate: Date
      }
    ]
  },
  
  // Recurring Bill Information
  recurring: {
    isRecurring: Boolean,
    frequency: String, // "monthly", "quarterly", "annually"
    nextBillDate: Date,
    endDate: Date,
    remainingBills: Number,
    parentBillId: ObjectId,
    
    // Auto-processing
    autoApprove: Boolean,
    autoPost: Boolean,
    autoPay: Boolean
  },
  
  // Integration References
  integrations: {
    accountingBillId: String,
    erpBillId: String,
    ocrProcessingId: String,
    lastSync: Date,
    syncStatus: String
  },
  
  // OCR and Data Extraction
  ocr: {
    processed: Boolean,
    processedDate: Date,
    confidence: Number,
    extractedData: {
      vendorName: String,
      billNumber: String,
      billDate: Date,
      dueDate: Date,
      total: Number,
      lineItems: [
        {
          description: String,
          quantity: Number,
          unitPrice: Number,
          total: Number,
          confidence: Number
        }
      ]
    },
    
    // Manual Review
    reviewRequired: Boolean,
    reviewedBy: ObjectId,
    reviewedDate: Date,
    corrections: [
      {
        field: String,
        originalValue: String,
        correctedValue: String,
        correctedBy: ObjectId,
        correctedDate: Date
      }
    ]
  },
  
  // Audit Trail
  audit: {
    createdBy: ObjectId,
    createdAt: Date,
    updatedBy: ObjectId,
    updatedAt: Date,
    version: Number,
    
    // Change History
    changes: [
      {
        field: String,
        oldValue: String,
        newValue: String,
        changedBy: ObjectId,
        changedAt: Date,
        reason: String
      }
    ],
    
    // Status History
    statusHistory: [
      {
        status: String,
        date: Date,
        changedBy: ObjectId,
        notes: String
      }
    ]
  },
  
  notes: String,
  internalNotes: String,
  tags: [String]
}
```

### Payment Made Model

The Payment Made model tracks all outgoing payments to vendors, supporting various payment methods and detailed payment processing workflows.

```javascript
// paymentsMade collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  paymentNumber: String, // auto-generated unique identifier
  type: String, // "payment", "prepayment", "refund", "expense_reimbursement"
  status: String, // "draft", "pending", "sent", "cleared", "cancelled", "returned"
  
  // Vendor Information (denormalized)
  vendor: {
    id: ObjectId,
    vendorNumber: String,
    name: String,
    email: String,
    phone: String
  },
  
  // Payment Information
  payment: {
    date: Date,
    amount: Number,
    currency: String,
    exchangeRate: Number,
    method: String, // "check", "ach", "wire", "credit_card", "cash"
    reference: String, // check number, wire reference, etc.
    
    // Payment Method Details
    details: {
      // For checks
      checkNumber: String,
      checkDate: Date,
      bankAccount: {
        id: ObjectId,
        name: String,
        accountNumber: String // masked
      },
      printed: Boolean,
      printedDate: Date,
      mailed: Boolean,
      mailedDate: Date,
      
      // For ACH
      achBatchId: String,
      achTraceNumber: String,
      achEffectiveDate: Date,
      
      // For wire transfers
      wireReference: String,
      wireInstructions: String,
      wireFee: Number,
      
      // For credit card
      cardType: String,
      lastFourDigits: String,
      authorizationCode: String,
      transactionId: String
    }
  },
  
  // Bank Account Information
  bankAccount: {
    id: ObjectId,
    name: String,
    accountNumber: String, // masked
    routingNumber: String,
    balance: Number,
    balanceAfterPayment: Number
  },
  
  // Payment Allocation
  allocations: [
    {
      id: ObjectId,
      bill: {
        id: ObjectId,
        billNumber: String,
        billDate: Date,
        originalAmount: Number,
        outstandingAmount: Number
      },
      allocatedAmount: Number,
      discountTaken: Number,
      discountAmount: Number,
      allocationDate: Date,
      notes: String
    }
  ],
  
  // Approval Workflow
  approval: {
    required: Boolean,
    status: String, // "pending", "approved", "rejected"
    approvalLimit: Number,
    
    // Approval Chain
    approvers: [
      {
        level: Number,
        approver: {
          id: ObjectId,
          name: String,
          email: String
        },
        status: String, // "pending", "approved", "rejected"
        date: Date,
        comments: String
      }
    ]
  },
  
  // Processing Information
  processing: {
    processor: String, // "bank", "payment_service", "internal"
    processingFee: Number,
    processingDate: Date,
    settlementDate: Date,
    batchId: String,
    
    // Processing Status
    processingStatus: String, // "pending", "processing", "completed", "failed"
    failureReason: String,
    retryCount: Number,
    lastRetryDate: Date
  },
  
  // Reconciliation
  reconciliation: {
    reconciled: Boolean,
    reconciledDate: Date,
    reconciledBy: ObjectId,
    bankStatementDate: Date,
    bankReference: String,
    clearedDate: Date,
    
    // Discrepancies
    discrepancy: {
      amount: Number,
      reason: String,
      resolved: Boolean,
      resolution: String,
      resolvedBy: ObjectId,
      resolvedDate: Date
    }
  },
  
  // Return/Reversal Information
  return: {
    returned: Boolean,
    returnDate: Date,
    returnReason: String, // "insufficient_funds", "account_closed", "stop_payment"
    returnCode: String,
    returnFee: Number,
    reissued: Boolean,
    reissuedPaymentId: ObjectId
  },
  
  // Void Information
  void: {
    voided: Boolean,
    voidDate: Date,
    voidReason: String,
    voidedBy: ObjectId,
    replacementPaymentId: ObjectId
  },
  
  // Integration References
  integrations: {
    accountingEntryId: String,
    bankTransactionId: String,
    paymentProcessorId: String,
    lastSync: Date,
    syncStatus: String
  },
  
  // Audit Trail
  audit: {
    createdBy: ObjectId,
    createdAt: Date,
    updatedBy: ObjectId,
    updatedAt: Date,
    version: Number,
    
    // Status History
    statusHistory: [
      {
        status: String,
        date: Date,
        changedBy: ObjectId,
        reason: String,
        notes: String
      }
    ]
  },
  
  notes: String,
  internalNotes: String
}
```

---


## Reporting and Analytics Schema

The Reporting and Analytics Schema provides the foundation for comprehensive business intelligence, KPI tracking, and data-driven decision making through optimized data structures and pre-calculated metrics.

### Analytics Snapshot Model

The Analytics Snapshot model stores pre-calculated metrics and KPIs for different time periods, enabling fast dashboard loading and historical trend analysis.

```javascript
// analyticsSnapshots collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  snapshotType: String, // "daily", "weekly", "monthly", "quarterly", "yearly"
  period: {
    start: Date,
    end: Date,
    year: Number,
    quarter: Number,
    month: Number,
    week: Number,
    day: Number
  },
  
  // Inventory Metrics
  inventory: {
    // Stock Levels
    totalItems: Number,
    totalValue: Number,
    totalQuantity: Number,
    lowStockItems: Number,
    outOfStockItems: Number,
    overstockItems: Number,
    
    // Turnover Metrics
    inventoryTurnover: Number,
    daysOnHand: Number,
    weeksOnHand: Number,
    stockToSalesRatio: Number,
    
    // Performance Metrics
    fillRate: Number,
    stockoutRate: Number,
    backorderRate: Number,
    demandForecastAccuracy: Number,
    
    // Financial Metrics
    carryingCost: Number,
    shrinkageValue: Number,
    deadStockValue: Number,
    grossMarginROI: Number,
    
    // Movement Analysis
    fastMovingItems: Number,
    slowMovingItems: Number,
    deadStockItems: Number,
    newItems: Number,
    discontinuedItems: Number,
    
    // Category Breakdown
    byCategory: [
      {
        categoryId: ObjectId,
        categoryName: String,
        itemCount: Number,
        totalValue: Number,
        turnoverRate: Number,
        marginPercent: Number
      }
    ],
    
    // Warehouse Breakdown
    byWarehouse: [
      {
        warehouseId: ObjectId,
        warehouseName: String,
        itemCount: Number,
        totalValue: Number,
        utilizationPercent: Number,
        inboundVolume: Number,
        outboundVolume: Number
      }
    ]
  },
  
  // Sales Metrics
  sales: {
    // Revenue Metrics
    totalRevenue: Number,
    grossProfit: Number,
    grossMargin: Number,
    averageOrderValue: Number,
    revenuePerCustomer: Number,
    
    // Order Metrics
    totalOrders: Number,
    newOrders: Number,
    cancelledOrders: Number,
    returnedOrders: Number,
    averageOrderSize: Number,
    
    // Customer Metrics
    totalCustomers: Number,
    newCustomers: Number,
    activeCustomers: Number,
    customerRetentionRate: Number,
    customerLifetimeValue: Number,
    
    // Performance Metrics
    orderFulfillmentRate: Number,
    onTimeDeliveryRate: Number,
    perfectOrderRate: Number,
    orderCycleTime: Number,
    
    // Product Performance
    topSellingItems: [
      {
        itemId: ObjectId,
        itemName: String,
        quantitySold: Number,
        revenue: Number,
        profit: Number,
        marginPercent: Number
      }
    ],
    
    // Sales Channel Breakdown
    byChannel: [
      {
        channel: String, // "online", "retail", "wholesale", "partner"
        revenue: Number,
        orders: Number,
        averageOrderValue: Number,
        marginPercent: Number
      }
    ],
    
    // Sales Rep Performance
    bySalesRep: [
      {
        salesRepId: ObjectId,
        salesRepName: String,
        revenue: Number,
        orders: Number,
        customers: Number,
        commission: Number
      }
    ]
  },
  
  // Purchase Metrics
  purchases: {
    // Spending Metrics
    totalSpend: Number,
    averageOrderValue: Number,
    costSavings: Number,
    earlyPaymentDiscounts: Number,
    
    // Order Metrics
    totalPurchaseOrders: Number,
    onTimeDeliveries: Number,
    qualityIssues: Number,
    returnedItems: Number,
    
    // Vendor Performance
    totalVendors: Number,
    activeVendors: Number,
    preferredVendors: Number,
    averageLeadTime: Number,
    
    // Performance Metrics
    onTimeDeliveryRate: Number,
    qualityRate: Number,
    priceVariance: Number,
    orderAccuracy: Number,
    
    // Top Vendors
    topVendors: [
      {
        vendorId: ObjectId,
        vendorName: String,
        totalSpend: Number,
        orders: Number,
        onTimeDelivery: Number,
        qualityRating: Number
      }
    ],
    
    // Category Spending
    byCategory: [
      {
        categoryId: ObjectId,
        categoryName: String,
        totalSpend: Number,
        orders: Number,
        averageLeadTime: Number,
        qualityIssues: Number
      }
    ]
  },
  
  // Financial Metrics
  financial: {
    // Revenue Metrics
    totalRevenue: Number,
    grossProfit: Number,
    netProfit: Number,
    profitMargin: Number,
    
    // Cash Flow
    cashInflow: Number,
    cashOutflow: Number,
    netCashFlow: Number,
    operatingCashFlow: Number,
    
    // Accounts Receivable
    totalReceivables: Number,
    currentReceivables: Number,
    overdueReceivables: Number,
    averageCollectionPeriod: Number,
    daysInReceivables: Number,
    
    // Accounts Payable
    totalPayables: Number,
    currentPayables: Number,
    overduePayables: Number,
    averagePaymentPeriod: Number,
    daysInPayables: Number,
    
    // Working Capital
    workingCapital: Number,
    currentRatio: Number,
    quickRatio: Number,
    inventoryToWorkingCapital: Number,
    
    // Payment Performance
    onTimePayments: Number,
    latePayments: Number,
    averagePaymentTime: Number,
    earlyPaymentDiscounts: Number
  },
  
  // Operational Metrics
  operations: {
    // Warehouse Operations
    inboundVolume: Number,
    outboundVolume: Number,
    pickingAccuracy: Number,
    packingEfficiency: Number,
    shippingCost: Number,
    
    // Order Processing
    orderProcessingTime: Number,
    pickingTime: Number,
    packingTime: Number,
    shippingTime: Number,
    
    // Quality Metrics
    defectRate: Number,
    returnRate: Number,
    customerComplaints: Number,
    qualityScore: Number,
    
    // Productivity Metrics
    ordersPerEmployee: Number,
    revenuePerEmployee: Number,
    itemsProcessedPerHour: Number,
    costPerOrder: Number
  },
  
  // Trend Analysis
  trends: {
    revenueGrowth: Number, // percentage change from previous period
    profitGrowth: Number,
    customerGrowth: Number,
    inventoryGrowth: Number,
    orderGrowth: Number,
    
    // Seasonal Factors
    seasonalityIndex: Number,
    trendDirection: String, // "up", "down", "stable"
    volatility: Number,
    
    // Forecasts
    nextPeriodRevenue: Number,
    nextPeriodOrders: Number,
    nextPeriodInventoryNeed: Number
  },
  
  // Comparative Analysis
  comparisons: {
    previousPeriod: {
      revenueChange: Number,
      profitChange: Number,
      orderChange: Number,
      customerChange: Number
    },
    yearOverYear: {
      revenueChange: Number,
      profitChange: Number,
      orderChange: Number,
      customerChange: Number
    },
    budgetVsActual: {
      revenueBudget: Number,
      revenueActual: Number,
      revenueVariance: Number,
      profitBudget: Number,
      profitActual: Number,
      profitVariance: Number
    }
  },
  
  // Data Quality
  dataQuality: {
    recordsProcessed: Number,
    dataCompleteness: Number, // percentage
    dataAccuracy: Number, // percentage
    lastUpdated: Date,
    processingTime: Number, // milliseconds
    errors: [String]
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

### Report Definition Model

The Report Definition model stores custom report configurations, enabling users to create, save, and share custom reports and dashboards.

```javascript
// reportDefinitions collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,
  description: String,
  type: String, // "tabular", "chart", "dashboard", "kpi"
  category: String, // "inventory", "sales", "financial", "operational"
  
  // Report Configuration
  configuration: {
    // Data Source
    dataSource: String, // "items", "sales_orders", "customers", "vendors"
    
    // Filters
    filters: [
      {
        field: String,
        operator: String, // "equals", "contains", "greater_than", "between"
        value: String,
        dataType: String // "string", "number", "date", "boolean"
      }
    ],
    
    // Columns/Fields
    columns: [
      {
        field: String,
        label: String,
        dataType: String,
        format: String, // "currency", "percentage", "date"
        aggregation: String, // "sum", "count", "average", "min", "max"
        sortOrder: Number,
        sortDirection: String, // "asc", "desc"
        width: Number,
        visible: Boolean
      }
    ],
    
    // Grouping
    groupBy: [
      {
        field: String,
        label: String,
        sortDirection: String
      }
    ],
    
    // Sorting
    sortBy: [
      {
        field: String,
        direction: String // "asc", "desc"
      }
    ],
    
    // Pagination
    pagination: {
      enabled: Boolean,
      pageSize: Number,
      maxRecords: Number
    },
    
    // Chart Configuration (for chart reports)
    chart: {
      type: String, // "bar", "line", "pie", "donut", "area", "scatter"
      xAxis: String,
      yAxis: [String],
      series: [
        {
          field: String,
          label: String,
          color: String,
          type: String // "bar", "line"
        }
      ],
      options: {
        showLegend: Boolean,
        showDataLabels: Boolean,
        showGrid: Boolean,
        stacked: Boolean,
        height: Number,
        width: Number
      }
    },
    
    // KPI Configuration (for KPI reports)
    kpi: {
      metric: String,
      target: Number,
      format: String,
      comparison: {
        enabled: Boolean,
        period: String, // "previous_period", "year_over_year"
        showVariance: Boolean,
        showPercentChange: Boolean
      },
      thresholds: [
        {
          value: Number,
          color: String,
          label: String
        }
      ]
    }
  },
  
  // Scheduling
  schedule: {
    enabled: Boolean,
    frequency: String, // "daily", "weekly", "monthly"
    time: String, // "09:00"
    dayOfWeek: Number, // 1-7 for weekly
    dayOfMonth: Number, // 1-31 for monthly
    timezone: String,
    
    // Recipients
    recipients: [
      {
        userId: ObjectId,
        email: String,
        format: String // "pdf", "excel", "csv"
      }
    ],
    
    // Last Execution
    lastRun: Date,
    nextRun: Date,
    lastStatus: String, // "success", "failed"
    lastError: String
  },
  
  // Permissions
  permissions: {
    owner: ObjectId,
    isPublic: Boolean,
    
    // Shared Users
    sharedWith: [
      {
        userId: ObjectId,
        permission: String, // "view", "edit", "admin"
        sharedDate: Date,
        sharedBy: ObjectId
      }
    ],
    
    // Role-based Access
    roles: [
      {
        role: String,
        permission: String
      }
    ]
  },
  
  // Usage Statistics
  usage: {
    viewCount: Number,
    lastViewed: Date,
    lastViewedBy: ObjectId,
    executionCount: Number,
    lastExecuted: Date,
    averageExecutionTime: Number,
    
    // Popular Filters
    popularFilters: [
      {
        filter: String,
        usageCount: Number
      }
    ]
  },
  
  // Version Control
  version: {
    current: Number,
    history: [
      {
        version: Number,
        changes: String,
        changedBy: ObjectId,
        changedAt: Date,
        configuration: Object // snapshot of configuration
      }
    ]
  },
  
  // Tags and Categorization
  tags: [String],
  isFavorite: Boolean,
  isTemplate: Boolean,
  templateCategory: String,
  
  status: String, // "active", "inactive", "archived"
  createdBy: ObjectId,
  createdAt: Date,
  updatedBy: ObjectId,
  updatedAt: Date
}
```

### Dashboard Widget Model

The Dashboard Widget model defines individual dashboard components that can be arranged and configured by users to create personalized dashboards.

```javascript
// dashboardWidgets collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  dashboardId: ObjectId, // reference to dashboard
  name: String,
  type: String, // "kpi", "chart", "table", "gauge", "map", "text"
  
  // Widget Configuration
  configuration: {
    // Data Source
    dataSource: String,
    refreshInterval: Number, // minutes
    
    // KPI Widget
    kpi: {
      metric: String,
      value: Number,
      target: Number,
      format: String, // "currency", "number", "percentage"
      comparison: {
        previousValue: Number,
        change: Number,
        changePercent: Number,
        trend: String // "up", "down", "stable"
      },
      thresholds: [
        {
          min: Number,
          max: Number,
          color: String,
          label: String
        }
      ]
    },
    
    // Chart Widget
    chart: {
      type: String, // "line", "bar", "pie", "donut", "area"
      data: [
        {
          label: String,
          value: Number,
          color: String
        }
      ],
      options: {
        showLegend: Boolean,
        showDataLabels: Boolean,
        showGrid: Boolean,
        height: Number,
        animation: Boolean
      }
    },
    
    // Table Widget
    table: {
      columns: [
        {
          field: String,
          label: String,
          format: String,
          width: Number
        }
      ],
      data: [Object],
      pagination: {
        enabled: Boolean,
        pageSize: Number
      },
      sorting: {
        enabled: Boolean,
        defaultSort: String
      }
    },
    
    // Gauge Widget
    gauge: {
      value: Number,
      min: Number,
      max: Number,
      target: Number,
      format: String,
      color: String,
      showTarget: Boolean,
      showValue: Boolean
    }
  },
  
  // Layout Properties
  layout: {
    x: Number, // grid position
    y: Number,
    width: Number, // grid units
    height: Number,
    minWidth: Number,
    minHeight: Number,
    maxWidth: Number,
    maxHeight: Number,
    isDraggable: Boolean,
    isResizable: Boolean
  },
  
  // Display Properties
  display: {
    title: String,
    showTitle: Boolean,
    showBorder: Boolean,
    backgroundColor: String,
    textColor: String,
    fontSize: String,
    
    // Conditional Formatting
    conditionalFormatting: [
      {
        condition: String,
        format: {
          backgroundColor: String,
          textColor: String,
          fontWeight: String
        }
      }
    ]
  },
  
  // Data Refresh
  dataRefresh: {
    lastRefresh: Date,
    nextRefresh: Date,
    autoRefresh: Boolean,
    refreshInterval: Number, // minutes
    refreshStatus: String, // "success", "failed", "pending"
    refreshError: String
  },
  
  // Filters
  filters: [
    {
      field: String,
      operator: String,
      value: String,
      isUserFilter: Boolean // can be modified by user
    }
  ],
  
  // Drill-down Configuration
  drillDown: {
    enabled: Boolean,
    targetReport: ObjectId,
    parameters: [
      {
        sourceField: String,
        targetParameter: String
      }
    ]
  },
  
  // Alerts
  alerts: [
    {
      id: ObjectId,
      name: String,
      condition: String,
      threshold: Number,
      operator: String, // "greater_than", "less_than", "equals"
      enabled: Boolean,
      
      // Notification Settings
      notifications: [
        {
          type: String, // "email", "sms", "push"
          recipients: [String],
          template: String
        }
      ],
      
      // Alert History
      lastTriggered: Date,
      triggerCount: Number
    }
  ],
  
  // Permissions
  permissions: {
    viewUsers: [ObjectId],
    editUsers: [ObjectId],
    isPublic: Boolean
  },
  
  // Usage Analytics
  analytics: {
    viewCount: Number,
    lastViewed: Date,
    averageViewTime: Number,
    interactionCount: Number,
    
    // User Interactions
    interactions: [
      {
        type: String, // "click", "hover", "filter"
        timestamp: Date,
        userId: ObjectId,
        details: Object
      }
    ]
  },
  
  isActive: Boolean,
  sortOrder: Number,
  createdBy: ObjectId,
  createdAt: Date,
  updatedBy: ObjectId,
  updatedAt: Date
}
```

---


## User Management and Authentication

The User Management and Authentication system provides comprehensive security, role-based access control, and detailed activity tracking to ensure data security and compliance requirements.

### Session Management Model

```javascript
// sessions collection
{
  _id: ObjectId,
  userId: ObjectId,
  organizationId: ObjectId,
  sessionToken: String, // encrypted
  refreshToken: String, // encrypted
  
  // Session Information
  createdAt: Date,
  expiresAt: Date,
  lastActivity: Date,
  isActive: Boolean,
  
  // Device and Location
  device: {
    userAgent: String,
    browser: String,
    os: String,
    deviceType: String, // "desktop", "mobile", "tablet"
    ipAddress: String,
    location: {
      country: String,
      region: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  
  // Security
  security: {
    isTrusted: Boolean,
    riskScore: Number,
    loginMethod: String, // "password", "sso", "2fa"
    mfaVerified: Boolean,
    suspiciousActivity: Boolean
  }
}
```

### Activity Log Model

```javascript
// activityLogs collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  userId: ObjectId,
  userName: String,
  
  // Activity Information
  action: String, // "create", "read", "update", "delete", "login", "logout"
  resource: String, // "item", "customer", "order", "invoice"
  resourceId: ObjectId,
  resourceName: String,
  
  // Details
  details: {
    changes: [
      {
        field: String,
        oldValue: String,
        newValue: String
      }
    ],
    metadata: Object,
    userAgent: String,
    ipAddress: String
  },
  
  // Context
  context: {
    module: String, // "inventory", "sales", "purchases"
    feature: String, // "item_management", "order_processing"
    sessionId: ObjectId
  },
  
  timestamp: Date,
  severity: String // "info", "warning", "error", "critical"
}
```

## System Configuration and Settings

### System Settings Model

```javascript
// systemSettings collection
{
  _id: ObjectId,
  organizationId: ObjectId,
  category: String, // "general", "inventory", "sales", "purchases", "financial"
  
  settings: {
    // General Settings
    general: {
      companyName: String,
      timezone: String,
      dateFormat: String,
      numberFormat: String,
      currency: String,
      language: String,
      fiscalYearStart: String
    },
    
    // Inventory Settings
    inventory: {
      defaultCostMethod: String, // "FIFO", "LIFO", "Average"
      autoReorderEnabled: Boolean,
      lowStockThreshold: Number,
      negativeInventoryAllowed: Boolean,
      serialNumberTracking: Boolean,
      batchTracking: Boolean,
      expirationTracking: Boolean,
      multiLocationEnabled: Boolean,
      barcodeScanningEnabled: Boolean
    },
    
    // Sales Settings
    sales: {
      autoOrderNumbering: Boolean,
      orderNumberPrefix: String,
      orderNumberLength: Number,
      defaultPaymentTerms: String,
      defaultShippingMethod: String,
      taxCalculationMethod: String,
      discountCalculationMethod: String,
      backorderHandling: String, // "allow", "substitute", "cancel"
      creditLimitChecking: Boolean
    },
    
    // Purchase Settings
    purchases: {
      autoPoNumbering: Boolean,
      poNumberPrefix: String,
      poNumberLength: Number,
      defaultPaymentTerms: String,
      approvalWorkflowEnabled: Boolean,
      threeWayMatchingRequired: Boolean,
      receiptRequiredForPayment: Boolean,
      autoCreateReceiptsFromPos: Boolean
    },
    
    // Financial Settings
    financial: {
      autoInvoiceNumbering: Boolean,
      invoiceNumberPrefix: String,
      invoiceNumberLength: Number,
      defaultPaymentTerms: String,
      lateFeeEnabled: Boolean,
      lateFeePercent: Number,
      earlyPaymentDiscountEnabled: Boolean,
      multiCurrencyEnabled: Boolean,
      defaultCurrency: String
    },
    
    // Integration Settings
    integrations: {
      accounting: {
        enabled: Boolean,
        provider: String, // "quickbooks", "xero", "sage"
        syncFrequency: String,
        lastSync: Date
      },
      ecommerce: {
        enabled: Boolean,
        platforms: [String],
        syncInventory: Boolean,
        syncOrders: Boolean
      },
      shipping: {
        enabled: Boolean,
        carriers: [String],
        defaultCarrier: String,
        rateShoppingEnabled: Boolean
      }
    },
    
    // Security Settings
    security: {
      passwordPolicy: {
        minLength: Number,
        requireUppercase: Boolean,
        requireLowercase: Boolean,
        requireNumbers: Boolean,
        requireSpecialChars: Boolean,
        expirationDays: Number
      },
      sessionTimeout: Number, // minutes
      maxLoginAttempts: Number,
      lockoutDuration: Number, // minutes
      twoFactorRequired: Boolean,
      ipWhitelisting: Boolean,
      allowedIpRanges: [String]
    },
    
    // Notification Settings
    notifications: {
      email: {
        enabled: Boolean,
        smtpServer: String,
        smtpPort: Number,
        smtpUsername: String,
        smtpPassword: String, // encrypted
        fromAddress: String,
        fromName: String
      },
      sms: {
        enabled: Boolean,
        provider: String,
        apiKey: String, // encrypted
        fromNumber: String
      },
      push: {
        enabled: Boolean,
        provider: String,
        apiKey: String // encrypted
      }
    }
  },
  
  updatedBy: ObjectId,
  updatedAt: Date,
  version: Number
}
```

## Data Relationships and Integrity

### Referential Integrity Rules

The database schema maintains data integrity through carefully designed relationships and constraints:

**Primary Relationships:**
- Organizations → Users (1:N)
- Organizations → Items (1:N)
- Organizations → Customers (1:N)
- Organizations → Vendors (1:N)
- Organizations → Warehouses (1:N)
- Customers → Sales Orders (1:N)
- Sales Orders → Invoices (1:N)
- Vendors → Purchase Orders (1:N)
- Purchase Orders → Purchase Receipts (1:N)
- Invoices → Payments Received (1:N)
- Bills → Payments Made (1:N)

**Embedded Relationships:**
- Sales Orders embed customer information for performance
- Invoices embed customer and order information
- Purchase Orders embed vendor information
- All transactional documents embed item information

**Reference Integrity:**
- All foreign key references include validation
- Soft deletes preserve referential integrity
- Cascade rules defined for dependent data
- Orphan record prevention through application logic

### Data Validation Rules

**Business Logic Validation:**
- Inventory quantities cannot go negative (unless configured)
- Order totals must match line item sums
- Payment allocations cannot exceed invoice amounts
- Purchase receipt quantities cannot exceed order quantities
- Credit limits enforced on customer orders
- Budget limits enforced on purchase orders

**Data Type Validation:**
- Email format validation
- Phone number format validation
- Currency amount precision (2 decimal places)
- Date range validation
- Enum value validation for status fields

## Performance Optimization Strategies

### Indexing Strategy

**Primary Indexes:**
```javascript
// Core entity indexes
db.items.createIndex({ "organizationId": 1, "sku": 1 }, { unique: true })
db.customers.createIndex({ "organizationId": 1, "customerNumber": 1 }, { unique: true })
db.vendors.createIndex({ "organizationId": 1, "vendorNumber": 1 }, { unique: true })

// Transactional document indexes
db.salesOrders.createIndex({ "organizationId": 1, "orderNumber": 1 }, { unique: true })
db.salesOrders.createIndex({ "organizationId": 1, "customer.id": 1, "dates.orderDate": -1 })
db.invoices.createIndex({ "organizationId": 1, "invoiceNumber": 1 }, { unique: true })
db.invoices.createIndex({ "organizationId": 1, "status": 1, "dates.dueDate": 1 })

// Search and filter indexes
db.items.createIndex({ "organizationId": 1, "name": "text", "description": "text", "sku": "text" })
db.customers.createIndex({ "organizationId": 1, "profile.displayName": "text", "profile.email": "text" })

// Performance indexes
db.salesOrders.createIndex({ "organizationId": 1, "status": 1, "dates.orderDate": -1 })
db.items.createIndex({ "organizationId": 1, "inventory.currentStock": 1, "inventory.reorderPoint": 1 })
db.analyticsSnapshots.createIndex({ "organizationId": 1, "snapshotType": 1, "period.start": -1 })
```

**Compound Indexes for Common Queries:**
```javascript
// Dashboard queries
db.salesOrders.createIndex({ 
  "organizationId": 1, 
  "dates.orderDate": -1, 
  "status": 1, 
  "totals.total": -1 
})

// Inventory management queries
db.items.createIndex({ 
  "organizationId": 1, 
  "category.id": 1, 
  "inventory.currentStock": 1, 
  "status": 1 
})

// Financial reporting queries
db.invoices.createIndex({ 
  "organizationId": 1, 
  "dates.invoiceDate": -1, 
  "status": 1, 
  "totals.balanceDue": -1 
})
```

### Query Optimization

**Aggregation Pipeline Optimization:**
- Use `$match` early in pipelines to reduce document processing
- Leverage indexes in `$match` and `$sort` stages
- Use `$project` to limit field selection
- Implement `$limit` for pagination
- Cache frequently used aggregation results

**Read Optimization:**
- Denormalize frequently accessed data
- Use projection to limit returned fields
- Implement proper pagination with skip/limit
- Cache dashboard data in analytics snapshots
- Use read preferences for reporting queries

**Write Optimization:**
- Batch insert operations where possible
- Use upsert operations for idempotent updates
- Implement proper transaction boundaries
- Use write concerns appropriate for data criticality
- Queue non-critical updates for background processing

### Caching Strategy

**Application-Level Caching:**
- Cache user sessions and permissions
- Cache frequently accessed configuration data
- Cache dashboard widget data with TTL
- Cache search results for common queries
- Implement cache invalidation on data changes

**Database-Level Optimization:**
- Use MongoDB's WiredTiger cache effectively
- Configure appropriate working set size
- Implement read replicas for reporting workloads
- Use sharding for horizontal scaling
- Monitor and optimize slow queries

### Data Archival Strategy

**Historical Data Management:**
- Archive completed orders older than 7 years
- Maintain summary data in analytics snapshots
- Implement data retention policies by document type
- Use separate collections for archived data
- Provide archive data access through reporting interface

**Cleanup Procedures:**
- Regular cleanup of expired sessions
- Purge old activity logs based on retention policy
- Remove orphaned documents through scheduled jobs
- Compress historical data for storage efficiency
- Maintain audit trails for compliance requirements

---

## Conclusion

This comprehensive database schema for the Invenio inventory management system provides a robust foundation for a modern SaaS application. The design balances performance, scalability, and functionality while maintaining data integrity and supporting complex business requirements.

The schema supports all core inventory management functions including multi-location inventory tracking, complex pricing structures, comprehensive order management, detailed financial tracking, and extensive reporting capabilities. The modular design allows for independent scaling of different system components while maintaining consistency across the entire application.

Key strengths of this design include:

- **Scalability**: Multi-tenant architecture with organization-based data isolation
- **Performance**: Strategic denormalization and comprehensive indexing strategy
- **Flexibility**: Support for various business models and operational requirements
- **Compliance**: Comprehensive audit trails and data retention capabilities
- **Integration**: Designed for seamless integration with external systems
- **Analytics**: Built-in support for business intelligence and reporting

The schema provides the technical foundation needed to build a competitive inventory management system that can serve businesses of all sizes while maintaining the performance and reliability expected from modern SaaS applications.

---

*This document represents the complete database schema design for the Invenio inventory management system, incorporating best practices from modern inventory management platforms and optimized for MongoDB document database architecture.*

