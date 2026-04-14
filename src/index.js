import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export const uploadDocument = (formData) => API.post('/upload', formData);
export const getFinancialData = (id) => API.get(`/financial/${id}`);
export const getAllFinancials = () => API.get('/financial');
export const deleteFinancialData = (id) => API.delete(`/financial/${id}`);
export const createInvestment = (data) => API.post('/investment', data);
export const getAllInvestments = () => API.get('/investment');
export const fetchMarketData = (ticker) => API.post('/investment/fetch', { ticker });
export const fetchStcFinancials = (year, quarter) => API.post('/financial/stc', { year, quarter });
export const getComparison = (finId, invId) => API.get(`/comparison/${finId}/${invId}`);