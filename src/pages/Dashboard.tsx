import { useEffect, useMemo, useRef, useState } from 'react';
import {
  InlineNotification,
  Loading,
  ClickableTile,
  Tabs,
  TabList,
  Tab,
  Button,
} from '@carbon/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTripPlans } from '../contexts/TripPlansContext';
import AppLayout from '../components/layout/AppLayout';
import { TripPlan } from '../types';
import { Add, ArrowRight, Logout } from '@carbon/icons-react';
import {
  getTripPlan,
  refreshPlanCover,
  updateLocation,
  deleteDuplicatePlans,
  createTripPlan,
} from '../services/firebase/firestore';
import {
  searchWikidataByQuery,
  enrichLocationFromWikidata,
} from '../services/wikimedia';
import type { PlanCoverResult } from '../utils/planCover';
import CoverWithPlaceholder from '../components/ui/CoverWithPlaceholder';
import {
  createExamplePlans,
  updateExamplePlanTitlesToEnglish,
  updateExamplePlanLocationsToEnglish,
  EXAMPLE_PLAN_TITLES_EN,
} from '../utils/seedExamplePlans';
import TripPlanFormModal, { TripPlanFormData } from '../components/plan/TripPlanFormModal';
import DashboardWizard from '../components/dashboard/DashboardWizard';

type DashboardTabId = 'all' | 'upcoming' | 'completed';

/** Persists across Dashboard remounts (e.g. React Strict Mode, navigation) so we never seed twice. */
const seededUserIds = new Set<string>();

// Beautiful gradient palettes - cohesive color combinations
const GRADIENT_PALETTES = [
  // Purple-Blue (like the reference image)
  { from: '#667eea', to: '#764ba2', accent: '#a855f7' },
  // Ocean Blue
  { from: '#0077b6', to: '#023e8a', accent: '#0096c7' },
  // Sunset Orange
  { from: '#f97316', to: '#c2410c', accent: '#fb923c' },
  // Forest Green
  { from: '#059669', to: '#047857', accent: '#34d399' },
  // Rose Pink
  { from: '#ec4899', to: '#be185d', accent: '#f472b6' },
  // Teal
  { from: '#14b8a6', to: '#0f766e', accent: '#2dd4bf' },
  // Indigo
  { from: '#6366f1', to: '#4338ca', accent: '#818cf8' },
  // Amber
  { from: '#f59e0b', to: '#d97706', accent: '#fbbf24' },
  // Cyan
  { from: '#06b6d4', to: '#0891b2', accent: '#22d3ee' },
  // Violet
  { from: '#8b5cf6', to: '#7c3aed', accent: '#a78bfa' },
];

// Generate consistent gradient based on plan ID (deterministic)
function getGradientForPlan(planId: string): typeof GRADIENT_PALETTES[0] {
  let hash = 0;
  for (let i = 0; i < planId.length; i++) {
    const char = planId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
}

function formatTripDateRange(start?: Date, end?: Date): string | null {
  if (!start && !end) return null;
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  if (start && end) return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
  if (start) return start.toLocaleDateString('en-US', opts);
  return end ? end.toLocaleDateString('en-US', opts) : null;
}

function TripPlanCard({
  plan,
  coverOverride,
  onClick,
}: {
  plan: TripPlan;
  coverOverride?: PlanCoverResult | null;
  onClick: () => void;
}) {
  const gradient = useMemo(() => getGradientForPlan(plan.id), [plan.id]);
  // Use summary fields directly — getTripPlans already returns totalDays/totalPoints
  const stats = { days: plan.totalDays || 0, points: plan.totalPoints || 0 };

  const coverUrl = plan.coverImage ?? coverOverride?.url;
  const fallbackStyle = useMemo(
    () => ({
      background: `linear-gradient(160deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
    }),
    [gradient.from, gradient.to]
  );

  const dateRange = formatTripDateRange(plan.startDate, plan.endDate);
  const daysLabel = stats && stats.days > 0 ? `${stats.days} ${stats.days === 1 ? 'Day' : 'Days'}` : null;
  const subtitle = plan.description ? plan.description.split(/[.\n]/)[0].trim().slice(0, 50) + (plan.description.length > 50 ? '…' : '') : null;

  return (
    <ClickableTile
      className="trip-plan-card"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      href="#"
    >
      <CoverWithPlaceholder
        coverUrl={coverUrl}
        fallbackStyle={fallbackStyle}
        className="trip-plan-card__media"
        aspectRatio="62%"
      />
      <div className="trip-plan-card__content">
        {subtitle && <p className="trip-plan-card__subtitle">{subtitle}</p>}
        <h3 className="trip-plan-card__title">{plan.title}</h3>
        {(daysLabel || dateRange) && (
          <p className="trip-plan-card__meta">
            {daysLabel}
            {daysLabel && dateRange && ' • '}
            {dateRange}
          </p>
        )}
        <div className="trip-plan-card__divider" />
        <span className="trip-plan-card__action" aria-hidden="true">
          View plan <ArrowRight size={16} />
        </span>
      </div>
    </ClickableTile>
  );
}

function isUpcoming(plan: TripPlan): boolean {
  if (!plan.endDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return plan.endDate >= today;
}

function isCompleted(plan: TripPlan): boolean {
  if (!plan.endDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return plan.endDate < today;
}

function DashboardGrid({
  loading,
  plans,
  coverOverrides,
  onPlanClick,
}: {
  loading: boolean;
  plans: TripPlan[];
  coverOverrides: Record<string, PlanCoverResult>;
  onPlanClick: (plan: TripPlan) => void;
}) {
  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loading description="Loading trip plans..." withOverlay={false} />
      </div>
    );
  }
  return (
    <div className="dashboard-grid">
      {plans.map((plan) => (
        <TripPlanCard
          key={plan.id}
          plan={plan}
          coverOverride={coverOverrides[plan.id]}
          onClick={() => onPlanClick(plan)}
        />
      ))}
    </div>
  );
}

function Dashboard() {
  const { user, signOut } = useAuth();
  const { plans, loading, loadPlans, error } = useTripPlans();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<DashboardTabId>('all');
  const [coverOverrides, setCoverOverrides] = useState<Record<string, PlanCoverResult>>({});
  const [isRemovingDuplicates, setIsRemovingDuplicates] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<{ removed: number } | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [isQuickModeOpen, setIsQuickModeOpen] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const refreshedCoverPlanIdsRef = useRef<Set<string>>(new Set());
  const enrichingCoverPlanIdRef = useRef<string | null>(null);
  const examplePlansMigratedRef = useRef(false);
  const examplePlanLocationsMigratedRef = useRef(false);
  const examplePlansSeededRef = useRef(false);

  // Auto-seed 6 example plans for piotrekkoz@gmail.com when they have no plans (one-time only)
  useEffect(() => {
    if (!user?.uid || !user?.email || loading || plans.length > 0 || examplePlansSeededRef.current) return;
    if (user.email !== 'piotrekkoz@gmail.com') return;
    if (seededUserIds.has(user.uid)) return; // Already seeded this user (e.g. after remount) – never seed again
    seededUserIds.add(user.uid);
    examplePlansSeededRef.current = true;
    createExamplePlans(user.uid)
      .then((ids) => {
        if (ids.length > 0) loadPlans();
      })
      .catch((err) => {
        console.error('[Dashboard] Auto-seed example plans:', err);
        examplePlansSeededRef.current = false;
        seededUserIds.delete(user.uid);
      });
  }, [user?.uid, user?.email, loading, plans.length, loadPlans]);

  useEffect(() => {
    if (user) {
      loadPlans().catch((err) => {
        console.error('[Dashboard] Error loading plans:', err);
      });
    }
  }, [user, loadPlans]);

  // One-time migration: update example plans with Polish titles to English
  useEffect(() => {
    if (!user?.uid || !plans.length || examplePlansMigratedRef.current) return;
    const hasPolish = plans.some(
      (p) =>
        p.title === 'Rzym szlakiem klasyków' ||
        p.title === 'Poznań zorientowane na restauracje' ||
        p.title === 'Berlin trip muzyczny' ||
        p.title === 'Tokyo trip fotograficzny' ||
        p.title === 'Jezioro Garda' ||
        p.title === 'Praga'
    );
    if (!hasPolish) return;
    examplePlansMigratedRef.current = true;
    updateExamplePlanTitlesToEnglish(user.uid)
      .then(() => loadPlans())
      .catch((err) => console.error('[Dashboard] Example plans migration:', err));
  }, [user?.uid, plans, loadPlans]);

  // One-time migration: update location names/descriptions to English in example plans (e.g. after title migration or when locations were still Polish)
  useEffect(() => {
    if (!user?.uid || !plans.length || examplePlanLocationsMigratedRef.current) return;
    const hasExamplePlans = plans.some((p) => EXAMPLE_PLAN_TITLES_EN.has(p.title));
    if (!hasExamplePlans) return;
    examplePlanLocationsMigratedRef.current = true;
    updateExamplePlanLocationsToEnglish(user.uid)
      .then(() => loadPlans())
      .catch((err) => console.error('[Dashboard] Example plan locations migration:', err));
  }, [user?.uid, plans, loadPlans]);

  // Lazy-fill cover: for plans with no cover, enrich first location from Wikidata then refresh cover (one plan at a time)
  useEffect(() => {
    const planToEnrich = plans.find(
      (p) =>
        p.totalPoints > 0 &&
        !(p.coverImage && p.coverImage.trim()) &&
        !coverOverrides[p.id] &&
        !refreshedCoverPlanIdsRef.current.has(p.id) &&
        enrichingCoverPlanIdRef.current !== p.id
    );
    if (!planToEnrich) return;

    enrichingCoverPlanIdRef.current = planToEnrich.id;
    const planId = planToEnrich.id;

    (async () => {
      try {
        const fullPlan = await getTripPlan(planId);
        let updatedPlan = fullPlan;
        for (const day of fullPlan.days ?? []) {
          let didUpdate = false;
          for (const loc of day.locations ?? []) {
            if (loc.image?.trim()) continue;
            const name = loc.name?.trim();
            if (!name || name.length < 2) continue;
            const qId = await searchWikidataByQuery(name);
            if (!qId) continue;
            const enriched = await enrichLocationFromWikidata(qId);
            if (!enriched.image) continue;
            await updateLocation(planId, day.id, loc.id, {
              image: enriched.image,
              imageAttribution: enriched.imageAttribution,
              wikidataId: qId,
              ...(enriched.description && { description: enriched.description }),
              ...(enriched.wikipediaUrl && { wikipediaUrl: enriched.wikipediaUrl }),
            });
            // Apply the image update to the in-memory plan so refreshPlanCover skips getTripPlan
            updatedPlan = {
              ...fullPlan,
              days: fullPlan.days?.map((d) =>
                d.id !== day.id ? d : {
                  ...d,
                  locations: d.locations.map((l) =>
                    l.id !== loc.id ? l : {
                      ...l,
                      image: enriched.image,
                      imageAttribution: enriched.imageAttribution,
                      wikidataId: qId,
                    }
                  ),
                }
              ),
            };
            didUpdate = true;
            break;
          }
          if (didUpdate) break;
        }
        const result = await refreshPlanCover(planId, updatedPlan);
        refreshedCoverPlanIdsRef.current.add(planId);
        if (result) {
          setCoverOverrides((prev) => ({ ...prev, [planId]: result }));
          loadPlans().catch(() => {});
        }
      } catch {
        refreshedCoverPlanIdsRef.current.add(planId);
      } finally {
        enrichingCoverPlanIdRef.current = null;
      }
    })();
  }, [plans, coverOverrides]);

  const filteredPlans = useMemo(() => {
    if (selectedTab === 'upcoming') return plans.filter(isUpcoming);
    if (selectedTab === 'completed') return plans.filter(isCompleted);
    return plans;
  }, [plans, selectedTab]);

  const upcomingCount = useMemo(() => plans.filter(isUpcoming).length, [plans]);
  const totalCount = plans.length;

  const handleQuickModeSubmit = async (data: TripPlanFormData) => {
    if (!user?.uid) return;
    setIsCreatingPlan(true);
    try {
      const planId = await createTripPlan(user.uid, {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        isPublic: false,
        mapStyle: 'minimal',
      });
      setIsQuickModeOpen(false);
      navigate(`/plan/${planId}`);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  if (!user) return null;

  return (
    <AppLayout showHeader={false} showSidebar={false}>
      <div className="dashboard-layout dashboard-layout--with-wizard">
        {/* Quick mode modal */}
        <TripPlanFormModal
          open={isQuickModeOpen}
          onClose={() => setIsQuickModeOpen(false)}
          onSubmit={handleQuickModeSubmit}
          isSubmitting={isCreatingPlan}
        />

        <div className="dashboard-main">
          {/* Header band */}
          <div className="dashboard-header">
            <div className="dashboard-header__left">
              <h1 className="dashboard-header__title">Your trips</h1>
              <div className="dashboard-header__stats">
                <span className="dashboard-header__stat">{totalCount} {totalCount === 1 ? 'plan' : 'plans'}</span>
                {upcomingCount > 0 && (
                  <span className="dashboard-header__stat dashboard-header__stat--accent">
                    {upcomingCount} upcoming
                  </span>
                )}
              </div>
            </div>
            <div className="dashboard-header__actions">
              {totalCount > 10 && (
                <Button
                  kind="ghost"
                  size="sm"
                  disabled={isRemovingDuplicates}
                  onClick={async () => {
                    if (!user?.uid || !window.confirm('Remove duplicate plans? For each duplicate title only the oldest plan will be kept. This cannot be undone.')) return;
                    setIsRemovingDuplicates(true);
                    setDuplicateResult(null);
                    setDuplicateError(null);
                    try {
                      const removed = await deleteDuplicatePlans(user.uid);
                      setDuplicateResult({ removed });
                      await loadPlans();
                    } catch (err: unknown) {
                      setDuplicateError(err instanceof Error ? err.message : 'Failed to remove duplicates');
                    } finally {
                      setIsRemovingDuplicates(false);
                    }
                  }}
                >
                  {isRemovingDuplicates ? 'Removing…' : 'Remove duplicates'}
                </Button>
              )}
              <Button
                kind="primary"
                renderIcon={Add}
                onClick={() => setIsQuickModeOpen(true)}
              >
                New Itinerary
              </Button>
            </div>
          </div>

          {/* Notifications */}
          {error && (
            <InlineNotification
              kind="error"
              title="Error Loading Plans"
              subtitle={error}
              className="dashboard-notification"
            />
          )}
          {duplicateError && (
            <InlineNotification
              kind="error"
              title="Remove duplicates failed"
              subtitle={duplicateError}
              onClose={() => setDuplicateError(null)}
              className="dashboard-notification"
            />
          )}
          {duplicateResult && duplicateResult.removed > 0 && (
            <InlineNotification
              kind="success"
              title="Duplicates removed"
              subtitle={`${duplicateResult.removed} duplicate plan(s) removed. You now have unique plans only.`}
              onClose={() => setDuplicateResult(null)}
              className="dashboard-notification"
            />
          )}

          <div className="dashboard-toolbar">
            <Tabs
              selectedIndex={selectedTab === 'all' ? 0 : selectedTab === 'upcoming' ? 1 : 2}
              onChange={({ selectedIndex }) =>
                setSelectedTab(selectedIndex === 0 ? 'all' : selectedIndex === 1 ? 'upcoming' : 'completed')
              }
            >
              <TabList aria-label="Dashboard tabs">
                <Tab>All plans</Tab>
                <Tab>Upcoming</Tab>
                <Tab>Completed</Tab>
              </TabList>
            </Tabs>
          </div>

          <DashboardGrid
            loading={loading}
            plans={filteredPlans}
            coverOverrides={coverOverrides}
            onPlanClick={(plan) => navigate(`/plan/${plan.id}`)}
          />

          <div className="dashboard-footer">
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Logout}
              iconDescription="Sign out"
              onClick={async () => {
                try {
                  await signOut();
                  navigate('/login');
                } catch (e) {
                  console.error('Sign out error:', e);
                }
              }}
            >
              Sign out
            </Button>
          </div>
        </div>

        {/* Wizard panel */}
        <div className="dashboard-wizard-panel">
          <DashboardWizard onQuickMode={() => setIsQuickModeOpen(true)} />
        </div>
      </div>
    </AppLayout>
  );
}

export default Dashboard;

