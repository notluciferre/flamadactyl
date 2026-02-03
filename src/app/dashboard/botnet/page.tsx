"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { AuthDialog } from '@/components/auth-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface Node {
  id: string;
  name: string;
  location: string;
  status: string;
}

interface BotInstance {
  id: string;
  username: string;
  server_ip: string;
  server_port: number;
  status: string;
  node_id: string;
  nodes?: {
    name: string;
    location: string;
  };
}


export default function BotnetPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [bots, setBots] = useState<BotInstance[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBots, setIsLoadingBots] = useState(true);
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
      fetchBots();
      fetchNodes();
    }
  }, [user, loading, router]);

  const fetchBots = async () => {
    if (!user) return;
    setIsLoadingBots(true);
    
    const { data, error } = await supabase
      .from('bots')
      .select('*, nodes(name, location)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching bots:', error);
    } else {
      setBots(data || []);
    }
    setIsLoadingBots(false);
  };

  const fetchNodes = async () => {
    try {
      const response = await fetch('/api/nodes/available');
      const data = await response.json();
      
      if (data.success) {
        setNodes(data.nodes);
      }
    } catch (error) {
      console.error('Error fetching nodes:', error);
    }
  };

  const handleCreateBot = async () => {
    if (!user || !newBot.username || !newBot.server_ip || !newBot.node_id) {
      alert('Please fill all fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      
      const response = await fetch('/api/bots/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newBot),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsCreateOpen(false);
        const botUsername = newBot.username;
        setNewBot({ username: '', server_ip: 'donutsmp.net', server_port: 19132, node_id: '', offline_mode: false });
        fetchBots();
        
        // Poll command result for auth info (only if online mode)
        if (!newBot.offline_mode && data.command?.id) {
          pollCommandResult(data.command.id, botUsername);
        } else {
          alert('Bot created successfully!');
        }
      } else {
        alert(`Failed to create bot: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const pollCommandResult = async (commandId: string, username: string) => {
    console.log(`[Auth] Starting poll for command ${commandId}`);
    let attempts = 0;
    const maxAttempts = 20; // 20 seconds max
    let alerted = false;
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const { data: command } = await supabase
          .from('commands')
          .select('status, result')
          .eq('id', commandId)
          .single();
        
        console.log(`[Auth] Poll attempt ${attempts}:`, command);
        
        if (command?.status === 'completed' && command?.result?.auth) {
          clearInterval(interval);
          console.log('[Auth] Auth info received:', command.result.auth);
          setAuthDialog({
            open: true,
            code: command.result.auth.code,
            link: command.result.auth.link,
            username: username,
            commandId: commandId,
          });
        } else if (command?.status === 'completed' || attempts >= maxAttempts) {
          clearInterval(interval);
          console.log('[Auth] Polling ended without auth info');
          if (!alerted) {
            alerted = true;
            alert('Bot created successfully!');
          }
        }
      } catch (error) {
        console.error('Error polling command:', error);
      }
    }, 1000);
  };

  const handleBotCommand = async (botId: string, action: string) => {
    if (!user) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      
      const response = await fetch('/api/bots/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ bot_id: botId, action }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Bot ${action} command queued!`);
        fetchBots();
      } else {
        alert(`Failed: ${data.error}`);
      }
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
      
      {/* Auth Dialog */}
      <AuthDialog
        open={authDialog.open}
        onOpenChange={(open) => setAuthDialog({ ...authDialog, open })}
        code={authDialog.code}
        link={authDialog.link}
        username={authDialog.username}
      />

      <main className="flex-1 ml-[180px]">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Botnet</h1>
              <p className="text-sm text-muted-foreground">
                Manage your bot instances
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchBots()}
                disabled={isLoadingBots}
              >
                <RotateCw className={`w-4 h-4 mr-2 ${isLoadingBots ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
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
                        {nodes.map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            {node.name} - {node.location}
                          </SelectItem>
                        ))}
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
          {isLoadingBots ? (
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
          ) : bots.length === 0 ? (
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
              {bots.map((bot) => (
                <Card key={bot.id} className="hover:shadow-md transition">
                  <CardContent className="flex items-center justify-between p-4">
                    {/* Left */}
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-muted p-2">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold leading-tight">{bot.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {bot.server_ip}:{bot.server_port}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bot.nodes?.name || 'Unknown Node'} • {bot.nodes?.location || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Right - Status & Actions */}
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={
                          bot.status === 'running'
                            ? 'bg-green-600 text-white'
                            : bot.status === 'starting' || bot.status === 'stopping'
                            ? 'bg-yellow-600 text-white'
                            : bot.status === 'error'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-500 text-white'
                        }
                      >
                        {bot.status}
                      </Badge>
                      <div className="flex gap-1">
                        {bot.status === 'stopped' || bot.status === 'error' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleBotCommand(bot.id, 'start')}
                          >
                            <Play className="w-3 h-3" />
                            Start
                          </Button>
                        ) : bot.status === 'running' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleBotCommand(bot.id, 'stop')}
                            >
                              <Square className="w-3 h-3" />
                              Stop
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleBotCommand(bot.id, 'restart')}
                            >
                              <RotateCw className="w-3 h-3" />
                              Restart
                            </Button>
                          </>
                        ) : null}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => {
                            if (confirm('Delete this bot?')) {
                              handleBotCommand(bot.id, 'delete');
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}