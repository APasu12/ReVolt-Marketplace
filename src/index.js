// battery-ui/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Your global styles
import './styles.css'; // Your custom styles
import App from './App'; // <--- CHANGE THIS: Import App instead of BatteryPassportUI directly
import { AuthProvider } from './context/AuthContext'; // <--- IMPORT AuthProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* <--- WRAP App with AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);