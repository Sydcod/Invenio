'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const purchaseOrderSchema = z.object({
  supplier: z.string().min(1, 'Supplier is required'),
  warehouse: z.string().min(1, 'Warehouse is required'),
  expectedDeliveryDate: z.string().min(1, 'Expected delivery date is required'),
  items: z.array(z.object({
    product: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    notes: z.string().optional(),
  })).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  payment: z.object({
    terms: z.string().optional(),
    method: z.enum(['cash', 'credit', 'bank_transfer', 'check', 'other']).optional(),
  }),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  purchaseOrder?: any;
}

export default function PurchaseOrderForm({ 
  purchaseOrder
}: PurchaseOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier: purchaseOrder?.supplier?._id || '',
      warehouse: purchaseOrder?.warehouse?._id || '',
      expectedDeliveryDate: purchaseOrder?.expectedDeliveryDate 
        ? new Date(purchaseOrder.expectedDeliveryDate).toISOString().split('T')[0]
        : '',
      items: purchaseOrder?.items?.map((item: any) => ({
        product: item.product?._id || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        notes: item.notes || '',
      })) || [{ product: '', quantity: 1, unitPrice: 0, notes: '' }],
      shippingAddress: purchaseOrder?.shippingAddress || {},
      notes: purchaseOrder?.notes || '',
      priority: purchaseOrder?.priority || 'medium',
      payment: purchaseOrder?.payment || {},
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const totalAmount = watchedItems.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0
  );

  // Load suppliers, warehouses, and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [suppliersRes, warehousesRes, productsRes] = await Promise.all([
          fetch('/api/suppliers?limit=100'),
          fetch('/api/warehouses?limit=100'),
          fetch('/api/products?limit=500'),
        ]);

        if (suppliersRes.ok) {
          const data = await suppliersRes.json();
          setSuppliers(data.suppliers || []);
        }

        if (warehousesRes.ok) {
          const data = await warehousesRes.json();
          setWarehouses(data.warehouses || []);
        }

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const onSubmit = async (data: PurchaseOrderFormData) => {
    setIsSubmitting(true);
    
    try {
      const method = purchaseOrder ? 'PATCH' : 'POST';
      const url = purchaseOrder 
        ? `/api/purchase-orders/${purchaseOrder._id}`
        : '/api/purchase-orders';
        
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save purchase order');
      }
      
      toast.success(purchaseOrder ? 'Purchase order updated!' : 'Purchase order created!');
      router.push('/dashboard/purchase-orders');
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
            <div className="sm:col-span-3">
              <label htmlFor="supplier" className="block text-sm font-medium leading-6 text-gray-900">
                Supplier
              </label>
              <div className="mt-2">
                <select
                  {...register('supplier')}
                  disabled={purchaseOrder?.status !== 'draft' && purchaseOrder}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name} ({supplier.code})
                    </option>
                  ))}
                </select>
                {errors.supplier && (
                  <p className="mt-1 text-sm text-red-600">{errors.supplier.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="warehouse" className="block text-sm font-medium leading-6 text-gray-900">
                Warehouse
              </label>
              <div className="mt-2">
                <select
                  {...register('warehouse')}
                  disabled={purchaseOrder?.status !== 'draft' && purchaseOrder}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
                {errors.warehouse && (
                  <p className="mt-1 text-sm text-red-600">{errors.warehouse.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium leading-6 text-gray-900">
                Expected Delivery Date
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  {...register('expectedDeliveryDate')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.expectedDeliveryDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expectedDeliveryDate.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="priority" className="block text-sm font-medium leading-6 text-gray-900">
                Priority
              </label>
              <div className="mt-2">
                <select
                  {...register('priority')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Order Items
            </h2>
            <button
              type="button"
              onClick={() => append({ product: '', quantity: 1, unitPrice: 0, notes: '' })}
              className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
              disabled={purchaseOrder?.status !== 'draft' && purchaseOrder}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Item
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-12 p-4 bg-gray-50 rounded-lg">
                <div className="sm:col-span-4">
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                    Product
                  </label>
                  <select
                    {...register(`items.${index}.product`)}
                    disabled={purchaseOrder?.status !== 'draft' && purchaseOrder}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                  {errors.items?.[index]?.product && (
                    <p className="mt-1 text-sm text-red-600">{errors.items[index].product?.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                    Quantity
                  </label>
                  <input
                    type="number"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    disabled={purchaseOrder?.status !== 'draft' && purchaseOrder}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.items[index].quantity?.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                    Unit Price
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                      disabled={purchaseOrder?.status !== 'draft' && purchaseOrder}
                      className="block w-full rounded-md border-0 py-1.5 pl-7 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                  {errors.items?.[index]?.unitPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.items[index].unitPrice?.message}</p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium leading-6 text-gray-900">
                    Notes
                  </label>
                  <input
                    type="text"
                    {...register(`items.${index}.notes`)}
                    disabled={purchaseOrder?.status !== 'draft' && purchaseOrder}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  />
                </div>

                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={(purchaseOrder?.status !== 'draft' && purchaseOrder) || fields.length === 1}
                    className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {errors.items && (
              <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
            )}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between text-base font-semibold text-gray-900">
              <span>Total Amount</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Shipping Address
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Leave blank to use the warehouse address
          </p>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="col-span-full">
              <label htmlFor="shippingAddress.street" className="block text-sm font-medium leading-6 text-gray-900">
                Street Address
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('shippingAddress.street')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="shippingAddress.city" className="block text-sm font-medium leading-6 text-gray-900">
                City
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('shippingAddress.city')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="shippingAddress.state" className="block text-sm font-medium leading-6 text-gray-900">
                State
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('shippingAddress.state')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="shippingAddress.postalCode" className="block text-sm font-medium leading-6 text-gray-900">
                Postal Code
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('shippingAddress.postalCode')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Additional Notes
          </h2>
          <div className="mt-6">
            <textarea
              rows={4}
              {...register('notes')}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              placeholder="Any additional notes about this purchase order..."
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-x-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/purchase-orders')}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        {(!purchaseOrder || purchaseOrder.status === 'draft') && (
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : purchaseOrder ? 'Update Order' : 'Create Order'}
          </button>
        )}
      </div>
    </form>
  );
}
