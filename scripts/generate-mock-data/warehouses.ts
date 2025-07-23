/**
 * Warehouse Generator for Miami Electronics Store
 * Generates 4-5 warehouses in Miami/South Florida area
 */

import { Types } from 'mongoose';

export interface WarehouseData {
  _id: Types.ObjectId;
  code: string;
  name: string;
  type: 'distribution' | 'retail' | 'storage' | 'fulfillment';
  status: 'active' | 'inactive' | 'maintenance';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    alternatePhone?: string;
    email: string;
    manager: {
      name: string;
      email: string;
      phone: string;
    };
  };
  capacity: {
    totalSpace: number;
    usedSpace: number;
    availableSpace: number;
    unit: string;
    maxPallets?: number;
    currentPallets?: number;
  };
  zones?: Array<{
    name: string;
    code: string;
    capacity: number;
    type: string;
    temperature?: {
      min: number;
      max: number;
      unit: string;
    };
  }>;
  settings: {
    isDefault: boolean;
    allowNegativeStock: boolean;
    autoReorder: boolean;
    minOrderValue: number;
    maxOrderValue: number;
  };
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  capabilities?: string[];
  certifications?: Array<{
    name: string;
    issuedBy: string;
    validUntil: Date;
  }>;
  performance?: {
    avgFulfillmentTime: number;
    accuracyRate: number;
    onTimeDeliveryRate: number;
    returnRate: number;
  };
  staff?: {
    total: number;
    shifts: {
      morning: number;
      afternoon: number;
      night: number;
    };
  };
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const warehouseDefinitions = [
  {
    code: 'WH-MIA-001',
    name: 'Miami Main Distribution Center',
    type: 'distribution' as const,
    address: {
      street: '2500 NW 107th Avenue',
      city: 'Miami',
      state: 'FL',
      postalCode: '33172',
      coordinates: { latitude: 25.7959, longitude: -80.3683 }
    },
    manager: {
      name: 'Carlos Rodriguez',
      email: 'c.rodriguez@miamielectronics.com',
      phone: '+1-305-555-0102'
    },
    capacity: {
      totalSpace: 100000,
      usedSpace: 68000,
      maxPallets: 3000,
      currentPallets: 2040
    },
    zones: [
      {
        name: 'Zone A - High Value Electronics',
        code: 'A',
        capacity: 25000,
        type: 'secure',
        temperature: { min: 65, max: 75, unit: 'F' }
      },
      {
        name: 'Zone B - Large Items (TVs, Appliances)',
        code: 'B',
        capacity: 35000,
        type: 'standard'
      },
      {
        name: 'Zone C - Small Electronics',
        code: 'C',
        capacity: 25000,
        type: 'standard'
      },
      {
        name: 'Zone D - Returns & Processing',
        code: 'D',
        capacity: 15000,
        type: 'processing'
      }
    ],
    capabilities: ['standard_shipping', 'express_shipping', 'white_glove_delivery', 'installation_service', 'electronics_recycling'],
    certifications: [
      { name: 'ISO 9001:2015', issuedBy: 'ISO', validUntil: new Date('2026-12-31') },
      { name: 'EPA Electronics Recycling', issuedBy: 'EPA', validUntil: new Date('2025-06-30') }
    ],
    staff: { total: 45, shifts: { morning: 20, afternoon: 15, night: 10 } },
    notes: 'Primary distribution center for South Florida region. Hurricane-resistant building with backup generators.',
    isDefault: true
  },
  {
    code: 'WH-AVE-002',
    name: 'Aventura Retail Warehouse',
    type: 'retail' as const,
    address: {
      street: '19501 Biscayne Boulevard',
      city: 'Aventura',
      state: 'FL',
      postalCode: '33180',
      coordinates: { latitude: 25.9523, longitude: -80.1434 }
    },
    manager: {
      name: 'Maria Gonzalez',
      email: 'm.gonzalez@miamielectronics.com',
      phone: '+1-305-555-0201'
    },
    capacity: {
      totalSpace: 25000,
      usedSpace: 18000,
      maxPallets: 750,
      currentPallets: 540
    },
    zones: [
      {
        name: 'Showroom Floor',
        code: 'SF',
        capacity: 10000,
        type: 'retail'
      },
      {
        name: 'Back Stock',
        code: 'BS',
        capacity: 15000,
        type: 'storage'
      }
    ],
    capabilities: ['customer_pickup', 'will_call', 'same_day_delivery', 'tech_support'],
    staff: { total: 25, shifts: { morning: 12, afternoon: 10, night: 3 } },
    notes: 'High-end retail location in Aventura Mall area. Customer pickup available.',
    isDefault: false
  },
  {
    code: 'WH-CG-003',
    name: 'Coral Gables Store Warehouse',
    type: 'retail' as const,
    address: {
      street: '2000 Ponce de Leon Boulevard',
      city: 'Coral Gables',
      state: 'FL',
      postalCode: '33134',
      coordinates: { latitude: 25.7467, longitude: -80.2617 }
    },
    manager: {
      name: 'Robert Chen',
      email: 'r.chen@miamielectronics.com',
      phone: '+1-305-555-0301'
    },
    capacity: {
      totalSpace: 20000,
      usedSpace: 15000,
      maxPallets: 600,
      currentPallets: 450
    },
    zones: [
      {
        name: 'Premium Products',
        code: 'PP',
        capacity: 8000,
        type: 'retail'
      },
      {
        name: 'Standard Inventory',
        code: 'SI',
        capacity: 12000,
        type: 'storage'
      }
    ],
    capabilities: ['customer_pickup', 'premium_service', 'product_demos', 'business_accounts'],
    staff: { total: 20, shifts: { morning: 10, afternoon: 8, night: 2 } },
    notes: 'Premium location serving Coral Gables business district.',
    isDefault: false
  },
  {
    code: 'WH-HOM-004',
    name: 'Homestead Storage Facility',
    type: 'storage' as const,
    address: {
      street: '30205 SW 217th Avenue',
      city: 'Homestead',
      state: 'FL',
      postalCode: '33030',
      coordinates: { latitude: 25.4687, longitude: -80.5604 }
    },
    manager: {
      name: 'James Thompson',
      email: 'j.thompson@miamielectronics.com',
      phone: '+1-305-555-0401'
    },
    capacity: {
      totalSpace: 75000,
      usedSpace: 45000,
      maxPallets: 2250,
      currentPallets: 1350
    },
    zones: [
      {
        name: 'Bulk Storage',
        code: 'BLK',
        capacity: 50000,
        type: 'bulk'
      },
      {
        name: 'Seasonal Items',
        code: 'SEA',
        capacity: 25000,
        type: 'seasonal'
      }
    ],
    capabilities: ['bulk_storage', 'long_term_storage', 'freight_receiving'],
    certifications: [
      { name: 'Climate Controlled Storage', issuedBy: 'SSA', validUntil: new Date('2025-12-31') }
    ],
    staff: { total: 15, shifts: { morning: 8, afternoon: 5, night: 2 } },
    notes: 'Overflow and seasonal storage facility. Lower cost operations.',
    isDefault: false
  },
  {
    code: 'WH-BRK-005',
    name: 'Brickell Express Hub',
    type: 'fulfillment' as const,
    address: {
      street: '1101 Brickell Avenue',
      city: 'Miami',
      state: 'FL',
      postalCode: '33131',
      coordinates: { latitude: 25.7617, longitude: -80.1918 }
    },
    manager: {
      name: 'Sofia Martinez',
      email: 's.martinez@miamielectronics.com',
      phone: '+1-305-555-0501'
    },
    capacity: {
      totalSpace: 10000,
      usedSpace: 7500,
      maxPallets: 300,
      currentPallets: 225
    },
    zones: [
      {
        name: 'Express Fulfillment',
        code: 'EXP',
        capacity: 7000,
        type: 'express'
      },
      {
        name: 'Same Day Staging',
        code: 'SDS',
        capacity: 3000,
        type: 'staging'
      }
    ],
    capabilities: ['same_day_delivery', 'express_shipping', 'urban_delivery', 'courier_service'],
    staff: { total: 12, shifts: { morning: 6, afternoon: 4, night: 2 } },
    notes: 'Downtown Miami location for same-day delivery to business district.',
    isDefault: false
  }
];

export function generateWarehouses(): WarehouseData[] {
  const warehouses: WarehouseData[] = [];
  const baseDate = new Date('2024-01-01');

  warehouseDefinitions.forEach((def) => {
    const warehouse: WarehouseData = {
      _id: new Types.ObjectId(),
      code: def.code,
      name: def.name,
      type: def.type,
      status: 'active',
      address: {
        ...def.address,
        country: 'USA'
      },
      contact: {
        phone: '+1-305-555-' + def.code.slice(-3) + '00',
        alternatePhone: '+1-305-555-' + def.code.slice(-3) + '01',
        email: def.code.toLowerCase() + '@miamielectronics.com',
        manager: def.manager
      },
      capacity: {
        ...def.capacity,
        availableSpace: def.capacity.totalSpace - def.capacity.usedSpace,
        unit: 'sqft'
      },
      zones: def.zones,
      settings: {
        isDefault: def.isDefault || false,
        allowNegativeStock: false,
        autoReorder: true,
        minOrderValue: def.type === 'retail' ? 0 : 50,
        maxOrderValue: def.type === 'retail' ? 50000 : 100000
      },
      operatingHours: generateOperatingHours(def.type),
      capabilities: def.capabilities,
      certifications: def.certifications,
      performance: {
        avgFulfillmentTime: def.type === 'fulfillment' ? 0.5 : 1.5,
        accuracyRate: 98.5 + Math.random() * 1.4,
        onTimeDeliveryRate: 96 + Math.random() * 3.5,
        returnRate: 1.5 + Math.random() * 1.5
      },
      staff: def.staff,
      tags: [def.type, def.address.city.toLowerCase(), 'miami', 'electronics'],
      notes: def.notes,
      createdAt: baseDate,
      updatedAt: new Date('2025-07-20')
    };

    warehouses.push(warehouse);
  });

  return warehouses;
}

function generateOperatingHours(type: string) {
  const retailHours = {
    monday: { open: '09:00', close: '21:00', isOpen: true },
    tuesday: { open: '09:00', close: '21:00', isOpen: true },
    wednesday: { open: '09:00', close: '21:00', isOpen: true },
    thursday: { open: '09:00', close: '21:00', isOpen: true },
    friday: { open: '09:00', close: '22:00', isOpen: true },
    saturday: { open: '10:00', close: '22:00', isOpen: true },
    sunday: { open: '11:00', close: '19:00', isOpen: true }
  };

  const distributionHours = {
    monday: { open: '07:00', close: '19:00', isOpen: true },
    tuesday: { open: '07:00', close: '19:00', isOpen: true },
    wednesday: { open: '07:00', close: '19:00', isOpen: true },
    thursday: { open: '07:00', close: '19:00', isOpen: true },
    friday: { open: '07:00', close: '19:00', isOpen: true },
    saturday: { open: '08:00', close: '14:00', isOpen: true },
    sunday: { open: '00:00', close: '00:00', isOpen: false }
  };

  const fulfillmentHours = {
    monday: { open: '06:00', close: '22:00', isOpen: true },
    tuesday: { open: '06:00', close: '22:00', isOpen: true },
    wednesday: { open: '06:00', close: '22:00', isOpen: true },
    thursday: { open: '06:00', close: '22:00', isOpen: true },
    friday: { open: '06:00', close: '22:00', isOpen: true },
    saturday: { open: '08:00', close: '20:00', isOpen: true },
    sunday: { open: '10:00', close: '18:00', isOpen: true }
  };

  switch (type) {
    case 'retail':
      return retailHours;
    case 'fulfillment':
      return fulfillmentHours;
    default:
      return distributionHours;
  }
}

// Export warehouse mapping for order generation
export function getWarehouseMapping(warehouses: WarehouseData[]): Map<string, Types.ObjectId> {
  const mapping = new Map<string, Types.ObjectId>();
  warehouses.forEach(wh => {
    mapping.set(wh.code, wh._id);
    mapping.set(wh.name, wh._id);
  });
  return mapping;
}
