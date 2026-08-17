'use client'

import React, { useState, useEffect } from 'react'
import ERPAdminContent from '@/components/erp/ERPConfigForm'

export default function ERPAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
              ER
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Administration ERP</h1>
              <p className="text-sm text-gray-500">Gestion des intégrations ERP - SAP, Odoo, Dynamics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <ERPAdminContent />
      </div>
    </div>
  )
}
