import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireAdminContext } from '@/infrastructure/container';
import { logout } from './actions';

const NAV = [
  { href: '/', label: 'Обзор' },
  { href: '/users', label: 'Пользователи' },
  { href: '/ai-requests', label: 'Заявки ИИ' },
  { href: '/finance', label: 'Финансы' },
  { href: '/unit-economics', label: 'Юнит-экономика' },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { session, gateway } = await requireAdminContext();
  // Счётчик в меню — удобство, а не повод ронять всю админку.
  const pending = await gateway
    .listAiRequests('PENDING')
    .then((list) => list.length)
    .catch(() => 0);

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
              {item.href === '/ai-requests' && pending > 0 && (
                <span className="nav-count">{pending}</span>
              )}
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
