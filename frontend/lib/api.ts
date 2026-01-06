import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getGraphSnapshot = async (year: number) => {
    const response = await apiClient.get(`/graph/snapshot/${year}`);
    return response.data;
};

export const getGlobalStats = async () => {
    const response = await apiClient.get('/graph/stats');
    return response.data;
};

export const getCountries = async () => {
    const response = await apiClient.get('/graph/countries');
    return response.data;
};

export const getCountryHistory = async (name: string) => {
    const response = await apiClient.get(`/graph/country/${name}/history`);
    return response.data;
};

export const getCountryPartners = async (name: string, year: number = 2021) => {
    const response = await apiClient.get(`/graph/country/${name}/partners?year=${year}`);
    return response.data;
};

export default apiClient;
