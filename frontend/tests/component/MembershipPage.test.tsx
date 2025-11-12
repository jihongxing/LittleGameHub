/**
 * Component Test for Membership Page
 * Test: T096
 * 
 * Test Coverage:
 * - Membership plans display
 * - Current membership status display
 * - Plan selection and purchase flow
 * - Payment method selection
 * - Privilege display (ad-free, point multiplier)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MembershipPage from '../../src/pages/Membership/MembershipPage';

// Mock API service
vi.mock('../../src/services/api/membership', () => ({
  getMembershipStatus: vi.fn(),
  getMembershipPlans: vi.fn(),
  subscribeMembership: vi.fn(),
}));

import * as membershipApi from '../../src/services/api/membership';

describe('MembershipPage Component Tests', () => {
  const mockPlans = [
    {
      plan_type: 'monthly',
      name: 'Monthly Membership',
      price: 6.0,
      currency: 'CNY',
      duration_days: 30,
      benefits: ['Ad-free experience', '30% point multiplier', 'Priority access'],
    },
    {
      plan_type: 'quarterly',
      name: 'Quarterly Membership',
      price: 15.0,
      currency: 'CNY',
      duration_days: 90,
      benefits: ['Ad-free experience', '50% point multiplier', 'Priority access', 'Cloud save'],
    },
    {
      plan_type: 'yearly',
      name: 'Yearly Membership',
      price: 50.0,
      currency: 'CNY',
      duration_days: 365,
      benefits: ['Ad-free experience', '100% point multiplier', 'Priority access', 'Cloud save', 'Exclusive games'],
    },
  ];

  const mockFreeMembership = {
    membership_status: 'free',
  };

  const mockActiveMembership = {
    membership_status: 'member',
    plan_type: 'monthly',
    start_date: '2025-11-01T00:00:00Z',
    expiration_date: '2025-12-01T00:00:00Z',
    auto_renew: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render membership page', async () => {
    vi.mocked(membershipApi.getMembershipStatus).mockResolvedValue(mockFreeMembership);
    vi.mocked(membershipApi.getMembershipPlans).mockResolvedValue({ plans: mockPlans });

    render(
      <BrowserRouter>
        <MembershipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/membership/i)).toBeInTheDocument();
    });
  });

  it('should display all membership plans', async () => {
    vi.mocked(membershipApi.getMembershipStatus).mockResolvedValue(mockFreeMembership);
    vi.mocked(membershipApi.getMembershipPlans).mockResolvedValue({ plans: mockPlans });

    render(
      <BrowserRouter>
        <MembershipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Monthly Membership')).toBeInTheDocument();
      expect(screen.getByText('Quarterly Membership')).toBeInTheDocument();
      expect(screen.getByText('Yearly Membership')).toBeInTheDocument();
    });
  });

  it('should display plan benefits', async () => {
    vi.mocked(membershipApi.getMembershipStatus).mockResolvedValue(mockFreeMembership);
    vi.mocked(membershipApi.getMembershipPlans).mockResolvedValue({ plans: mockPlans });

    render(
      <BrowserRouter>
        <MembershipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Ad-free experience')).toBeInTheDocument();
      expect(screen.getByText(/point multiplier/i)).toBeInTheDocument();
      expect(screen.getByText('Priority access')).toBeInTheDocument();
    });
  });

  it('should display current free membership status', async () => {
    vi.mocked(membershipApi.getMembershipStatus).mockResolvedValue(mockFreeMembership);
    vi.mocked(membershipApi.getMembershipPlans).mockResolvedValue({ plans: mockPlans });

    render(
      <BrowserRouter>
        <MembershipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/free/i)).toBeInTheDocument();
    });
  });

  it('should display active membership status with expiration date', async () => {
    vi.mocked(membershipApi.getMembershipStatus).mockResolvedValue(mockActiveMembership);
    vi.mocked(membershipApi.getMembershipPlans).mockResolvedValue({ plans: mockPlans });

    render(
      <BrowserRouter>
        <MembershipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/member/i)).toBeInTheDocument();
      expect(screen.getByText(/expires/i)).toBeInTheDocument();
    });
  });

  it('should handle plan selection', async () => {
    vi.mocked(membershipApi.getMembershipStatus).mockResolvedValue(mockFreeMembership);
    vi.mocked(membershipApi.getMembershipPlans).mockResolvedValue({ plans: mockPlans });

    render(
      <BrowserRouter>
        <MembershipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      expect(subscribeButtons.length).toBeGreaterThan(0);
    });

    // Click subscribe button
    const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
    fireEvent.click(subscribeButtons[0]);

    // Expect payment method selection to appear
    await waitFor(() => {
      expect(screen.getByText(/payment method/i)).toBeInTheDocument();
    });
  });

  it('should handle successful subscription', async () => {
    vi.mocked(membershipApi.getMembershipStatus).mockResolvedValue(mockFreeMembership);
    vi.mocked(membershipApi.getMembershipPlans).mockResolvedValue({ plans: mockPlans });
    vi.mocked(membershipApi.subscribeMembership).mockResolvedValue({
      membership_id: 'test-id',
      payment_status: 'paid',
      payment_transaction_id: 'txn-123',
    });

    render(
      <BrowserRouter>
        <MembershipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      fireEvent.click(subscribeButtons[0]);
    });

    // Select payment method and confirm
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm|pay/i });
      fireEvent.click(confirmButton);
    });

    // Expect success message
    await waitFor(() => {
      expect(screen.getByText(/success|activated/i)).toBeInTheDocument();
    });
  });

  it('should handle subscription error', async () => {
    vi.mocked(membershipApi.getMembershipStatus).mockResolvedValue(mockFreeMembership);
    vi.mocked(membershipApi.getMembershipPlans).mockResolvedValue({ plans: mockPlans });
    vi.mocked(membershipApi.subscribeMembership).mockRejectedValue(new Error('Payment failed'));

    render(
      <BrowserRouter>
        <MembershipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const subscribeButtons = screen.getAllByRole('button', { name: /subscribe/i });
      fireEvent.click(subscribeButtons[0]);
    });

    // Select payment method and confirm
    await waitFor(() => {
      const confirmButton = screen.getByRole('button', { name: /confirm|pay/i });
      fireEvent.click(confirmButton);
    });

    // Expect error message
    await waitFor(() => {
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument();
    });
  });

  it('should disable subscribe button for active members', async () => {
    vi.mocked(membershipApi.getMembershipStatus).mockResolvedValue(mockActiveMembership);
    vi.mocked(membershipApi.getMembershipPlans).mockResolvedValue({ plans: mockPlans });

    render(
      <BrowserRouter>
        <MembershipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const currentPlanButton = screen.getByRole('button', { name: /current plan/i });
      expect(currentPlanButton).toBeDisabled();
    });
  });

  it('should display plan prices correctly', async () => {
    vi.mocked(membershipApi.getMembershipStatus).mockResolvedValue(mockFreeMembership);
    vi.mocked(membershipApi.getMembershipPlans).mockResolvedValue({ plans: mockPlans });

    render(
      <BrowserRouter>
        <MembershipPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/6\.00/)).toBeInTheDocument();
      expect(screen.getByText(/15\.00/)).toBeInTheDocument();
      expect(screen.getByText(/50\.00/)).toBeInTheDocument();
    });
  });
});

