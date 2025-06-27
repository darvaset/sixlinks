'use client';

import React from 'react';

interface ConnectionLinkProps {
  title: string;
  subtitle: string;
  iconType?: 'team' | 'nation' | 'manager';
}

const TeamIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const NationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
);

const ManagerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const getIcon = (iconType?: 'team' | 'nation' | 'manager') => {
  const iconMap = { team: <TeamIcon />, nation: <NationIcon />, manager: <ManagerIcon /> };
  return iconMap[iconType || 'team'];
};

export function ConnectionLink({ title, subtitle, iconType }: ConnectionLinkProps) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg my-2">
      <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full p-2">{getIcon(iconType)}</div>
      <div>
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{subtitle}</p>
      </div>
    </div>
  );
}