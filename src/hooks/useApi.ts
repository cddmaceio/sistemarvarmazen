import { useState, useEffect, useCallback } from 'react';
import { ActivityType, KPIType, CalculatorInputType, CalculatorResultType } from '@/shared/types';

const API_BASE = '/api';

export function useActivities() {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/activities`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }
      
      const data = await response.json();
      setActivities(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (activity: Omit<ActivityType, 'id' | 'created_at' | 'updated_at'>) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const updateActivity = async (id: number, activity: Omit<ActivityType, 'id' | 'created_at' | 'updated_at'>) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteActivity = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete activity: ${response.status}`);
      }
      
      await fetchActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return { activities, loading, error, createActivity, updateActivity, deleteActivity, refetch: fetchActivities };
}

export function useKPIs() {
  const [kpis, setKpis] = useState<KPIType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/kpis`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch KPIs: ${response.status}`);
      }
      
      const data = await response.json();
      setKpis(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createKPI = async (kpi: Omit<KPIType, 'id' | 'created_at' | 'updated_at'>) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const updateKPI = async (id: number, kpi: Omit<KPIType, 'id' | 'created_at' | 'updated_at'>) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteKPI = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/kpis/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete KPI: ${response.status}`);
      }
      
      await fetchKPIs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  return { kpis, loading, error, createKPI, updateKPI, deleteKPI, refetch: fetchKPIs };
}

export function useFunctions() {
  const [functions, setFunctions] = useState<{ funcao: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFunctions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/functions`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch functions: ${response.status}`);
        }
        
        const data = await response.json();
        // API returns string[], format as expected
        const uniqueFunctions = data || [];
        setFunctions(uniqueFunctions.map((funcao: string) => ({ funcao })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchFunctions();
  }, []);

  return { functions, loading, error };
}

export function useActivityNames() {
  const [activityNames, setActivityNames] = useState<{ nome_atividade: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivityNames = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/activity-names`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch activity names: ${response.status}`);
        }
        
        const data = await response.json();
        // API returns { results: array }, format as expected
        const uniqueNames = data.results || [];
        setActivityNames(uniqueNames);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityNames();
  }, []);

  return { activityNames, loading, error };
}

export function useCalculator() {
  const [result, setResult] = useState<CalculatorResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCalculationSuccess, setLastCalculationSuccess] = useState(false);

  const calculate = async (input: CalculatorInputType) => {
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
      
      const response_data = await response.json();
      console.log('✅ API Response data:', response_data);
      console.log('💰 Breakdown:');
      console.log('  - subtotalAtividades:', response_data.data?.subtotalAtividades);
      console.log('  - bonusKpis:', response_data.data?.bonusKpis);
      console.log('  - remuneracaoTotal:', response_data.data?.remuneracaoTotal);
      console.log('  - atividadesDetalhes:', response_data.data?.atividadesDetalhes);
      console.log('  - kpisAtingidos:', response_data.data?.kpisAtingidos);
      
      setResult(response_data.data);
      setLastCalculationSuccess(true);
      console.log('✅ Calculation completed successfully');
    } catch (err) {
      console.error('❌ Calculation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult(null);
      setLastCalculationSuccess(false);
    } finally {
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
  const [limitInfo, setLimitInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkLimit = async (userId: number, dataLancamento: string) => {
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
      const canLaunch = data.can_launch ?? true; // Use the correct field name from backend

      const limitData = {
        limitReached: !canLaunch,
        canLaunch: canLaunch,
        currentCount: data.current_count || 0,
        remainingLaunches: data.remaining_launches || 0,
        dailyLimit: data.daily_limit || 1
      };
      
      setLimitInfo(limitData);
      return limitData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLimitInfo(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { limitInfo, loading, error, checkLimit };
}

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/usuarios`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: any) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: string, userData: any) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      const updatedUser = await response.json();
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/usuarios/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}

export function useLancamentos() {
  const [lancamentos, setLancamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLancamentos();
  }, []);

  const fetchLancamentos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/lancamentos`);
      if (!response.ok) {
        throw new Error('Failed to fetch lancamentos');
      }
      const data = await response.json();
      setLancamentos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createLancamento = async (lancamentoData: any) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/lancamentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lancamentoData),
      });
      if (!response.ok) {
        throw new Error('Failed to create lancamento');
      }
      const newLancamento = await response.json();
      setLancamentos(prev => [...prev, newLancamento]);
      return newLancamento;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLancamento = async (id: string, lancamentoData: any) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/lancamentos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lancamentoData),
      });
      if (!response.ok) {
        throw new Error('Failed to update lancamento');
      }
      const updatedLancamento = await response.json();
      setLancamentos(prev => prev.map(lanc => lanc.id === id ? updatedLancamento : lanc));
      return updatedLancamento;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteLancamento = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/lancamentos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete lancamento');
      }
      setLancamentos(prev => prev.filter(lanc => lanc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    lancamentos,
    loading,
    error,
    refetch: fetchLancamentos,
    createLancamento,
    updateLancamento,
    deleteLancamento,
  };
}

export function useAvailableKPIs() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableKPIs = useCallback(async (funcao: string, turno: string) => {
    console.log('🔍 DEBUG - fetchAvailableKPIs called with:', {
      funcao,
      turno,
      funcaoType: typeof funcao,
      turnoType: typeof turno,
      funcaoLength: funcao?.length,
      turnoLength: turno?.length
    });
    
    try {
      setLoading(true);
      setError(null);
      
      // Use the API endpoint that already works correctly
      const url = `${API_BASE}/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`;
      console.log('🌐 DEBUG - Making request to:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch KPIs: ${response.status}`);
      }
      
      const data = await response.json();
      // A API retorna os KPIs no campo 'kpisAtingidos'
      const kpisData = Array.isArray(data.kpisAtingidos) ? data.kpisAtingidos : [];
      
      console.log('🔍 KPIs recebidos da API:', {
        funcao,
        turno,
        response: data,
        kpisData,
        count: kpisData.length
      });
      
      setKpis(kpisData);
      return kpisData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setKpis([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { kpis, loading, error, fetchAvailableKPIs };
}
