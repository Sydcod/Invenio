import mongoose, { Schema, Document } from 'mongoose';
import toJSON from './plugins/toJSON';

export interface ISalesOrder extends Document {
  orderNumber: string;
  customerId?: mongoose.Types.ObjectId;
  customer: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    taxId?: string;
  };
  warehouseId: mongoose.Types.ObjectId;
  warehouse: {
    name: string;
    code: string;
  };
  salesPersonId?: mongoose.Types.ObjectId;
  salesPerson?: {
    name: string;
    email: string;
  };
  status: 'draft' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  items: Array<{
    productId: mongoose.Types.ObjectId;
    product: {
      name: string;
      sku: string;
      category: string;
    };
    quantity: number;
    shippedQuantity: number;
    unitPrice: number;
    costPrice: number;
    discount: number;
    discountType: 'percentage' | 'fixed';
    tax: number;
    taxAmount: number;
    total: number;
    notes?: string;
    serialNumbers?: string[];
    warehouseLocation?: string;
  }>;
  dates: {
    orderDate: Date;
    confirmedDate?: Date;
    shippedDate?: Date;
    deliveredDate?: Date;
    expectedDelivery?: Date;
    dueDate?: Date;
  };
  financial: {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    shippingCost: number;
    handlingFee: number;
    otherCharges: number;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    currency: string;
    exchangeRate: number;
    profitMargin: number;
    totalCost: number;
  };
  payment: {
    method: 'cash' | 'card' | 'bank_transfer' | 'check' | 'online' | 'credit' | 'other';
    terms: string;
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded';
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
    carrier?: string;
    trackingNumber?: string;
    weight?: number;
    weightUnit?: 'kg' | 'lb';
    packages?: number;
    address: {
      street: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
    };
    billingAddress?: {
      street: string;
      city: string;
      state?: string;
      country: string;
      postalCode: string;
    };
  };
  fulfillment: {
    type: 'warehouse' | 'dropship' | 'pickup';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    instructions?: string;
    packingSlipNumber?: string;
    pickedBy?: mongoose.Types.ObjectId;
    pickedAt?: Date;
    packedBy?: mongoose.Types.ObjectId;
    packedAt?: Date;
  };
  documents?: Array<{
    type: 'invoice' | 'receipt' | 'packingSlip' | 'shippingLabel' | 'other';
    name: string;
    url: string;
    uploadedAt: Date;
  }>;
  returns?: Array<{
    date: Date;
    items: Array<{
      productId: mongoose.Types.ObjectId;
      quantity: number;
      reason: string;
      condition: 'good' | 'damaged' | 'defective';
      refundAmount: number;
    }>;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    refundMethod?: string;
    notes?: string;
  }>;
  source: 'pos' | 'online' | 'phone' | 'email' | 'sales_rep' | 'api';
  channel?: string;
  referenceNumber?: string;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  isGift?: boolean;
  giftMessage?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const salesOrderSchema = new Schema<ISalesOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customer: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
      },
      phone: String,
      company: String,
      taxId: String,
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
    salesPersonId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    salesPerson: {
      name: String,
      email: String,
    },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'],
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
        shippedQuantity: {
          type: Number,
          default: 0,
          min: 0,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        costPrice: {
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
        serialNumbers: [String],
        warehouseLocation: String,
      },
    ],
    dates: {
      orderDate: {
        type: Date,
        default: Date.now,
        required: true,
      },
      confirmedDate: Date,
      shippedDate: Date,
      deliveredDate: Date,
      expectedDelivery: Date,
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
      handlingFee: {
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
      profitMargin: {
        type: Number,
        default: 0,
      },
      totalCost: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    payment: {
      method: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'check', 'online', 'credit', 'other'],
        default: 'cash',
      },
      terms: {
        type: String,
        default: 'immediate',
      },
      status: {
        type: String,
        enum: ['pending', 'partial', 'paid', 'overdue', 'refunded'],
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
      carrier: String,
      trackingNumber: String,
      weight: {
        type: Number,
        min: 0,
      },
      weightUnit: {
        type: String,
        enum: ['kg', 'lb'],
        default: 'kg',
      },
      packages: {
        type: Number,
        default: 1,
        min: 1,
      },
      address: {
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
      billingAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
    },
    fulfillment: {
      type: {
        type: String,
        enum: ['warehouse', 'dropship', 'pickup'],
        default: 'warehouse',
      },
      priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
      },
      instructions: String,
      packingSlipNumber: String,
      pickedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      pickedAt: Date,
      packedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      packedAt: Date,
    },
    documents: [
      {
        type: {
          type: String,
          enum: ['invoice', 'receipt', 'packingSlip', 'shippingLabel', 'other'],
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
    returns: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        items: [
          {
            productId: {
              type: Schema.Types.ObjectId,
              ref: 'Product',
              required: true,
            },
            quantity: {
              type: Number,
              required: true,
              min: 1,
            },
            reason: {
              type: String,
              required: true,
            },
            condition: {
              type: String,
              enum: ['good', 'damaged', 'defective'],
              required: true,
            },
            refundAmount: {
              type: Number,
              required: true,
              min: 0,
            },
          },
        ],
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected', 'completed'],
          default: 'pending',
        },
        refundMethod: String,
        notes: String,
      },
    ],
    source: {
      type: String,
      enum: ['pos', 'online', 'phone', 'email', 'sales_rep', 'api'],
      default: 'pos',
      required: true,
    },
    channel: String,
    referenceNumber: String,
    notes: String,
    internalNotes: String,
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isGift: {
      type: Boolean,
      default: false,
    },
    giftMessage: String,
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
salesOrderSchema.index({ orderNumber: 1 }, { unique: true });
salesOrderSchema.index({ status: 1, 'dates.orderDate': -1 });
salesOrderSchema.index({ customerId: 1, status: 1 });
salesOrderSchema.index({ warehouseId: 1 });
salesOrderSchema.index({ salesPersonId: 1 });
salesOrderSchema.index({ 'payment.status': 1 });
salesOrderSchema.index({ 'fulfillment.priority': 1, status: 1 });
salesOrderSchema.index({ 'dates.expectedDelivery': 1 });
salesOrderSchema.index({ 'customer.email': 1 });
salesOrderSchema.index({ source: 1 });

// Apply the toJSON plugin
salesOrderSchema.plugin(toJSON);

// Pre-save middleware to calculate totals
salesOrderSchema.pre('save', async function(next) {
  // Generate order number if not provided
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('SalesOrder').countDocuments({});
    const year = new Date().getFullYear().toString().slice(-2);
    this.orderNumber = `SO${year}${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate item totals and financial summary
  if (this.isModified('items')) {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalCost = 0;
    
    this.items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
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
      totalCost += (item.quantity * item.costPrice);
    });
    
    this.financial.subtotal = subtotal;
    this.financial.totalDiscount = totalDiscount;
    this.financial.totalTax = totalTax;
    this.financial.totalCost = totalCost;
    this.financial.grandTotal = subtotal - totalDiscount + totalTax + 
                                this.financial.shippingCost + this.financial.handlingFee + 
                                this.financial.otherCharges;
    this.financial.balanceAmount = this.financial.grandTotal - this.financial.paidAmount;
    
    // Calculate profit margin
    const totalRevenue = this.financial.grandTotal - this.financial.shippingCost - 
                        this.financial.handlingFee - this.financial.otherCharges;
    if (totalRevenue > 0) {
      this.financial.profitMargin = ((totalRevenue - totalCost) / totalRevenue) * 100;
    }
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
  
  // Handle refunds
  if (this.returns && this.returns.length > 0) {
    const totalRefunded = this.returns
      .filter(ret => ret.status === 'completed')
      .reduce((sum, ret) => sum + ret.items.reduce((itemSum, item) => itemSum + item.refundAmount, 0), 0);
    
    if (totalRefunded > 0) {
      this.payment.status = 'refunded';
    }
  }
  
  // Check if overdue
  if (this.dates.dueDate && new Date() > this.dates.dueDate && this.payment.status !== 'paid') {
    this.payment.status = 'overdue';
  }
  
  next();
});

// Instance methods
salesOrderSchema.methods.canBeShipped = function(): boolean {
  return ['confirmed', 'processing', 'packed'].includes(this.status);
};

salesOrderSchema.methods.canBeCancelled = function(): boolean {
  return ['draft', 'confirmed', 'processing'].includes(this.status);
};

salesOrderSchema.methods.isFullyShipped = function(): boolean {
  return this.items.every((item: any) => item.shippedQuantity >= item.quantity);
};

salesOrderSchema.methods.getFulfillmentProgress = function(): number {
  const totalQuantity = this.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const shippedQuantity = this.items.reduce((sum: number, item: any) => sum + item.shippedQuantity, 0);
  
  if (totalQuantity === 0) return 0;
  return (shippedQuantity / totalQuantity) * 100;
};

salesOrderSchema.methods.addPayment = async function(payment: any) {
  this.payment.transactions.push({
    date: new Date(),
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference,
    notes: payment.notes,
  });
  
  await this.save();
};

salesOrderSchema.methods.processReturn = async function(returnData: any) {
  this.returns = this.returns || [];
  this.returns.push({
    date: new Date(),
    items: returnData.items,
    status: 'pending',
    refundMethod: returnData.refundMethod,
    notes: returnData.notes,
  });
  
  await this.save();
};

// Static methods
salesOrderSchema.statics.findByStatus = function(status?: string) {
  const query: any = {};
  if (status) query.status = status;
  
  return this.find(query).sort('-dates.orderDate');
};

salesOrderSchema.statics.findPendingFulfillment = function() {
  return this.find({
    status: { $in: ['confirmed', 'processing'] },
    'fulfillment.priority': { $in: ['high', 'urgent'] },
  }).sort({ 'fulfillment.priority': -1, 'dates.orderDate': 1 });
};

salesOrderSchema.statics.findOverduePayments = function() {
  return this.find({
    'payment.status': 'overdue',
  }).sort('dates.dueDate');
};

salesOrderSchema.statics.getCustomerOrderHistory = function(customerId?: mongoose.Types.ObjectId, email?: string) {
  const query: any = { status: { $ne: 'cancelled' } };
  
  if (customerId) {
    query.customerId = customerId;
  } else if (email) {
    query['customer.email'] = email.toLowerCase();
  }
  
  return this.find(query).sort('-dates.orderDate');
};

salesOrderSchema.statics.getDailySales = function(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    'dates.orderDate': { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['cancelled', 'refunded'] },
  });
};

const SalesOrder = mongoose.models.SalesOrder || mongoose.model<ISalesOrder>('SalesOrder', salesOrderSchema);

export default SalesOrder;
