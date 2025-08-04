import './lib/reactCompat'; // Load React compatibility layer first
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeApp } from './utils/envValidation';

// Validate environment before starting app
const isValidEnvironment = initializeApp();

if (isValidEnvironment) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // Show error page if environment is invalid
  ReactDOM.createRoot(document.getElementById('root')).render(
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <h1 style={{ color: '#dc3545', marginBottom: '1rem' }}>
        ⚠️ Configuration Error
      </h1>
      <p style={{ color: '#6c757d', maxWidth: '400px' }}>
        ระบบไม่สามารถเริ่มต้นได้เนื่องจากการตั้งค่าไม่ถูกต้อง
        กรุณาตรวจสอบ Console สำหรับรายละเอียด
      </p>
      <button 
        onClick={() => window.location.reload()} 
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ลองใหม่
      </button>
    </div>
  );
}