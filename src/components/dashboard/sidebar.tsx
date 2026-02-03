'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  SquareTerminal,
  Bot,
  Server,
  Settings,
  User,
  MoreHorizontal,
} from 'lucide-react';

const ADMIN_EMAIL = 'admin@cakranode.tech';

const sidebarItems = [
  { icon: SquareTerminal, label: 'Control', href: '/dashboard' },
  { icon: Bot, label: 'Botnet', href: '/dashboard/botnet' },
  { icon: Server, label: 'Node', href: '/dashboard/nodes', adminOnly: true },
  { icon: User, label: 'Account', href: '/dashboard/account' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <aside className="w-[180px] bg-black border-r border-zinc-800 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="text-red-500 text-xl">🔥</div>
          <span className="font-bold text-base">CakraNode</span>
        </Link>
        <button className="text-zinc-400 hover:text-zinc-200">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {sidebarItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-6 py-3 text-[13px] transition-colors relative group',
                isActive
                  ? 'text-red-500 bg-red-500/5'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500" />
              )}
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Server Info */}
      <div className="p-6 border-t border-zinc-800">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold">
          SERVER
        </div>
        <div className="text-[13px] text-zinc-300 truncate font-medium">
          My Bot Server
        </div>
      </div>
    </aside>
  );
}
