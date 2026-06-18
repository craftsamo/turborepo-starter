import type { ReactNode } from 'react';

export type SingleParam = { slug: string };
export type DinamicParams = { [key: string]: string };
export type Params = Promise<SingleParam | DinamicParams | string[]>;

export interface LayoutProps {
  params: Params;
  children: ReactNode;
}
