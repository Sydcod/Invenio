/**
 * Supplier Generator for Miami Electronics Store
 * Generates 15-20 suppliers including manufacturers, distributors, and local wholesalers
 */

import { Types } from 'mongoose';

export interface SupplierData {
  _id: Types.ObjectId;
  code: string;
  name: string;
  type: 'manufacturer' | 'distributor' | 'wholesaler' | 'dropshipper';
  status: 'active' | 'inactive' | 'suspended';
  contact: {
    primaryContact: {
      name: string;
      email: string;
      phone: string;
      position?: string;
    };
    alternateContact?: {
      name: string;
      email: string;
      phone: string;
      position?: string;
    };
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    website?: string;
  };
  financial: {
    taxId: string;
    currency: string;
    paymentTerms: string;
    creditLimit: number;
    currentBalance: number;
    totalPurchases?: number;
  };
  shipping: {
    methods: string[];
    leadTime: number; // in days
    freeShippingThreshold?: number;
    locations: string[];
  };
  products?: {
    categories: string[];
    brandNames: string[];
    totalProducts?: number;
  };
  performance?: {
    rating: number;
    onTimeDeliveryRate: number;
    qualityScore: number;
    responseTime: number; // in hours
    totalOrders?: number;
    returnRate?: number;
  };
  compliance?: {
    certifications?: string[];
    insuranceExpiry?: Date;
    licenses?: Array<{
      type: string;
      number: string;
      expiry: Date;
    }>;
  };
  bankDetails?: {
    bankName: string;
    accountName: string;
    routingNumber: string;
    accountNumber: string;
  };
  notes?: string;
  tags: string[];
  isPreferred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supplierDefinitions = [
  // Manufacturers
  {
    code: 'SUP-MFG-001',
    name: 'Apple Inc.',
    type: 'manufacturer' as const,
    primaryContact: {
      name: 'Jennifer Martinez',
      email: 'j.martinez@apple.com',
      phone: '+1-408-996-1010',
      position: 'Account Manager'
    },
    address: {
      street: 'One Apple Park Way',
      city: 'Cupertino',
      state: 'CA',
      postalCode: '95014'
    },
    website: 'https://www.apple.com',
    taxId: '94-2404110',
    paymentTerms: 'Net 30',
    creditLimit: 500000,
    leadTime: 5,
    categories: ['Laptops', 'Tablets', 'Smartphones'],
    brandNames: ['Apple'],
    certifications: ['ISO 9001', 'ISO 14001', 'EPEAT Gold'],
    notes: 'Premium supplier. Requires advance payment for first 3 orders.',
    isPreferred: true
  },
  {
    code: 'SUP-MFG-002',
    name: 'Samsung Electronics',
    type: 'manufacturer' as const,
    primaryContact: {
      name: 'David Kim',
      email: 'd.kim@samsung.com',
      phone: '+1-201-229-4000',
      position: 'Regional Sales Manager'
    },
    address: {
      street: '85 Challenger Road',
      city: 'Ridgefield Park',
      state: 'NJ',
      postalCode: '07660'
    },
    website: 'https://www.samsung.com',
    taxId: '52-1721859',
    paymentTerms: 'Net 45',
    creditLimit: 400000,
    leadTime: 7,
    categories: ['Televisions', 'Smartphones', 'Tablets', 'Home Audio'],
    brandNames: ['Samsung'],
    certifications: ['ISO 9001', 'ISO 14001', 'ENERGY STAR Partner'],
    isPreferred: true
  },
  {
    code: 'SUP-MFG-003',
    name: 'Dell Technologies',
    type: 'manufacturer' as const,
    primaryContact: {
      name: 'Robert Johnson',
      email: 'r.johnson@dell.com',
      phone: '+1-800-999-3355',
      position: 'Enterprise Account Manager'
    },
    address: {
      street: 'One Dell Way',
      city: 'Round Rock',
      state: 'TX',
      postalCode: '78682'
    },
    website: 'https://www.dell.com',
    taxId: '74-2487834',
    paymentTerms: 'Net 30',
    creditLimit: 350000,
    leadTime: 5,
    categories: ['Desktop Computers', 'Laptops', 'Computer Components'],
    brandNames: ['Dell', 'Alienware'],
    certifications: ['ISO 9001', 'ISO 14001'],
    isPreferred: true
  },
  {
    code: 'SUP-MFG-004',
    name: 'HP Inc.',
    type: 'manufacturer' as const,
    primaryContact: {
      name: 'Sarah Williams',
      email: 's.williams@hp.com',
      phone: '+1-650-857-1501',
      position: 'Channel Partner Manager'
    },
    address: {
      street: '1501 Page Mill Road',
      city: 'Palo Alto',
      state: 'CA',
      postalCode: '94304'
    },
    website: 'https://www.hp.com',
    taxId: '94-1081436',
    paymentTerms: 'Net 45',
    creditLimit: 300000,
    leadTime: 6,
    categories: ['Laptops', 'Desktop Computers', 'Printers'],
    brandNames: ['HP', 'OMEN'],
    certifications: ['ISO 9001', 'ISO 14001', 'EPEAT Gold'],
    isPreferred: true
  },
  {
    code: 'SUP-MFG-005',
    name: 'LG Electronics',
    type: 'manufacturer' as const,
    primaryContact: {
      name: 'Michael Park',
      email: 'm.park@lge.com',
      phone: '+1-201-816-2000',
      position: 'Sales Director'
    },
    address: {
      street: '111 Sylvan Avenue',
      city: 'Englewood Cliffs',
      state: 'NJ',
      postalCode: '07632'
    },
    website: 'https://www.lg.com',
    taxId: '13-3882008',
    paymentTerms: 'Net 30',
    creditLimit: 250000,
    leadTime: 7,
    categories: ['Televisions', 'Home Audio', 'Smart Home'],
    brandNames: ['LG'],
    certifications: ['ISO 9001', 'ENERGY STAR Partner'],
    isPreferred: true
  },
  {
    code: 'SUP-MFG-006',
    name: 'Sony Corporation',
    type: 'manufacturer' as const,
    primaryContact: {
      name: 'Yuki Tanaka',
      email: 'y.tanaka@sony.com',
      phone: '+1-858-942-2000',
      position: 'Regional Account Manager'
    },
    address: {
      street: '16535 Via Esprillo',
      city: 'San Diego',
      state: 'CA',
      postalCode: '92127'
    },
    website: 'https://www.sony.com',
    taxId: '95-2666820',
    paymentTerms: 'Net 45',
    creditLimit: 300000,
    leadTime: 8,
    categories: ['Televisions', 'Gaming Consoles', 'Audio', 'Cameras'],
    brandNames: ['Sony', 'PlayStation'],
    certifications: ['ISO 9001', 'ISO 14001'],
    isPreferred: true
  },
  {
    code: 'SUP-MFG-007',
    name: 'Lenovo',
    type: 'manufacturer' as const,
    primaryContact: {
      name: 'Lisa Chen',
      email: 'l.chen@lenovo.com',
      phone: '+1-919-294-4800',
      position: 'Partner Account Manager'
    },
    address: {
      street: '1009 Think Place',
      city: 'Morrisville',
      state: 'NC',
      postalCode: '27560'
    },
    website: 'https://www.lenovo.com',
    taxId: '41-1945908',
    paymentTerms: 'Net 30',
    creditLimit: 200000,
    leadTime: 6,
    categories: ['Laptops', 'Desktop Computers', 'Tablets'],
    brandNames: ['Lenovo', 'ThinkPad', 'IdeaPad'],
    certifications: ['ISO 9001', 'ISO 14001'],
    isPreferred: false
  },

  // Distributors
  {
    code: 'SUP-DST-001',
    name: 'Tech Data Corporation',
    type: 'distributor' as const,
    primaryContact: {
      name: 'Michael Thompson',
      email: 'mthompson@techdata.com',
      phone: '+1-305-555-3100',
      position: 'Sales Representative'
    },
    alternateContact: {
      name: 'Sarah Johnson',
      email: 'sjohnson@techdata.com',
      phone: '+1-305-555-3101',
      position: 'Account Support'
    },
    address: {
      street: '5350 Tech Data Drive',
      city: 'Clearwater',
      state: 'FL',
      postalCode: '33760'
    },
    website: 'https://www.techdata.com',
    taxId: '59-1239707',
    paymentTerms: 'Net 45',
    creditLimit: 250000,
    leadTime: 3,
    categories: ['All Electronics'],
    brandNames: ['Multiple Brands'],
    certifications: ['ISO 9001'],
    notes: 'Large distributor with wide product range. Good for bulk orders.',
    isPreferred: true
  },
  {
    code: 'SUP-DST-002',
    name: 'Ingram Micro',
    type: 'distributor' as const,
    primaryContact: {
      name: 'Patricia Rodriguez',
      email: 'p.rodriguez@ingrammicro.com',
      phone: '+1-714-566-1000',
      position: 'Account Executive'
    },
    address: {
      street: '3351 Michelson Drive',
      city: 'Irvine',
      state: 'CA',
      postalCode: '92612'
    },
    website: 'https://www.ingrammicro.com',
    taxId: '95-2557465',
    paymentTerms: 'Net 60',
    creditLimit: 300000,
    leadTime: 4,
    categories: ['All Electronics'],
    brandNames: ['Multiple Brands'],
    certifications: ['ISO 9001', 'ISO 14001'],
    isPreferred: true
  },
  {
    code: 'SUP-DST-003',
    name: 'Synnex Corporation',
    type: 'distributor' as const,
    primaryContact: {
      name: 'James Lee',
      email: 'j.lee@synnex.com',
      phone: '+1-510-656-3333',
      position: 'Regional Sales Manager'
    },
    address: {
      street: '44201 Nobel Drive',
      city: 'Fremont',
      state: 'CA',
      postalCode: '94538'
    },
    website: 'https://www.synnex.com',
    taxId: '94-2703333',
    paymentTerms: 'Net 45',
    creditLimit: 200000,
    leadTime: 5,
    categories: ['All Electronics'],
    brandNames: ['Multiple Brands'],
    certifications: ['ISO 9001'],
    isPreferred: false
  },

  // Local Wholesalers
  {
    code: 'SUP-WHL-001',
    name: 'Miami Electronics Wholesale',
    type: 'wholesaler' as const,
    primaryContact: {
      name: 'Carlos Mendez',
      email: 'cmendez@miamielectronicswholesale.com',
      phone: '+1-305-555-4100',
      position: 'Owner'
    },
    address: {
      street: '8900 NW 35th Lane',
      city: 'Doral',
      state: 'FL',
      postalCode: '33172'
    },
    website: 'https://www.miamielectronicswholesale.com',
    taxId: '65-1234567',
    paymentTerms: 'Net 30',
    creditLimit: 100000,
    leadTime: 1,
    categories: ['Computer Accessories', 'Mobile Accessories', 'Audio'],
    brandNames: ['Various'],
    notes: 'Local supplier with fast delivery. Good for urgent orders.',
    isPreferred: true
  },
  {
    code: 'SUP-WHL-002',
    name: 'Florida Tech Distributors',
    type: 'wholesaler' as const,
    primaryContact: {
      name: 'Ana Garcia',
      email: 'agarcia@floridatechdist.com',
      phone: '+1-305-555-4200',
      position: 'Sales Manager'
    },
    address: {
      street: '15600 SW 288th Street',
      city: 'Homestead',
      state: 'FL',
      postalCode: '33033'
    },
    taxId: '65-2345678',
    paymentTerms: 'Net 30',
    creditLimit: 75000,
    leadTime: 2,
    categories: ['Smart Home', 'Computer Components', 'Office Electronics'],
    brandNames: ['Various'],
    isPreferred: false
  },
  {
    code: 'SUP-WHL-003',
    name: 'Southeast Electronics Supply',
    type: 'wholesaler' as const,
    primaryContact: {
      name: 'Mark Davis',
      email: 'mdavis@southeastelectronics.com',
      phone: '+1-305-555-4300',
      position: 'Account Manager'
    },
    address: {
      street: '2100 Coral Way',
      city: 'Miami',
      state: 'FL',
      postalCode: '33145'
    },
    taxId: '65-3456789',
    paymentTerms: 'Net 15',
    creditLimit: 50000,
    leadTime: 1,
    categories: ['Gaming Accessories', 'Chargers & Cables', 'Screen Protectors'],
    brandNames: ['Generic', 'OEM'],
    notes: 'Budget supplier for accessories and generic items.',
    isPreferred: false
  },

  // Additional Miami-specific suppliers
  {
    code: 'SUP-WHL-004',
    name: 'Aventura Tech Supplies',
    type: 'wholesaler' as const,
    primaryContact: {
      name: 'Elena Rodriguez',
      email: 'erodriguez@aventuratechsupplies.com',
      phone: '+1-305-555-4400',
      position: 'Sales Director'
    },
    address: {
      street: '20801 Biscayne Blvd',
      city: 'Aventura',
      state: 'FL',
      postalCode: '33180'
    },
    taxId: '65-4567890',
    paymentTerms: 'Net 30',
    creditLimit: 125000,
    leadTime: 1,
    categories: ['Smart Home', 'Security Systems', 'Home Audio'],
    brandNames: ['Nest', 'Ring', 'Arlo', 'Sonos'],
    notes: 'Specializes in smart home and security products. Same-day delivery in North Miami.',
    isPreferred: true
  },
  {
    code: 'SUP-DST-004',
    name: 'Caribbean Electronics Network',
    type: 'distributor' as const,
    primaryContact: {
      name: 'Jean-Pierre Baptiste',
      email: 'jpbaptiste@caribelectronics.com',
      phone: '+1-305-555-3400',
      position: 'Regional Manager'
    },
    address: {
      street: '3500 NW 114th Avenue',
      city: 'Miami',
      state: 'FL',
      postalCode: '33178'
    },
    website: 'https://www.caribelectronics.com',
    taxId: '59-3456789',
    paymentTerms: 'Net 45',
    creditLimit: 175000,
    leadTime: 4,
    categories: ['All Electronics'],
    brandNames: ['Multiple Brands'],
    certifications: ['ISO 9001'],
    notes: 'Strong presence in Caribbean market. Good for international orders.',
    isPreferred: false
  },
  {
    code: 'SUP-MFG-008',
    name: 'Microsoft Corporation',
    type: 'manufacturer' as const,
    primaryContact: {
      name: 'Amanda Foster',
      email: 'afoster@microsoft.com',
      phone: '+1-425-882-8080',
      position: 'Partner Account Executive'
    },
    address: {
      street: 'One Microsoft Way',
      city: 'Redmond',
      state: 'WA',
      postalCode: '98052'
    },
    website: 'https://www.microsoft.com',
    taxId: '91-1144442',
    paymentTerms: 'Net 60',
    creditLimit: 400000,
    leadTime: 5,
    categories: ['Gaming Consoles', 'Tablets', 'Computer Accessories'],
    brandNames: ['Microsoft', 'Xbox', 'Surface'],
    certifications: ['ISO 9001', 'ISO 14001', 'ISO 27001'],
    isPreferred: true
  },
  {
    code: 'SUP-WHL-005',
    name: 'Brickell Electronic Boutique',
    type: 'wholesaler' as const,
    primaryContact: {
      name: 'Isabella Martinez',
      email: 'imartinez@brickellelectronic.com',
      phone: '+1-305-555-4500',
      position: 'Owner'
    },
    address: {
      street: '801 Brickell Avenue',
      city: 'Miami',
      state: 'FL',
      postalCode: '33131'
    },
    website: 'https://www.brickellelectronic.com',
    taxId: '65-5678901',
    paymentTerms: 'Net 15',
    creditLimit: 80000,
    leadTime: 1,
    categories: ['Premium Audio', 'Smart Home', 'Luxury Electronics'],
    brandNames: ['Bang & Olufsen', 'Bose', 'Harman Kardon'],
    notes: 'High-end electronics supplier. White glove delivery service available.',
    isPreferred: true
  },
  {
    code: 'SUP-DRP-001',
    name: 'TechDrop Miami',
    type: 'dropshipper' as const,
    primaryContact: {
      name: 'Ryan Chen',
      email: 'rchen@techdropmiami.com',
      phone: '+1-786-555-5100',
      position: 'Operations Manager'
    },
    alternateContact: {
      name: 'Sofia Alvarez',
      email: 'salvarez@techdropmiami.com',
      phone: '+1-786-555-5101',
      position: 'Customer Success'
    },
    address: {
      street: '7950 NW 53rd Street',
      city: 'Doral',
      state: 'FL',
      postalCode: '33166'
    },
    website: 'https://www.techdropmiami.com',
    taxId: '88-1234567',
    paymentTerms: 'Prepaid',
    creditLimit: 25000,
    leadTime: 2,
    categories: ['Mobile Accessories', 'Computer Accessories', 'Gaming Accessories'],
    brandNames: ['Various'],
    notes: 'Dropshipping specialist. Direct to consumer fulfillment. No inventory required.',
    isPreferred: false
  }
];

export function generateSuppliers(): SupplierData[] {
  const suppliers: SupplierData[] = [];
  const baseDate = new Date('2024-01-01');

  supplierDefinitions.forEach((def) => {
    const supplier: SupplierData = {
      _id: new Types.ObjectId(),
      code: def.code,
      name: def.name,
      type: def.type,
      status: 'active',
      contact: {
        primaryContact: def.primaryContact,
        alternateContact: def.alternateContact,
        address: {
          ...def.address,
          country: 'USA'
        },
        website: def.website
      },
      financial: {
        taxId: def.taxId,
        currency: 'USD',
        paymentTerms: def.paymentTerms,
        creditLimit: def.creditLimit,
        currentBalance: Math.floor(def.creditLimit * 0.05 + Math.random() * def.creditLimit * 0.15),
        totalPurchases: Math.floor(def.creditLimit * 2 + Math.random() * def.creditLimit * 10)
      },
      shipping: {
        methods: def.type === 'manufacturer' ? ['Ground', 'Express', 'Freight'] : ['Ground', 'Express', 'LTL Freight'],
        leadTime: def.leadTime,
        freeShippingThreshold: def.type === 'wholesaler' ? 500 : def.type === 'distributor' ? 1000 : 5000,
        locations: def.type === 'wholesaler' ? ['USA', 'Florida'] : ['USA', 'Canada', 'Mexico']
      },
      products: {
        categories: def.categories,
        brandNames: def.brandNames,
        totalProducts: def.type === 'distributor' ? 5000 + Math.floor(Math.random() * 10000) : 
                      def.type === 'manufacturer' ? 50 + Math.floor(Math.random() * 200) :
                      100 + Math.floor(Math.random() * 500)
      },
      performance: {
        rating: 4 + Math.random() * 0.9,
        onTimeDeliveryRate: 92 + Math.random() * 7,
        qualityScore: 95 + Math.random() * 4.5,
        responseTime: def.type === 'wholesaler' ? 0.5 + Math.random() * 1.5 : 1 + Math.random() * 3,
        totalOrders: Math.floor(100 + Math.random() * 900),
        returnRate: 0.5 + Math.random() * 2
      },
      compliance: def.certifications ? {
        certifications: def.certifications,
        insuranceExpiry: new Date('2026-03-31'),
        licenses: [{
          type: 'Business License',
          number: `BL2024${def.code.slice(-3)}`,
          expiry: new Date('2027-01-31')
        }]
      } : undefined,
      bankDetails: def.type !== 'manufacturer' ? {
        bankName: 'Bank of America',
        accountName: def.name,
        routingNumber: '026009593',
        accountNumber: `XXXX${Math.floor(1000 + Math.random() * 9000)}`
      } : undefined,
      notes: def.notes,
      tags: [def.type, ...def.brandNames || [], def.type === 'wholesaler' ? 'local' : 'national'],
      isPreferred: def.isPreferred,
      createdAt: baseDate,
      updatedAt: new Date('2025-07-15')
    };

    suppliers.push(supplier);
  });

  return suppliers;
}

// Export supplier mapping for product generation
export function getSupplierMapping(suppliers: SupplierData[]): Map<string, Types.ObjectId> {
  const mapping = new Map<string, Types.ObjectId>();
  suppliers.forEach(sup => {
    mapping.set(sup.code, sup._id);
    mapping.set(sup.name, sup._id);
    // Also map by brand for easy product assignment
    sup.products?.brandNames.forEach(brand => {
      if (!mapping.has(brand)) {
        mapping.set(brand, sup._id);
      }
    });
  });
  return mapping;
}
