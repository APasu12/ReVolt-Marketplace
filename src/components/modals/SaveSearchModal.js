// src/SaveSearchModal.js
import React, { useState, useEffect } from 'react';
import { X, Save, Bell, BellOff } from 'lucide-react';

export default function SaveSearchModal({
  isOpen,
  onClose,
  onSave,
  theme,
  currentSearchName = '', // For editing an existing search name
  currentReceiveAlerts = false // For editing
}) {
  const [searchName, setSearchName] = useState('');
  const [receiveAlerts, setReceiveAlerts] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSearchName(currentSearchName);
    setReceiveAlerts(currentReceiveAlerts);
    setError(''); // Clear error when modal opens or props change
  }, [isOpen, currentSearchName, currentReceiveAlerts]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!searchName.trim()) {
      setError('Search name is required.');
      return;
    }
    setError('');
    onSave(searchName, receiveAlerts);
  };

  const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-500';
  const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white text-gray-900 placeholder-gray-400';
  const borderClass = theme === 'dark' ? 'border-slate-600' : 'border-gray-300';
  const buttonClass = `px-4 py-2 rounded-md transition-colors text-sm ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
  const secondaryButtonClass = `px-4 py-2 rounded-md transition-colors text-sm border ${theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`${cardBgClass} rounded-lg shadow-xl p-6 max-w-md w-full`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-semibold ${textPrimaryClass}`}>{currentSearchName ? "Edit Saved Search" : "Save Search Filters"}</h3>
          <button onClick={onClose} className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}>
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="searchName" className={`block text-sm font-medium mb-1 ${textSecondaryClass}`}>
              Search Name
            </label>
            <input
              type="text"
              id="searchName"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className={`w-full p-2 text-sm border rounded-md ${inputBgClass} ${borderClass} focus:ring-blue-500 focus:border-blue-500`}
              placeholder="e.g., LFP Batteries for Solar"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <div>
            <label className={`flex items-center space-x-2 cursor-pointer ${textSecondaryClass}`}>
              <input
                type="checkbox"
                checked={receiveAlerts}
                onChange={(e) => setReceiveAlerts(e.target.checked)}
                className={`h-4 w-4 rounded ${theme === 'dark' ? 'bg-slate-600 border-slate-500 text-blue-500 focus:ring-blue-600' : 'border-gray-300 text-blue-600 focus:ring-blue-500'}`}
              />
              <span>Receive notifications for new matching listings</span>
              {receiveAlerts ? <Bell size={16} className="text-green-500" /> : <BellOff size={16} className="text-slate-500"/>}
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className={secondaryButtonClass}>
            Cancel
          </button>
          <button onClick={handleSubmit} className={`${buttonClass} flex items-center`}>
            <Save size={16} className="mr-2" /> {currentSearchName ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}