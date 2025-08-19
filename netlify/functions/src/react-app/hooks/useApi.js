"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useActivities = useActivities;
exports.useKPIs = useKPIs;
exports.useFunctions = useFunctions;
exports.useActivityNames = useActivityNames;
exports.useCalculator = useCalculator;
exports.useKPILimit = useKPILimit;
exports.useAvailableKPIs = useAvailableKPIs;
const react_1 = require("react");
const API_BASE = '/api';
function useActivities() {
    const [activities, setActivities] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/activities`);
            if (!response.ok)
                throw new Error('Failed to fetch activities');
            const data = await response.json();
            setActivities(data);
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
            if (!response.ok)
                throw new Error('Failed to create activity');
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
            if (!response.ok)
                throw new Error('Failed to update activity');
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
            if (!response.ok)
                throw new Error('Failed to delete activity');
            await fetchActivities();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };
    (0, react_1.useEffect)(() => {
        fetchActivities();
    }, []);
    return { activities, loading, error, createActivity, updateActivity, deleteActivity, refetch: fetchActivities };
}
function useKPIs() {
    const [kpis, setKpis] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchKPIs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/kpis`);
            if (!response.ok)
                throw new Error('Failed to fetch KPIs');
            const data = await response.json();
            setKpis(data);
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
            if (!response.ok)
                throw new Error('Failed to create KPI');
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
            if (!response.ok)
                throw new Error('Failed to update KPI');
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
            if (!response.ok)
                throw new Error('Failed to delete KPI');
            await fetchKPIs();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };
    (0, react_1.useEffect)(() => {
        fetchKPIs();
    }, []);
    return { kpis, loading, error, createKPI, updateKPI, deleteKPI, refetch: fetchKPIs };
}
function useFunctions() {
    const [functions, setFunctions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchFunctions = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/functions`);
                if (!response.ok)
                    throw new Error('Failed to fetch functions');
                const data = await response.json();
                setFunctions(data);
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
function useActivityNames() {
    const [activityNames, setActivityNames] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchActivityNames = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/activity-names`);
                if (!response.ok)
                    throw new Error('Failed to fetch activity names');
                const data = await response.json();
                setActivityNames(data);
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
function useCalculator() {
    const [result, setResult] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [lastCalculationSuccess, setLastCalculationSuccess] = (0, react_1.useState)(false);
    const calculate = async (input) => {
        try {
            setLoading(true);
            setError(null);
            setLastCalculationSuccess(false);
            const response = await fetch(`${API_BASE}/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });
            if (!response.ok)
                throw new Error('Failed to calculate');
            const data = await response.json();
            setResult(data);
            setLastCalculationSuccess(true);
        }
        catch (err) {
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
function useKPILimit() {
    const [limitInfo, setLimitInfo] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const checkLimit = async (userId, dataLancamento) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE}/kpis/check-limit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    data_lancamento: dataLancamento
                }),
            });
            if (!response.ok)
                throw new Error('Failed to check KPI limit');
            const data = await response.json();
            setLimitInfo(data);
            return data;
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
function useAvailableKPIs() {
    const [kpis, setKpis] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchAvailableKPIs = async (funcao, turno) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE}/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`);
            if (!response.ok)
                throw new Error('Failed to fetch available KPIs');
            const data = await response.json();
            setKpis(data);
            return data;
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
