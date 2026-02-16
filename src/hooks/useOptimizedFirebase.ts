/**
 * Optimized Firebase Hooks with Performance Enhancements
 * - Throttled updates to prevent excessive re-renders
 * - Memoized results for stable references
 * - Automatic cleanup
 */

'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { listenToBots, listenToNodes, listenToBotStatus, listenToBotLogs } from '@/lib/firebase-api';
import { initFirebase } from '@/lib/firebase';
import { throttle } from '@/lib/retry-utils';
import type { Bot, BotLog, Node } from '@/types/api';

/**
 * Optimized hook for listening to bots with throttled updates
 * Updates at most once per second to prevent excessive re-renders
 */
export function useOptimizedFirebaseBots() {
  const [bots, setBots] = useState<Record<string, Bot>>({});
  const [loading, setLoading] = useState(true);

  // Throttled update function - max 1 update per second
  const throttledSetBots = useMemo(
    () => throttle((data: Record<string, Bot>) => {
      console.log('[useOptimizedFirebaseBots] Received data, bot count:', Object.keys(data).length);
      setBots(data);
      setLoading(false);
    }, 1000),
    []
  );

  useEffect(() => {
    // Initialize Firebase before setting up listeners
    initFirebase();
    
    console.log('[useOptimizedFirebaseBots] Setting up Firebase listener');
    const unsubscribe = listenToBots((data) => {
      throttledSetBots(data);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [throttledSetBots]);

  // Memoized bot array for stable reference
  const botsArray = useMemo(() => {
    return Object.entries(bots).map(([botId, bot]) => ({
      ...bot,
      id: botId,
    }));
  }, [bots]);

  // Memoized stats
  const stats = useMemo(() => {
    const onlineCount = botsArray.filter(b => b.status?.status === 'running').length;
    return {
      total: botsArray.length,
      online: onlineCount,
      offline: botsArray.length - onlineCount,
    };
  }, [botsArray]);

  return { bots, botsArray, stats, loading };
}

/**
 * Optimized hook for listening to nodes with throttled updates
 */
export function useOptimizedFirebaseNodes() {
  const [nodes, setNodes] = useState<Record<string, Node>>({});
  const [loading, setLoading] = useState(true);

  // Throttled update - max 1 update per 2 seconds
  const throttledSetNodes = useMemo(
    () => throttle((data: Record<string, Node>) => {
      setNodes(data);
      setLoading(false);
    }, 2000),
    []
  );

  useEffect(() => {
    // Initialize Firebase before setting up listeners
    initFirebase();
    
    const unsubscribe = listenToNodes((data) => {
      throttledSetNodes(data);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [throttledSetNodes]);

  // Memoized nodes array
  const nodesArray = useMemo(() => {
    return Object.entries(nodes).map(([nodeId, node]) => ({
      ...node,
      id: nodeId,
    }));
  }, [nodes]);

  // Memoized stats
  const stats = useMemo(() => {
    const onlineCount = nodesArray.filter(n => n.status === 'online').length;
    return {
      total: nodesArray.length,
      online: onlineCount,
      offline: nodesArray.length - onlineCount,
    };
  }, [nodesArray]);

  return { nodes, nodesArray, stats, loading };
}

/**
 * Hook for single bot status with minimal re-renders
 */
export function useOptimizedBotStatus(botId: string | null) {
  const [status, setStatus] = useState<{ status: string; error: string | null; timestamp: number } | null>(null);

  useEffect(() => {
    if (!botId) return;

    let lastStatusStr = '';

    const handleStatusUpdate = (data: { status: string; error: string | null; timestamp: number }) => {
      const dataStr = JSON.stringify(data);
      if (lastStatusStr !== dataStr) {
        lastStatusStr = dataStr;
        setStatus(data);
      }
    };

    // Throttle within effect
    const throttledUpdate = throttle(handleStatusUpdate, 500);

    const unsubscribe = listenToBotStatus(botId, (data) => {
      throttledUpdate(data);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [botId]);

  return status;
}

/**
 * Hook for bot logs with buffering
 * Batches multiple log updates to reduce re-renders
 * Note: When botId changes, the component should remount to clear logs
 * Use key={botId} on the component using this hook
 */
export function useOptimizedBotLogs(botId: string | null, maxLogs: number = 100) {
  const [logs, setLogs] = useState<BotLog[]>([]);
  const logsBufferRef = useRef<BotLog[]>([]);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Flush buffer every 500ms
  const flushLogs = useCallback(() => {
    if (logsBufferRef.current.length > 0) {
      setLogs(prev => {
        const combined = [...prev, ...logsBufferRef.current];
        logsBufferRef.current = [];
        return combined.slice(-maxLogs); // Keep only last N logs
      });
    }
  }, [maxLogs]);

  useEffect(() => {
    if (!botId) {
      return;
    }

    const unsubscribe = listenToBotLogs(botId, (newLog) => {
      // Add to buffer
      logsBufferRef.current.push(newLog);

      // Schedule flush
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
      flushTimerRef.current = setTimeout(flushLogs, 500);
    });

    return () => {
      if (unsubscribe) unsubscribe();
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushLogs(); // Flush remaining logs on cleanup
      }
    };
  }, [botId, flushLogs]);

  return logs;
}

/**
 * Hook for optimistic updates
 * Updates local state immediately before server confirms
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T, update: Partial<T>) => T
) {
  const [data, setData] = useState<T>(initialData);
  const [isPending, setIsPending] = useState(false);

  const optimisticUpdate = useCallback(
    (update: Partial<T>) => {
      setIsPending(true);
      setData(prev => updateFn(prev, update));
    },
    [updateFn]
  );

  const confirmUpdate = useCallback((confirmedData: T) => {
    setData(confirmedData);
    setIsPending(false);
  }, []);

  const revertUpdate = useCallback((originalData: T) => {
    setData(originalData);
    setIsPending(false);
  }, []);

  return {
    data,
    isPending,
    optimisticUpdate,
    confirmUpdate,
    revertUpdate,
  };
}
