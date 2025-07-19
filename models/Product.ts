import mongoose, { Schema, Document } from 'mongoose';
import toJSON from './plugins/toJSON';

export interface IProduct extends Document {
  organizationId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  description?: string;
  category: {
    id: mongoose.Types.ObjectId;
    name: string;
    path: string;
  };
  brand?: string;
  type: 'physical' | 'digital' | 'service';
  status: 'active' | 'inactive' | 'discontinued' | 'draft';
  pricing: {
    cost: number;
    price: number;
    compareAtPrice?: number;
    currency: string;
    taxable: boolean;
    taxRate?: number;
  };
  inventory: {
    trackQuantity: boolean;
    currentStock: number;
    availableStock: number;
    reservedStock: number;
    incomingStock: number;
    reorderPoint: number;
    reorderQuantity: number;
    maxStockLevel?: number;
    minStockLevel: number;
    stockValue: number;
    averageCost: number;
    lastCostUpdate: Date;
    stockMethod: 'FIFO' | 'LIFO' | 'Average';
    locations?: Array<{
      warehouseId: mongoose.Types.ObjectId;
      warehouseName: string;
      quantity: number;
      binLocation?: string;
      isDefault: boolean;
    }>;
  };
  suppliers?: Array<{
    vendorId: mongoose.Types.ObjectId;
    vendorName: string;
    supplierSku?: string;
    cost: number;
    leadTime: number;
    minOrderQuantity: number;
    isPrimary: boolean;
    lastOrderDate?: Date;
    reliability?: number;
  }>;
  media?: {
    primaryImage?: string;
    images?: string[];
    documents?: Array<{
      name: string;
      url: string;
      type: 'manual' | 'specification' | 'certificate';
      uploadedAt: Date;
    }>;
  };
  attributes?: Record<string, any>;
  weight?: {
    value: number;
    unit: 'kg' | 'lb' | 'oz' | 'g';
  };
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in' | 'm' | 'ft';
  };
  barcode?: string;
  upc?: string;
  mpn?: string;
  tags?: string[];
  notes?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    sku: {
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
    description: {
      type: String,
      maxlength: 2000,
    },
    category: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
    },
    brand: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['physical', 'digital', 'service'],
      default: 'physical',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued', 'draft'],
      default: 'draft',
      required: true,
    },
    pricing: {
      cost: {
        type: Number,
        default: 0,
        min: 0,
        required: true,
      },
      price: {
        type: Number,
        default: 0,
        min: 0,
        required: true,
      },
      compareAtPrice: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
        required: true,
      },
      taxable: {
        type: Boolean,
        default: true,
      },
      taxRate: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    inventory: {
      trackQuantity: {
        type: Boolean,
        default: true,
      },
      currentStock: {
        type: Number,
        default: 0,
        min: 0,
      },
      availableStock: {
        type: Number,
        default: 0,
        min: 0,
      },
      reservedStock: {
        type: Number,
        default: 0,
        min: 0,
      },
      incomingStock: {
        type: Number,
        default: 0,
        min: 0,
      },
      reorderPoint: {
        type: Number,
        default: 0,
        min: 0,
      },
      reorderQuantity: {
        type: Number,
        default: 0,
        min: 0,
      },
      maxStockLevel: {
        type: Number,
        min: 0,
      },
      minStockLevel: {
        type: Number,
        default: 0,
        min: 0,
      },
      stockValue: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastCostUpdate: {
        type: Date,
        default: Date.now,
      },
      stockMethod: {
        type: String,
        enum: ['FIFO', 'LIFO', 'Average'],
        default: 'Average',
      },
      locations: [
        {
          warehouseId: {
            type: Schema.Types.ObjectId,
            ref: 'Warehouse',
            required: true,
          },
          warehouseName: {
            type: String,
            required: true,
          },
          quantity: {
            type: Number,
            default: 0,
            min: 0,
          },
          binLocation: String,
          isDefault: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    suppliers: [
      {
        vendorId: {
          type: Schema.Types.ObjectId,
          ref: 'Supplier',
          required: true,
        },
        vendorName: {
          type: String,
          required: true,
        },
        supplierSku: String,
        cost: {
          type: Number,
          default: 0,
          min: 0,
        },
        leadTime: {
          type: Number,
          default: 0,
          min: 0,
        },
        minOrderQuantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        lastOrderDate: Date,
        reliability: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],
    media: {
      primaryImage: String,
      images: [String],
      documents: [
        {
          name: {
            type: String,
            required: true,
          },
          url: {
            type: String,
            required: true,
          },
          type: {
            type: String,
            enum: ['manual', 'specification', 'certificate'],
            required: true,
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
    attributes: {
      type: Schema.Types.Mixed,
    },
    weight: {
      value: {
        type: Number,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['kg', 'lb', 'oz', 'g'],
        default: 'kg',
      },
    },
    dimensions: {
      length: {
        type: Number,
        min: 0,
      },
      width: {
        type: Number,
        min: 0,
      },
      height: {
        type: Number,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['cm', 'in', 'm', 'ft'],
        default: 'cm',
      },
    },
    barcode: {
      type: String,
      trim: true,
    },
    upc: {
      type: String,
      trim: true,
    },
    mpn: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: String,
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
productSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
productSchema.index({ organizationId: 1, status: 1, name: 1 });
productSchema.index({ organizationId: 1, 'category.id': 1 });
productSchema.index({ organizationId: 1, brand: 1 });
productSchema.index({ organizationId: 1, barcode: 1 }, { sparse: true });
productSchema.index({ organizationId: 1, upc: 1 }, { sparse: true });
productSchema.index({ organizationId: 1, 'inventory.currentStock': 1 });
productSchema.index({ organizationId: 1, 'inventory.reorderPoint': 1 });
productSchema.index({ organizationId: 1, tags: 1 });

// Text index for search
productSchema.index({ name: 'text', description: 'text', sku: 'text', brand: 'text' });

// Apply the toJSON plugin
productSchema.plugin(toJSON);

// Pre-save middleware to calculate available stock
productSchema.pre('save', function(next) {
  if (this.isModified('inventory.currentStock') || this.isModified('inventory.reservedStock')) {
    this.inventory.availableStock = this.inventory.currentStock - this.inventory.reservedStock;
  }
  
  // Calculate stock value
  if (this.isModified('inventory.currentStock') || this.isModified('inventory.averageCost')) {
    this.inventory.stockValue = this.inventory.currentStock * this.inventory.averageCost;
  }
  
  next();
});

// Instance methods
productSchema.methods.isLowStock = function(): boolean {
  return this.inventory.trackQuantity && 
         this.inventory.currentStock <= this.inventory.reorderPoint;
};

productSchema.methods.isOutOfStock = function(): boolean {
  return this.inventory.trackQuantity && 
         this.inventory.availableStock <= 0;
};

productSchema.methods.canFulfillQuantity = function(quantity: number): boolean {
  return !this.inventory.trackQuantity || 
         this.inventory.availableStock >= quantity;
};

productSchema.methods.getProfitMargin = function(): number {
  if (this.pricing.price === 0) return 0;
  return ((this.pricing.price - this.pricing.cost) / this.pricing.price) * 100;
};

// Static methods
productSchema.statics.findByOrganization = function(organizationId: mongoose.Types.ObjectId, status = 'active') {
  return this.find({
    organizationId,
    status,
    isActive: true,
  });
};

productSchema.statics.findLowStock = function(organizationId: mongoose.Types.ObjectId) {
  return this.find({
    organizationId,
    'inventory.trackQuantity': true,
    $expr: { $lte: ['$inventory.currentStock', '$inventory.reorderPoint'] },
    status: 'active',
    isActive: true,
  });
};

productSchema.statics.findOutOfStock = function(organizationId: mongoose.Types.ObjectId) {
  return this.find({
    organizationId,
    'inventory.trackQuantity': true,
    'inventory.availableStock': { $lte: 0 },
    status: 'active',
    isActive: true,
  });
};

productSchema.statics.searchProducts = function(organizationId: mongoose.Types.ObjectId, searchTerm: string) {
  return this.find({
    organizationId,
    $text: { $search: searchTerm },
    status: 'active',
    isActive: true,
  }).select({ score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
