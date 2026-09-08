import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireAdminContext } from '@/infrastructure/container';
import { logout } from './actions';

const NAV = [
  { href: '/', label: 'Обзор' },
  { href: '/users', label: 'Пользователи' },
  { href: '/finance', label: 'Финансы' },
  { href: '/unit-economics', label: 'Юнит-экономика' },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { session } = await requireAdminContext();

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          FlowFin
        </Link>

        <nav>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <form action={logout} className="topbar-user">
          <span>{session.email ?? session.name ?? 'admin'}</span>
          <button type="submit">Выйти</button>
        </form>
      </header>

      <main className="content">{children}</main>
    </div>
  );
}
