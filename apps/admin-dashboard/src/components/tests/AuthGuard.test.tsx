import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../Layout';

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

describe('ProtectedRoute', () => {
  it('renders nothing (redirects to /login) when not authenticated', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );
    // Navigate renders nothing to the current route's outlet
    expect(container.firstChild).toBeNull();
  });
});

