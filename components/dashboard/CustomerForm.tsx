'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const customerSchema = z.object({
  // Basic Info
  type: z.enum(['B2B', 'B2C']),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  
  // Company Info (for B2B)
  company: z.string().optional(),
  taxId: z.string().optional(),
  industry: z.string().optional(),
  
  // Address
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().default('USA'),
  }),
  
  // Financial
  creditLimit: z.number().min(0, 'Credit limit must be positive').optional(),
  paymentTerms: z.string().optional(),
  
  // Status
  status: z.enum(['active', 'inactive', 'pending', 'blocked']).default('active'),
  
  // Preferences
  preferences: z.object({
    contactMethod: z.enum(['email', 'phone', 'sms']).default('email'),
    newsletter: z.boolean().default(false),
    marketing: z.boolean().default(false),
  }).optional(),
  
  // Other
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Partial<CustomerFormData> & { _id?: string };
  isEditing?: boolean;
}

export default function CustomerForm({ customer, isEditing = false }: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      type: 'B2C',
      status: 'active',
      address: {
        country: 'USA',
      },
      preferences: {
        contactMethod: 'email',
        newsletter: false,
        marketing: false,
      },
    },
  });

  const customerType = watch('type');

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(
        isEditing ? `/api/customers/${customer?._id}` : '/api/customers',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save customer');
      }

      toast.success(isEditing ? 'Customer updated successfully' : 'Customer created successfully');
      router.push('/dashboard/customers');
      router.refresh();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Customer Type */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900">
                Customer Type
              </label>
              <div className="mt-2">
                <select
                  {...register('type')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                >
                  <option value="B2C">Individual (B2C)</option>
                  <option value="B2B">Business (B2B)</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
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
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Basic Information</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Personal or company contact information
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                {customerType === 'B2B' ? 'Contact Name' : 'Full Name'}
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('name')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email
              </label>
              <div className="mt-2">
                <input
                  type="email"
                  {...register('email')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                Phone
              </label>
              <div className="mt-2">
                <input
                  type="tel"
                  {...register('phone')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>
            </div>

            {customerType === 'B2B' && (
              <>
                <div className="sm:col-span-3">
                  <label htmlFor="company" className="block text-sm font-medium leading-6 text-gray-900">
                    Company Name
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      {...register('company')}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="taxId" className="block text-sm font-medium leading-6 text-gray-900">
                    Tax ID
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      {...register('taxId')}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="industry" className="block text-sm font-medium leading-6 text-gray-900">
                    Industry
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      {...register('industry')}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Address</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Billing and shipping address
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="street" className="block text-sm font-medium leading-6 text-gray-900">
                Street Address
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('address.street')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.address?.street && <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="city" className="block text-sm font-medium leading-6 text-gray-900">
                City
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('address.city')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.address?.city && <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="state" className="block text-sm font-medium leading-6 text-gray-900">
                State
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('address.state')}
                  placeholder="FL"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.address?.state && <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="zipCode" className="block text-sm font-medium leading-6 text-gray-900">
                ZIP Code
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  {...register('address.zipCode')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
                {errors.address?.zipCode && <p className="mt-1 text-sm text-red-600">{errors.address.zipCode.message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Information (B2B only) */}
      {customerType === 'B2B' && (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
          <div className="px-4 py-6 sm:p-8">
            <h2 className="text-base font-semibold leading-7 text-gray-900">Financial Information</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Credit limits and payment terms
            </p>

            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="creditLimit" className="block text-sm font-medium leading-6 text-gray-900">
                  Credit Limit
                </label>
                <div className="mt-2">
                  <input
                    type="number"
                    {...register('creditLimit', { valueAsNumber: true })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  />
                  {errors.creditLimit && <p className="mt-1 text-sm text-red-600">{errors.creditLimit.message}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="paymentTerms" className="block text-sm font-medium leading-6 text-gray-900">
                  Payment Terms
                </label>
                <div className="mt-2">
                  <select
                    {...register('paymentTerms')}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                  >
                    <option value="">Select payment terms</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="2/10 Net 30">2/10 Net 30</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          <h2 className="text-base font-semibold leading-7 text-gray-900">Additional Information</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Notes and preferences
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="notes" className="block text-sm font-medium leading-6 text-gray-900">
                Notes
              </label>
              <div className="mt-2">
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <fieldset>
                <legend className="text-sm font-semibold leading-6 text-gray-900">Communication Preferences</legend>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center">
                    <input
                      {...register('preferences.newsletter')}
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="newsletter" className="ml-3 block text-sm font-medium leading-6 text-gray-900">
                      Subscribe to newsletter
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      {...register('preferences.marketing')}
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="marketing" className="ml-3 block text-sm font-medium leading-6 text-gray-900">
                      Receive marketing communications
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-x-6">
        <button
          type="button"
          className="text-sm font-semibold leading-6 text-gray-900"
          onClick={() => router.back()}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer'}
        </button>
      </div>
    </form>
  );
}
