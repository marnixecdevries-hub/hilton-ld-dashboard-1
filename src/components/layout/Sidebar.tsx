'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Upload, Building2, TrendingUp, Users, Target, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/hotels', label: 'Hotels', icon: Building2 },
  { href: '/trends', label: 'Trends', icon: TrendingUp },
  { href: '/trainers', label: 'Trainers', icon: Users },
  { href: '/gaps', label: 'Gaps Analysis', icon: Target },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const nav = (
    <nav className="flex flex-col gap-1 mt-6">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 text-sm font-medium transition-colors ${
            isActive(href)
              ? 'bg-hilton-beige text-hilton-blue'
              : 'text-white/80 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-hilton-blue text-white p-2 rounded-lg shadow-lg"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-hilton-blue z-40 flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 pt-8 pb-4">
          <h1 className="text-white text-xl font-bold tracking-tight">Hilton</h1>
          <p className="text-white/60 text-xs mt-1">L&D Dashboard</p>
        </div>

        {nav}

        <div className="mt-auto px-6 pb-6">
          <div className="border-t border-white/20 pt-4">
            <p className="text-white/40 text-xs">Train the Trainer</p>
            <p className="text-white/40 text-xs">Evaluation Tracker</p>
          </div>
        </div>
      </aside>
    </>
  );
}
