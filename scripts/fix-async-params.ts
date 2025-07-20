import { promises as fs } from 'fs';
import path from 'path';

async function fixAsyncParams() {
  const dashboardPath = path.join(process.cwd(), 'app', 'dashboard');
  
  const filesToFix = [
    'categories/[categoryId]/page.tsx',
    'products/[productId]/page.tsx',
    'purchase-orders/[purchaseOrderId]/page.tsx',
    'suppliers/[supplierId]/page.tsx',
    'warehouses/[warehouseId]/page.tsx'
  ];
  
  for (const file of filesToFix) {
    const filePath = path.join(dashboardPath, file);
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      
      // Extract the param name from the file path
      const match = file.match(/\[(\w+)\]/);
      if (!match) continue;
      
      const paramName = match[1];
      
      // Replace params type declaration
      content = content.replace(
        /params: \{ (\w+): string \};/,
        'params: Promise<{ $1: string }>;'
      );
      
      // Add await params after requirePermission
      const requirePermissionMatch = content.match(/const session = await requirePermission\([^)]+\);\s*/);
      if (requirePermissionMatch) {
        const insertPosition = requirePermissionMatch.index! + requirePermissionMatch[0].length;
        
        // Check if we haven't already added the await
        if (!content.includes(`const { ${paramName} } = await params;`)) {
          content = content.slice(0, insertPosition) + 
            `const { ${paramName} } = await params;\n  ` + 
            content.slice(insertPosition);
        }
      }
      
      // Replace all instances of params.paramName with just paramName
      const paramRegex = new RegExp(`params\\.${paramName}`, 'g');
      content = content.replace(paramRegex, paramName);
      
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`✅ Fixed ${file}`);
    } catch (error) {
      console.error(`❌ Error fixing ${file}:`, error);
    }
  }
  
  console.log('✨ All dynamic route pages updated for async params!');
}

fixAsyncParams().catch(console.error);
