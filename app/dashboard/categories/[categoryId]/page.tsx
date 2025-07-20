import { requirePermission } from "@/libs/auth-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Category from "@/models/Category";
import connectMongo from "@/libs/mongoose";
import CategoryForm from "@/components/dashboard/CategoryForm";

export const dynamic = "force-dynamic";

async function getCategory(categoryId: string) {
  await connectMongo();
  
  const category = await Category.findOne({
    _id: categoryId,
  })
    .populate('parentId', 'name')
    .lean();
    
  return category as any;
}

async function getCategories(excludeId?: string) {
  const query: any = {
    isActive: true,
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const categories = await Category.find(query)
    .select('name path level')
    .sort('path')
    .lean();
    
  return categories;
}

export default async function CategoryDetailPage({
  params,
}: {
  params: { categoryId: string };
}) {
  const session = await requirePermission('canManageInventory');
  
  const { categoryId } = await params;
  // Handle "new" category creation
  if (categoryId === 'new') {
    const categories = await getCategories();
    
    return (
      <div className="p-8">
        {/* Page header */}
        <div className="mb-8">
          <Link
            href="/dashboard/categories"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back to categories
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">New Category</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new category to organize your products
          </p>
        </div>

        {/* Category form */}
        <div className="max-w-2xl">
          <CategoryForm
            parentCategories={categories}
          />
        </div>
      </div>
    );
  }
  
  // Get existing category
  const [category, categories] = await Promise.all([
    getCategory(categoryId),
    getCategories(categoryId),
  ]);
  
  if (!category) {
    notFound();
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        <Link
          href="/dashboard/categories"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to categories
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {category.parentId && typeof category.parentId === 'object' && 'name' in category.parentId ? `Child of ${category.parentId.name}` : 'Root category'}
          </p>
        </div>
      </div>

      {/* Category form */}
      <div className="max-w-2xl">
        <CategoryForm
          category={category}
          parentCategories={categories}
        />
      </div>
    </div>
  );
}
