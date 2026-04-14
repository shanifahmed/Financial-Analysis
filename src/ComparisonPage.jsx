import React, { useState, useEffect } from 'react';
import { getAllFinancials, getAllInvestments, createInvestment, getComparison, fetchMarketData } from './api';

export default function ComparisonPage() {
  const [financials, setFinancials] = useState([]);
  const [investments, setInvestments] = useState([]);
  
  const [selectedFin, setSelectedFin] = useState('');
  const [selectedInv, setSelectedInv] = useState('');
  const [ticker, setTicker] = useState('');
  const [fetching, setFetching] = useState(false);
  
  const [newCase, setNewCase] = useState({
    name: 'Base Case',
    source: 'Bloomberg',
    revenue: 0,
    grossProfit: 0,
    ebitda: 0,
    ebit: 0,
    netIncome: 0,
    totalAssets: 0,
    equity: 0,
    currentLiabilities: 0,
    cashflowOps: 0,
    capex: 0,
    interestExpense: 0,
    taxRate: 0,
    cash: 0,
  });

  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    const f = await getAllFinancials();
    const i = await getAllInvestments();
    setFinancials(f.data);
    setInvestments(i.data);
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    await createInvestment(newCase);
    loadLists();
    alert('Investment Case Created');
  };

  const handleCompare = async () => {
    if (!selectedFin || !selectedInv) return;
    const { data } = await getComparison(selectedFin, selectedInv);
    setComparison(data);
  };

  const handleFetchTicker = async () => {
    if (!ticker) return;
    setFetching(true);
    try {
      const { data } = await fetchMarketData(ticker);
      setNewCase({
        ...newCase,
        name: data.name,
        source: data.source,
        revenue: data.revenue,
        grossProfit: data.grossProfit,
        ebitda: data.ebitda,
        ebit: data.ebit,
        netIncome: data.netIncome,
        totalAssets: data.totalAssets || 0,
        equity: data.equity || 0,
        currentLiabilities: data.currentLiabilities || 0,
        cashflowOps: data.cashflowOps || 0,
        capex: data.capex || 0,
        interestExpense: data.interestExpense || 0,
        taxRate: data.taxRate || 0,
        cash: data.cash || 0,
      });
    } catch (error) {
      console.error(error);
      const serverError = error.response?.data?.error || error.response?.data?.message || error.message;
      alert(`Failed to fetch market data: ${serverError}`);
    } finally {
      setFetching(false);
    }
  };

  // STC-styled card
  const cardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    padding: '30px'
  };

  const inputStyle = { 
    padding: '14px', 
    borderRadius: '10px', 
    border: '1px solid #e5e7eb', 
    width: '100%', 
    background: '#f9fafb', 
    color: '#1a1a2e', 
    outline: 'none',
    fontSize: '1rem'
  };

  const buttonStyle = { 
    padding: '14px 24px', 
    background: '#4f008c', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(79, 0, 140, 0.3)'
  };

  const compareButtonStyle = {
    ...buttonStyle,
    width: '100%',
    padding: '16px',
    fontSize: '1.1rem'};

  const labelStyle = { 
    display: 'block', 
    marginBottom: '8px', 
    fontWeight: '500', 
    color: '#4b5563' 
  };

  const titleStyle = {
    marginTop: 0,
    color: '#4f008c',
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '20px'
  };

  const formatVal = (val, isPercent) => {
    if (val === undefined || val === null) return '-';
    if (isPercent) return val.toFixed(2) + '%';
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#4f008c', fontSize: '2rem', marginBottom: '10px', fontWeight: 700 }}>
          Comparison Analysis
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem', margin: 0 }}>
          Compare actual financial data against benchmarks and market data
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Create Case Form */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Add Benchmark / Market Data</h3>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', paddingBottom: '25px', borderBottom: '1px solid #e5e7eb' }}>
            <input 
              style={inputStyle} 
              placeholder="Enter Ticker (e.g. AAPL)" 
              value={ticker} 
              onChange={e => setTicker(e.target.value)} 
            />
            <button 
              onClick={handleFetchTicker} 
              disabled={fetching}
              style={{ 
                ...buttonStyle, 
                marginTop: 0, 
                background: fetching ? '#9ca3af' : '#4f008c',
                boxShadow: fetching ? 'none' : `0 4px 12px rgba(79, 0, 140, 0.3)`,
                width: 'auto', 
                whiteSpace: 'nowrap' 
              }}
            >
              {fetching ? 'Fetching...' : 'Fetch Data'}
            </button>
          </div>

          <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <input 
                style={inputStyle} 
                placeholder="Case Name (e.g. Q3 Consensus)" 
                value={newCase.name} 
                onChange={e => setNewCase({...newCase, name: e.target.value})} 
              />
              <select 
                style={inputStyle} 
                value={newCase.source} 
                onChange={e => setNewCase({...newCase, source: e.target.value})}
              >
                <option value="Bloomberg">Bloomberg</option>
                <option value="Analyst">Analyst Estimate</option>
                <option value="Budget">Internal Budget</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input style={inputStyle} type="number" placeholder="Revenue" value={newCase.revenue} onChange={e => setNewCase({...newCase, revenue: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="Gross Profit" value={newCase.grossProfit} onChange={e => setNewCase({...newCase, grossProfit: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="EBITDA" value={newCase.ebitda} onChange={e => setNewCase({...newCase, ebitda: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="EBIT" value={newCase.ebit} onChange={e => setNewCase({...newCase, ebit: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="Net Income" value={newCase.netIncome} onChange={e => setNewCase({...newCase, netIncome: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="Total Assets" value={newCase.totalAssets} onChange={e => setNewCase({...newCase, totalAssets: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="Equity" value={newCase.equity} onChange={e => setNewCase({...newCase, equity: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="Current Liabilities" value={newCase.currentLiabilities} onChange={e => setNewCase({...newCase, currentLiabilities: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="Cash Flow (Ops)" value={newCase.cashflowOps} onChange={e => setNewCase({...newCase, cashflowOps: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="CAPEX" value={newCase.capex} onChange={e => setNewCase({...newCase, capex: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="Interest Expense" value={newCase.interestExpense} onChange={e => setNewCase({...newCase, interestExpense: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="Tax Rate" value={newCase.taxRate} onChange={e => setNewCase({...newCase, taxRate: Number(e.target.value)})} />
              <input style={inputStyle} type="number" placeholder="Cash" value={newCase.cash} onChange={e => setNewCase({...newCase, cash: Number(e.target.value)})} />
            </div>
            <button type="submit" style={buttonStyle}>Save Benchmark</button>
          </form>
        </div>

        {/* Selectors */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Run Comparison</h3>
          <div style={{ marginBottom: '25px' }}>
            <label style={labelStyle}>Select Actual Document:</label>
            <select 
              style={inputStyle} 
              onChange={e => setSelectedFin(e.target.value)} 
              value={selectedFin}
            >
              <option value="">-- Select --</option>
              {financials.map(f => (
                <option key={f._id} value={f._id}>{f.originalFilename}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={labelStyle}>Select Benchmark (Bloomberg):</label>
            <select 
              style={inputStyle} 
              onChange={e => setSelectedInv(e.target.value)} 
              value={selectedInv}
            >
              <option value="">-- Select --</option>
              {investments.map(i => (
                <option key={i._id} value={i._id}>{i.name} ({i.source})</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleCompare} 
            style={{
              ...buttonStyle,
              width: '100%',
              padding: '16px',
              fontSize: '1.1rem'
            }}
          >
            Compare Analysis
          </button>
        </div>
      </div>

      {comparison && (
        <div style={{ ...cardStyle, marginTop: '40px' }}>
          <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '15px', marginBottom: '25px', color: '#1a1a2e', fontSize: '1.25rem', fontWeight: 600 }}>
            Deviation Analysis
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #4f008c' }}>
                <th style={{ padding: '15px', color: '#4f008c', fontWeight: 600 }}>Metric</th>
                <th style={{ padding: '15px', color: '#4f008c', fontWeight: 600 }}>Actual</th>
                <th style={{ padding: '15px', color: '#4f008c', fontWeight: 600 }}>Benchmark ({comparison.investment.source})</th>
                <th style={{ padding: '15px', color: '#4f008c', fontWeight: 600 }}>Deviation</th>
                <th style={{ padding: '15px', color: '#4f008c', fontWeight: 600 }}>% Diff</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(comparison.comparison).map(([key, row], idx) => {
                const isPositive = row.deviation >= 0;
                // For expenses (like CAPEX), positive deviation might be bad, but let's stick to simple math for now: Green = Higher than benchmark
                const color = isPositive ? '#059669' : '#dc2626';
                const bg = idx % 2 === 0 ? '#fff' : '#f9fafb';
                
                return (
                  <tr key={key} style={{ background: bg, borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', color: '#1f2937', fontWeight: '500' }}>{row.label}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#374151' }}>
                      {formatVal(row.actual, row.isPercent)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: '#6b7280' }}>
                      {formatVal(row.benchmark, row.isPercent)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', color: color, fontWeight: '600' }}>
                      {row.deviation > 0 ? '+' : ''}{formatVal(row.deviation, row.isPercent)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{ 
                        background: isPositive ? '#d1fae5' : '#fee2e2', 
                        color: color,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {row.percent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
