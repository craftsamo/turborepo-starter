'use server';

import { redirect } from 'next/navigation';

export async function login(provider: 'discord' | 'google') {
  redirect(`/api/auth/${provider}/login`);
}
