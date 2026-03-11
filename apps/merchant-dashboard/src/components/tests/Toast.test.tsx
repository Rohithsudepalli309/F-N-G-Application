import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../Toast';

// ── Helper: component that fires toasts ───────────────────────────────────────
function ToastTrigger({
  variant,
  message,
}: {
  variant: 'success' | 'error' | 'info';
  message: string;
}) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast(variant, message)}>
      Fire {variant}
    </button>
  );
}

function renderToast(variant: 'success' | 'error' | 'info', message: string) {
  return render(
    <ToastProvider>
      <ToastTrigger variant={variant} message={message} />
    </ToastProvider>
  );
}

describe('Toast', () => {
  // ─── Success toast ────────────────────────────────────────────────────────
  it('shows success toast message', async () => {
    renderToast('success', 'Product saved!');
    await userEvent.click(screen.getByText('Fire success'));
    expect(screen.getByText('Product saved!')).toBeInTheDocument();
  });

  // ─── Error toast ──────────────────────────────────────────────────────────
  it('shows error toast message', async () => {
    renderToast('error', 'Something went wrong');
    await userEvent.click(screen.getByText('Fire error'));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  // ─── Info toast ───────────────────────────────────────────────────────────
  it('shows info toast message', async () => {
    renderToast('info', 'Order updated');
    await userEvent.click(screen.getByText('Fire info'));
    expect(screen.getByText('Order updated')).toBeInTheDocument();
  });

  // ─── Dismiss ──────────────────────────────────────────────────────────────
  it('removes toast when dismiss button is clicked', async () => {
    renderToast('success', 'Dismiss me');
    await userEvent.click(screen.getByText('Fire success'));
    expect(screen.getByText('Dismiss me')).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText('Dismiss notification');
    await userEvent.click(dismissBtn);
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });

  // ─── Multiple toasts ──────────────────────────────────────────────────────
  it('shows multiple toasts stacked', async () => {
    renderToast('success', 'First toast');
    const btn = screen.getByText('Fire success');
    await userEvent.click(btn);
    // Change to show a second toast with different message  
    render(
      <ToastProvider>
        <ToastTrigger variant="error" message="Second toast" />
      </ToastProvider>
    );
    await userEvent.click(screen.getByText('Fire error'));
    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
  });

  // ─── No toast before trigger ──────────────────────────────────────────────
  it('does not show toast before button is clicked', () => {
    renderToast('info', 'Not visible yet');
    expect(screen.queryByText('Not visible yet')).not.toBeInTheDocument();
  });

  // ─── Auto-dismiss (timer-based) ───────────────────────────────────────────
  it('auto-dismisses toast after 3600ms', () => {
    vi.useFakeTimers();
    renderToast('info', 'Auto gone');
    // Use fireEvent (synchronous) so it works safely with fake timers
    act(() => { fireEvent.click(screen.getByText('Fire info')); });
    expect(screen.getByText('Auto gone')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(3600); });
    expect(screen.queryByText('Auto gone')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
