'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  HomeIcon, 
  CubeIcon, 
  TagIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  ChartBarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  UsersIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowDownIcon,
  ArrowUpIcon
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
  { 
    name: 'Analytics', 
    href: '/dashboard/analytics', 
    icon: ChartPieIcon,
    children: [
      { name: 'Overview', href: '/dashboard/analytics', icon: ChartBarIcon },
      { name: 'Sales Analytics', href: '/dashboard/analytics/sales', icon: CurrencyDollarIcon },
      { name: 'Inventory Analytics', href: '/dashboard/analytics/inventory', icon: CubeIcon },
      { name: 'Customer Analytics', href: '/dashboard/analytics/customer', icon: UserGroupIcon },
      { name: 'Procurement Analytics', href: '/dashboard/analytics/procurement', icon: TruckIcon },
    ]
  },
  { name: 'Team', href: '/dashboard/team', icon: UsersIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  return (
    <div className="flex h-full w-64 flex-col bg-[#1E293B] border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-700 px-4">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <CubeIcon className="h-8 w-8 text-white" />
          <span className="text-xl font-bold text-white">Invenio</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          // Check if this is a dropdown item with children
          if (item.children) {
            const isOpen = openDropdowns[item.name] || false;
            const isChildActive = item.children.some(child => 
              pathname === child.href || pathname.startsWith(child.href)
            );
            
            return (
              <div key={item.name} className="space-y-1">
                {/* Parent menu item with dropdown toggle */}
                <button
                  onClick={() => toggleDropdown(item.name)}
                  className={cn(
                    'w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    (isActive || isChildActive)
                      ? 'bg-white/20 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={cn(
                        'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                        (isActive || isChildActive)
                          ? 'text-white'
                          : 'text-gray-400 group-hover:text-gray-300'
                      )}
                    />
                    {item.name}
                  </div>
                  {isOpen ? (
                    <ArrowUpIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                
                {/* Dropdown children */}
                {isOpen && (
                  <div className="pl-10 space-y-1">
                    {item.children.map(child => {
                      const isChildItemActive = pathname === child.href || 
                        (child.href !== '/dashboard' && pathname.startsWith(child.href));
                      
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                            isChildItemActive
                              ? 'bg-white/20 text-white'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          )}
                        >
                          <child.icon
                            className={cn(
                              'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                              isChildItemActive
                                ? 'text-white'
                                : 'text-gray-400 group-hover:text-gray-300'
                            )}
                          />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          
          // Regular menu item (no children)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-gray-300'
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
