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

// Real electronics brands by category
const brandsByCategory = {
  'Laptops': ['Dell', 'HP', 'Lenovo', 'Apple', 'ASUS', 'Acer', 'MSI', 'Razer', 'Microsoft'],
  'Desktop Computers': ['Dell', 'HP', 'Lenovo', 'Apple', 'ASUS', 'Acer', 'CyberPowerPC', 'Origin PC'],
  'Tablets': ['Apple', 'Samsung', 'Microsoft', 'Amazon', 'Lenovo', 'ASUS', 'Google'],
  'Televisions': ['Samsung', 'LG', 'Sony', 'TCL', 'Vizio', 'Hisense', 'Toshiba', 'Panasonic'],
  'Smartphones': ['Apple', 'Samsung', 'Google', 'OnePlus', 'Motorola', 'Nokia', 'Sony'],
  'Gaming Consoles': ['Sony', 'Microsoft', 'Nintendo'],
  'Gaming PCs': ['Alienware', 'ASUS ROG', 'MSI Gaming', 'Corsair', 'HP Omen', 'Acer Predator'],
  'Smart Home': ['Amazon', 'Google', 'Apple', 'Ring', 'Nest', 'Philips', 'TP-Link', 'Arlo'],
  'Audio Equipment': ['Sony', 'Bose', 'JBL', 'Sennheiser', 'Apple', 'Samsung', 'Beats', 'Audio-Technica'],
  'Computer Accessories': ['Logitech', 'Razer', 'Corsair', 'SteelSeries', 'HyperX', 'ASUS', 'Elgato'],
  'Cameras': ['Canon', 'Sony', 'Nikon', 'Panasonic', 'Fujifilm', 'GoPro', 'DJI'],
  'Office Electronics': ['HP', 'Canon', 'Epson', 'Brother', 'Xerox', 'Fujitsu', 'Dymo']
};

// Product templates are defined inline

// Generate realistic description with varied templates
function generateRealisticDescription(category, brand, model, specs) {
  const laptopTemplates = [
    `Unleash your productivity with the ${brand} ${model}, featuring a powerful ${specs.processor || 'Intel Core i7'} processor, ${specs.ram || '16GB'} of lightning-fast RAM, and a spacious ${specs.storage || '512GB'} SSD. The ${specs.display || '15.6-inch'} display delivers crisp visuals, while the sleek design weighs just ${specs.weight || '1.8kg'}. Built for professionals who demand performance without compromise.`,
    `The ${brand} ${model} redefines portable computing with its ${specs.processor || 'AMD Ryzen 7'} processor and ${specs.ram || '16GB'} memory configuration. Store all your files on the ${specs.storage || '1TB'} NVMe SSD while enjoying up to ${specs.battery || '10 hours'} of battery life. Features include backlit keyboard, fingerprint reader, and premium aluminum chassis.`,
    `Designed for the modern professional, the ${brand} ${model} combines elegance with power. The ${specs.processor || 'Intel Core i5'} processor handles multitasking with ease, while ${specs.ram || '8GB'} RAM ensures smooth performance. With ${specs.storage || '256GB'} of fast SSD storage and a stunning ${specs.display || 'Full HD'} display, this laptop is perfect for both work and entertainment.`,
    `Experience next-generation computing with the ${brand} ${model}. Powered by ${specs.processor || 'Apple M2 chip'}, this laptop delivers exceptional performance and energy efficiency. The ${specs.display || 'Retina'} display brings your content to life, while ${specs.storage || '512GB'} of storage provides ample space for your creative projects. All-day battery life keeps you productive on the go.`
  ];

  const smartphoneTemplates = [
    `Capture life's moments with the ${brand} ${model}'s advanced ${specs.camera || 'triple-camera'} system featuring ${specs.mainCamera || '48MP'} main sensor. The ${specs.display || '6.5-inch OLED'} display offers vibrant colors and deep blacks. With ${specs.storage || '256GB'} of storage and ${specs.battery || '4500mAh'} battery, you're ready for anything. 5G connectivity ensures blazing-fast speeds wherever you go.`,
    `The ${brand} ${model} pushes boundaries with its ${specs.processor || 'flagship'} processor and ${specs.ram || '12GB'} of RAM. The ${specs.display || '120Hz AMOLED'} display provides incredibly smooth scrolling and gaming. Features include ${specs.camera || '108MP'} camera, ${specs.charging || 'fast wireless charging'}, and IP68 water resistance. Available with ${specs.storage || '512GB'} storage.`,
    `Elevate your mobile experience with the ${brand} ${model}. The ${specs.display || '6.7-inch'} edge-to-edge display is perfect for streaming and gaming. Powered by the latest ${specs.processor || 'Snapdragon'} chipset with ${specs.storage || '128GB'} storage expandable via microSD. The ${specs.battery || 'all-day'} battery with fast charging keeps you connected longer.`
  ];

  const televisionTemplates = [
    `Transform your living room with the ${brand} ${model} ${specs.size || '55-inch'} ${specs.resolution || '4K UHD'} Smart TV. Featuring ${specs.hdr || 'HDR10+'} for stunning contrast and ${specs.refreshRate || '120Hz'} refresh rate for smooth motion. Built-in streaming apps, voice control, and ${specs.audio || 'Dolby Atmos'} sound create an immersive entertainment experience. HDMI 2.1 ports support next-gen gaming consoles.`,
    `The ${brand} ${model} ${specs.size || '65-inch'} ${specs.panel || 'QLED'} TV delivers exceptional picture quality with ${specs.resolution || '4K'} resolution and ${specs.zones || 'full array local dimming'}. Smart features include built-in Alexa, Apple AirPlay 2, and access to thousands of apps. The sleek, minimalist design complements any modern home while ${specs.audio || 'premium speakers'} provide theater-quality sound.`,
    `Experience cinema at home with the ${brand} ${model} ${specs.size || '75-inch'} ${specs.resolution || '8K'} TV. Advanced ${specs.processor || 'AI upscaling'} enhances all content to near-8K quality. Features ${specs.gaming || 'VRR and ALLM'} for responsive gaming, ${specs.hdr || 'Dolby Vision IQ'} for optimized HDR, and ${specs.design || 'ultra-slim profile'} that sits flush against the wall.`
  ];

  const tabletTemplates = [
    `The ${brand} ${model} blurs the line between tablet and laptop with its ${specs.display || '12.9-inch'} ${specs.displayType || 'Liquid Retina'} display and ${specs.processor || 'M1'} chip. With ${specs.storage || '256GB'} storage and support for ${specs.accessories || 'Apple Pencil and Magic Keyboard'}, it's perfect for creative professionals. All-day battery life and 5G option keep you productive anywhere.`,
    `Versatility meets portability in the ${brand} ${model}. The ${specs.display || '11-inch'} ${specs.resolution || '2K'} display with ${specs.refreshRate || '120Hz'} refresh rate is ideal for both work and play. Powered by ${specs.processor || 'Snapdragon'} with ${specs.ram || '8GB'} RAM and ${specs.storage || '128GB'} storage. Includes S Pen for precise input and DeX mode for desktop experience.`,
    `Discover endless possibilities with the ${brand} ${model} featuring a vibrant ${specs.display || '10.5-inch'} display perfect for reading, streaming, and browsing. The ${specs.battery || 'long-lasting'} battery provides up to ${specs.batteryLife || '12 hours'} of use. With ${specs.storage || '64GB'} storage expandable to ${specs.maxStorage || '1TB'}, parental controls, and access to educational content, it's great for the whole family.`
  ];

  const templates = {
    'Laptops': laptopTemplates,
    'Smartphones': smartphoneTemplates,
    'Televisions': televisionTemplates,
    'Tablets': tabletTemplates,
    'Desktop Computers': [
      `Power through demanding tasks with the ${brand} ${model} desktop. Equipped with ${specs.processor || 'Intel Core i9'} processor, ${specs.ram || '32GB'} DDR5 RAM, and ${specs.gpu || 'NVIDIA RTX 4070'} graphics. The ${specs.storage || '1TB SSD + 2TB HDD'} storage configuration provides speed and capacity. Extensive connectivity options and tool-free upgradability make this the ultimate workstation.`,
      `The ${brand} ${model} delivers professional-grade performance in a compact form factor. Features ${specs.processor || 'AMD Ryzen 9'} processor, ${specs.ram || '64GB'} memory, and ${specs.storage || '2TB NVMe SSD'}. Whisper-quiet operation and efficient cooling ensure reliable performance during intensive workloads. Perfect for content creation, 3D rendering, and data analysis.`
    ],
    'Audio': [
      `Immerse yourself in premium sound with the ${brand} ${model}. Features ${specs.drivers || 'custom-tuned 40mm drivers'}, ${specs.anc || 'active noise cancellation'}, and up to ${specs.battery || '30 hours'} of battery life. The comfortable over-ear design and ${specs.connectivity || 'multipoint Bluetooth'} connectivity make these perfect for music lovers and professionals alike.`,
      `The ${brand} ${model} wireless earbuds deliver exceptional audio quality in a compact design. With ${specs.anc || 'adaptive noise cancellation'}, ${specs.battery || '8 hours'} playback (${specs.totalBattery || '32 hours'} with case), and ${specs.waterproof || 'IPX4'} water resistance. Features include ${specs.features || 'spatial audio, transparency mode, and wireless charging'}.`
    ]
  };
  
  const categoryTemplates = templates[category] || [
    `Discover excellence with the ${brand} ${model}. Engineered with precision and built to last, this ${category.toLowerCase()} product combines innovative features with reliable performance. Backed by ${brand}'s commitment to quality and customer satisfaction.`
  ];
  
  // Select a random template for variety
  const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
  return template;
}

// Generate SKU
function generateSKU(brand, category, index) {
  const brandCode = brand.substring(0, 3).toUpperCase();
  const categoryCode = category.substring(0, 4).toUpperCase();
  const uniqueCode = String(index).padStart(4, '0');
  return `${brandCode}-${categoryCode}-${uniqueCode}`;
}

// Get realistic price
function getRealisticPrice(category, brand) {
  const priceRanges = {
    'Laptops': { Dell: [600, 2000], HP: [500, 1800], Apple: [1000, 4000], ASUS: [700, 2500] },
    'Smartphones': { Apple: [800, 1500], Samsung: [600, 1400], Google: [600, 1200] },
    'Televisions': { Samsung: [400, 3000], LG: [400, 2500], Sony: [500, 3500] },
    'Tablets': { Apple: [400, 1500], Samsung: [300, 1000], Amazon: [100, 300] }
  };
  
  const categoryRanges = priceRanges[category] || {};
  const brandRange = categoryRanges[brand] || [200, 1000];
  
  return faker.number.float({ 
    min: brandRange[0], 
    max: brandRange[1], 
    precision: 0.01 
  });
}

// Get realistic weight
function getRealisticWeight(category) {
  const weights = {
    'Laptops': [1.2, 3.5],
    'Smartphones': [0.15, 0.25],
    'Tablets': [0.3, 0.8],
    'Televisions': [8, 35],
    'Desktop Computers': [5, 15],
    'Gaming Consoles': [2, 5]
  };
  
  const range = weights[category] || [0.5, 5];
  return parseFloat(faker.number.float({ min: range[0], max: range[1], precision: 0.01 }).toFixed(2));
}

// Get realistic dimensions
function getRealisticDimensions(category) {
  const dimensions = {
    'Laptops': { l: [30, 40], w: [20, 30], h: [1.5, 3] },
    'Smartphones': { l: [14, 17], w: [7, 9], h: [0.7, 1] },
    'Tablets': { l: [20, 30], w: [15, 25], h: [0.5, 1] },
    'Televisions': { l: [95, 150], w: [5, 10], h: [55, 85] }
  };
  
  const dim = dimensions[category] || { l: [10, 50], w: [10, 50], h: [5, 30] };
  
  return {
    length: faker.number.float({ min: dim.l[0], max: dim.l[1], precision: 0.1 }),
    width: faker.number.float({ min: dim.w[0], max: dim.w[1], precision: 0.1 }),
    height: faker.number.float({ min: dim.h[0], max: dim.h[1], precision: 0.1 }),
    unit: 'cm'
  };
}

// Product models by category
const productModels = {
  'Laptops': {
    'Dell': ['XPS 13', 'XPS 15', 'Inspiron 15', 'Latitude 7420', 'Precision 5560'],
    'HP': ['Spectre x360', 'Envy 13', 'Pavilion 15', 'EliteBook 840', 'ZBook Studio'],
    'Lenovo': ['ThinkPad X1 Carbon', 'ThinkPad T14', 'IdeaPad 5', 'Legion 5', 'Yoga 9i'],
    'Apple': ['MacBook Air M2', 'MacBook Pro 14"', 'MacBook Pro 16"'],
    'ASUS': ['ZenBook 14', 'ROG Strix G15', 'VivoBook 15', 'ProArt StudioBook']
  },
  'Smartphones': {
    'Apple': ['iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 14', 'iPhone SE'],
    'Samsung': ['Galaxy S24', 'Galaxy S24 Ultra', 'Galaxy A54', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5'],
    'Google': ['Pixel 8', 'Pixel 8 Pro', 'Pixel 7a', 'Pixel Fold']
  },
  'Tablets': {
    'Apple': ['iPad Pro 12.9"', 'iPad Pro 11"', 'iPad Air', 'iPad 10th Gen', 'iPad mini'],
    'Samsung': ['Galaxy Tab S9', 'Galaxy Tab S9+', 'Galaxy Tab S9 Ultra', 'Galaxy Tab A8'],
    'Microsoft': ['Surface Pro 9', 'Surface Go 3']
  },
  'Televisions': {
    'Samsung': ['QN90C Neo QLED', 'S95C OLED', 'Q80C QLED', 'The Frame', 'Crystal UHD CU8000'],
    'LG': ['C3 OLED', 'G3 OLED', 'B3 OLED', 'QNED80', 'UQ8000'],
    'Sony': ['A95K QD-OLED', 'X95K Mini LED', 'X90K', 'X80K']
  }
};

// Generate products
function generateProducts() {
  const products = [];
  const userIds = [new ObjectId('668035a5e7604adf9d050601'), new ObjectId('668035a5e7604adf9d050602')];
  const leafCategories = categories.filter(c => c.level === 2);
  
  let productIndex = 1;
  
  const productCounts = {
    'Laptops': 35,
    'Desktop Computers': 18,
    'Tablets': 18,
    'Televisions': 28,
    'Smartphones': 23,
    'Gaming Consoles': 10,
    'Gaming PCs': 10,
    'Smart Home': 28,
    'Audio Equipment': 32,
    'Computer Accessories': 23,
    'Cameras': 18,
    'Office Electronics': 18
  };

  for (const category of leafCategories) {
    const count = productCounts[category.name] || 15;
    const brands = brandsByCategory[category.name] || ['Generic'];
    const models = productModels[category.name] || {};
    
    for (let i = 0; i < count; i++) {
      const brand = faker.helpers.arrayElement(brands);
      const brandModels = models[brand] || [`${category.name} Model ${i + 1}`];
      const model = faker.helpers.arrayElement(brandModels);
      
      const price = getRealisticPrice(category.name, brand);
      const cost = price * faker.number.float({ min: 0.55, max: 0.75 });
      const currentStock = price > 1000 ? faker.number.int({ min: 5, max: 20 }) : faker.number.int({ min: 20, max: 100 });
      
      const product = {
        _id: new ObjectId(),
        sku: generateSKU(brand, category.name, productIndex++),
        name: `${brand} ${model}`,
        description: generateRealisticDescription(category.name, brand, model, { 
          storage: faker.helpers.arrayElement(['128GB', '256GB', '512GB', '1TB']),
          ram: faker.helpers.arrayElement(['8GB', '16GB', '32GB']),
          processor: faker.helpers.arrayElement(['Intel Core i5', 'Intel Core i7', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M2']),
          size: faker.helpers.arrayElement(['43"', '50"', '55"', '65"', '75"']),
          resolution: faker.helpers.arrayElement(['4K UHD', '8K UHD', 'Full HD']),
          display: faker.helpers.arrayElement(['10.9"', '11"', '12.9"'])
        }),
        category: {
          id: category._id,
          name: category.name,
          path: category.path,
        },
        brand,
        type: 'physical',
        status: faker.helpers.weightedArrayElement([
          { weight: 85, value: 'active' },
          { weight: 10, value: 'discontinued' },
          { weight: 5, value: 'draft' }
        ]),
        pricing: {
          cost: parseFloat(cost.toFixed(2)),
          price: parseFloat(price.toFixed(2)),
          compareAtPrice: parseFloat((price * faker.number.float({ min: 1.1, max: 1.25 })).toFixed(2)),
          currency: 'USD',
          taxable: true,
          taxRate: 0.07,
        },
        inventory: {
          trackQuantity: true,
          currentStock,
          availableStock: currentStock,
          reservedStock: 0,
          incomingStock: faker.datatype.boolean(0.3) ? faker.number.int({ min: 10, max: 50 }) : 0,
          reorderPoint: Math.ceil(currentStock * 0.25),
          reorderQuantity: Math.ceil(currentStock * 0.5),
          minStockLevel: Math.ceil(currentStock * 0.1),
          stockValue: parseFloat((currentStock * cost).toFixed(2)),
          averageCost: parseFloat(cost.toFixed(2)),
          lastCostUpdate: faker.date.recent({ days: 30 }),
          stockMethod: 'FIFO',
          locations: warehouses.map(w => ({
            warehouseId: w._id,
            warehouseName: w.name,
            quantity: Math.floor(currentStock / warehouses.length),
            isDefault: w.settings.isDefault,
          })),
        },
        suppliers: suppliers.slice(0, 2).map((s, idx) => ({
          vendorId: s._id,
          vendorName: s.name,
          supplierSku: `${s.code}-${generateSKU(brand, category.name, productIndex + idx)}`,
          cost: parseFloat((cost * faker.number.float({ min: 0.9, max: 0.98 })).toFixed(2)),
          leadTime: s.financial.leadTime || faker.number.int({ min: 3, max: 14 }),
          minOrderQuantity: faker.number.int({ min: 5, max: 25 }),
          isPrimary: idx === 0,
        })),
        weight: {
          value: getRealisticWeight(category.name),
          unit: 'kg',
        },
        dimensions: getRealisticDimensions(category.name),
        barcode: faker.string.numeric(13),
        upc: faker.string.numeric(12),
        tags: [category.name, brand, model.split(' ')[0]],
        isActive: true,
        createdBy: faker.helpers.arrayElement(userIds),
        updatedBy: faker.helpers.arrayElement(userIds),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 90 }),
      };
      
      products.push(product);
    }
  }
  
  // Apply some variations for realism
  const lowStockCount = Math.floor(products.length * 0.1);
  const outOfStockCount = Math.floor(products.length * 0.05);
  
  faker.helpers.shuffle(products).slice(0, lowStockCount).forEach(p => {
    p.inventory.currentStock = faker.number.int({ min: 1, max: 5 });
    p.inventory.availableStock = p.inventory.currentStock;
  });
  
  faker.helpers.shuffle(products).slice(0, outOfStockCount).forEach(p => {
    p.inventory.currentStock = 0;
    p.inventory.availableStock = 0;
  });
  
  return products;
}

// Generate and save products
const generatedProducts = generateProducts();

fs.writeFileSync(
  path.join(DATA_DIR, 'products-realistic.json'),
  JSON.stringify(generatedProducts, null, 2)
);

console.log(`Generated ${generatedProducts.length} realistic products.`);
