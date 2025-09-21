import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Loader2, AlertTriangle, BatteryCharging, User, Building } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function AddBatteryPage() {
    const { currentUser, token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        manufacturer: '',
        model: '',
        originalCapacity: '',
        currentCapacity: '',
        assignment: 'personal' // 'personal' or 'company'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const payload = {
            manufacturer: formData.manufacturer,
            model: formData.model,
            originalCapacity: parseFloat(formData.originalCapacity),
            currentCapacity: parseFloat(formData.currentCapacity),
            // The battery.userId is set to the user adding it on the backend 
        };
        
        // If the user is in a company and chose to assign it, add the companyId 
        if (currentUser.companyId && formData.assignment === 'company') {
            payload.companyId = currentUser.companyId;
        }

        try {
            await axios.post(`${API_URL}/api/batteries`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/my-batteries'); // Redirect to the battery list on success
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create battery. Please check your input.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-center p-4">
            <div className="max-w-lg w-full mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
                <div className="text-center mb-8">
                    <BatteryCharging className="mx-auto h-12 w-12 text-green-500" />
                    <h1 className="text-3xl font-bold mt-4">Register a New Battery</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Enter the details for your new battery passport.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Assignment Field - only show if user is in a company */}
                    {currentUser.companyId && (
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Ownership
                            </label>
                            <fieldset className="flex gap-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="radio" name="assignment" value="personal" checked={formData.assignment === 'personal'} onChange={handleChange} className="form-radio text-blue-600"/>
                                    <span className="flex items-center"><User className="h-4 w-4 mr-1"/> Personal</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="radio" name="assignment" value="company" checked={formData.assignment === 'company'} onChange={handleChange} className="form-radio text-blue-600"/>
                                    <span className="flex items-center"><Building className="h-4 w-4 mr-1"/> Company</span>
                                </label>
                            </fieldset>
                        </div>
                    )}

                    {/* Battery Detail Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="manufacturer" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Manufacturer</label>
                            <input id="manufacturer" name="manufacturer" type="text" value={formData.manufacturer} onChange={handleChange} required className="w-full px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 outline-none" />
                        </div>
                         <div>
                            <label htmlFor="model" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Model</label>
                            <input id="model" name="model" type="text" value={formData.model} onChange={handleChange} required className="w-full px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 outline-none" />
                        </div>
                         <div>
                            <label htmlFor="originalCapacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Original Capacity (Ah)</label>
                            <input id="originalCapacity" name="originalCapacity" type="number" step="any" value={formData.originalCapacity} onChange={handleChange} required className="w-full px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 outline-none" />
                        </div>
                         <div>
                            <label htmlFor="currentCapacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Capacity (Ah)</label>
                            <input id="currentCapacity" name="currentCapacity" type="number" step="any" value={formData.currentCapacity} onChange={handleChange} required className="w-full px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-700 border-b-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 outline-none" />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-md text-sm flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Battery Passport'}
                    </button>
                </form>
            </div>
        </div>
    );
}