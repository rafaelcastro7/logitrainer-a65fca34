import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, Sparkles, Minimize2, Square, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAIAgent } from '@/hooks/useAIAgent';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SUGGESTIONS = [
  { text: '🚀 Crea un funnel de ventas completo para mi producto', icon: '🚀' },
  { text: '📧 Genera una secuencia de emails de lanzamiento de 7 días', icon: '📧' },
  { text: '📊 Analiza mi estrategia de marketing y dame mejoras', icon: '📊' },
  { text: '✍️ Escribe copy de anuncios para Instagram usando framework PAS', icon: '✍️' },
  { text: '📚 Crea un ebook sobre marketing digital con 10 capítulos', icon: '📚' },
  { text: '🎯 Dame un plan de contenido para 30 días', icon: '🎯' },
];

export default function AIChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isLoading, sendMessage, stopGeneration, clearMessages } = useAIAgent();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && !minimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, minimized]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  };

  if (!open) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center glow-primary"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>
    );
  }

  if (minimized) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50"
      >
        <Button onClick={() => setMinimized(false)} className="rounded-full gap-2 glow-primary">
          <Bot className="w-4 h-4" />
          AI Agent
          {messages.length > 0 && (
            <span className="bg-accent text-accent-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {messages.filter(m => m.role === 'assistant').length}
            </span>
          )}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] md:w-[440px] max-h-[75vh] md:max-h-[650px] flex flex-col glass-panel-elevated rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-card/90 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">AI Marketing Agent</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Streaming • Agentic AI
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearMessages} title="Clear chat">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMinimized(true)}>
            <Minimize2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[250px]">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-bold">¡Hola! Soy tu Agente de Marketing AI</p>
              <p className="text-xs text-muted-foreground mt-1">
                Genero contenido, analizo estrategias y optimizo tu marketing en tiempo real
              </p>
            </div>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => sendMessage(s.text)}
                  className="w-full text-left text-xs p-2.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-2"
                >
                  <span className="shrink-0">{s.icon}</span>
                  <span className="line-clamp-1">{s.text.replace(/^[^\s]+\s/, '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center shrink-0 mt-1">
                <Zap className="w-3 h-3 text-primary" />
              </div>
            )}
            <div className={cn(
              'max-w-[85%] rounded-xl px-3 py-2 text-sm',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-secondary/60 rounded-bl-sm'
            )}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:my-2 prose-blockquote:my-1">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                  {msg.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-primary/60 animate-pulse rounded-sm ml-0.5" />
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center shrink-0">
              <Zap className="w-3 h-3 text-primary animate-pulse" />
            </div>
            <div className="bg-secondary/60 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/50 bg-card/90 backdrop-blur-xl">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything about marketing..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm"
            rows={1}
          />
          {isLoading ? (
            <Button onClick={stopGeneration} size="icon" variant="destructive" className="shrink-0 h-10 w-10">
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!input.trim()} size="icon" className="shrink-0 h-10 w-10">
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
