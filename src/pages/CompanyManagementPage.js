// battery-ui/src/CompanyManagementPage.js
import React, { useState, useEffect, useContext } from 'react';
import axios from './api/axiosConfig'; // CORRECTED: Using the configured axios instance
import AuthContext from './context/AuthContext';
import { Users, UserPlus, Mail, Trash2, Loader2 } from 'lucide-react';

export default function CompanyManagementPage({ theme, showAppNotification }) {
    const { currentUser, token } = useContext(AuthContext);
    const [companyData, setCompanyData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteeEmail, setInviteeEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    
    const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';
    const textSecondaryClass = theme === 'dark' ? 'text-slate-400' : 'text-gray-600';
    const borderClass = theme === 'dark' ? 'border-slate-700' : 'border-gray-300';
    const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-900';
    const primaryButtonClass = `px-4 py-2 text-white rounded-md transition-colors ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`;
    const destructiveButtonClass = `p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'text-red-400 hover:bg-red-500 hover:text-white' : 'text-red-500 hover:bg-red-100'}`;

    const fetchCompanyData = async () => {
        setIsLoading(true);
        try {
            // CORRECTED: Using the right backend route and no manual headers
            const response = await axios.get('/api/company/my-company');
            setCompanyData(response.data);
        } catch (error) {
            console.error('Error fetching company data:', error.response?.data || error.message);
            showAppNotification(error.response?.data?.msg || 'Could not load company data.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanyData();
    }, []);

    const handleInviteUser = async (e) => {
        e.preventDefault();
        if (!inviteeEmail) {
            showAppNotification('Please enter an email address to invite.', 'error');
            return;
        }
        setIsInviting(true);
        try {
            // CORRECTED: Using the right backend route and no manual headers
            await axios.post('/api/company/my-company/invitations', { inviteeEmail });
            showAppNotification(`Invitation successfully sent to ${inviteeEmail}.`, 'success');
            setInviteeEmail('');
            fetchCompanyData(); // Refetch all data to update the view
        } catch (error) {
            console.error('Error inviting user:', error.response?.data || error.message);
            showAppNotification(error.response?.data?.msg || 'Failed to send invitation.', 'error');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveUser = async (userId, username) => {
        if (window.confirm(`Are you sure you want to remove ${username} from the company?`)) {
            try {
                // CORRECTED: Using the right backend route and no manual headers
                await axios.put(`/api/company/my-company/users/${userId}`, { action: 'remove' });
                showAppNotification(`${username} has been removed from the company.`, 'success');
                fetchCompanyData(); // Refetch all data to update the view
            } catch (error) {
                console.error('Error removing user:', error.response?.data || error.message);
                showAppNotification(error.response?.data?.msg || 'Failed to remove user.', 'error');
            }
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center"><Loader2 className="animate-spin inline-block" /></div>;
    }

    if (!companyData) {
        return <div className={`p-6 ${cardBgClass} rounded-lg shadow`}>Could not load company information.</div>;
    }

    return (
        <div className="space-y-8">
            <div className={`${cardBgClass} rounded-lg shadow p-6`}>
                <h1 className={`text-3xl font-bold ${textPrimaryClass}`}>{companyData.companyName}</h1>
                <p className={textSecondaryClass}>Company Management Dashboard</p>
            </div>

            <div className={`${cardBgClass} rounded-lg shadow p-6`}>
                <h2 className={`text-xl font-semibold ${textPrimaryClass} mb-4 flex items-center`}>
                    <UserPlus className="mr-3" /> Invite New User
                </h2>
                <form onSubmit={handleInviteUser} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="email"
                        value={inviteeEmail}
                        onChange={(e) => setInviteeEmail(e.target.value)}
                        placeholder="Enter user's email address"
                        className={`flex-grow p-2 border rounded-md ${inputBgClass} ${borderClass}`}
                        required
                    />
                    <button type="submit" className={`${primaryButtonClass} flex items-center justify-center`} disabled={isInviting}>
                        {isInviting ? <Loader2 className="animate-spin mr-2" /> : <Mail className="mr-2" />}
                        {isInviting ? 'Sending...' : 'Send Invitation'}
                    </button>
                </form>
            </div>

            <div className={`${cardBgClass} rounded-lg shadow p-6`}>
                <h2 className={`text-xl font-semibold ${textPrimaryClass} mb-4 flex items-center`}>
                    <Users className="mr-3" /> Current Members ({companyData.employees?.length || 0})
                </h2>
                <ul className="space-y-3">
                    {companyData.employees?.map(user => (
                        <li key={user.userId} className={`flex justify-between items-center p-3 rounded-md border ${borderClass} ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                            <div>
                                <p className={textPrimaryClass}>{user.name || user.username} ({user.email})</p>
                                <p className={`${textSecondaryClass} text-sm capitalize`}>Role: {user.roleInCompany}</p>
                            </div>
                            {user.userId !== currentUser.id && (
                                <button onClick={() => handleRemoveUser(user.userId, user.username)} className={destructiveButtonClass} title={`Remove ${user.username}`}>
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            
            {companyData.CompanyInvitations?.length > 0 && (
                 <div className={`${cardBgClass} rounded-lg shadow p-6`}>
                    <h2 className={`text-xl font-semibold ${textPrimaryClass} mb-4`}>Pending Invitations ({companyData.CompanyInvitations.length})</h2>
                     <ul className="space-y-3">
                        {companyData.CompanyInvitations.map(invite => (
                            <li key={invite.invitationId} className={`flex justify-between items-center p-3 rounded-md border ${borderClass} ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                                <p className={textPrimaryClass}>{invite.inviteeEmail}</p>
                                <p className={`${textSecondaryClass} text-sm`}>
                                    Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
