# Report Implementation Guide

## Overview
This guide documents the correct approach for implementing reports in the Invenio system, based on lessons learned from the Inventory Summary report implementation. The Inventory Summary report serves as the reference model for all future report implementations.

## Key Principles

### 1. No Hardcoding - Everything Must Be Dynamic
- **NEVER** hardcode filter options in report configurations
- **ALWAYS** load filter options dynamically from MongoDB
- **USE MCP** to verify database structure and data before implementation

### 2. Database-First Approach
- Always inspect the actual MongoDB data structure using MCP before implementing filters
- Understand how data is stored (nested objects vs. direct fields)
- Verify field names and data types match between frontend and backend

### 3. API Route Structure
- Use the dynamic route pattern: `/api/reports/[category]/[reportId]`
- Remove any legacy static routes that could conflict
- Keep the API structure clean and consistent

## Implementation Checklist

### Phase 1: Database Analysis
- [ ] Use MCP to inspect the target MongoDB collection(s)
- [ ] Document the data structure for each field that will be filtered
- [ ] Identify nested vs. direct fields (e.g., `category.name` vs. `brand`)
- [ ] Note array fields that require special handling (e.g., `inventory.locations`)
- [ ] Verify data types (string, number, ObjectId, etc.)

### Phase 2: Report Configuration
- [ ] Create report config in `/config/reports/[reportName].ts`
- [ ] Define all filters with `dynamicConfig` property:
  ```typescript
  {
    key: 'category',
    label: 'Category',
    type: 'multiSelect',
    dynamicConfig: {
      type: 'category',
      collection: 'products'
    }
  }
  ```
- [ ] Ensure NO hardcoded `options` arrays in filters
- [ ] Define proper column configurations with correct data paths

### Phase 3: Aggregation Pipeline
- [ ] Handle both single values and arrays for filters:
  ```typescript
  if (params.filters.brand) {
    if (Array.isArray(params.filters.brand) && params.filters.brand.length > 0) {
      matchStage.brand = { $in: params.filters.brand };
    } else if (typeof params.filters.brand === 'string' && params.filters.brand !== '') {
      matchStage.brand = params.filters.brand;
    }
  }
  ```
- [ ] Use correct field paths (e.g., `category.name` for nested fields)
- [ ] Implement proper array filtering with `$elemMatch` for array fields
- [ ] Test aggregation pipeline stages individually using MCP

### Phase 4: Frontend Integration
- [ ] Ensure ReportViewer loads dynamic filter options
- [ ] Verify filter values are sent correctly to the backend
- [ ] Handle loading states for dynamic filters
- [ ] Implement proper error handling for filter loading failures

### Phase 5: Testing & Debugging
- [ ] Add console.log statements to trace filter values through the pipeline
- [ ] Verify each filter works independently
- [ ] Test filter combinations
- [ ] Check that summary calculations update with filters
- [ ] Ensure export functionality includes filtered data

## Common Pitfalls to Avoid

### 1. Filter Type Mismatches
**Problem**: Frontend sends single value, backend expects array
**Solution**: Handle both cases in aggregation pipeline

### 2. Nested Field Access
**Problem**: Using `brand` instead of `brand.name` for nested objects
**Solution**: Always check actual data structure with MCP

### 3. Array Field Filtering
**Problem**: Direct matching on array fields doesn't work
**Solution**: Use `$elemMatch` for array element matching:
```typescript
{
  'inventory.locations': {
    $elemMatch: {
      warehouseId: params.filters.warehouse
    }
  }
}
```

### 4. Route Conflicts
**Problem**: Legacy static routes intercepting dynamic routes
**Solution**: Remove all static route implementations

### 5. Filter Value Formats
**Problem**: Sending comma-separated strings when backend expects arrays
**Solution**: Ensure consistent parsing in route handler

## Reference Implementation: Inventory Summary

### Key Features That Work Correctly:
1. Dynamic filter loading from `/api/reports/filters`
2. Proper handling of both single and array filter values
3. Correct nested field access (`category.name`)
4. Working aggregation pipeline with proper match stages
5. Summary calculations that update with filters

### Areas Still Needing Refinement:
1. Warehouse filter with array field matching (requires more complex aggregation)
2. Export functionality with filtered data
3. Performance optimization for large datasets

## MongoDB Data Structure Reference

### Products Collection
```javascript
{
  _id: ObjectId,
  sku: string,
  name: string,
  category: {
    id: string,
    name: string,    // Filter on this field
    path: string
  },
  brand: string,     // Direct field
  inventory: {
    currentStock: number,
    locations: [     // Array field
      {
        warehouseId: string,
        quantity: number
      }
    ]
  }
}
```

## Dynamic Filter API Endpoint

The `/api/reports/filters` endpoint supports:
- `type=category` - Returns unique category names
- `type=brand` - Returns unique brand names
- `type=warehouse` - Returns warehouse id/name pairs
- `type=customer` - Returns customer id/name pairs
- `type=status` - Returns status options

Always returns data in format:
```json
[
  { "value": "actual_value", "label": "Display Name" }
]
```

## Next Steps for Other Reports

When implementing new reports:
1. Start by examining the Inventory Summary implementation
2. Use MCP to understand your specific data structure
3. Follow the checklist above
4. Test each filter independently before combining
5. Document any report-specific challenges

Remember: The goal is to have all reports showing real MongoDB data with zero hardcoded values.
