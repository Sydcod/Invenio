'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  code: z.string().min(1, 'Category code is required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  attributes: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'number', 'boolean', 'select']),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })).optional(),
  settings: z.object({
    isDefault: z.boolean(),
    allowProducts: z.boolean(),
  }),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: any;
  parentCategories: any[];
  organizationId: string;
}

export default function CategoryForm({ 
  category, 
  parentCategories,
  organizationId 
}: CategoryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      code: category?.code || '',
      description: category?.description || '',
      parentId: category?.parentId?._id || '',
      attributes: category?.attributes || [],
      settings: {
        isDefault: category?.settings?.isDefault || false,
        allowProducts: category?.settings?.allowProducts ?? true,
      },
    },
  });

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    
    try {
      const method = category ? 'PATCH' : 'POST';
      const url = category 
        ? `/api/categories/${category._id}`
        : '/api/categories';
        
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save category');
      }
      
      toast.success(category ? 'Category updated!' : 'Category created!');
      router.push('/dashboard/categories');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!category || !confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/categories/${category._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }
      
      toast.success('Category deleted!');
      router.push('/dashboard/categories');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                Category Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('name')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="code" className="block text-sm font-medium leading-6 text-gray-900">
                Category Code
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('code')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  placeholder="e.g., ELEC, CLOTH"
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                Description
              </label>
              <div className="mt-2">
                <textarea
                  rows={3}
                  {...register('description')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="parentId" className="block text-sm font-medium leading-6 text-gray-900">
                Parent Category
              </label>
              <div className="mt-2">
                <select
                  {...register('parentId')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                >
                  <option value="">None (Root Category)</option>
                  {parentCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {'  '.repeat(cat.level)}{cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-6 space-y-4">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    type="checkbox"
                    {...register('settings.allowProducts')}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor="allowProducts" className="font-medium text-gray-900">
                    Allow products
                  </label>
                  <p className="text-gray-500">
                    Products can be assigned to this category
                  </p>
                </div>
              </div>

              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    type="checkbox"
                    {...register('settings.isDefault')}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor="isDefault" className="font-medium text-gray-900">
                    Default category
                  </label>
                  <p className="text-gray-500">
                    Use as the default category for new products
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between">
        <div>
          {category && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              disabled={isSubmitting}
            >
              Delete Category
            </button>
          )}
        </div>
        <div className="flex gap-x-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/categories')}
            className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </div>
    </form>
  );
}
