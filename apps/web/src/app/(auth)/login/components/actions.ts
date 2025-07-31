'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { RESTPostAPILocalAuthLoginJSON } from '@workspace/types/api';
import { fetcher } from '@/lib/fetcher';

async function setCookie(setCookieString: string) {
  const match = setCookieString.match(/^([^=]+)=([^;]+)/);
  if (!match) throw new Error('Invalid Set-Cookie header');

  const [, name, value] = match;

  const options: { [key: string]: string | boolean | number } = {};
  setCookieString
    .split(';')
    .slice(1)
    .forEach((part) => {
      const [key, val] = part.trim().split('=');
      if (val === undefined) {
        options[key.toLowerCase()] = true;
      } else {
        options[key.toLowerCase()] = val;
      }
    });

  const cookie = await cookies();
  cookie.set(name, value, {
    httpOnly: options.httponly === true,
    secure: options.secure === true,
    sameSite: (options.samesite as 'lax' | 'strict' | 'none') || 'lax',
    path: typeof options.path === 'string' ? options.path : '/',
    maxAge: options['max-age'] ? parseInt(options['max-age'] as string) : undefined,
    expires: options.expires ? new Date(options.expires as string) : undefined,
  });
}

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

  redirect('/dashboard');
}
