'use server';

import { redirect } from 'next/navigation';
import type { RESTPostAPILocalAuthLoginJSON } from '@workspace/types/api';
import { fetcher } from '@/lib/fetcher';
import { setCookie } from '@/lib/setCookie';

async function loginLocalAuth(email: string, password: string) {
  const result = await fetcher.post<RESTPostAPILocalAuthLoginJSON>('/api/auth/local/login', {
    email,
    password,
  });

  if (result.ok === true) {
    const setCookieArray = result.headers.getSetCookie();
    if (setCookieArray && setCookie.length > 0) {
      await setCookie(setCookieArray[0]);
    }
  }

  return result;
}

export async function handleSubmit(_: string, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const result = await loginLocalAuth(email, password);
  if (result.ok === false) {
    return result.message;
  }

  redirect('/');
}
