'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const salesOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    company: z.string().optional(),
  }),
  warehouse: z.string().min(1, 'Warehouse is required'),
  items: z.array(z.object({
    product: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    discount: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  })).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
  payment: z.object({
    method: z.enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other']),
  }),
  shipping: z.object({
    method: z.string().optional(),
    cost: z.number().min(0).optional(),
  }),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

type SalesOrderFormData = z.infer<typeof salesOrderSchema>;

interface SalesOrderFormProps {
  salesOrder?: any;
}

export default function SalesOrderForm({ 
  salesOrder
}: SalesOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SalesOrderFormData>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      customer: salesOrder?.customer || {
        name: '',
        email: '',
        phone: '',
        company: '',
      },
      warehouse: salesOrder?.warehouse?._id || '',
      items: salesOrder?.items?.map((item: any) => ({
        product: item.product?._id || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        discount: item.discount || 0,
        notes: item.notes || '',
      })) || [{ product: '', quantity: 1, unitPrice: 0, discount: 0, notes: '' }],
      shippingAddress: salesOrder?.shippingAddress || {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      payment: salesOrder?.payment || { method: 'credit_card' },
      shipping: salesOrder?.shipping || {},
      notes: salesOrder?.notes || '',
      priority: salesOrder?.priority || 'medium',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const shippingCost = watch('shipping.cost') || 0;

  // Load warehouses and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [warehousesRes, productsRes] = await Promise.all([
          fetch('/api/warehouses?limit=100'),
          fetch('/api/products?limit=500'),
        ]);

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

  const onSubmit = async (data: SalesOrderFormData) => {
    setIsSubmitting(true);
    
    try {
      const method = salesOrder ? 'PATCH' : 'POST';
      const url = salesOrder 
        ? `/api/sales-orders/${salesOrder._id}`
        : '/api/sales-orders';
        
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save sales order');
      }
      
      toast.success(salesOrder ? 'Sales order updated!' : 'Sales order created!');
      router.push('/dashboard/sales-orders');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = !salesOrder || ['draft', 'pending'].includes(salesOrder.status);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Customer Information */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Customer Information
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="customer.name" className="block text-sm font-medium leading-6 text-gray-900">
                Customer Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('customer.name')}
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.customer?.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer.name.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="customer.company" className="block text-sm font-medium leading-6 text-gray-900">
                Company
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('customer.company')}
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="customer.email" className="block text-sm font-medium leading-6 text-gray-900">
                Email
              </label>
              <div className="mt-2">
                <input
                  type="email"
                  {...register('customer.email')}
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.customer?.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.customer.email.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="customer.phone" className="block text-sm font-medium leading-6 text-gray-900">
                Phone
              </label>
              <div className="mt-2">
                <input
                  type="tel"
                  {...register('customer.phone')}
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="warehouse" className="block text-sm font-medium leading-6 text-gray-900">
                Warehouse
              </label>
              <div className="mt-2">
                <select
                  {...register('warehouse')}
                  disabled={!canEdit}
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
              <label htmlFor="priority" className="block text-sm font-medium leading-6 text-gray-900">
                Priority
              </label>
              <div className="mt-2">
                <select
                  {...register('priority')}
                  disabled={!canEdit}
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
      <SalesOrderItemsSection
        fields={fields}
        register={register}
        control={control}
        errors={errors}
        products={products}
        append={append}
        remove={remove}
        canEdit={canEdit}
        watchedItems={watchedItems}
        shippingCost={shippingCost}
      />

      {/* Shipping Address */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Shipping Address
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="col-span-full">
              <label htmlFor="shippingAddress.street" className="block text-sm font-medium leading-6 text-gray-900">
                Street Address
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('shippingAddress.street')}
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.shippingAddress?.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.street.message}</p>
                )}
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
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.shippingAddress?.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.city.message}</p>
                )}
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
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.shippingAddress?.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.state.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="shippingAddress.country" className="block text-sm font-medium leading-6 text-gray-900">
                Country
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('shippingAddress.country')}
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.shippingAddress?.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.country.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="shippingAddress.postalCode" className="block text-sm font-medium leading-6 text-gray-900">
                Postal Code
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('shippingAddress.postalCode')}
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.shippingAddress?.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.shippingAddress.postalCode.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping & Payment */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Shipping & Payment
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="shipping.method" className="block text-sm font-medium leading-6 text-gray-900">
                Shipping Method
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('shipping.method')}
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="shipping.cost" className="block text-sm font-medium leading-6 text-gray-900">
                Shipping Cost
              </label>
              <div className="mt-2">
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    {...register('shipping.cost', { valueAsNumber: true })}
                    disabled={!canEdit}
                    className="block w-full rounded-md border-0 py-1.5 pl-7 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="payment.method" className="block text-sm font-medium leading-6 text-gray-900">
                Payment Method
              </label>
              <div className="mt-2">
                <select
                  {...register('payment.method')}
                  disabled={!canEdit}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
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
              disabled={!canEdit}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              placeholder="Any additional notes about this sales order..."
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-x-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/sales-orders')}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        {canEdit && (
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : salesOrder ? 'Update Order' : 'Create Order'}
          </button>
        )}
      </div>
    </form>
  );
}

// Extracted component for Order Items section
function SalesOrderItemsSection({ 
  fields, 
  register, 
  control, 
  errors, 
  products, 
  append, 
  remove, 
  canEdit,
  watchedItems,
  shippingCost
}: any) {
  const subtotal = watchedItems.reduce((sum: number, item: any) => {
    const itemTotal = item.quantity * item.unitPrice;
    const discount = item.discount || 0;
    return sum + (itemTotal * (1 - discount / 100));
  }, 0);
  const totalAmount = subtotal + shippingCost;

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <div className="px-4 py-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Order Items
          </h2>
          {canEdit && (
            <button
              type="button"
              onClick={() => append({ product: '', quantity: 1, unitPrice: 0, discount: 0, notes: '' })}
              className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Item
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {fields.map((field: any, index: number) => (
            <div key={field.id} className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-12 p-4 bg-gray-50 rounded-lg">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Product
                </label>
                <select
                  {...register(`items.${index}.product`)}
                  disabled={!canEdit}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                >
                  <option value="">Select a product</option>
                  {products.map((product: any) => (
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
                  disabled={!canEdit}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
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
                    disabled={!canEdit}
                    className="block w-full rounded-md border-0 py-1.5 pl-7 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Discount %
                </label>
                <input
                  type="number"
                  step="1"
                  {...register(`items.${index}.discount`, { valueAsNumber: true })}
                  disabled={!canEdit}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Notes
                </label>
                <input
                  type="text"
                  {...register(`items.${index}.notes`)}
                  disabled={!canEdit}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>

              {canEdit && (
                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {errors.items && (
            <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
          )}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold text-gray-900">
            <span>Total Amount</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
