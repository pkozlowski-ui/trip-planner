import { useState, useMemo, Component, type ErrorInfo, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, TextInput, InlineNotification, Loading } from '@carbon/react';
import {
  Send,
  Chat,
  DiamondOutline,
  Gem,
  ShoppingCart,
  ShoppingBag,
  Location,
  Receipt,
  Wallet,
  Idea,
  Document,
} from '@carbon/icons-react';
import type { CarbonIconType } from '@carbon/icons-react';
import { useTambo, useTamboThreadInput, ComponentRenderer } from '@tambo-ai/react';
import type { Content, TamboComponentContent, TamboToolUseContent } from '@tambo-ai/react';
import type { TamboThreadMessage } from '@tambo-ai/react';
import styles from './ChatPanel.module.scss';

/** Icon shortcodes for scan-friendly AI responses. AI can use e.g. :diamond: in markdown. */
const CHAT_ICON_MAP: Record<string, CarbonIconType> = {
  diamond: DiamondOutline,
  gem: Gem,
  gems: Gem,
  shopping: ShoppingCart,
  shop: ShoppingBag,
  location: Location,
  area: Location,
  receipt: Receipt,
  wallet: Wallet,
  tip: Idea,
  tips: Idea,
  idea: Idea,
  document: Document,
  documents: Document,
  certificate: Document,
};

const CHAT_ICON_PREFIX = 'data:icon/';

function preprocessMarkdownIcons(text: string): string {
  return text.replace(/:([a-z0-9_-]+):/gi, (_, name) => {
    const key = name.toLowerCase();
    if (CHAT_ICON_MAP[key]) return `![](${CHAT_ICON_PREFIX}${key})`;
    return `:${name}:`;
  });
}

interface ChatPanelProps {
  isCollapsed?: boolean;
  /** Proactive suggestion prompts. Appear as clickable chips above the input. */
  proactiveSuggestions?: string[];
}

/** Catches render errors in chat content (e.g. markdown, PlaceTiles) to avoid white screen. */
class ChatContentErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ChatPanel] Render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundaryFallback}>
          <InlineNotification
            kind="error"
            title="Display error"
            subtitle={this.state.error?.message ?? 'Something went wrong displaying the message.'}
            onClose={() => this.setState({ hasError: false, error: null })}
            lowContrast={false}
            hideCloseButton={false}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

function isTextContent(part: Content): part is { type: 'text'; text: string } {
  return typeof part === 'object' && part !== null && 'type' in part && (part as { type: string }).type === 'text';
}

function isComponentContent(part: Content): part is TamboComponentContent {
  return typeof part === 'object' && part !== null && 'type' in part && (part as { type: string }).type === 'component';
}

function isToolUseContent(part: Content): part is TamboToolUseContent {
  return typeof part === 'object' && part !== null && 'type' in part && (part as { type: string }).type === 'tool_use';
}

/** True if the message has at least one content part that we render (non-empty text or component). */
function hasDisplayableContent(msg: TamboThreadMessage): boolean {
  if (!Array.isArray(msg.content)) return false;
  return msg.content.some((part) => {
    if (isTextContent(part)) return !!((part as { text?: string }).text?.trim());
    return isComponentContent(part);
  });
}

/** For assistant messages with only tool_use/tool_result, return a short status line; otherwise null. */
function getToolOnlyStatusMessage(msg: TamboThreadMessage): string | null {
  if (msg.role !== 'assistant' || !Array.isArray(msg.content)) return null;
  const hasDisplayable = msg.content.some((p) => (isTextContent(p) && !!((p as { text?: string }).text?.trim())) || isComponentContent(p));
  if (hasDisplayable) return null;
  const firstTool = msg.content.find((p): p is TamboToolUseContent => isToolUseContent(p));
  if (firstTool?.statusMessage) return firstTool.statusMessage;
  const hasAnyTool = msg.content.some((p) => isToolUseContent(p) || (typeof p === 'object' && p !== null && (p as { type?: string }).type === 'tool_result'));
  return hasAnyTool ? 'Using tools…' : null;
}

const MAX_STATUS_WORDS = 6;

function truncateToWords(s: string, maxWords: number): string {
  const t = s.trim();
  if (!t) return t;
  const words = t.split(/\s+/);
  if (words.length <= maxWords) return t;
  return words.slice(0, maxWords).join(' ') + '…';
}

/** Single line status during streaming (max ~5–6 words): last reasoning chunk, last tool status, or default. */
function getStreamingStatusText(messages: TamboThreadMessage[]): string {
  let raw = 'AI is typing…';
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant') continue;
    if (Array.isArray(msg.reasoning) && msg.reasoning.length > 0) {
      const last = msg.reasoning[msg.reasoning.length - 1];
      if (typeof last === 'string' && last.trim()) {
        raw = last.trim();
        break;
      }
    }
    const toolStatus = getToolOnlyStatusMessage(msg);
    if (toolStatus) {
      raw = toolStatus;
      break;
    }
  }
  return truncateToWords(raw, MAX_STATUS_WORDS);
}

/** Sort messages chronologically by createdAt so user messages appear between AI responses. */
function sortMessagesChronologically(messages: TamboThreadMessage[]): TamboThreadMessage[] {
  const list = [...messages];
  const indexOf = (m: TamboThreadMessage) => messages.indexOf(m);
  return list.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : null;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : null;
    if (ta != null && tb != null) return ta - tb;
    if (ta != null) return -1;
    if (tb != null) return 1;
    return indexOf(a) - indexOf(b);
  });
}

function ChatPanel({ isCollapsed = false, proactiveSuggestions }: ChatPanelProps) {
  const { messages = [], currentThreadId, isStreaming, isIdentified } = useTambo();
  const { value = '', setValue, submit, isPending } = useTamboThreadInput();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const sortedMessages = useMemo(() => sortMessagesChronologically(messages), [messages]);

  const sendDisabled = !value.trim() || isPending || !isIdentified || isStreaming;

  const handleSend = async () => {
    const trimmed = (value ?? '').trim();
    if (!trimmed || sendDisabled) return;
    setSubmitError(null);
    try {
      await submit();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      setSubmitError(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isCollapsed) {
    return (
      <aside className={styles.asideCollapsed} aria-label="AI Chat collapsed">
        <Button
          kind="ghost"
          hasIconOnly
          renderIcon={Chat}
          iconDescription="AI Chat"
          className={styles.collapsedButton}
        />
      </aside>
    );
  }

  return (
    <aside className={styles.aside} aria-label="AI Chat">
      <div className={styles.header}>
        <h3 className={styles.title}>AI Chat</h3>
      </div>

      <div className={styles.messages}>
        <ChatContentErrorBoundary>
        {!isIdentified ? (
          <div className={styles.emptyState}>
            <Chat size={48} className={styles.emptyIcon} aria-hidden />
            <p className={styles.emptyTitle}>Connecting…</p>
            <p className={styles.emptySubtitle}>
              Make sure you are signed in and VITE_TAMBO_API_KEY is set to use the AI assistant.
            </p>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className={styles.emptyState}>
            <Chat size={48} className={styles.emptyIcon} aria-hidden />
            <p className={styles.emptyTitle}>Your travel co-pilot</p>
            <p className={styles.emptySubtitle}>
              Ask me anything — whether Day 3 is realistic in one day, what to eat near your Day 2 stops, or how much it will all cost.
            </p>
            <div className={styles.emptyPrompts}>
              {[
                'Is Day 1 realistic?',
                'What to eat near my stops?',
                'How much will this cost?',
                'Am I missing anything?',
              ].map((prompt) => (
                <button
                  key={prompt}
                  className={styles.emptyPromptChip}
                  onClick={async () => {
                    setValue(prompt);
                    setTimeout(async () => {
                      try { await submit(); } catch { /* handled below */ }
                    }, 50);
                  }}
                  type="button"
                  disabled={!isIdentified}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messageList}>
            {sortedMessages.map((msg) => {
              const displayable = hasDisplayableContent(msg);
              const toolOnlyStatus = getToolOnlyStatusMessage(msg);
              // Never show assistant messages that are only tool status or reasoning – show one streaming status instead
              if (!displayable && (toolOnlyStatus || (msg.role === 'assistant' && Array.isArray(msg.reasoning) && msg.reasoning.length > 0))) return null;
              if (!displayable && !toolOnlyStatus) return null;

              return (
                <div
                  key={msg.id}
                  className={msg.role === 'user' ? styles.messageUser : styles.messageAssistant}
                >
                  <div className={msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}>
                    {Array.isArray(msg.content) ? (
                      msg.content.map((part, i) => {
                        if (isTextContent(part)) {
                          const text = (part as { text?: string }).text;
                          if (!text?.trim()) return null;
                          const processed = preprocessMarkdownIcons(text);
                          return (
                            <div key={i} className={styles.textBlock}>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  img: ({ src, alt }) => {
                                    if (src?.startsWith(CHAT_ICON_PREFIX)) {
                                      const key = src.slice(CHAT_ICON_PREFIX.length).toLowerCase();
                                      const Icon = CHAT_ICON_MAP[key];
                                      if (Icon)
                                        return (
                                          <span className={styles.topicIcon} aria-hidden>
                                            <Icon size={16} />
                                          </span>
                                        );
                                    }
                                    return <img src={src ?? ''} alt={alt ?? ''} />;
                                  },
                                }}
                              >
                                {processed}
                              </ReactMarkdown>
                            </div>
                          );
                        }
                        if (isComponentContent(part) && currentThreadId) {
                          return (
                            <ComponentRenderer
                              key={part.id ?? i}
                              content={part}
                              threadId={currentThreadId}
                              messageId={msg.id}
                              fallback={<span className={styles.unknownComponent}>[Component: {(part as { name?: string }).name ?? 'unknown'}]</span>}
                            />
                          );
                        }
                        return null;
                      })
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {isStreaming && (
          <div className={styles.streaming} role="status" aria-live="polite">
            <Loading description="AI is responding" withOverlay={false} small />
            <span className={styles.streamingStatus}>{getStreamingStatusText(messages ?? [])}</span>
          </div>
        )}
        </ChatContentErrorBoundary>
      </div>

      {submitError && (
        <div className={styles.errorWrap}>
          <InlineNotification
            kind="error"
            title="Send failed"
            subtitle={submitError}
            onClose={() => setSubmitError(null)}
            lowContrast={false}
            hideCloseButton={false}
          />
        </div>
      )}

      {/* Proactive suggestion chips (B4) */}
      {proactiveSuggestions && proactiveSuggestions.length > 0 && isIdentified && (
        <div className={styles.proactiveSuggestions}>
          <span className={styles.proactiveLabel}>Suggestion</span>
          {proactiveSuggestions
            .filter((s) => !dismissedSuggestions.has(s))
            .map((suggestion) => (
              <div key={suggestion} className={styles.proactiveChipRow}>
                <button
                  className={styles.proactiveChip}
                  onClick={async () => {
                    setValue(suggestion);
                    setDismissedSuggestions((prev) => new Set([...prev, suggestion]));
                    setTimeout(async () => {
                      try { await submit(); } catch { /* error shown via submitError */ }
                    }, 50);
                  }}
                  type="button"
                  disabled={isPending || isStreaming}
                >
                  {suggestion}
                </button>
                <button
                  className={styles.proactiveDismiss}
                  onClick={() => setDismissedSuggestions((prev) => new Set([...prev, suggestion]))}
                  type="button"
                  aria-label="Dismiss suggestion"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            ))}
        </div>
      )}

      <div className={styles.inputWrap}>
        <div className={styles.inputRow}>
          <TextInput
            id="chat-input"
            labelText=""
            placeholder="Type your message…"
            value={value ?? ''}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isIdentified}
            className={styles.input}
          />
          <Button
            kind="primary"
            renderIcon={Send}
            onClick={handleSend}
            disabled={sendDisabled}
            hasIconOnly
            iconDescription={isStreaming ? 'Wait for the current response to finish' : 'Send message'}
          />
        </div>
        {isStreaming && (
          <p className={styles.waitHint} aria-live="polite">
            Poczekaj na zakończenie odpowiedzi, aby wysłać kolejną wiadomość.
          </p>
        )}
      </div>
    </aside>
  );
}

export default ChatPanel;
