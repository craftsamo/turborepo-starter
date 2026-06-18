import type { LayoutProps } from './layout';

export type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export type PageProps = Omit<LayoutProps, 'children'> & {
  searchParams: SearchParams;
};
