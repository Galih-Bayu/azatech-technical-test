'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  ShoppingCart,
  Search,
  Filter,
  Eye,
  PlusCircle,
  FileSpreadsheet,
  Calendar,
  User,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

interface OrderRow {
  id: number;
  order_number: string;
  customer_id: string;
  order_date: string;
  total_amount: number;
  items_count: number;
  customer?: {
    id: string;
    customer_name: string;
    phone: string | null;
  };
  creator?: {
    id: number;
    name: string;
  };
}

interface CustomerOption {
  id: string;
  customer_name: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [search, setSearch] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Fetch customer options for dropdown filter
  useEffect(() => {
    api.get<CustomerOption[]>('/customers', { per_page: 100 })
      .then((res) => setCustomers(res.data || []))
      .catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<OrderRow[]>('/orders', {
        page,
        per_page: perPage,
        search,
        customer_id: filterCustomerId || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
      });
      setOrders(response.data || []);
      if (response.meta) {
        setTotalPages(response.meta.total_pages);
        setTotalItems(response.meta.total);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil riwayat transaksi');
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, filterCustomerId, filterFrom, filterTo]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchOrders();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [fetchOrders]);

  const handleResetFilter = () => {
    setSearch('');
    setFilterCustomerId('');
    setFilterFrom('');
    setFilterTo('');
    setPage(1);
  };

  // Bonus: Export to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('Tidak ada data order untuk diekspor.');
      return;
    }

    const headers = ['No Order', 'Tanggal Order', 'Nama Pelanggan', 'Jumlah Item', 'Total Transaksi (Rp)', 'Kasir/Admin'];
    const rows = orders.map((o) => [
      `"${o.order_number}"`,
      `"${formatDate(o.order_date, true)}"`,
      `"${o.customer?.customer_name || '-'}"`,
      o.items_count,
      o.total_amount,
      `"${o.creator?.name || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-transaksi-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Pesanan &amp; Penjualan</h1>
            <p className="text-sm text-slate-500 mt-1">
              Daftar seluruh transaksi yang pernah dilakukan beserta rincian item produk.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
              title="Unduh laporan dalam format file spreadsheet Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <a
              href="/orders/create"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Order Baru</span>
            </a>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filter Transaksi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Invoice Number */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari no invoice / nama..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Customer Filter */}
            <div>
              <select
                value={filterCustomerId}
                onChange={(e) => {
                  setFilterCustomerId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              >
                <option value="">Semua Pelanggan</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="relative">
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => {
                  setFilterFrom(e.target.value);
                  setPage(1);
                }}
                title="Dari Tanggal"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Date To */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterTo}
                onChange={(e) => {
                  setFilterTo(e.target.value);
                  setPage(1);
                }}
                title="Sampai Tanggal"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              {(search || filterCustomerId || filterFrom || filterTo) && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchOrders} className="underline font-semibold">
              Coba lagi
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {isLoading ? (
            <LoadingSpinner message="Memuat daftar pesanan..." className="py-20" />
          ) : orders.length === 0 ? (
            <EmptyState
              title="Tidak Ada Pesanan Ditemukan"
              description="Belum ada riwayat pesanan yang cocok dengan filter tanggal atau kata kunci yang dipilih."
              actionText="Buat Pesanan Pertama"
              onAction={() => window.location.href = '/orders/create'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">No. Invoice</th>
                    <th className="py-3.5 px-4 sm:px-6">Tanggal Transaksi</th>
                    <th className="py-3.5 px-4 sm:px-6">Pelanggan</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Jumlah Item</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Total Transaksi</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold text-blue-600">
                        <a href={`/orders/${o.id}`} className="hover:underline">
                          {o.order_number}
                        </a>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-600 text-xs sm:text-sm">
                        {formatDate(o.order_date, true)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 font-medium text-slate-900">
                        {o.customer?.customer_name || <span className="text-slate-400 italic">Pelanggan Dihapus</span>}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                          {o.items_count} item
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(o.total_amount)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <a
                          href={`/orders/${o.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <span>Detail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </AppLayout>
  );
}
