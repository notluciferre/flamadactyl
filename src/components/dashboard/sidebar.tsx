'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  SquareTerminal,
  Bot,
  Server,
  Settings,
  User,
} from 'lucide-react';

const ADMIN_EMAIL = 'admin@cakranode.tech';

const sidebarItems = [
  { icon: SquareTerminal, label: 'Control', href: '/dashboard' },
  { icon: Bot, label: 'Botnet', href: '/dashboard/botnet' },
  { icon: Server, label: 'Node', href: '/dashboard/nodes', adminOnly: true },
  { icon: User, label: 'Account', href: '/dashboard/account' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

interface SidebarContentProps {
  pathname: string;
  isAdmin: boolean;
}

function SidebarContent({ pathname, isAdmin }: SidebarContentProps) {
  return (
    <aside className="w-full lg:w-[180px] bg-black border-r border-zinc-800 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/flamma.svg" alt="Flamma Logo" width={32} height={32} />
          <span className="font-bold text-base">Flamahost</span>
        </Link>
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
    </aside>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black border-b border-zinc-800 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/flamma.svg" alt="Flamma Logo" width={24} height={24} />
          <span className="font-bold text-base">Flamahost</span>
        </Link>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-800 pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
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
                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg min-w-[60px] transition-colors',
                    isActive
                      ? 'text-red-500 bg-red-500/10'
                      : 'text-zinc-400 hover:text-zinc-100'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 z-40">
        <SidebarContent pathname={pathname} isAdmin={isAdmin} />
      </div>
    </>
  );
}
