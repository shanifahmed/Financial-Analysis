import React, { useEffect, useState } from 'react';
import { getAllFinancials, deleteFinancialData } from './api';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const cardStyle = {
  background: '#ffffff',
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  border: '1px solid #e5e7eb',
  padding: '24px'
};

const titleStyle = {
  color: '#4f008c',
  marginTop: 0,
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: '20px'
};

export default function DashboardPage() {
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data } = await getAllFinancials();
      setFinancials(data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteFinancialData(id);
        loadData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete document');
      }
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading Dashboard...</div>;
  }

  // Sort data for charts (oldest to newest)
  const trendData = [...financials].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const labels = trendData.map(f => {
    // Try to use a shorter label if possible, e.g. date or truncated filename
    return f.originalFilename.length > 15 ? f.originalFilename.substring(0, 12) + '...' : f.originalFilename;
  });

  const lineChartData = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: trendData.map(f => f.revenue),
        borderColor: '#4f008c',
        backgroundColor: 'rgba(79, 0, 140, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#4f008c',
      },
      {
        label: 'Net Income',
        data: trendData.map(f => f.netIncome),
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#059669',
      },
      {
        label: 'EBITDA',
        data: trendData.map(f => f.ebitda),
        borderColor: '#d97706',
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#d97706',
      }
    ]
  };

  // Pie Chart Data (Latest Document)
  const latest = financials.length > 0 ? financials[0] : null; // financials is sorted desc by default from API
  const pieChartData = latest ? {
    labels: ['Net Income', 'Expenses'],
    datasets: [
      {
        data: [latest.netIncome, Math.max(0, latest.revenue - latest.netIncome)],
        backgroundColor: ['#4f008c', '#e5e7eb'],
        borderWidth: 0,
      }
    ]
  } : null;

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ color: '#4f008c', fontSize: '2rem', marginBottom: '10px', fontWeight: 700 }}>
          Financial Overview
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem', margin: 0 }}>
          Aggregate analysis of {financials.length} uploaded document{financials.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {financials.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px' }}>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>No documents found. Upload some financial statements to see the analysis.</p>
          <a href="/" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none', color: '#4f008c', fontWeight: '600' }}>Go to Upload &rarr;</a>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '40px' }}>
            {/* Line Chart */}
            <div style={cardStyle}>
              <h3 style={titleStyle}>Financial Trends</h3>
              <div style={{ height: '350px' }}>
                <Line 
                  data={lineChartData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top', align: 'end' },
                      tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                      y: { grid: { color: '#f3f4f6' }, ticks: { callback: (val) => val.toLocaleString() } },
                      x: { grid: { display: false } }
                    }
                  }} 
                />
              </div>
            </div>

            {/* Pie Chart */}
            <div style={cardStyle}>
              <h3 style={titleStyle}>Profitability Mix (Latest)</h3>
              <div style={{ height: '300px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                {pieChartData && <Pie data={pieChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />}
                {!pieChartData && <p>No data available</p>}
              </div>
              {latest && (
                <div style={{ textAlign: 'center', marginTop: '15px', color: '#6b7280', fontSize: '0.9rem' }}>
                  Source: <strong>{latest.originalFilename}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div style={cardStyle}>
            <h3 style={titleStyle}>Document History</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #4f008c' }}>
                    <th style={{ textAlign: 'left', padding: '15px', color: '#4f008c' }}>Document Name</th>
                    <th style={{ textAlign: 'left', padding: '15px', color: '#4f008c' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '15px', color: '#4f008c' }}>Revenue</th>
                    <th style={{ textAlign: 'right', padding: '15px', color: '#4f008c' }}>EBITDA</th>
                    <th style={{ textAlign: 'right', padding: '15px', color: '#4f008c' }}>Net Income</th>
                    <th style={{ textAlign: 'right', padding: '15px', color: '#4f008c' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {financials.map(doc => (
                    <tr key={doc._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '15px', fontWeight: '500', color: '#1f2937' }}>{doc.originalFilename}</td>
                      <td style={{ padding: '15px', color: '#6b7280' }}>{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontFamily: 'monospace' }}>{doc.revenue?.toLocaleString()}</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontFamily: 'monospace' }}>{doc.ebitda?.toLocaleString()}</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontFamily: 'monospace' }}>{doc.netIncome?.toLocaleString()}</td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDelete(doc._id)}
                          style={{ 
                            background: '#fee2e2', 
                            color: '#ef4444', 
                            border: 'none', 
                            padding: '6px 12px', 
                            borderRadius: '6px', 
                            cursor: 'pointer', 
                            fontWeight: '600',
                            fontSize: '0.85rem'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
