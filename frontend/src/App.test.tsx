import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App (unauthenticated)', () => {
  it('renders the login form', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'LabCMS' })).toBeInTheDocument();
    expect(screen.getByLabelText('Institutional Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sign In/ })).toBeInTheDocument();
  });

  it('switches to the forgot-password view', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Forgot?'));
    expect(await screen.findByText(/send you a password reset link/i)).toBeInTheDocument();
  });
});
