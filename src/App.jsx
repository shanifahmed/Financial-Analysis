import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import UploadPage from './UploadPage';
import DashboardPage from './DashboardPage';
import ComparisonPage from './ComparisonPage';

export default function App() {
  return (
    <Router>
      <div style={{ 
        minHeight: '100vh', 
        background: '#f5f7fb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Navbar />
        <div style={{ flex: 1, paddingBottom: '40px' }}>
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/comparison" element={<ComparisonPage />} />
          </Routes>
        </div>
        
        {/* Footer */}
        <footer style={{
          background: '#4f008c',
          color: '#ffffff',
          padding: '20px',
          textAlign: 'center',
          marginTop: 'auto'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>© 2026 STC Financial Analysis Tool. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}
