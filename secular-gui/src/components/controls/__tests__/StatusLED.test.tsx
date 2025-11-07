import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusLED, StatusLEDGroup } from '../StatusLED';

describe('StatusLED', () => {
  it('renders with idle status', () => {
    render(<StatusLED status="idle" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<StatusLED status="running" label="Server" />);
    expect(screen.getByText('Server')).toBeInTheDocument();
  });

  it('renders without label when showLabel is false', () => {
    render(<StatusLED status="running" label="Server" showLabel={false} />);
    expect(screen.queryByText('Server')).not.toBeInTheDocument();
  });

  it('applies correct aria-label', () => {
    render(<StatusLED status="error" label="Database Error" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Database Error');
  });

  it('renders all status types', () => {
    const { rerender } = render(<StatusLED status="idle" label="Status" />);
    expect(screen.getByText('Status')).toBeInTheDocument();

    rerender(<StatusLED status="running" label="Status" />);
    expect(screen.getByText('Status')).toBeInTheDocument();

    rerender(<StatusLED status="warning" label="Status" />);
    expect(screen.getByText('Status')).toBeInTheDocument();

    rerender(<StatusLED status="error" label="Status" />);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});

describe('StatusLEDGroup', () => {
  it('renders multiple LEDs', () => {
    const items = [
      { status: 'running' as const, label: 'Server' },
      { status: 'warning' as const, label: 'Cache' },
    ];

    render(<StatusLEDGroup items={items} />);
    expect(screen.getByText('Server')).toBeInTheDocument();
    expect(screen.getByText('Cache')).toBeInTheDocument();
  });

  it('renders in vertical orientation', () => {
    const items = [
      { status: 'running' as const, label: 'Server' },
    ];

    const { container } = render(<StatusLEDGroup items={items} orientation="vertical" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex-col');
  });

  it('renders in horizontal orientation', () => {
    const items = [
      { status: 'running' as const, label: 'Server' },
    ];

    const { container } = render(<StatusLEDGroup items={items} orientation="horizontal" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('flex-row');
  });
});
