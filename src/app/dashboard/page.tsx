'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
  const [stats, setStats] = useState({
    totalBots: 0,
    onlineBots: 0,
    uptime: 'N/A',
    target: 'N/A',
  });
  const [bots, setBots] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchStats();
    }
  }, [user, loading, router]);

  const fetchStats = async () => {
    if (!user) return;
    
    // Count total bots for this user
    const { count: totalCount } = await supabase
      .from('bots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    // Count online bots (running status)
    const { count: onlineCount } = await supabase
      .from('bots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'running');
    
    // Get all bots for command control
    const { data: botsData } = await supabase
      .from('bots')
      .select('*')
      .eq('user_id', user.id);
    
    setBots(botsData || []);
    
    // Get first bot's server IP as target
    const { data: firstBot } = await supabase
      .from('bots')
      .select('server_ip')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    
    setStats({
      totalBots: totalCount || 0,
      onlineBots: onlineCount || 0,
      uptime: 'N/A', // TODO: Calculate from oldest running bot
      target: firstBot?.server_ip || 'N/A',
    });
  };

  const handleBulkCommand = async (action: string) => {
    if (bots.length === 0) {
      alert('No bots available');
      return;
    }

    const confirmMsg = `${action.charAt(0).toUpperCase() + action.slice(1)} all ${bots.length} bots?`;
    if (!confirm(confirmMsg)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Send command for each bot
      const promises = bots.map((bot) =>
        fetch('/api/bots/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ bot_id: bot.id, action }),
        })
      );

      await Promise.all(promises);
      alert(`${action} command sent to all bots!`);
      fetchStats();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

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
      
      <main className="flex-1 ml-[180px]">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Command Control</h1>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className='text-foreground' 
                onClick={() => handleBulkCommand('start')}
                disabled={bots.length === 0}
              >
                Start All
              </Button>
              <Button 
                size="sm" 
                className='text-foreground' 
                onClick={() => handleBulkCommand('restart')}
                disabled={bots.length === 0}
              >
                Restart All
              </Button>
              <Button 
                size="sm" 
                className='text-foreground' 
                onClick={() => handleBulkCommand('stop')}
                disabled={bots.length === 0}
              >
                Stop All
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6 text-font-inter">
            <Card>
              <CardHeader>
                <CardDescription>Total Bots</CardDescription>
                <CardTitle>{stats.totalBots}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Online</CardDescription>
                <CardTitle>{stats.onlineBots}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Uptime</CardDescription>
                <CardTitle>{stats.uptime}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Target</CardDescription>
                <CardTitle className="truncate">{stats.target}</CardTitle>
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
