import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: vi.fn(() => ['/', vi.fn()]),
  Link: ({ children, href }: any) => {
    const React = require('react');
    return React.createElement('a', { href }, children);
  },
  Route: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', {}, children);
  },
  Switch: ({ children }: any) => {
    const React = require('react');
    return React.createElement('div', {}, children);
  },
}));

// Mock useAuth hook
vi.mock('@/_core/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' },
    loading: false,
    error: null,
    isAuthenticated: true,
    logout: vi.fn(),
  })),
}));

// Mock tRPC client
vi.mock('@/lib/trpc', () => {
  return import('./__mocks__/trpc');
});
