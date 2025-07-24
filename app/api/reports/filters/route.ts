import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/libs/reports/mongodb';

// GET /api/reports/filters - Get dynamic filter options for reports
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filterType = searchParams.get('type');
    const collection = searchParams.get('collection');
    
    if (!filterType || !collection) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and collection' },
        { status: 400 }
      );
    }

    const db = await getDatabase('test');
    
    let options: any[] = [];
    
    switch (filterType) {
      case 'warehouse':
        const warehouses = await db.collection('warehouses')
          .find({ status: 'active' })
          .project({ _id: 1, name: 1 })
          .toArray();
        
        options = warehouses.map(wh => ({
          value: wh._id,
          label: wh.name
        }));
        break;
        
      case 'category':
        const categories = await db.collection('products')
          .aggregate([
            { $group: { _id: '$category.name' } },
            { $match: { _id: { $ne: null } } },
            { $sort: { _id: 1 } }
          ])
          .toArray();
        
        options = categories.map(cat => ({
          value: cat._id,
          label: cat._id
        }));
        break;
        
      case 'brand':
        const brands = await db.collection('products')
          .aggregate([
            { $group: { _id: '$brand' } },
            { $match: { _id: { $ne: null } } },
            { $sort: { _id: 1 } }
          ])
          .toArray();
        
        options = brands.map(brand => ({
          value: brand._id,
          label: brand._id
        }));
        break;
        
      case 'customer':
        const customers = await db.collection('customers')
          .find({ status: 'active' })
          .project({ _id: 1, name: 1, company: 1 })
          .toArray();
        
        options = customers.map(cust => ({
          value: cust._id,
          label: cust.company || cust.name
        }));
        break;
        
      case 'status':
        // Get distinct statuses based on collection
        const statuses = await db.collection(collection)
          .distinct('status');
        
        options = statuses.map(status => ({
          value: status,
          label: status.charAt(0).toUpperCase() + status.slice(1)
        }));
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown filter type: ${filterType}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json(options);
    
  } catch (error) {
    console.error('Failed to fetch filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
