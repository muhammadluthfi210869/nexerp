import { render, screen } from '@testing-library/react';
import { SectionLabel } from '@/components/dna/SectionLabel';
import { describe, it, expect } from 'vitest';

describe('SectionLabel', () => {
  it('renders children text', () => {
    render(<SectionLabel>Dashboard Overview</SectionLabel>);
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });

  it('renders as h2 by default', () => {
    render(<SectionLabel>Section Title</SectionLabel>);
    const el = screen.getByText('Section Title');
    expect(el.tagName).toBe('H2');
  });

  it('renders as h3 when as="h3"', () => {
    render(<SectionLabel as="h3">Sub Section</SectionLabel>);
    const el = screen.getByText('Sub Section');
    expect(el.tagName).toBe('H3');
  });

  it('applies custom className', () => {
    render(<SectionLabel className="my-custom-class">Styled</SectionLabel>);
    expect(screen.getByText('Styled')).toHaveClass('my-custom-class');
  });
});
