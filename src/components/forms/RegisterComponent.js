// battery-ui/src/RegisterComponent.js
import React, { useState, useContext } from 'react';
import AuthContext from './context/AuthContext';
import { UserPlus, Mail, KeyRound, User, Briefcase } from 'lucide-react'; // Example icons

const RegisterComponent = ({ onSwitchToLogin, theme = 'dark', appName = "VoltaLog" }) => {
    const { register, authError, setAuthError } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        initials: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    const { username, email, password, confirmPassword, name, initials } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (localError) setLocalError(''); // Clear local error on change
        if (authError) setAuthError(''); // Clear context error on change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setLocalError("Password must be at least 6 characters long.");
            return;
        }
        setIsLoading(true);
        const result = await register({ username, email, password, name, initials });
        setIsLoading(false);
        if (result.success && result.needsLogin) {
            // Handle case where backend registers but doesn't auto-login
            alert("Registration successful! Please log in."); // Replace with better notification
            onSwitchToLogin();
        } else if (result.success && !result.needsLogin) {
            // User is logged in by AuthContext, App.js will handle redirect
        } else {
            // Error is set in AuthContext's authError, or use result.error
            // setLocalError(result.error || "Registration failed."); // Or rely on authError prop
        }
    };

    // Theme-based classes (similar to LoginComponent)
    const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-900';
    const borderClass = theme === 'dark' ? 'border-slate-600' : 'border-gray-300';
    const placeholderClass = theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-gray-400';
    const primaryButtonClass = `w-full px-4 py-2.5 text-white rounded-lg transition-colors focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-green-500 hover:bg-green-600 focus:ring-green-400' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`;
    const textClass = theme === 'dark' ? 'text-slate-300' : 'text-gray-700';
    const headingClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-900';
    const linkClass = `font-medium ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`;

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100'}`}>
            <div className={`w-full max-w-md ${cardBgClass} shadow-xl rounded-xl p-6 sm:p-8`}>
                <div className="flex flex-col items-center mb-6">
                    <UserPlus size={48} className={`${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mb-3`} />
                    <h1 className={`text-3xl font-bold ${headingClass} mb-1`}>Create Account</h1>
                    <p className={textClass}>Join {appName} today!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name (Optional) */}
                    <div>
                        <label htmlFor="name" className={`block text-sm font-medium mb-1.5 ${textClass}`}>Full Name (Optional)</label>
                        <input type="text" name="name" id="name" value={name} onChange={handleChange} placeholder="e.g. Alex Volta" className={`w-full p-3 border rounded-lg shadow-sm ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                    </div>
                     {/* Initials (Optional) */}
                    <div>
                        <label htmlFor="initials" className={`block text-sm font-medium mb-1.5 ${textClass}`}>Initials (Optional, 2 chars)</label>
                        <input type="text" name="initials" id="initials" value={initials} onChange={handleChange} placeholder="e.g. AV" maxLength="2" className={`w-full p-3 border rounded-lg shadow-sm ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                    </div>
                    {/* Username */}
                    <div>
                        <label htmlFor="reg_username" className={`block text-sm font-medium mb-1.5 ${textClass}`}>Username <span className="text-red-500">*</span></label>
                        <input type="text" name="username" id="reg_username" value={username} onChange={handleChange} required placeholder="Choose a username" className={`w-full p-3 border rounded-lg shadow-sm ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                    </div>
                    {/* Email (Optional but recommended for backend) */}
                    <div>
                        <label htmlFor="reg_email" className={`block text-sm font-medium mb-1.5 ${textClass}`}>Email <span className="text-red-500">*</span></label>
                        <input type="email" name="email" id="reg_email" value={email} onChange={handleChange} required placeholder="your@email.com" className={`w-full p-3 border rounded-lg shadow-sm ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                    </div>
                    {/* Password */}
                    <div>
                        <label htmlFor="reg_password" className={`block text-sm font-medium mb-1.5 ${textClass}`}>Password <span className="text-red-500">*</span></label>
                        <input type="password" name="password" id="reg_password" value={password} onChange={handleChange} required placeholder="Min. 6 characters" className={`w-full p-3 border rounded-lg shadow-sm ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                    </div>
                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-1.5 ${textClass}`}>Confirm Password <span className="text-red-500">*</span></label>
                        <input type="password" name="confirmPassword" id="confirmPassword" value={confirmPassword} onChange={handleChange} required placeholder="Re-enter password" className={`w-full p-3 border rounded-lg shadow-sm ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`} />
                    </div>

                    {(localError || authError) && (
                        <p className="text-sm text-red-500 text-center py-2" role="alert">
                            {localError || authError}
                        </p>
                    )}

                    <div>
                        <button type="submit" disabled={isLoading} className={`${primaryButtonClass} font-semibold disabled:opacity-70 disabled:cursor-not-allowed`}>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                </form>
                <p className={`mt-6 text-center text-sm ${textClass}`}>
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className={linkClass}>
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterComponent;
