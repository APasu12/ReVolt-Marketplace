// Updated: src/MarketplaceComponent.js
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Battery, DollarSign, Eye, Tag, Store, SearchCheck, MessageSquare, Star, Users,
    SlidersHorizontal, MapPin, Zap, Activity, CheckSquare, X, Filter, Layers, AlertTriangle, Send,
    CalendarDays, TrendingUp, UserCheck, ShieldCheck, Save, Bell, BellOff,
    Search
} from 'lucide-react';
import SaveSearchModal from './SaveSearchModal';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const chemistryTypes = ["Any", "LiFePO4", "NMC", "LTO", "LCO", "NCA"];
const sellerTypes = ["Any", "Individual", "Commercial", "Certified Refurbisher"];
const recommendedApplicationsOptions = ["Any", "Solar Backup", "EV Conversion", "Portable Power", "UPS", "Grid Storage", "Other"];

const sohRanges = [
    { label: "Any", min: 0, max: 100 }, { label: "95-100%", min: 95, max: 100 },
    { label: "90-94%", min: 90, max: 94 }, { label: "85-89%", min: 85, max: 89 },
    { label: "80-84%", min: 80, max: 84 }, { label: "70-79%", min: 70, max: 79 },
    { label: "60-69%", min: 60, max: 69 }, { label: "Below 60%", min: 0, max: 59 },
];

const exampleMarketplaceBattery = {
    id: "example-battery-001", batteryId: "uuid-example-marketplace-001", ownerId: "demo-owner-for-marketplace",
    manufacturer: "Demo Power Inc.", model: "Marketplace Special Alpha", chemistry: "LiFePO4",
    originalCapacity: 100, currentCapacity: 85,
    manufactureDate: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0],
    cycleCount: 150, status: "Operational",
    historyEvents: [
        { id: "evt-ex-mp-1", date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], event: "Initial Commissioning for Demo", location: "VoltaLog Test Facility", type: "Deployment", notes: "Ready for marketplace demonstration." },
        { id: "evt-ex-mp-2", date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], event: "Marketplace Listing Health Check", location: "VoltaLog Lab A", type: "Routine Check", notes: "SoH at 85%, excellent condition for second life." }
    ],
    isListedForMarketplace: true, listingType: 'For Sale', listingPrice: 2500,
    listingDescription: "Excellent condition LiFePO4 battery, perfect for residential solar backup or off-grid projects. Lightly used for demonstration purposes by VoltaLog. Includes detailed VoltaLog passport.",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 31)).toISOString(),
    updatedAt: new Date().toISOString(),
    mockLocation: "VoltaLog HQ, USA", sellerType: "Certified Refurbisher", recommendedApplications: ["Solar Backup", "Residential Energy Storage"],
    owner: { userId: "demo-owner-for-marketplace", username: "DemoSeller", name: "Demo Power Inc.", initials: "DP", averageRating: 4.8, transactionCount: 25 }
};

// --- SellerInfo Sub-component ---
const SellerInfo = ({ owner, theme, sellerTypeFromBatteryListing, onNavigateToUserProfile }) => {
    const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
    const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
    const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-gray-400';
    const linkClass = theme === 'dark' ? 'hover:text-blue-300' : 'hover:text-blue-700';

    const sellerName = owner?.name || owner?.username || 'Anonymous Seller';
    const rating = owner?.averageRating || (owner?.userId === exampleMarketplaceBattery.ownerId ? 4.8 : 4.0 + ((owner?.userId?.charCodeAt(5) || 0) % 10) / 10);
    const sales = owner?.transactionCount || (owner?.userId === exampleMarketplaceBattery.ownerId ? 25 : ((owner?.userId?.charCodeAt(3) || 0) % 50) + 5);
    const displaySellerType = sellerTypeFromBatteryListing || owner?.sellerType || (owner?.userId === exampleMarketplaceBattery.ownerId ? "Certified Refurbisher" : "Individual Seller");

    const handleSellerNameClick = () => {
        if (onNavigateToUserProfile && owner && owner.userId) {
            onNavigateToUserProfile(owner.userId);
        }
    };

    return (
        <div className={`mt-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
            <p className={`text-xs font-medium ${textMutedClass} mb-1`}>Seller Information</p>
            <div className="flex items-center space-x-2">
                <UserCheck size={16} className={textSecondaryClass} />
                {onNavigateToUserProfile && owner && owner.userId ? (
                    <button
                        onClick={handleSellerNameClick}
                        className={`text-sm ${textPrimaryClass} font-medium hover:underline ${linkClass} focus:outline-none`}
                        title={`View profile for ${sellerName}`}
                    >
                        {sellerName}
                    </button>
                ) : (
                    <span className={`text-sm ${textPrimaryClass} font-medium`}>{sellerName}</span>
                )}
                <span className={`text-xs ${textMutedClass}`}>({displaySellerType})</span>
            </div>
            { (owner?.averageRating !== undefined || rating > 0) && (
                <div className="flex items-center space-x-1 mt-1">
                    {[...Array(Math.floor(rating))].map((_, i) => <Star key={`f-${i}`} size={14} className="text-yellow-400 fill-yellow-400" />)}
                    {rating % 1 >= 0.5 && <Star key="h" size={14} className="text-yellow-400 fill-yellow-200" />}
                    {[...Array(5 - Math.ceil(rating))].map((_, i) => <Star key={`e-${i}`} size={14} className={theme === 'dark' ? 'text-slate-600 fill-slate-600' : 'text-gray-300 fill-gray-300'} />)}
                    <span className={`text-xs ${textMutedClass}`}>({rating.toFixed(1)} from {sales} transaction{sales === 1 ? '' : 's'})</span>
                </div>
            )}
        </div>
    );
};


export default function MarketplaceComponent({
  onSelectBattery,
  theme,
  currentUser,
  token,
  calculateMetrics,
  showAppNotification,
  initialFiltersToApply,
  onFiltersApplied,
  onInitiateConversation,
  onNavigateToUserProfile
}) {
  const [allMarketplaceBatteries, setAllMarketplaceBatteries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [filters, setFilters] = useState({
    searchTermLocal: '', chemistry: 'Any', sohRange: sohRanges[0], location: '',
    minPrice: '', maxPrice: '', ageMin: '', ageMax: '', cycleMin: '', cycleMax: '',
    sellerType: 'Any', recommendedApplication: 'Any',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);


  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-gray-400';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-200';
  const hoverCardClass = theme === 'dark' ? 'hover:bg-slate-700/70' : 'hover:bg-gray-50';
  const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-900';
  const placeholderClass = theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-gray-400';
  const buttonClass = `px-4 py-2 rounded-md transition-colors text-sm ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
  const secondaryButtonClass = `px-4 py-2 rounded-md transition-colors text-sm border ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

  const initialFiltersState = useMemo(() => ({
    searchTermLocal: '', chemistry: 'Any', sohRange: sohRanges[0],
    location: '', minPrice: '', maxPrice: '', ageMin: '', ageMax: '',
    cycleMin: '', cycleMax: '', sellerType: 'Any', recommendedApplication: 'Any',
  }), []);


  const fetchMarketplaceListings = useCallback(async (currentFiltersToUse) => {
    setIsLoading(true);
    try {
        const params = {};
        if (currentFiltersToUse.searchTermLocal) params.searchTerm = currentFiltersToUse.searchTermLocal;
        if (currentFiltersToUse.chemistry !== 'Any') params.chemistry = currentFiltersToUse.chemistry;
        if (currentFiltersToUse.minPrice) params.minPrice = parseFloat(currentFiltersToUse.minPrice);
        if (currentFiltersToUse.maxPrice) params.maxPrice = parseFloat(currentFiltersToUse.maxPrice);
        if (currentFiltersToUse.ageMin) params.ageMin = parseInt(currentFiltersToUse.ageMin);
        if (currentFiltersToUse.ageMax) params.ageMax = parseInt(currentFiltersToUse.ageMax);
        if (currentFiltersToUse.cycleMin) params.cycleMin = parseInt(currentFiltersToUse.cycleMin);
        if (currentFiltersToUse.cycleMax) params.cycleMax = parseInt(currentFiltersToUse.cycleMax);
        if (currentFiltersToUse.sellerType !== 'Any') params.sellerType = currentFiltersToUse.sellerType;
        if (currentFiltersToUse.recommendedApplication !== 'Any') params.application = currentFiltersToUse.recommendedApplication;
        if (currentFiltersToUse.location) params.location = currentFiltersToUse.location;
        if (currentFiltersToUse.sohRange && currentFiltersToUse.sohRange.label !== 'Any') {
            params.sohMin = currentFiltersToUse.sohRange.min;
            params.sohMax = currentFiltersToUse.sohRange.max;
        }

        const response = await axios.get(`${API_BASE_URL}/api/batteries/public/listings`, { params });
        
        // --- ROBUSTNESS FIX STARTS HERE ---
        if (Array.isArray(response.data)) {
            let fetchedListings = response.data;
            const exampleIsFetched = fetchedListings.some(b => b.batteryId === exampleMarketplaceBattery.batteryId);
            let combinedListings = fetchedListings;
            const noRealFiltersApplied = Object.keys(params).length === 0 || Object.values(params).every(val => val === '' || val === 'Any' || (typeof val === 'object' && val.label === 'Any') || val === 0 || val === 100);

            if (!exampleIsFetched && noRealFiltersApplied) {
                combinedListings = [exampleMarketplaceBattery, ...fetchedListings.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId)];
            }

            combinedListings.forEach((battery, index) => {
                if (!battery.location && !battery.mockLocation && battery.batteryId !== exampleMarketplaceBattery.batteryId) {
                     const locations = ["New York, USA", "Berlin, Germany", "London, UK", "Paris, France", "Tokyo, Japan", "Austin, TX", "Online Seller"];
                     battery.mockLocation = locations[index % locations.length];
                }
                if (battery.owner && !battery.owner.sellerType && battery.batteryId !== exampleMarketplaceBattery.batteryId) {
                     battery.owner.sellerType = sellerTypes[(index % (sellerTypes.length -1)) + 1];
                } else if (!battery.owner && battery.batteryId !== exampleMarketplaceBattery.batteryId) {
                    battery.owner = { userId: `mock-owner-${index}`, username: `Seller${index}`, name: `Mock Seller ${index}`, initials: "MS", sellerType: sellerTypes[(index % (sellerTypes.length -1)) + 1] };
                }
                if (battery.manufactureDate && typeof battery.ageYears === 'undefined') {
                    const manDate = new Date(battery.manufactureDate);
                    const ageDiffMs = Date.now() - manDate.getTime();
                    battery.ageYears = parseFloat((ageDiffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
                }
                if ((!battery.recommendedApplications || battery.recommendedApplications.length === 0) && battery.batteryId !== exampleMarketplaceBattery.batteryId) {
                    battery.recommendedApplications = [recommendedApplicationsOptions[(index % (recommendedApplicationsOptions.length -1)) + 1]];
                }
            });
            setAllMarketplaceBatteries(combinedListings);
        } else {
            // Handle the case where the API returned an error object or something else
            console.error("Failed to fetch marketplace listings: API did not return an array.", response.data);
            if(showAppNotification) showAppNotification("Could not load marketplace listings.", "error");
            // Set a safe default value (the example battery) to prevent crash
            setAllMarketplaceBatteries([exampleMarketplaceBattery]); 
        }
        // --- ROBUSTNESS FIX ENDS HERE ---

    } catch (error) {
        console.error("Failed to fetch marketplace listings:", error);
        if(showAppNotification) showAppNotification("Could not load marketplace listings. Displaying example.", "error");
        const exampleWithAge = {...exampleMarketplaceBattery};
        if (exampleWithAge.manufactureDate && typeof exampleWithAge.ageYears === 'undefined') {
            const manDate = new Date(exampleWithAge.manufactureDate);
            const ageDiffMs = Date.now() - manDate.getTime();
            exampleWithAge.ageYears = parseFloat((ageDiffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
        }
        setAllMarketplaceBatteries([exampleWithAge]);
    } finally {
        setIsLoading(false);
    }
  }, [showAppNotification, API_BASE_URL]);

  useEffect(() => {
    let effectiveFilters = { ...initialFiltersState };
    if (initialFiltersToApply) {
        let appliedSohRange = sohRanges[0];
        if (initialFiltersToApply.sohRange && initialFiltersToApply.sohRange.label) {
            const foundRange = sohRanges.find(r => r.label === initialFiltersToApply.sohRange.label);
            if (foundRange) appliedSohRange = foundRange;
        }
        effectiveFilters = { ...initialFiltersState, ...initialFiltersToApply, sohRange: appliedSohRange };
        setFilters(effectiveFilters);
        setShowFilters(true);
        if (onFiltersApplied) onFiltersApplied();
    }
    fetchMarketplaceListings(effectiveFilters);
  }, [initialFiltersToApply, onFiltersApplied, initialFiltersState, fetchMarketplaceListings]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === "sohRange") {
        setFilters(prev => ({ ...prev, sohRange: sohRanges.find(r => r.label === value) || sohRanges[0] }));
    } else {
        setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const applyFilters = () => {
      fetchMarketplaceListings(filters);
  };

  const resetFilters = () => {
    setFilters(initialFiltersState);
    fetchMarketplaceListings(initialFiltersState);
  };

  const displayedBatteries = useMemo(() => {
    return [...allMarketplaceBatteries];
  }, [allMarketplaceBatteries]);


  const toggleCompare = (batteryId) => {
    setSelectedForCompare(prev => prev.includes(batteryId) ? prev.filter(id => id !== batteryId) : (prev.length < 4 ? [...prev, batteryId] : prev));
  };
  const handleOpenCompareModal = () => {
    if (selectedForCompare.length < 2) { if(showAppNotification) showAppNotification("Please select at least 2 batteries to compare.", "info"); return; }
    setShowCompareModal(true);
  };

  const handleSaveSearchSubmit = async (searchName, receiveAlerts) => {
    if (!currentUser || !token) {
      if(showAppNotification) showAppNotification("Please log in to save searches.", "error");
      return;
    }
    try {
      const payload = { searchName, filtersJSON: JSON.stringify(filters), receiveAlerts };
      await axios.post(`${API_BASE_URL}/api/me/saved-searches`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if(showAppNotification) showAppNotification(`Search "${searchName}" saved successfully!`, 'success');
      setShowSaveSearchModal(false);
    } catch (error) {
      console.error("Save Search Error:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.errors?.map(e => e.msg).join(', ') || error.response?.data?.msg || 'Failed to save search.';
      if(showAppNotification) showAppNotification(errorMsg, 'error');
    }
  };

  const handleContactSeller = (battery) => {
    if (!currentUser) { if(showAppNotification) showAppNotification("Please log in to contact sellers.", "info"); return; }
    if (battery.ownerId === currentUser.id) { if(showAppNotification) showAppNotification("You cannot start a conversation about your own listing.", "info"); return; }
    if (onInitiateConversation && battery.owner && battery.ownerId) {
        onInitiateConversation(battery.ownerId, battery);
    } else {
        if(showAppNotification) showAppNotification("Seller information is unavailable for this listing.", "error");
    }
  };

  const handleOpenOfferModal = (battery) => {
    if (currentUser && battery.ownerId === currentUser.id) { if(showAppNotification) showAppNotification("You cannot make an offer on your own listing.", "info"); return; }
    if (battery.listingType === 'For Sale' || battery.listingType === 'Seeking Offers') { setShowOfferModal(battery); setOfferAmount(battery.listingPrice ? String(Math.round(battery.listingPrice * 0.9)) : ''); setOfferMessage('');
    } else { if(showAppNotification) showAppNotification(`Offers are not applicable for "${battery.listingType}" listings.`, 'info'); }
  };

  const handleSubmitOffer = async () => {
    if (!showOfferModal) return;
    if (!currentUser || !token) { if(showAppNotification) showAppNotification("You must be logged in to make an offer.", "error"); return; }
    if (!offerAmount || isNaN(parseFloat(offerAmount)) || parseFloat(offerAmount) <= 0) { if(showAppNotification) showAppNotification("Please enter a valid offer amount.", "error"); return; }
    setIsSubmittingOffer(true);
    try {
        const offerData = { batteryId: showOfferModal.batteryId, offerAmount: parseFloat(offerAmount), message: offerMessage };
        await axios.post(`${API_BASE_URL}/api/offers`, offerData, { headers: { Authorization: `Bearer ${token}` } });
        if(showAppNotification) showAppNotification(`Offer of $${offerAmount} submitted for ${showOfferModal.manufacturer} ${showOfferModal.model}. The seller will be notified.`, 'success');
        setShowOfferModal(null); setOfferAmount(''); setOfferMessage('');
    } catch (error) {
        console.error("Submit Offer Error:", error.response?.data || error.message);
        const errorMsg = error.response?.data?.errors?.map(e => e.msg).join(', ') || error.response?.data?.msg || 'Failed to submit offer.';
        if(showAppNotification) showAppNotification(errorMsg, 'error');
    } finally { setIsSubmittingOffer(false); }
  };

  if (isLoading && displayedBatteries.length === 0 ) {
    return ( <div className={`p-10 rounded-lg shadow ${cardBgClass} ${borderClass} text-center`}><Store size={48} className={`mx-auto mb-4 ${textMutedClass} animate-pulse`} /><h3 className={`text-xl font-semibold ${textPrimaryClass} mb-2`}>Loading Marketplace...</h3></div>);
  }

  return (
    <div className="space-y-6">
        <div className={`p-4 rounded-lg shadow-md ${cardBgClass} ${borderClass} mb-6`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h2 className={`text-xl font-semibold ${textPrimaryClass}`}>Marketplace Listings ({displayedBatteries.length})</h2>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <button onClick={() => setShowFilters(!showFilters)} className={`${secondaryButtonClass} flex items-center justify-center w-full sm:w-auto`}>
                        <SlidersHorizontal size={16} className="mr-2"/> {showFilters ? 'Hide' : 'Show'} Filters
                    </button>
                    {showFilters && currentUser && (
                         <button onClick={() => setShowSaveSearchModal(true)} className={`${secondaryButtonClass} flex items-center justify-center w-full sm:w-auto`} title="Save current search filters">
                            <Save size={16} className="mr-2"/> Save Current Search
                        </button>
                    )}
                </div>
            </div>
            {showFilters && (
                <div className={`space-y-4 mb-6 pb-4 border-b border-dashed ${theme==='dark' ? 'border-slate-700' : 'border-gray-300'}`}>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label htmlFor="searchTermLocalMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Search Term</label>
                            <div className="flex items-center">
                                <input type="text" name="searchTermLocal" id="searchTermLocalMarket" value={filters.searchTermLocal} onChange={handleFilterChange} onKeyPress={(e) => { if (e.key === 'Enter') applyFilters(); }} placeholder="ID, Mfg, Model..." className={`flex-grow p-2 text-sm border ${borderClass} rounded-l-md ${inputBgClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500 focus:z-10 border-r-0`}/>
                                <button onClick={applyFilters} aria-label="Search marketplace" className={`px-3 py-2 border ${borderClass} rounded-r-md text-white flex items-center justify-center focus:z-10 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 border-slate-600' : 'bg-blue-500 hover:bg-blue-600 border-gray-300'} focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'focus:ring-blue-400' : 'focus:ring-blue-500'}`}><Search size={16} /></button>
                            </div>
                        </div>
                        <div><label htmlFor="chemistryMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Chemistry</label><select name="chemistry" id="chemistryMarket" value={filters.chemistry} onChange={handleFilterChange} className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} focus:ring-blue-500 focus:border-blue-500`}>{chemistryTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                        <div><label htmlFor="sohRangeMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>State of Health</label><select name="sohRange" id="sohRangeMarket" value={filters.sohRange.label} onChange={handleFilterChange} className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} focus:ring-blue-500 focus:border-blue-500`}>{sohRanges.map(range => <option key={range.label} value={range.label}>{range.label}</option>)}</select></div>
                        <div><label htmlFor="locationMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Location</label><input type="text" name="location" id="locationMarket" value={filters.location} onChange={handleFilterChange} placeholder="City, State, or Zip" className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} /></div>
                        <div><label htmlFor="minPriceMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Min Price ($)</label><input type="number" name="minPrice" id="minPriceMarket" value={filters.minPrice} onChange={handleFilterChange} placeholder="e.g. 500" className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} /></div>
                        <div><label htmlFor="maxPriceMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Max Price ($)</label><input type="number" name="maxPrice" id="maxPriceMarket" value={filters.maxPrice} onChange={handleFilterChange} placeholder="e.g. 3000" className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} /></div>
                        <div><label htmlFor="ageMinMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Min Age (Years)</label><input type="number" name="ageMin" id="ageMinMarket" min="0" value={filters.ageMin} onChange={handleFilterChange} placeholder="e.g. 1" className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} /></div>
                        <div><label htmlFor="ageMaxMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Max Age (Years)</label><input type="number" name="ageMax" id="ageMaxMarket" min="0" value={filters.ageMax} onChange={handleFilterChange} placeholder="e.g. 5" className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} /></div>
                        <div><label htmlFor="cycleMinMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Min Cycles</label><input type="number" name="cycleMin" id="cycleMinMarket" min="0" value={filters.cycleMin} onChange={handleFilterChange} placeholder="e.g. 100" className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} /></div>
                        <div><label htmlFor="cycleMaxMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Max Cycles</label><input type="number" name="cycleMax" id="cycleMaxMarket" min="0" value={filters.cycleMax} onChange={handleFilterChange} placeholder="e.g. 1000" className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} /></div>
                        <div><label htmlFor="sellerTypeMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Seller Type</label><select name="sellerType" id="sellerTypeMarket" value={filters.sellerType} onChange={handleFilterChange} className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} focus:ring-blue-500 focus:border-blue-500`}>{sellerTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                        <div><label htmlFor="recommendedApplicationMarket" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Application</label><select name="recommendedApplication" id="recommendedApplicationMarket" value={filters.recommendedApplication} onChange={handleFilterChange} className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} focus:ring-blue-500 focus:border-blue-500`}>{recommendedApplicationsOptions.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                    </div>
                    <div className={`flex justify-end space-x-3 mt-3 pt-3 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-gray-300/70'}`}>
                        <button onClick={resetFilters} className={`${secondaryButtonClass} flex items-center`}><X size={16} className="mr-1.5" />Reset Filters</button>
                        <button onClick={applyFilters} className={`${buttonClass} flex items-center`}><Filter size={16} className="mr-1.5" />Apply Filters</button>
                    </div>
                </div>
            )}
        </div>

      {!isLoading && displayedBatteries.length === 0 ? (
        <div className={`p-10 rounded-lg shadow ${cardBgClass} ${borderClass} text-center`}>
            <SearchCheck size={48} className={`mx-auto mb-4 ${textMutedClass}`} />
            <h3 className={`text-xl font-semibold ${textPrimaryClass} mb-2`}>No Batteries Found</h3>
            <p className={textSecondaryClass}>
                {Object.values(filters).some(val => val && val !== 'Any' && (typeof val === 'string' ? val.trim() !== '' : (val.label ? val.label !== 'Any' : true))) 
                    ? "No listings match your current filters. Try adjusting them or reset to view all available listings." 
                    : "The marketplace is currently empty or no listings match your search criteria."
                }
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBatteries.map(battery => {
            const metrics = calculateMetrics ? calculateMetrics(battery) : { stateOfHealth: 'N/A', estimatedRULYears: 'N/A', ageInYears: 'N/A' };
            const idKey = battery.batteryId || battery.id;
            const isSelectedForCompare = selectedForCompare.includes(idKey);
            const isOwner = currentUser && battery.ownerId === currentUser.id;

            return (
              <div key={idKey} className={`${cardBgClass} rounded-lg shadow border ${isSelectedForCompare ? (theme === 'dark' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-blue-500 ring-2 ring-blue-500') : borderClass} overflow-hidden flex flex-col justify-between transition-all duration-300 ease-in-out ${hoverCardClass}`}>
                <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            <Battery size={24} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
                            <h3 className={`text-lg font-semibold ${textPrimaryClass} leading-tight`}>{battery.manufacturer} {battery.model}</h3>
                        </div>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${battery.listingType === 'For Sale' ? (theme === 'dark' ? 'bg-green-700 text-green-200' : 'bg-green-100 text-green-800') : battery.listingType === 'For Lease' ? (theme === 'dark' ? 'bg-yellow-700 text-yellow-200' : 'bg-yellow-100 text-yellow-800') : (theme === 'dark' ? 'bg-purple-700 text-purple-200' : 'bg-purple-100 text-purple-800')}`}>
                            {battery.listingType || 'Available'}
                        </span>
                    </div>
                    <p className={`text-sm ${textSecondaryClass} mb-1 truncate`}>ID: {idKey}</p>
                    <p className={`text-sm ${textSecondaryClass} mb-3 h-10 overflow-y-auto`}>{battery.listingDescription || 'No additional description provided.'}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-4">
                        <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'} p-2 rounded-md`}><p className={`${textMutedClass} text-xs`}>SoH</p><p className={`${textPrimaryClass} font-medium`}>{metrics.stateOfHealth}%</p></div>
                        <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'} p-2 rounded-md`}><p className={`${textMutedClass} text-xs`}>Est. RUL</p><p className={`${textPrimaryClass} font-medium`}>{metrics.estimatedRULYears} yrs</p></div>
                        <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'} p-2 rounded-md`}><p className={`${textMutedClass} text-xs`}>Cycles</p><p className={`${textPrimaryClass} font-medium`}>{battery.cycleCount}</p></div>
                        <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'} p-2 rounded-md`}><p className={`${textMutedClass} text-xs`}>Age</p><p className={`${textPrimaryClass} font-medium`}>{metrics.ageInYears} yrs</p></div>
                        <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'} p-2 rounded-md col-span-2 sm:col-span-1`}><p className={`${textMutedClass} text-xs`}>Chemistry</p><p className={`${textPrimaryClass} font-medium truncate`}>{battery.chemistry}</p></div>
                        <div className={`${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'} p-2 rounded-md`}><p className={`${textMutedClass} text-xs`}>Location</p><p className={`${textPrimaryClass} font-medium truncate`}>{battery.location || battery.mockLocation || 'N/A'}</p></div>
                    </div>
                    {battery.listingPrice && battery.listingType === 'For Sale' && (<div className="flex items-center mb-4"><DollarSign size={20} className={theme === 'dark' ? 'text-green-400 mr-2' : 'text-green-600 mr-2'} /><p className={`text-xl font-bold ${textPrimaryClass}`}>{battery.listingPrice.toLocaleString()}</p></div>)}
                    <SellerInfo 
                        owner={battery.owner} 
                        theme={theme} 
                        sellerTypeFromBatteryListing={battery.owner?.sellerType || battery.sellerType}
                        onNavigateToUserProfile={onNavigateToUserProfile}
                    />
                </div>
                <div className={`p-4 border-t ${borderClass} space-y-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50/50'}`}>
                    <div className="flex items-center justify-between space-x-2">
                        <button onClick={() => onSelectBattery && onSelectBattery(battery)} className={`${secondaryButtonClass} flex-1 flex items-center justify-center`} title="View full battery passport"><Eye size={16} className="mr-1.5" /> Details</button>
                        {!isOwner && onInitiateConversation && battery.ownerId && (
                            <button onClick={() => handleContactSeller(battery)} className={`${buttonClass} flex-1 flex items-center justify-center`} title="Contact seller about this battery"><MessageSquare size={16} className="mr-1.5" /> Contact Seller</button>
                        )}
                        {isOwner && <button className={`${buttonClass} flex-1 flex items-center justify-center opacity-50 cursor-not-allowed`} title="This is your listing"><MessageSquare size={16} className="mr-1.5" /> Your Listing</button>}
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <button onClick={() => toggleCompare(idKey)} className={`${secondaryButtonClass} flex-1 flex items-center justify-center ${isSelectedForCompare ? (theme === 'dark' ? 'bg-blue-700 border-blue-600 text-white' : 'bg-blue-100 border-blue-300 text-blue-700') : ''}`} title={isSelectedForCompare ? "Remove from comparison" : "Add to comparison"}><CheckSquare size={16} className="mr-1.5" /> {isSelectedForCompare ? 'Selected' : 'Compare'}</button>
                        {(!isOwner && (battery.listingType === 'For Sale' || battery.listingType === 'Seeking Offers')) && (
                            <button onClick={() => handleOpenOfferModal(battery)} className={`${buttonClass} flex-1 flex items-center justify-center`} title="Make an offer for this battery"><Tag size={16} className="mr-1.5" /> Make Offer</button>
                        )}
                        {isOwner && <button className={`${buttonClass} flex-1 flex items-center justify-center opacity-50 cursor-not-allowed`} title="Cannot make offer on own listing"><Tag size={16} className="mr-1.5" /> Your Listing</button>}
                    </div>
                </div>
              </div>);
          })}
        </div>
      )}

        <SaveSearchModal isOpen={showSaveSearchModal} onClose={() => setShowSaveSearchModal(false)} onSave={handleSaveSearchSubmit} theme={theme} />
        {showCompareModal && ( 
             <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"><div className={`${cardBgClass} rounded-lg shadow-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto`}><div className="flex justify-between items-center mb-6"><h3 className={`text-2xl font-semibold ${textPrimaryClass}`}>Compare Batteries ({selectedForCompare.length})</h3><button onClick={() => setShowCompareModal(false)} className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}><X size={24}/></button></div>{selectedForCompare.length > 0 ? (<div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(selectedForCompare.length, 4)} gap-5`}>{allMarketplaceBatteries.filter(b => selectedForCompare.includes(b.batteryId || b.id)).map(battery => { const metrics = calculateMetrics ? calculateMetrics(battery) : { stateOfHealth: 'N/A', estimatedRULYears: 'N/A', ageInYears: battery.ageYears || 'N/A' }; return (<div key={battery.batteryId || battery.id} className={`p-4 rounded-lg border ${borderClass} ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'}`}><h4 className={`font-semibold text-lg ${textPrimaryClass} mb-2 truncate`} title={`${battery.manufacturer} ${battery.model}`}>{battery.manufacturer} {battery.model}</h4><p className={`text-xs ${textMutedClass} mb-3`}>ID: {(battery.batteryId || battery.id).substring(0,15)}...</p><ul className="space-y-1.5 text-sm mb-4"><li className={textSecondaryClass}><strong className={`${textMutedClass} w-24 inline-block`}>SoH:</strong> {metrics.stateOfHealth}%</li><li className={textSecondaryClass}><strong className={`${textMutedClass} w-24 inline-block`}>Est. RUL:</strong> {metrics.estimatedRULYears} yrs</li><li className={textSecondaryClass}><strong className={`${textMutedClass} w-24 inline-block`}>Capacity:</strong> {battery.currentCapacity}/{battery.originalCapacity} kWh</li><li className={textSecondaryClass}><strong className={`${textMutedClass} w-24 inline-block`}>Age:</strong> {metrics.ageInYears} yrs</li><li className={textSecondaryClass}><strong className={`${textMutedClass} w-24 inline-block`}>Cycles:</strong> {battery.cycleCount}</li><li className={textSecondaryClass}><strong className={`${textMutedClass} w-24 inline-block`}>Chemistry:</strong> {battery.chemistry}</li><li className={textSecondaryClass}><strong className={`${textMutedClass} w-24 inline-block`}>Location:</strong> {battery.location || battery.mockLocation || 'N/A'}</li><li className={textSecondaryClass}><strong className={`${textMutedClass} w-24 inline-block`}>Price:</strong> {battery.listingPrice ? `$${battery.listingPrice.toLocaleString()}` : (battery.listingType === 'For Sale' ? 'Contact Seller' : 'N/A')}</li><li className={textSecondaryClass}><strong className={`${textMutedClass} w-24 inline-block`}>Listing Type:</strong> {battery.listingType}</li></ul><SellerInfo owner={battery.owner} theme={theme} sellerTypeFromBatteryListing={battery.owner?.sellerType || battery.sellerType} /></div>);})}</div>) : <p className={textSecondaryClass}>No batteries selected for comparison.</p>}<div className="mt-8 flex justify-end"><button onClick={() => setShowCompareModal(false)} className={secondaryButtonClass}>Close</button></div></div></div>
        )}

        {showOfferModal && ( 
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"><div className={`${cardBgClass} rounded-lg shadow-xl p-6 max-w-md w-full`}><div className="flex justify-between items-center mb-4"><h3 className={`text-xl font-semibold ${textPrimaryClass}`}>Make Offer</h3><button onClick={() => setShowOfferModal(null)} className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}><X size={24}/></button></div><p className={`${textSecondaryClass} mb-1`}>For: {showOfferModal.manufacturer} {showOfferModal.model}</p>{showOfferModal.listingType === 'For Sale' && showOfferModal.listingPrice && <p className={`${textMutedClass} text-sm mb-3`}>Listed Price: ${showOfferModal.listingPrice.toLocaleString()}</p>}<div className="space-y-4"><div><label htmlFor="offerAmount" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Your Offer Amount ($)</label><input type="number" name="offerAmount" id="offerAmount" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder="e.g. 2200" className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} /></div><div><label htmlFor="offerMessage" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>Message to Seller (Optional)</label><textarea name="offerMessage" id="offerMessage" value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} rows="3" placeholder="Include any details or questions with your offer..." className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}></textarea></div></div><div className="mt-6 flex justify-end space-x-3"><button onClick={() => setShowOfferModal(null)} className={secondaryButtonClass} disabled={isSubmittingOffer}>Cancel</button><button onClick={handleSubmitOffer} className={`${buttonClass} flex items-center justify-center`} disabled={isSubmittingOffer}>{isSubmittingOffer ? <><Activity size={16} className="animate-spin mr-2"/> Submitting...</> : <><Send size={16} className="mr-2"/> Submit Offer</>}</button></div></div></div>
        )}
    </div>
  );
}