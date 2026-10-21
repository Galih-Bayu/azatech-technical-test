'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Package,
  Award,
  Calendar,
  RefreshCw,
  PlusCircle,
  ArrowUpRight,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface TopProduct {
  product_id: number;
  product_code: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

interface LowStockProduct {
  id: number;
  product_code: string;
  product_name: string;
  stock: number;
  price: number;
}

interface DailySales {
  date: string;
  order_count: number;
  total_revenue: number;
}

interface DashboardSummary {
  total_transactions: number;
  total_sales: number;
  top_products: TopProduct[];
  low_stock_products: LowStockProduct[];
  daily_sales_chart: DailySales[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<DashboardSummary>('/dashboard/summary');
      setData(response.data);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Compute maximum revenue for the bar chart scaling
  const maxRevenue = data?.daily_sales_chart
    ? Math.max(...data.daily_sales_chart.map((d) => d.total_revenue), 1)
    : 1;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Title & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Ringkasan</h1>
            <p className="text-sm text-slate-500 mt-1">
              Pantau performa penjualan, ketersediaan produk, dan status pesanan hari ini.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboard}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
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

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={fetchDashboard}
              className="text-xs font-semibold text-red-800 underline hover:text-red-900"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner message="Mengambil data analisis dashboard..." className="py-24" />
        ) : data ? (
          <>
            {/* Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Total Transaksi */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Transaksi
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {data.total_transactions}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span>Semua pesanan tercatat</span>
                  </p>
                </div>
              </div>

              {/* Total Omzet Penjualan */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Penjualan
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {formatRupiah(data.total_sales)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">Akumulasi seluruh transaksi</p>
                </div>
              </div>

              {/* Produk Stok Menipis */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Peringatan Stok &lt; 5
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-extrabold text-amber-600 tracking-tight">
                    {data.low_stock_products.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Produk perlu restock segera</p>
                </div>
              </div>

              {/* Top Produk */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Produk Terlaris #1
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-lg font-bold text-slate-900 truncate">
                    {data.top_products[0]?.product_name || '-'}
                  </p>
                  <p className="text-xs text-purple-600 mt-1 font-medium">
                    {data.top_products[0]?.total_sold || 0} unit terjual
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Sales Chart (Bonus Point) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Grafik Penjualan Harian (30 Hari Terakhir)</h3>
                  <p className="text-xs text-slate-500">Tren nominal transaksi harian dalam Rupiah</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" />
                  <span>Pendapatan Harian</span>
                </div>
              </div>

              {/* Visual Bar Chart */}
              <div className="h-48 sm:h-64 flex items-end gap-1 sm:gap-2 pt-6 border-b border-slate-200 overflow-x-auto pb-2">
                {data.daily_sales_chart.map((day, idx) => {
                  const heightPercent = maxRevenue > 0 ? (day.total_revenue / maxRevenue) * 100 : 0;
                  const shortDate = day.date.slice(8); // 'DD'

                  return (
                    <div
                      key={day.date}
                      className="flex-1 min-w-[14px] sm:min-w-[20px] flex flex-col items-center group relative h-full justify-end"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-slate-900 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-lg whitespace-nowrap">
                          <p className="font-semibold">{day.date}</p>
                          <p className="text-blue-300">{formatRupiah(day.total_revenue)}</p>
                          <p className="text-slate-400 text-[10px]">{day.order_count} transaksi</p>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          day.total_revenue > 0
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      />
                      <span className="text-[10px] text-slate-400 mt-2 font-mono">{idx % 3 === 0 ? shortDate : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom 2 Columns: Top 5 Products & Low Stock Alert */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 5 Produk Terlaris */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">5 Produk Terlaris</h3>
                      <p className="text-xs text-slate-500">Paling banyak dipesan pelanggan</p>
                    </div>
                  </div>
                  <a
                    href="/products"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Lihat Semua</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="divide-y divide-slate-100">
                  {data.top_products.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">Belum ada riwayat pesanan.</div>
                  ) : (
                    data.top_products.map((p, index) => (
                      <div key={p.product_id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0
                                ? 'bg-amber-100 text-amber-700'
                                : index === 1
                                ? 'bg-slate-200 text-slate-700'
                                : index === 2
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{p.product_name}</p>
                            <p className="text-xs text-slate-400 font-mono">{p.product_code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">{p.total_sold} unit</p>
                          <p className="text-xs text-emerald-600 font-medium">{formatRupiah(p.total_revenue)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Peringatan Stok Menipis (< 5) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Peringatan Stok Menipis</h3>
                      <p className="text-xs text-slate-500">Stok tersisa kurang dari 5 unit</p>
                    </div>
                  </div>
                  <a
                    href="/products"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Kelola Stok</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {data.low_stock_products.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Semua stok produk dalam kondisi aman (&gt; 5).
                    </div>
                  ) : (
                    data.low_stock_products.map((p) => (
                      <div key={p.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{p.product_name}</p>
                          <p className="text-xs text-slate-400 font-mono">
                            {p.product_code} &bull; {formatRupiah(p.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              p.stock === 0
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.stock === 0 ? 'Habis (0)' : `Sisa ${p.stock}`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
