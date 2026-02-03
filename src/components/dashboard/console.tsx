'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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

interface BotLog {
  id: string;
  log_type: string;
  message: string;
  created_at: string;
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

  useEffect(() => {
    if (user) {
      fetchBots();
    }
  }, [user]);

  useEffect(() => {
    // Only auto-scroll if user is already at bottom
    if (consoleRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = consoleRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      if (isAtBottom) {
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    }
  }, [logs]);

  // Fetch logs when bot is selected
  useEffect(() => {
    if (selectedBotId && bots.length > 0) {
      fetchLogs();
      // Poll for new logs every 2 seconds
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedBotId, bots]);

  const fetchBots = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('bots')
      .select('id, username, status')
      .eq('user_id', user.id)
      .order('username');
    
    if (data) {
      setBots(data);
    }
  };

  const fetchLogs = async () => {
    if (!selectedBotId || bots.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/bots/logs/${selectedBotId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      
      console.log('Fetched logs:', data); // Debug log
      
      if (data.success && data.logs && data.logs.length > 0) {
        const selectedBot = bots.find((b) => b.id === selectedBotId);
        const formattedLogs = data.logs.map((log: BotLog) => {
          const time = new Date(log.created_at).toLocaleTimeString();
          return `[${time}] [${selectedBot?.username}] ${log.message}`;
        });
        
        setLogs([
          '[System] Console ready. Select a bot and enter commands.',
          ...formattedLogs,
        ]);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !selectedBotId) {
      if (!selectedBotId) {
        setLogs([...logs, '[Error] Please select a bot first']);
      }
      return;
    }

    const selectedBot = bots.find((b) => b.id === selectedBotId);
    const cmdLog = `[${selectedBot?.username}] > ${command}`;
    setLogs([...logs, cmdLog]);

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
      </div>
      <div ref={consoleRef} className="h-80 overflow-y-auto p-4 font-mono text-sm">
        {logs.map((log, i) => (
          <div key={i} className="text-gray-300 py-0.5">
            {log}
          </div>
        ))}
        <div ref={logsEndRef} />
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
