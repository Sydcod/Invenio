const { mkdir, writeFile } = require('fs/promises');
const { join } = require('path');

const OUTPUT_DIR = join(process.cwd(), 'scripts', 'generate-mock-data', 'generated-data');

async function ensureOutputDir() {
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Output directory created: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('Error creating output directory:', error);
  }
}

async function saveJSON(data, filename) {
  const filepath = join(OUTPUT_DIR, filename);
  await writeFile(filepath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved ${filename} (${data.length} items)`);
  return filepath;
}

async function generateSampleData() {
  console.log('🚀 Starting Reference Data Generation (Phase 1)');
  console.log('='.repeat(50));
  
  await ensureOutputDir();

  // Sample Categories
  const categories = [
    {
      _id: { "$oid": "669f1234567890abcdef0001" },
      name: "Electronics",
      parentId: null,
      path: "/electronics",
      level: 0,
      description: "All electronics products, devices, and accessories for Miami customers",
      isActive: true,
      sortOrder: 1
    },
    {
      _id: { "$oid": "669f1234567890abcdef0002" },
      name: "Computers & Tablets",
      parentId: { "$oid": "669f1234567890abcdef0001" },
      path: "/electronics/computers-tablets",
      level: 1,
      description: "Desktop computers, laptops, tablets, and accessories",
      isActive: true,
      sortOrder: 2
    },
    {
      _id: { "$oid": "669f1234567890abcdef0003" },
      name: "Laptops",
      parentId: { "$oid": "669f1234567890abcdef0002" },
      path: "/electronics/computers-tablets/laptops",
      level: 2,
      description: "Portable computers for work, gaming, and creativity",
      isActive: true,
      sortOrder: 3
    }
  ];

  // Sample Warehouses
  const warehouses = [
    {
      _id: { "$oid": "669f2234567890abcdef0001" },
      code: "WH-MIA-001",
      name: "Miami Main Distribution Center",
      type: "distribution",
      status: "active",
      address: {
        street: "2500 NW 107th Avenue",
        city: "Miami",
        state: "FL",
        country: "USA",
        postalCode: "33172"
      },
      contact: {
        phone: "+1-305-555-0100",
        email: "wh-mia-001@miamielectronics.com",
        manager: {
          name: "Carlos Rodriguez",
          email: "c.rodriguez@miamielectronics.com",
          phone: "+1-305-555-0102"
        }
      },
      capacity: {
        totalSpace: 100000,
        usedSpace: 68000,
        availableSpace: 32000,
        unit: "sqft"
      },
      settings: {
        isDefault: true,
        allowNegativeStock: false,
        autoReorder: true,
        minOrderValue: 50,
        maxOrderValue: 100000
      }
    },
    {
      _id: { "$oid": "669f2234567890abcdef0002" },
      code: "WH-AVE-002",
      name: "Aventura Retail Warehouse",
      type: "retail",
      status: "active",
      address: {
        street: "19501 Biscayne Boulevard",
        city: "Aventura",
        state: "FL",
        country: "USA",
        postalCode: "33180"
      },
      contact: {
        phone: "+1-305-555-0200",
        email: "wh-ave-002@miamielectronics.com",
        manager: {
          name: "Maria Gonzalez",
          email: "m.gonzalez@miamielectronics.com",
          phone: "+1-305-555-0201"
        }
      },
      capacity: {
        totalSpace: 25000,
        usedSpace: 18000,
        availableSpace: 7000,
        unit: "sqft"
      },
      settings: {
        isDefault: false,
        allowNegativeStock: false,
        autoReorder: true,
        minOrderValue: 0,
        maxOrderValue: 50000
      }
    }
  ];

  // Sample Suppliers
  const suppliers = [
    {
      _id: { "$oid": "669f3234567890abcdef0001" },
      code: "SUP-MFG-001",
      name: "Apple Inc.",
      type: "manufacturer",
      status: "active",
      contact: {
        primaryContact: {
          name: "Jennifer Martinez",
          email: "j.martinez@apple.com",
          phone: "+1-408-996-1010",
          position: "Account Manager"
        },
        address: {
          street: "One Apple Park Way",
          city: "Cupertino",
          state: "CA",
          country: "USA",
          postalCode: "95014"
        },
        website: "https://www.apple.com"
      },
      financial: {
        taxId: "94-2404110",
        currency: "USD",
        paymentTerms: "Net 30",
        creditLimit: 500000,
        currentBalance: 25000
      },
      shipping: {
        methods: ["Ground", "Express", "Freight"],
        leadTime: 5,
        freeShippingThreshold: 5000,
        locations: ["USA", "Canada", "Mexico"]
      },
      products: {
        categories: ["Laptops", "Tablets", "Smartphones"],
        brandNames: ["Apple"],
        totalProducts: 150
      },
      isPreferred: true
    },
    {
      _id: { "$oid": "669f3234567890abcdef0002" },
      code: "SUP-MFG-002",
      name: "Samsung Electronics",
      type: "manufacturer",
      status: "active",
      contact: {
        primaryContact: {
          name: "David Kim",
          email: "d.kim@samsung.com",
          phone: "+1-201-229-4000",
          position: "Regional Sales Manager"
        },
        address: {
          street: "85 Challenger Road",
          city: "Ridgefield Park",
          state: "NJ",
          country: "USA",
          postalCode: "07660"
        },
        website: "https://www.samsung.com"
      },
      financial: {
        taxId: "52-1721859",
        currency: "USD",
        paymentTerms: "Net 45",
        creditLimit: 400000,
        currentBalance: 35000
      },
      shipping: {
        methods: ["Ground", "Express", "Freight"],
        leadTime: 7,
        freeShippingThreshold: 5000,
        locations: ["USA", "Canada", "Mexico"]
      },
      products: {
        categories: ["Televisions", "Smartphones", "Tablets", "Home Audio"],
        brandNames: ["Samsung"],
        totalProducts: 280
      },
      isPreferred: true
    }
  ];

  // Save to JSON files
  console.log('\n💾 Saving JSON files...');
  await saveJSON(categories, 'categories-sample.json');
  await saveJSON(warehouses, 'warehouses-sample.json');
  await saveJSON(suppliers, 'suppliers-sample.json');

  // Create summary
  const summary = {
    generated: new Date().toISOString(),
    phase: "Phase 1: Reference Data (Sample)",
    counts: {
      categories: categories.length,
      warehouses: warehouses.length,
      suppliers: suppliers.length
    },
    notes: [
      "This is a small sample for review",
      "Full generation will create:",
      "- 30+ categories in 3-level hierarchy",
      "- 5 warehouses across Miami",
      "- 15 suppliers (manufacturers, distributors, wholesalers)"
    ]
  };

  await saveJSON(summary, 'phase1-sample-summary.json');

  console.log('\n✅ Phase 1 Sample Data Generation Complete!');
  console.log('='.repeat(50));
  console.log('\nGenerated files in:', OUTPUT_DIR);
  console.log('\nNext steps:');
  console.log('1. Review the sample JSON files');
  console.log('2. Run full generation with TypeScript files');
  console.log('3. Insert data to MongoDB via MCP server');
}

// Run if executed directly
if (require.main === module) {
  generateSampleData().catch(console.error);
}
