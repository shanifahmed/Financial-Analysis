import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument, fetchStcFinancials } from './api';

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stcLoading, setStcLoading] = useState(false);
  const navigate = useNavigate();
  const [year, setYear] = useState('2024');
  const [quarter, setQuarter] = useState('Q1');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    setLoading(true);
    try {
      await uploadDocument(formData);
      alert('Upload and Extraction Successful! Redirecting to Dashboard...');
      navigate(`/dashboard`);
    } catch (error) {
      console.error(error);
      const serverMessage = error.response?.data?.message;
      const serverError = error.response?.data?.error;
      const displayMessage = serverMessage ? `${serverMessage}${serverError ? ': ' + serverError : ''}` : error.message;
      alert(`Upload failed: ${displayMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStcFetch = async (e) => {
    e.preventDefault();
    setStcLoading(true);
    try {
      await fetchStcFinancials(year, quarter);
      alert(`STC ${quarter} ${year} Report Fetched & Analyzed!`);
      navigate(`/dashboard`);
    } catch (error) {
      console.error(error);
      alert(`Failed to fetch STC report: ${error.response?.data?.message || error.message}`);
    } finally {
      setStcLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#4f008c', fontSize: '2rem', marginBottom: '10px', fontWeight: 700 }}>
          Financial Statement Analyzer
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem', margin: 0 }}>
          Upload PDF financial statements or fetch directly from STC reports
        </p>
      </div>

      {/* Upload Card */}
      <div style={{ 
        background: '#ffffff', 
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
        border: '1px solid #e5e7eb',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: '#1a1a2e', marginBottom: '10px', fontSize: '1.5rem' }}>
          📄 Upload Financial Statements
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>
          Upload one or more PDF financial statements. The system will automatically extract key metrics using OCR.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ 
            border: '2px dashed #4f008c', 
            padding: '50px', 
            textAlign: 'center', 
            borderRadius: '12px', 
            backgroundColor: 'rgba(79, 0, 140, 0.03)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
            <input 
              type="file" 
              accept="application/pdf" 
              multiple 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              id="file-upload"
            />
            <label 
              htmlFor="file-upload" 
              style={{ 
                cursor: 'pointer', 
                color: '#4f008c', 
                fontWeight: '600', 
                fontSize: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '3rem' }}>📁</span>
              Click to Select PDF Files
            </label>
            {files.length > 0 && (
              <div style={{ marginTop: '20px', textAlign: 'left', background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <strong style={{ color: '#1a1a2e' }}>Selected Files:</strong>
                <ul style={{ margin: '10px 0', paddingLeft: '20px', color: '#4b5563' }}>
                  {files.map((f, i) => (
                    <li key={i} style={{ marginBottom: '5px' }}>
                      {f.name} ({(f.size / 1024).toFixed(0)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || files.length === 0} 
            style={{ 
              padding: '16px', 
              background: loading ? '#9ca3af' : '#4f008c', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '10px', 
              fontSize: '1rem', 
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(79, 0, 140, 0.3)'
            }}
          >
            {loading ? '⏳ Processing OCR...' : `📤 Upload & Analyze ${files.length > 0 ? `(${files.length} file${files.length > 1 ? 's' : ''})` : ''}`}
          </button>
        </form>
      </div>

      {/* STC Fetch Card */}
      <div style={{ 
        background: '#ffffff', 
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ color: '#1a1a2e', marginBottom: '10px', fontSize: '1.5rem' }}>
          🌐 Fetch from STC Website
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>
          Automatically fetch and analyze financial data directly from STC's published reports.
        </p>
        
        <form onSubmit={handleStcFetch} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ color: '#4b5563', display: 'block', marginBottom: '8px', fontWeight: '500' }}>📅 Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '10px', 
                background: '#f9fafb', 
                color: '#1a1a2e', 
                border: '1px solid #e5e7eb',
                fontSize: '1rem'
              }}
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ color: '#4b5563', display: 'block', marginBottom: '8px', fontWeight: '500' }}>📊 Quarter</label>
            <select 
              value={quarter} 
              onChange={(e) => setQuarter(e.target.value)} 
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '10px', 
                background: '#f9fafb', 
                color: '#1a1a2e', 
                border: '1px solid #e5e7eb',
                fontSize: '1rem'
              }}
            >
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            disabled={stcLoading}
            style={{ 
              padding: '14px 28px', 
              background: stcLoading ? '#9ca3af' : '#4f008c', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '10px', 
              cursor: stcLoading ? 'not-allowed' : 'pointer', 
              fontWeight: '600', 
              fontSize: '1rem',
              boxShadow: stcLoading ? 'none' : '0 4px 12px rgba(79, 0, 140, 0.3)',
              transition: 'all 0.3s ease',
              height: '50px'
            }}
          >
            {stcLoading ? '⏳ Fetching...' : '🔍 Fetch & Analyze'}
          </button>
        </form>
      </div>
    </div>
  );
}
