'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Server, Activity } from 'lucide-react';

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
  const [nodes, setNodes] = useState<NodeWithStats[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // Check if user is admin
    if (!loading && user && user.email !== ADMIN_EMAIL) {
      router.push('/dashboard');
    }
    if (user && user.email === ADMIN_EMAIL) {
      fetchNodes();
      
      // Auto-refresh every 5 seconds
      const interval = setInterval(fetchNodes, 5000);
      return () => clearInterval(interval);
    }
  }, [user, loading, router]);

  const fetchNodes = async () => {
    if (!user) return;
    
    setIsLoadingNodes(true);
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

      <main className="flex-1 ml-[180px]">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Node Management</h1>
              <p className="text-sm text-muted-foreground">
                Monitor your hosting nodes across multiple locations
              </p>
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
                <p className="text-sm text-muted-foreground">
                  Start a node server to see it here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
