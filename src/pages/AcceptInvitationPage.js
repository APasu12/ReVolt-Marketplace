// battery-ui/src/AcceptInvitationPage.js
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from './context/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

export default function AcceptInvitationPage({ invitationToken, theme, onAcceptanceComplete }) {
    const { token } = useContext(AuthContext);
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    const textPrimaryClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-800';

    useEffect(() => {
        const acceptInvite = async () => {
            if (!token || !invitationToken) {
                setStatus('error');
                setMessage('Missing authentication or invitation token.');
                return;
            }
            try {
                const response = await axios.post(`${API_URL}/api/company/invitations/accept`, 
                    { token: invitationToken },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setStatus('success');
                setMessage(response.data.msg);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.msg || 'Failed to accept invitation.');
            }
        };

        acceptInvite();
    }, [token, invitationToken]);

    return (
        <div className={`p-8 rounded-lg shadow-lg text-center ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            {status === 'loading' && (
                <>
                    <Loader2 size={48} className={`mx-auto mb-4 animate-spin ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h1 className={`text-2xl font-bold ${textPrimaryClass}`}>Processing Invitation...</h1>
                </>
            )}
            {status === 'success' && (
                <>
                    <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                    <h1 className={`text-2xl font-bold ${textPrimaryClass}`}>Invitation Accepted!</h1>
                    <p className={`mt-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>{message}</p>
                    <button onClick={onAcceptanceComplete} className={`mt-6 px-4 py-2 text-white rounded-md ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'}`}>
                        Go to Dashboard
                    </button>
                </>
            )}
            {status === 'error' && (
                <>
                    <XCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <h1 className={`text-2xl font-bold ${textPrimaryClass}`}>Error</h1>
                    <p className={`mt-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>{message}</p>
                     <button onClick={onAcceptanceComplete} className={`mt-6 px-4 py-2 text-white rounded-md ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'}`}>
                        Go to Dashboard
                    </button>
                </>
            )}
        </div>
    );
}