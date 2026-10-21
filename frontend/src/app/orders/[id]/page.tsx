'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Printer,
  Receipt,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  Package,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface OrderDetail {
  id: number;
  order_number: string;
  customer_id: string;
  created_by: number;
  order_date: string;
  total_amount: number;
  customer: {
    id: string;
    customer_name: string;
    customer_address: string;
    gender: string;
    phone: string | null;
  };
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  items: {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product?: {
      id: number;
      product_code: string;
      product_name: string;
    };
  }[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    api.get<OrderDetail>(`/orders/${id}`)
      .then((res) => {
        setOrder(res.data);
      })
      .catch((err: any) => {
        setError(err.message || 'Gagal memuat detail faktur pesanan.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/orders')}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Detail Faktur Penjualan</h1>
              <p className="text-sm text-slate-500 mt-0.5">Rincian resmi bukti transaksi dan item produk.</p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Faktur (Print)</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner message="Mengambil rincian faktur order..." className="py-24" />
        ) : order ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6 sm:p-8 space-y-8 print:border-none print:shadow-none print:p-0">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-blue-600 font-bold text-lg mb-1">
                  <Receipt className="w-6 h-6" />
                  <span>PT LAKSMADA AZA SIMETRI</span>
                </div>
                <p className="text-xs text-slate-500">Sistem Order Management &bull; Official Invoice</p>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nomor Faktur</span>
                  <p className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                    {order.order_number}
                  </p>
                </div>
              </div>

              <div className="sm:text-right space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Transaksi Berhasil (Lunas)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Tanggal: <span className="font-semibold text-slate-800">{formatDate(order.order_date, true)}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Petugas Kasir: <span className="font-semibold text-slate-800">{order.creator?.name || 'Administrator'}</span>
                </p>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Ditujukan Kepada Pelanggan:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-bold text-slate-900 text-base">{order.customer?.customer_name || 'Pelanggan Dihapus'}</p>
                  <p className="text-xs text-slate-600 mt-1 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{order.customer?.customer_address || '-'}</span>
                  </p>
                </div>
                <div className="sm:text-right space-y-1 text-xs">
                  <p className="text-slate-500">
                    No. Handphone: <span className="font-mono font-medium text-slate-800">{order.customer?.phone || '-'}</span>
                  </p>
                  <p className="text-slate-500">
                    Jenis Kelamin: <span className="font-medium text-slate-800">{order.customer?.gender || '-'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Rincian Barang yang Dipesan</span>
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Kode Produk</th>
                      <th className="py-3 px-4">Nama Produk</th>
                      <th className="py-3 px-4 text-center">Jumlah (Qty)</th>
                      <th className="py-3 px-4 text-right">Harga Satuan (Snapshot)</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 text-slate-400 text-xs">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {item.product?.product_code || '-'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {item.product?.product_name || 'Produk Telah Dihapus'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                          {formatRupiah(item.unit_price)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Section */}
            <div className="pt-4 border-t border-slate-200 flex flex-col items-end gap-2">
              <div className="w-full sm:w-72 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal Barang:</span>
                  <span className="font-mono">{formatRupiah(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Pajak &amp; Biaya Layanan:</span>
                  <span className="font-mono">Rp 0</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Bayar:</span>
                  <span className="font-mono text-blue-600 text-xl">{formatRupiah(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Footer / Notes */}
            <div className="pt-8 border-t border-slate-100 text-center text-xs text-slate-400">
              <p>Terima kasih atas pesanan Anda di Azatech Online Shop.</p>
              <p className="mt-0.5">Dokumen ini merupakan bukti pembayaran sah yang dikeluarkan oleh sistem komputer.</p>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
