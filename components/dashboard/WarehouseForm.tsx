'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  code: z.string().min(1, 'Warehouse code is required'),
  type: z.enum(['storage', 'distribution', 'fulfillment', 'cross-dock']),
  status: z.enum(['active', 'inactive', 'maintenance']),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    country: z.string().min(1, 'Country is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    coordinates: z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).optional(),
  }),
  capacity: z.object({
    totalSpace: z.number().min(0, 'Total space must be positive'),
    unit: z.string().default('sqft'),
  }),
  manager: z.object({
    name: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
  }),
  operations: z.object({
    workingHours: z.string().optional(),
    zones: z.number().min(0).optional(),
    loadingDocks: z.number().min(0).optional(),
  }),
  settings: z.object({
    isDefault: z.boolean(),
    allowNegativeStock: z.boolean(),
    autoReplenishment: z.boolean(),
  }),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

interface WarehouseFormProps {
  warehouse?: any;
}

export default function WarehouseForm({ 
  warehouse
}: WarehouseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: warehouse?.name || '',
      code: warehouse?.code || '',
      type: warehouse?.type || 'storage',
      status: warehouse?.status || 'active',
      location: {
        address: warehouse?.location?.address || '',
        city: warehouse?.location?.city || '',
        state: warehouse?.location?.state || '',
        country: warehouse?.location?.country || '',
        postalCode: warehouse?.location?.postalCode || '',
        coordinates: {
          latitude: warehouse?.location?.coordinates?.latitude,
          longitude: warehouse?.location?.coordinates?.longitude,
        },
      },
      capacity: {
        totalSpace: warehouse?.capacity?.totalSpace || 0,
        unit: warehouse?.capacity?.unit || 'sqft',
      },
      manager: {
        name: warehouse?.manager?.name || '',
        email: warehouse?.manager?.email || '',
        phone: warehouse?.manager?.phone || '',
      },
      operations: {
        workingHours: warehouse?.operations?.workingHours || '',
        zones: warehouse?.operations?.zones || 1,
        loadingDocks: warehouse?.operations?.loadingDocks || 1,
      },
      settings: {
        isDefault: warehouse?.settings?.isDefault || false,
        allowNegativeStock: warehouse?.settings?.allowNegativeStock || false,
        autoReplenishment: warehouse?.settings?.autoReplenishment || false,
      },
    },
  });

  const onSubmit = async (data: WarehouseFormData) => {
    setIsSubmitting(true);
    
    try {
      const method = warehouse ? 'PATCH' : 'POST';
      const url = warehouse 
        ? `/api/warehouses/${warehouse._id}`
        : '/api/warehouses';
        
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save warehouse');
      }
      
      toast.success(warehouse ? 'Warehouse updated!' : 'Warehouse created!');
      router.push('/dashboard/warehouses');
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
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                Warehouse Name
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
                Warehouse Code
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('code')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900">
                Type
              </label>
              <div className="mt-2">
                <select
                  {...register('type')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                >
                  <option value="storage">Storage</option>
                  <option value="distribution">Distribution</option>
                  <option value="fulfillment">Fulfillment</option>
                  <option value="cross-dock">Cross-dock</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="status" className="block text-sm font-medium leading-6 text-gray-900">
                Status
              </label>
              <div className="mt-2">
                <select
                  {...register('status')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Location
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="col-span-full">
              <label htmlFor="location.address" className="block text-sm font-medium leading-6 text-gray-900">
                Street Address
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('location.address')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.location?.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="location.city" className="block text-sm font-medium leading-6 text-gray-900">
                City
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('location.city')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.location?.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="location.state" className="block text-sm font-medium leading-6 text-gray-900">
                State/Province
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('location.state')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.location?.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.state.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="location.country" className="block text-sm font-medium leading-6 text-gray-900">
                Country
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('location.country')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.location?.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.country.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-1">
              <label htmlFor="location.postalCode" className="block text-sm font-medium leading-6 text-gray-900">
                Postal Code
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('location.postalCode')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.location?.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.postalCode.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity & Operations */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Capacity & Operations
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="capacity.totalSpace" className="block text-sm font-medium leading-6 text-gray-900">
                Total Space (sq ft)
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  step="1"
                  {...register('capacity.totalSpace', { valueAsNumber: true })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.capacity?.totalSpace && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity.totalSpace.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="operations.workingHours" className="block text-sm font-medium leading-6 text-gray-900">
                Working Hours
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('operations.workingHours')}
                  placeholder="e.g., Mon-Fri 8AM-6PM"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="operations.zones" className="block text-sm font-medium leading-6 text-gray-900">
                Storage Zones
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  step="1"
                  {...register('operations.zones', { valueAsNumber: true })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="operations.loadingDocks" className="block text-sm font-medium leading-6 text-gray-900">
                Loading Docks
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  step="1"
                  {...register('operations.loadingDocks', { valueAsNumber: true })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manager Information */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Manager Information
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="manager.name" className="block text-sm font-medium leading-6 text-gray-900">
                Manager Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('manager.name')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="manager.email" className="block text-sm font-medium leading-6 text-gray-900">
                Email
              </label>
              <div className="mt-2">
                <input
                  type="email"
                  {...register('manager.email')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.manager?.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.manager.email.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="manager.phone" className="block text-sm font-medium leading-6 text-gray-900">
                Phone
              </label>
              <div className="mt-2">
                <input
                  type="tel"
                  {...register('manager.phone')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Settings
          </h2>
          <div className="mt-6 space-y-4">
            <div className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input
                  type="checkbox"
                  {...register('settings.isDefault')}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label htmlFor="settings.isDefault" className="font-medium text-gray-900">
                  Default Warehouse
                </label>
                <p className="text-gray-500">Make this the default warehouse for new orders</p>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input
                  type="checkbox"
                  {...register('settings.allowNegativeStock')}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label htmlFor="settings.allowNegativeStock" className="font-medium text-gray-900">
                  Allow Negative Stock
                </label>
                <p className="text-gray-500">Allow inventory levels to go below zero</p>
              </div>
            </div>

            <div className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input
                  type="checkbox"
                  {...register('settings.autoReplenishment')}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label htmlFor="settings.autoReplenishment" className="font-medium text-gray-900">
                  Auto Replenishment
                </label>
                <p className="text-gray-500">Automatically create purchase orders when stock is low</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-x-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/warehouses')}
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
          {isSubmitting ? 'Saving...' : warehouse ? 'Update Warehouse' : 'Create Warehouse'}
        </button>
      </div>
    </form>
  );
}
