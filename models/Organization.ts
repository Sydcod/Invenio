import mongoose, { Schema, Document } from 'mongoose';
import toJSON from './plugins/toJSON';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  domain?: string;
  subscription: {
    plan: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    billingCycle: 'monthly' | 'annual';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    features: string[];
    limits: {
      users: number;
      items: number;
      orders: number;
      storage: number; // in MB
    };
  };
  settings: {
    currency: string;
    timezone: string;
    fiscalYearStart: number; // month (1-12)
    dateFormat: string;
    numberFormat: string;
    taxSettings: {
      enabled: boolean;
      defaultRate: number;
      taxInclusive: boolean;
    };
  };
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
  };
  contact: {
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    phone?: string;
    email?: string;
    website?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 50,
    },
    domain: {
      type: String,
      lowercase: true,
      trim: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['starter', 'professional', 'enterprise'],
        default: 'starter',
        required: true,
      },
      status: {
        type: String,
        enum: ['active', 'suspended', 'cancelled'],
        default: 'active',
        required: true,
      },
      billingCycle: {
        type: String,
        enum: ['monthly', 'annual'],
        default: 'monthly',
        required: true,
      },
      currentPeriodStart: {
        type: Date,
        required: true,
        default: Date.now,
      },
      currentPeriodEnd: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      features: {
        type: [String],
        default: [],
      },
      limits: {
        users: {
          type: Number,
          default: 5,
        },
        items: {
          type: Number,
          default: 1000,
        },
        orders: {
          type: Number,
          default: 500,
        },
        storage: {
          type: Number,
          default: 1024, // 1GB in MB
        },
      },
    },
    settings: {
      currency: {
        type: String,
        default: 'USD',
        required: true,
      },
      timezone: {
        type: String,
        default: 'America/New_York',
        required: true,
      },
      fiscalYearStart: {
        type: Number,
        default: 1,
        min: 1,
        max: 12,
      },
      dateFormat: {
        type: String,
        default: 'MM/DD/YYYY',
      },
      numberFormat: {
        type: String,
        default: '1,234.56',
      },
      taxSettings: {
        enabled: {
          type: Boolean,
          default: true,
        },
        defaultRate: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        taxInclusive: {
          type: Boolean,
          default: false,
        },
      },
    },
    branding: {
      logo: String,
      primaryColor: {
        type: String,
        default: '#1976d2',
      },
      secondaryColor: {
        type: String,
        default: '#424242',
      },
      customDomain: String,
    },
    contact: {
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
      phone: String,
      email: String,
      website: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ domain: 1 }, { sparse: true });
organizationSchema.index({ 'subscription.stripeCustomerId': 1 }, { sparse: true });
organizationSchema.index({ isActive: 1, createdAt: -1 });

// Apply the toJSON plugin
organizationSchema.plugin(toJSON);

// Instance methods
organizationSchema.methods.isSubscriptionActive = function() {
  return this.subscription.status === 'active' && 
         this.subscription.currentPeriodEnd > new Date();
};

organizationSchema.methods.canAddUsers = function(currentUserCount: number) {
  return currentUserCount < this.subscription.limits.users;
};

organizationSchema.methods.canAddItems = function(currentItemCount: number) {
  return currentItemCount < this.subscription.limits.items;
};

// Static methods
organizationSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

organizationSchema.statics.findByDomain = function(domain: string) {
  return this.findOne({ domain: domain.toLowerCase(), isActive: true });
};

const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);

export default Organization;
