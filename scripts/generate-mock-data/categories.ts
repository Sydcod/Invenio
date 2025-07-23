/**
 * Category Generator for Miami Electronics Store
 * Generates a 3-level hierarchy of electronics categories
 */

import { Types } from 'mongoose';

export interface CategoryData {
  _id: Types.ObjectId;
  name: string;
  parentId: Types.ObjectId | null;
  path: string;
  level: number;
  description: string;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    slug: string;
  };
  metadata?: {
    icon?: string;
    color?: string;
    imageUrl?: string;
  };
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Category structure definition
const categoryStructure = {
  root: {
    name: 'Electronics',
    description: 'All electronics products, devices, and accessories for Miami customers',
    icon: 'cpu',
    color: '#3B82F6'
  },
  subcategories: [
    {
      name: 'Computers & Tablets',
      description: 'Desktop computers, laptops, tablets, and accessories',
      icon: 'computer',
      leafCategories: [
        { name: 'Laptops', description: 'Portable computers for work, gaming, and creativity' },
        { name: 'Desktop Computers', description: 'High-performance desktop PCs and workstations' },
        { name: 'Tablets', description: 'iPads, Android tablets, and e-readers' },
        { name: 'Computer Accessories', description: 'Keyboards, mice, webcams, and more' },
        { name: 'Computer Components', description: 'CPUs, GPUs, RAM, and PC parts' }
      ]
    },
    {
      name: 'TV & Home Theater',
      description: 'Televisions, projectors, sound systems, and home entertainment',
      icon: 'tv',
      leafCategories: [
        { name: 'Televisions', description: '4K, 8K, OLED, and Smart TVs' },
        { name: 'Home Audio', description: 'Soundbars, home theater systems, and speakers' },
        { name: 'Projectors', description: 'Home and business projectors' },
        { name: 'Streaming Devices', description: 'Roku, Apple TV, Chromecast, and more' }
      ]
    },
    {
      name: 'Mobile & Accessories',
      description: 'Smartphones, cases, chargers, and mobile accessories',
      icon: 'smartphone',
      leafCategories: [
        { name: 'Smartphones', description: 'iPhones, Samsung Galaxy, and other smartphones' },
        { name: 'Phone Cases', description: 'Protective cases and covers' },
        { name: 'Chargers & Cables', description: 'Wireless chargers, cables, and power banks' },
        { name: 'Screen Protectors', description: 'Tempered glass and film protectors' }
      ]
    },
    {
      name: 'Gaming',
      description: 'Gaming consoles, games, and accessories',
      icon: 'gamepad',
      leafCategories: [
        { name: 'Gaming Consoles', description: 'PlayStation, Xbox, Nintendo Switch' },
        { name: 'Video Games', description: 'Latest games for all platforms' },
        { name: 'Gaming Accessories', description: 'Controllers, headsets, and gaming chairs' },
        { name: 'PC Gaming', description: 'Gaming PCs, graphics cards, and peripherals' }
      ]
    },
    {
      name: 'Smart Home',
      description: 'Smart home devices and automation for Miami homes',
      icon: 'home',
      leafCategories: [
        { name: 'Smart Speakers', description: 'Alexa, Google Home, and smart displays' },
        { name: 'Smart Lighting', description: 'Smart bulbs, switches, and lighting systems' },
        { name: 'Smart Security', description: 'Cameras, doorbells, and security systems' },
        { name: 'Smart Climate', description: 'Smart thermostats and air quality monitors' }
      ]
    },
    {
      name: 'Audio',
      description: 'Headphones, speakers, and audio equipment',
      icon: 'headphones',
      leafCategories: [
        { name: 'Headphones', description: 'Over-ear, on-ear, and in-ear headphones' },
        { name: 'Bluetooth Speakers', description: 'Portable and waterproof speakers' },
        { name: 'Earbuds', description: 'True wireless and sports earbuds' },
        { name: 'Pro Audio', description: 'Microphones, mixers, and studio equipment' }
      ]
    },
    {
      name: 'Cameras & Photography',
      description: 'Digital cameras, lenses, and photography equipment',
      icon: 'camera',
      leafCategories: [
        { name: 'Digital Cameras', description: 'DSLR, mirrorless, and point-and-shoot cameras' },
        { name: 'Camera Lenses', description: 'Wide angle, telephoto, and specialty lenses' },
        { name: 'Camera Accessories', description: 'Tripods, bags, and memory cards' },
        { name: 'Drones', description: 'Camera drones and accessories' }
      ]
    },
    {
      name: 'Office Electronics',
      description: 'Printers, scanners, and office equipment',
      icon: 'printer',
      leafCategories: [
        { name: 'Printers', description: 'Inkjet, laser, and all-in-one printers' },
        { name: 'Scanners', description: 'Document and photo scanners' },
        { name: 'Office Accessories', description: 'Ink, toner, paper, and supplies' },
        { name: 'Presentation Tools', description: 'Laser pointers and presenters' }
      ]
    }
  ]
};

function createSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateCategories(): CategoryData[] {
  const categories: CategoryData[] = [];
  let sortOrder = 1;
  const now = new Date('2024-01-01');

  // Create root category
  const rootId = new Types.ObjectId();
  const rootCategory: CategoryData = {
    _id: rootId,
    name: categoryStructure.root.name,
    parentId: null,
    path: '/electronics',
    level: 0,
    description: categoryStructure.root.description,
    seo: {
      metaTitle: 'Electronics - Miami Electronics Store',
      metaDescription: 'Shop the best electronics in Miami, FL. TVs, computers, smartphones, gaming, and more.',
      slug: 'electronics'
    },
    metadata: {
      icon: categoryStructure.root.icon,
      color: categoryStructure.root.color,
      imageUrl: '/images/categories/electronics.jpg'
    },
    isActive: true,
    sortOrder: sortOrder++,
    productCount: 0,
    tags: ['electronics', 'miami', 'technology'],
    createdAt: now,
    updatedAt: now
  };
  categories.push(rootCategory);

  // Create subcategories and leaf categories
  categoryStructure.subcategories.forEach((subcat, subIndex) => {
    const subcatId = new Types.ObjectId();
    const subcatSlug = createSlug(subcat.name);
    
    // Create subcategory
    const subcategory: CategoryData = {
      _id: subcatId,
      name: subcat.name,
      parentId: rootId,
      path: `/electronics/${subcatSlug}`,
      level: 1,
      description: subcat.description,
      seo: {
        metaTitle: `${subcat.name} - Miami Electronics Store`,
        metaDescription: `${subcat.description} Shop online or visit our Miami stores.`,
        slug: subcatSlug
      },
      metadata: {
        icon: subcat.icon,
        color: categoryStructure.root.color
      },
      isActive: true,
      sortOrder: sortOrder++,
      productCount: 0,
      createdAt: now,
      updatedAt: now
    };
    categories.push(subcategory);

    // Create leaf categories
    subcat.leafCategories.forEach((leaf, leafIndex) => {
      const leafSlug = createSlug(leaf.name);
      
      const leafCategory: CategoryData = {
        _id: new Types.ObjectId(),
        name: leaf.name,
        parentId: subcatId,
        path: `/electronics/${subcatSlug}/${leafSlug}`,
        level: 2,
        description: leaf.description,
        seo: {
          metaTitle: `${leaf.name} - ${subcat.name} - Miami Electronics`,
          metaDescription: `${leaf.description} Best prices in Miami, FL.`,
          slug: leafSlug
        },
        metadata: {
          icon: subcat.icon,
          color: categoryStructure.root.color
        },
        isActive: true,
        sortOrder: sortOrder++,
        productCount: 0,
        createdAt: now,
        updatedAt: now
      };
      categories.push(leafCategory);
    });
  });

  return categories;
}

// Export category mapping for product generation
export function getCategoryMapping(categories: CategoryData[]): Map<string, Types.ObjectId> {
  const mapping = new Map<string, Types.ObjectId>();
  categories.forEach(cat => {
    if (cat.level === 2) { // Only leaf categories
      mapping.set(cat.name, cat._id);
    }
  });
  return mapping;
}
