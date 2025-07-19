import mongoose, { Schema, Document } from 'mongoose';
import toJSON from './plugins/toJSON';

export interface IPurchaseOrder extends Document {
  organizationId: mongoose.Types.ObjectId;
  orderNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplier: {
    name: string;
    code: string;
    contactPerson?: string;
    email: string;
    phone?: string;
  };
  warehouseId: mongoose.Types.ObjectId;
  warehouse: {
    name: string;
    code: string;
  };
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partial' | 'received' | 'completed' | 'cancelled';
  items: Array<{
    productId: mongoose.Types.ObjectId;
    product: {
      name: string;
      sku: string;
      category: string;
    };
    quantity: number;
    receivedQuantity: number;
    unitCost: number;
    discount: number;
    discountType: 'percentage' | 'fixed';
    tax: number;
    taxAmount: number;
    total: number;
    notes?: string;
    expectedDelivery?: Date;
    receivedDate?: Date;
  }>;
  dates: {
    orderDate: Date;
    expectedDelivery?: Date;
    actualDelivery?: Date;
    dueDate?: Date;
  };
  financial: {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    shippingCost: number;
    otherCharges: number;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    currency: string;
    exchangeRate: number;
  };
  payment: {
    terms: string;
    method?: string;
    status: 'pending' | 'partial' | 'paid' | 'overdue';
    transactions: Array<{
      date: Date;
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
    }>;
  };
  shipping: {
    method?: string;
    trackingNumber?: string;
    carrier?: string;
    estimatedArrival?: Date;
    address?: {
      street: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
    };
  };
  documents?: Array<{
    type: 'invoice' | 'receipt' | 'packingSlip' | 'other';
    name: string;
    url: string;
    uploadedAt: Date;
  }>;
  approval?: {
    required: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    rejectedBy?: mongoose.Types.ObjectId;
    rejectedAt?: Date;
    comments?: string;
  };
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplier: {
      name: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
      },
      contactPerson: String,
      email: {
        type: String,
        required: true,
      },
      phone: String,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    warehouse: {
      name: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'completed', 'cancelled'],
      default: 'draft',
      required: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        product: {
          name: {
            type: String,
            required: true,
          },
          sku: {
            type: String,
            required: true,
          },
          category: {
            type: String,
            required: true,
          },
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        receivedQuantity: {
          type: Number,
          default: 0,
          min: 0,
        },
        unitCost: {
          type: Number,
          required: true,
          min: 0,
        },
        discount: {
          type: Number,
          default: 0,
          min: 0,
        },
        discountType: {
          type: String,
          enum: ['percentage', 'fixed'],
          default: 'percentage',
        },
        tax: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        taxAmount: {
          type: Number,
          default: 0,
          min: 0,
        },
        total: {
          type: Number,
          required: true,
          min: 0,
        },
        notes: String,
        expectedDelivery: Date,
        receivedDate: Date,
      },
    ],
    dates: {
      orderDate: {
        type: Date,
        default: Date.now,
        required: true,
      },
      expectedDelivery: Date,
      actualDelivery: Date,
      dueDate: Date,
    },
    financial: {
      subtotal: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalDiscount: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalTax: {
        type: Number,
        default: 0,
        min: 0,
      },
      shippingCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      otherCharges: {
        type: Number,
        default: 0,
        min: 0,
      },
      grandTotal: {
        type: Number,
        default: 0,
        min: 0,
      },
      paidAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      balanceAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
        required: true,
      },
      exchangeRate: {
        type: Number,
        default: 1,
        min: 0,
      },
    },
    payment: {
      terms: {
        type: String,
        required: true,
        default: 'net30',
      },
      method: String,
      status: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'overdue'],
        default: 'pending',
      },
      transactions: [
        {
          date: {
            type: Date,
            default: Date.now,
          },
          amount: {
            type: Number,
            required: true,
            min: 0,
          },
          method: {
            type: String,
            required: true,
          },
          reference: String,
          notes: String,
        },
      ],
    },
    shipping: {
      method: String,
      trackingNumber: String,
      carrier: String,
      estimatedArrival: Date,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
    },
    documents: [
      {
        type: {
          type: String,
          enum: ['invoice', 'receipt', 'packingSlip', 'other'],
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    approval: {
      required: {
        type: Boolean,
        default: false,
      },
      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      approvedAt: Date,
      rejectedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectedAt: Date,
      comments: String,
    },
    notes: String,
    internalNotes: String,
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
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
purchaseOrderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ organizationId: 1, status: 1, 'dates.orderDate': -1 });
purchaseOrderSchema.index({ organizationId: 1, supplierId: 1, status: 1 });
purchaseOrderSchema.index({ organizationId: 1, warehouseId: 1 });
purchaseOrderSchema.index({ organizationId: 1, 'payment.status': 1 });
purchaseOrderSchema.index({ organizationId: 1, 'dates.expectedDelivery': 1 });
purchaseOrderSchema.index({ organizationId: 1, 'items.productId': 1 });

// Apply the toJSON plugin
purchaseOrderSchema.plugin(toJSON);

// Pre-save middleware to calculate totals
purchaseOrderSchema.pre('save', async function(next) {
  // Generate order number if not provided
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('PurchaseOrder').countDocuments({
      organizationId: this.organizationId,
    });
    const year = new Date().getFullYear().toString().slice(-2);
    this.orderNumber = `PO${year}${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate item totals and financial summary
  if (this.isModified('items')) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    
    this.items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitCost;
      let discountAmount = 0;
      
      if (item.discount > 0) {
        if (item.discountType === 'percentage') {
          discountAmount = (itemSubtotal * item.discount) / 100;
        } else {
          discountAmount = item.discount;
        }
      }
      
      const discountedAmount = itemSubtotal - discountAmount;
      const taxAmount = (discountedAmount * item.tax) / 100;
      
      item.taxAmount = taxAmount;
      item.total = discountedAmount + taxAmount;
      
      subtotal += itemSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });
    
    this.financial.subtotal = subtotal;
    this.financial.totalDiscount = totalDiscount;
    this.financial.totalTax = totalTax;
    this.financial.grandTotal = subtotal - totalDiscount + totalTax + 
                                this.financial.shippingCost + this.financial.otherCharges;
    this.financial.balanceAmount = this.financial.grandTotal - this.financial.paidAmount;
  }
  
  // Update payment status based on payments
  if (this.isModified('payment.transactions') || this.isModified('financial.grandTotal')) {
    const totalPaid = this.payment.transactions.reduce((sum, trans) => sum + trans.amount, 0);
    this.financial.paidAmount = totalPaid;
    this.financial.balanceAmount = this.financial.grandTotal - totalPaid;
    
    if (totalPaid === 0) {
      this.payment.status = 'pending';
    } else if (totalPaid >= this.financial.grandTotal) {
      this.payment.status = 'paid';
    } else {
      this.payment.status = 'partial';
    }
  }
  
  // Check if overdue
  if (this.dates.dueDate && new Date() > this.dates.dueDate && this.payment.status !== 'paid') {
    this.payment.status = 'overdue';
  }
  
  next();
});

// Instance methods
purchaseOrderSchema.methods.getReceivingProgress = function(): number {
  const totalQuantity = this.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const receivedQuantity = this.items.reduce((sum: number, item: any) => sum + item.receivedQuantity, 0);
  
  if (totalQuantity === 0) return 0;
  return (receivedQuantity / totalQuantity) * 100;
};

purchaseOrderSchema.methods.canBeApproved = function(): boolean {
  return this.status === 'pending' && this.approval.required && !this.approval.approvedAt;
};

purchaseOrderSchema.methods.canBeCancelled = function(): boolean {
  return ['draft', 'pending', 'approved', 'ordered'].includes(this.status);
};

purchaseOrderSchema.methods.isFullyReceived = function(): boolean {
  return this.items.every((item: any) => item.receivedQuantity >= item.quantity);
};

purchaseOrderSchema.methods.addPayment = async function(payment: any) {
  this.payment.transactions.push({
    date: new Date(),
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference,
    notes: payment.notes,
  });
  
  await this.save();
};

// Static methods
purchaseOrderSchema.statics.findByOrganization = function(organizationId: mongoose.Types.ObjectId, status?: string) {
  const query: any = { organizationId };
  if (status) query.status = status;
  
  return this.find(query).sort('-dates.orderDate');
};

purchaseOrderSchema.statics.findPendingDeliveries = function(organizationId: mongoose.Types.ObjectId) {
  return this.find({
    organizationId,
    status: { $in: ['ordered', 'partial'] },
    'dates.expectedDelivery': { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // Next 7 days
  }).sort('dates.expectedDelivery');
};

purchaseOrderSchema.statics.findOverduePayments = function(organizationId: mongoose.Types.ObjectId) {
  return this.find({
    organizationId,
    'payment.status': 'overdue',
  }).sort('dates.dueDate');
};

purchaseOrderSchema.statics.getSupplierOrderHistory = function(organizationId: mongoose.Types.ObjectId, supplierId: mongoose.Types.ObjectId) {
  return this.find({
    organizationId,
    supplierId,
    status: { $ne: 'cancelled' },
  }).sort('-dates.orderDate');
};

const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder;
