import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/next-auth';
import connectMongo from '@/libs/mongoose';
import Product from '@/models/Product';

// GET /api/products/search - Advanced product search with autocomplete
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, name, sku, barcode
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Query must be at least 2 characters',
      });
    }

    // Build search query
    const searchQuery: any = {};

    if (!includeInactive) {
      searchQuery.isActive = true;
    }

    // Build search conditions based on type
    switch (type) {
      case 'name':
        searchQuery.name = { $regex: query, $options: 'i' };
        break;
      case 'sku':
        searchQuery.sku = { $regex: query, $options: 'i' };
        break;
      case 'barcode':
        searchQuery.barcode = { $regex: query, $options: 'i' };
        break;
      default:
        searchQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { sku: { $regex: query, $options: 'i' } },
          { barcode: { $regex: query, $options: 'i' } },
          { 'variants.sku': { $regex: query, $options: 'i' } },
          { 'variants.barcode': { $regex: query, $options: 'i' } },
        ];
    }

    const products = await Product.find(searchQuery)
      .select('name sku barcode media.images pricing.price inventory.availableStock category status')
      .limit(limit)
      .sort({ name: 1 });

    // Format results for autocomplete
    const results = products.map(product => ({
      id: product._id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.pricing.price,
      available: product.inventory.availableStock,
      category: product.category?.name || null,
      status: product.status,
      image: product.media?.images?.[0] || null,
    }));

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
