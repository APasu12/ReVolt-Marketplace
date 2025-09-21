// battery-ui/src/App.js
import React, { useContext, useState } from 'react'; // Added useState
import AuthContext from './context/AuthContext';
import MainAppLayout from './components/layout/MainAppLayout';
import LoginComponent from './components/forms/LoginComponent';
import RegisterComponent from './components/forms/RegisterComponent'; // Import RegisterComponent
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';

function App() {
  const { isAuthenticated, isAuthLoading, login, register, authError, setAuthError } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState('login'); // 'login' or 'register'

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111827', color: '#e5e7eb' }}>
        <p>Loading Authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (currentView === 'login') {
      return <LoginComponent
                onLogin={login}
                loginError={authError} // Use generic authError from context
                theme="dark" // Or manage theme globally
                appName="VoltaLog"
                onSwitchToRegister={() => { setAuthError(''); setCurrentView('register');}}
             />;
    } else if (currentView === 'register') {
      return <RegisterComponent
                onRegister={register} // This is the register function from AuthContext
                authError={authError} // Use generic authError from context
                theme="dark"
                appName="VoltaLog"
                onSwitchToLogin={() => { setAuthError(''); setCurrentView('login'); }}
             />;
    }
  }

  // If authenticated, render the main application UI with routing
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
        <Route path="/*" element={<MainAppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
