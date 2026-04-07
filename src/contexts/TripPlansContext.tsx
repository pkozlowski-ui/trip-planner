import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { TripPlan } from '../types';
import {
  getTripPlans,
  getTripPlan,
  createTripPlan as createTripPlanService,
  updateTripPlan as updateTripPlanService,
  deleteTripPlan as deleteTripPlanService,
} from '../services/firebase/firestore';
import { useAuth } from './AuthContext';

interface TripPlansContextType {
  plans: TripPlan[];
  currentPlan: TripPlan | null;
  loading: boolean;
  error: string | null;
  loadPlans: () => Promise<void>;
  loadPlan: (planId: string, forceReload?: boolean) => Promise<void>;
  createPlan: (
    planData: Omit<TripPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'days' | 'totalDays' | 'totalPoints' | 'totalDistance'>
  ) => Promise<string>;
  updatePlan: (planId: string, updates: Partial<Omit<TripPlan, 'id' | 'userId' | 'createdAt' | 'days' | 'totalDays' | 'totalPoints' | 'totalDistance'>>, skipReload?: boolean) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  clearCurrentPlan: () => void;
}

const TripPlansContext = createContext<TripPlansContextType | undefined>(undefined);

export function TripPlansProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<TripPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false); // Ref to prevent parallel calls
  const loadPlansTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for debounce timeout
  const planCacheRef = useRef<Map<string, { plan: TripPlan; timestamp: number }>>(new Map()); // Cache for plans
  const CACHE_TTL = 60000; // 60 seconds cache (increased for better performance)

  const loadPlans = useCallback(async () => {
    if (!user) {
      setPlans([]);
      return;
    }

    // Prevent parallel calls
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const userPlans = await getTripPlans(user.uid);
      setPlans(userPlans);
    } catch (err: any) {
      console.error('Error loading trip plans:', err);
      setError(err.message || 'Failed to load trip plans');
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [user]);

  const loadPlan = useCallback(async (planId: string, forceReload: boolean = false) => {
    const startTime = Date.now();
    
    // Clear cache if force reload is requested
    if (forceReload) {
      planCacheRef.current.delete(planId);
      console.log(`[loadPlan] Cache cleared for ${planId} (force reload)`);
    }
    
    // Check cache first (only if not forcing reload)
    if (!forceReload) {
      const cached = planCacheRef.current.get(planId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[loadPlan] Using cache for ${planId} (${Date.now() - cached.timestamp}ms old)`);
        setCurrentPlan(cached.plan);
        setPlans((prevPlans) =>
          prevPlans.map((p) => (p.id === planId ? cached.plan : p))
        );
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const plan = await getTripPlan(planId, forceReload);
      console.log(`[loadPlan] Loaded plan ${planId} in ${Date.now() - startTime}ms`);
      
      if (plan) {
        // Cache the plan
        planCacheRef.current.set(planId, { plan, timestamp: Date.now() });
        
        setCurrentPlan(plan);
        // Also update the plan in the plans list if it exists
        setPlans((prevPlans) =>
          prevPlans.map((p) => (p.id === planId ? plan : p))
        );
      } else {
        setError('Trip plan not found');
      }
    } catch (err: any) {
      console.error('[loadPlan] Error loading trip plan:', err);
      const errorMessage = err.message || 'Failed to load trip plan';
      setError(errorMessage);
      
      // Clear current plan on error to prevent stale data
      setCurrentPlan(null);
      
      // Re-throw so caller can handle it
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlan = useCallback(
    async (
      planData: Omit<TripPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'days' | 'totalDays' | 'totalPoints' | 'totalDistance'>
    ) => {
      if (!user) {
        throw new Error('User must be authenticated');
      }

      setLoading(true);
      setError(null);
      try {
        const planId = await createTripPlanService(user.uid, planData);
        // Reload plans to get the new plan
        await loadPlans();
        return planId;
      } catch (err: any) {
        console.error('Error creating trip plan:', err);
        setError(err.message || 'Failed to create trip plan');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, loadPlans]
  );

  const updatePlan = useCallback(
    async (
      planId: string,
      updates: Partial<Omit<TripPlan, 'id' | 'userId' | 'createdAt' | 'days' | 'totalDays' | 'totalPoints' | 'totalDistance'>>,
      skipReload: boolean = false
    ) => {
      // Don't set loading state for auto-save to avoid UI flicker
      if (!skipReload) {
        setLoading(true);
      }
      setError(null);
      try {
        await updateTripPlanService(planId, updates);
        
        // Invalidate cache
        planCacheRef.current.delete(planId);
        
        // Update current plan in state without full reload (for auto-save)
        if (currentPlan?.id === planId) {
          const updated = {
            ...currentPlan,
            ...updates,
          };
          setCurrentPlan(updated);
          // Update cache
          planCacheRef.current.set(planId, { plan: updated, timestamp: Date.now() });
        }
        
        // Only reload if explicitly requested (for manual saves)
        if (!skipReload) {
          await loadPlans();
          if (currentPlan?.id === planId) {
            await loadPlan(planId);
          }
        }
      } catch (err: any) {
        console.error('Error updating trip plan:', err);
        setError(err.message || 'Failed to update trip plan');
        throw err;
      } finally {
        if (!skipReload) {
          setLoading(false);
        }
      }
    },
    [loadPlans, loadPlan, currentPlan]
  );

  const deletePlan = useCallback(
    async (planId: string) => {
      setLoading(true);
      setError(null);
      try {
        await deleteTripPlanService(planId);
        // Remove from plans list
        setPlans((prevPlans) => prevPlans.filter((p) => p.id !== planId));
        // Clear current plan if it was deleted
        if (currentPlan?.id === planId) {
          setCurrentPlan(null);
        }
      } catch (err: any) {
        console.error('Error deleting trip plan:', err);
        setError(err.message || 'Failed to delete trip plan');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentPlan]
  );

  const clearCurrentPlan = useCallback(() => {
    setCurrentPlan(null);
  }, []);

  // Load plans when user changes (with debounce to prevent rapid calls)
  useEffect(() => {
    // Clear any pending timeout
    if (loadPlansTimeoutRef.current) {
      clearTimeout(loadPlansTimeoutRef.current);
    }

    if (user) {
      // Debounce loadPlans to prevent rapid calls
      loadPlansTimeoutRef.current = setTimeout(() => {
        loadPlans();
      }, 100); // 100ms debounce
    } else {
      setPlans([]);
      setCurrentPlan(null);
    }

    // Cleanup timeout on unmount or user change
    return () => {
      if (loadPlansTimeoutRef.current) {
        clearTimeout(loadPlansTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user, not loadPlans to avoid infinite loop

  return (
    <TripPlansContext.Provider
      value={{
        plans,
        currentPlan,
        loading,
        error,
        loadPlans,
        loadPlan,
        createPlan,
        updatePlan,
        deletePlan,
        clearCurrentPlan,
      }}
    >
      {children}
    </TripPlansContext.Provider>
  );
}

export function useTripPlans() {
  const context = useContext(TripPlansContext);
  if (context === undefined) {
    throw new Error('useTripPlans must be used within a TripPlansProvider');
  }
  return context;
}


