'use client';

/**
 * AlgeriaTrade - Interactive Company Map Component
 * 
 * Displays all B2B companies on an interactive map of Algeria
 * Features:
 * - Leaflet/OpenStreetMap integration
 * - Cluster markers for performance
 * - Filter by wilaya, verification status, export capability
 * - Company popup with details
 * - Responsive design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Types
interface Company {
  id: string;
  name: string;
  slug: string;
  wilaya: string;
  commune?: string;
  latitude: number;
  longitude: number;
  employeeCount?: number;
  verificationStatus: string;
  exportCapability: boolean;
  rating: number;
  website?: string;
  description?: string;
}

interface MapFilters {
  wilaya: string;
  verificationStatus: string;
  exportCapable: string;
  searchQuery: string;
}

// Custom marker icons based on company type
const getMarkerIcon = (company: Company): L.DivIcon => {
  let color = '#3b82f6'; // Blue default
  
  if (company.verificationStatus === 'VERIFIED') color = '#10b981'; // Green
  if (company.exportCapability) color = '#f59e0b'; // Amber
  if (company.employeeCount && company.employeeCount > 1000) color = '#ef4444'; // Red for large
  
  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

// Map center component for dynamic updates
const MapCenterController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

// Main component
const AlgeriaCompanyMap: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [mapCenter] = useState<[number, number]>([28.0, 1.65]); // Center of Algeria
  const [mapZoom] = useState(6);
  
  // Filters state
  const [filters, setFilters] = useState<MapFilters>({
    wilaya: 'all',
    verificationStatus: 'all',
    exportCapable: 'all',
    searchQuery: ''
  });

  // Fetch companies with GPS coordinates
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/companies/map');
        
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        
        const data = await response.json();
        setCompanies(data.companies || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Unable to load map data');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Get unique wilayas for filter dropdown
  const uniqueWilayas = useMemo(() => {
    const wilayas = [...new Set(companies.map(c => c.wilaya))].sort();
    return wilayas;
  }, [companies]);

  // Filter companies based on current filters
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Wilaya filter
      if (filters.wilaya !== 'all' && company.wilaya !== filters.wilaya) {
        return false;
      }
      
      // Verification status filter
      if (filters.verificationStatus !== 'all' && 
          company.verificationStatus !== filters.verificationStatus) {
        return false;
      }
      
      // Export capability filter
      if (filters.exportCapable === 'yes' && !company.exportCapability) {
        return false;
      }
      if (filters.exportCapable === 'no' && company.exportCapability) {
        return false;
      }
      
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          company.name.toLowerCase().includes(query) ||
          company.wilaya.toLowerCase().includes(query) ||
          (company.commune?.toLowerCase().includes(query)) ||
          (company.description?.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [companies, filters]);

  // Statistics
  const stats = useMemo(() => ({
    total: filteredCompanies.length,
    verified: filteredCompanies.filter(c => c.verificationStatus === 'VERIFIED').length,
    exportReady: filteredCompanies.filter(c => c.exportCapability).length,
    largeEmployers: filteredCompanies.filter(c => c.employeeCount && c.employeeCount > 500).length,
  }), [filteredCompanies]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Algeria B2B Map...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching {companies.length}+ enterprise locations</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">⚠️ Error Loading Map</p>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 to-green-800 text-white p-4 shadow-lg z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🗺️ AlgeriaTrade Enterprise Map</h1>
              <p className="text-green-100 text-sm">Interactive B2B Directory - {stats.total} Companies</p>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex space-x-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-xl">{stats.total}</div>
                <div className="text-green-200">Total</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-xl text-emerald-300">{stats.verified}</div>
                <div className="text-green-200">Verified</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-xl text-amber-300">{stats.exportReady}</div>
                <div className="text-green-200">Export Ready</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-xl text-red-300">{stats.largeEmployers}</div>
                <div className="text-green-200">Major</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Filters Sidebar */}
        <aside className="w-80 bg-white shadow-lg overflow-y-auto z-20 hidden lg:block">
          <div className="p-4">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🔍</span> Filters & Search
            </h2>

            {/* Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Companies
              </label>
              <input
                type="text"
                placeholder="Name, wilaya, or keyword..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Wilaya Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wilaya (Province)
              </label>
              <select
                value={filters.wilaya}
                onChange={(e) => setFilters(prev => ({ ...prev, wilaya: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Wilayas ({uniqueWilayas.length})</option>
                {uniqueWilayas.map(wilaya => (
                  <option key={wilaya} value={wilaya}>
                    Wilaya {wilaya}
                  </option>
                ))}
              </select>
            </div>

            {/* Verification Status Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Status
              </label>
              <select
                value={filters.verificationStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, verificationStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Statuses</option>
                <option value="VERIFIED">✅ Verified</option>
                <option value="PENDING">⏳ Pending</option>
                <option value="UNDER_REVIEW">🔍 Under Review</option>
              </select>
            </div>

            {/* Export Capability Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Export Capability
              </label>
              <select
                value={filters.exportCapable}
                onChange={(e) => setFilters(prev => ({ ...prev, exportCapable: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Companies</option>
                <option value="yes">🚀 Export Ready</option>
                <option value="no">📦 Domestic Only</option>
              </select>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  <span>Standard Company</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  <span>Verified Business</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                  <span>Export Capable</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  <span>Major Employer (500+)</span>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => setFilters({
                wilaya: 'all',
                verificationStatus: 'all',
                exportCapable: 'all',
                searchQuery: ''
              })}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Map Container */}
        <main className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapCenterController center={mapCenter} zoom={mapZoom} />

            {/* Company Markers */}
            {filteredCompanies.map((company) => (
              <Marker
                key={company.id}
                position={[company.latitude, company.longitude]}
                icon={getMarkerIcon(company)}
                eventHandlers={{
                  click: () => setSelectedCompany(company),
                }}
              >
                <Popup maxWidth={300}>
                  <div className="p-2">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {company.name}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Location:</strong> Wilaya {company.wilaya}{company.commune ? `, ${company.commune}` : ''}</p>
                      
                      {company.employeeCount && (
                        <p><strong>Employees:</strong> {company.employeeCount.toLocaleString()}</p>
                      )}
                      
                      <div className="flex gap-2 mt-2">
                        {company.verificationStatus === 'VERIFIED' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            ✅ Verified
                          </span>
                        )}
                        {company.exportCapability && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                            🚀 Export Ready
                          </span>
                        )}
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          ⭐ {company.rating.toFixed(1)}
                        </span>
                      </div>
                      
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-xs block mt-2"
                        >
                          Visit Website →
                        </a>
                      )}
                      
                      <a
                        href={`/companies/${company.slug}`}
                        className="inline-block mt-2 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        View Profile →
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Mobile Filter Toggle */}
          <button
            className="lg:hidden absolute top-4 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg"
            onClick={() => document.querySelector('aside')?.classList.toggle('hidden')}
          >
            🔍 Filters ({stats.total})
          </button>

          {/* Selected Company Detail Panel */}
          {selectedCompany && (
            <aside className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-[999] overflow-y-auto lg:block">
              <div className="p-6">
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="float-right text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
                
                <h2 className="text-xl font-bold text-gray-900 mb-4 pr-8">
                  {selectedCompany.name}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Location</span>
                    <p className="font-medium">
                      Wilaya {selectedCompany.wilaya}
                      {selectedCompany.commune ? `, ${selectedCompany.commune}` : ''}
                    </p>
                  </div>
                  
                  {selectedCompany.description && (
                    <div>
                      <span className="text-sm text-gray-500">Description</span>
                      <p className="text-sm text-gray-700 mt-1">{selectedCompany.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {selectedCompany.employeeCount && (
                      <div>
                        <span className="text-sm text-gray-500">Employees</span>
                        <p className="font-bold text-lg">{selectedCompany.employeeCount.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-500">Rating</span>
                      <p className="font-bold text-lg">⭐ {selectedCompany.rating.toFixed(1)}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.verificationStatus === 'VERIFIED' && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        ✅ Verified
                      </span>
                    )}
                    {selectedCompany.exportCapability && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                        🚀 Export Ready
                      </span>
                    )}
                  </div>
                  
                  {selectedCompany.website && (
                    <a
                      href={selectedCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Visit Website →
                    </a>
                  )}
                  
                  <a
                    href={`/companies/${selectedCompany.slug}`}
                    className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    View Full Profile →
                  </a>
                </div>
              </div>
            </aside>
          )}
        </main>
      </div>
    </div>
  );
};

export default AlgeriaCompanyMap;
