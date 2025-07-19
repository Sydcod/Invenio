import mongoose, { Schema, Document } from "mongoose";
import toJSON from "./plugins/toJSON";

export interface IUser extends Document {
  organizationId?: mongoose.Types.ObjectId; // Optional to allow new users
  email: string;
  name?: string;
  image?: string;
  role: {
    name: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
    permissions: string[];
    customPermissions?: {
      inventory?: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
      };
      sales?: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
        approve: boolean;
      };
      purchases?: {
        view: boolean;
        create: boolean;
        edit: boolean;
        delete: boolean;
        approve: boolean;
      };
      reports?: {
        view: boolean;
        export: boolean;
        advanced: boolean;
      };
      settings?: {
        view: boolean;
        edit: boolean;
        users: boolean;
        billing: boolean;
      };
    };
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    title?: string;
    department?: string;
    avatar?: string;
  };
  preferences?: {
    language: string;
    theme: 'light' | 'dark' | 'auto';
    notifications?: {
      email: boolean;
      browser: boolean;
      lowStock: boolean;
      orderUpdates: boolean;
      systemAlerts: boolean;
    };
    dashboard?: {
      widgets: string[];
      defaultView: string;
    };
  };
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  invitedBy?: mongoose.Types.ObjectId;
  invitedAt?: Date;
  activatedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// USER SCHEMA
const userSchema = new Schema<IUser>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: false, // Made optional to allow new users to sign up first
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    role: {
      name: {
        type: String,
        enum: ['owner', 'admin', 'manager', 'staff', 'viewer'],
        default: 'staff',
        required: true,
      },
      permissions: {
        type: [String],
        default: [],
      },
      customPermissions: {
        inventory: {
          view: { type: Boolean, default: true },
          create: { type: Boolean, default: false },
          edit: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
        },
        sales: {
          view: { type: Boolean, default: true },
          create: { type: Boolean, default: false },
          edit: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
          approve: { type: Boolean, default: false },
        },
        purchases: {
          view: { type: Boolean, default: true },
          create: { type: Boolean, default: false },
          edit: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
          approve: { type: Boolean, default: false },
        },
        reports: {
          view: { type: Boolean, default: true },
          export: { type: Boolean, default: false },
          advanced: { type: Boolean, default: false },
        },
        settings: {
          view: { type: Boolean, default: false },
          edit: { type: Boolean, default: false },
          users: { type: Boolean, default: false },
          billing: { type: Boolean, default: false },
        },
      },
    },
    profile: {
      firstName: String,
      lastName: String,
      phone: String,
      title: String,
      department: String,
      avatar: String,
    },
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto',
      },
      notifications: {
        email: { type: Boolean, default: true },
        browser: { type: Boolean, default: true },
        lowStock: { type: Boolean, default: true },
        orderUpdates: { type: Boolean, default: true },
        systemAlerts: { type: Boolean, default: true },
      },
      dashboard: {
        widgets: {
          type: [String],
          default: ['inventory-summary', 'recent-orders', 'low-stock-alerts'],
        },
        defaultView: {
          type: String,
          default: 'overview',
        },
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'suspended'],
      default: 'pending',
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    invitedAt: Date,
    activatedAt: Date,
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compound index for email uniqueness per organization
userSchema.index({ email: 1, organizationId: 1 }, { unique: true });

// Performance indexes
userSchema.index({ status: 1, organizationId: 1 });
userSchema.index({ 'role.name': 1, organizationId: 1 });
userSchema.index({ lastLoginAt: -1 });

// Add the toJSON plugin
userSchema.plugin(toJSON);

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile?.firstName && this.profile?.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.name || this.email;
});

// Instance methods
userSchema.methods.hasPermission = function(module: string, action: string): boolean {
  // Owners have all permissions
  if (this.role.name === 'owner') return true;
  
  // Check custom permissions
  const modulePerms = this.role.customPermissions?.[module];
  if (modulePerms && typeof modulePerms[action] === 'boolean') {
    return modulePerms[action];
  }
  
  // Check general permissions array
  return this.role.permissions.includes(`${module}:${action}`);
};

userSchema.methods.isOwnerOrAdmin = function(): boolean {
  return ['owner', 'admin'].includes(this.role.name);
};

// Static methods
userSchema.statics.findByEmail = function(email: string, organizationId: mongoose.Types.ObjectId) {
  return this.findOne({ 
    email: email.toLowerCase(), 
    organizationId,
    status: { $ne: 'suspended' }
  });
};

userSchema.statics.findActiveByOrganization = function(organizationId: mongoose.Types.ObjectId) {
  return this.find({ 
    organizationId,
    status: 'active'
  });
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
