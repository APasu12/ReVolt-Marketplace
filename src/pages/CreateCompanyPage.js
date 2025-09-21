// battery-ui/src/CreateCompanyPage.js
import React, { useState, useContext } from 'react';
import axios from './api/axiosConfig';
import AuthContext from './context/AuthContext';
import { Briefcase, Loader2, ArrowRight } from 'lucide-react';

export default function CreateCompanyPage({ theme, showAppNotification, onCompanyCreated }) {
    const { refreshCurrentUser } = useContext(AuthContext);
    const [companyName, setCompanyName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // Re-using styles from MainAppLayout for consistency
    const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
    const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-600';
    const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-900';
    const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-200';
    const placeholderClass = theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-gray-400';
    const primaryButtonClass = `inline-flex items-center justify-center px-6 py-3 text-white rounded-md transition-colors focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`;

    const validateForm = () => {
        if (!companyName.trim()) {
            setFormError('Company name is required.');
            return false;
        }
        if (!jobTitle.trim()) {
            setFormError('Your job title is required.');
            return false;
        }
        setFormError('');
        return true;
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            // This assumes a backend endpoint exists to handle company creation
            const response = await axios.post('/api/company/create', {
                name: companyName,
                userJobTitle: jobTitle,
            });

            showAppNotification(response.data.msg || 'Company created successfully!', 'success');

            // Refresh the user's context to get the new companyId and admin role
            if (refreshCurrentUser) {
                await refreshCurrentUser();
            }

            // Callback to navigate to the company management page
            if (onCompanyCreated) {
                onCompanyCreated();
            }

        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Failed to create company. Please try again.';
            setFormError(errorMsg);
            showAppNotification(errorMsg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className={`w-full max-w-2xl p-8 rounded-lg shadow-xl ${cardBgClass} border ${borderClass}`}>
                <div className="text-center mb-8">
                    <Briefcase size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h1 className={`text-3xl font-bold ${textPrimaryClass}`}>Create Your Company on VoltaLog</h1>
                    <p className={`mt-2 ${textSecondaryClass}`}>Establish your organization to manage batteries and invite team members.</p>
                </div>

                <form onSubmit={handleCreateCompany} className="space-y-6">
                    <div>
                        <label htmlFor="companyName" className={`block text-sm font-medium mb-2 ${textSecondaryClass}`}>
                            Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="companyName"
                            name="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className={`w-full p-3 border rounded-md shadow-sm ${inputBgClass} ${formError.includes('name') ? 'border-red-500' : borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="e.g. Acme Innovations Inc."
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="jobTitle" className={`block text-sm font-medium mb-2 ${textSecondaryClass}`}>
                            Your Job Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="jobTitle"
                            name="jobTitle"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className={`w-full p-3 border rounded-md shadow-sm ${inputBgClass} ${formError.includes('title') ? 'border-red-500' : borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="e.g. Founder, CEO, Lead Engineer"
                            disabled={isLoading}
                        />
                         <p className={`mt-1 text-xs ${textSecondaryClass}`}>You will be the first administrator for this company.</p>
                    </div>

                    {formError && <p className="text-red-500 text-sm text-center">{formError}</p>}

                    <div className="pt-4 text-center">
                        <button type="submit" className={`${primaryButtonClass} font-semibold`} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    Create Company & Continue
                                    <ArrowRight size={20} className="ml-2" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}