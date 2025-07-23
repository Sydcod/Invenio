'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CubeIcon, 
  TagIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/libs/utils';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  { name: 'Products', href: '/dashboard/products', icon: CubeIcon },
  { name: 'Categories', href: '/dashboard/categories', icon: TagIcon },
  { name: 'Suppliers', href: '/dashboard/suppliers', icon: TruckIcon },
  { name: 'Warehouses', href: '/dashboard/warehouses', icon: BuildingStorefrontIcon },
  { name: 'Purchase Orders', href: '/dashboard/purchase-orders', icon: DocumentTextIcon },
  { name: 'Sales Orders', href: '/dashboard/sales-orders', icon: DocumentCheckIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon },
  { name: 'Team', href: '/dashboard/team', icon: UsersIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <CubeIcon className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Invenio</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
