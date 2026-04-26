import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 15, 22, 0.92)',
              backdropFilter: 'blur(12px)',
              color: '#e4e4e7',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#22d3ee', secondary: '#0a0a0f' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#0a0a0f' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
