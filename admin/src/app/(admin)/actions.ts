'use server';

import { redirect } from 'next/navigation';
import { closeSession } from '@/infrastructure/session/session';

export async function logout(): Promise<void> {
  await closeSession();
  redirect('/login');
}
