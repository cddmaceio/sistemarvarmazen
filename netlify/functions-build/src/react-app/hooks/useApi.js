import { useState, useEffect } from 'react';
const API_BASE = '/api';
export function useActivities() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/activities`);
            if (!response.ok) {
                throw new Error(`Failed to fetch activities: ${response.status}`);
            }
            const data = await response.json();
            setActivities(data || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
            setLoading(false);
        }
    };
    const createActivity = async (activity) => {
        try {
            const response = await fetch(`${API_BASE}/activities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activity),
            });
            if (!response.ok) {
                throw new Error(`Failed to create activity: ${response.status}`);
            }
            await fetchActivities();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };
    const updateActivity = async (id, activity) => {
        try {
            const response = await fetch(`${API_BASE}/activities/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activity),
            });
            if (!response.ok) {
                throw new Error(`Failed to update activity: ${response.status}`);
            }
            await fetchActivities();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };
    const deleteActivity = async (id) => {
        try {
            const response = await fetch(`${API_BASE}/activities/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`Failed to delete activity: ${response.status}`);
            }
            await fetchActivities();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };
    useEffect(() => {
        fetchActivities();
    }, []);
    return { activities, loading, error, createActivity, updateActivity, deleteActivity, refetch: fetchActivities };
}
export function useKPIs() {
    const [kpis, setKpis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchKPIs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/kpis`);
            if (!response.ok) {
                throw new Error(`Failed to fetch KPIs: ${response.status}`);
            }
            const data = await response.json();
            setKpis(data || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
            setLoading(false);
        }
    };
    const createKPI = async (kpi) => {
        try {
            const response = await fetch(`${API_BASE}/kpis`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kpi),
            });
            if (!response.ok) {
                throw new Error(`Failed to create KPI: ${response.status}`);
            }
            await fetchKPIs();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };
    const updateKPI = async (id, kpi) => {
        try {
            const response = await fetch(`${API_BASE}/kpis/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kpi),
            });
            if (!response.ok) {
                throw new Error(`Failed to update KPI: ${response.status}`);
            }
            await fetchKPIs();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };
    const deleteKPI = async (id) => {
        try {
            const response = await fetch(`${API_BASE}/kpis/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`Failed to delete KPI: ${response.status}`);
            }
            await fetchKPIs();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };
    useEffect(() => {
        fetchKPIs();
    }, []);
    return { kpis, loading, error, createKPI, updateKPI, deleteKPI, refetch: fetchKPIs };
}
export function useFunctions() {
    const [functions, setFunctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchFunctions = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/functions`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch functions: ${response.status}`);
                }
                const data = await response.json();
                // API returns { results: string[] }, format as expected
                const uniqueFunctions = data.results || [];
                setFunctions(uniqueFunctions.map((funcao) => ({ funcao })));
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
            finally {
                setLoading(false);
            }
        };
        fetchFunctions();
    }, []);
    return { functions, loading, error };
}
export function useActivityNames() {
    const [activityNames, setActivityNames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchActivityNames = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/activity-names`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch activity names: ${response.status}`);
                }
                const data = await response.json();
                // API returns { results: string[] }, format as expected
                const uniqueNames = data.results || [];
                setActivityNames(uniqueNames.map((nome_atividade) => ({ nome_atividade })));
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
            finally {
                setLoading(false);
            }
        };
        fetchActivityNames();
    }, []);
    return { activityNames, loading, error };
}
export function useCalculator() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastCalculationSuccess, setLastCalculationSuccess] = useState(false);
    const calculate = async (input) => {
        try {
            console.log('🧮 useCalculator - Starting calculation');
            console.log('📤 Sending to API:', input);
            setLoading(true);
            setError(null);
            setLastCalculationSuccess(false);
            const response = await fetch(`${API_BASE}/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            console.log('📡 API Response status:', response.status);
            console.log('📡 API Response ok:', response.ok);
            if (!response.ok) {
                const errorText = await response.text();
                console.log('❌ API Error response:', errorText);
                throw new Error(`Failed to calculate: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            console.log('✅ API Response data:', data);
            console.log('💰 Breakdown:');
            console.log('  - subtotalAtividades:', data.subtotalAtividades);
            console.log('  - bonusKpis:', data.bonusKpis);
            console.log('  - remuneracaoTotal:', data.remuneracaoTotal);
            console.log('  - atividadesDetalhes:', data.atividadesDetalhes);
            console.log('  - kpisAtingidos:', data.kpisAtingidos);
            setResult(data);
            setLastCalculationSuccess(true);
            console.log('✅ Calculation completed successfully');
        }
        catch (err) {
            console.error('❌ Calculation error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setResult(null);
            setLastCalculationSuccess(false);
        }
        finally {
            setLoading(false);
        }
    };
    const reset = () => {
        setResult(null);
        setError(null);
        setLastCalculationSuccess(false);
    };
    return { result, loading, error, calculate, reset, lastCalculationSuccess };
}
export function useKPILimit() {
    const [limitInfo, setLimitInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const checkLimit = async (userId, dataLancamento) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE}/kpis/check-limit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, data_lancamento: dataLancamento }),
            });
            if (!response.ok) {
                throw new Error(`Failed to check KPI limit: ${response.status}`);
            }
            const data = await response.json();
            const limitReached = data.limitReached || false;
            const limitData = {
                limitReached,
                canLaunch: !limitReached
            };
            setLimitInfo(limitData);
            return limitData;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setLimitInfo(null);
            return null;
        }
        finally {
            setLoading(false);
        }
    };
    return { limitInfo, loading, error, checkLimit };
}
export function useAvailableKPIs() {
    const [kpis, setKpis] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fetchAvailableKPIs = async (funcao, turno) => {
        try {
            setLoading(true);
            setError(null);
            // Use the API endpoint that already works correctly
            const response = await fetch(`${API_BASE}/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch KPIs: ${response.status}`);
            }
            const data = await response.json();
            const kpisData = data.kpisAtingidos || [];
            setKpis(kpisData);
            return kpisData;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setKpis([]);
            return [];
        }
        finally {
            setLoading(false);
        }
    };
    return { kpis, loading, error, fetchAvailableKPIs };
}
