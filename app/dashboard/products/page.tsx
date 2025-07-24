import { requirePermission } from "@/libs/auth-utils";
import Link from "next/link";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import Product from "@/models/Product";
import Category from "@/models/Category";
import connectMongo from "@/libs/mongoose";

export const dynamic = "force-dynamic";

async function getProducts(searchQuery?: string) {
  await connectMongo();
  
  const query: any = {};
  
  if (searchQuery) {
    query.$or = [
      { name: { $regex: searchQuery, $options: 'i' } },
      { sku: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
    ];
  }
  
  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
    
  return products;
}

async function getProductStats() {
  try {
    await connectMongo();

    const [overview, inventoryStats, lowStockProducts, topCategories, topBrands] = await Promise.all([
      // Overview stats
      Product.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            draft: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
            discontinued: { $sum: { $cond: [{ $eq: ["$status", "discontinued"] }, 1, 0] } },
          },
        },
      ]),

      // Inventory stats
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: { $multiply: ["$pricing.price", "$inventory.currentStock"] },
            },
            totalStock: { $sum: "$inventory.currentStock" },
            lowStock: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $gt: ["$inventory.currentStock", 0] },
                      { $lte: ["$inventory.currentStock", "$inventory.reorderPoint"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            outOfStock: {
              $sum: { $cond: [{ $eq: ["$inventory.currentStock", 0] }, 1, 0] },
            },
          },
        },
      ]),

      // Low stock products
      Product.find({
        $and: [
          { "inventory.currentStock": { $gt: 0 } },
          { $expr: { $lte: ["$inventory.currentStock", "$inventory.reorderPoint"] } },
        ],
      })
        .limit(5)
        .select("name sku inventory.currentStock inventory.reorderPoint")
        .lean(),

      // Top categories by product count and value
      Product.aggregate([
        { $match: { status: "active" } },
        {
          $group: {
            _id: "$category.name",
            count: { $sum: 1 },
            value: {
              $sum: { $multiply: ["$pricing.price", "$inventory.currentStock"] },
            },
          },
        },
        { $sort: { value: -1 } },
        { $limit: 5 },
      ]),

      // Top brands by product count and value
      Product.aggregate([
        { $match: { status: "active", brand: { $ne: null } } },
        {
          $group: {
            _id: "$brand",
            count: { $sum: 1 },
            value: {
              $sum: { $multiply: ["$pricing.price", "$inventory.currentStock"] },
            },
          },
        },
        { $sort: { value: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const stats = {
      overview: {
        total: overview[0]?.total || 0,
        active: overview[0]?.active || 0,
        draft: overview[0]?.draft || 0,
        discontinued: overview[0]?.discontinued || 0,
        lowStock: inventoryStats[0]?.lowStock || 0,
        outOfStock: inventoryStats[0]?.outOfStock || 0,
      },
      inventory: {
        totalValue: inventoryStats[0]?.totalValue || 0,
        totalStock: inventoryStats[0]?.totalStock || 0,
      },
      lowStockProducts: lowStockProducts,
      topCategories: topCategories.map((cat) => ({
        category: cat._id || "Uncategorized",
        count: cat.count,
        value: cat.value,
      })),
      topBrands: topBrands.map((brand) => ({
        brand: brand._id,
        count: brand.count,
        value: brand.value,
      })),
    };

    return stats;
  } catch (error) {
    console.error('Error fetching product stats:', error);
    return null;
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await requirePermission('canManageInventory');
  const [products, stats] = await Promise.all([
    getProducts(searchParams.search),
    getProductStats()
  ]);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product inventory and catalog
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          {/* Total Products */}
          <div className="relative overflow-hidden rounded-lg bg-white px-6 py-5 shadow hover:shadow-md transition-shadow">
            <dt>
              <div className="absolute rounded-md bg-blue-100 p-3">
                <CubeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">Total Products</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.total}</p>
            </dd>
          </div>

          {/* Active Products */}
          <div className="relative overflow-hidden rounded-lg bg-white px-6 py-5 shadow hover:shadow-md transition-shadow">
            <dt>
              <div className="absolute rounded-md bg-green-100 p-3">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">Active</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.active}</p>
            </dd>
          </div>

          {/* Low Stock */}
          <div className="relative overflow-hidden rounded-lg bg-white px-6 py-5 shadow hover:shadow-md transition-shadow">
            <dt>
              <div className="absolute rounded-md bg-yellow-100 p-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">Low Stock</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.lowStock}</p>
            </dd>
          </div>

          {/* Out of Stock */}
          <div className="relative overflow-hidden rounded-lg bg-white px-6 py-5 shadow hover:shadow-md transition-shadow">
            <dt>
              <div className="absolute rounded-md bg-red-100 p-3">
                <XCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">Out of Stock</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.outOfStock}</p>
            </dd>
          </div>

          {/* Total Inventory Value */}
          <div className="relative overflow-hidden rounded-lg bg-white px-6 py-5 shadow hover:shadow-md transition-shadow">
            <dt>
              <div className="absolute rounded-md bg-purple-100 p-3">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">Inventory Value</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                ${(stats.inventory.totalValue / 1000).toFixed(0)}K
              </p>
            </dd>
          </div>

          {/* Discontinued */}
          <div className="relative overflow-hidden rounded-lg bg-white px-6 py-5 shadow hover:shadow-md transition-shadow">
            <dt>
              <div className="absolute rounded-md bg-gray-100 p-3">
                <ArchiveBoxIcon className="h-6 w-6 text-gray-600" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">Discontinued</p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.discontinued}</p>
            </dd>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="mt-6">
        <form method="get" action="/dashboard/products">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              name="search"
              defaultValue={searchParams.search}
              className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              placeholder="Search products by name, SKU, or description..."
            />
          </div>
        </form>
      </div>

      {/* Products table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Product
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      SKU
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Stock
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Price
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-500">
                        {searchParams.search
                          ? 'No products found matching your search.'
                          : 'No products yet. Add your first product to get started.'}
                      </td>
                    </tr>
                  ) : (
                    products.map((product: any) => (
                      <tr key={product._id}>
                        <td className="whitespace-nowrap px-3 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            {product.brand && (
                              <div className="text-sm text-gray-500">{product.brand}</div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {product.sku}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {product.category?.name || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className={`font-medium ${
                            (product.inventory?.currentStock || 0) <= (product.inventory?.reorderPoint || 0)
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}>
                            {product.inventory?.currentStock || 0}
                            {(product.inventory?.currentStock || 0) <= (product.inventory?.reorderPoint || 0) && (
                              <span className="ml-1 text-xs text-red-500">Low</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {product.inventory?.minQuantity || 0}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          ${product.pricing?.price?.toFixed(2) || '0.00'}
                          {product.pricing?.compareAtPrice > product.pricing?.price && (
                            <div className="text-xs text-gray-500 line-through">
                              ${product.pricing?.compareAtPrice?.toFixed(2) || '0.00'}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            product.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : product.status === 'draft'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/dashboard/products/${product._id}`}
                            className="text-primary hover:text-primary/80"
                          >
                            Edit<span className="sr-only">, {product.name}</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
