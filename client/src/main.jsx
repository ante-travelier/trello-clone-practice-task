import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import App from './App.jsx';
import './index.css';

function ThemedToaster() {
  const isDark = document.documentElement.classList.contains('dark');
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: isDark ? '#1a1a2e' : '#ffffff',
          color: isDark ? '#e2e8f0' : '#0f172a',
          border: isDark ? '1px solid #2a2a40' : '1px solid #e2e8f0',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: isDark ? '#1a1a2e' : '#ffffff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: isDark ? '#1a1a2e' : '#ffffff' },
        },
      }}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
