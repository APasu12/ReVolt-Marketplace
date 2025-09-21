import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import MyBatteriesComponent from '../components/MyBatteriesComponent';
import { Loader2, AlertTriangle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function MyBatteriesPage() {
    const { currentUser, token } = useContext(AuthContext);
    const [batteries, setBatteries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchBatteries = useCallback(async () => {
        if (!token) {
            setIsLoading(false);
            setError("Authentication token not found.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/api/batteries`, { // 
                headers: { Authorization: `Bearer ${token}` }
            });
            setBatteries(response.data || []);
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Failed to fetch batteries.';
            setError(errorMsg);
            console.error("Fetch Batteries Error:", err.response?.data || err);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchBatteries();
    }, [fetchBatteries]);

    const handleDeleteBattery = async (batteryToDelete) => {
        if (!window.confirm(`Are you sure you want to delete the battery "${batteryToDelete.manufacturer} ${batteryToDelete.model}"? This action is permanent.`)) {
            return;
        }

        try {
            await axios.delete(`${API_URL}/api/batteries/${batteryToDelete.batteryId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBatteries(); 
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Failed to delete the battery.';
            alert(`Error: ${errorMsg}`);
            console.error("Delete Battery Error:", err.response?.data || err);
        }
    };

    const calculateMetrics = (battery) => {
        if (!battery || !battery.originalCapacity || battery.currentCapacity == null) {
            return { stateOfHealth: 'N/A' };
        }
        const soh = (battery.currentCapacity / battery.originalCapacity) * 100;
        return {
            stateOfHealth: Math.round(soh)
        };
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
             <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900 p-4">
                 <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
                    <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-200">Could Not Load Batteries</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 dark:bg-slate-900 min-h-screen">
             <MyBatteriesComponent
                batteries={batteries}
                currentUser={currentUser}
                onSelectBattery={(battery) => navigate(`/batteries/${battery.batteryId}`)}
                onAddNew={() => navigate('/batteries/new')}
                onDeleteBattery={handleDeleteBattery}
                calculateMetrics={calculateMetrics}
                theme={currentUser?.theme || 'light'}
            />
        </div>
    );
}