import { useEffect, useRef } from 'react';
import { useTripPlans } from '../contexts/TripPlansContext';

/**
 * Hook to automatically save trip plan changes after a debounce period
 * This ensures changes are saved in the background without user intervention
 */
export function useAutoSave(planId: string | undefined, enabled: boolean = true) {
  const { currentPlan, updatePlan } = useTripPlans();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPlanRef = useRef<string | null>(null);

  useEffect(() => {
    // Don't auto-save if disabled, no plan, or plan is new
    if (!enabled || !planId || planId === 'new' || !currentPlan) {
      return;
    }

    // Serialize current plan to compare with last saved version
    const currentPlanKey = JSON.stringify({
      id: currentPlan.id,
      title: currentPlan.title,
      description: currentPlan.description,
      startDate: currentPlan.startDate?.toISOString(),
      endDate: currentPlan.endDate?.toISOString(),
      mapStyle: currentPlan.mapStyle,
      isPublic: currentPlan.isPublic,
      shareToken: currentPlan.shareToken,
    });

    // Skip if plan hasn't changed
    if (currentPlanKey === lastSavedPlanRef.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 2 seconds of inactivity
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const updates = {
          title: currentPlan.title,
          description: currentPlan.description,
          startDate: currentPlan.startDate,
          endDate: currentPlan.endDate,
          mapStyle: currentPlan.mapStyle,
          isPublic: currentPlan.isPublic,
          shareToken: currentPlan.shareToken,
        };

        await updatePlan(planId, updates, true); // Skip reload for auto-save
        lastSavedPlanRef.current = currentPlanKey;
      } catch (error) {
        console.error('Auto-save failed:', error);
        // Don't show error to user - auto-save should be silent
      }
    }, 2000); // 2 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [planId, currentPlan, updatePlan, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
}

