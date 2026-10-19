import {
  BarChart3,
  Calculator,
  FolderTree,
  Gift,
  Warehouse,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { strings } from './strings';

export interface NavItem {
  key: keyof typeof strings.nav;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to see this item (SUPER_ADMIN always sees all). */
  permission: string;
  /** Route not yet implemented (later phase) — shown disabled with a badge. */
  soon?: boolean;
}

export const navItems: NavItem[] = [
  {
    key: 'dashboard',
    label: strings.nav.dashboard,
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:read',
  },
  {
    key: 'products',
    label: strings.nav.products,
    href: '/products',
    icon: Package,
    permission: 'product:read',
  },
  {
    key: 'inventory',
    label: strings.nav.inventory,
    href: '/inventory',
    icon: Warehouse,
    permission: 'inventory:read',
  },
  {
    key: 'packs',
    label: strings.nav.packs,
    href: '/packs',
    icon: Gift,
    permission: 'pack:read',
  },
  {
    key: 'categories',
    label: strings.nav.categories,
    href: '/categories',
    icon: FolderTree,
    permission: 'category:read',
  },
  {
    key: 'orders',
    label: strings.nav.orders,
    href: '/orders',
    icon: ShoppingCart,
    permission: 'order:read',
  },
  {
    key: 'customers',
    label: strings.nav.customers,
    href: '/customers',
    icon: Users,
    permission: 'customer:read',
  },
  {
    key: 'accounting',
    label: strings.nav.accounting,
    href: '/accounting',
    icon: Calculator,
    permission: 'accounting:read',
  },
  {
    key: 'traffic',
    label: strings.nav.traffic,
    href: '/traffic',
    icon: BarChart3,
    permission: 'traffic:read',
  },
  {
    key: 'users',
    label: strings.nav.users,
    href: '/users',
    icon: UserCog,
    permission: 'user:read',
  },
  {
    key: 'settings',
    label: strings.nav.settings,
    href: '/settings',
    icon: Settings,
    permission: 'setting:read',
  },
];
