import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricMeter } from '../MetricMeter';

describe('MetricMeter', () => {
  const defaultProps = {
    label: 'CPU Usage',
    value: 50,
    min: 0,
    max: 100,
  };

  it('renders with label and value', () => {
    render(<MetricMeter {...defaultProps} />);
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('50.0')).toBeInTheDocument();
  });

  it('displays unit when provided', () => {
    render(<MetricMeter {...defaultProps} unit="%" />);
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('renders threshold markers', () => {
    const thresholds = [
      { value: 60, label: 'Safe' },
      { value: 85, label: 'Warn' },
    ];

    render(<MetricMeter {...defaultProps} thresholds={thresholds} />);
    expect(screen.getByText('Safe')).toBeInTheDocument();
    expect(screen.getByText('Warn')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<MetricMeter {...defaultProps} size="sm" />);
    expect(screen.getByText('CPU Usage')).toHaveClass('text-xs');

    rerender(<MetricMeter {...defaultProps} size="md" />);
    expect(screen.getByText('CPU Usage')).toHaveClass('text-sm');

    rerender(<MetricMeter {...defaultProps} size="lg" />);
    expect(screen.getByText('CPU Usage')).toHaveClass('text-base');
  });

  it('renders SVG for sparkline when enabled', () => {
    const { container } = render(
      <MetricMeter {...defaultProps} showSparkline history={[10, 20, 30, 40, 50]} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('formats value correctly', () => {
    render(<MetricMeter {...defaultProps} value={75.6789} />);
    expect(screen.getByText('75.7')).toBeInTheDocument();
  });
});
