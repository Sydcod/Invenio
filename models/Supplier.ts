import mongoose, { Schema, Document } from 'mongoose';
import toJSON from './plugins/toJSON';

export interface ISupplier extends Document {
  code: string;
  name: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'retailer' | 'dropshipper';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  contact: {
    companyName: string;
    contactPerson?: string;
    email: string;
    phone?: string;
    alternatePhone?: string;
    website?: string;
  };
  addresses: {
    billing: {
      street: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
    };
    shipping?: {
      street: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
      isDefault: boolean;
    };
  };
  businessInfo: {
    taxId?: string;
    businessLicense?: string;
    establishedYear?: number;
    employeeCount?: string;
    annualRevenue?: string;
  };
  payment: {
    terms: 'net30' | 'net60' | 'net90' | 'cod' | 'prepaid' | 'custom';
    customTerms?: string;
    currency: string;
    creditLimit?: number;
    currentBalance: number;
    paymentMethods: string[];
    bankDetails?: {
      bankName?: string;
      accountNumber?: string;
      routingNumber?: string;
      swift?: string;
    };
  };
  products?: Array<{
    productId: mongoose.Types.ObjectId;
    supplierSku: string;
    productName: string;
    cost: number;
    moq: number;
    leadTime: number;
    isActive: boolean;
  }>;
  performance: {
    rating: number;
    onTimeDelivery: number;
    qualityScore: number;
    responseTime: number;
    totalOrders: number;
    returnRate: number;
    lastOrderDate?: Date;
    averageLeadTime: number;
  };
  preferences: {
    minimumOrderValue?: number;
    preferredShippingMethod?: string;
    orderingInstructions?: string;
    catalogUrl?: string;
    apiEndpoint?: string;
    autoReorderEnabled: boolean;
  };
  notes?: string;
  tags?: string[];
  isPreferred: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'dropshipper'],
      default: 'distributor',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'blocked'],
      default: 'pending',
      required: true,
    },
    contact: {
      companyName: {
        type: String,
        required: true,
      },
      contactPerson: String,
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      phone: String,
      alternatePhone: String,
      website: String,
    },
    addresses: {
      billing: {
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
      shipping: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
        isDefault: {
          type: Boolean,
          default: true,
        },
      },
    },
    businessInfo: {
      taxId: String,
      businessLicense: String,
      establishedYear: {
        type: Number,
        min: 1800,
        max: new Date().getFullYear(),
      },
      employeeCount: String,
      annualRevenue: String,
    },
    payment: {
      terms: {
        type: String,
        enum: ['net30', 'net60', 'net90', 'cod', 'prepaid', 'custom'],
        default: 'net30',
        required: true,
      },
      customTerms: String,
      currency: {
        type: String,
        default: 'USD',
        required: true,
      },
      creditLimit: {
        type: Number,
        min: 0,
      },
      currentBalance: {
        type: Number,
        default: 0,
      },
      paymentMethods: {
        type: [String],
        default: ['bank_transfer'],
      },
      bankDetails: {
        bankName: String,
        accountNumber: String,
        routingNumber: String,
        swift: String,
      },
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        supplierSku: {
          type: String,
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        cost: {
          type: Number,
          required: true,
          min: 0,
        },
        moq: {
          type: Number,
          default: 1,
          min: 1,
        },
        leadTime: {
          type: Number,
          default: 0,
          min: 0,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    performance: {
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      onTimeDelivery: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      qualityScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      responseTime: {
        type: Number,
        default: 24,
        min: 0,
      },
      totalOrders: {
        type: Number,
        default: 0,
        min: 0,
      },
      returnRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      lastOrderDate: Date,
      averageLeadTime: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    preferences: {
      minimumOrderValue: {
        type: Number,
        min: 0,
      },
      preferredShippingMethod: String,
      orderingInstructions: String,
      catalogUrl: String,
      apiEndpoint: String,
      autoReorderEnabled: {
        type: Boolean,
        default: false,
      },
    },
    notes: String,
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPreferred: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

// Compound indexes for performance
supplierSchema.index({ code: 1 }, { unique: true });
supplierSchema.index({ status: 1, name: 1 });
supplierSchema.index({ type: 1 });
supplierSchema.index({ isPreferred: 1 });
supplierSchema.index({ 'performance.rating': -1 });
supplierSchema.index({ tags: 1 });

// Apply the toJSON plugin
supplierSchema.plugin(toJSON);

// Pre-save middleware to generate supplier code if not provided
supplierSchema.pre('save', async function(next) {
  if (this.isNew && !this.code) {
    // Generate a unique supplier code
    const count = await mongoose.model('Supplier').countDocuments({});
    this.code = `SUP${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Instance methods
supplierSchema.methods.calculateOverallRating = function(): number {
  const weights = {
    rating: 0.3,
    onTimeDelivery: 0.3,
    qualityScore: 0.3,
    returnRate: 0.1,
  };
  
  const score = 
    (this.performance.rating / 5) * weights.rating * 100 +
    this.performance.onTimeDelivery * weights.onTimeDelivery +
    this.performance.qualityScore * weights.qualityScore +
    (100 - this.performance.returnRate) * weights.returnRate;
  
  return Math.round(score) / 20; // Convert to 0-5 scale
};

supplierSchema.methods.updatePerformanceMetrics = async function(order: any) {
  // Update order count
  this.performance.totalOrders += 1;
  this.performance.lastOrderDate = new Date();
  
  // Update on-time delivery (example logic)
  if (order.deliveredDate && order.expectedDate) {
    const wasOnTime = order.deliveredDate <= order.expectedDate;
    const totalDeliveries = this.performance.totalOrders;
    this.performance.onTimeDelivery = 
      ((this.performance.onTimeDelivery * (totalDeliveries - 1)) + (wasOnTime ? 100 : 0)) / totalDeliveries;
  }
  
  // Update average lead time
  if (order.leadTime) {
    this.performance.averageLeadTime = 
      ((this.performance.averageLeadTime * (this.performance.totalOrders - 1)) + order.leadTime) / 
      this.performance.totalOrders;
  }
  
  await this.save();
};

// Static methods
supplierSchema.statics.findActive = function(status = 'active') {
  return this.find({
    status,
    isActive: true,
  }).sort('name');
};

supplierSchema.statics.findPreferred = function() {
  return this.find({
    isPreferred: true,
    status: 'active',
    isActive: true,
  }).sort('-performance.rating');
};

supplierSchema.statics.findByProduct = function(productId: mongoose.Types.ObjectId) {
  return this.find({
    'products.productId': productId,
    'products.isActive': true,
    status: 'active',
    isActive: true,
  });
};

supplierSchema.statics.searchSuppliers = function(searchTerm: string) {
  return this.find({
    status: 'active',
    isActive: true,
    $or: [
      { name: new RegExp(searchTerm, 'i') },
      { code: new RegExp(searchTerm, 'i') },
      { 'contact.companyName': new RegExp(searchTerm, 'i') },
      { tags: new RegExp(searchTerm, 'i') },
    ],
  });
};

const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', supplierSchema);

export default Supplier;
