import type { ReactNode } from 'react';

export type SingleParam = { slug: string };
export type DinamicParams = { [key: string]: string };
export type RouteParams = SingleParam | DinamicParams | string[];
export type Params<T extends RouteParams = RouteParams> = Promise<T>;

export interface LayoutProps<T extends RouteParams = RouteParams> {
  params: Params<T>;
  children: ReactNode;
}
