'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, GitBranch, MessageSquare, StickyNote, Layers, FlaskConical, LayoutDashboard, ClipboardCheck, Glasses, Landmark, Radar, SlidersHorizontal } from 'lucide-react';

interface DockItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  href: string;
  color: string;
  bgColor: string;
}

const DOCK_ITEMS: DockItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/', color: '#4f46e5', bgColor: 'rgba(79,70,229,0.12)' },
  { id: 'pipeline', label: 'Pipeline', icon: LayoutDashboard, href: '/pipeline', color: '#4f46e5', bgColor: 'rgba(79,70,229,0.12)' },
  { id: 'leads', label: 'Scout', icon: Radar, href: '/leads', color: '#0d9488', bgColor: 'rgba(13,148,136,0.12)' },
  { id: 'thesis', label: 'Thesis', icon: SlidersHorizontal, href: '/thesis', color: '#7c3aed', bgColor: 'rgba(124,58,237,0.12)' },
];

const MAGNIFICATION = 2.2;
const BASE_SIZE = 44;
const SPREAD = 100;

function DockIcon({ item, mouseX, isActive, onBounce, samePage }: {
  item: DockItem;
  mouseX: number | null;
  isActive: boolean;
  onBounce: boolean;
  samePage: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCenter(rect.left + rect.width / 2);
    }
  });

  const distance = mouseX !== null ? Math.abs(mouseX - center) : SPREAD + 1;
  const scale = mouseX !== null
    ? Math.max(1, MAGNIFICATION - (distance / SPREAD) * (MAGNIFICATION - 1))
    : 1;

  const Icon = item.icon;

  // Next's <Link> updates same-page hash changes via history.pushState, which
  // does NOT fire a native `hashchange` event — so pages listening for it
  // (to switch tabs / open panels) never hear about it. Setting
  // `location.hash` directly does fire it reliably, so we do that ourselves
  // whenever the target is a hash on the page we're already on.
  const handleClick = (e: React.MouseEvent) => {
    if (!samePage) return;
    const fragment = item.href.split('#')[1] ?? '';
    e.preventDefault();
    if (window.location.hash === (fragment ? `#${fragment}` : '')) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = fragment;
    }
  };

  return (
    <Link href={item.href} aria-label={item.label} aria-current={isActive ? 'page' : undefined} onClick={handleClick}>
      <motion.div
        ref={ref}
        className="relative flex flex-col items-center cursor-pointer"
        animate={{
          scale: onBounce ? [1, 1.3, 0.9, 1.1, 1] : scale,
          y: onBounce ? [0, -16, 0, -8, 0] : 0,
        }}
        transition={
          onBounce
            ? { duration: 0.6, times: [0, 0.2, 0.4, 0.6, 1], type: 'tween' }
            : { type: 'spring', stiffness: 400, damping: 25 }
        }
        style={{ transformOrigin: 'bottom center' }}
      >
        {/* Tooltip */}
        <div className="dock-label">{item.label}</div>

        {/* Icon container */}
        <div
          className="flex items-center justify-center rounded-2xl transition-all duration-100"
          style={{
            width: BASE_SIZE,
            height: BASE_SIZE,
            background: isActive
              ? item.bgColor
              : 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: isActive
              ? `1.5px solid ${item.color}30`
              : '1px solid rgba(0,0,0,0.08)',
            boxShadow: isActive
              ? `0 4px 16px ${item.color}20, inset 0 1px 0 rgba(255,255,255,0.9)`
              : '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          <Icon
            size={20}
            className="transition-colors duration-150"
            style={{ color: isActive ? item.color : '#6e6e73' } as React.CSSProperties}
          />
        </div>

        {/* Active dot */}
        {isActive && (
          <div
            className="w-1 h-1 rounded-full mt-1"
            style={{ background: item.color }}
          />
        )}
      </motion.div>
    </Link>
  );
}

export default function Dock({ bouncingItem }: { bouncingItem?: string }) {
  const pathname = usePathname();
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [hash, setHash] = useState('');
  const dockRef = useRef<HTMLDivElement>(null);

  // Track the URL fragment too — several Dock items deep-link into a specific
  // section of a page (e.g. /curriculum-view#graph), and a page path alone
  // can't tell those apart from each other.
  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, [pathname]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMouseX(e.clientX);
  };

  const handleMouseLeave = () => {
    setMouseX(null);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        ref={dockRef}
        className="flex items-end gap-2 px-3 py-2.5 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(32px) saturate(2)',
          WebkitBackdropFilter: 'blur(32px) saturate(2)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {DOCK_ITEMS.map((item) => {
          const [itemPath, itemFragment] = item.href.split('#');
          const itemHash = itemFragment ? `#${itemFragment}` : '';
          const isActive = pathname === itemPath && hash === itemHash;
          return (
            <DockIcon
              key={item.id}
              item={item}
              mouseX={mouseX}
              isActive={isActive}
              onBounce={bouncingItem === item.id}
              samePage={pathname === itemPath}
            />
          );
        })}
      </motion.div>
    </div>
  );
}
