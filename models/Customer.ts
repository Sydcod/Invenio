import mongoose, { Schema, Document } from 'mongoose';
import toJSON from './plugins/toJSON';

export interface ICustomer extends Document {
  customerNumber: string;
  type: 'B2B' | 'B2C';
  
  // Basic Information
  name: string;
  email: string;
  phone?: string;
  alternateEmails?: string[];
  alternatePhones?: string[];
  
  // B2B Specific Fields
  company?: string;
  companyType?: string;
  taxId?: string;
  website?: string;
  industry?: string;
  
  // Contact Person (for B2B)
  contactPerson?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  
  // Addresses
  billingAddress: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  shippingAddresses?: Array<{
    name?: string;
    isDefault?: boolean;
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  }>;
  
  // Financial Information
  creditLimit?: number;
  currentBalance?: number;
  paymentTerms?: string;
  preferredPaymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'check' | 'online' | 'credit' | 'other';
  taxExempt?: boolean;
  taxExemptId?: string;
  discountRate?: number;
  
  // Purchase Metrics
  metrics: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date;
    firstOrderDate?: Date;
    totalReturns: number;
    totalRefunds: number;
    lifetimeValue: number;
  };
  
  // Preferences
  preferences: {
    communication: {
      emailMarketing: boolean;
      smsMarketing: boolean;
      phoneMarketing: boolean;
    };
    shipping: {
      preferredCarrier?: string;
      preferredMethod?: string;
      deliveryInstructions?: string;
    };
    invoicing: {
      sendInvoiceBy: 'email' | 'mail' | 'both' | 'none';
      consolidateInvoices: boolean;
    };
  };
  
  // Loyalty & Rewards
  loyalty?: {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    points: number;
    memberSince: Date;
    expirationDate?: Date;
  };
  
  // Status & Metadata
  status: 'active' | 'inactive' | 'blocked' | 'suspended';
  blacklistReason?: string;
  rating?: number;
  tags?: string[];
  notes?: string;
  internalNotes?: string;
  source?: 'pos' | 'online' | 'phone' | 'email' | 'sales_rep' | 'api' | 'import';
  referredBy?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    customerNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['B2B', 'B2C'],
      required: true,
    },
    
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    alternateEmails: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    alternatePhones: [{
      type: String,
      trim: true,
    }],
    
    // B2B Specific
    company: {
      type: String,
      trim: true,
    },
    companyType: {
      type: String,
      trim: true,
    },
    taxId: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    
    // Contact Person
    contactPerson: {
      name: String,
      title: String,
      email: {
        type: String,
        lowercase: true,
      },
      phone: String,
    },
    
    // Addresses
    billingAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: String,
      country: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
    },
    shippingAddresses: [{
      name: String,
      isDefault: {
        type: Boolean,
        default: false,
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: String,
      country: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
    }],
    
    // Financial
    creditLimit: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    paymentTerms: {
      type: String,
      default: 'Due on Receipt',
    },
    preferredPaymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'check', 'online', 'credit', 'other'],
    },
    taxExempt: {
      type: Boolean,
      default: false,
    },
    taxExemptId: String,
    discountRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    
    // Metrics
    metrics: {
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
      },
      averageOrderValue: {
        type: Number,
        default: 0,
      },
      lastOrderDate: Date,
      firstOrderDate: Date,
      totalReturns: {
        type: Number,
        default: 0,
      },
      totalRefunds: {
        type: Number,
        default: 0,
      },
      lifetimeValue: {
        type: Number,
        default: 0,
      },
    },
    
    // Preferences
    preferences: {
      communication: {
        emailMarketing: {
          type: Boolean,
          default: true,
        },
        smsMarketing: {
          type: Boolean,
          default: false,
        },
        phoneMarketing: {
          type: Boolean,
          default: false,
        },
      },
      shipping: {
        preferredCarrier: String,
        preferredMethod: String,
        deliveryInstructions: String,
      },
      invoicing: {
        sendInvoiceBy: {
          type: String,
          enum: ['email', 'mail', 'both', 'none'],
          default: 'email',
        },
        consolidateInvoices: {
          type: Boolean,
          default: false,
        },
      },
    },
    
    // Loyalty
    loyalty: {
      tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
      },
      points: {
        type: Number,
        default: 0,
      },
      memberSince: Date,
      expirationDate: Date,
    },
    
    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked', 'suspended'],
      default: 'active',
    },
    blacklistReason: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    tags: [String],
    notes: String,
    internalNotes: String,
    source: {
      type: String,
      enum: ['pos', 'online', 'phone', 'email', 'sales_rep', 'api', 'import'],
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    
    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply the toJSON plugin
customerSchema.plugin(toJSON);

// Indexes
customerSchema.index({ email: 1 });
customerSchema.index({ customerNumber: 1 });
customerSchema.index({ type: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ company: 1 });
customerSchema.index({ 'metrics.totalSpent': -1 });
customerSchema.index({ 'metrics.lastOrderDate': -1 });
customerSchema.index({ createdAt: -1 });

// Text index for search
customerSchema.index({
  name: 'text',
  email: 'text',
  company: 'text',
  customerNumber: 'text',
});

// Compound indexes
customerSchema.index({ type: 1, status: 1 });
customerSchema.index({ status: 1, 'metrics.totalSpent': -1 });

// Pre-save middleware
customerSchema.pre('save', async function(next) {
  // Generate customer number if not exists
  if (!this.customerNumber && this.isNew) {
    const count = await Customer.countDocuments();
    this.customerNumber = `CUS-${String(count + 1).padStart(5, '0')}`;
  }
  
  // Calculate average order value
  if (this.metrics.totalOrders > 0) {
    this.metrics.averageOrderValue = this.metrics.totalSpent / this.metrics.totalOrders;
  }
  
  // Calculate lifetime value (simple version)
  this.metrics.lifetimeValue = this.metrics.totalSpent - this.metrics.totalRefunds;
  
  // Set loyalty tier based on spending
  if (this.loyalty && this.metrics.totalSpent > 0) {
    if (this.metrics.totalSpent >= 50000) {
      this.loyalty.tier = 'platinum';
    } else if (this.metrics.totalSpent >= 25000) {
      this.loyalty.tier = 'gold';
    } else if (this.metrics.totalSpent >= 10000) {
      this.loyalty.tier = 'silver';
    } else {
      this.loyalty.tier = 'bronze';
    }
  }
  
  next();
});

// Instance methods
customerSchema.methods.canPurchaseOnCredit = function(): boolean {
  return this.status === 'active' && 
         this.currentBalance < this.creditLimit &&
         this.type === 'B2B';
};

customerSchema.methods.updateMetricsFromOrder = async function(order: any) {
  this.metrics.totalOrders += 1;
  this.metrics.totalSpent += order.financial.grandTotal;
  this.metrics.lastOrderDate = order.dates.orderDate;
  
  if (!this.metrics.firstOrderDate) {
    this.metrics.firstOrderDate = order.dates.orderDate;
  }
  
  // Update loyalty points (1 point per dollar spent)
  if (this.loyalty) {
    this.loyalty.points += Math.floor(order.financial.grandTotal);
  }
  
  await this.save();
};

customerSchema.methods.addShippingAddress = async function(address: any) {
  // If this is the first shipping address, make it default
  if (!this.shippingAddresses || this.shippingAddresses.length === 0) {
    address.isDefault = true;
  } else if (address.isDefault) {
    // If setting as default, unset other defaults
    this.shippingAddresses.forEach((addr: any) => {
      addr.isDefault = false;
    });
  }
  
  this.shippingAddresses = this.shippingAddresses || [];
  this.shippingAddresses.push(address);
  
  await this.save();
};

// Static methods
customerSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ 
    $or: [
      { email: email.toLowerCase() },
      { alternateEmails: email.toLowerCase() }
    ]
  });
};

customerSchema.statics.findTopCustomers = function(limit: number = 10) {
  return this.find({ status: 'active' })
    .sort({ 'metrics.totalSpent': -1 })
    .limit(limit);
};

customerSchema.statics.findInactiveCustomers = function(daysSinceLastOrder: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastOrder);
  
  return this.find({
    status: 'active',
    'metrics.lastOrderDate': { $lt: cutoffDate }
  });
};

customerSchema.statics.getCustomerStats = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        byType: [
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        totals: [
          {
            $group: {
              _id: null,
              totalCustomers: { $sum: 1 },
              totalRevenue: { $sum: '$metrics.totalSpent' },
              averageSpent: { $avg: '$metrics.totalSpent' },
              totalB2B: {
                $sum: { $cond: [{ $eq: ['$type', 'B2B'] }, 1, 0] }
              },
              totalB2C: {
                $sum: { $cond: [{ $eq: ['$type', 'B2C'] }, 1, 0] }
              }
            }
          }
        ]
      }
    }
  ]);
  
  return stats[0];
};

const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);

export default Customer;
