const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'generated-data');
const BATCH_DIR = path.join(DATA_DIR, 'batch3-products');
const BATCH_SIZE = 50;

function splitProductData(inputFile) {
  if (!inputFile) {
    console.error('Error: Please provide the path to the JSON file to split');
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File not found at ${inputFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(BATCH_DIR)) {
    fs.mkdirSync(BATCH_DIR, { recursive: true });
  }

  const productsData = fs.readFileSync(inputFile, 'utf-8');
  const products = JSON.parse(productsData);

  let batchNumber = 1;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const batchFilePath = path.join(BATCH_DIR, `products-${batchNumber}.json`);
    fs.writeFileSync(batchFilePath, JSON.stringify(batch, null, 2));
    console.log(`Created batch file: ${batchFilePath}`);
    batchNumber++;
  }

  console.log(`\nSuccessfully split ${products.length} products into ${batchNumber - 1} batch files.`);
}

// Get the input file from command line arguments
const inputFile = process.argv[2];
splitProductData(inputFile);
