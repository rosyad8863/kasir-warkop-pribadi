import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/App';

describe('Kasir Warkop Pribadi — UI Integration & Cross-Device Flow (AC-17 s.d. AC-21)', () => {
  it('menjalankan alur penuh: Mulai Shift -> Simpan 2 Pesanan -> Tabel Terpisah Per Pesanan & Rekap 2 Kolom -> Pengaturan', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Tunggu DB selesai inisialisasi dan 37 produk tampil
    await waitFor(() => {
      expect(screen.getByText('Kasir Warkop Pribadi')).toBeInTheDocument();
    });

    expect(await screen.findByText('Es Teh')).toBeInTheDocument();
    expect(screen.getByText('Mie + Telur')).toBeInTheDocument();

    // Mulai Shift
    const startShiftBtn = screen.getByRole('button', { name: /Mulai Shift/i });
    await user.click(startShiftBtn);

    await waitFor(() => {
      expect(screen.getByText(/Shift Aktif:/i)).toBeInTheDocument();
    });

    // PESANAN #1: Pilih 3x Es Teh, 2x Kopi Cangkir, 1x Mie + Telur (AC-01)
    const esTehBtn = screen.getByRole('button', { name: /Es Teh/i });
    const kopiCangkirBtn = screen.getByRole('button', { name: /^Kopi Cangkir/i });
    const mieTelurBtn = screen.getByRole('button', { name: /Mie \+ Telur/i });

    await user.click(esTehBtn);
    await user.click(esTehBtn);
    await user.click(esTehBtn);
    await user.click(kopiCangkirBtn);
    await user.click(kopiCangkirBtn);
    await user.click(mieTelurBtn);

    expect(screen.getByTestId('cart-total-display')).toHaveTextContent('Rp31.000');

    // Masukkan uang kurang Rp20.000 (AC-03)
    const cashInput = screen.getByLabelText(/Uang Diterima/i);
    await user.clear(cashInput);
    await user.type(cashInput, '20000');

    expect(screen.getByTestId('payment-warning')).toHaveTextContent('Kurang Rp11.000');
    const saveBtn = screen.getByRole('button', { name: /Simpan Transaksi/i });
    expect(saveBtn).toBeDisabled();

    // Masukkan uang cukup Rp50.000 (AC-02)
    await user.clear(cashInput);
    await user.type(cashInput, '50000');

    expect(screen.getByTestId('change-display')).toHaveTextContent('Rp19.000');
    expect(saveBtn).toBeEnabled();

    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Transaksi Berhasil Disimpan!/i)).toBeInTheDocument();
    });

    // PESANAN #2: Pilih 2x Es Teh (Rp8.000), bayar Rp10.000
    await user.click(esTehBtn);
    await user.click(esTehBtn);
    await user.clear(cashInput);
    await user.type(cashInput, '10000');
    await user.click(saveBtn);

    // Buka tab Catatan Shift dan periksa tabel terpisah untuk setiap pesanan
    const notesTabBtn = screen.getByRole('button', { name: /Catatan Shift/i });
    await user.click(notesTabBtn);

    const orderCard1 = await screen.findByTestId('order-table-card-1');
    const orderCard2 = await screen.findByTestId('order-table-card-2');

    expect(within(orderCard1).getByText('Pesanan #1')).toBeInTheDocument();
    expect(within(orderCard1).getByText('Es Teh (3x)')).toBeInTheDocument();
    expect(within(orderCard1).getByText('Kopi Cangkir (2x)')).toBeInTheDocument();
    expect(within(orderCard1).getByText('Mie + Telur (1x)')).toBeInTheDocument();
    expect(within(orderCard1).getByText('TOTAL PESANAN #1')).toBeInTheDocument();

    expect(within(orderCard2).getByText('Pesanan #2')).toBeInTheDocument();
    expect(within(orderCard2).getByText('Es Teh (2x)')).toBeInTheDocument();
    expect(within(orderCard2).getByText('TOTAL PESANAN #2')).toBeInTheDocument();

    // Rekap gabungan seluruh shift tetap menampilkan Es Teh (5x) dan total 39.000
    expect(screen.getByText('Es Teh (5x)')).toBeInTheDocument();
    expect(screen.getByTestId('ledger-total-cell')).toHaveTextContent('39.000');

    // Buka tab Pengaturan/Menu dan cek informasi penyimpanan lokal (AC-21)
    const settingsTabBtn = screen.getByRole('button', { name: /Pengaturan\/Menu/i });
    await user.click(settingsTabBtn);

    expect(
      await screen.findByText(/Penyimpanan Lokal Per Perangkat/i)
    ).toBeInTheDocument();
  });
});
