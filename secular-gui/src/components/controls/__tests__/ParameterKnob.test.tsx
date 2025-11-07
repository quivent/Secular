import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParameterKnob } from '../ParameterKnob';

describe('ParameterKnob', () => {
  const defaultProps = {
    label: 'Volume',
    value: 50,
    min: 0,
    max: 100,
    onChange: vi.fn(),
  };

  it('renders with label and value', () => {
    render(<ParameterKnob {...defaultProps} />);
    expect(screen.getByText('Volume')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('displays unit when provided', () => {
    render(<ParameterKnob {...defaultProps} unit="%" />);
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('renders presets when provided', () => {
    render(<ParameterKnob {...defaultProps} presets={[0, 25, 50, 75, 100]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('handles preset click', () => {
    const onChange = vi.fn();
    render(<ParameterKnob {...defaultProps} onChange={onChange} presets={[75]} />);

    const presetButton = screen.getByText('75');
    fireEvent.click(presetButton);

    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('handles disabled state', () => {
    const onChange = vi.fn();
    render(<ParameterKnob {...defaultProps} onChange={onChange} disabled presets={[75]} />);

    const presetButton = screen.getByText('75');
    fireEvent.click(presetButton);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('enters edit mode on double-click', () => {
    render(<ParameterKnob {...defaultProps} />);

    const valueDisplay = screen.getByText('50');
    fireEvent.doubleClick(valueDisplay.closest('div')!);

    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });

  it('updates value in edit mode', () => {
    const onChange = vi.fn();
    render(<ParameterKnob {...defaultProps} onChange={onChange} />);

    const knobContainer = screen.getByText('50').closest('div')!.parentElement!;
    fireEvent.doubleClick(knobContainer);

    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '75' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('applies color zones correctly', () => {
    const colorZones = [
      { start: 0, end: 50, color: 'green' },
      { start: 50, end: 100, color: 'red' },
    ];

    const { container } = render(
      <ParameterKnob {...defaultProps} value={75} colorZones={colorZones} />
    );

    // Check if SVG paths are rendered
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });
});
