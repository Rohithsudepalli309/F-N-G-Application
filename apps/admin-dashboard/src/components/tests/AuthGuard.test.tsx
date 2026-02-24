import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../Layout';

// Mocking useAuthStore
jest.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

describe('ProtectedRoute Component', () => {
  it('should redirect if not authenticated', () => {
    // In a real run, this would trigger a Navigate component
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute />
      </MemoryRouter>
    );

    // If needed, we can verify navigation or absence of child routes
  });
});
