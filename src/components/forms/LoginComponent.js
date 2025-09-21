// battery-ui/src/LoginComponent.js
import React, { useState } from 'react';
import { LogIn } from 'lucide-react'; // Assuming LogIn icon for the button

const LoginComponent = ({ onLogin, loginError, theme = 'dark', appName = "VoltaLog", onSwitchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            return;
        }
        setIsLoading(true);
        await onLogin(username, password);
        setIsLoading(false);
    };

    const cardBgClass = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
    const inputBgClass = theme === 'dark' ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-900';
    const borderClass = theme === 'dark' ? 'border-slate-600' : 'border-gray-300';
    const placeholderClass = theme === 'dark' ? 'placeholder-slate-500' : 'placeholder-gray-400';
    const primaryButtonClass = `w-full px-4 py-2.5 text-white rounded-lg transition-colors focus:ring-2 focus:ring-opacity-50 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`;
    const textClass = theme === 'dark' ? 'text-slate-300' : 'text-gray-700';
    const headingClass = theme === 'dark' ? 'text-slate-100' : 'text-gray-900';
    const linkClass = `font-medium ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`;


    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100'}`}>
            <div className={`w-full max-w-md ${cardBgClass} shadow-xl rounded-xl p-6 sm:p-8`}>
                <div className="flex flex-col items-center mb-6">
                    <h1 className={`text-3xl font-bold ${headingClass} mb-1`}>{appName}</h1>
                    <p className={textClass}>Please sign in to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="username" className={`block text-sm font-medium mb-1.5 ${textClass}`}>
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className={`w-full p-3 border rounded-lg shadow-sm ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Enter your username"
                            autoComplete="username"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className={`block text-sm font-medium mb-1.5 ${textClass}`}>
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={`w-full p-3 border rounded-lg shadow-sm ${inputBgClass} ${borderClass} ${placeholderClass} focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />
                    </div>

                    {loginError && (
                        <p className="text-sm text-red-500 text-center py-2" role="alert">
                            {loginError}
                        </p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`${primaryButtonClass} font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center`}
                        >
                            <LogIn size={18} className="mr-2 -ml-1"/>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
                <p className={`mt-6 text-center text-sm ${textClass}`}>
                    Don't have an account?{' '}
                    <button
                        onClick={onSwitchToRegister}
                        className={linkClass}
                    >
                        Sign Up
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginComponent;
