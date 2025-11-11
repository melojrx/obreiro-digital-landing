import { render, screen } from '@testing-library/react';
import { ImportReport } from '../ImportReport';
import { BulkImportResult } from '@/types/import';

const mockResult: BulkImportResult = {
  total_rows: 3,
  success_count: 2,
  error_count: 1,
  duplicates_skipped: 0,
  errors: [
    {
      line: 3,
      messages: ['Telefone é obrigatório'],
    },
  ],
  imported_member_ids: [1, 2],
  branch_id: 5,
};

describe('ImportReport', () => {
  it('renders summary data', () => {
    render(<ImportReport result={mockResult} />);
    expect(screen.getByText('Linhas processadas')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Filial destino')).toBeInTheDocument();
  });

  it('shows error list', () => {
    render(<ImportReport result={mockResult} />);
    expect(screen.getByText(/Linha 3/)).toBeInTheDocument();
    expect(screen.getByText(/Telefone é obrigatório/)).toBeInTheDocument();
  });
});
