'use server';

import { redirect } from 'next/navigation';

export async function login(provider: 'discord' | 'google') {
  redirect(process.env.BASE_URL + `/api/auth/${provider}/login`);
}
