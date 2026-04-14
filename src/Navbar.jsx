import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      color: '#ffffff',
      textDecoration: 'none',
      fontWeight: isActive ? '600' : '500',
      fontSize: '0.95rem',
      padding: '8px 16px',
      borderRadius: '6px',
      background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    };
  };

  return (
    <nav style={{ 
      background: '#4f008c',
      padding: '0 2rem',
      color: '#fff', 
      boxShadow: '0 2px 10px rgba(79, 0, 140, 0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        height: '70px'
      }}>
        {/* STC Logo Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* STC Logo Icon */}
          <div style={{
            width: '40px',
            height: '40px',
            background: '#ffffff',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            color: '#4f008c'
          }}>
            S
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '0.5px', lineHeight: 1.2 }}>
              STC
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.9, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Financial Analysis
            </div>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/" style={getLinkStyle('/')}>
            <span style={{ fontSize: '1.1rem' }}>📄</span>
            Upload
          </Link>
          <Link to="/dashboard" style={getLinkStyle('/dashboard')}>
            <span style={{ fontSize: '1.1rem' }}>📊</span>
            Dashboard
          </Link>
          <Link to="/comparison" style={getLinkStyle('/comparison')}>
            <span style={{ fontSize: '1.1rem' }}>⚖️</span>
            Comparison
          </Link>
        </div>
      </div>
    </nav>
  );
}
