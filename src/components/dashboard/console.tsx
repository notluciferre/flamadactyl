'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { initFirebase } from '@/lib/firebase';
import { listenToBots, listenToBotLogs } from '@/lib/firebase-api';
import { Trash2, ChevronsDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Bot {
  id: string;
  username: string;
  status: string;
}

export function ConsolePanel() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([
    '[System] Console ready. Select a bot and enter commands.',
  ]);
  const [command, setCommand] = useState('');
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (user) {
      // Initialize Firebase
      initFirebase();
      
      // Listen to bots from Firebase
      const unsubscribe = listenToBots((botsData: Record<string, any>) => {
        const botsList = Object.entries(botsData)
          .filter(([id, bot]: [string, any]) => {
            // Filter out deleted bots
            const status = bot.status?.status || 'stopped';
            return status !== 'deleted';
          })
          .map(([id, bot]: [string, any]) => ({
            id,
            username: bot.username || '',
            status: bot.status?.status || 'stopped',
          }));
        setBots(botsList);
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    // Auto-scroll when logs update only if user is already at bottom
    if (consoleRef.current && isAtBottom) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  // Listen to logs when bot is selected
  useEffect(() => {
    if (selectedBotId && bots.length > 0) {
      const selectedBot = bots.find(b => b.id === selectedBotId);
      if (selectedBot) {
        setLogs([`[System] Listening to ${selectedBot.username}...`]);
      }
      
      // Listen to Firebase real-time logs
      const unsubscribe = listenToBotLogs(selectedBotId, (log) => {
        let timestamp = 'Unknown';
        try {
          if (log.created_at) {
            timestamp = new Date(log.created_at).toLocaleTimeString();
          }
        } catch (e) {
          timestamp = new Date().toLocaleTimeString();
        }
        const logLine = `[${timestamp}] [${log.log_type.toUpperCase()}] ${log.message}`;
        setLogs(prev => [...prev, logLine]);
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [selectedBotId, bots]);

  // Track scroll position to show/hide floating "scroll to bottom" button
  useEffect(() => {
    const el = consoleRef.current;
    if (!el) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    // initialize
    onScroll();

    return () => el.removeEventListener('scroll', onScroll);
  }, [consoleRef]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !selectedBotId) {
      if (!selectedBotId) {
        setLogs(prev => [...prev, '[Error] Please select a bot first']);
      }
      return;
    }

    const selectedBot = bots.find((b) => b.id === selectedBotId);
    const cmdLog = `[${selectedBot?.username}] > ${command}`;
    setLogs(prev => [...prev, cmdLog]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/bots/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bot_id: selectedBotId,
          action: 'exec',
          command: command.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setLogs((prev) => [...prev, `[System] Command sent to ${selectedBot?.username}`]);
      } else {
        setLogs((prev) => [...prev, `[Error] ${data.error}`]);
      }
    } catch (error: any) {
      setLogs((prev) => [...prev, `[Error] ${error.message}`]);
    }

    setCommand('');
  };

  const clearLogs = () => {
    (async () => {
      const selectedBot = bots.find((b) => b.id === selectedBotId);
      try {
        if (selectedBotId) {
          const { data: { session } } = await supabase.auth.getSession();
          const resp = await fetch(`/api/bots/logs/${selectedBotId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
          });

          if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            setLogs(prev => [...prev, `[Error] Failed to clear logs: ${body.error || resp.statusText}`]);
            return;
          }
        }

        if (selectedBot) {
          setLogs([`[System] Listening to ${selectedBot.username}...`]);
        } else {
          setLogs(['[System] Console ready. Select a bot and enter commands.']);
        }
      } catch (err: any) {
        setLogs(prev => [...prev, `[Error] ${err?.message || String(err)}`]);
      }
    })();
  };

  const scrollToBottom = () => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  };

  return (
    <div className="bg-black/50 rounded-lg overflow-hidden border border-border">
      <div className="border-b border-border p-3 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Bot:</span>
        <Select value={selectedBotId} onValueChange={setSelectedBotId}>
          <SelectTrigger className="w-48 h-8">
            <SelectValue placeholder="Select bot" />
          </SelectTrigger>
          <SelectContent>
            {bots.filter((b) => b.status === 'running').map((bot) => (
              <SelectItem key={bot.id} value={bot.id}>
                {bot.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {bots.filter((b) => b.status === 'running').length} online
        </span>
        <div className="ml-auto flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={clearLogs}
            className="h-8"
            title="Clear logs"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="relative">
        <div ref={consoleRef} className="h-80 overflow-y-auto p-4 font-mono text-sm no-scrollbar">
        {logs.map((log, i) => (
          <div key={i} className="text-gray-300 py-0.5">
            {log}
          </div>
        ))}
        <div ref={logsEndRef} />
        </div>

        {/* Floating scroll-to-bottom button */}
        {!isAtBottom && (
          <div className="absolute bottom-3 right-3">
            <Button
              size="sm"
              onClick={() => {
                scrollToBottom();
                setIsAtBottom(true);
              }}
              className="h-9 w-9 rounded-full p-2 shadow-lg"
              title="Scroll to latest"
            >
              <ChevronsDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <form onSubmit={handleCommand} className="border-t border-border p-3 flex gap-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={selectedBotId ? "Enter command (e.g., /say Hello)" : "Select a bot first..."}
          disabled={!selectedBotId}
          className="flex-1 bg-black/30 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
        />
        <Button 
          type="submit" 
          size="sm" 
          disabled={!selectedBotId || !command.trim()}
          className="text-foreground"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
