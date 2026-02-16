'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { initFirebase } from '@/lib/firebase';
import { listenToNodes } from '@/lib/firebase-api';
import { useToast } from '@/components/ui/toast-notification';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Server, Activity, RefreshCw, Plus, Trash2, Copy, Check } from 'lucide-react';

const ADMIN_EMAIL = 'admin@cakranode.tech';

interface NodeWithStats {
  id: string;
  name: string;
  location: string;
  ip_address: string;
  status: string;
  last_heartbeat: string | null;
  bot_count?: number;
  cpu_usage?: number;
  ram_used?: number;
  ram_total?: number;
}

export default function NodesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [nodes, setNodes] = useState<NodeWithStats[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNode, setNewNode] = useState({ name: '', location: '', ip_address: 'auto' });
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // Check if user is admin
    if (!loading && user && user.email !== ADMIN_EMAIL) {
      router.push('/dashboard');
    }
    if (user && user.email === ADMIN_EMAIL) {
      // Initialize Firebase
      initFirebase();
      
      // Fetch initial nodes from API
      fetchNodes();
      
      // Start real-time Firebase listener for node status
      const unsubscribe = listenToNodes((nodesData) => {
        const nodesList = Object.entries(nodesData).map(([id, node]: [string, any]) => ({
          id,
          name: node.name || '',
          location: node.location || '',
          ip_address: node.ip_address || '',
          status: node.status?.online ? 'online' : 'offline',
          last_heartbeat: node.status?.lastUpdate ? new Date(node.status.lastUpdate).toISOString() : null,
          bot_count: node.status?.stats?.bot_count || 0,
          cpu_usage: node.status?.stats?.cpu_usage || 0,
          ram_used: node.status?.stats?.ram_used || 0,
          ram_total: node.status?.stats?.ram_total || 0,
        }));
        setNodes(nodesList);
        setIsLoadingNodes(false);
      });
      
      return () => unsubscribe();
    }
  }, [user, loading, router]);

  const handleCreateNode = async () => {
    if (!newNode.name || !newNode.location) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/nodes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(newNode),
      });

      const data = await response.json();

      if (data.success) {
        setCreatedToken(data.node.access_token);
        setNewNode({ name: '', location: '', ip_address: 'auto' });
        showToast('Node created successfully!', 'success', '✅ Success');
        fetchNodes();
      } else {
        showToast(`Failed: ${data.error}`, 'error');
      }
    } catch (error: any) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNode = async (nodeId: string, nodeName: string) => {
    if (!confirm(`Are you sure you want to delete node "${nodeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/nodes/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ node_id: nodeId }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Node deleted successfully!', 'success', '✅ Deleted');
        fetchNodes();
      } else {
        showToast(`Failed: ${data.error}`, 'error');
      }
    } catch (error: any) {
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const copyToken = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };


  const fetchNodes = async () => {
    if (!user) return;
    
    // Only show loading skeleton on initial load
    if (nodes.length === 0) {
      setIsLoadingNodes(true);
    }
    
    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const response = await fetch('/api/nodes', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNodes(data.nodes);
      }
    } catch (error) {
      console.error('Error fetching nodes:', error);
    } finally {
      setIsLoadingNodes(false);
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

  if (!user || user.email !== ADMIN_EMAIL) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-600 text-white';
      case 'offline':
        return 'bg-red-500 text-white';
      case 'maintenance':
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 w-full lg:ml-[180px] pt-[60px] lg:pt-0 pb-[80px] lg:pb-0">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold">Node Management</h1>
              <p className="text-sm text-muted-foreground description">
                Monitor your hosting nodes across multiple locations
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                disabled={isLoadingNodes}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingNodes ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={(open) => {
                setIsCreateOpen(open);
                if (!open) setCreatedToken(null);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Node
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Node</DialogTitle>
                    <DialogDescription>
                      {createdToken ? 
                        'Node created! Copy the access token - it will not be shown again.' :
                        'Add a new node server to your network'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  {createdToken ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Access Token</Label>
                        <div className="flex gap-2">
                          <Input value={createdToken} readOnly className="font-mono text-sm" />
                          <Button onClick={copyToken} size="icon" variant="outline">
                            {tokenCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Save this token securely. You'll need it to configure the node server.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => {
                          setIsCreateOpen(false);
                          setCreatedToken(null);
                        }}>
                          Done
                        </Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Node Name *</Label>
                        <Input
                          id="name"
                          placeholder="SG-Node-1"
                          value={newNode.name}
                          onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          placeholder="Singapore"
                          value={newNode.location}
                          onChange={(e) => setNewNode({ ...newNode, location: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ip">IP Address</Label>
                        <Input
                          id="ip"
                          placeholder="auto (recommended)"
                          value={newNode.ip_address}
                          onChange={(e) => setNewNode({ ...newNode, ip_address: e.target.value })}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateNode} disabled={isCreating}>
                          {isCreating ? 'Creating...' : 'Create Node'}
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Nodes Grid */}
          {isLoadingNodes ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : nodes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Server className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No nodes connected</h3>
                <p className="text-sm text-muted-foreground description">
                  Start a node server to see it here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {nodes.map((node) => (
                <Card key={node.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{node.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {node.location}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={getStatusColor(node.status)}
                      >
                        <Activity className="w-3 h-3 mr-1" />
                        {node.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP Address</span>
                        <span className="font-mono">{node.ip_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Bots</span>
                        <span className="font-semibold">{node.bot_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPU Usage</span>
                        <span className="font-mono">{node.cpu_usage?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RAM Usage</span>
                        <span className="font-mono">
                          {formatBytes(node.ram_used || 0)} / {formatBytes(node.ram_total || 0)}
                        </span>
                      </div>
                      {node.last_heartbeat && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Heartbeat</span>
                          <span className="text-xs">
                            {new Date(node.last_heartbeat).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        onClick={() => handleDeleteNode(node.id, node.name)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Node
                      </Button>
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
