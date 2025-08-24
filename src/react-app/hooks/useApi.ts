import { useState, useEffect } from 'react';
import { ActivityType, KPIType, CalculatorInputType, CalculatorResultType } from '@/shared/types';
import { supabase, supabaseQueries } from '@/lib/supabase';

const API_BASE = '/api';

export function useActivities() {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (activity: Omit<ActivityType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('activities')
        .insert(activity);
      
      if (error) throw error;
      await fetchActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const updateActivity = async (id: number, activity: Omit<ActivityType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({
          ...activity,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      await fetchActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteActivity = async (id: number) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setKpis(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createKPI = async (kpi: Omit<KPIType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('kpis')
        .insert(kpi);
      
      if (error) throw error;
      await fetchKPIs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const updateKPI = async (id: number, kpi: Omit<KPIType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('kpis')
        .update({
          ...kpi,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      await fetchKPIs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteKPI = async (id: number) => {
    try {
      const { error } = await supabase
        .from('kpis')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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
        const { data, error } = await supabase
          .from('kpis')
          .select('funcao_kpi')
          .order('funcao_kpi', { ascending: true });
        
        if (error) throw error;
        
        // Remove duplicates and format as expected
        const uniqueFunctions = [...new Set(data.map(item => item.funcao_kpi))];
        setFunctions(uniqueFunctions.map(funcao => ({ funcao })));
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
        const { data, error } = await supabase
          .from('activities')
          .select('nome_atividade')
          .order('nome_atividade', { ascending: true });
        
        if (error) throw error;
        
        // Remove duplicates and format as expected
        const uniqueNames = [...new Set(data.map(item => item.nome_atividade))];
        setActivityNames(uniqueNames.map(nome_atividade => ({ nome_atividade })));
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
      setLoading(true);
      setError(null);
      setLastCalculationSuccess(false);
      
      const response = await fetch(`${API_BASE}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate');
      }
      
      const data = await response.json();
      setResult(data);
      setLastCalculationSuccess(true);
    } catch (err) {
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
      const limitReached = await supabaseQueries.checkKPILimit(userId, dataLancamento);
      
      const limitData = {
        limitReached,
        canLaunch: !limitReached
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

export function useAvailableKPIs() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableKPIs = async (funcao: string, turno: string) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setKpis([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { kpis, loading, error, fetchAvailableKPIs };
}
