"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast-notification';
import { initFirebase } from '@/lib/firebase';
import { listenToCommandResult, deleteBotData } from '@/lib/firebase-api';
import { useOptimizedFirebaseBots, useOptimizedFirebaseNodes } from '@/hooks/useOptimizedFirebase';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { AuthDialog } from '@/components/auth-dialog';
import { BotCard } from '@/components/dashboard/memoized-cards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bot, Plus, Play, Square, RotateCw, Trash2 } from 'lucide-react';


export default function BotnetPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  // Use optimized Firebase hooks for real-time data
  const { botsArray, loading: botsLoading } = useOptimizedFirebaseBots();
  const { nodesArray, loading: nodesLoading } = useOptimizedFirebaseNodes();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authDialog, setAuthDialog] = useState<{
    open: boolean;
    code: string;
    link: string;
    username: string;
    commandId: string;
  }>({
    open: false,
    code: '',
    link: '',
    username: '',
    commandId: '',
  });
  const [newBot, setNewBot] = useState({
    username: '',
    server_ip: 'donutsmp.net',
    server_port: 19132,
    node_id: '',
    offline_mode: false, // false = online mode (Xbox login required)
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      // Initialize Firebase once
      initFirebase();
    }
  }, [user, loading, router]);

  // Memoize bots with node info
  const botsWithNodeInfo = useMemo(() => {
    console.log('[Botnet] Mapping bots to nodes:', {
      botsCount: botsArray.length,
      nodesCount: nodesArray.length,
      nodesLoading,
      bots: botsArray.map(b => ({ id: b.id, username: b.username, node_id: b.node_id })),
      nodes: nodesArray.map(n => ({ id: n.id, name: n.name })),
    });
    
    // If nodes are still loading and we have bots, wait for nodes
    if (nodesLoading && botsArray.length > 0 && nodesArray.length === 0) {
      console.log('[Botnet] Nodes still loading, returning bots without node info...');
    }
    
    return botsArray.map(bot => {
      const node = nodesArray.find(n => n.id === bot.node_id);
      
      if (!node && !nodesLoading) {
        console.warn(`[Botnet] No node found for bot ${bot.username} with node_id: ${bot.node_id}`);
      }
      
      return {
        ...bot,
        nodes: node ? {
          name: node.name,
          location: node.location,
        } : undefined,
      };
    });
  }, [botsArray, nodesArray, nodesLoading]);

  const handleCreateBot = async () => {
    if (!user || !newBot.username || !newBot.server_ip || !newBot.node_id) {
      showToast('Please fill all fields', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      
      if (!idToken) {
        console.error('[Create Bot] No ID token');
        showToast('Authentication failed. Please log in again.', 'error');
        router.push('/login');
        return;
      }
      
      console.log('[Create Bot] Sending request with Firebase token');
      
      const response = await fetch('/api/bots/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(newBot),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('[Create Bot] API error:', response.status, data);
        showToast(`Failed to create bot: ${data.error || 'Unknown error'}`, 'error');
        return;
      }
      
      if (data.success) {
        setIsCreateOpen(false);
        const botUsername = newBot.username;
        const botId = data.bot?.id;
        setNewBot({ username: '', server_ip: 'donutsmp.net', server_port: 19132, node_id: '', offline_mode: false });
        
        showToast('Bot created, starting...', 'info', 'ℹ️ Starting');
        
        // Send start command via REST API
        const startResponse = await fetch('/api/bots/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            bot_id: botId,
            action: 'start',
            command: null,
          }),
        });
        
        const startData = await startResponse.json();
        const commandId = startData.command_id;
        
        // Listen for command result (auth info or completion)
        if (!newBot.offline_mode && commandId) {
          console.log('[Create Bot] Listening for auth result, commandId:', commandId);
          
          listenToCommandResult(commandId, (result: any) => {
            console.log('[Create Bot] Command result received:', result);
            
            if (result.status === 'completed' && result.result?.auth) {
              console.log('[Create Bot] Auth required! Code:', result.result.auth.code);
              
              setAuthDialog({
                open: true,
                code: result.result.auth.code,
                link: result.result.auth.link,
                username: botUsername,
                commandId: commandId,
              });
              
              showToast('Xbox Login Required!', 'info', '🔐 Auth Required');
            } else if (result.status === 'completed') {
              console.log('[Create Bot] Bot started without auth');
              showToast('Bot started successfully!', 'success', '✅ Success');
            } else if (result.status === 'failed') {
              console.log('[Create Bot] Start failed:', result.result?.error);
              showToast(`Failed: ${result.result?.error || 'Unknown'}`, 'error');
            }
          });
        } else {
          console.log('[Create Bot] Offline mode or no commandId, skipping auth listener');
          showToast('Bot created successfully!', 'success', '✅ Success');
        }
      } else {
        showToast(`Failed to create bot: ${data.error}`, 'error');
      }
    } catch (error: unknown) {
      showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized bot command handler
  const handleBotCommand = useCallback(async (botId: string, action: string) => {
    if (!user) return;
    
    try {
      const bot = botsWithNodeInfo.find(b => b.id === botId);
      if (!bot) {
        showToast('Bot not found', 'error');
        return;
      }
      
      // Get Firebase ID token for authentication
      const idToken = await user.getIdToken();
      
      // Send command via REST API
      const response = await fetch('/api/bots/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          bot_id: botId,
          action: action as 'start' | 'stop' | 'restart',
          command: null,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send command');
      }
      
      showToast(`Bot ${action} command sent!`, 'success');
    } catch (error: unknown) {
      showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [user, botsWithNodeInfo, showToast]);

  // Memoized delete bot handler
  const handleDeleteBot = useCallback(async (botId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this bot?')) {
      return;
    }
    
    try {
      // Get Firebase ID token
      const idToken = await user.getIdToken();
      if (!idToken) {
        showToast('Authentication failed. Please log in again.', 'error');
        return;
      }

      const response = await fetch('/api/bots/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ bot_id: botId }),
      });

      const data = await response.json();

      if (data.success) {
        // Clean up Firebase data
        await deleteBotData(botId);
        showToast('Bot deleted successfully!', 'success', '✅ Deleted');
      } else {
        showToast(`Failed: ${data.error}`, 'error');
      }
    } catch (error: unknown) {
      showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [user, showToast]);

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
      
      {/* Auth Dialog */}
      <AuthDialog
        open={authDialog.open}
        onOpenChange={(open) => setAuthDialog({ ...authDialog, open })}
        code={authDialog.code}
        link={authDialog.link}
        username={authDialog.username}
      />

      <main className="flex-1 w-full lg:ml-[180px] pt-[60px] lg:pt-0 pb-[80px] lg:pb-0">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold">Botnet</h1>
              <p className="text-sm text-muted-foreground">
                Manage your bot instances
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => window.location.reload()}
                disabled={botsLoading}
              >
                <RotateCw className={`w-4 h-4 mr-2 ${botsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full sm:w-auto" size="sm">
                    <Plus className="w-4 h-4" />
                    Create Bot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Bot</DialogTitle>
                    <DialogDescription>
                      Add a new bot instance to your network
                    </DialogDescription>
                  </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Bot Username</Label>
                    <Input
                      id="username"
                      placeholder="e.g., mybot123"
                      value={newBot.username}
                      onChange={(e) => setNewBot({ ...newBot, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="server">Server IP</Label>
                    <Input
                      id="server"
                      placeholder="e.g., donutsmp.net"
                      value={newBot.server_ip}
                      onChange={(e) => setNewBot({ ...newBot, server_ip: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Server Port</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder="19132"
                      value={newBot.server_port}
                      onChange={(e) => setNewBot({ ...newBot, server_port: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="node">Node</Label>
                    <Select value={newBot.node_id} onValueChange={(value) => setNewBot({ ...newBot, node_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a node" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodesArray.filter(node => node.status === 'online').map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            {node.name} - {node.location}
                          </SelectItem>
                        ))}
                        {nodesArray.filter(node => node.status === 'online').length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No online nodes available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="offline_mode"
                      checked={newBot.offline_mode}
                      onChange={(e) => setNewBot({ ...newBot, offline_mode: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="offline_mode" className="text-sm font-normal">
                      Offline Mode (No Xbox login required)
                    </Label>
                  </div>
                  {!newBot.offline_mode && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        ⚠️ Online mode requires Xbox authentication. Bot will need valid Microsoft account credentials. Server may reject connection.
                      </p>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={handleCreateBot}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Bot'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Bots List */}
          {botsLoading ? (
            // Skeleton Loading
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-muted animate-pulse w-9 h-9" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse w-32" />
                        <div className="h-3 bg-muted rounded animate-pulse w-40" />
                        <div className="h-3 bg-muted rounded animate-pulse w-24" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 bg-muted rounded animate-pulse w-16" />
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : botsWithNodeInfo.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bots yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first bot to get started
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bot
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {botsWithNodeInfo.map((bot) => (
                <BotCard
                  key={bot.id}
                  bot={bot}
                  onStart={() => handleBotCommand(bot.id, 'start')}
                  onStop={() => handleBotCommand(bot.id, 'stop')}
                  onRestart={() => handleBotCommand(bot.id, 'restart')}
                  onDelete={() => handleDeleteBot(bot.id)}
                  disabled={isLoading}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}