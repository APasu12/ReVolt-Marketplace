// battery-ui/src/MainAppLayout.js
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import axios from '../../api/axiosConfig'; // UPDATED: Import the configured axios instance
import AuthContext from '../../context/AuthContext';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import your UI components
import AnalyticsComponent from '../ui/AnalyticsComponent';
import MyBatteriesComponent from '../ui/MyBatteriesComponent';
import MarketplaceComponent from '../ui/MarketplaceComponent';
import MySavedSearchesPage from '../../pages/MySavedSearchesPage';
import ReportsComponent from '../ui/ReportsComponent';
import MyListingsOffersPage from '../../pages/MyListingsOffersPage';
import UserProfilePage from '../../pages/UserProfilePage';
import EditProfilePage from '../../pages/EditProfilePage';
import InboxPage from '../../pages/InboxPage';
import ConversationPage from '../../pages/ConversationPage';
import CompanyManagementPage from '../../pages/CompanyManagementPage'; // NEW: Import Company Management Page
import CreateCompanyPage from '../../pages/CreateCompanyPage'; // <-- ADD THIS IMPORT

import {
    Battery, SearchCheck, FileText, BarChart3, ShieldCheck, Award,
    Zap, Clock, Thermometer, Activity, Plus, Store, Tag, UserCircle,

    Save, Trash2, AlertCircle, Edit3, XCircle, Moon, Sun, LogOut,
    SlidersHorizontal, TrendingUp, FileSpreadsheet, Briefcase, CheckCircle,
    FileDown, RotateCcw, UploadCloud, Paperclip, Eye, MessageSquare, Mail, Loader2
} from 'lucide-react';

const APP_NAME = "VoltaLog";
const LOCAL_STORAGE_KEY_THEME = 'voltaLogApp_theme';
const LOCAL_STORAGE_KEY_SELECTED_ID = 'voltaLogApp_selectedBatteryId';
// REMOVED: API_URL is now handled by axiosConfig.js

const initialBatteryFormState = {
    id: "", batteryId: "", manufacturer: "", model: "", chemistry: "LiFePO4",
    originalCapacity: "", currentCapacity: "", manufactureDate: "",
    cycleCount: "", status: "Operational", historyEvents: [],
    isListedForMarketplace: false, listingType: 'Seeking Offers', listingPrice: '', listingDescription: '',
    location: '', recommendedApplications: [],
};
const initialEventFormState = { date: "", event: "", location: "", type: "Routine Check", notes: "" };

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
    mockLocation: "VoltaLog HQ, USA",
    documents: [],
    owner: {
        userId: "demo-owner-for-marketplace",
        username: "DemoSeller",
        name: "Demo Power Inc.",
        initials: "DP",
        averageRating: 4.8,
        totalReviews: 25
    }
};

// NEW: Component to handle invitation acceptance
const AcceptInvitationPage = ({ invitationToken, theme, showAppNotification, onInvitationAccepted }) => {
    // REMOVED: useContext(AuthContext) is not needed as token is handled by interceptor
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
    const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-600';
    const primaryButtonClass = `px-4 py-2 text-white rounded-md transition-colors ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`;
    const secondaryButtonClass = `px-4 py-2 border rounded-md transition-colors ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;

    const handleAccept = async () => {
        // UPDATED: Removed token check as it's handled by interceptor
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            // UPDATED: Use axios instance and relative path. Removed headers.
            const response = await axios.post(`/api/company/accept-invitation/${invitationToken}`, {});
            setSuccess(response.data.msg || "Invitation accepted successfully! You are now part of the company.");
            showAppNotification(response.data.msg || "Invitation accepted successfully!", "success");
            // The AuthProvider should update the currentUser, which will trigger a re-render
        } catch (err) {
            const errorMsg = err.response?.data?.msg || "Failed to accept the invitation. It may be invalid or expired.";
            setError(errorMsg);
            showAppNotification(errorMsg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`${cardBgClass} rounded-lg shadow-lg p-8 max-w-lg mx-auto text-center`}>
            <Mail size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-2xl font-bold ${textPrimaryClass} mb-2`}>Accept Company Invitation</h2>
            {!success && !error && (
                <>
                    <p className={`${textSecondaryClass} mb-6`}>You have been invited to join a company on VoltaLog. Click the button below to accept.</p>
                    <button onClick={handleAccept} className={`${primaryButtonClass} w-full`} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin inline-block mr-2" /> : null}
                        {isLoading ? 'Accepting...' : 'Accept Invitation'}
                    </button>
                </>
            )}
            {success && (
                <>
                    <p className="text-green-500 mb-6">{success}</p>
                    <button onClick={onInvitationAccepted} className={secondaryButtonClass}>
                        Go to Company Page
                    </button>
                </>
            )}
            {error && (
                <>
                    <p className="text-red-500 mb-6">{error}</p>
                     <button onClick={() => window.location.href = '/'} className={secondaryButtonClass}>
                        Go to Dashboard
                    </button>
                </>
            )}
        </div>
    );
};


export default function MainAppLayout() {
    // const { currentUser, token, logout, refreshCurrentUser } = useContext(AuthContext); // token still useful for conditional checks here
    const { currentUser, token, isAuthenticated, logout, refreshCurrentUser } = useContext(AuthContext);
    const [theme, setTheme] = useState(() => localStorage.getItem(LOCAL_STORAGE_KEY_THEME) || 'dark');
    const [batteries, setBatteries] = useState([{ ...exampleMarketplaceBattery, documents: exampleMarketplaceBattery.documents || [] }]);
    const [selectedBattery, setSelectedBattery] = useState(null);
    const [selectedTab, setSelectedTab] = useState('dashboard');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '', visible: false });
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [formMode, setFormMode] = useState('add');
    const [batteryFormState, setBatteryFormState] = useState(initialBatteryFormState);
    const [eventFormState, setEventFormState] = useState(initialEventFormState);
    const [formErrors, setFormErrors] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [batteryToDelete, setBatteryToDelete] = useState(null);
    const [batterySearchTerm, setBatterySearchTerm] = useState('');
    const [initialMarketplaceFilters, setInitialMarketplaceFilters] = useState(null);
    const [profileUserIdToView, setProfileUserIdToView] = useState(null);
    const [filesToUpload, setFilesToUpload] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const [activeConversationId, setActiveConversationId] = useState(null);
    const [activeConversationParticipant, setActiveConversationParticipant] = useState(null);
    const [activeConversationBattery, setActiveConversationBattery] = useState(null);
    const [isInitiatingConversation, setIsInitiatingConversation] = useState(false);

    // NEW: State to handle invitation URL
    const [invitationTokenFromUrl, setInvitationTokenFromUrl] = useState(null);

    // Add at the top of the component (inside MainAppLayout):
    const [marketplaceStats, setMarketplaceStats] = useState({
      totalListings: 12, // TODO: Replace with real data from Supabase
      totalValue: 32000, // TODO: Replace with real data from Supabase
      popularChemistry: 'LiFePO4',
      mostSearched: 'Tesla Powerwall',
      priceTrends: [
        { chemistry: 'LiFePO4', avgPrice: 2500 },
        { chemistry: 'NMC', avgPrice: 2100 },
        { chemistry: 'LCO', avgPrice: 1800 },
      ],
      hotListings: [
        { batteryId: 'hot-1', manufacturer: 'Demo Power', model: 'Alpha', listingPrice: 2600 },
        { batteryId: 'hot-2', manufacturer: 'SunVolt', model: 'ProX', listingPrice: 2200 },
      ],
      recentListings: [
        { batteryId: 'rec-1', manufacturer: 'Demo Power', model: 'Alpha', stateOfHealth: 92 },
        { batteryId: 'rec-2', manufacturer: 'SunVolt', model: 'ProX', stateOfHealth: 88 },
        { batteryId: 'rec-3', manufacturer: 'EcoCell', model: 'GreenMax', stateOfHealth: 95 },
      ],
    });
    const [userListings, setUserListings] = useState([
      { batteryId: 'user-1', manufacturer: 'Demo Power', model: 'Alpha', status: 'Active', listingPrice: 2500 },
      { batteryId: 'user-2', manufacturer: 'EcoCell', model: 'GreenMax', status: 'Pending', listingPrice: 2100 },
    ]);

    const showAppNotification = useCallback((message, type = 'success', duration = 4000) => {
        setNotification({ message, type, visible: true });
        const timer = setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), duration);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEY_THEME);
        if (storedTheme) setTheme(storedTheme);
        
        // NEW: Check for invitation URL on initial load
        const path = window.location.pathname;
        const match = path.match(/^\/accept-invitation\/([a-zA-Z0-9-]+)$/);
        if (match && match[1]) {
            setInvitationTokenFromUrl(match[1]);
        }
    }, []);

    useEffect(() => {
        document.documentElement.className = theme;
        localStorage.setItem(LOCAL_STORAGE_KEY_THEME, theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');

    const calculateMetrics = useCallback((battery) => {
        if (!battery || typeof battery.originalCapacity === 'undefined' || typeof battery.currentCapacity === 'undefined') {
            return { stateOfHealth: 0, secondLifeScore: 0, recommendedUses: ["Data Incomplete"], ageInYears: 0, estimatedRULYears: "N/A", failureRiskScore: "N/A", degradationRatePercentPerYear: "N/A", degradationRatePercentPer1kCycles: "N/A", maxExpectedCycles: 2000, maxExpectedAgeYears: 8 };
        }
        const originalCapacity = parseFloat(battery.originalCapacity);
        const currentCapacity = parseFloat(battery.currentCapacity);
        const soh = originalCapacity > 0 ? Math.round((currentCapacity / originalCapacity) * 100) : 0;
        let ageInYears = 0;
        if (battery.manufactureDate) { try { const mnfDate = new Date(battery.manufactureDate); if (!isNaN(mnfDate.getTime())) { ageInYears = (new Date().getTime() - mnfDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25); } } catch (e) { console.error("Error parsing manufactureDate: ", e);}}
        ageInYears = parseFloat(ageInYears.toFixed(1));
        const cycleCount = parseInt(battery.cycleCount) || 0;
        const chemShort = (battery.chemistry || "").split('(')[0].trim();
        const maxExpectedCycles = chemShort === "LTO" ? 10000 : (chemShort === "LiFePO4" ? 3500 : 2000);
        const maxExpectedAgeYears = chemShort === "LTO" ? 20 : (chemShort === "LiFePO4" ? 12 : 8);
        const cyclesRemaining = maxExpectedCycles - cycleCount;
        let avgCyclesPerYear = 0; if (ageInYears > 0.1) { avgCyclesPerYear = cycleCount / ageInYears; } else if (cycleCount > 0) { avgCyclesPerYear = cycleCount * 12; }
        let rul_from_cycles = Infinity; if (avgCyclesPerYear > 0 && cyclesRemaining > 0) { rul_from_cycles = cyclesRemaining / avgCyclesPerYear; } else if (cyclesRemaining > 0 && cycleCount === 0) { rul_from_cycles = maxExpectedAgeYears; } else if (cyclesRemaining <= 0) { rul_from_cycles = 0; }
        const rul_from_age = maxExpectedAgeYears - ageInYears;
        const estimatedRULYears = Math.max(0, Math.min(rul_from_cycles, rul_from_age)).toFixed(1);
        let riskScore = 0; if (soh < 70) riskScore += 30; else if (soh < 80) riskScore += 15; if (cycleCount > maxExpectedCycles * 0.8) riskScore += 30; else if (cycleCount > maxExpectedCycles * 0.6) riskScore += 15; if (ageInYears > maxExpectedAgeYears * 0.8) riskScore += 30; else if (ageInYears > maxExpectedAgeYears * 0.6) riskScore += 15; (battery.historyEvents || []).forEach(event => { if (event.type === 'Incident') riskScore += 10; }); riskScore = Math.min(100, Math.max(0, riskScore));
        const sohLost = 100 - soh; let degradationRatePercentPerYear = "0.00"; if (ageInYears > 0.1 && sohLost > 0) degradationRatePercentPerYear = (sohLost / ageInYears).toFixed(2); let degradationRatePercentPer1kCycles = "0.00"; if (cycleCount > 0 && sohLost > 0) degradationRatePercentPer1kCycles = ((sohLost / cycleCount) * 1000).toFixed(2);
        let secondLifeScore = 0; if (soh >= 80) secondLifeScore += 40; else if (soh >= 70) secondLifeScore += 30; else if (soh >= 60) secondLifeScore += 20; else if (soh >= 50) secondLifeScore += 10; if (cycleCount < (maxExpectedCycles * 0.3)) secondLifeScore += 30; else if (cycleCount < (maxExpectedCycles * 0.5)) secondLifeScore += 20; else if (cycleCount < (maxExpectedCycles * 0.7)) secondLifeScore += 10; if (ageInYears < (maxExpectedAgeYears * 0.3)) secondLifeScore += 30; else if (ageInYears < (maxExpectedAgeYears * 0.5)) secondLifeScore += 20; else if (ageInYears < (maxExpectedAgeYears * 0.7)) secondLifeScore += 10; secondLifeScore = Math.min(100, Math.max(0, secondLifeScore));
        let recommendedUses = []; if (secondLifeScore >= 75 && soh >= 75) recommendedUses = ["EV Powertrains (Light Duty)", "Grid Backup (High Demand)", "Commercial Energy Storage"]; else if (secondLifeScore >= 60 && soh >= 70) recommendedUses = ["Residential Energy Storage", "Mobile Power Stations", "Industrial UPS"]; else if (secondLifeScore >= 40 && soh >= 60) recommendedUses = ["Solar Energy Storage (Off-Grid)", "Portable Power Packs", "Low-Demand Backup"]; else if (soh >= 50) recommendedUses = ["Low-Demand IoT Devices", "Street Lighting", "Golf Carts (Light Use)"]; else recommendedUses = ["Recycling / Material Recovery", "Repurposing Research"];
        return { stateOfHealth: soh, secondLifeScore, recommendedUses, ageInYears, estimatedRULYears, failureRiskScore: riskScore, degradationRatePercentPerYear, degradationRatePercentPer1kCycles, maxExpectedCycles, maxExpectedAgeYears };
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setIsLoadingData(false);
            setBatteries([{ ...exampleMarketplaceBattery, documents: exampleMarketplaceBattery.documents || [] }]);
            return;
        }
        setIsLoadingData(true);
        const fetchBatteries = async () => {
            try {
                // UPDATED: Use axios instance, relative path, and remove headers
                const response = await axios.get(`/api/batteries`);
                
                if (Array.isArray(response.data)) {
                    const fetchedUserBatteries = response.data;
                    const processedUserBatteries = fetchedUserBatteries.map(b => ({ ...b, documents: b.documents || [] }));
                    const processedExampleBattery = { ...exampleMarketplaceBattery, documents: exampleMarketplaceBattery.documents || [] };
                    const allBatteries = [processedExampleBattery, ...processedUserBatteries.filter(b => b.batteryId !== processedExampleBattery.batteryId)];
                    setBatteries(allBatteries);

                    const storedSelectedId = localStorage.getItem(LOCAL_STORAGE_KEY_SELECTED_ID);
                    if (storedSelectedId) {
                        const batteryToSelect = allBatteries.find(b => b.batteryId === storedSelectedId);
                        if (batteryToSelect && (batteryToSelect.batteryId !== exampleMarketplaceBattery.batteryId || selectedTab === 'marketplace')) {
                            setSelectedBattery(batteryToSelect);
                        } else {
                            localStorage.removeItem(LOCAL_STORAGE_KEY_SELECTED_ID);
                            setSelectedBattery(null);
                        }
                    } else {
                        setSelectedBattery(null);
                    }
                } else {
                    console.error('Failed to load batteries: API did not return an array.', response.data);
                    setBatteries([{ ...exampleMarketplaceBattery, documents: exampleMarketplaceBattery.documents || [] }]);
                    showAppNotification('Failed to load battery data. API response was not as expected.', 'error');
                }

            } catch (error) {
                console.error('Failed to load batteries:', error);
                setBatteries([{ ...exampleMarketplaceBattery, documents: exampleMarketplaceBattery.documents || [] }]);
                if (error.response && error.response.status === 401) {
                    showAppNotification('Session expired. Please log in again.', 'error');
                    logout();
                } else {
                    showAppNotification('Failed to load battery data.', 'error');
                }
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchBatteries();
    }, [logout, showAppNotification, currentUser, token, selectedTab]);

    useEffect(() => {
        if (selectedBattery && selectedBattery.batteryId && selectedBattery.batteryId !== exampleMarketplaceBattery.batteryId) {
            localStorage.setItem(LOCAL_STORAGE_KEY_SELECTED_ID, selectedBattery.batteryId);
        } else if (!selectedBattery || selectedBattery.batteryId === exampleMarketplaceBattery.batteryId) {
            if (selectedTab !== 'marketplace' || !selectedBattery || selectedBattery.batteryId !== exampleMarketplaceBattery.batteryId) {
                 localStorage.removeItem(LOCAL_STORAGE_KEY_SELECTED_ID);
            }
        }
    }, [selectedBattery, selectedTab]);

    const dashboardStats = useMemo(() => {
        const userBatteries = batteries.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId);
        const totalUser = userBatteries.length;
        if (totalUser === 0) return { totalListedWithExample: batteries.length, totalUser: 0, avgSoH: 0, avgCycles: 0, highRiskCount: 0, avgRUL: "N/A" };
        let sumSoH = 0, sumCycles = 0, highRiskCount = 0, sumRUL = 0, rulCount = 0;
        userBatteries.forEach(b => {
            const metrics = calculateMetrics(b); sumSoH += metrics.stateOfHealth || 0;
            sumCycles += (parseInt(b.cycleCount) || 0); if (metrics.failureRiskScore > 70) highRiskCount++;
            if (metrics.estimatedRULYears !== "N/A" && !isNaN(parseFloat(metrics.estimatedRULYears))) { sumRUL += parseFloat(metrics.estimatedRULYears); rulCount++; }
        });
        return { totalListedWithExample: batteries.length, totalUser, avgSoH: totalUser > 0 ? Math.round(sumSoH / totalUser) : 0, avgCycles: totalUser > 0 ? Math.round(sumCycles / totalUser) : 0, highRiskCount, avgRUL: rulCount > 0 ? parseFloat((sumRUL / rulCount).toFixed(1)) : "N/A" };
    }, [batteries, calculateMetrics]);

    const filteredUserBatteriesForSidebar = useMemo(() => {
        const userBatteries = batteries.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId);
        if (!batterySearchTerm.trim()) { return userBatteries; }
        const lowerSearchTerm = batterySearchTerm.toLowerCase();
        return userBatteries.filter(battery => (battery.id?.toLowerCase() || '').includes(lowerSearchTerm) || (battery.batteryId?.toLowerCase() || '').includes(lowerSearchTerm) || (battery.manufacturer?.toLowerCase() || '').includes(lowerSearchTerm) || (battery.model?.toLowerCase() || '').includes(lowerSearchTerm));
    }, [batteries, batterySearchTerm]);

    const handleBatteryFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBatteryFormState(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
    };
    const handleEventFormChange = (e) => {
        const { name, value } = e.target;
        setEventFormState(prev => ({ ...prev, [name]: value }));
    };
    const handleAddEventToForm = () => {
        if (eventFormState.date && eventFormState.event && eventFormState.location) {
            setBatteryFormState(prev => ({ ...prev, historyEvents: [...(prev.historyEvents || []), { ...eventFormState, id: `evt-${crypto.randomUUID().slice(0,8)}` }]}));
            setEventFormState(initialEventFormState);
        } else { showAppNotification('Please fill all event fields (Date, Event, Location).', 'error');}
    };
    const removeEventFromForm = (eventId) => {
        setBatteryFormState(prev => ({ ...prev, historyEvents: prev.historyEvents.filter(event => event.id !== eventId)}));
    };
    const validateForm = () => {
        const errors = {};
        if (!batteryFormState.manufacturer.trim()) errors.manufacturer = "Manufacturer is required.";
        if (!batteryFormState.model.trim()) errors.model = "Model is required.";
        if (!batteryFormState.originalCapacity || isNaN(parseFloat(batteryFormState.originalCapacity)) || parseFloat(batteryFormState.originalCapacity) <= 0) errors.originalCapacity = "Valid original capacity (kWh) > 0 is required.";
        if (!batteryFormState.currentCapacity || isNaN(parseFloat(batteryFormState.currentCapacity)) || parseFloat(batteryFormState.currentCapacity) < 0) errors.currentCapacity = "Valid current capacity (kWh) >= 0 is required.";
        else if (batteryFormState.originalCapacity && parseFloat(batteryFormState.currentCapacity) > parseFloat(batteryFormState.originalCapacity)) errors.currentCapacity = "Current capacity cannot exceed original.";
        if (!batteryFormState.manufactureDate) errors.manufactureDate = "Manufacture date is required.";
        else if (new Date(batteryFormState.manufactureDate) > new Date()) errors.manufactureDate = "Manufacture date cannot be in the future.";
        if (batteryFormState.cycleCount === "" || isNaN(parseInt(batteryFormState.cycleCount)) || parseInt(batteryFormState.cycleCount) < 0) errors.cycleCount = "Valid cycle count >= 0 is required.";
        if (batteryFormState.isListedForMarketplace) { if (!batteryFormState.listingType) errors.listingType = "Listing type is required."; if (batteryFormState.listingType === 'For Sale' && (!batteryFormState.listingPrice || isNaN(parseFloat(batteryFormState.listingPrice)) || parseFloat(batteryFormState.listingPrice) <= 0)) { errors.listingPrice = "A valid price is required if 'For Sale'."; }}
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveBattery = async () => {
        if (!validateForm()) {
            showAppNotification('Please correct form errors before saving.', 'error');
            return;
        }
        if (!isAuthenticated) {
            showAppNotification('Authentication required. Please log in to save battery data.', 'error');
            return;
        }

        const batteryDataToSend = {
            manufacturer: batteryFormState.manufacturer,
            model: batteryFormState.model,
            chemistry: batteryFormState.chemistry,
            originalCapacity: parseFloat(batteryFormState.originalCapacity),
            currentCapacity: parseFloat(batteryFormState.currentCapacity),
            manufactureDate: batteryFormState.manufactureDate,
            cycleCount: parseInt(batteryFormState.cycleCount, 10),
            status: batteryFormState.status || 'Operational',
            historyEvents: Array.isArray(batteryFormState.historyEvents) ? batteryFormState.historyEvents : [],
            isListedForMarketplace: batteryFormState.isListedForMarketplace || false,
            listingType: batteryFormState.isListedForMarketplace ? (batteryFormState.listingType || 'Seeking Offers') : null,
            listingPrice: batteryFormState.isListedForMarketplace && batteryFormState.listingPrice ? parseFloat(batteryFormState.listingPrice) : null,
            listingDescription: batteryFormState.listingDescription || '',
            location: batteryFormState.location || null,
            recommendedApplications: Array.isArray(batteryFormState.recommendedApplications) ? batteryFormState.recommendedApplications : [],
        };

        if (formMode === 'add') {
            delete batteryDataToSend.batteryId;
            delete batteryDataToSend.id;
        } else {
            delete batteryDataToSend.id;
        }

        const isEditMode = formMode === 'edit';
        // UPDATED: Use relative paths for endpoints
        const endpoint = isEditMode
            ? `/api/batteries/${batteryFormState.batteryId}`
            : `/api/batteries`;
        const method = isEditMode ? 'put' : 'post';

        try {
            // UPDATED: Use axios instance and remove headers
            const response = await axios({
                method: method,
                url: endpoint,
                data: batteryDataToSend,
            });

            const savedBatteryResponse = response.data;
            const savedBattery = { ...savedBatteryResponse, documents: savedBatteryResponse.documents || [] };

            setBatteries(prev => {
                const currentExampleBattery = prev.find(b => b.batteryId === exampleMarketplaceBattery.batteryId) ||
                                            {...exampleMarketplaceBattery, documents: exampleMarketplaceBattery.documents || []};
                let userBatteries = prev.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId);

                if (isEditMode) {
                    userBatteries = userBatteries.map(b => (b.batteryId === savedBattery.batteryId ? savedBattery : b));
                } else {
                    userBatteries = [savedBattery, ...userBatteries];
                }
                const finalUserBatteries = userBatteries.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId);
                return [currentExampleBattery, ...finalUserBatteries];
            });

            setSelectedBattery(savedBattery);
            setIsFormVisible(false);
            setFormMode('add');
            setBatteryFormState(initialBatteryFormState);
            setEventFormState(initialEventFormState);
            setFormErrors({});
            setSelectedTab('batteries');

            showAppNotification(
                isEditMode ? 'Battery updated successfully!' : 'Battery registered successfully! You can add documents in the details view.',
                'success'
            );

        } catch (error) {
            console.error('Error saving battery:', error.config?.url, error.response?.status, error.response?.data || error.message);
            const errorMsg = error.response?.data?.errors?.map(e => e.msg).join(', ') ||
                            error.response?.data?.msg ||
                            'Failed to save battery. Please check the details and try again.';
            showAppNotification(errorMsg, 'error');

            if (error.response?.data?.errors) {
                const backendErrors = {};
                error.response.data.errors.forEach(err => {
                    backendErrors[err.param || err.path || '_general'] = err.msg || err.message;
                });
                setFormErrors(prevErrors => ({ ...prevErrors, ...backendErrors }));
            }
        }
    };

    const handleOpenAddForm = () => {
        setFormMode('add');
        setBatteryFormState(initialBatteryFormState);
        setEventFormState(initialEventFormState);
        setFormErrors({});
        setIsFormVisible(true);
        setSelectedBattery(null);
        setSelectedTab('');
        setProfileUserIdToView(null);
        setFilesToUpload([]);
        setActiveConversationId(null);
        setActiveConversationParticipant(null);
        setActiveConversationBattery(null);
        setInvitationTokenFromUrl(null); // NEW: Clear invitation view
    };

    const handleOpenEditForm = (batteryToEdit) => {
        if (batteryToEdit.batteryId === exampleMarketplaceBattery.batteryId && currentUser?.id !== exampleMarketplaceBattery.ownerId) {
            showAppNotification('This example battery is for demonstration and cannot be edited by you.', 'info'); return;
        }
        setFormMode('edit');
        setBatteryFormState({
            ...initialBatteryFormState,
            ...batteryToEdit,
            id: batteryToEdit.id || batteryToEdit.batteryId,
            historyEvents: batteryToEdit.historyEvents || [],
            recommendedApplications: batteryToEdit.recommendedApplications || [],
            listingPrice: batteryToEdit.listingPrice || '',
            listingDescription: batteryToEdit.listingDescription || '',
            location: batteryToEdit.location || '',
        });
        setEventFormState(initialEventFormState);
        setFormErrors({});
        setIsFormVisible(true);
        setSelectedBattery(batteryToEdit);
        setSelectedTab('');
        setProfileUserIdToView(null);
        setFilesToUpload([]);
        setActiveConversationId(null);
        setActiveConversationParticipant(null);
        setActiveConversationBattery(null);
        setInvitationTokenFromUrl(null); // NEW: Clear invitation view
    };

    const handleCancelForm = () => {
        setIsFormVisible(false);
        setBatteryFormState(initialBatteryFormState);
        setEventFormState(initialEventFormState);
        setFormErrors({});
        setFilesToUpload([]);
        if (activeConversationId) {
            setSelectedTab('inbox');
        } else if (selectedBattery && selectedBattery.batteryId !== exampleMarketplaceBattery.batteryId) {
            setSelectedTab('batteries');
        } else {
            const userBatteriesExist = batteries.some(b => b.batteryId !== exampleMarketplaceBattery.batteryId);
            setSelectedTab(userBatteriesExist ? 'batteries' : 'dashboard');
             if (!(selectedBattery && selectedBattery.batteryId === exampleMarketplaceBattery.batteryId && selectedTab === 'marketplace')) {
                 setSelectedBattery(null);
            }
        }
    };

    const handleDeleteBattery = useCallback((battery) => {
        if (battery.batteryId === exampleMarketplaceBattery.batteryId) {
             showAppNotification('The example battery cannot be deleted.', 'info');
             return;
        }
        console.log("Step 1: handleDeleteBattery triggered for:", battery);
        setBatteryToDelete(battery);
        setShowDeleteConfirm(true);
    }, [showAppNotification]);

    const confirmDeleteBattery = useCallback(async () => {
        console.log("Step 2: confirmDeleteBattery triggered. State of batteryToDelete:", batteryToDelete);
        console.log("User authenticated:", !!(currentUser)); // We no longer need to check for the token variable here

        if (!batteryToDelete || !currentUser) {
            showAppNotification('No battery selected or user not authenticated.', 'error');
            console.error("Delete cancelled. Reason:", { hasBattery: !!batteryToDelete, hasUser: !!currentUser });
            setShowDeleteConfirm(false);
            return;
        }
        
        try {
            console.log(`Step 3: Sending DELETE request for batteryId: ${batteryToDelete.batteryId}`);
            await axios.delete(`/api/batteries/${batteryToDelete.batteryId}`);
            
            setBatteries(prev => prev.filter(b => b.batteryId !== batteryToDelete.batteryId));
            
            if (selectedBattery && selectedBattery.batteryId === batteryToDelete.batteryId) {
                setSelectedBattery(null);
            }
            showAppNotification('Battery deleted successfully.', 'success');
        } catch (error) {
            console.error('Error deleting battery:', error.response?.data || error.message);
            showAppNotification(error.response?.data?.msg || 'Failed to delete battery.', 'error');
        } finally {
            console.log("Step 4: Cleaning up delete state.");
            setShowDeleteConfirm(false);
            setBatteryToDelete(null);
        }
    }, [batteryToDelete, currentUser, batteries, selectedBattery, showAppNotification]); // The 'token' variable is removed from the dependency array

    const handleSelectBatteryListItem = (battery) => {
        if (battery.batteryId === exampleMarketplaceBattery.batteryId && selectedTab !== 'marketplace') {
            setSelectedTab('marketplace');
            setSelectedBattery(battery);
        } else {
            setSelectedBattery(battery);
            setSelectedTab('batteries');
        }
        setIsFormVisible(false);
        setProfileUserIdToView(null);
        setFilesToUpload([]);
        setActiveConversationId(null);
        setActiveConversationParticipant(null);
        setActiveConversationBattery(null);
        setInvitationTokenFromUrl(null); // NEW: Clear invitation view
    };

    const handleToggleListing = async (batteryToList) => {
      if (!isAuthenticated) {
            showAppNotification('Please log in to manage marketplace listings.', 'error');
            return;
        }
        if (batteryToList.batteryId === exampleMarketplaceBattery.batteryId) {
            showAppNotification('The example battery listing cannot be modified.', 'info');
            return;
        }

        const newListingStatus = !batteryToList.isListedForMarketplace;
        const optimisticUpdatedBattery = { ...batteryToList, isListedForMarketplace: newListingStatus };
        setBatteries(prev => prev.map(b => b.batteryId === batteryToList.batteryId ? optimisticUpdatedBattery : b));
        if (selectedBattery && selectedBattery.batteryId === batteryToList.batteryId) {
            setSelectedBattery(optimisticUpdatedBattery);
        }

        try {
            const batteryDataToSend = {
                ...batteryToList,
                isListedForMarketplace: newListingStatus,
                listingType: newListingStatus ? (batteryToList.listingType || 'Seeking Offers') : null,
                listingPrice: newListingStatus ? batteryToList.listingPrice : null,
                listingDescription: newListingStatus ? batteryToList.listingDescription : null,
            };
            delete batteryDataToSend.id;

            // UPDATED: Use axios instance, relative path, and remove headers
            await axios.put(`/api/batteries/${batteryToList.batteryId}`, batteryDataToSend);
            showAppNotification(`Battery ${newListingStatus ? 'listed on' : 'removed from'} marketplace.`, 'success');
        } catch (error) {
            console.error('Error toggling listing status:', error.response?.data || error.message);
            showAppNotification('Failed to update listing status.', 'error');
            setBatteries(prev => prev.map(b => b.batteryId === batteryToList.batteryId ? batteryToList : b));
            if (selectedBattery && selectedBattery.batteryId === batteryToList.batteryId) {
                setSelectedBattery(batteryToList);
            }
        }
    };

    const handleBulkDelete = useCallback(async (batteryIds) => {
        if (!currentUser) {
            showAppNotification('You must be logged in to perform this action.', 'error');
            return;
        }
        if (window.confirm(`Are you sure you want to delete ${batteryIds.length} selected batteries? This action cannot be undone.`)) {
            let successCount = 0;
            let errorCount = 0;

            const deletePromises = batteryIds.map(id =>
                axios.delete(`/api/batteries/${id}`).then(() => successCount++).catch(() => errorCount++)
            );
            
            await Promise.all(deletePromises);

            setBatteries(prev => prev.filter(b => !batteryIds.includes(b.batteryId)));
            if (selectedBattery && batteryIds.includes(selectedBattery.batteryId)) {
                setSelectedBattery(null);
            }

            if (errorCount > 0) {
                showAppNotification(`${successCount} batteries deleted. Failed to delete ${errorCount} batteries (likely due to permissions).`, 'error');
            } else {
                showAppNotification(`${successCount} batteries successfully deleted.`, 'success');
            }
        }
    }, [currentUser, showAppNotification, selectedBattery]);

    const handleBulkToggleListing = useCallback(async (batteryIds, shouldBeListed) => {
        if (!currentUser) {
            showAppNotification('You must be logged in to perform this action.', 'error');
            return;
        }
        
        let successCount = 0;
        let errorCount = 0;

        // Optimistic UI Update
        const originalBatteriesState = batteries;
        setBatteries(prev => prev.map(b => {
            if (batteryIds.includes(b.batteryId)) {
                return { ...b, isListedForMarketplace: shouldBeListed };
            }
            return b;
        }));

        const updatePromises = batteryIds.map(id => {
            const batteryToUpdate = originalBatteriesState.find(b => b.batteryId === id);
            if (!batteryToUpdate) return Promise.resolve(); // Should not happen

            const payload = {
                ...batteryToUpdate,
                isListedForMarketplace: shouldBeListed,
                listingType: shouldBeListed ? (batteryToUpdate.listingType || 'Seeking Offers') : null,
            };
            delete payload.id;

            return axios.put(`/api/batteries/${id}`, payload).then(() => successCount++).catch(() => errorCount++);
        });

        await Promise.all(updatePromises);
        
        // Refetch to ensure data consistency, especially if some updates failed
        const response = await axios.get(`/api/batteries`);
        if (Array.isArray(response.data)) {
            const fetchedUserBatteries = response.data.map(b => ({ ...b, documents: b.documents || [] }));
            const currentExampleBattery = originalBatteriesState.find(b => b.batteryId === exampleMarketplaceBattery.batteryId) ||
                                           {...exampleMarketplaceBattery, documents: exampleMarketplaceBattery.documents || []};
            setBatteries([currentExampleBattery, ...fetchedUserBatteries]);
        }


        if (errorCount > 0) {
            showAppNotification(`${successCount} listings updated. Failed to update ${errorCount} (check permissions).`, 'error');
        } else {
            showAppNotification(`Successfully updated ${successCount} marketplace listings.`, 'success');
        }

    }, [currentUser, showAppNotification, batteries]);
    
    const handleBulkExport = useCallback((batteryIds) => {
        const batteriesToExport = batteries.filter(b => batteryIds.includes(b.batteryId));
        if (batteriesToExport.length === 0) {
             showAppNotification('No valid batteries selected to export.', 'info');
             return;
        }
        if (!currentUser) {
            showAppNotification('Please log in to export reports.', 'error');
            return;
        }

        const doc = new jsPDF('p', 'pt', 'a4');
        const addBatteryPassportToDoc = (battery, doc, isFirstPage = true) => {
            // This function is identical to the one in your handleExportAllBatteries function
            // For brevity, I'm assuming it exists here. You can copy it from there.
            if (!isFirstPage) doc.addPage();
            const metrics = calculateMetrics(battery);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(`Battery Passport: ${battery.manufacturer} ${battery.model}`, 40, 50);
            // ... (rest of the passport generation logic)
             doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`ID: ${battery.batteryId}`, 40, 65);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Specifications", 40, 100);
            autoTable(doc,{
                startY: 110,
                body: [['Chemistry', battery.chemistry], ['Original Capacity', `${battery.originalCapacity} kWh`], ['Manufacture Date', new Date(battery.manufactureDate).toLocaleDateString()], ['Status', battery.status]],
                theme: 'plain', styles: { fontSize: 9 },
            });

            const healthMetricsY = doc.autoTable.previous.finalY + 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Health & Lifecycle Metrics", 40, healthMetricsY);
            autoTable(doc,{
                startY: healthMetricsY + 10,
                body: [['Current Capacity', `${battery.currentCapacity} kWh`], ['State of Health (SoH)', `${metrics.stateOfHealth}%`], ['Cycle Count', battery.cycleCount], ['Age', `${metrics.ageInYears} years`], ['Estimated RUL', `${metrics.estimatedRULYears} years`], ['Second Life Score', `${metrics.secondLifeScore}/100`], ['Failure Risk Score', `${metrics.failureRiskScore}/100`]],
                theme: 'plain', styles: { fontSize: 9 },
            });
        };

        batteriesToExport.forEach((battery, index) => {
            addBatteryPassportToDoc(battery, doc, index === 0);
        });
        
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });
        }

        doc.save(`VoltaLog_BulkExport_${new Date().toISOString().split('T')[0]}.pdf`);
        showAppNotification(`Exported PDF for ${batteriesToExport.length} batteries.`, 'success');
    }, [batteries, currentUser, showAppNotification, calculateMetrics]);    

    const exportDataAsPdf = (title, headers, data, baseFilename, orientation = 'p') => {
        if (!currentUser) {
            showAppNotification('Please log in to export reports.', 'error');
            return;
        }
        try {
            const doc = new jsPDF(orientation, 'pt', 'a4');
            // Header
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 40, 50);

            // Sub-header
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${APP_NAME} Report | Generated: ${new Date().toLocaleDateString()}`, 40, 65);
            doc.text(`Generated by: ${currentUser.username || 'N/A'} | Total Items: ${data.length}`, 40, 77);

            // Table
            autoTable(doc,{
                head: [headers],
                body: data,
                startY: 95,
                theme: 'striped',
                headStyles: { fillColor: [44, 62, 80] }, // Dark blue
                styles: { fontSize: 8 },
            });
            
            // Footer with page numbers
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });
            }

            doc.save(`${baseFilename}_${new Date().toISOString().split('T')[0]}.pdf`);
            showAppNotification('Report successfully generated and downloaded.', 'success');
        } catch (error) {
            console.error("Error generating PDF:", error);
            showAppNotification('Could not generate the report.', 'error');
        }
    };

    const handleExportSingleBatteryClick = () => {
        if (!selectedBattery) {
            showAppNotification('No battery selected to export.', 'error');
            return;
        }
        if (!currentUser) {
            showAppNotification('Please log in to export reports.', 'error');
            return;
        }
        
        const doc = new jsPDF('p', 'pt', 'a4');
        const addBatteryPassportToDoc = (battery, doc) => {
            const metrics = calculateMetrics(battery);
            
            // Header
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(`Battery Passport`, 40, 50);
            doc.setFontSize(12);
            doc.text(`${battery.manufacturer} ${battery.model}`, 40, 70);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`ID: ${battery.batteryId}`, 40, 85);

            // Basic Info Table
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Specifications", 40, 120);
            autoTable(doc,{
                startY: 130,
                body: [
                    ['Chemistry', battery.chemistry],
                    ['Original Capacity', `${battery.originalCapacity} kWh`],
                    ['Manufacture Date', new Date(battery.manufactureDate).toLocaleDateString()],
                    ['Status', battery.status],
                ],
                theme: 'plain', styles: { fontSize: 9 },
            });

            // Health Metrics Table
            const healthMetricsY = doc.autoTable.previous.finalY + 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Health & Lifecycle Metrics", 40, healthMetricsY);
            autoTable(doc,{
                startY: healthMetricsY + 10,
                body: [
                    ['Current Capacity', `${battery.currentCapacity} kWh`],
                    ['State of Health (SoH)', `${metrics.stateOfHealth}%`],
                    ['Cycle Count', battery.cycleCount],
                    ['Age', `${metrics.ageInYears} years`],
                    ['Estimated RUL', `${metrics.estimatedRULYears} years`],
                    ['Second Life Score', `${metrics.secondLifeScore}/100`],
                    ['Failure Risk Score', `${metrics.failureRiskScore}/100`],
                ],
                theme: 'plain', styles: { fontSize: 9 },
            });

            // History Events Table
            const historyY = doc.autoTable.previous.finalY + 20;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("History Events", 40, historyY);
             if (battery.historyEvents && battery.historyEvents.length > 0) {
                const historyHeaders = ["Date", "Event", "Type", "Location", "Notes"];
                const historyData = battery.historyEvents
                                        .slice()
                                        .sort((a,b) => new Date(b.date) - new Date(a.date))
                                        .map(e => [
                                            new Date(e.date).toLocaleDateString(),
                                            e.event,
                                            e.type,
                                            e.location,
                                            e.notes || ''
                                        ]);
                autoTable(doc,{
                    head: [historyHeaders],
                    body: historyData,
                    startY: historyY + 10,
                    theme: 'striped',
                    headStyles: { fillColor: [84, 153, 199] },
                    styles: { fontSize: 8 },
                });
            } else {
                 doc.setFontSize(10);
                 doc.setFont('helvetica', 'normal');
                 doc.text("No history events recorded.", 40, historyY + 20);
            }
        };

        addBatteryPassportToDoc(selectedBattery, doc);
        doc.save(`VoltaLog_Passport_${selectedBattery.batteryId}.pdf`);
        showAppNotification('Passport successfully generated.', 'success');
    };
    
    const handleExportFleetHealthSummary = () => {
        const userBatteries = batteries.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId);
        if (userBatteries.length === 0) {
             showAppNotification('No user batteries to summarize.', 'info');
             return;
        }
        
        const totalUserBatteries = userBatteries.length;
        const sumSoH = userBatteries.reduce((sum, battery) => sum + (calculateMetrics(battery).stateOfHealth || 0), 0);
        const averageHealth = totalUserBatteries > 0 ? Math.round(sumSoH / totalUserBatteries) : 0;
        const chemistryBreakdown = userBatteries.reduce((acc, b) => ({ ...acc, [b.chemistry]: (acc[b.chemistry] || 0) + 1 }), {});
        let excellent = 0, fair = 0, poor = 0;
        userBatteries.forEach(b => {
            const soh = calculateMetrics(b).stateOfHealth;
            if (soh >= 80) excellent++; else if (soh >= 60) fair++; else poor++;
        });

        const doc = new jsPDF('p', 'pt', 'a4');
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("Fleet Health Summary", 40, 50);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${APP_NAME} Report | Generated: ${new Date().toLocaleDateString()}`, 40, 65);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text("Overall Metrics", 40, 100);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Total User Batteries: ${totalUserBatteries}`, 40, 115);
        doc.text(`Average Fleet SoH: ${averageHealth}%`, 40, 130);
        doc.text(`High-Risk Batteries (>70 risk score): ${dashboardStats.highRiskCount}`, 40, 145);
        
        const healthData = [
            ["Excellent (SoH >= 80%)", excellent, `${totalUserBatteries > 0 ? Math.round((excellent / totalUserBatteries) * 100) : 0}%`],
            ["Fair (SoH 60-79%)", fair, `${totalUserBatteries > 0 ? Math.round((fair / totalUserBatteries) * 100) : 0}%`],
            ["Poor (SoH < 60%)", poor, `${totalUserBatteries > 0 ? Math.round((poor / totalUserBatteries) * 100) : 0}%`],
        ];
        autoTable(doc,{
            head: [['Health Category', 'Count', 'Percentage']],
            body: healthData,
            startY: 165,
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96] },
        });

        const chemistryData = Object.entries(chemistryBreakdown).map(([chem, count]) => [chem, count]);
        autoTable(doc,{
            head: [['Chemistry Type', 'Count']],
            body: chemistryData,
            startY: doc.autoTable.previous.finalY + 20,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] },
        });

        doc.save(`VoltaLog_FleetHealthSummary_${new Date().toISOString().split('T')[0]}.pdf`);
        showAppNotification('Fleet Health Summary successfully generated.', 'success');
    };

    const handleExportComplianceReport = () => {
        const userBatteries = batteries.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId);
        if (userBatteries.length === 0) {
             showAppNotification('No user batteries to include in the report.', 'info');
             return;
        }
        const headers = ["ID", "Model", "Chemistry", "UN 38.3 Status", "IATA Compliance", "Notes"];
        const data = userBatteries.map(b => {
            const isLfp = b.chemistry.includes("LiFePO4");
            return [
                b.batteryId,
                b.model,
                b.chemistry,
                "Pass (Mock Data)",
                isLfp ? "PI 965 Section II Compliant" : "PI 965 Section IB (Requires DGR)",
                "Documentation must accompany shipment. (Mock Data)"
            ];
        });
        exportDataAsPdf("Mock Transport Compliance Report", headers, data, "VoltaLog_ComplianceReport_Mock");
    };

    const handleExportInventoryReport = () => {
        const userBatteries = batteries.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId);
        if (userBatteries.length === 0) {
             showAppNotification('No user batteries to include in the report.', 'info');
             return;
        }
        const headers = ["ID", "Manufacturer", "Model", "Chemistry", "Status", "SoH (%)", "Cycle Count", "Age (Yrs)"];
        const data = userBatteries.map(b => {
            const metrics = calculateMetrics(b);
            return [
                b.batteryId,
                b.manufacturer,
                b.model,
                b.chemistry,
                b.status,
                metrics.stateOfHealth,
                b.cycleCount,
                metrics.ageInYears
            ];
        });
        exportDataAsPdf("Full Battery Inventory Report", headers, data, "VoltaLog_InventoryReport");
    };

    const handleExportEolProjections = () => {
        const userBatteries = batteries.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId);
        if (userBatteries.length === 0) {
             showAppNotification('No user batteries to include in the report.', 'info');
             return;
        }
        const headers = ["ID", "Model", "Est. RUL (Yrs)", "Failure Risk (/100)", "Projected EoL Date"];
        const data = userBatteries.map(b => {
            const metrics = calculateMetrics(b);
            const rulYears = parseFloat(metrics.estimatedRULYears);
            let eolDate = "N/A";
            if (!isNaN(rulYears)) {
                const eol = new Date();
                eol.setFullYear(eol.getFullYear() + Math.floor(rulYears));
                eol.setMonth(eol.getMonth() + (rulYears % 1) * 12);
                eolDate = eol.toLocaleDateString();
            }
            return [
                b.batteryId,
                b.model,
                metrics.estimatedRULYears,
                metrics.failureRiskScore,
                eolDate
            ];
        });
        exportDataAsPdf("End-of-Life Projections Report", headers, data, "VoltaLog_EoL_Projections");
    };

    const handleExportAllBatteries = () => {
        const userBatteries = batteries.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId);
        if (userBatteries.length === 0) {
             showAppNotification('No user batteries to export.', 'info');
             return;
        }
        if (!currentUser) {
            showAppNotification('Please log in to export reports.', 'error');
            return;
        }

        const doc = new jsPDF('p', 'pt', 'a4');
        const addBatteryPassportToDoc = (battery, doc, isFirstPage = true) => {
            if (!isFirstPage) doc.addPage();
            
            const metrics = calculateMetrics(battery);
            
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(`Battery Passport: ${battery.manufacturer} ${battery.model}`, 40, 50);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`ID: ${battery.batteryId}`, 40, 65);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Specifications", 40, 100);
            autoTable(doc,{
                startY: 110,
                body: [['Chemistry', battery.chemistry], ['Original Capacity', `${battery.originalCapacity} kWh`], ['Manufacture Date', new Date(battery.manufactureDate).toLocaleDateString()], ['Status', battery.status]],
                theme: 'plain', styles: { fontSize: 9 },
            });

            const healthMetricsY = doc.autoTable.previous.finalY + 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("Health & Lifecycle Metrics", 40, healthMetricsY);
            autoTable(doc,{
                startY: healthMetricsY + 10,
                body: [['Current Capacity', `${battery.currentCapacity} kWh`], ['State of Health (SoH)', `${metrics.stateOfHealth}%`], ['Cycle Count', battery.cycleCount], ['Age', `${metrics.ageInYears} years`], ['Estimated RUL', `${metrics.estimatedRULYears} years`], ['Second Life Score', `${metrics.secondLifeScore}/100`], ['Failure Risk Score', `${metrics.failureRiskScore}/100`]],
                theme: 'plain', styles: { fontSize: 9 },
            });

            const historyY = doc.autoTable.previous.finalY + 20;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text("History Events", 40, historyY);
             if (battery.historyEvents && battery.historyEvents.length > 0) {
                const historyHeaders = ["Date", "Event", "Type", "Location", "Notes"];
                const historyData = battery.historyEvents.slice().sort((a,b) => new Date(b.date) - new Date(a.date)).map(e => [new Date(e.date).toLocaleDateString(), e.event, e.type, e.location, e.notes || '']);
                doc.autoTable({ head: [historyHeaders], body: historyData, startY: historyY + 10, theme: 'striped', headStyles: { fillColor: [84, 153, 199] }, styles: { fontSize: 8 } });
            } else {
                 doc.setFontSize(10);
                 doc.setFont('helvetica', 'normal');
                 doc.text("No history events recorded.", 40, historyY + 20);
            }
        };

        userBatteries.forEach((battery, index) => {
            addBatteryPassportToDoc(battery, doc, index === 0);
        });
        
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });
        }

        doc.save(`VoltaLog_AllBatteryData_${new Date().toISOString().split('T')[0]}.pdf`);
        showAppNotification(`Exported data for ${userBatteries.length} batteries.`, 'success');
    };

    const handleResetAppData = () => {
        if (window.confirm("Are you sure you want to reset the application data in your browser? This will clear all user-added batteries from the current view but will NOT delete them from the server. You can get them back by reloading the page.")) {
            setBatteries([{ ...exampleMarketplaceBattery, documents: exampleMarketplaceBattery.documents || [] }]);
            setSelectedBattery(null);
            setSelectedTab('dashboard');
            showAppNotification("Local application data has been reset.", "success");
        }
    };

    const handleApplySavedSearchToMarketplace = useCallback((filters) => {
        setInitialMarketplaceFilters(filters);
        setSelectedTab('marketplace');
        setIsFormVisible(false);
        setProfileUserIdToView(null);
        setActiveConversationId(null);
        setActiveConversationParticipant(null);
        setActiveConversationBattery(null);
        setInvitationTokenFromUrl(null); // NEW: Clear invitation view
    }, []);

    const clearInitialMarketplaceFilters = useCallback(() => { setInitialMarketplaceFilters(null); }, []);

    const handleNavigateToUserProfile = useCallback((userIdToView) => {
        setProfileUserIdToView(userIdToView);
        setSelectedTab('userprofile');
        setIsFormVisible(false);
        setSelectedBattery(null);
        setFilesToUpload([]);
        setActiveConversationId(null);
        setActiveConversationParticipant(null);
        setActiveConversationBattery(null);
        setInvitationTokenFromUrl(null); // NEW: Clear invitation view
    }, []);
    const handleNavigateToEditProfile = () => {
        setSelectedTab('editprofile');
        setIsFormVisible(false);
        setProfileUserIdToView(null);
        setSelectedBattery(null);
        setFilesToUpload([]);
        setActiveConversationId(null);
        setActiveConversationParticipant(null);
        setActiveConversationBattery(null);
        setInvitationTokenFromUrl(null); // NEW: Clear invitation view
    };

    const handleFileSelection = (event) => {
        if (event.target.files) {
            setFilesToUpload(Array.from(event.target.files));
        }
    };

    const handleUploadDocuments = async (batteryIdForUpload) => {
        if (!batteryIdForUpload || filesToUpload.length === 0) {
            showAppNotification('Please select at least one file to upload.', 'info'); return;
        }
        if (!isAuthenticated) {
            showAppNotification('You must be logged in to upload documents.', 'error'); return;
        }
        if (batteryIdForUpload === exampleMarketplaceBattery.batteryId) {
            showAppNotification('Documents cannot be uploaded for the example battery.', 'info'); return;
        }
        const formData = new FormData();
        filesToUpload.forEach(file => { formData.append('batteryDocuments', file); });

        setIsUploading(true);
        try {
            // UPDATED: Use axios instance, relative path. Keep Content-Type header, remove Authorization.
            const response = await axios.post(`/api/batteries/${batteryIdForUpload}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            const updatedBatteryFromServer = { ...(response.data.battery), documents: response.data.battery.documents || [] };
            setBatteries(prev => prev.map(b => b.batteryId === updatedBatteryFromServer.batteryId ? updatedBatteryFromServer : b));
            if (selectedBattery && selectedBattery.batteryId === updatedBatteryFromServer.batteryId) {
                setSelectedBattery(updatedBatteryFromServer);
            }
            showAppNotification(`${response.data.uploadedDocuments?.length || 'Documents'} uploaded successfully!`, 'success');
            setFilesToUpload([]);
            const fileInputForm = document.getElementById('battery-document-upload-input-form');
            if (fileInputForm) fileInputForm.reset();
        } catch (error) {
            console.error('Error uploading documents:', error.response?.data || error.message);
            showAppNotification(error.response?.data?.msg || 'Failed to upload documents.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (batteryIdForDelete, documentId) => {
        if (!batteryIdForDelete || !documentId) return;
        if (!isAuthenticated) {
            showAppNotification('You must be logged in to delete documents.', 'error'); return;
        }
        if (batteryIdForDelete === exampleMarketplaceBattery.batteryId) {
            showAppNotification('Documents cannot be deleted for the example battery.', 'info'); return;
        }
        // UPDATED: Get base URL from axios config
        const API_URL_BASE = axios.defaults.baseURL;
        if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            try {
                // UPDATED: Use axios instance, relative path, and remove headers
                const response = await axios.delete(`/api/batteries/${batteryIdForDelete}/documents/${documentId}`);
                const updatedBatteryFromServer = { ...(response.data.battery), documents: response.data.battery.documents || [] };
                setBatteries(prev => prev.map(b => b.batteryId === updatedBatteryFromServer.batteryId ? updatedBatteryFromServer : b));
                if (selectedBattery && selectedBattery.batteryId === updatedBatteryFromServer.batteryId) {
                    setSelectedBattery(updatedBatteryFromServer);
                }
                showAppNotification(response.data.msg || 'Document deleted successfully.', 'success');
            } catch (error) {
                console.error('Error deleting document:', error.response?.data || error.message);
                showAppNotification(error.response?.data?.msg || 'Failed to delete document.', 'error');
            }
        }
    };

    const handleSelectConversation = useCallback((conversationId, otherParticipant, relatedBattery) => {
        setActiveConversationId(conversationId);
        setActiveConversationParticipant(otherParticipant);
        setActiveConversationBattery(relatedBattery);
        setSelectedTab('inbox');
        setIsFormVisible(false);
        setSelectedBattery(null);
        setProfileUserIdToView(null);
        setInvitationTokenFromUrl(null); // NEW: Clear invitation view
    }, []);

    const handleBackToInbox = useCallback(() => {
        setActiveConversationId(null);
        setActiveConversationParticipant(null);
        setActiveConversationBattery(null);
        setSelectedTab('inbox');
    }, []);

    const handleInitiateConversation = useCallback(async (recipientUserId, relatedBatteryData = null) => {
        if (!isAuthenticated) {
            showAppNotification('Please log in to start a conversation.', 'error');
            return;
        }
        if (currentUser.userId === recipientUserId) {
            showAppNotification('You cannot start a conversation with yourself.', 'info');
            return;
        }

        setIsInitiatingConversation(true);
        try {
            // UPDATED: Use axios instance, relative path, and remove headers
            const response = await axios.post(
                `/api/messaging/conversations/findOrCreate`,
                {
                    recipientId: recipientUserId,
                    batteryId: relatedBatteryData ? relatedBatteryData.batteryId : null,
                    initialMessage: '', 
                    relatedBatteryInfo: relatedBatteryData ? {
                        manufacturer: relatedBatteryData.manufacturer,
                        model: relatedBatteryData.model,
                        batteryId: relatedBatteryData.batteryId
                    } : null
                }
            );

            const conversationResponseData = response.data;

            if (conversationResponseData && conversationResponseData.conversationId) {
                const otherParticipant = conversationResponseData.participants?.find(p => p.userId !== currentUser.userid);
                
                if (!otherParticipant) {
                    console.error("Other participant not found in conversation response:", conversationResponseData.participants);
                    showAppNotification('Error processing conversation participants.', 'error');
                    setIsInitiatingConversation(false);
                    return;
                }
                
                const batteryForConversation = conversationResponseData.relatedBattery || relatedBatteryData;

                handleSelectConversation(
                    conversationResponseData.conversationId, 
                    otherParticipant,
                    batteryForConversation
                );
            } else {
                showAppNotification('Could not start or find conversation.', 'error');
            }
        } catch (error) {
            console.error('Error initiating conversation (MainAppLayout):', error.response?.data || error.message);
            showAppNotification(error.response?.data?.msg || 'Failed to initiate conversation. See console for details.', 'error');
        } finally {
            setIsInitiatingConversation(false);
        }
    }, [currentUser, token, showAppNotification, handleSelectConversation]);

    const handleAccountDeletionRequested = useCallback(async () => {
        if (!isAuthenticated) {
            showAppNotification('You must be logged in to delete your account.', 'error');
            return false;
        }

        try {
            // UPDATED: Use axios instance, relative path, and remove headers
            const response = await axios.delete(`/api/profile/delete`);

            if (response.status === 200 || response.status === 204) {
                showAppNotification('Account deleted successfully. You will now be logged out.', 'success', 5000);
                setTimeout(() => {
                    logout();
                }, 1500); 
                return true;
            } else {
                 showAppNotification(response.data?.msg || 'Account deletion request failed. Please try again.', 'error');
                 return false;
            }
        } catch (error) {
            console.error('Error deleting account:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.msg || 'Failed to delete account. Please try again later.';
            showAppNotification(errorMsg, 'error');
            return false;
        }
    }, [currentUser, token, showAppNotification, logout]);


    const baseTextClass = theme === 'dark' ? 'text-slate-300' : 'text-gray-700';
    const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-200';
    const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-900';
    const placeholderClass = theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-gray-400';
    const primaryButtonClass = `px-4 py-2 text-white rounded-md transition-colors focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`;
    const secondaryButtonClass = `px-4 py-2 border rounded-md transition-colors ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
    const destructiveButtonClass = `px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-opacity-50`;
    const marketplaceButtonClass = `px-4 py-2 text-white rounded-md transition-colors focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'}`;

    const handleCompanyCreated = useCallback(() => {
        // The CreateCompanyPage handles refreshing the user data.
        // This function's only job is to switch the active view.
        setSelectedTab('companymanagement');
    }, []);

    // NEW: Function to handle successful invitation acceptance
    const handleInvitationAccepted = useCallback(() => {
        // Refresh user data to get new company info
        if (refreshCurrentUser) refreshCurrentUser();
        // Clear the token from the state and URL
        setInvitationTokenFromUrl(null);
        window.history.pushState({}, '', '/'); // Reset URL
        // Navigate to the new company management page
        setSelectedTab('companymanagement');
    }, [refreshCurrentUser]);


    const renderDashboardView = () => (
        <div className="space-y-8">
            <h2 className={`text-3xl font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>Marketplace Dashboard</h2>
            {/* Marketplace at a Glance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardStatCard icon={<Store size={24} />} title="Total Listings" value={marketplaceStats.totalListings} color="blue" theme={theme} />
                <DashboardStatCard icon={<Tag size={24} />} title="Total Value" value={`$${marketplaceStats.totalValue.toLocaleString()}`} color="emerald" theme={theme} />
                <DashboardStatCard icon={<Battery size={24} />} title="Popular Chemistry" value={marketplaceStats.popularChemistry} color="purple" theme={theme} />
                <DashboardStatCard icon={<TrendingUp size={24} />} title="Most Searched" value={marketplaceStats.mostSearched} color="teal" theme={theme} />
            </div>

            {/* Your Marketplace Activity */}
            <div className={`p-6 rounded-lg shadow ${cardBgClass} ${borderClass}`}>
                <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>Your Marketplace Activity</h3>
                <div className="flex flex-wrap gap-4 mb-4">
                    <button onClick={handleOpenAddForm} className={`${primaryButtonClass} flex items-center`}>
                        <Plus size={18} className="mr-2"/> List a Battery
                    </button>
                    <button onClick={() => { setSelectedTab('marketplace'); setProfileUserIdToView(null); setSelectedBattery(null); setActiveConversationId(null);}} className={`${secondaryButtonClass} flex items-center`}>
                        <Store size={18} className="mr-2"/> Go to Marketplace
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-slate-400">
                                <th className="px-2 py-1 text-left">Battery</th>
                                <th className="px-2 py-1 text-left">Status</th>
                                <th className="px-2 py-1 text-left">Price</th>
                                <th className="px-2 py-1 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userListings.length > 0 ? userListings.map(listing => (
                                <tr key={listing.batteryId} className="border-b border-slate-700">
                                    <td className="px-2 py-1">{listing.manufacturer} {listing.model}</td>
                                    <td className="px-2 py-1">{listing.status}</td>
                                    <td className="px-2 py-1">${listing.listingPrice}</td>
                                    <td className="px-2 py-1">
                                        <button onClick={() => handleSelectBatteryListItem(listing)} className={`${secondaryButtonClass} text-xs py-1 px-2`}>View</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="text-slate-400 py-2">You have no active listings.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Marketplace Insights */}
            <div className={`p-6 rounded-lg shadow ${cardBgClass} ${borderClass}`}>
                <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>Marketplace Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium mb-2 text-slate-300">Price Trends</h4>
                        <div className="text-slate-400 text-sm mb-2">Avg. price by chemistry (last 30 days):</div>
                        <ul className="space-y-1">
                            {marketplaceStats.priceTrends.map(trend => (
                                <li key={trend.chemistry} className="flex justify-between">
                                    <span>{trend.chemistry}</span>
                                    <span>${trend.avgPrice}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium mb-2 text-slate-300">Hot Listings</h4>
                        <div className="text-slate-400 text-sm mb-2">Most viewed/inquired batteries:</div>
                        <ul className="space-y-1">
                            {marketplaceStats.hotListings.map(listing => (
                                <li key={listing.batteryId} className="flex justify-between">
                                    <span>{listing.manufacturer} {listing.model}</span>
                                    <span>${listing.listingPrice}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Recently Listed on Marketplace */}
            <div className={`p-6 rounded-lg shadow ${cardBgClass} ${borderClass}`}>
                <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>Recently Listed on Marketplace</h3>
                {marketplaceStats.recentListings.length > 0 ?
                    marketplaceStats.recentListings.slice(0, 5).map(b => (
                        <div key={b.batteryId} className={`flex justify-between items-center p-3 mb-2 rounded ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} border ${borderClass}`}>
                            <div>
                                <p className={`font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>{b.manufacturer} {b.model}</p>
                                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>ID: {b.batteryId} - SoH: {b.stateOfHealth}%</p>
                            </div>
                            <button onClick={() => handleSelectBatteryListItem(b)} className={`${secondaryButtonClass} text-sm py-1.5 px-3`}>View Details</button>
                        </div>
                    )) : <p className={baseTextClass}>No marketplace listings yet. Be the first to list a battery!</p>}
            </div>
        </div>
    );
    const renderBatteryDetailsView = () => (
        <>
            {selectedBattery ? (
                <>
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                                <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>{selectedBattery.manufacturer} {selectedBattery.model}</h2>
                                <p className={`${baseTextClass} mt-1`}>ID: {selectedBattery.batteryId || selectedBattery.id} &bull; {selectedBattery.chemistry} Chemistry</p>
                            </div>
                            <div className="flex space-x-2 flex-wrap gap-2 sm:gap-0">
                                {(selectedBattery.batteryId !== exampleMarketplaceBattery.batteryId || (selectedBattery.ownerId === currentUser?.id)) && (
                                    <>
                                    <button
                                        onClick={() => handleToggleListing(selectedBattery)}
                                        className={`${selectedBattery.isListedForMarketplace ? secondaryButtonClass : marketplaceButtonClass} flex items-center text-sm py-1.5 px-3`}
                                    >
                                        <Tag size={16} className="mr-1.5" />
                                        {selectedBattery.isListedForMarketplace ? 'Unlist' : 'List on Marketplace'}
                                    </button>
                                    <button onClick={() => handleOpenEditForm(selectedBattery)} className={`${secondaryButtonClass} flex items-center text-sm py-1.5 px-3`}>
                                        <Edit3 size={16} className="mr-1.5" /> Edit{selectedBattery.isListedForMarketplace ? ' & Listing' : ''}
                                    </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={`${cardBgClass} rounded-lg shadow mb-6`}>
                        <div className={`p-4 sm:p-6 border-b ${borderClass}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${theme === 'dark' ? (selectedBattery.status === "Operational" ? 'bg-green-700 text-green-200' : 'bg-yellow-700 text-yellow-200') : (selectedBattery.status === "Operational" ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}`}>
                                            {selectedBattery.status || 'Operational'}
                                        </span>
                                        {selectedBattery.isListedForMarketplace && (
                                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${theme === 'dark' ? 'bg-emerald-700 text-emerald-200' : 'bg-emerald-100 text-emerald-800'}`}>
                                                Listed: {selectedBattery.listingType}
                                            </span>
                                        )}
                                    </div>
                                    {selectedBattery.isListedForMarketplace && selectedBattery.listingPrice && (
                                        <p className={`mt-1 font-semibold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                            Price: ${parseFloat(selectedBattery.listingPrice).toLocaleString()}
                                        </p>
                                    )}
                                     {selectedBattery.isListedForMarketplace && selectedBattery.listingDescription && (
                                        <p className={`mt-1 text-sm ${baseTextClass}`}>
                                            Description: {selectedBattery.listingDescription}
                                        </p>
                                    )}
                                </div>
                                <div className="flex space-x-2 mt-3 sm:mt-0">
                                    <button onClick={handleExportSingleBatteryClick} className={`${primaryButtonClass} text-sm py-1.5 px-3`}>Export Passport (PDF)</button>
                                    {(selectedBattery.batteryId !== exampleMarketplaceBattery.batteryId || (selectedBattery.ownerId === currentUser?.id)) && (
                                        <button onClick={() => handleDeleteBattery(selectedBattery)}
                                            className={`px-3 py-1.5 border ${theme === 'dark' ? 'border-red-500 text-red-400 hover:bg-red-500 hover:text-white' : 'border-red-300 text-red-600 hover:bg-red-100'} rounded flex items-center text-sm`}>
                                            <Trash2 size={16} className="mr-1" /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {(() => {
                            const metrics = calculateMetrics(selectedBattery);
                            return (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 sm:p-6">
                                    <MetricDisplayCard icon={<Activity />} value={`${metrics.stateOfHealth}%`} label="SoH" color="blue" theme={theme}/>
                                    <MetricDisplayCard icon={<Award />} value={`${metrics.secondLifeScore}/100`} label="Second Life Score" color="green" theme={theme}/>
                                    <MetricDisplayCard icon={<Zap />} value={`${selectedBattery.currentCapacity} kWh`} label="Current Capacity" color="purple" theme={theme}/>
                                    <MetricDisplayCard icon={<Clock />} value={`${selectedBattery.cycleCount}`} label="Cycle Count" color="orange" theme={theme}/>
                                    <MetricDisplayCard icon={<TrendingUp />} value={`${metrics.estimatedRULYears} yrs`} label="Est. RUL" color="teal" theme={theme}/>
                                    <MetricDisplayCard icon={<ShieldCheck />} value={`${metrics.failureRiskScore}/100`} label="Failure Risk Score" color="red" theme={theme}/>
                                    <MetricDisplayCard icon={<Thermometer />} value={`${metrics.ageInYears} yrs`} label="Age" color="sky" theme={theme} />
                                    <MetricDisplayCard icon={<BarChart3 />} value={`${metrics.degradationRatePercentPer1kCycles}%`} label="1k Cycle Degradation" color="yellow" theme={theme}/>
                                </div>
                            );
                        })()}
                        <div className={`p-4 sm:p-6 border-t ${borderClass}`}>
                            <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'} mb-3`}>History Events</h4>
                            {(selectedBattery.historyEvents && selectedBattery.historyEvents.length > 0) ? (
                                <div className="relative max-h-60 overflow-y-auto pr-2">
                                    {selectedBattery.historyEvents.slice().sort((a,b) => new Date(b.date) - new Date(a.date)).map((event, index, arr) => (
                                        <div key={event.id || `${event.date}-${index}-${event.event}`} className="mb-4 flex">
                                            <div className="flex flex-col items-center mr-3">
                                                <div className={`w-3 h-3 rounded-full z-10 ${
                                                    event.type === 'Incident' ? (theme === 'dark' ? 'bg-red-500' : 'bg-red-600') :
                                                    event.type === 'Maintenance' ? (theme === 'dark' ? 'bg-yellow-500' : 'bg-yellow-600') :
                                                    (theme === 'dark' ? 'bg-blue-400' : 'bg-blue-600')
                                                }`}></div>
                                                {index < arr.length - 1 && (
                                                    <div className={`w-0.5 flex-grow ${theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>
                                                    {event.event}
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 ${theme === 'dark' ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
                                                        {event.type || 'General'}
                                                    </span>
                                                </p>
                                                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    {new Date(event.date).toLocaleDateString()}
                                                    {event.location && ` • ${event.location}`}
                                                </p>
                                                {event.notes && (
                                                    <p className={`text-xs italic ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'} mt-0.5`}>
                                                        Notes: {event.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className={`${baseTextClass} text-sm`}>No history events recorded.</p>}
                        </div>

                        <div className={`p-4 sm:p-6 border-t ${borderClass}`}>
                            <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'} mb-3`}>
                                Attached Documents
                            </h4>
                            {(!selectedBattery.documents || selectedBattery.documents.length === 0) && (
                                <p className={`${baseTextClass} text-sm`}>No documents attached to this battery yet.</p>
                            )}
                            {selectedBattery.documents && selectedBattery.documents.length > 0 && (
                                <ul className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                                    {selectedBattery.documents.map(doc => (
                                        <li key={doc.id} className={`flex items-center justify-between p-2.5 rounded-md ${theme === 'dark' ? 'bg-slate-700/60' : 'bg-gray-100'} border ${borderClass}`}>
                                            <div className="flex items-center space-x-2 overflow-hidden">
                                                <Paperclip size={18} className={theme === 'dark' ? 'text-slate-400' : 'text-gray-500'} />
                                                <a
                                                    href={`${axios.defaults.baseURL}/uploads/${doc.path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={`View ${doc.originalName}`}
                                                    className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} truncate`}
                                                >
                                                    {doc.originalName}
                                                </a>
                                                <span className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>
                                                    ({(doc.size / 1024).toFixed(1)} KB)
                                                </span>
                                            </div>
                                            {currentUser && selectedBattery.ownerId === currentUser.userid && selectedBattery.batteryId !== exampleMarketplaceBattery.batteryId && (
                                                <button
                                                    onClick={() => handleDeleteDocument(selectedBattery.batteryId, doc.id)}
                                                    title="Delete document"
                                                    className={`p-1 rounded-full ${theme === 'dark' ? 'text-red-500 hover:bg-red-700/20 hover:text-red-400' : 'text-red-600 hover:bg-red-200 hover:text-red-700'} transition-colors`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {currentUser && selectedBattery.ownerId === currentUser.userid && selectedBattery.batteryId !== exampleMarketplaceBattery.batteryId && (
                                <div className={`mt-3 pt-3 border-t ${borderClass}`}>
                                    <h5 className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-gray-700'} mb-1.5`}>
                                        Upload New Documents (Max 5 files, 10MB each)
                                    </h5>
                                    <form id="battery-document-upload-input-form">
                                        <input
                                            id="battery-document-upload-input"
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.heic,.heif"
                                            onChange={handleFileSelection}
                                            className={`block w-full text-xs ${baseTextClass} file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold ${theme === 'dark' ? 'file:bg-slate-600 file:text-slate-300 hover:file:bg-slate-500' : 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'} mb-2`}
                                        />
                                    </form>
                                    {filesToUpload.length > 0 && (
                                        <div className="mb-2">
                                        {filesToUpload.map((file, index) => (
                                            <p key={index} className={`${baseTextClass} text-xs`}>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                                        ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleUploadDocuments(selectedBattery.batteryId)}
                                        disabled={isUploading || filesToUpload.length === 0}
                                        className={`px-3 py-1.5 text-white rounded-md transition-colors text-sm focus:ring-2 focus:ring-opacity-50 flex items-center ${isUploading || filesToUpload.length === 0 ? (theme === 'dark' ? 'bg-slate-500 cursor-not-allowed' : 'bg-gray-400 cursor-not-allowed') : (theme === 'dark' ? 'bg-green-600 hover:bg-green-500 focus:ring-green-400' : 'bg-green-500 hover:bg-green-600 focus:ring-green-500')}`}
                                    >
                                        <UploadCloud size={16} className="mr-1.5" />
                                        {isUploading ? 'Uploading...' : `Upload ${filesToUpload.length > 0 ? filesToUpload.length + ' File(s)' : ''}`}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className={`p-4 sm:p-6 border-t ${borderClass}`}>
                            <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'} mb-3`}>Recommended Second Life Applications</h4>
                            {(calculateMetrics(selectedBattery).recommendedUses && calculateMetrics(selectedBattery).recommendedUses.length > 0) ? (
                                <div className="flex flex-wrap gap-2">
                                    {calculateMetrics(selectedBattery).recommendedUses.map((use, index) => (
                                        <span key={index} className={`text-xs px-2.5 py-1 rounded-full ${theme === 'dark' ? 'bg-slate-600 text-slate-200' : 'bg-gray-200 text-gray-700'}`}>
                                            {use}
                                        </span>
                                    ))}
                                </div>
                            ) : <p className={`${baseTextClass} text-sm`}>No specific recommendations available.</p>}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <Battery size={64} className={`${theme === 'dark' ? 'text-slate-600' : 'text-gray-400'} mb-4`} />
                    <h3 className={`text-xl font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-gray-700'} mb-2`}>No Battery Selected</h3>
                    <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'} mb-6 max-w-md`}>Select a battery from the list to view its details or register a new one.</p>
                </div>
            )}
        </>
    );
    const renderBatteryForm = () => (
        <div className={`${cardBgClass} rounded-lg shadow p-6 sm:p-8`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>{formMode === 'add' ? 'Register New Battery' : 'Edit Battery Details'}</h2>
                    <p className={baseTextClass}>Enter all relevant information for the battery.</p>
                </div>
                <button onClick={handleCancelForm} className={`${theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}>
                    <XCircle size={24} />
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {[
                    { label: "Battery ID", name: "batteryIdDisplay", type: "text", value: formMode === 'edit' ? batteryFormState.batteryId : '(Auto-generated by server)', disabled: true },
                    { label: "Manufacturer", name: "manufacturer", type: "text", placeholder: "e.g. EnergyCell Tech", required: true },
                    { label: "Model", name: "model", type: "text", placeholder: "e.g. EC-75X", required: true },
                    { label: "Chemistry", name: "chemistry", type: "select", options: ["LiFePO4", "NMC", "LTO", "LCO", "NCA"], required: true },
                    { label: "Original Capacity (kWh)", name: "originalCapacity", type: "number", placeholder: "e.g. 75", required: true, step: "0.1", min:"0" },
                    { label: "Current Capacity (kWh)", name: "currentCapacity", type: "number", placeholder: "e.g. 68.2", required: true, step: "0.1", min:"0" },
                    { label: "Manufacture Date", name: "manufactureDate", type: "date", required: true },
                    { label: "Cycle Count", name: "cycleCount", type: "number", placeholder: "e.g. 387", required: true, min:"0", step:"1" },
                    { label: "Status", name: "status", type: "select", options: ["Operational", "In Storage", "Maintenance", "EOL - Pending Recycle", "EOL - Recycled"], required: true },
                ].map(field => (
                    <div key={field.name}>
                        <label htmlFor={field.name} className={`block text-sm font-medium mb-1 ${baseTextClass}`}>
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        { field.type === 'select' ? (
                            <select id={field.name} name={field.name} value={batteryFormState[field.name] || (field.name === 'chemistry' ? 'LiFePO4' : field.name === 'status' ? 'Operational' : '')} onChange={handleBatteryFormChange}
                                className={`w-full p-2.5 border rounded-md shadow-sm ${inputBgClass} ${formErrors[field.name] ? 'border-red-500' : borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}>
                                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        ) : (
                            <input type={field.type} id={field.name} name={field.name} value={field.value !== undefined ? field.value : (batteryFormState[field.name] || '')} onChange={field.disabled ? undefined : handleBatteryFormChange}
                                className={`w-full p-2.5 border rounded-md shadow-sm ${inputBgClass} ${formErrors[field.name] ? 'border-red-500' : borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500 ${field.disabled ? (theme === 'dark' ? 'bg-slate-600/30 text-slate-500 italic' : 'bg-gray-200/50 text-gray-500 italic') : ''}`}
                                placeholder={field.placeholder} disabled={field.disabled} step={field.step} min={field.min}
                            />
                        )}
                        {formErrors[field.name] && <p className="text-red-500 text-xs mt-1">{formErrors[field.name]}</p>}
                    </div>
                ))}
            </div>

            {(formMode === 'add' || (formMode ==='edit' && batteryFormState.ownerId === currentUser?.id && batteryFormState.batteryId !== exampleMarketplaceBattery.batteryId)) && (
                 <div className={`mt-8 pt-6 border-t ${borderClass}`}>
                    <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'} mb-3`}>Marketplace Listing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <label htmlFor="isListedForMarketplace" className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="isListedForMarketplace" name="isListedForMarketplace" checked={batteryFormState.isListedForMarketplace || false} onChange={handleBatteryFormChange}
                                    className={`h-4 w-4 rounded ${theme === 'dark' ? 'bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-600' : 'border-gray-300 text-blue-600 focus:ring-blue-500'}`}/>
                                <span className={baseTextClass}>List this battery on the marketplace</span>
                            </label>
                        </div>
                        {batteryFormState.isListedForMarketplace && (
                            <>
                                <div>
                                    <label htmlFor="listingType" className={`block text-sm font-medium mb-1 ${baseTextClass}`}>Listing Type <span className="text-red-500">*</span></label>
                                    <select id="listingType" name="listingType" value={batteryFormState.listingType || 'Seeking Offers'} onChange={handleBatteryFormChange}
                                        className={`w-full p-2.5 border rounded-md shadow-sm ${inputBgClass} ${formErrors.listingType ? 'border-red-500' : borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}>
                                        <option value="Seeking Offers">Seeking Offers</option><option value="For Sale">For Sale</option><option value="For Lease">For Lease/BaaS</option>
                                    </select>
                                    {formErrors.listingType && <p className="text-red-500 text-xs mt-1">{formErrors.listingType}</p>}
                                </div>
                                {batteryFormState.listingType === 'For Sale' && (
                                    <div>
                                        <label htmlFor="listingPrice" className={`block text-sm font-medium mb-1 ${baseTextClass}`}>Listing Price ($) <span className="text-red-500">*</span></label>
                                        <input type="number" id="listingPrice" name="listingPrice" value={batteryFormState.listingPrice || ''} onChange={handleBatteryFormChange} placeholder="e.g. 1500" step="0.01" min="0"
                                            className={`w-full p-2.5 border rounded-md shadow-sm ${inputBgClass} ${formErrors.listingPrice ? 'border-red-500' : borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                                        {formErrors.listingPrice && <p className="text-red-500 text-xs mt-1">{formErrors.listingPrice}</p>}
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <label htmlFor="listingDescription" className={`block text-sm font-medium mb-1 ${baseTextClass}`}>Listing Description (Optional)</label>
                                    <textarea id="listingDescription" name="listingDescription" value={batteryFormState.listingDescription || ''} onChange={handleBatteryFormChange} rows="3" placeholder="e.g. Ideal for residential solar backup..."
                                        className={`w-full p-2.5 border rounded-md shadow-sm ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}></textarea>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            <div className={`mt-8 pt-6 border-t ${borderClass}`}>
                <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'} mb-3`}>History Events</h3>
                 {(batteryFormState.historyEvents && batteryFormState.historyEvents.length > 0) && (
                    <div className={`mb-4 p-4 rounded-lg max-h-60 overflow-y-auto ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'} border ${borderClass}`}>
                        {batteryFormState.historyEvents.map((event) => (
                            <div key={event.id || event.date+event.event} className={`flex items-center justify-between mb-2 pb-2 border-b ${borderClass} last:border-0 last:pb-0`}>
                                <div>
                                    <p className={`font-medium ${baseTextClass}`}>{event.event} <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1 ${theme === 'dark' ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>{event.type}</span></p>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{new Date(event.date).toLocaleDateString()} • {event.location}</p>
                                    {event.notes && <p className={`text-xs italic ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'} mt-0.5`}>Notes: {event.notes}</p>}
                                </div>
                                <button onClick={() => removeEventFromForm(event.id)} className={`${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'} transition-colors`}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${baseTextClass}`}>Event Date</label>
                        <input type="date" name="date" value={eventFormState.date} onChange={handleEventFormChange} className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${baseTextClass}`}>Event Type</label>
                        <select name="type" value={eventFormState.type} onChange={handleEventFormChange} className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}>
                            <option>Routine Check</option><option>Maintenance</option><option>Deployment</option><option>Storage</option><option>Capacity Test</option><option>Firmware Update</option><option>Incident</option><option>EOL Processing</option>
                        </select>
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${baseTextClass}`}>Event Description</label>
                        <input type="text" name="event" value={eventFormState.event} onChange={handleEventFormChange} placeholder="e.g. Annual Inspection" className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                    </div>
                    <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-1 ${baseTextClass}`}>Location</label>
                        <input type="text" name="location" value={eventFormState.location} onChange={handleEventFormChange} placeholder="e.g. Site A, Bay 3" className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                    </div>
                     <div className="lg:col-span-3">
                        <label className={`block text-sm font-medium mb-1 ${baseTextClass}`}>Event Notes (Optional)</label>
                        <input type="text" name="notes" value={eventFormState.notes} onChange={handleEventFormChange} placeholder="e.g. All systems nominal." className={`w-full p-2.5 border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                    </div>
                    <div className="lg:col-span-3">
                        <button type="button" onClick={handleAddEventToForm} className={`${secondaryButtonClass} flex items-center w-full md:w-auto justify-center`}><Plus size={16} className="mr-2" /> Add Event to Form</button>
                    </div>
                </div>
            </div>
            {formErrors._general && <p className="text-red-500 text-sm mt-4 text-center">{formErrors._general}</p>}
            <div className="mt-8 flex space-x-4">
                <button type="button" onClick={handleSaveBattery} className={`${primaryButtonClass} flex items-center`}><Save size={16} className="mr-2" /> {formMode === 'add' ? 'Save Battery' : 'Update Battery'}</button>
                <button type="button" onClick={handleCancelForm} className={secondaryButtonClass}>Cancel</button>
            </div>
        </div>
    );

    const renderMainContent = () => {
        // NEW: Prioritize invitation acceptance view
        if (invitationTokenFromUrl) {
            return (
                <AcceptInvitationPage
                    invitationToken={invitationTokenFromUrl}
                    theme={theme}
                    showAppNotification={showAppNotification}
                    onInvitationAccepted={handleInvitationAccepted}
                />
            );
        }

        if (isInitiatingConversation) {
            return (
                <div className={`p-6 ${cardBgClass} rounded-lg shadow text-center flex flex-col justify-center items-center h-full`}>
                    <MessageSquare size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'} animate-pulse`} />
                    <p className={baseTextClass}>Loading conversation...</p>
                </div>
            );
        }
        if (isFormVisible) return renderBatteryForm();

        switch (selectedTab) {
            case 'dashboard': return renderDashboardView();
            case 'batteries':
                if (selectedBattery && selectedBattery.batteryId !== exampleMarketplaceBattery.batteryId && !isFormVisible) {
                    return renderBatteryDetailsView();
                } else if (selectedBattery && selectedBattery.batteryId === exampleMarketplaceBattery.batteryId && !isFormVisible) {
                    return renderBatteryDetailsView();
                }
                return ( <MyBatteriesComponent
                                batteries={batteries.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId)}
                                onSelectBattery={handleSelectBatteryListItem}
                                onAddNew={handleOpenAddForm}
                                onDeleteBattery={handleDeleteBattery}
                                calculateMetrics={calculateMetrics}
                                theme={theme}
                                currentUser={currentUser}
                                // NEW PROPS FOR ADVANCED FEATURES
                                onEditBattery={handleOpenEditForm}
                                onToggleListing={handleToggleListing}
                                onExportBattery={(b) => {
                                    // Temporarily set selectedBattery to export the correct one
                                    const originalSelected = selectedBattery;
                                    setSelectedBattery(b);
                                    // Use a timeout to ensure state update before calling the export function
                                    setTimeout(() => {
                                        handleExportSingleBatteryClick();
                                        setSelectedBattery(originalSelected); // Restore original selection
                                    }, 0);
                                }}
                                onBulkDelete={handleBulkDelete}
                                onBulkToggleListing={handleBulkToggleListing}
                                onBulkExport={handleBulkExport}
                           /> );
            case 'marketplace':
                return <MarketplaceComponent
                            onSelectBattery={handleSelectBatteryListItem}
                            theme={theme}
                            calculateMetrics={calculateMetrics}
                            currentUser={currentUser}
                            token={token}
                            showAppNotification={showAppNotification}
                            initialFiltersToApply={initialMarketplaceFilters}
                            onFiltersApplied={clearInitialMarketplaceFilters}
                            onInitiateConversation={handleInitiateConversation}
                            onNavigateToUserProfile={handleNavigateToUserProfile}
                        />;
            case 'inbox': 
                if (activeConversationId && activeConversationParticipant && currentUser) {
                    return <ConversationPage
                                theme={theme}
                                showAppNotification={showAppNotification}
                                currentUser={currentUser}
                                conversationId={activeConversationId}
                                initialOtherParticipant={activeConversationParticipant}
                                initialRelatedBattery={activeConversationBattery}
                                onBackToInbox={handleBackToInbox}
                            />;
                }
                return <InboxPage
                            theme={theme}
                            showAppNotification={showAppNotification}
                            onSelectConversation={handleSelectConversation}
                            currentUser={currentUser} 
                        />;
            case 'savedsearches':
                return <MySavedSearchesPage
                            theme={theme}
                            showAppNotification={showAppNotification}
                            onApplyFiltersAndNavigate={handleApplySavedSearchToMarketplace}
                        />;
            case 'userprofile':
                return profileUserIdToView ?
                       <UserProfilePage
                            key={profileUserIdToView}
                            userId={profileUserIdToView}
                            theme={theme}
                            currentUser={currentUser}
                            showAppNotification={showAppNotification}
                            onNavigateToEditProfile={handleNavigateToEditProfile}
                            onViewBatteryDetails={handleSelectBatteryListItem}
                            calculateMetrics={calculateMetrics}
                            onNavigateToUserProfile={handleNavigateToUserProfile}
                            onInitiateConversation={handleInitiateConversation}
                            onAccountDeletionRequested={handleAccountDeletionRequested}
                        /> : renderDashboardView();
            case 'editprofile':
                return <EditProfilePage
                            theme={theme}
                            showAppNotification={showAppNotification}
                            onProfileUpdated={() => currentUser && currentUser.userid && handleNavigateToUserProfile(currentUser.userid)}
                        />;
            case 'myListingsOffers':
                return <MyListingsOffersPage
                            theme={theme}
                            showAppNotification={showAppNotification}
                            onNavigateToUserProfile={handleNavigateToUserProfile}
                        />;
            case 'reports': return <ReportsComponent batteries={batteries} theme={theme} showAppNotification={showAppNotification} calculateMetrics={calculateMetrics} dashboardStats={dashboardStats} handleExportFleetHealthSummary={handleExportFleetHealthSummary} handleExportComplianceReport={handleExportComplianceReport} handleExportInventoryReport={handleExportInventoryReport} handleExportEolProjections={handleExportEolProjections} handleExportAllBatteries={handleExportAllBatteries} handleResetAppData={handleResetAppData} />;
            case 'analytics': return <AnalyticsComponent batteries={batteries.filter(b => b.batteryId !== exampleMarketplaceBattery.batteryId)} calculateMetrics={calculateMetrics} theme={theme} />;
            // NEW: Render Company Management Page
            case 'companymanagement':
                return <CompanyManagementPage
                            theme={theme}
                            showAppNotification={showAppNotification}
                        />;
            case 'createcompany':
                return <CreateCompanyPage
                            theme={theme}
                            showAppNotification={showAppNotification}
                            onCompanyCreated={handleCompanyCreated}
                        />;
            default:
                setProfileUserIdToView(null);
                setActiveConversationId(null); 
                setActiveConversationParticipant(null);
                setActiveConversationBattery(null);
                setInvitationTokenFromUrl(null); // NEW: Clear invitation view
                return renderDashboardView();
        }
    };

    const sidebarItems = useMemo(() => {
        const items = [
            { id: 'dashboard', label: 'Dashboard', icon: SearchCheck },
            { id: 'batteries', label: 'My Batteries', icon: Battery },
            { id: 'marketplace', label: 'Marketplace', icon: Store },
            { id: 'inbox', label: 'Inbox', icon: MessageSquare },
            { id: 'savedsearches', label: 'Saved Searches', icon: Save },
            { id: 'reports', label: 'Reports', icon: FileText },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'myListingsOffers', label: "My Listings' Offers", icon: Briefcase }
        ];

        // NEW: Conditionally add Company Management tab
        if (currentUser?.companyId && currentUser?.roleInCompany === 'admin') {
            items.splice(2, 0, { id: 'companymanagement', label: 'Company Management', icon: Briefcase });
        }

        return items;
    }, [currentUser]);

    return (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-gray-100 text-gray-900'}`}>
            {notification.visible && (
                <div className={`fixed top-0 left-0 right-0 p-4 text-white text-center z-[100] shadow-lg transition-transform duration-300 ${notification.visible ? 'translate-y-0' : '-translate-y-full'} ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
                    {notification.message}
                    <button onClick={() => setNotification(prev => ({ ...prev, visible: false }))} className="absolute top-1/2 right-4 transform -translate-y-1/2"><XCircle size={20} /></button>
                </div>
            )}
            {showDeleteConfirm && batteryToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className={`${cardBgClass} rounded-lg shadow-xl p-6 max-w-md w-full`}>
                        <div className="flex items-center text-red-500 mb-4"><AlertCircle className="mr-2" size={24} /><h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-red-400':'text-red-600'}`}>Delete Battery</h3></div>
                        <p className={`mb-6 ${baseTextClass}`}>Are you sure you want to delete {batteryToDelete.manufacturer} {batteryToDelete.model} (ID: {batteryToDelete.batteryId || batteryToDelete.id})? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3"><button onClick={() => setShowDeleteConfirm(false)} className={secondaryButtonClass}>Cancel</button><button onClick={confirmDeleteBattery} className={destructiveButtonClass}>Delete Battery</button></div>
                    </div>
                </div>
            )}
            <header className={`${theme === 'dark' ? 'bg-slate-800 border-b border-slate-700' : 'bg-blue-600 shadow-md'} text-white p-4 print:hidden`}>
                <div className="flex justify-between items-center max-w-full mx-auto px-4">
                    <div className="flex items-center space-x-3"><Battery className={`h-8 w-8 ${theme === 'dark' ? 'text-blue-400' : 'text-white'}`} /><h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-white'}`}>{APP_NAME}</h1></div>
                    <div className="flex items-center space-x-4">
                        {!isFormVisible && !invitationTokenFromUrl && selectedTab !== 'editprofile' && selectedTab !== 'userprofile' && selectedTab !== 'inbox' && <button onClick={handleOpenAddForm} className={`${primaryButtonClass} flex items-center text-sm`}><Plus size={16} className="mr-1.5"/>Register Battery</button>}
                        <button onClick={toggleTheme} title="Toggle Theme" className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-blue-500'} transition-colors`}>{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
                        {currentUser && (
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <button onClick={() => {
                                    if (currentUser && currentUser.userid) {
                                        handleNavigateToUserProfile(currentUser.userid);
                                    }
                                }} title="My Profile" className={`p-1.5 sm:p-2 rounded-full ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-blue-500'} transition-colors`}>
                                    <UserCircle 
                                        size={20}
                                        className = "cursor-pointer"
                                        onClick={() => handleNavigateToUserProfile(currentUser?.id)} 
                                    />
                                </button>
                                <div title={currentUser?.name || currentUser?.username} className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full ${theme === 'dark' ? 'bg-slate-700 text-blue-400' : 'bg-blue-500 text-white'} flex items-center justify-center font-semibold text-sm ring-2 ${theme === 'dark' ? 'ring-slate-600' : 'ring-blue-400'}`}>{currentUser?.initials || currentUser?.username?.charAt(0).toUpperCase() || 'U'}</div>
                            </div>
                        )}
                        <button onClick={logout} title="Logout" className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-blue-500'} transition-colors`}><LogOut size={20} /></button>
                    </div>
                </div>
            </header>
            <div className="flex flex-1 max-w-full mx-auto w-full overflow-hidden print:overflow-visible">
                {/* Hide sidebar if on invitation page */}
                {!invitationTokenFromUrl && (
                    <aside className={`w-60 xl:w-64 ${theme === 'dark' ? 'bg-slate-800 border-r border-slate-700' : 'bg-white border-r border-gray-200'} p-4 space-y-4 flex-shrink-0 overflow-y-auto print:hidden`}>
                    <nav className="space-y-1">
                            {sidebarItems.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => {
                                    if (item.id === 'userprofile') {
                                        handleNavigateToUserProfile(currentUser.id);
                                    } else {
                                        setSelectedTab(item.id);
                                        setIsFormVisible(false);
                                        setProfileUserIdToView(null);
                                        setSelectedBattery(null);
                                        setActiveConversationId(null);
                                        setActiveConversationParticipant(null);
                                        setActiveConversationBattery(null);
                                        setFilesToUpload([]);
                                        setInvitationTokenFromUrl(null);
                                    }
                                    }}
                                    className={`flex items-center space-x-3 w-full p-2.5 xl:p-3 rounded-lg transition-colors duration-150 text-sm xl:text-base ${
                                        (selectedTab === item.id && !isFormVisible && !(selectedTab === 'userprofile' && profileUserIdToView && item.id !== 'userprofile') && selectedTab !== 'editprofile')
                                        || (selectedTab === 'inbox' && item.id === 'inbox')
                                            ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 font-medium')
                                            : (theme === 'dark' ? 'text-slate-300 hover:bg-slate-700 hover:text-slate-100' : 'text-gray-700 hover:bg-gray-100')
                                    }`}>   
                                    <item.icon size={18} className="xl:mr-0.5"/><span>{item.label}</span>
                                </button>
                            ))}
                        </nav>
                        {(selectedTab === 'batteries' || selectedTab === 'dashboard') && !isFormVisible && !activeConversationId && (
                            <div className={`pt-4 border-t ${borderClass}`}>
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <h3 className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                        My Batteries ({filteredUserBatteriesForSidebar.length})
                                    </h3>
                                </div>
                                <div className="mb-2 px-1"><input type="text" placeholder="Filter by ID, Mfg, Model..." value={batterySearchTerm} onChange={(e) => setBatterySearchTerm(e.target.value)} className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}/></div>
                                <div className="space-y-1 max-h-[calc(100vh-500px)] overflow-y-auto pr-1">
                                    {filteredUserBatteriesForSidebar.map((battery) => {
                                        const isSelectedListItem = selectedBattery?.batteryId === battery.batteryId && selectedTab === 'batteries' && !isFormVisible;
                                        return (
                                        <button key={battery.batteryId || battery.id} onClick={() => handleSelectBatteryListItem(battery)}
                                            className={`flex items-center justify-between space-x-2 w-full p-2.5 text-left rounded-md transition-colors duration-150 group ${
                                                isSelectedListItem ? (theme === 'dark' ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-600') : (theme === 'dark' ? 'text-slate-400 hover:bg-slate-600 hover:text-slate-200' : 'text-gray-600 hover:bg-gray-100')
                                            }`}>
                                            <div className="flex items-center space-x-2 overflow-hidden">
                                                <Battery size={16} className={
                                                    isSelectedListItem ? (theme === 'dark' ? 'text-blue-300':'text-blue-600') : (theme === 'dark' ? 'text-slate-500 group-hover:text-slate-400':'text-gray-400 group-hover:text-gray-500')
                                                } />
                                                <div>
                                                    <p className={`text-sm truncate ${
                                                        isSelectedListItem ? (theme === 'dark' ? 'text-slate-100 font-semibold':'text-blue-700 font-semibold') : (theme === 'dark' ? 'text-slate-300 group-hover:text-slate-100':'text-gray-700 group-hover:text-gray-900')
                                                    }`}>{battery.manufacturer} {battery.model}</p>
                                                    <p className={`text-xs truncate ${
                                                        isSelectedListItem ? (theme === 'dark' ? 'text-slate-400':'text-blue-500') : (theme === 'dark' ? 'text-slate-500 group-hover:text-slate-400':'text-gray-500 group-hover:text-gray-600')
                                                    }`}>ID: {battery.batteryId || battery.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                {battery.isListedForMarketplace && <Tag size={14} className={`${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} mr-1`} title="Listed on Marketplace"/>}
                                                {isSelectedListItem && <CheckCircle size={16} className="flex-shrink-0" />}
                                            </div>
                                        </button>);
                                    })}
                                    {(filteredUserBatteriesForSidebar.length === 0 && (selectedTab === 'batteries' || selectedTab === 'dashboard')) &&
                                    <p className={`${baseTextClass} text-xs px-1 text-center`}>No batteries found.</p>
                                    }
                                </div>
                            </div>
                        )}
                    </aside>
                )}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{renderMainContent()}</main>
            </div>
        </div>
    );
}

const DashboardStatCard = ({ icon, title, value, color, theme }) => {
    const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-200';
    const colorClasses = {
        blue: theme === 'dark' ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-100',
        green: theme === 'dark' ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-100',
        purple: theme === 'dark' ? 'text-purple-400 bg-purple-900/30' : 'text-purple-600 bg-purple-100',
        red: theme === 'dark' ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-100',
        teal: theme === 'dark' ? 'text-teal-400 bg-teal-900/30' : 'text-teal-600 bg-teal-100',
    };
    return (
        <div className={`${cardBgClass} p-5 rounded-xl shadow border ${borderClass} transition-all duration-300 ease-in-out hover:shadow-lg hover:border-opacity-60`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'} uppercase tracking-wider`}>{title}</h3>
                <div className={`p-2 rounded-lg ${colorClasses[color] || (theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200')}`}>
                    {icon && React.cloneElement(icon, { size: 20 })}
                </div>
            </div>
            <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>{value}</p>
        </div>
    );
};

const MetricDisplayCard = ({ icon, value, label, color, theme }) => {
    const colorClasses = {
        blue: theme === 'dark' ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-100',
        green: theme === 'dark' ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-100',
        purple: theme === 'dark' ? 'text-purple-400 bg-purple-900/30' : 'text-purple-600 bg-purple-100',
        orange: theme === 'dark' ? 'text-orange-400 bg-orange-900/30' : 'text-orange-600 bg-orange-100',
        red: theme === 'dark' ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-100',
        teal: theme === 'dark' ? 'text-teal-400 bg-teal-900/30' : 'text-teal-600 bg-teal-100',
        sky: theme === 'dark' ? 'text-sky-400 bg-sky-900/30' : 'text-sky-600 bg-sky-100',
        yellow: theme === 'dark' ? 'text-yellow-400 bg-yellow-900/30' : 'text-yellow-600 bg-yellow-100',
    };
    return (
        <div className={`flex flex-col items-center justify-center p-4 rounded-lg text-center transition-all duration-300 ease-in-out ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-700/70' : 'bg-gray-50 hover:bg-gray-100'} border ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className={`mb-2 p-3 rounded-full ${colorClasses[color] || (theme === 'dark' ? 'bg-slate-600' : 'bg-gray-200')}`}>{icon && React.cloneElement(icon, {size: 24})}</div>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>{value}</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-600'}`}>{label}</div>
        </div>
    );
};