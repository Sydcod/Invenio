/**
 * Generate Full Categories Hierarchy
 * Creates 30+ electronics categories with 3-level hierarchy
 */

const { ObjectId } = require('mongodb');

function generateCategories() {
  const categories = [];
  
  // Root category
  const rootId = new ObjectId();
  categories.push({
    _id: rootId,
    name: 'Electronics',
    slug: 'electronics',
    parentId: null,
    path: '/electronics',
    level: 0,
    description: 'All electronics products, devices, and accessories for Miami customers',
    metaTitle: 'Electronics Store Miami - Computers, TVs, Audio & More',
    metaDescription: 'Shop the best electronics in Miami. Find computers, TVs, audio equipment, smart home devices, and accessories at competitive prices.',
    keywords: ['electronics', 'Miami electronics', 'computers', 'TVs', 'audio', 'smart home'],
    imageUrl: '/images/categories/electronics.jpg',
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
    attributes: {
      showInMenu: true,
      showInHomepage: true,
      bannerColor: '#1e40af'
    }
  });
  
  // Level 1 categories
  const level1Categories = [
    { name: 'Computers & Tablets', slug: 'computers-tablets', desc: 'Desktop computers, laptops, tablets, and accessories' },
    { name: 'TV & Audio', slug: 'tv-audio', desc: 'Televisions, speakers, soundbars, and home theater systems' },
    { name: 'Smart Home', slug: 'smart-home', desc: 'Smart home devices, automation, and IoT products' },
    { name: 'Gaming', slug: 'gaming', desc: 'Gaming consoles, PCs, accessories, and games' },
    { name: 'Mobile & Accessories', slug: 'mobile-accessories', desc: 'Smartphones, cases, chargers, and mobile accessories' },
    { name: 'Cameras & Photography', slug: 'cameras-photography', desc: 'Digital cameras, lenses, and photography equipment' },
    { name: 'Office Equipment', slug: 'office-equipment', desc: 'Printers, scanners, and office electronics' },
    { name: 'Networking', slug: 'networking', desc: 'Routers, switches, and networking equipment' },
    { name: 'Components & Storage', slug: 'components-storage', desc: 'Computer components, storage devices, and accessories' },
    { name: 'Wearables', slug: 'wearables', desc: 'Smartwatches, fitness trackers, and wearable tech' }
  ];
  
  let sortOrder = 2;
  const level1Ids = {};
  
  level1Categories.forEach(cat => {
    const catId = new ObjectId();
    level1Ids[cat.slug] = catId;
    
    categories.push({
      _id: catId,
      name: cat.name,
      slug: cat.slug,
      parentId: rootId,
      path: `/electronics/${cat.slug}`,
      level: 1,
      description: cat.desc,
      metaTitle: `${cat.name} - Miami Electronics Store`,
      metaDescription: `Shop ${cat.name} in Miami. ${cat.desc}. Best prices and fast delivery.`,
      keywords: [cat.name.toLowerCase(), 'Miami', cat.slug.replace('-', ' ')],
      imageUrl: `/images/categories/${cat.slug}.jpg`,
      isActive: true,
      isFeatured: sortOrder <= 5,
      sortOrder: sortOrder++,
      attributes: {
        showInMenu: true,
        showInHomepage: sortOrder <= 7
      }
    });
  });
  
  // Level 2 categories (subcategories)
  const level2Categories = {
    'computers-tablets': [
      { name: 'Laptops', slug: 'laptops', desc: 'Business, gaming, and ultrabook laptops' },
      { name: 'Desktop Computers', slug: 'desktop-computers', desc: 'Desktop PCs and all-in-one computers' },
      { name: 'Tablets', slug: 'tablets', desc: 'iPads, Android tablets, and e-readers' },
      { name: 'Computer Accessories', slug: 'computer-accessories', desc: 'Keyboards, mice, and computer peripherals' }
    ],
    'tv-audio': [
      { name: 'Televisions', slug: 'televisions', desc: '4K, OLED, and Smart TVs' },
      { name: 'Speakers', slug: 'speakers', desc: 'Bluetooth, wireless, and home speakers' },
      { name: 'Soundbars', slug: 'soundbars', desc: 'TV soundbars and home theater sound systems' },
      { name: 'Headphones', slug: 'headphones', desc: 'Over-ear, in-ear, and wireless headphones' }
    ],
    'smart-home': [
      { name: 'Smart Lighting', slug: 'smart-lighting', desc: 'Smart bulbs, switches, and lighting systems' },
      { name: 'Smart Security', slug: 'smart-security', desc: 'Cameras, doorbells, and security systems' },
      { name: 'Smart Climate', slug: 'smart-climate', desc: 'Thermostats, AC controllers for Miami heat' },
      { name: 'Voice Assistants', slug: 'voice-assistants', desc: 'Alexa, Google Home, and smart displays' }
    ],
    'gaming': [
      { name: 'Gaming Consoles', slug: 'gaming-consoles', desc: 'PlayStation, Xbox, Nintendo consoles' },
      { name: 'Gaming PCs', slug: 'gaming-pcs', desc: 'Pre-built gaming computers' },
      { name: 'Gaming Accessories', slug: 'gaming-accessories', desc: 'Controllers, headsets, and gaming gear' }
    ],
    'mobile-accessories': [
      { name: 'Phone Cases', slug: 'phone-cases', desc: 'Protective cases and covers' },
      { name: 'Chargers & Cables', slug: 'chargers-cables', desc: 'Fast chargers, wireless chargers, cables' },
      { name: 'Screen Protectors', slug: 'screen-protectors', desc: 'Tempered glass and film protectors' }
    ],
    'cameras-photography': [
      { name: 'Digital Cameras', slug: 'digital-cameras', desc: 'DSLR, mirrorless, and point-and-shoot cameras' },
      { name: 'Camera Lenses', slug: 'camera-lenses', desc: 'Wide angle, telephoto, and specialty lenses' },
      { name: 'Photography Accessories', slug: 'photography-accessories', desc: 'Tripods, bags, and camera gear' }
    ]
  };
  
  Object.entries(level2Categories).forEach(([parentSlug, subcats]) => {
    const parentId = level1Ids[parentSlug];
    
    subcats.forEach(subcat => {
      categories.push({
        _id: new ObjectId(),
        name: subcat.name,
        slug: subcat.slug,
        parentId: parentId,
        path: `/electronics/${parentSlug}/${subcat.slug}`,
        level: 2,
        description: subcat.desc,
        metaTitle: `${subcat.name} - ${parentSlug.replace('-', ' ')} - Miami`,
        metaDescription: `${subcat.desc} available in Miami. Shop online or visit our stores.`,
        keywords: [subcat.name.toLowerCase(), parentSlug.replace('-', ' '), 'Miami'],
        imageUrl: `/images/categories/${subcat.slug}.jpg`,
        isActive: true,
        isFeatured: false,
        sortOrder: sortOrder++,
        attributes: {
          showInMenu: true,
          showInSidebar: true
        }
      });
    });
  });
  
  return categories;
}

module.exports = { generateCategories };
