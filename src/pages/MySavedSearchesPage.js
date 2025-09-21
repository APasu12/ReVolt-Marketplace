// src/MySavedSearchesPage.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { Search, Bell, BellOff, Edit3, Trash2, Play, AlertTriangle, Info, X } from 'lucide-react';
import SaveSearchModal from './SaveSearchModal'; // For editing
import AuthContext from './context/AuthContext'; // Import AuthContext

const API_BASE_URL = process.env.REACT_APP_API_URL; // Ensure this is set in your .env

export default function MySavedSearchesPage({ theme, showAppNotification, onApplyFiltersAndNavigate }) {
  const [savedSearches, setSavedSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSearch, setEditingSearch] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { currentUser, token, isAuthenticated, isAuthLoading } = useContext(AuthContext);

  // Theme-based classes
  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const textMutedClass = theme === 'dark' ? 'text-slate-500' : 'text-gray-400';
  const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-300';
  const hoverBgClass = theme === 'dark' ? 'hover:bg-slate-700/60' : 'hover:bg-gray-50/70'; // Adjusted hover for light theme
  const buttonClass = `px-3 py-1.5 rounded-md transition-colors text-xs ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
  const secondaryButtonClass = `px-3 py-1.5 rounded-md transition-colors text-xs border ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;
  const destructiveButtonClass = `px-3 py-1.5 rounded-md transition-colors text-xs border ${theme === 'dark' ? 'border-red-500 text-red-400 hover:bg-red-500 hover:text-white' : 'border-red-300 text-red-600 hover:bg-red-500 hover:text-white'}`;

  const fetchSavedSearches = useCallback(async () => {
    if (isAuthLoading) return;
    if (!isAuthenticated || !token) {
      // showAppNotification("Authentication required to view saved searches.", "info"); // Can be noisy if page loads before auth fully resolves
      setIsLoading(false);
      setSavedSearches([]);
      return;
    }

    setIsLoading(true);
    try {
      // Axios default header should already be set by AuthContext if token exists
      const response = await axios.get(`${API_BASE_URL}/api/me/saved-searches`);
      setSavedSearches(response.data || []);
    } catch (error) {
      console.error("MySavedSearchesPage.js: Error fetching saved searches:", error.config?.url, error.response?.status, error.response?.data || error.message);
      const errorMsg = error.response?.data?.msg || error.message || "Could not fetch saved searches.";
      showAppNotification(errorMsg, "error");
      setSavedSearches([]);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, showAppNotification, token, isAuthenticated, isAuthLoading]);

  useEffect(() => {
    fetchSavedSearches();
  }, [fetchSavedSearches]);

  const handleDeleteSearch = async (searchId, searchName) => {
    if (!isAuthenticated || !token) {
      showAppNotification("Authentication required to delete.", "error");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the saved search "${searchName}"?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/api/me/saved-searches/${searchId}`);
        showAppNotification(`Saved search "${searchName}" deleted.`, 'success');
        fetchSavedSearches();
      } catch (error) {
        console.error("Error deleting saved search:", error.response?.data || error.message);
        showAppNotification(error.response?.data?.msg || "Could not delete saved search.", "error");
      }
    }
  };

  const handleToggleAlerts = async (search) => {
    if (!isAuthenticated || !token) {
      showAppNotification("Authentication required to toggle alerts.", "error");
      return;
    }
    const updatedAlertStatus = !search.receiveAlerts;
    try {
      await axios.put(`${API_BASE_URL}/api/me/saved-searches/${search.searchId}`, {
        searchName: search.searchName,
        filtersJSON: search.filtersJSON, // Assuming this is how your backend expects it
        receiveAlerts: updatedAlertStatus,
      });
      showAppNotification(`Alerts for "${search.searchName}" ${updatedAlertStatus ? 'enabled' : 'disabled'}.`, 'success');
      fetchSavedSearches();
    } catch (error) {
      console.error("Error toggling alerts:", error.response?.data || error.message);
      showAppNotification(error.response?.data?.msg || "Could not update alert status.", "error");
    }
  };

  const handleEditSearch = (search) => {
    setEditingSearch(search);
    setShowEditModal(true);
  };

  const handleUpdateSearchSubmit = async (newName, newReceiveAlerts) => {
    if (!editingSearch || !isAuthenticated || !token) {
      showAppNotification("Authentication required or no search selected for edit.", "error");
      return;
    }
    try {
      await axios.put(`${API_BASE_URL}/api/me/saved-searches/${editingSearch.searchId}`, {
        searchName: newName,
        filtersJSON: editingSearch.filtersJSON, // Keep existing filters
        receiveAlerts: newReceiveAlerts,
      });
      showAppNotification(`Saved search "${newName}" updated.`, 'success');
      setShowEditModal(false);
      setEditingSearch(null);
      fetchSavedSearches();
    } catch (error) {
      console.error("Error updating saved search:", error.response?.data || error.message);
      showAppNotification(error.response?.data?.msg || "Could not update saved search.", "error");
    }
  };

  const handleApplySavedSearch = (filtersString) => {
    try {
      const filtersObject = typeof filtersString === 'string' ? JSON.parse(filtersString) : filtersString;
      if (onApplyFiltersAndNavigate && typeof onApplyFiltersAndNavigate === 'function') {
        onApplyFiltersAndNavigate(filtersObject);
      } else {
        console.warn("onApplyFiltersAndNavigate prop is not a function or not provided to MySavedSearchesPage.");
        showAppNotification("Filter application function not available.", "warning");
      }
    } catch (e) {
      console.error("Error parsing saved filters JSON:", e);
      showAppNotification("Could not parse saved filters.", "error");
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className={`p-6 ${cardBgClass} rounded-lg shadow`}>
        <h2 className={`text-2xl font-semibold mb-4 ${textPrimaryClass}`}>My Saved Searches</h2>
        <div className="flex justify-center items-center py-10">
          <Search size={32} className={`animate-spin ${textMutedClass}`} />
          <p className={`${textSecondaryClass} ml-3`}>Loading your saved searches...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className={`p-6 ${cardBgClass} rounded-lg shadow text-center`}>
        <AlertTriangle size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
        <h2 className={`text-2xl font-semibold mb-4 ${textPrimaryClass}`}>Access Denied</h2>
        <p className={textSecondaryClass}>You need to be logged in to view your saved searches.</p>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-6 ${cardBgClass} rounded-lg shadow`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-semibold ${textPrimaryClass}`}>My Saved Searches</h2>
        {/* Optional: Button to navigate to marketplace if list is empty or for convenience */}
        {/* <button onClick={() => onApplyFiltersAndNavigate ? onApplyFiltersAndNavigate({}) : null} className={buttonClass}>
          <Search size={14} className="mr-1" /> Go to Marketplace
        </button> */}
      </div>

      {savedSearches.length === 0 ? (
        <div className="text-center py-10">
          <Info size={48} className={`mx-auto mb-4 ${textMutedClass}`} />
          <p className={`${textSecondaryClass} text-lg mb-2`}>No Saved Searches Yet</p>
          <p className={textMutedClass}>
            Go to the marketplace, apply filters, and use the "Save Current Search" button to save your preferences.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedSearches.map((search) => {
            let filtersSummary = "No active filters specified";
            if (search.filtersJSON) {
              try {
                const f = typeof search.filtersJSON === 'string' ? JSON.parse(search.filtersJSON) : search.filtersJSON;
                const activeFilters = Object.entries(f)
                  .filter(([key, value]) => {
                    if (key === 'sohRange') return value && value.label !== 'Any';
                    if (typeof value === 'string') return value && value.toLowerCase() !== 'any' && value.trim() !== '';
                    if (typeof value === 'number') return !isNaN(value) && value !== ''; // Assuming empty string for number means not set
                    return !!value; // For booleans or other non-empty values
                  })
                  .map(([key, value]) => {
                    let displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    if (key === 'sohRange') return `SoH: ${value.label}`;
                    if (key === 'searchTermLocal') return `Search: "${value}"`;
                    if (key === 'minPrice' || key === 'maxPrice') return `${displayKey}: $${value}`;
                    if (key === 'ageMin' || key === 'ageMax') return `${displayKey}: ${value} yrs`;
                    if (key === 'cycleMin' || key === 'cycleMax') return `${displayKey}: ${value} cycles`;
                    return `${displayKey}: ${value}`;
                  });
                if (activeFilters.length > 0) {
                  filtersSummary = activeFilters.slice(0, 3).join('; ') + (activeFilters.length > 3 ? '...' : '');
                }
              } catch (e) {
                console.error("Error parsing filters JSON for display:", e);
                filtersSummary = "Could not display filters";
              }
            }
            return (
              <div key={search.searchId} className={`p-4 border ${borderClass} rounded-lg ${hoverBgClass} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm`}>
                <div className="flex-grow">
                  <h3 className={`text-lg font-medium ${textPrimaryClass}`}>{search.searchName}</h3>
                  <p className={`text-xs ${textMutedClass} mb-1.5 italic`}>Filters: {filtersSummary}</p>
                  <button
                    onClick={() => handleToggleAlerts(search)}
                    className={`flex items-center text-xs py-1 px-2 rounded-md ${search.receiveAlerts ? (theme === 'dark' ? 'bg-green-700 text-green-200 hover:bg-green-600' : 'bg-green-100 text-green-700 hover:bg-green-200') : (theme === 'dark' ? `bg-slate-600 ${textSecondaryClass} hover:bg-slate-500` : `bg-gray-200 ${textSecondaryClass} hover:bg-gray-300`)}`}
                  >
                    {search.receiveAlerts ? <Bell size={14} className="mr-1.5" /> : <BellOff size={14} className="mr-1.5" />}
                    {search.receiveAlerts ? 'Alerts On' : 'Alerts Off'}
                  </button>
                </div>
                <div className="flex space-x-2 mt-3 sm:mt-0 flex-shrink-0 self-center sm:self-auto">
                  <button onClick={() => handleApplySavedSearch(search.filtersJSON)} className={`${buttonClass} flex items-center`} title="Apply this search to the marketplace">
                    <Play size={14} className="mr-1" /> Apply
                  </button>
                  <button onClick={() => handleEditSearch(search)} className={`${secondaryButtonClass} flex items-center`} title="Edit name or alert preference">
                    <Edit3 size={14} className="mr-1" /> Edit
                  </button>
                  <button onClick={() => handleDeleteSearch(search.searchId, search.searchName)} className={`${destructiveButtonClass} flex items-center`} title="Delete this saved search">
                    <Trash2 size={14} className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showEditModal && editingSearch && (
        <SaveSearchModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingSearch(null); }}
          onSave={handleUpdateSearchSubmit}
          theme={theme}
          currentSearchName={editingSearch.searchName}
          currentReceiveAlerts={editingSearch.receiveAlerts}
          isEditMode={true} // Indicate edit mode to the modal
        />
      )}
    </div>
  );
}