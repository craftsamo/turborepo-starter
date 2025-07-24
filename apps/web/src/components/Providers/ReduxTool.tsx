'use client';

import { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';

export const ReduxToolProvider = ({ children }: { children: ReactNode }) => {
  return <Provider store={store}>{children}</Provider>;
};
