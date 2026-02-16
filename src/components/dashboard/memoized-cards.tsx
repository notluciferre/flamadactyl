/**
 * Memoized Dashboard Components
 * Optimized to prevent unnecessary re-renders
 */

'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCw, Trash2, Bot, Server, Activity } from 'lucide-react';

// ===== BOT CARD =====

interface BotCardProps {
  bot: {
    id: string;
    username: string;
    server_ip: string;
    server_port: number;
    status: {
      status: string;
      error: string | null;
      timestamp: number;
    };
    node_id: string;
    nodes?: {
      name: string;
      location: string;
    };
  };
  onStart: (botId: string) => void;
  onStop: (botId: string) => void;
  onRestart: (botId: string) => void;
  onDelete: (botId: string) => void;
  disabled?: boolean;
}

export const BotCard = memo(function BotCard({
  bot,
  onStart,
  onStop,
  onRestart,
  onDelete,
  disabled = false,
}: BotCardProps) {
  const botStatus = bot.status?.status || 'stopped';
  const isRunning = botStatus === 'running';
  const isStopped = botStatus === 'stopped' || botStatus === 'error';
  const isError = botStatus === 'error';
  const isTransitioning = botStatus === 'starting' || botStatus === 'stopping';
  const canStop = isRunning || botStatus === 'starting';

  return (
    <Card className="hover:shadow-md transition">
      <CardContent className="p-4">
        {/* Desktop: Horizontal Layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between gap-4">
          {/* Left - Bot Info */}
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-muted p-2 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{bot.username}</p>
              <p className="text-xs text-muted-foreground truncate">
                {bot.server_ip}:{bot.server_port}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {bot.nodes?.name || 'Unknown Node'} • {bot.nodes?.location || 'N/A'}
              </p>
            </div>
          </div>

          {/* Right - Status & Actions */}
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={
                isRunning
                  ? 'bg-green-600 text-white'
                  : isTransitioning
                  ? 'bg-yellow-600 text-white'
                  : isError
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-500 text-white'
              }
            >
              {botStatus}
            </Badge>
            <div className="flex gap-1">
              {isStopped ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => onStart(bot.id)}
                  disabled={disabled}
                >
                  <Play className="w-3 h-3" />
                  Start
                </Button>
              ) : canStop ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => onStop(bot.id)}
                    disabled={disabled}
                  >
                    <Square className="w-3 h-3" />
                    Stop
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => onRestart(bot.id)}
                    disabled={disabled}
                  >
                    <RotateCw className="w-3 h-3" />
                    Restart
                  </Button>
                </>
              ) : null}
              <Button
                size="sm"
                variant="destructive"
                className="gap-1 shrink-0"
                onClick={() => onDelete(bot.id)}
                disabled={disabled}
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile: Stacked Layout */}
        <div className="sm:hidden space-y-3">
          {/* Top - Bot Info with Status */}
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-semibold leading-tight">{bot.username}</p>
                <Badge
                  variant="secondary"
                  className={
                    isRunning
                      ? 'bg-green-600 text-white'
                      : isTransitioning
                      ? 'bg-yellow-600 text-white'
                      : isError
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-500 text-white'
                  }
                >
                  {botStatus}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {bot.server_ip}:{bot.server_port}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {bot.nodes?.name || 'Unknown Node'} • {bot.nodes?.location || 'N/A'}
              </p>
            </div>
          </div>

          {/* Bottom - Action Buttons */}
          <div className="flex gap-2">
            {isStopped ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => onStart(bot.id)}
                disabled={disabled}
              >
                <Play className="w-3 h-3" />
                Start
              </Button>
            ) : canStop ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() => onStop(bot.id)}
                  disabled={disabled}
                >
                  <Square className="w-3 h-3" />
                  Stop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() => onRestart(bot.id)}
                  disabled={disabled}
                >
                  <RotateCw className="w-3 h-3" />
                  Restart
                </Button>
              </>
            ) : null}
            <Button
              size="sm"
              variant="destructive"
              className="gap-1 shrink-0"
              onClick={() => onDelete(bot.id)}
              disabled={disabled}
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these props changed
  return (
    prevProps.bot.id === nextProps.bot.id &&
    prevProps.bot.status?.status === nextProps.bot.status?.status &&
    prevProps.disabled === nextProps.disabled
  );
});

// ===== NODE CARD =====

interface NodeCardProps {
  node: {
    id: string;
    name: string;
    location: string;
    ip_address: string;
    status: string;
    last_heartbeat?: string | null;
    bot_count?: number;
    cpu_usage?: number;
    ram_used?: number;
    ram_total?: number;
  };
  onDelete?: (nodeId: string, nodeName: string) => void;
  isAdmin?: boolean;
}

export const NodeCard = memo(function NodeCard({
  node,
  onDelete,
  isAdmin = false,
}: NodeCardProps) {
  const isOnline = node.status === 'online';
  const ramPercentage = node.ram_total 
    ? Math.round((node.ram_used || 0) / node.ram_total * 100)
    : 0;

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <Card className={`overflow-hidden transition-all ${isOnline ? 'border-green-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-5 w-5" />
              <h3 className="font-semibold text-lg">{node.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{node.location}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {node.ip_address}
            </p>
          </div>
          <Badge
            variant={isOnline ? 'default' : 'secondary'}
            className={isOnline ? 'bg-green-500' : ''}
          >
            <Activity className="h-3 w-3 mr-1" />
            {node.status}
          </Badge>
        </div>

        {isOnline && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bots:</span>
              <span className="font-medium">{node.bot_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPU:</span>
              <span className="font-medium">{node.cpu_usage || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RAM:</span>
              <span className="font-medium">
                {ramPercentage}% ({formatBytes(node.ram_used || 0)})
              </span>
            </div>
          </div>
        )}

        {isAdmin && onDelete && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(node.id, node.name)}
            className="w-full mt-3"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Node
          </Button>
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Re-render only if critical props changed
  return (
    prevProps.node.id === nextProps.node.id &&
    prevProps.node.status === nextProps.node.status &&
    prevProps.node.bot_count === nextProps.node.bot_count &&
    prevProps.node.cpu_usage === nextProps.node.cpu_usage &&
    prevProps.node.ram_used === nextProps.node.ram_used
  );
});

// ===== STATS CARD =====

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  icon,
  subtitle,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.subtitle === nextProps.subtitle
  );
});
