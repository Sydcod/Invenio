'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/libs/utils';

interface DatePickerWithRangeProps {
  value?: {
    startDate?: string;
    endDate?: string;
  };
  onChange: (value: { startDate: string; endDate: string }) => void;
  className?: string;
}

// Simple date formatting helpers
const formatDate = (date: Date, format: string): string => {
  if (format === 'yyyy-MM-dd') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } else if (format === 'MMM dd, yyyy') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }
  return date.toISOString();
};

export function DatePickerWithRange({
  value,
  onChange,
  className,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState<string>(() => {
    if (value?.startDate) {
      return formatDate(new Date(value.startDate), 'yyyy-MM-dd');
    }
    // Default to 30 days ago
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDate(date, 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = React.useState<string>(() => {
    if (value?.endDate) {
      return formatDate(new Date(value.endDate), 'yyyy-MM-dd');
    }
    // Default to today
    return formatDate(new Date(), 'yyyy-MM-dd');
  });
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (startDate && endDate) {
      onChange({
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
    }
  }, [startDate, endDate, onChange]);

  const handlePresetClick = (days: number) => {
    const to = new Date();
    const from = new Date();
    if (days === 90) {
      from.setMonth(from.getMonth() - 3);
    } else {
      from.setDate(from.getDate() - days);
    }
    setStartDate(formatDate(from, 'yyyy-MM-dd'));
    setEndDate(formatDate(to, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const formatDisplayDate = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${formatDate(start, 'MMM dd, yyyy')} - ${formatDate(end, 'MMM dd, yyyy')}`;
    }
    return 'Pick a date range';
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
          !startDate && !endDate && 'text-gray-500'
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
        <span className="flex-1 text-left">{formatDisplayDate()}</span>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetClick(7)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none"
                >
                  Last 7 days
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick(30)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none"
                >
                  Last 30 days
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetClick(90)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none"
                >
                  Last 3 months
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
