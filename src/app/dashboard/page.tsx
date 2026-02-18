'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast-notification';
import { initFirebase } from '@/lib/firebase';
import { useOptimizedFirebaseBots } from '@/hooks/useOptimizedFirebase';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { ConsolePanel } from '@/components/dashboard/console';
import { CPUChart, RAMChart, NetworkChart } from '@/components/dashboard/charts';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { botsArray, stats, loading: botsLoading } = useOptimizedFirebaseBots();

  // Memoized stats calculation
  const dashboardStats = useMemo(() => {
    const firstBot = botsArray.find(b => b.status?.status === 'running');
    return {
      totalBots: stats.total,
      onlineBots: stats.online,
      uptime: 'N/A', // TODO: Calculate from oldest running bot
      target: firstBot?.server_ip || 'N/A',
    };
  }, [botsArray, stats]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      // Initialize Firebase once
      initFirebase();
    }
  }, [user, loading, router]);

  // Memoized bulk command handler
  const handleBulkCommand = useCallback(async (action: string) => {
    if (!user) {
      showToast('Not authenticated', 'error');
      return;
    }

    if (botsArray.length === 0) {
      showToast('No bots available', 'error');
      return;
    }

    const confirmMsg = `${action.charAt(0).toUpperCase() + action.slice(1)} all ${botsArray.length} bots?`;
    if (!confirm(confirmMsg)) return;

    try {
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      if (!idToken) throw new Error('Not authenticated');

      // Send REST API command for each bot
      const promises = botsArray.map(async (bot) => {
        return fetch('/api/bots/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            bot_id: bot.id,
            action,
            command: null,
          }),
        });
      });

      await Promise.all(promises);
      showToast(`${action} command sent to all ${botsArray.length} bots!`, 'success');
    } catch (error: unknown) {
      showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [user, botsArray, showToast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 w-full lg:ml-[180px] pt-[60px] lg:pt-0 pb-[80px] lg:pb-0">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Command Control</h1>
            <div className="grid grid-cols-3 sm:flex gap-2">
              <Button 
                size="sm" 
                className='text-foreground' 
                onClick={() => handleBulkCommand('start')}
                disabled={botsArray.length === 0}
              >
                Start All
              </Button>
              <Button 
                size="sm" 
                className='text-foreground' 
                onClick={() => handleBulkCommand('restart')}
                disabled={botsArray.length === 0}
              >
                Restart All
              </Button>
              <Button 
                size="sm" 
                className='text-foreground' 
                onClick={() => handleBulkCommand('stop')}
                disabled={botsArray.length === 0}
              >
                Stop All
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-font-inter">
            <Card>
              <CardHeader>
                <CardDescription>Total Bots</CardDescription>
                <CardTitle>{dashboardStats.totalBots}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Online</CardDescription>
                <CardTitle>{dashboardStats.onlineBots}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Uptime</CardDescription>
                <CardTitle>{dashboardStats.uptime}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Target</CardDescription>
                <CardTitle className="truncate">{dashboardStats.target}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Console */}
          <ConsolePanel />

          {/* Monitoring Graphs */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="text-sm font-semibold mb-4">CPU</div>
              <div className="h-32">
                <CPUChart />
              </div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="text-sm font-semibold mb-4">RAM</div>
              <div className="h-32">
                <RAMChart />
              </div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="text-sm font-semibold mb-4">Network Activity</div>
              <div className="h-32">
                <NetworkChart />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
