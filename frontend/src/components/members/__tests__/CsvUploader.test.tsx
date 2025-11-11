import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CsvUploader } from '../CsvUploader';

describe('CsvUploader', () => {
  it('should call onFileSelect when a valid file is provided', async () => {
    const handleSelect = vi.fn();
    render(<CsvUploader onFileSelect={handleSelect} />);

    const input = screen.getByTestId('csv-input') as HTMLInputElement;
    const file = new File(['Nome;CPF'], 'membros.csv', { type: 'text/csv' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(handleSelect).toHaveBeenCalledWith(file);
    });
  });

  it('should show error for invalid extension', async () => {
    render(<CsvUploader onFileSelect={() => undefined} />);

    const input = screen.getByTestId('csv-input') as HTMLInputElement;
    const invalidFile = new File(['teste'], 'membros.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(
      await screen.findByText(/Formato inválido/)
    ).toBeInTheDocument();
  });
});
