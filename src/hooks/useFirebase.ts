'use client';

import { useEffect, useState } from 'react';
import { listenToBots, listenToBotStatus, listenToBotLogs } from '@/lib/firebase-api';
import type { Bot, BotLog } from '@/types/api';

export function useFirebaseBots() {
  const [bots, setBots] = useState<Record<string, Bot>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToBots((data) => {
      setBots(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { bots, loading };
}

export function useFirebaseBotStatus(botId: string | null) {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!botId) return;

    const unsubscribe = listenToBotStatus(botId, (data) => {
      setStatus(data);
    });

    return () => unsubscribe();
  }, [botId]);

  return status;
}

export function useFirebaseBotLogs(botId: string | null) {
  const [logs, setLogs] = useState<BotLog[]>([]);

  useEffect(() => {
    if (!botId) return;

    setLogs([]); // Reset logs when botId changes

    const unsubscribe = listenToBotLogs(botId, (newLog) => {
      setLogs((prev) => [...prev, newLog].slice(-100)); // Keep last 100 logs
    });

    return () => unsubscribe();
  }, [botId]);

  return logs;
}
