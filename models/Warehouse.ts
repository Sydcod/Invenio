import mongoose, { Schema, Document } from 'mongoose';
import toJSON from './plugins/toJSON';

export interface IWarehouse extends Document {
  code: string;
  name: string;
  type: 'main' | 'branch' | 'distribution' | 'retail' | 'virtual';
  status: 'active' | 'inactive' | 'maintenance';
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    manager?: string;
    email?: string;
    phone?: string;
    alternatePhone?: string;
  };
  capacity: {
    totalSpace: number;
    usedSpace: number;
    unit: 'sqft' | 'sqm';
    zones: Array<{
      name: string;
      type: 'storage' | 'receiving' | 'shipping' | 'picking' | 'packing' | 'quarantine';
      capacity: number;
      currentUsage: number;
      temperatureControlled?: boolean;
      temperatureRange?: {
        min: number;
        max: number;
        unit: 'C' | 'F';
      };
    }>;
  };
  inventory: {
    totalItems: number;
    totalValue: number;
    lastCountDate?: Date;
    cycleCountSchedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    nextCountDate?: Date;
  };
  operations: {
    workingHours: {
      monday?: { open: string; close: string };
      tuesday?: { open: string; close: string };
      wednesday?: { open: string; close: string };
      thursday?: { open: string; close: string };
      friday?: { open: string; close: string };
      saturday?: { open: string; close: string };
      sunday?: { open: string; close: string };
    };
    holidays?: Array<{
      date: Date;
      description: string;
    }>;
    staffCount?: number;
    equipment?: Array<{
      type: string;
      quantity: number;
      condition: 'good' | 'fair' | 'maintenance';
    }>;
  };
  settings: {
    isDefault: boolean;
    allowNegativeStock: boolean;
    autoTransferEnabled: boolean;
    minimumStockAlerts: boolean;
    barcodePrefix?: string;
    pickingStrategy: 'FIFO' | 'LIFO' | 'FEFO' | 'manual';
  };
  integration?: {
    wmsSystem?: string;
    apiEndpoint?: string;
    lastSyncDate?: Date;
    syncEnabled: boolean;
  };
  notes?: string;
  tags?: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const warehouseSchema = new Schema<IWarehouse>(
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
      enum: ['main', 'branch', 'distribution', 'retail', 'virtual'],
      default: 'main',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
      required: true,
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
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180,
        },
      },
    },
    contact: {
      manager: String,
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      phone: String,
      alternatePhone: String,
    },
    capacity: {
      totalSpace: {
        type: Number,
        required: true,
        min: 0,
      },
      usedSpace: {
        type: Number,
        default: 0,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['sqft', 'sqm'],
        default: 'sqft',
        required: true,
      },
      zones: [
        {
          name: {
            type: String,
            required: true,
          },
          type: {
            type: String,
            enum: ['storage', 'receiving', 'shipping', 'picking', 'packing', 'quarantine'],
            required: true,
          },
          capacity: {
            type: Number,
            required: true,
            min: 0,
          },
          currentUsage: {
            type: Number,
            default: 0,
            min: 0,
          },
          temperatureControlled: {
            type: Boolean,
            default: false,
          },
          temperatureRange: {
            min: Number,
            max: Number,
            unit: {
              type: String,
              enum: ['C', 'F'],
              default: 'C',
            },
          },
        },
      ],
    },
    inventory: {
      totalItems: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalValue: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastCountDate: Date,
      cycleCountSchedule: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      },
      nextCountDate: Date,
    },
    operations: {
      workingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String },
      },
      holidays: [
        {
          date: {
            type: Date,
            required: true,
          },
          description: String,
        },
      ],
      staffCount: {
        type: Number,
        min: 0,
      },
      equipment: [
        {
          type: {
            type: String,
            required: true,
          },
          quantity: {
            type: Number,
            default: 1,
            min: 1,
          },
          condition: {
            type: String,
            enum: ['good', 'fair', 'maintenance'],
            default: 'good',
          },
        },
      ],
    },
    settings: {
      isDefault: {
        type: Boolean,
        default: false,
      },
      allowNegativeStock: {
        type: Boolean,
        default: false,
      },
      autoTransferEnabled: {
        type: Boolean,
        default: false,
      },
      minimumStockAlerts: {
        type: Boolean,
        default: true,
      },
      barcodePrefix: String,
      pickingStrategy: {
        type: String,
        enum: ['FIFO', 'LIFO', 'FEFO', 'manual'],
        default: 'FIFO',
      },
    },
    integration: {
      wmsSystem: String,
      apiEndpoint: String,
      lastSyncDate: Date,
      syncEnabled: {
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
warehouseSchema.index({ code: 1 }, { unique: true });
warehouseSchema.index({ status: 1, type: 1 });
warehouseSchema.index({ 'settings.isDefault': 1 });
warehouseSchema.index({ 'address.city': 1, 'address.country': 1 });
warehouseSchema.index({ tags: 1 });

// Apply the toJSON plugin
warehouseSchema.plugin(toJSON);

// Pre-save middleware
warehouseSchema.pre('save', async function(next) {
  // Generate warehouse code if not provided
  if (this.isNew && !this.code) {
    const count = await mongoose.model('Warehouse').countDocuments({});
    this.code = `WH${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate used space
  if (this.isModified('capacity.zones')) {
    this.capacity.usedSpace = this.capacity.zones.reduce((total, zone) => total + zone.currentUsage, 0);
  }
  
  // Set next count date based on schedule
  if (this.isModified('inventory.cycleCountSchedule') && this.inventory.cycleCountSchedule) {
    const now = new Date();
    switch (this.inventory.cycleCountSchedule) {
      case 'daily':
        this.inventory.nextCountDate = new Date(now.setDate(now.getDate() + 1));
        break;
      case 'weekly':
        this.inventory.nextCountDate = new Date(now.setDate(now.getDate() + 7));
        break;
      case 'monthly':
        this.inventory.nextCountDate = new Date(now.setMonth(now.getMonth() + 1));
        break;
      case 'quarterly':
        this.inventory.nextCountDate = new Date(now.setMonth(now.getMonth() + 3));
        break;
    }
  }
  
  next();
});

// Instance methods
warehouseSchema.methods.getUtilization = function(): number {
  if (this.capacity.totalSpace === 0) return 0;
  return (this.capacity.usedSpace / this.capacity.totalSpace) * 100;
};

warehouseSchema.methods.isOperational = function(date = new Date()): boolean {
  if (this.status !== 'active') return false;
  
  // Get day of week as lowercase string (e.g., 'monday', 'tuesday', etc.)
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = days[date.getDay()];
  const workingHours = this.operations.workingHours[dayOfWeek];
  
  if (!workingHours || !workingHours.open || !workingHours.close) return false;
  
  // Check if it's a holiday
  const isHoliday = this.operations.holidays?.some((holiday: { date: Date; description: string }) => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.toDateString() === date.toDateString();
  });
  
  return !isHoliday;
};

warehouseSchema.methods.canAccommodateItems = function(itemCount: number, spaceRequired: number): boolean {
  const availableSpace = this.capacity.totalSpace - this.capacity.usedSpace;
  return availableSpace >= spaceRequired;
};

warehouseSchema.methods.getAvailableZones = function(zoneType?: string) {
  return this.capacity.zones.filter((zone: any) => {
    const hasCapacity = zone.currentUsage < zone.capacity;
    return zoneType ? (zone.type === zoneType && hasCapacity) : hasCapacity;
  });
};

// Static methods
warehouseSchema.statics.findActive = function(status = 'active') {
  return this.find({
    status,
    isActive: true,
  }).sort('name');
};

warehouseSchema.statics.findDefault = function() {
  return this.findOne({
    'settings.isDefault': true,
    status: 'active',
    isActive: true,
  });
};

warehouseSchema.statics.findNearby = function(coordinates: { latitude: number; longitude: number }, maxDistance = 100) {
  // Simple distance calculation - in production, use proper geospatial queries
  return this.find({
    status: 'active',
    isActive: true,
    'address.coordinates': { $exists: true },
  });
};

warehouseSchema.statics.findWithAvailableSpace = function(requiredSpace: number) {
  return this.find({
    status: 'active',
    isActive: true,
    $expr: { $lt: ['$capacity.usedSpace', { $subtract: ['$capacity.totalSpace', requiredSpace] }] },
  });
};

const Warehouse = mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', warehouseSchema);

export default Warehouse;
