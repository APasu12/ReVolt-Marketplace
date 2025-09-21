import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from 'context/AuthContext';
import { Building, Users, Mail, Settings, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

// Import the components to be rendered within the dashboard
import ManageTeamComponent from 'components/company/ManageTeamComponent'; // Assuming path
import InviteUserComponent from 'components/company/InviteUserComponent'; // Assuming path
import CompanySettings from 'components/company/CompanySettings'; // Assuming path for the new component

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function MyCompanyDashboard() {
    const { currentUser, token, logout } = useContext(AuthContext);
    const [company, setCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState('overview'); // 'overview', 'team', 'invitations', 'settings'

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!currentUser?.companyId || !token) { // 
                setError('You are not associated with a company or you are not logged in.');
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/api/companies/my-company`, { // 
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCompany(response.data);
            } catch (err) {
                const errorMsg = err.response?.data?.msg || 'Failed to load company data.';
                setError(errorMsg);
                console.error("Fetch Company Data Error:", err.response?.data || err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanyData();
    }, [currentUser, token]);

    const handleCompanyUpdate = (updatedCompany) => {
        setCompany(updatedCompany);
        setView('overview'); // Return to overview after an update
    };
    
    const handleCompanyDelete = () => {
        alert('Company has been deleted. You will be logged out.');
        logout(); // Or redirect to a different page
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900 p-4">
                 <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-200">An Error Occurred</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
             <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
                <p>No company data found.</p>
            </div>
        );
    }

    const isAdmin = currentUser?.roleInCompany === 'admin'; // 
    const navItemClasses = (currentView) => 
        `flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${
            view === currentView 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-white' 
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
        }`;

    const renderContent = () => {
        switch (view) {
            case 'team':
                return <ManageTeamComponent company={company} isAdmin={isAdmin} />;
            case 'invitations':
                return <InviteUserComponent isAdmin={isAdmin} />;
            case 'settings':
                return <CompanySettings company={company} isAdmin={isAdmin} onCompanyUpdate={handleCompanyUpdate} onCompanyDelete={handleCompanyDelete} />;
            case 'overview':
            default:
                return (
                    <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Welcome to {company.companyName}</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            This is your central dashboard. Use the navigation on the left to manage team members, send new invitations, or update company settings.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4">
                        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-3 sm:mb-0">
                            <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{company.companyName}</h1>
                            <p className="text-slate-500 dark:text-slate-400">Company Administration</p>
                        </div>
                        {isAdmin && (
                            <span className="ml-0 sm:ml-auto mt-2 sm:mt-0 flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                                <ShieldCheck className="h-4 w-4 mr-1.5" />
                                Admin View
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Navigation Sidebar */}
                    <div className="md:col-span-1">
                        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg p-4">
                            <nav className="space-y-1">
                                <a onClick={() => setView('overview')} className={navItemClasses('overview')}>
                                    <Building className="h-5 w-5" />
                                    <span>Overview</span>
                                </a>
                                {isAdmin && (
                                     <a onClick={() => setView('invitations')} className={navItemClasses('invitations')}>
                                        <Mail className="h-5 w-5" />
                                        <span>Invitations</span>
                                    </a>
                                )}
                                <a onClick={() => setView('team')} className={navItemClasses('team')}>
                                    <Users className="h-5 w-5" />
                                    <span>Team Members</span>
                                </a>
                                {isAdmin && (
                                    <a onClick={() => setView('settings')} className={navItemClasses('settings')}>
                                        <Settings className="h-5 w-5" />
                                        <span>Settings</span>
                                    </a>
                                )}
                            </nav>
                        </div>
                    </div>

                    {/* Content Display */}
                    <div className="md:col-span-3">
                       {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}