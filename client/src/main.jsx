import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { useTheme } from './hooks/useTheme.js';
import App from './App.jsx';
import './index.css';

function ThemedToaster() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: dark ? 'rgba(15, 15, 22, 0.92)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
          color: dark ? '#e4e4e7' : '#0f172a',
          border: dark
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(15, 23, 42, 0.10)',
          fontSize: '13px',
        },
        success: {
          iconTheme: { primary: dark ? '#22d3ee' : '#0891b2', secondary: dark ? '#0a0a0f' : '#ffffff' },
        },
        error: {
          iconTheme: { primary: dark ? '#f87171' : '#dc2626', secondary: dark ? '#0a0a0f' : '#ffffff' },
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
