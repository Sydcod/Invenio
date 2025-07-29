import { requirePermission } from "@/libs/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Product from "@/models/Product";
import Category from "@/models/Category";
import Supplier from "@/models/Supplier";
import connectMongo from "@/libs/mongoose";
import ProductForm from "@/components/dashboard/ProductForm";

export const dynamic = "force-dynamic";

async function getProduct(productId: string): Promise<any | null> {
  await connectMongo();
  
  const product = await Product.findOne({
    _id: productId,
  })
    .populate('categoryId', 'name')
    .populate('suppliers.supplierId', 'name code')
    .lean();
    
  return product;
}

async function getCategories() {
  const categories = await Category.find({
    isActive: true,
  })
    .select('name path level')
    .sort('path')
    .lean();
    
  return categories;
}

async function getSuppliers() {
  const suppliers = await Supplier.find({
    status: 'active',
  })
    .select('name code')
    .sort('name')
    .lean();
    
  return suppliers;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const session = await requirePermission('canManageInventory');
  
  const { productId } = await params;
  // Handle "new" product creation
  if (productId === 'new') {
    const [categories, suppliers] = await Promise.all([
      getCategories(),
      getSuppliers(),
    ]);
    
    return (
      <div className="p-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to products
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">New Product</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new product to your inventory
          </p>
        </div>

        {/* Product form */}
        <div className="max-w-4xl">
          <ProductForm
            categories={categories}
            suppliers={suppliers}
          />
        </div>
      </div>
    );
  }
  
  // Get existing product
  const [product, categories, suppliers] = await Promise.all([
    getProduct(productId),
    getCategories(),
    getSuppliers(),
  ]);
  
  if (!product) {
    notFound();
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to products
        </Link>
        <div className="mt-2 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-1 text-sm text-gray-500">SKU: {product.sku}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              product.status === 'active'
                ? 'bg-green-100 text-green-800'
                : product.status === 'draft'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {product.status}
            </span>
          </div>
        </div>
      </div>

      {/* Product form */}
      <div className="max-w-4xl">
        <ProductForm
          product={product}
          categories={categories}
          suppliers={suppliers}
        />
      </div>
    </div>
  );
}
