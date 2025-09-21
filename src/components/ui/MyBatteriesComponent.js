// src/MyBatteriesComponent.js
import React, { useState, useMemo } from 'react';
import { Battery, Search, Filter, Plus, Building, ChevronDown, ChevronUp, Tag, FileDown, Trash2, Edit, Eye, MoreVertical, AlertTriangle, User } from 'lucide-react'; // Added User icon

// A sub-component for a visual, color-coded health bar
const HealthBar = ({ soh, theme }) => {
    let barColorClass = '';
    if (soh >= 80) {
        barColorClass = 'bg-green-500';
    } else if (soh >= 60) {
        barColorClass = 'bg-yellow-500';
    } else {
        barColorClass = 'bg-red-500';
    }
    const textClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-900';

    return (
        <div className="flex items-center gap-2">
            <div className={`w-14 h-2 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200'}`}>
                <div className={`${barColorClass} h-2 rounded-full`} style={{ width: `${soh}%` }}></div>
            </div>
            <span className={`text-sm font-medium ${textClass}`}>{soh}%</span>
        </div>
    );
};

export default function MyBatteriesComponent({
    batteries,
    currentUser,
    onSelectBattery,
    onAddNew,
    onDeleteBattery,
    calculateMetrics,
    theme,
    onEditBattery,
    onToggleListing,
    onExportBattery,
    onBulkDelete,
    onBulkToggleListing,
    onBulkExport
}) {
    const [activeTab, setActiveTab] = useState('individual');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ soh: [0, 100], cycles: [0, 10000], status: [], chemistry: [] });
    const [sortConfig, setSortConfig] = useState({ key: 'manufacturer', direction: 'ascending' });
    const [selectedBatteries, setSelectedBatteries] = useState(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [openActionMenu, setOpenActionMenu] = useState(null);

    const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-900';
    const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
    const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-300';
    const hoverBgClass = theme === 'dark' ? 'hover:bg-slate-700/60' : 'hover:bg-gray-50';
    const headerBgClass = theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50';
    const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-900';
    const primaryButtonClass = `px-4 py-2 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg flex items-center justify-center transition-colors`;
    const secondaryButtonClass = `px-4 py-2 border ${borderClass} ${textSecondaryClass} rounded-lg flex items-center justify-center ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition-colors`;
    const dropdownItemClass = `flex items-center w-full px-3 py-2 text-sm text-left ${theme === 'dark' ? 'text-slate-200 hover:bg-slate-600' : 'text-gray-700 hover:bg-gray-100'}`;


    const filteredBatteries = useMemo(() => {
        let sourceBatteries = [];
        if (currentUser?.companyId) {
            if (activeTab === 'individual') {
                // --- THIS IS THE FIX ---
                // Shows all batteries registered by the current user, regardless of company association.
                sourceBatteries = batteries.filter(b => b.userId === currentUser.id);
            } else { // 'company' tab
                // Shows all batteries associated with the user's company.
                sourceBatteries = batteries.filter(b => b.companyId === currentUser.companyId);
            }
        } else {
            // If the user has no company, all their batteries are considered individual.
            sourceBatteries = batteries;
        }

        return sourceBatteries.filter(battery => {
            const metrics = calculateMetrics(battery);
            const lowerSearchTerm = searchTerm.toLowerCase();

            const matchesSearch = searchTerm.trim() === '' ||
                (battery.manufacturer?.toLowerCase() || '').includes(lowerSearchTerm) ||
                (battery.model?.toLowerCase() || '').includes(lowerSearchTerm) ||
                (battery.batteryId?.toLowerCase() || '').includes(lowerSearchTerm);

            const matchesSoh = metrics.stateOfHealth >= filters.soh[0] && metrics.stateOfHealth <= filters.soh[1];
            const matchesCycles = battery.cycleCount >= filters.cycles[0] && battery.cycleCount <= filters.cycles[1];
            const matchesStatus = filters.status.length === 0 || filters.status.includes(battery.status);
            const matchesChemistry = filters.chemistry.length === 0 || filters.chemistry.includes(battery.chemistry);

            return matchesSearch && matchesSoh && matchesCycles && matchesStatus && matchesChemistry;
        });
    }, [batteries, currentUser, activeTab, searchTerm, filters, calculateMetrics]);

    const sortedBatteries = useMemo(() => {
        let sortableItems = [...filteredBatteries];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;
                if (sortConfig.key === 'soh') {
                    aValue = calculateMetrics(a).stateOfHealth;
                    bValue = calculateMetrics(b).stateOfHealth;
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredBatteries, sortConfig, calculateMetrics]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const toggleFilter = (filterType, value) => {
        setFilters(prev => {
            const currentValues = prev[filterType];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [filterType]: newValues };
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedBatteries(new Set(sortedBatteries.map(b => b.batteryId)));
        } else {
            setSelectedBatteries(new Set());
        }
    };

    const handleSelectOne = (batteryId) => {
        const newSelection = new Set(selectedBatteries);
        if (newSelection.has(batteryId)) {
            newSelection.delete(batteryId);
        } else {
            newSelection.add(batteryId);
        }
        setSelectedBatteries(newSelection);
    };
    
    const summaryStats = useMemo(() => {
        const count = sortedBatteries.length;
        if (count === 0) return { count, avgSoh: 0, highRisk: 0 };
        const totalSoh = sortedBatteries.reduce((sum, b) => sum + calculateMetrics(b).stateOfHealth, 0);
        const highRisk = sortedBatteries.filter(b => calculateMetrics(b).failureRiskScore > 70).length;
        return {
            count,
            avgSoh: Math.round(totalSoh / count),
            highRisk
        };
    }, [sortedBatteries, calculateMetrics]);


    const tableHeaders = [
        { key: 'manufacturer', label: 'Battery / Owner' },
        { key: 'soh', label: 'Health (SoH)' },
        { key: 'cycleCount', label: 'Cycles' },
        { key: 'status', label: 'Status' },
        { key: 'isListedForMarketplace', label: 'Listed' }
    ];

    return (
        <div className={`${cardBgClass} rounded-lg shadow-lg p-4 sm:p-6`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                    <h2 className={`text-2xl font-bold ${textPrimaryClass}`}>My Batteries</h2>
                    <p className={textSecondaryClass}>Manage, filter, and perform actions on your battery inventory.</p>
                </div>
                <button onClick={onAddNew} className={`${primaryButtonClass} mt-3 sm:mt-0`}>
                    <Plus size={18} className="mr-2" /> Register New Battery
                </button>
            </div>
            
            {/* --- FIX: Updated tab labels --- */}
            {currentUser?.companyId && (
                <div className={`flex border-b ${borderClass} mb-4`}>
                    <button onClick={() => setActiveTab('individual')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'individual' ? `${theme==='dark' ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600'} border-b-2` : `${textSecondaryClass} border-transparent hover:border-gray-400`}`}>
                        <div className="flex items-center">
                            <User size={16} className="mr-2" />My Registrations
                        </div>
                    </button>
                    <button onClick={() => setActiveTab('company')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'company' ? `${theme==='dark' ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600'} border-b-2` : `${textSecondaryClass} border-transparent hover:border-gray-400`}`}>
                        <div className="flex items-center">
                           <Building size={16} className="mr-2" />Company Batteries
                        </div>
                    </button>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className={`p-4 rounded-lg border ${borderClass} ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <h4 className="text-sm font-medium text-secondaryClass">Total Batteries</h4>
                    <p className={`text-2xl font-bold ${textPrimaryClass}`}>{summaryStats.count}</p>
                </div>
                <div className={`p-4 rounded-lg border ${borderClass} ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <h4 className="text-sm font-medium text-secondaryClass">Average SoH</h4>
                    <p className={`text-2xl font-bold ${textPrimaryClass}`}>{summaryStats.avgSoh}%</p>
                </div>
                <div className={`p-4 rounded-lg border ${borderClass} ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <h4 className="text-sm font-medium text-secondaryClass">High Risk Alerts</h4>
                    <p className={`text-2xl font-bold ${textPrimaryClass}`}>{summaryStats.highRisk}</p>
                </div>
            </div>

            <div className={`p-4 rounded-lg border ${borderClass} mb-4 ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
                <div className="flex justify-between items-center">
                     <div className="relative flex-grow">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondaryClass}`} />
                        <input
                            type="text"
                            placeholder="Search by Manufacturer, Model, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full max-w-sm pl-9 p-2 border ${borderClass} rounded-md ${inputBgClass}`}
                        />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className={secondaryButtonClass}>
                        <Filter size={16} className="mr-2" />
                        <span>Filters</span>
                        {showFilters ? <ChevronUp size={16} className="ml-2"/> : <ChevronDown size={16} className="ml-2"/>}
                    </button>
                </div>
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-dashed border-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>SoH: {filters.soh[0]}% - {filters.soh[1]}%</label>
                            <input type="range" multiple min="0" max="100" value={filters.soh} onChange={(e) => setFilters(f => ({...f, soh: e.target.value.split(',').map(Number)}))} className="w-full" />
                        </div>
                         <div>
                            <label className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Cycles: {filters.cycles[0]} - {filters.cycles[1]}</label>
                            <input type="range" multiple min="0" max="10000" step="100" value={filters.cycles} onChange={(e) => setFilters(f => ({...f, cycles: e.target.value.split(',').map(Number)}))} className="w-full" />
                        </div>
                        <div>
                             <label className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Status</label>
                             <div className="flex flex-wrap gap-2">
                                {["Operational", "In Storage", "Maintenance", "EOL - Pending Recycle"].map(status => (
                                    <button key={status} onClick={() => toggleFilter('status', status)} className={`px-2 py-1 text-xs rounded ${filters.status.includes(status) ? (theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white') : (theme === 'dark' ? 'bg-slate-600 text-slate-200' : 'bg-gray-200 text-gray-800')}`}>{status}</button>
                                ))}
                             </div>
                        </div>
                        <div>
                             <label className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Chemistry</label>
                             <div className="flex flex-wrap gap-2">
                                {["LiFePO4", "NMC", "LTO"].map(chem => (
                                    <button key={chem} onClick={() => toggleFilter('chemistry', chem)} className={`px-2 py-1 text-xs rounded ${filters.chemistry.includes(chem) ? (theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white') : (theme === 'dark' ? 'bg-slate-600 text-slate-200' : 'bg-gray-200 text-gray-800')}`}>{chem}</button>
                                ))}
                             </div>
                        </div>
                    </div>
                )}
            </div>
            
            {selectedBatteries.size > 0 && (
                 <div className={`flex items-center gap-4 p-3 mb-4 rounded-lg border ${borderClass} ${theme === 'dark' ? 'bg-slate-700' : 'bg-blue-50'}`}>
                    <p className={`text-sm font-medium ${textPrimaryClass}`}>{selectedBatteries.size} selected</p>
                    <button onClick={() => onBulkDelete(Array.from(selectedBatteries))} className={`${secondaryButtonClass} text-red-500 border-red-500/50 hover:bg-red-500/10`}><Trash2 size={16} className="mr-2"/> Delete</button>
                    <button onClick={() => onBulkToggleListing(Array.from(selectedBatteries), true)} className={`${secondaryButtonClass} text-green-500 border-green-500/50 hover:bg-green-500/10`}><Tag size={16} className="mr-2"/> List</button>
                    <button onClick={() => onBulkToggleListing(Array.from(selectedBatteries), false)} className={`${secondaryButtonClass} text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10`}><Tag size={16} className="mr-2"/> Unlist</button>
                    <button onClick={() => onBulkExport(Array.from(selectedBatteries))} className={secondaryButtonClass}><FileDown size={16} className="mr-2"/> Export PDFs</button>
                 </div>
            )}


            {sortedBatteries.length === 0 ? (
                <div className="text-center py-16">
                    <AlertTriangle size={48} className={`mx-auto mb-4 ${textSecondaryClass}`} />
                    <h3 className={`text-xl font-semibold ${textPrimaryClass}`}>No Batteries Found</h3>
                    <p className={textSecondaryClass}>Try adjusting your search or filter criteria, or register a new battery.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className={headerBgClass}>
                            <tr>
                                <th className="p-4 text-left"><input type="checkbox" onChange={handleSelectAll} checked={selectedBatteries.size > 0 && selectedBatteries.size === sortedBatteries.length} className="rounded" /></th>
                                {tableHeaders.map(header => (
                                    <th key={header.key} onClick={() => handleSort(header.key)} className={`p-4 text-left text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider cursor-pointer`}>
                                        <div className="flex items-center gap-2">{header.label} {sortConfig.key === header.key && (sortConfig.direction === 'ascending' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                                    </th>
                                ))}
                                <th className={`p-4 text-right text-xs font-semibold ${textSecondaryClass} uppercase tracking-wider`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`${theme === 'dark' ? 'divide-y divide-slate-700' : 'divide-y divide-gray-200'}`}>
                            {sortedBatteries.map(battery => {
                                const metrics = calculateMetrics(battery);
                                const isSelected = selectedBatteries.has(battery.batteryId);
                                const canModify = (battery.companyId && currentUser?.companyId === battery.companyId && currentUser?.roleInCompany === 'admin') || (!battery.companyId && currentUser?.id === battery.userId);
                                
                                return (
                                <tr key={battery.batteryId} className={`${hoverBgClass} ${isSelected ? (theme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-50') : ''}`}>
                                    <td className="p-4"><input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(battery.batteryId)} className="rounded"/></td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <Battery className={`h-8 w-8 flex-shrink-0 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                                            <div className="ml-3">
                                                <div className={`text-sm font-medium ${textPrimaryClass}`}>{battery.manufacturer} {battery.model}</div>
                                                {battery.company ? (
                                                    <div className={`text-xs ${textSecondaryClass} flex items-center`}>
                                                        <Building className="mr-1 h-3 w-3" /> {battery.company.companyName}
                                                    </div>
                                                ) : (
                                                    <div className={`text-xs ${textSecondaryClass}`}>Owner: {battery.registeringUser?.username || 'You'}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <HealthBar soh={metrics.stateOfHealth} theme={theme} />
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-sm text-primaryClass">{battery.cycleCount}</td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${theme === 'dark' ? 'bg-slate-600 text-slate-100' : 'bg-gray-200 text-gray-700'}`}>{battery.status}</span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-center">
                                        {battery.isListedForMarketplace && <Tag className={`h-5 w-5 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'}`} />}
                                    </td>
                                    <td className="p-4 whitespace-nowrap text-right text-sm font-medium relative">
                                        <button onClick={() => setOpenActionMenu(openActionMenu === battery.batteryId ? null : battery.batteryId)} className="p-2 rounded-full hover:bg-slate-700">
                                            <MoreVertical size={18} />
                                        </button>
                                        {openActionMenu === battery.batteryId && (
                                            <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${cardBgClass} border ${borderClass}`} onMouseLeave={() => setOpenActionMenu(null)}>
                                                <div className="py-1">
                                                    <button onClick={() => { onSelectBattery(battery); setOpenActionMenu(null); }} className={dropdownItemClass}><Eye size={14} className="mr-3" /> View Details</button>
                                                    {canModify && <button onClick={() => { onEditBattery(battery); setOpenActionMenu(null); }} className={dropdownItemClass}><Edit size={14} className="mr-3" /> Edit</button>}
                                                    <button onClick={() => { onExportBattery(battery); setOpenActionMenu(null); }} className={dropdownItemClass}><FileDown size={14} className="mr-3" /> Export PDF</button>
                                                    {canModify && <button onClick={() => { onToggleListing(battery); setOpenActionMenu(null); }} className={dropdownItemClass}><Tag size={14} className="mr-3" /> {battery.isListedForMarketplace ? 'Unlist' : 'List'} </button>}
                                                    {canModify && <button onClick={() => { onDeleteBattery(battery); setOpenActionMenu(null); }} className={`${dropdownItemClass} text-red-500`}><Trash2 size={14} className="mr-3" /> Delete</button>}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}