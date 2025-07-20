'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  brand: z.string().optional(),
  categoryId: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  status: z.enum(['active', 'inactive', 'draft']),
  pricing: z.object({
    costPrice: z.number().min(0, 'Cost price must be positive'),
    salePrice: z.number().min(0, 'Sale price must be positive'),
    compareAtPrice: z.number().min(0, 'Compare at price must be positive').optional(),
    taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100').optional(),
  }),
  inventory: z.object({
    quantity: z.number().int().min(0, 'Quantity must be positive'),
    minQuantity: z.number().int().min(0, 'Min quantity must be positive'),
    maxQuantity: z.number().int().min(0, 'Max quantity must be positive').optional(),
    reorderPoint: z.number().int().min(0, 'Reorder point must be positive'),
    reorderQuantity: z.number().int().min(0, 'Reorder quantity must be positive'),
    trackInventory: z.boolean(),
  }),
  weight: z.number().min(0, 'Weight must be positive').optional(),
  dimensions: z.object({
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
  }).optional(),
  suppliers: z.array(z.object({
    supplierId: z.string(),
    supplierSku: z.string().optional(),
    supplierPrice: z.number().min(0).optional(),
    leadTime: z.number().int().min(0).optional(),
    isPreferred: z.boolean(),
  })).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: any;
  categories?: any[];
  suppliers?: any[];
}

export default function ProductForm({ 
  product,
  categories = [],
  suppliers = []
}: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      description: product?.description || '',
      brand: product?.brand || '',
      categoryId: product?.categoryId?._id || '',
      barcode: product?.barcode || '',
      unit: product?.unit || 'piece',
      status: product?.status || 'draft',
      pricing: {
        costPrice: product?.pricing?.costPrice || 0,
        salePrice: product?.pricing?.salePrice || 0,
        compareAtPrice: product?.pricing?.compareAtPrice || 0,
        taxRate: product?.pricing?.taxRate || 0,
      },
      inventory: {
        quantity: product?.inventory?.quantity || 0,
        minQuantity: product?.inventory?.minQuantity || 0,
        maxQuantity: product?.inventory?.maxQuantity || undefined,
        reorderPoint: product?.inventory?.reorderPoint || 0,
        reorderQuantity: product?.inventory?.reorderQuantity || 0,
        trackInventory: product?.inventory?.trackInventory ?? true,
      },
      weight: product?.weight || 0,
      dimensions: product?.dimensions || {},
      suppliers: product?.suppliers || [],
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    
    try {
      const method = product ? 'PATCH' : 'POST';
      const url = product 
        ? `/api/products/${product._id}`
        : '/api/products';
        
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }
      
      toast.success(product ? 'Product updated!' : 'Product created!');
      router.push('/dashboard/products');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Basic Information
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                Product Name
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

            <div className="sm:col-span-2">
              <label htmlFor="sku" className="block text-sm font-medium leading-6 text-gray-900">
                SKU
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('sku')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.sku && (
                  <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
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

            <div className="sm:col-span-2">
              <label htmlFor="brand" className="block text-sm font-medium leading-6 text-gray-900">
                Brand
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('brand')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="categoryId" className="block text-sm font-medium leading-6 text-gray-900">
                Category
              </label>
              <div className="mt-2">
                <select
                  {...register('categoryId')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:max-w-xs sm:text-sm sm:leading-6"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {'  '.repeat(category.level)}{category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                Status
              </label>
              <div className="mt-2">
                <select
                  {...register('status')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:max-w-xs sm:text-sm sm:leading-6"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Pricing
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="costPrice" className="block text-sm font-medium leading-6 text-gray-900">
                Cost Price
              </label>
              <div className="mt-2">
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    {...register('pricing.costPrice', { valueAsNumber: true })}
                    className="block w-full rounded-md border-0 py-1.5 pl-7 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  />
                </div>
                {errors.pricing?.costPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.pricing.costPrice.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="salePrice" className="block text-sm font-medium leading-6 text-gray-900">
                Sale Price
              </label>
              <div className="mt-2">
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    {...register('pricing.salePrice', { valueAsNumber: true })}
                    className="block w-full rounded-md border-0 py-1.5 pl-7 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  />
                </div>
                {errors.pricing?.salePrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.pricing.salePrice.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="compareAtPrice" className="block text-sm font-medium leading-6 text-gray-900">
                Compare at Price
              </label>
              <div className="mt-2">
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    {...register('pricing.compareAtPrice', { valueAsNumber: true })}
                    className="block w-full rounded-md border-0 py-1.5 pl-7 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Inventory
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="quantity" className="block text-sm font-medium leading-6 text-gray-900">
                Current Quantity
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  {...register('inventory.quantity', { valueAsNumber: true })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.inventory?.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory.quantity.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="reorderPoint" className="block text-sm font-medium leading-6 text-gray-900">
                Reorder Point
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  {...register('inventory.reorderPoint', { valueAsNumber: true })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.inventory?.reorderPoint && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory.reorderPoint.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="reorderQuantity" className="block text-sm font-medium leading-6 text-gray-900">
                Reorder Quantity
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  {...register('inventory.reorderQuantity', { valueAsNumber: true })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.inventory?.reorderQuantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.inventory.reorderQuantity.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="unit" className="block text-sm font-medium leading-6 text-gray-900">
                Unit of Measure
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('unit')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.unit && (
                  <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-6">
              <div className="relative flex items-start">
                <div className="flex h-6 items-center">
                  <input
                    type="checkbox"
                    {...register('inventory.trackInventory')}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label htmlFor="trackInventory" className="font-medium text-gray-900">
                    Track inventory
                  </label>
                  <p className="text-gray-500">
                    Automatically track inventory levels and get alerts when stock is low
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-x-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/products')}
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
          {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
