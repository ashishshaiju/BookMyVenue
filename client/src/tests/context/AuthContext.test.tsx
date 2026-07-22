import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { axiosInstance } from '@/config/axios';
import { STORAGE_KEYS } from '@/constants';

vi.mock('@/config/axios', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const TestAuthComponent: React.FC = () => {
  const { user, isAuthenticated, loading, login, logout } = useAuth();

  if (loading) return <div data-testid="loading">Loading...</div>;

  return (
    <div>
      <div data-testid="status">{isAuthenticated ? 'Authenticated' : 'Guest'}</div>
      <div data-testid="user">{user ? user.username : 'No User'}</div>
      <button onClick={() => login('test@example.com', 'Password123!')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('client AuthContext & AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with Guest status when no session exists', async () => {
    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('status')).toHaveTextContent('Guest');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });

  it('should verify session and set user when IS_LOGGED_IN is true in localStorage', async () => {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');

    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: {
        data: {
          _id: 'user_123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Authenticated');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
    expect(localStorage.getItem(STORAGE_KEYS.USER_ID)).toBe('user_123');
  });

  it('should log in successfully and update user state', async () => {
    const userSim = userEvent.setup();

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: {
        data: {
          userId: 'user_456',
          username: 'Jane Doe',
          email: 'jane@example.com',
        },
      },
    });

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    await userSim.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('Authenticated');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Jane Doe');
    expect(localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN)).toBe('true');
  });

  it('should throw error when useAuth is used outside of AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestAuthComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    consoleSpy.mockRestore();
  });
});
