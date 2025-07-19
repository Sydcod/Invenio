import mongoose, { Schema, Document } from 'mongoose';
import toJSON from './plugins/toJSON';

export interface ICategory extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  path: string;
  level: number;
  sortOrder: number;
  properties: {
    icon?: string;
    color?: string;
    image?: string;
    isVisible: boolean;
    allowProducts: boolean;
    requiresApproval: boolean;
  };
  defaultSettings: {
    taxable: boolean;
    trackInventory: boolean;
    allowBackorder: boolean;
  };
  attributes?: Array<{
    name: string;
    type: 'text' | 'number' | 'select' | 'multiselect';
    required: boolean;
    options?: string[];
    defaultValue?: string;
  }>;
  stats: {
    itemCount: number;
    totalValue: number;
    averagePrice: number;
    lastUpdated: Date;
  };
  seo?: {
    slug: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    path: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    properties: {
      icon: String,
      color: {
        type: String,
        match: /^#[0-9A-F]{6}$/i,
      },
      image: String,
      isVisible: {
        type: Boolean,
        default: true,
      },
      allowProducts: {
        type: Boolean,
        default: true,
      },
      requiresApproval: {
        type: Boolean,
        default: false,
      },
    },
    defaultSettings: {
      taxable: {
        type: Boolean,
        default: true,
      },
      trackInventory: {
        type: Boolean,
        default: true,
      },
      allowBackorder: {
        type: Boolean,
        default: false,
      },
    },
    attributes: [
      {
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['text', 'number', 'select', 'multiselect'],
          required: true,
        },
        required: {
          type: Boolean,
          default: false,
        },
        options: [String],
        defaultValue: String,
      },
    ],
    stats: {
      itemCount: {
        type: Number,
        default: 0,
      },
      totalValue: {
        type: Number,
        default: 0,
      },
      averagePrice: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    seo: {
      slug: {
        type: String,
        lowercase: true,
        trim: true,
      },
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
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
categorySchema.index({ organizationId: 1, parentId: 1 });
categorySchema.index({ organizationId: 1, path: 1 });
categorySchema.index({ organizationId: 1, name: 1 });
categorySchema.index({ organizationId: 1, 'seo.slug': 1 }, { unique: true, sparse: true });
categorySchema.index({ organizationId: 1, isActive: 1, sortOrder: 1 });

// Apply the toJSON plugin
categorySchema.plugin(toJSON);

// Pre-save middleware to update path
categorySchema.pre('save', async function(next) {
  if (this.isModified('parentId') || this.isNew) {
    if (this.parentId) {
      const parent = await mongoose.model('Category').findById(this.parentId);
      if (parent) {
        this.path = `${parent.path}/${this.name}`;
        this.level = parent.level + 1;
      }
    } else {
      this.path = this.name;
      this.level = 0;
    }
  }
  next();
});

// Instance methods
categorySchema.methods.getChildren = function() {
  return mongoose.model('Category').find({
    organizationId: this.organizationId,
    parentId: this._id,
    isActive: true,
  }).sort('sortOrder');
};

categorySchema.methods.getAncestors = async function() {
  const ancestors = [];
  let currentCategory = this;
  
  while (currentCategory.parentId) {
    const parent = await mongoose.model('Category').findById(currentCategory.parentId);
    if (!parent) break;
    ancestors.push(parent);
    currentCategory = parent;
  }
  
  return ancestors.reverse();
};

// Static methods
categorySchema.statics.findByOrganization = function(organizationId: mongoose.Types.ObjectId) {
  return this.find({
    organizationId,
    isActive: true,
  }).sort('sortOrder');
};

categorySchema.statics.findRootCategories = function(organizationId: mongoose.Types.ObjectId) {
  return this.find({
    organizationId,
    parentId: null,
    isActive: true,
  }).sort('sortOrder');
};

categorySchema.statics.buildTree = async function(organizationId: mongoose.Types.ObjectId) {
  const categories = await this.find({ organizationId, isActive: true }).sort('sortOrder');
  const categoryMap = new Map<string, any>();
  const tree: any[] = [];

  // First pass: create map
  categories.forEach((cat: any) => {
    categoryMap.set(cat._id.toString(), {
      ...cat.toObject(),
      children: [],
    });
  });

  // Second pass: build tree
  categories.forEach((cat: any) => {
    const categoryObj = categoryMap.get(cat._id.toString());
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId.toString());
      if (parent) {
        parent.children.push(categoryObj);
      }
    } else {
      tree.push(categoryObj);
    }
  });

  return tree;
};

const Category = mongoose.model<ICategory>('Category', categorySchema);

export default Category;
