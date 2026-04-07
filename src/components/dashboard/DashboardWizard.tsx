import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Button, Loading } from '@carbon/react';
import { Send, Checkmark } from '@carbon/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  createTripPlan,
  createDay,
  createLocation,
} from '../../services/firebase/firestore';
import { searchLocations } from '../../services/geocoding';
import { buildItineraryStops } from '../../utils/destinationKnowledge';

// ── Types ────────────────────────────────────────────────────────────────────

type WizardStep =
  | 'destination'
  | 'duration'
  | 'vibe'
  | 'group'
  | 'budget'
  | 'anchor'
  | 'generating';

interface WizardMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

interface WizardAnswers {
  destination: string;
  days: number;
  vibe: string[];
  group: string;
  budget: string;
  anchor: string;
}

type DashboardWizardProps = Record<string, never>;

// ── Constants ────────────────────────────────────────────────────────────────

const DESTINATION_CHIPS = [
  'Southeast Asia',
  'Japan',
  'Balkans',
  'Morocco',
  'South America',
  'Surprise me',
];

const DURATION_CHIPS = ['7 days', '10 days', '14 days', '21 days', '1 month+'];

const VIBE_CHIPS = [
  'Slow & deep',
  'Move fast',
  'Food-obsessed',
  'History & culture',
  'Nature first',
  'Budget-focused',
  'Beach & chill',
  'Nightlife matters',
];

const GROUP_CHIPS = ['Just me', '2 people', '3–4 people', 'Bigger group'];

const BUDGET_CHIPS = [
  'Under $30/day',
  '$30–60/day',
  '$60–100/day',
  '$100+/day',
  'Skip',
];

const DESTINATION_COMMENTS: Record<string, string> = {
  vietnam:
    'Vietnam — a north-to-south adventure with incredible food and scenery.',
  japan: 'Japan — world-class food, temples, and the most efficient trains on earth.',
  thailand: 'Thailand — beaches, temples, and street food that will ruin you for other cuisines.',
  indonesia: 'Indonesia — Bali and beyond, there is so much more to explore.',
  cambodia: 'Cambodia — Angkor Wat alone is worth the trip.',
  nepal: 'Nepal — the Himalayas and one of the warmest hospitality cultures on earth.',
  india: 'India — a full sensory experience, plan more time than you think.',
  morocco: 'Morocco — medinas, desert, and Atlantic coast all within reach.',
  portugal: 'Portugal — the most underrated country in Western Europe, in my opinion.',
  spain: 'Spain — food culture, architecture, and late nights done right.',
  italy: 'Italy — you already know. Budget extra days for eating.',
  greece: 'Greece — islands are stunning, but the mainland is wildly undervisited.',
  croatia: 'Croatia — Balkans coastline with clear water and old town charm.',
  colombia: 'Colombia — Medellín transformed, Cartagena is magical, coffee region is a must.',
  peru: 'Peru — Machu Picchu plus some of the best hiking on the planet.',
  mexico: 'Mexico — more diverse than most people realise. Food alone is worth the trip.',
  'southeast asia': 'Southeast Asia — classic for a reason. Budget-friendly, food-obsessed paradise.',
  balkans: 'The Balkans — Albania, North Macedonia, Bosnia — cheaper and less crowded than you expect.',
  'south america':
    'South America — massive and diverse. What region are you thinking?',
};

const SEASONAL_HINTS: Record<string, string> = {
  january: 'January — good pick for Southeast Asia (dry season in Thailand and Vietnam south).',
  february: 'February — still winter in Europe, but perfect timing for Morocco.',
  march: 'March — shoulder season starting up in Europe. Cherry blossoms in Japan if you time it right.',
  april: 'April — spring in Europe, shoulder season in Japan post-bloom.',
  may: 'May — brilliant month for Southern Europe before the tourist peak.',
  june: 'June — European summer starts but beaches are not packed yet.',
  july: 'July — peak summer everywhere. Book ahead.',
  august: 'August — hottest month in Southern Europe, avoid cities if possible.',
  september: 'September — one of the best months to travel almost anywhere.',
  october: 'October — fantastic for Southeast Asia and the Mediterranean before it closes down.',
  november: 'November — Vietnam centre can get heavy rain, but north and south are fine.',
  december: 'December — festive season in Europe is magical. Southeast Asia dry season begins.',
};

// ── Utility ──────────────────────────────────────────────────────────────────

function getBotGreeting(): string {
  return "Where are you dreaming of going?";
}

function getBotDestinationReply(destination: string): string {
  const key = destination.toLowerCase().trim();
  for (const [pattern, comment] of Object.entries(DESTINATION_COMMENTS)) {
    if (key.includes(pattern)) return comment;
  }
  return `${destination} — sounds like a great adventure. Let's build it out.`;
}

function getBotDurationReply(destination: string, input: string): string {
  const lower = input.toLowerCase();
  const monthHint = Object.entries(SEASONAL_HINTS).find(([month]) =>
    lower.includes(month)
  );
  if (monthHint) {
    return `Got it. ${monthHint[1]}\n\nHow many days are you working with?`;
  }
  const dayMatch = input.match(/(\d+)/);
  if (dayMatch) {
    const d = parseInt(dayMatch[1], 10);
    if (d >= 21) return `${d} days in ${destination} — you are going to eat extremely well.`;
    if (d >= 14) return `Two weeks in ${destination}. A solid window to get off the beaten path.`;
    if (d >= 10) return `10 days — enough to go deep in one region rather than rushing through everything.`;
    return `${d} days. Let us make each one count.`;
  }
  return `Good to know. Let's figure out the vibe next.`;
}

function parseDays(input: string): number {
  const lower = input.toLowerCase();

  // Months — "1 month", "2 months", "1 month+", "miesiąc"
  if (lower.includes('month') || lower.includes('miesią')) {
    const m = lower.match(/(\d+)\s*month/);
    return m ? Math.min(parseInt(m[1], 10) * 30, 60) : 30;
  }

  // Weeks — "1 week", "2 weeks", "tydz" (Polish abbreviation / tydzień / tygodnie)
  if (lower.includes('week') || lower.includes('tydz') || lower.includes('woche')) {
    const w = lower.match(/(\d+)\s*(?:week|tydz|woch)/);
    return w ? Math.min(Math.max(parseInt(w[1], 10) * 7, 7), 60) : 7;
  }

  // Explicit days — "14 days", "14 dni", "14 días"
  const dayMatch = lower.match(/(\d+)\s*(?:day|dni|día|dzie)/);
  if (dayMatch) return Math.min(Math.max(parseInt(dayMatch[1], 10), 1), 60);

  // Raw number (chip value like "21 days" already handled above; fallback for bare "21")
  const numMatch = lower.match(/(\d+)/);
  if (numMatch) return Math.min(Math.max(parseInt(numMatch[1], 10), 1), 60);

  return 7;
}

function buildPlanTitle(answers: WizardAnswers): string {
  const dest = answers.destination || 'Trip';
  const days = answers.days ? `${answers.days} days` : '';
  return days ? `${dest} • ${days}` : dest;
}

function buildPlanDescription(answers: WizardAnswers): string {
  const parts: string[] = [];
  if (answers.vibe.length > 0) parts.push(answers.vibe.join(', '));
  if (answers.group && answers.group !== 'Skip') parts.push(answers.group.toLowerCase());
  if (answers.budget && answers.budget !== 'Skip') parts.push(answers.budget.toLowerCase());
  if (answers.anchor && answers.anchor !== 'Nope, all open')
    parts.push(`Anchor: ${answers.anchor}`);
  return parts.join(' · ');
}

// ── Component ────────────────────────────────────────────────────────────────

function DashboardWizard(_props: DashboardWizardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<WizardMessage[]>([
    { id: 'bot-0', role: 'bot', text: getBotGreeting() },
  ]);
  const [step, setStep] = useState<WizardStep>('destination');
  const [inputValue, setInputValue] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [generatingLines, setGeneratingLines] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<WizardAnswers>({
    destination: '',
    days: 7,
    vibe: [],
    group: '',
    budget: '',
    anchor: '',
  });

  // ── Scroll to bottom ────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTransitioning]);

  // ── Add bot message with a small delay for naturalness ──────────────────
  const addBotMessage = useCallback(
    (text: string, delay = 350) => {
      return new Promise<void>((resolve) => {
        setIsTransitioning(true);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { id: `bot-${Date.now()}`, role: 'bot', text },
          ]);
          setIsTransitioning(false);
          resolve();
        }, delay);
      });
    },
    []
  );

  // ── Submit an answer ────────────────────────────────────────────────────
  const submitAnswer = useCallback(
    async (userText: string, rawValue?: string) => {
      if (!userText.trim() || isTransitioning) return;

      const displayText = userText.trim();
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: 'user', text: displayText },
      ]);
      setInputValue('');

      if (step === 'destination') {
        const dest = rawValue || displayText;
        setAnswers((prev) => ({ ...prev, destination: dest }));
        const reply = getBotDestinationReply(dest);
        await addBotMessage(reply);
        await addBotMessage(
          'When are you thinking of going? You can say "sometime in October", a month, or just pick a duration.',
          200
        );
        setStep('duration');
      } else if (step === 'duration') {
        const d = parseDays(displayText);
        setAnswers((prev) => ({ ...prev, days: d }));
        const reply = getBotDurationReply(answers.destination, displayText);
        await addBotMessage(reply);
        await addBotMessage(
          'Quick vibe check — pick up to 3 that fit how you travel:',
          200
        );
        setStep('vibe');
      } else if (step === 'vibe') {
        const vibes = selectedVibes.length > 0 ? selectedVibes : [displayText];
        setAnswers((prev) => ({ ...prev, vibe: vibes }));
        setSelectedVibes([]);
        await addBotMessage(
          `A ${vibes.join(' + ').toLowerCase()} trip. My favourite kind.\n\nA few quick ones:`
        );
        await addBotMessage('Travelling solo or with company?', 100);
        setStep('group');
      } else if (step === 'group') {
        setAnswers((prev) => ({ ...prev, group: displayText }));
        if (displayText !== 'Skip') {
          await addBotMessage(
            displayText === 'Just me'
              ? 'Solo. Way easier to pivot on a whim.'
              : `${displayText} — more perspectives, more options.`
          );
        }
        await addBotMessage(
          'Budget ballpark per day? (accommodation + food + local transport)',
          100
        );
        setStep('budget');
      } else if (step === 'budget') {
        setAnswers((prev) => ({ ...prev, budget: displayText }));
        await addBotMessage('Last one — any hard must-dos or anchors?');
        await addBotMessage(
          'A specific event, a non-negotiable place, or just "Nope, all open":',
          100
        );
        setStep('anchor');
      } else if (step === 'anchor') {
        const anchor = displayText;
        const finalAnswers: WizardAnswers = { ...answers, anchor };
        setAnswers(finalAnswers);

        if (anchor !== 'Nope, all open') {
          await addBotMessage(`${anchor} — noted. That is locked in.`);
        }
        await addBotMessage(
          `Perfect. Give me a moment — building your ${answers.destination} skeleton…`,
          300
        );
        setStep('generating');
        startGeneration(finalAnswers);
      }
    },
    [step, isTransitioning, answers, selectedVibes, addBotMessage]
  );

  // ── Vibe multi-select ────────────────────────────────────────────────────
  const toggleVibe = useCallback((vibe: string) => {
    setSelectedVibes((prev) => {
      if (prev.includes(vibe)) return prev.filter((v) => v !== vibe);
      if (prev.length >= 3) return prev;
      return [...prev, vibe];
    });
  }, []);

  // ── Plan generation ──────────────────────────────────────────────────────
  const startGeneration = useCallback(
    async (finalAnswers: WizardAnswers) => {
      if (!user?.uid) return;
      setGenerationError(null);
      setGeneratingLines([]);

      const appendLine = (line: string) =>
        setGeneratingLines((prev) => [...prev, line]);

      try {
        // Safety clamp — parseDays can return low values if user typed ambiguous input (e.g. "1 week" → was incorrectly returning 1)
        const answers = { ...finalAnswers, days: Math.max(finalAnswers.days, 1) };

        // 1. Resolve stops from knowledge base (or fall back to single geocode)
        const stops = buildItineraryStops(answers.destination, answers.days);
        const useKnowledgeBase = stops.length > 0;

        // 2. Geocode each stop sequentially (200ms gap to respect Nominatim rate limit)
        appendLine(
          useKnowledgeBase
            ? `Found ${stops.length} cities for ${answers.destination}…`
            : `Geocoding ${answers.destination}…`
        );

        interface GeocodedStop {
          stopName: string;
          startDay: number;
          assignedDays: number;
          lat: number;
          lng: number;
        }

        const geocodedStops: GeocodedStop[] = [];

        if (useKnowledgeBase) {
          for (const stop of stops) {
            const label = `${stop.name} → Day${stop.assignedDays > 1 ? `s ${stop.startDay}–${stop.startDay + stop.assignedDays - 1}` : ` ${stop.startDay}`}`;
            appendLine(`✦ ${label}`);
            const results = await searchLocations(stop.searchQuery).catch(() => []);
            const geo = results[0];
            if (geo) {
              const lat = parseFloat(String(geo.lat));
              const lng = parseFloat(String(geo.lon));
              if (!isNaN(lat) && !isNaN(lng)) {
                geocodedStops.push({ stopName: stop.name, startDay: stop.startDay, assignedDays: stop.assignedDays, lat, lng });
              }
            }
            // Respect Nominatim rate limit
            await new Promise<void>((r) => setTimeout(r, 200));
          }
        } else {
          // Fallback — single geocode
          const results = await searchLocations(answers.destination).catch(() => []);
          const geo = results[0];
          if (geo) {
            const lat = parseFloat(String(geo.lat));
            const lng = parseFloat(String(geo.lon));
            if (!isNaN(lat) && !isNaN(lng)) {
              const name =
                geo.namedetails?.name ||
                geo.display_name?.split(',')[0]?.trim() ||
                answers.destination;
              geocodedStops.push({ stopName: name, startDay: 1, assignedDays: answers.days, lat, lng });
            }
          }
        }

        // 3. Create the plan document
        const title = buildPlanTitle(answers);
        const description = buildPlanDescription(answers);
        const planId = await createTripPlan(user.uid, {
          title,
          description,
          isPublic: false,
          mapStyle: 'minimal',
        });

        // 4. Create all days sequentially to preserve order
        appendLine(`Building ${answers.days}-day structure…`);
        const dayIds: string[] = [];
        for (let i = 0; i < answers.days; i++) {
          const id = await createDay(planId, { dayNumber: i + 1 });
          dayIds.push(id);
        }

        // 5. Add one location per geocoded stop at its first assigned day
        for (const stop of geocodedStops) {
          const dayIndex = stop.startDay - 1; // convert to 0-based
          const dayId = dayIds[dayIndex];
          if (dayId) {
            await createLocation(planId, dayId, {
              name: stop.stopName,
              category: 'city',
              coordinates: { lat: stop.lat, lng: stop.lng },
              order: 0,
              media: [],
            });
          }
        }

        // 6. Add anchor location to the mid-point day (if provided)
        if (answers.anchor && answers.anchor !== 'Nope, all open') {
          appendLine(`Locking in anchor: ${answers.anchor}…`);
          const anchorGeo = await searchLocations(answers.anchor).catch(() => []);
          if (anchorGeo[0] && dayIds.length > 0) {
            const midDayId = dayIds[Math.floor(dayIds.length / 2)];
            const aLat = parseFloat(String(anchorGeo[0].lat));
            const aLng = parseFloat(String(anchorGeo[0].lon));
            if (!isNaN(aLat) && !isNaN(aLng)) {
              await createLocation(planId, midDayId, {
                name:
                  anchorGeo[0].namedetails?.name ||
                  anchorGeo[0].display_name?.split(',')[0]?.trim() ||
                  answers.anchor,
                category: 'attraction',
                coordinates: { lat: aLat, lng: aLng },
                order: geocodedStops.length,
                media: [],
                notes: `Anchor: ${answers.anchor}`,
              });
            }
          }
        }

        appendLine('Saving to cloud… done ✓');

        // Navigate to Plan Editor with wizard flag
        navigate(`/plan/${planId}`, {
          state: {
            fromWizard: true,
            wizardAnswers: {
              destination: answers.destination,
              days: answers.days,
              vibe: answers.vibe,
            },
          },
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to create plan';
        setGenerationError(message);
        setStep('anchor');
        setGeneratingLines([]);
      }
    },
    [user?.uid, navigate]
  );

  // ── Keyboard handler ─────────────────────────────────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step === 'vibe') {
        if (selectedVibes.length > 0) submitAnswer(selectedVibes.join(', '));
      } else {
        const val = inputValue.trim();
        if (val) submitAnswer(val);
      }
    }
  };

  // ── Chip helpers ─────────────────────────────────────────────────────────
  const renderChips = () => {
    if (isTransitioning || step === 'generating') return null;

    if (step === 'destination') {
      return (
        <div className="wizard-chips">
          {DESTINATION_CHIPS.map((chip) => (
            <button
              key={chip}
              className="wizard-chip"
              onClick={() => submitAnswer(chip)}
              type="button"
            >
              {chip}
            </button>
          ))}
        </div>
      );
    }

    if (step === 'duration') {
      return (
        <div className="wizard-chips">
          {DURATION_CHIPS.map((chip) => (
            <button
              key={chip}
              className="wizard-chip"
              onClick={() => submitAnswer(chip)}
              type="button"
            >
              {chip}
            </button>
          ))}
        </div>
      );
    }

    if (step === 'vibe') {
      return (
        <div className="wizard-chips">
          {VIBE_CHIPS.map((chip) => {
            const selected = selectedVibes.includes(chip);
            return (
              <button
                key={chip}
                className={`wizard-chip wizard-chip--toggle${selected ? ' wizard-chip--selected' : ''}`}
                onClick={() => toggleVibe(chip)}
                type="button"
                aria-pressed={selected}
              >
                {selected && <Checkmark size={12} />}
                {chip}
              </button>
            );
          })}
          {selectedVibes.length > 0 && (
            <button
              className="wizard-chip wizard-chip--confirm"
              onClick={() => submitAnswer(selectedVibes.join(', '))}
              type="button"
            >
              Continue with {selectedVibes.length} selected →
            </button>
          )}
        </div>
      );
    }

    if (step === 'group') {
      return (
        <div className="wizard-chips">
          {GROUP_CHIPS.map((chip) => (
            <button
              key={chip}
              className="wizard-chip"
              onClick={() => submitAnswer(chip)}
              type="button"
            >
              {chip}
            </button>
          ))}
        </div>
      );
    }

    if (step === 'budget') {
      return (
        <div className="wizard-chips">
          {BUDGET_CHIPS.map((chip) => (
            <button
              key={chip}
              className="wizard-chip"
              onClick={() => submitAnswer(chip)}
              type="button"
            >
              {chip}
            </button>
          ))}
        </div>
      );
    }

    if (step === 'anchor') {
      return (
        <div className="wizard-chips">
          <button
            className="wizard-chip"
            onClick={() => submitAnswer('Nope, all open')}
            type="button"
          >
            Nope, all open
          </button>
        </div>
      );
    }

    return null;
  };

  const showTextInput = step === 'destination' || step === 'duration' || step === 'anchor';
  const sendDisabled =
    isTransitioning ||
    (step === 'vibe' ? selectedVibes.length === 0 : !inputValue.trim());

  return (
    <div className="dashboard-wizard">
      {/* Header */}
      <div className="wizard-header">
        <span className="wizard-header__title">Trip Planner AI</span>
      </div>

      {/* Message thread */}
      <div className="wizard-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`wizard-message wizard-message--${msg.role}`}
          >
            {msg.role === 'bot' && (
              <span className="wizard-message__label" aria-hidden>
                AI
              </span>
            )}
            <div className={`wizard-bubble wizard-bubble--${msg.role}`}>
              {msg.text.split('\n').map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Generating animation */}
        {step === 'generating' && (
          <div className="wizard-generating">
            {generatingLines.map((line, i) => (
              <div key={i} className="wizard-generating__line">
                {line}
              </div>
            ))}
            <div className="wizard-generating__spinner">
              <Loading description="Building plan" withOverlay={false} small />
            </div>
          </div>
        )}

        {isTransitioning && step !== 'generating' && (
          <div className="wizard-typing" aria-live="polite">
            <span className="wizard-typing__dot" />
            <span className="wizard-typing__dot" />
            <span className="wizard-typing__dot" />
          </div>
        )}

        {generationError && (
          <div className="wizard-message wizard-message--bot">
            <span className="wizard-message__label" aria-hidden>
              AI
            </span>
            <div className="wizard-bubble wizard-bubble--bot wizard-bubble--error">
              Something went wrong: {generationError}
              <br />
              <button
                className="wizard-chip"
                style={{ marginTop: '0.5rem' }}
                onClick={() => {
                  setGenerationError(null);
                  setStep('anchor');
                  setGeneratingLines([]);
                }}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chips */}
      {renderChips()}

      {/* Text input */}
      {showTextInput && (
        <div className="wizard-input-wrap">
          <input
            ref={inputRef}
            className="wizard-input"
            type="text"
            placeholder={
              step === 'destination'
                ? 'Type a country, region, or "surprise me"…'
                : step === 'duration'
                ? 'e.g. "14 days", "October", "2 weeks"…'
                : 'Type your must-do, or pick "Nope, all open"…'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTransitioning}
            aria-label="Wizard text input"
            autoFocus={step === 'destination'}
          />
          <Button
            kind="primary"
            renderIcon={Send}
            hasIconOnly
            iconDescription="Send"
            onClick={() => {
              const val = inputValue.trim();
              if (val) submitAnswer(val);
            }}
            disabled={sendDisabled || !inputValue.trim()}
            className="wizard-send-btn"
          />
        </div>
      )}

      {/* Vibe confirm hint */}
      {step === 'vibe' && !isTransitioning && selectedVibes.length === 0 && (
        <div className="wizard-input-wrap">
          <p className="wizard-hint">Select up to 3 vibes above, then click "Continue"</p>
        </div>
      )}
    </div>
  );
}

export default DashboardWizard;
