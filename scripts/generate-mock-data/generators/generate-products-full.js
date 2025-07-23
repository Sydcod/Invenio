const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const { faker } = require('@faker-js/faker');

const DATA_DIR = path.join(__dirname, '..', 'generated-data');

function loadData(filename) {
  const rawData = fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
  return JSON.parse(rawData).map(item => ({
    ...item,
    _id: new ObjectId(item._id.$oid || item._id),
  }));
}

const categories = loadData('categories-full.json');
const suppliers = loadData('suppliers-full.json');
const warehouses = loadData('warehouses-full.json');

const productDistribution = {
  'Laptops': { count: faker.number.int({ min: 30, max: 40 }), type: 'high-value' },
  'Desktop Computers': { count: faker.number.int({ min: 15, max: 20 }), type: 'high-value' },
  'Tablets': { count: faker.number.int({ min: 15, max: 20 }), type: 'high-value' },
  'Televisions': { count: faker.number.int({ min: 25, max: 30 }), type: 'high-value' },
  'Smartphones': { count: faker.number.int({ min: 20, max: 25 }), type: 'high-value' },
  'Gaming Consoles': { count: faker.number.int({ min: 15, max: 20 }), type: 'high-value' },
  'Gaming PCs': { count: faker.number.int({ min: 10, max: 15 }), type: 'high-value' },
  'Smart Home': { count: faker.number.int({ min: 25, max: 30 }), type: 'mid-range' },
  'Audio Equipment': { count: faker.number.int({ min: 30, max: 35 }), type: 'mid-range' },
  'Computer Accessories': { count: faker.number.int({ min: 20, max: 25 }), type: 'accessory' },
  'Cameras': { count: faker.number.int({ min: 15, max: 20 }), type: 'high-value' },
  'Office Electronics': { count: faker.number.int({ min: 15, max: 20 }), type: 'mid-range' },
};

const realisticProductNames = {
  'Laptops': ['ProBook', 'ZenBook', 'MacBook Pro', 'ThinkPad', 'XPS', 'Spectre', 'ROG Zephyrus'],
  'Desktop Computers': ['iMac', 'Pavilion', 'Inspiron', 'ThinkCentre', 'Trident'],
  'Tablets': ['iPad Pro', 'Galaxy Tab', 'Surface Pro', 'Lenovo Tab', 'Fire HD'],
  'Televisions': ['OLED Evo', 'Bravia', 'The Frame', 'QNED', 'U-Series'],
  'Smartphones': ['iPhone', 'Galaxy', 'Pixel', 'Xperia', 'Nord'],
  'Gaming Consoles': ['PlayStation 5', 'Xbox Series X', 'Nintendo Switch'],
  'Gaming PCs': ['Aegis', 'Obelisk', 'Vengeance', 'Trident', 'Aurora'],
  'Smart Home': ['Echo Dot', 'Nest Hub', 'Hue', 'Ring', 'Arlo'],
  'Audio Equipment': ['WH-1000XM5', 'QuietComfort', 'SoundLink', 'Momentum', 'JBL Flip'],
  'Computer Accessories': ['MX Master', 'Magic Keyboard', 'Razer BlackWidow', 'Logitech C920', 'Blue Yeti'],
  'Cameras': ['Alpha a7', 'EOS R5', 'Z6 II', 'LUMIX S5', 'GoPro HERO'],
  'Office Electronics': ['ScanJet', 'OfficeJet', 'LabelWriter', 'WorkForce'],
};

function generateRealisticProductName(categoryName, brand) {
  const models = realisticProductNames[categoryName] || ['Generic Model'];
  const model = faker.helpers.arrayElement(models);
  const year = faker.number.int({ min: 2022, max: 2024 });
  const suffix = faker.helpers.arrayElement(['', 'Pro', 'Max', 'Ultra', 'SE', 'Plus', 'Mini']);
  return `${brand} ${model} ${suffix} (${year})`.replace(/\s+/g, ' ').trim();
}

function getStockLevel(type) {
  if (type === 'high-value') return faker.number.int({ min: 5, max: 30 });
  if (type === 'mid-range') return faker.number.int({ min: 20, max: 100 });
  return faker.number.int({ min: 50, max: 500 });
}

function generateProducts() {
  const products = [];
  const userIds = [new ObjectId('668035a5e7604adf9d050601'), new ObjectId('668035a5e7604adf9d050602')];

  const leafCategories = categories.filter(c => c.level === 2);

  for (const category of leafCategories) {
    const distribution = productDistribution[category.name] || { count: 10, type: 'mid-range' };

    for (let i = 0; i < distribution.count; i++) {
      const brand = faker.company.name().split(' ')[0];
      const productName = generateRealisticProductName(category.name, brand);
      const cost = parseFloat(faker.commerce.price({ min: 50, max: 2500 }));
      const price = cost * (1 + faker.number.float({ min: 0.3, max: 0.4 }));
      const currentStock = getStockLevel(distribution.type);

      const product = {
        _id: new ObjectId(),
        sku: `${brand.toUpperCase().substring(0, 3)}-${category.slug.toUpperCase().substring(0, 4)}-${faker.string.alphanumeric(4).toUpperCase()}`,
        name: productName,
        description: faker.commerce.productDescription(),
        category: {
          id: category._id,
          name: category.name,
          path: category.path,
        },
        brand,
        type: 'physical',
        status: 'active',
        pricing: {
          cost,
          price: parseFloat(price.toFixed(2)),
          compareAtPrice: price * 1.15,
          currency: 'USD',
          taxable: true,
          taxRate: 0.07,
        },
        inventory: {
          trackQuantity: true,
          currentStock,
          availableStock: currentStock,
          reservedStock: 0,
          incomingStock: 0,
          reorderPoint: Math.ceil(currentStock * 0.25),
          reorderQuantity: Math.ceil(currentStock * 0.5),
          minStockLevel: Math.ceil(currentStock * 0.1),
          stockValue: currentStock * cost,
          averageCost: cost,
          lastCostUpdate: faker.date.recent({ days: 30 }),
          stockMethod: 'FIFO',
          locations: warehouses.map(w => ({
            warehouseId: w._id,
            warehouseName: w.name,
            quantity: Math.floor(currentStock / warehouses.length),
            isDefault: w.settings.isDefault,
          })),
        },
        suppliers: suppliers.slice(0, 2).map(s => ({
          vendorId: s._id,
          vendorName: s.name,
          supplierSku: `${s.code}-${faker.string.alphanumeric(5)}`,
          cost: cost * 0.95,
          leadTime: s.financial.leadTime || faker.number.int({ min: 1, max: 14 }),
          minOrderQuantity: 10,
          isPrimary: suppliers.indexOf(s) === 0,
        })),
        weight: {
          value: faker.number.float({ min: 0.1, max: 50 }),
          unit: 'kg',
        },
        dimensions: {
          length: faker.number.float({ min: 10, max: 100 }),
          width: faker.number.float({ min: 10, max: 100 }),
          height: faker.number.float({ min: 10, max: 100 }),
          unit: 'cm',
        },
        barcode: faker.string.numeric(12),
        upc: faker.string.numeric(12),
        tags: [category.name, brand, faker.commerce.productAdjective()],
        isActive: true,
        createdBy: faker.helpers.arrayElement(userIds),
        updatedBy: faker.helpers.arrayElement(userIds),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 90 }),
      };
      products.push(product);
    }
  }

  // Apply special scenarios
  const totalProducts = products.length;
  const lowStockCount = Math.floor(totalProducts * 0.15);
  const outOfStockCount = Math.floor(totalProducts * 0.10);
  const discontinuedCount = Math.floor(totalProducts * 0.05);
  const draftCount = Math.floor(totalProducts * 0.05);

  faker.helpers.shuffle(products).slice(0, lowStockCount).forEach(p => {
    p.inventory.currentStock = p.inventory.reorderPoint;
    p.inventory.availableStock = p.inventory.currentStock;
  });

  faker.helpers.shuffle(products).slice(0, outOfStockCount).forEach(p => {
    p.inventory.currentStock = 0;
    p.inventory.availableStock = 0;
  });

  faker.helpers.shuffle(products).slice(0, discontinuedCount).forEach(p => p.status = 'discontinued');
  faker.helpers.shuffle(products).slice(0, draftCount).forEach(p => p.status = 'draft');

  return products;
}

const generatedProducts = generateProducts();

fs.writeFileSync(
  path.join(DATA_DIR, 'products-full.json'),
  JSON.stringify(generatedProducts, null, 2)
);

console.log(`Generated ${generatedProducts.length} products.`);
