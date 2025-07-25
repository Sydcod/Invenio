import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';

export const metadata: Metadata = {
  title: 'Purchase Orders | Windsurf Inventory',
  description: 'Manage supplier orders and track deliveries',
};

const EnhancedPurchaseOrdersPage = dynamic(
  () => import('./EnhancedPurchaseOrdersPage'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export default function PurchaseOrdersPage() {
  return <EnhancedPurchaseOrdersPage />;
}
