'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

const QUICK_ACTIONS = [
  'Why did I fail this week?',
  'Suggest an easier habit version',
  'Give me a 7-day comeback plan',
  "What's my biggest weakness?",
];

export function AICoachPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 240);
      return () => clearTimeout(t);
    } else {
      abortRef.current?.abort();
      setMessages([]);
      setInput('');
      setIsStreaming(false);
    }
  }, [open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setInput('');

    const userMessage: Message = { role: 'user', content: trimmed };
    const history = [...messages, userMessage].slice(-6);

    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            content: "I'm having trouble connecting right now. Please try again in a moment.",
            error: true,
          };
        }
        return updated;
      });
    } finally {
      // Mark as error if the response was the connection-trouble message
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (
          last?.role === 'assistant' &&
          last.content.startsWith("I'm having trouble connecting")
        ) {
          updated[updated.length - 1] = { ...last, error: true };
        }
        return updated;
      });
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const showChips = messages.length === 0;
  const lastMsg = messages[messages.length - 1];
  const isTyping = isStreaming && lastMsg?.role === 'assistant' && lastMsg.content === '';

  return (
    <>
      {/* Floating action button */}
      <div
        className="fixed z-50 md:bottom-7 md:right-7 bottom-24 right-5"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !open && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-[68px] left-1/2 -translate-x-1/2 text-[11px] font-medium text-white whitespace-nowrap pointer-events-none"
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(99,102,241,0.9)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              AI Coach
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen((o) => !o)}
          whileTap={{ scale: 0.92 }}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
            boxShadow: open
              ? '0 8px 24px rgba(99,102,241,0.5)'
              : undefined,
            animation: open ? undefined : 'coach-pulse 3s ease-in-out infinite',
          }}
          aria-label={open ? 'Close AI Coach' : 'Open AI Coach'}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="x"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.14 }}
              >
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span
                key="sparkles"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.14 }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed z-40 flex flex-col md:bottom-[104px] md:right-7 bottom-[196px] right-5"
            style={{
              width: 'min(380px, calc(100vw - 40px))',
              height: 'min(560px, 80dvh)',
              background: 'rgba(10,10,10,0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: 24,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between flex-shrink-0"
              style={{
                height: 60,
                padding: '0 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles style={{ width: 16, height: 16, color: '#818CF8' }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>AI Coach</span>
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                Powered by Claude
              </span>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto scrollbar-none"
              style={{ padding: 16 }}
            >
              {/* Quick chips */}
              {showChips && (
                <div className="mb-4">
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
                    Quick questions
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <QuickChip key={action} text={action} onSelect={sendMessage} />
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, i) => {
                if (msg.role === 'assistant' && !msg.content && !msg.error) return null;
                return <MessageBubble key={i} message={msg} />;
              })}

              {/* Typing indicator */}
              {isTyping && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="flex-shrink-0 flex items-end gap-2"
              style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your coach..."
                disabled={isStreaming}
                className="flex-1 bg-transparent outline-none resize-none scrollbar-none placeholder:text-white/25"
                style={{
                  border: 'none',
                  color: 'white',
                  fontSize: 13,
                  lineHeight: '1.5',
                  caretColor: '#818CF8',
                  maxHeight: 80,
                  fontFamily: 'inherit',
                }}
              />
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity"
                style={{
                  background: '#6366F1',
                  opacity: !input.trim() || isStreaming ? 0.4 : 1,
                  cursor: !input.trim() || isStreaming ? 'not-allowed' : 'pointer',
                }}
              >
                <ArrowUp style={{ width: 14, height: 14, color: 'white' }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuickChip({ text, onSelect }: { text: string; onSelect: (t: string) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onSelect(text)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-left transition-all duration-150"
      style={{
        padding: '10px 14px',
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
        background: hovered ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.10)',
        border: `1px solid ${hovered ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.20)'}`,
        borderRadius: 12,
        lineHeight: 1.4,
      }}
    >
      {text}
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div
      className="flex mb-3"
      style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '10px 14px',
          fontSize: 13,
          lineHeight: 1.6,
          ...(isUser
            ? {
                background: 'rgba(99,102,241,0.25)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '16px 16px 4px 16px',
                color: 'white',
              }
            : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px 16px 16px 4px',
                color: message.error ? 'rgba(248,113,113,0.9)' : 'rgba(255,255,255,0.85)',
              }),
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex mb-3" style={{ justifyContent: 'flex-start' }}>
      <div
        className="flex items-center gap-1"
        style={{
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px 16px 16px 4px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: 'rgba(99,102,241,0.6)',
              animation: `typing-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
