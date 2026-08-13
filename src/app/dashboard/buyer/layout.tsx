'use client';

import React from 'react';
import { BuyerSidebar } from '@/components/buyer/BuyerSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <BuyerSidebar />
      
      {/* Main Content */}
      <div className="lg:pl-64 transition-all duration-300">
        {/* Header */}
        <DashboardHeader />
        
        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 pt-[72px] lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
