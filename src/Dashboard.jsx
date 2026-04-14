import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFinancials, deleteFinancialData } from './api';

export default function Dashboard() {
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const { data } = await getAllFinancials();
        setFinancials(data);
      } catch (error) {
        console.error("Failed to fetch financials", error);
        alert("Could not load financial statements.");
      } finally {
        setLoading(false);
      }
    };
    fetchFinancials();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this statement? This action cannot be undone.")) {
      try {
        await deleteFinancialData(id);
        // Remove from state for instant UI update
        setFinancials(financials.filter(f => f._id !== id));
      } catch (error) {
        console.error("Failed to delete financial statement", error);
        alert("Deletion failed. Please try again.");
      }
    }
  };

  const handleView = (id) => {
    // Assuming you have a route like /financials/:id to view details
    navigate(`/financials/${id}`);
  };

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', paddingTop: '50px' }}>Loading Dashboard...</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#ffffff' }}>Financial Statements</h2>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            padding: '10px 20px', 
            background: '#4f008c', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Upload New
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {financials.length > 0 ? financials.map(fin => (
          <div 
            key={fin._id} 
            style={{
              background: '#1a1a1a',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#2a2a2a'}
            onMouseOut={e => e.currentTarget.style.background = '#1a1a1a'}
          >
            <span 
              style={{ color: '#ffffff', fontWeight: 'bold', cursor: 'pointer' }}
              onClick={() => handleView(fin._id)}
            >
              {fin.originalFilename || 'Untitled Document'}
            </span>
            <button 
              onClick={() => handleDelete(fin._id)}
              style={{
                background: 'transparent',
                color: '#ff6b6b',
                border: '1px solid #ff6b6b',
                borderRadius: '4px',
                padding: '5px 10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#ff6b6b'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ff6b6b'; }}
            >
              Delete
            </button>
          </div>
        )) : (
          <div style={{ color: '#ccc', textAlign: 'center', padding: '50px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
            No financial statements found.
          </div>
        )}
      </div>
    </div>
  );
}
