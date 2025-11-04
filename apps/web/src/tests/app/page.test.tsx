import type { ReactElement } from 'react';
import '@testing-library/dom';
import LandingPage from '../../app/(root)/page';
import { render, screen, act, waitFor } from '../testUtils';

describe('LandingPage', () => {
  it('renders the LandingPage correctly', async function () {
    await act(async () => {
      render(await LandingPage());
    });
  });
});
