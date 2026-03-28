import { useState, useCallback, useRef } from 'react';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;

export function useAIAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const userMsg: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantContent = '';

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.isStreaming) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date(),
            isStreaming: true,
          },
        ];
      });
    };

    try {
      const allMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, stream: true }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const status = resp.status;
        const err = await resp.json().catch(() => ({ error: 'Request failed' }));
        const friendlyMsg = getUserFriendlyError(err.error || '', status);
        toast.error(friendlyMsg, { duration: 6000 });
        throw new Error(friendlyMsg);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {}
        }
      }

      // Mark streaming done
      setMessages(prev =>
        prev.map(m => (m.isStreaming ? { ...m, isStreaming: false } : m))
      );
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('AI Agent error:', e);
      const friendlyMsg = getUserFriendlyError(e.message || 'Error connecting to AI agent');
      toast.error(friendlyMsg, { duration: 6000 });
      setMessages(prev => [
        ...prev.filter(m => !m.isStreaming),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: friendlyMsg,
          timestamp: new Date(),
        },
      ]);
        },
      ]);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, isLoading]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages(prev =>
      prev.map(m => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, stopGeneration, clearMessages };
}
