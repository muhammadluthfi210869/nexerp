import { render, screen } from '@testing-library/react';
import { TableWrapper } from '@/components/dna/TableWrapper';
import { describe, it, expect } from 'vitest';

describe('TableWrapper', () => {
  it('renders children content', () => {
    render(
      <TableWrapper>
        <table>
          <tbody>
            <tr>
              <td>Row data</td>
            </tr>
          </tbody>
        </table>
      </TableWrapper>,
    );
    expect(screen.getByText('Row data')).toBeInTheDocument();
  });

  it('renders filters when provided', () => {
    render(
      <TableWrapper filters={<input placeholder="Search..." />}>
        <table>
          <tbody>
            <tr>
              <td>Data</td>
            </tr>
          </tbody>
        </table>
      </TableWrapper>,
    );
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('does not render filters when not provided', () => {
    const { container } = render(
      <TableWrapper>
        <table>
          <tbody>
            <tr>
              <td>Data</td>
            </tr>
          </tbody>
        </table>
      </TableWrapper>,
    );
    expect(container.querySelector('[class*="border-b"]')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TableWrapper className="custom-wrapper">
        <table>
          <tbody>
            <tr>
              <td>Data</td>
            </tr>
          </tbody>
        </table>
      </TableWrapper>,
    );
    expect(container.firstChild).toHaveClass('custom-wrapper');
  });
});
