import { Metadata } from 'next';
import { requirePermission } from '@/libs/auth-utils';
import EnhancedProductsPage from './EnhancedProductsPage';

export const metadata: Metadata = {
  title: 'Products | Inventory Dashboard',
  description: 'Manage your product inventory',
};

export default async function ProductsPage() {
  // Check permissions
  await requirePermission('canManageInventory');

  return <EnhancedProductsPage />;
}
