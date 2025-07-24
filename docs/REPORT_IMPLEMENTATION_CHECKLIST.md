# Report Implementation Checklist

## Pre-Implementation Verification

### 1. Database Structure Analysis with MCP
- [ ] Connect to MongoDB using MCP: `mcp0_list_databases`
- [ ] Select the correct database (usually "test")
- [ ] Inspect target collection structure: `mcp0_find` with limit 2-3
- [ ] Document ALL fields that will be:
  - [ ] Displayed in the report
  - [ ] Used for filtering
  - [ ] Used for calculations/aggregations
- [ ] Note field types and structures:
  - [ ] Direct fields (e.g., `brand: "Microsoft"`)
  - [ ] Nested objects (e.g., `category: { name: "Laptops" }`)
  - [ ] Array fields (e.g., `inventory.locations: [...]`)
  - [ ] Numeric vs String fields

### 2. Clean API Structure Check
- [ ] Verify no conflicting static routes exist in `/app/api/reports/`
- [ ] Ensure only these directories exist:
  - [ ] `/app/api/reports/[category]/[reportId]/`
  - [ ] `/app/api/reports/filters/`
  - [ ] `/app/api/reports/route.ts` (main listing)
- [ ] Remove any legacy route implementations

## Implementation Steps

### Step 1: Report Configuration
Location: `/config/reports/[reportName].ts`

- [ ] Import required types and utilities
- [ ] Define report metadata:
  ```typescript
  id: 'category-report-name',
  name: 'Human Readable Report Name',
  description: 'Clear description of what this report shows',
  category: 'category-name',
  icon: IconComponent,
  requiredCollections: ['collection-name']
  ```

### Step 2: Filter Configuration
- [ ] Define ALL filters with dynamic loading:
  ```typescript
  filters: [
    {
      key: 'fieldName',
      label: 'Display Label',
      type: 'select|multiSelect|dateRange|search|number',
      required: false,
      dynamicConfig: {
        type: 'filter-type',  // category, brand, warehouse, etc.
        collection: 'collection-name'
      }
    }
  ]
  ```
- [ ] NO hardcoded options arrays
- [ ] Verify filter types match field types in MongoDB

### Step 3: Column Configuration
- [ ] Define all display columns:
  ```typescript
  columns: [
    {
      key: 'fieldPath',  // Use dot notation for nested: 'category.name'
      label: 'Column Header',
      sortable: true,
      format: (value) => formatFunction(value),  // If needed
      align: 'left|center|right'
    }
  ]
  ```

### Step 4: Aggregation Pipeline
- [ ] Create pipeline function that accepts `ReportParams`
- [ ] Start with warehouse filter if applicable (filter early for performance)
- [ ] Build match stage with proper filter handling:
  ```typescript
  // Handle both single values and arrays
  if (params.filters.filterName) {
    if (Array.isArray(params.filters.filterName) && params.filters.filterName.length > 0) {
      matchStage['field.path'] = { $in: params.filters.filterName };
    } else if (typeof params.filters.filterName === 'string' && params.filters.filterName !== '') {
      matchStage['field.path'] = params.filters.filterName;
    }
  }
  ```
- [ ] Use correct MongoDB operators:
  - [ ] `$in` for array matching
  - [ ] `$elemMatch` for array element matching
  - [ ] `$regex` for search filters
  - [ ] Comparison operators for numeric filters
- [ ] Add necessary calculation stages
- [ ] Project final output matching column definitions

### Step 5: Summary Function (if needed)
- [ ] Define summary calculations
- [ ] Return object with summary metrics
- [ ] Ensure calculations work with filtered data

### Step 6: Register Report
Location: `/libs/reports/registry.ts`
- [ ] Import report configuration
- [ ] Add to reportRegistry Map

### Step 7: Update Filter API
Location: `/app/api/reports/filters/route.ts`
- [ ] Add new filter type handler if needed
- [ ] Ensure it queries the correct collection
- [ ] Returns data in `{value, label}` format

## Testing Protocol

### 1. Database Verification
- [ ] Use MCP to run aggregation pipeline manually
- [ ] Verify each pipeline stage produces expected results
- [ ] Test with various filter combinations

### 2. Frontend Testing
- [ ] Navigate to report from dashboard
- [ ] Verify all filters load dynamically
- [ ] Test each filter independently:
  - [ ] Filter changes data correctly
  - [ ] Summary updates with filters
  - [ ] Pagination works with filters
- [ ] Test filter combinations
- [ ] Test sorting functionality
- [ ] Test export with filters applied

### 3. Performance Testing
- [ ] Check response time with no filters
- [ ] Check response time with multiple filters
- [ ] Verify no N+1 queries or inefficient operations

### 4. Error Handling
- [ ] Test with invalid filter values
- [ ] Test with database connection issues
- [ ] Verify appropriate error messages

## Common Issues Checklist

- [ ] **Filter not working?** Check field path matches MongoDB structure
- [ ] **No data showing?** Verify collection name and database connection
- [ ] **Wrong data type?** Check if filter expects array but gets string
- [ ] **Nested field issues?** Use dot notation: `category.name`
- [ ] **Array field filtering?** Use `$elemMatch` for complex matching
- [ ] **Export not working?** Ensure export logic includes current filters

## Post-Implementation

- [ ] Remove all `console.log` debug statements
- [ ] Update documentation if new patterns discovered
- [ ] Add report to user documentation
- [ ] Verify report appears in correct category on dashboard

## Reference Files

Always refer to these working implementations:
- `/config/reports/inventorySummary.ts` - Model implementation
- `/app/api/reports/filters/route.ts` - Dynamic filter loading
- `/app/api/reports/[category]/[reportId]/route.ts` - API handler
- `/components/reports/ReportViewer.tsx` - Frontend component

## MCP Commands Reference

```bash
# List databases
mcp0_list_databases

# Inspect collection structure
mcp0_find(database: "test", collection: "products", filter: {}, limit: 2)

# Test aggregation stage
mcp0_aggregate(database: "test", collection: "products", pipeline: [{$match: {...}}])

# Get unique values for filter
mcp0_aggregate(database: "test", collection: "products", pipeline: [
  {$group: {_id: "$brand"}},
  {$sort: {_id: 1}}
])
```
