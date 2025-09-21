import React, { useState, useMemo } from 'react';
import { Battery, Search, SlidersHorizontal, X, Filter, Tag, Store, TrendingUp, ChevronDown } from 'lucide-react';

// Mock data for demonstration
const mockBatteries = [
  { id: 'b1', manufacturer: 'Demo Power', model: 'Alpha', chemistry: 'LiFePO4', soh: 92, price: 2500, cycles: 150, location: 'Austin, TX', listingType: 'For Sale', description: 'Excellent for solar backup.', age: 2 },
  { id: 'b2', manufacturer: 'SunVolt', model: 'ProX', chemistry: 'NMC', soh: 88, price: 2100, cycles: 200, location: 'Berlin, Germany', listingType: 'For Sale', description: 'High performance, low cycles.', age: 1 },
  { id: 'b3', manufacturer: 'EcoCell', model: 'GreenMax', chemistry: 'LCO', soh: 95, price: 1800, cycles: 120, location: 'London, UK', listingType: 'For Sale', description: 'Eco-friendly, great for grid storage.', age: 3 },
];

const chemistryTypes = ['Any', 'LiFePO4', 'NMC', 'LTO', 'LCO', 'NCA'];
const sortOptions = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'SoH: High to Low', value: 'soh_desc' },
];

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ chemistry: 'Any', minPrice: '', maxPrice: '', location: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  // Filter and sort logic (mocked)
  const filteredBatteries = useMemo(() => {
    let results = mockBatteries.filter(b =>
      (!searchTerm || b.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) || b.model.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filters.chemistry === 'Any' || b.chemistry === filters.chemistry) &&
      (!filters.minPrice || b.price >= parseFloat(filters.minPrice)) &&
      (!filters.maxPrice || b.price <= parseFloat(filters.maxPrice)) &&
      (!filters.location || b.location.toLowerCase().includes(filters.location.toLowerCase()))
    );
    if (sortBy === 'price_asc') results.sort((a, b) => a.price - b.price);
    if (sortBy === 'price_desc') results.sort((a, b) => b.price - a.price);
    if (sortBy === 'soh_desc') results.sort((a, b) => b.soh - a.soh);
    if (sortBy === 'newest') results.sort((a, b) => a.age - b.age);
    return results;
  }, [searchTerm, filters, sortBy]);

  // Filter chips
  const activeChips = Object.entries(filters).filter(([k, v]) => v && v !== 'Any').map(([k, v]) => ({ key: k, value: v }));

  // Analytics
  const avgPrice = filteredBatteries.length ? Math.round(filteredBatteries.reduce((sum, b) => sum + b.price, 0) / filteredBatteries.length) : 0;
  const avgSoH = filteredBatteries.length ? Math.round(filteredBatteries.reduce((sum, b) => sum + b.soh, 0) / filteredBatteries.length) : 0;

  return (
    <div className="min-h-screen bg-background p-0">
      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-20 bg-background/95 border-b border-border px-4 py-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <Search size={20} className="text-blue-400" />
          <input
            type="text"
            placeholder="Search by manufacturer, model, or keyword..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none text-lg text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button onClick={() => setShowFilters(v => !v)} className="flex items-center gap-1 px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition">
          <SlidersHorizontal size={16} /> Filters
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-foreground">
            {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 bg-background border-b border-border">
          {activeChips.map(chip => (
            <span key={chip.key} className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-xs">
              {chip.key}: {chip.value}
              <button onClick={() => setFilters(f => ({ ...f, [chip.key]: '' }))} className="ml-1"><X size={12} /></button>
            </span>
          ))}
          <button onClick={() => setFilters({ chemistry: 'Any', minPrice: '', maxPrice: '', location: '' })} className="ml-2 text-xs text-blue-600 dark:text-blue-300 underline">Clear All</button>
        </div>
      )}

      {/* Advanced Filters Sidebar/Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-30 bg-black/40 flex justify-end">
          <div className="w-full max-w-xs bg-background border-l border-border p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
              <button onClick={() => setShowFilters(false)}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1 text-muted-foreground">Chemistry</label>
                <select value={filters.chemistry} onChange={e => setFilters(f => ({ ...f, chemistry: e.target.value }))} className="w-full bg-background border border-border rounded px-2 py-1 text-foreground">
                  {chemistryTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-muted-foreground">Min Price ($)</label>
                <input type="number" value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} className="w-full bg-background border border-border rounded px-2 py-1 text-foreground" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-muted-foreground">Max Price ($)</label>
                <input type="number" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} className="w-full bg-background border border-border rounded px-2 py-1 text-foreground" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-muted-foreground">Location</label>
                <input type="text" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} className="w-full bg-background border border-border rounded px-2 py-1 text-foreground" />
              </div>
            </div>
            <button onClick={() => setShowFilters(false)} className="w-full mt-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Apply Filters</button>
          </div>
        </div>
      )}

      {/* Search Analytics */}
      <div className="px-4 py-3 flex flex-wrap gap-6 items-center border-b border-border bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Tag size={16} /> {filteredBatteries.length} results
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Store size={16} /> Avg. Price: <span className="font-semibold text-foreground">${avgPrice}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp size={16} /> Avg. SoH: <span className="font-semibold text-foreground">{avgSoH}%</span>
        </div>
      </div>

      {/* Results Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatteries.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-12">
            <Battery size={48} className="mx-auto mb-4 text-blue-400" />
            <div className="text-lg font-semibold">No batteries found.</div>
            <div className="text-sm">Try adjusting your search or filters.</div>
          </div>
        ) : filteredBatteries.map(b => (
          <div key={b.id} className="bg-card border border-border rounded-lg shadow p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
              <Battery size={20} className="text-blue-400" />
              <span className="font-semibold text-lg text-foreground">{b.manufacturer} {b.model}</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{b.chemistry}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>SoH: <span className="text-foreground font-medium">{b.soh}%</span></span>
              <span>Cycles: <span className="text-foreground font-medium">{b.cycles}</span></span>
              <span>Age: <span className="text-foreground font-medium">{b.age} yrs</span></span>
              <span>Location: <span className="text-foreground font-medium">{b.location}</span></span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-bold text-blue-500">${b.price}</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{b.listingType}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">{b.description}</div>
            <button className="mt-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
} 