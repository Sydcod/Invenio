const mongoose = require('mongoose');
const { connectMongo } = require('./libs/database/connectMongo');
const { buildSalesKPIsPipeline } = require('./libs/analytics/aggregations');

async function debugAnalytics() {
  try {
    await connectMongo();
    const SalesOrder = mongoose.model('SalesOrder');
    
    // Test the aggregation pipeline directly
    const pipeline = buildSalesKPIsPipeline({
      startDate: '2025-07-01',
      endDate: '2025-07-31',
      comparisonStartDate: '2025-05-31',
      comparisonEndDate: '2025-06-30'
    });
    
    console.log('Pipeline:', JSON.stringify(pipeline, null, 2));
    
    const result = await SalesOrder.aggregate(pipeline);
    console.log('\nResult:', JSON.stringify(result, null, 2));
    
    // Also run a simple count query
    const directCount = await SalesOrder.countDocuments({
      'dates.orderDate': {
        $gte: '2025-07-01T00:00:00.000Z',
        $lte: '2025-07-31T23:59:59.999Z'
      },
      status: { $nin: ['draft', 'cancelled'] }
    });
    
    console.log('\nDirect count (string dates):', directCount);
    
    // Count all orders in July regardless of status
    const allJulyOrders = await SalesOrder.countDocuments({
      'dates.orderDate': {
        $gte: '2025-07-01T00:00:00.000Z',
        $lte: '2025-07-31T23:59:59.999Z'
      }
    });
    
    console.log('All July orders (including draft/cancelled):', allJulyOrders);
    
    // Find any draft/cancelled orders in July
    const draftCancelledOrders = await SalesOrder.find({
      'dates.orderDate': {
        $gte: '2025-07-01T00:00:00.000Z',
        $lte: '2025-07-31T23:59:59.999Z'
      },
      status: { $in: ['draft', 'cancelled'] }
    }).select('orderNumber status dates.orderDate');
    
    console.log('\nDraft/Cancelled orders in July:', draftCancelledOrders);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

debugAnalytics();