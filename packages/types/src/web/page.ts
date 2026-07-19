import type { LayoutProps } from './layout';
import type { RouteParams } from './layout';

export type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export type PageProps<T extends RouteParams = RouteParams> = Omit<LayoutProps<T>, 'children'> & {
  searchParams: SearchParams;
};
