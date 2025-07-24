import { requirePermission } from "@/libs/auth-utils";
import Link from "next/link";
import { PlusIcon, FolderIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Category from "@/models/Category";
import connectMongo from "@/libs/mongoose";

export const dynamic = "force-dynamic";

async function getCategories() {
  await connectMongo();
  
  const categories = await Category.find({ 
    isActive: true 
  })
    .sort('path')
    .lean();
    
  // Build hierarchy
  const categoryMap = new Map();
  const rootCategories: any[] = [];
  
  categories.forEach(cat => {
    categoryMap.set(cat._id.toString(), {
      ...cat,
      children: []
    });
  });
  
  categories.forEach(cat => {
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId.toString());
      if (parent) {
        parent.children.push(categoryMap.get(cat._id.toString()));
      }
    } else {
      rootCategories.push(categoryMap.get(cat._id.toString()));
    }
  });
  
  return rootCategories;
}

function CategoryRow({ category, level = 0 }: { category: any; level?: number }) {
  return (
    <>
      <tr>
        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
          <div className="flex items-center" style={{ paddingLeft: `${level * 1.5}rem` }}>
            <FolderIcon className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <div className="font-medium text-gray-900">{category.name}</div>
              <div className="text-gray-500">{category.code}</div>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
          {category.description || '-'}
        </td>
        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
          {category.productCount || 0} products
        </td>
        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
          <Link
            href={`/dashboard/categories/${category._id}`}
            className="text-primary hover:text-primary/80"
          >
            Edit<span className="sr-only">, {category.name}</span>
          </Link>
        </td>
      </tr>
      {category.children?.map((child: any) => (
        <CategoryRow key={child._id} category={child} level={level + 1} />
      ))}
    </>
  );
}

export default async function CategoriesPage() {
  const session = await requirePermission('canManageInventory');
  const categories = await getCategories();

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Organize your products into categories
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/categories/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Add Category
          </Link>
        </div>
      </div>

      {/* Categories table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Category
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Products
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                        No categories yet. Create your first category to organize products.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <CategoryRow key={category._id} category={category} />
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
