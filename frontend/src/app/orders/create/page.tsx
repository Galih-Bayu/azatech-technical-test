'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { api, ApiError } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import {
  ShoppingCart,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  User,
  Package,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProductOption {
  id: number;
  product_code: string;
  product_name: string;
  price: number;
  stock: number;
}

interface CustomerOption {
  id: string;
  customer_name: string;
  phone: string | null;
  customer_address: string;
}

interface OrderItemRow {
  product_id: number | '';
  quantity: number;
}

export default function CreateOrderPage() {
  const router = useRouter();

  // Selection data
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form State
  const [customerId, setCustomerId] = useState<string>('');
  const [items, setItems] = useState<OrderItemRow[]>([{ product_id: '', quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error feedback
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  useEffect(() => {
    async function loadOptions() {
      setIsLoadingData(true);
      try {
        const [prodRes, custRes] = await Promise.all([
          api.get<ProductOption[]>('/products', { per_page: 100 }),
          api.get<CustomerOption[]>('/customers', { per_page: 100 }),
        ]);
        setProducts(prodRes.data || []);
        setCustomers(custRes.data || []);
        if (custRes.data && custRes.data.length > 0) {
          setCustomerId(custRes.data[0].id);
        }
      } catch (err: any) {
        setGeneralError('Gagal memuat daftar produk atau pelanggan.');
      } finally {
        setIsLoadingData(false);
      }
    }
    loadOptions();
  }, []);

  // Row Manipulation
  const handleAddItem = () => {
    setItems((prev) => [...prev, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
    // Clear error for removed item if any
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`items.${index}.quantity`];
      delete next[`items.${index}.product_id`];
      return next;
    });
  };

  const handleProductChange = (index: number, newProductId: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], product_id: newProductId };
      return updated;
    });
    // Clear error for that line
    clearItemError(index);
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: qty };
      return updated;
    });
    clearItemError(index);
  };

  const clearItemError = (index: number) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`items.${index}.quantity`];
      delete next[`items.${index}.product_id`];
      return next;
    });
  };

  // Find product details
  const getProductById = (id: number | ''): ProductOption | undefined => {
    if (id === '') return undefined;
    return products.find((p) => p.id === Number(id));
  };

  // Calculate live total on client
  const calculateTotal = () => {
    return items.reduce((acc, row) => {
      const prod = getProductById(row.product_id);
      if (prod) {
        return acc + prod.price * row.quantity;
      }
      return acc;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Client-side quick check
    if (!customerId) {
      setGeneralError('Pilih pelanggan terlebih dahulu.');
      return;
    }

    const unselectedRows = items.some((item) => item.product_id === '');
    if (unselectedRows) {
      setGeneralError('Pastikan semua baris sudah memilih produk.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      customer_id: customerId,
      items: items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      })),
    };

    try {
      const response = await api.post<any>('/orders', payload);
      setSuccessOrder(response.data);
      // Wait 1.5s then redirect to order detail page
      setTimeout(() => {
        router.push(`/orders/${response.data.id}`);
      }, 1500);
    } catch (err: any) {
      const apiErr = err as ApiError;
      setGeneralError(apiErr.message || 'Gagal memproses pesanan.');
      if (apiErr.errors) {
        setFieldErrors(apiErr.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center gap-3">
          <a
            href="/orders"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buat Transaksi Order Baru</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Input pesanan penjualan dengan pengecekan stok otomatis dan kalkulasi server.
            </p>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successOrder && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Transaksi Berhasil Dibuat!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Nomor Invoice: <span className="font-mono font-bold">{successOrder.order_number}</span>. Mengalihkan ke detail faktur...
              </p>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {generalError && !successOrder && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">{generalError}</p>
              <p className="text-xs text-red-700 mt-0.5">
                Periksa ketersediaan stok atau kelengkapan produk pada baris item yang disorot merah di bawah.
              </p>
            </div>
          </div>
        )}

        {isLoadingData ? (
          <LoadingSpinner message="Menyiapkan data produk dan pelanggan..." className="py-20" />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Pilih Pelanggan Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">1. Data Pelanggan</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Pilih Pelanggan (Customer) *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                  >
                    <option value="">-- Pilih Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customer_name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {customerId && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-center">
                    {(() => {
                      const selected = customers.find((c) => c.id === customerId);
                      return selected ? (
                        <>
                          <p className="text-xs font-semibold text-slate-800">{selected.customer_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{selected.customer_address}</p>
                          {selected.phone && <p className="text-xs text-blue-600 font-mono mt-0.5">{selected.phone}</p>}
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Daftar Item Produk Dinamis Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">2. Item Produk yang Dipesan</h2>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Produk</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((row, index) => {
                  const prod = getProductById(row.product_id);
                  const rowSubtotal = prod ? prod.price * row.quantity : 0;
                  const itemStockError = fieldErrors[`items.${index}.quantity`];
                  const itemProdError = fieldErrors[`items.${index}.product_id`];
                  const hasError = !!itemStockError || !!itemProdError;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition-all ${
                        hasError
                          ? 'bg-red-50/60 border-red-300 ring-1 ring-red-300'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        {/* Product Select */}
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Pilih Produk #{index + 1}
                          </label>
                          <select
                            value={row.product_id}
                            onChange={(e) => handleProductChange(index, Number(e.target.value))}
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                          >
                            <option value="">-- Pilih Produk --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.product_code} - {p.product_name} (Stok: {p.stock}) - {formatRupiah(p.price)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity Input */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Jumlah (Qty)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                            required
                            className={`w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold text-slate-800 ${
                              itemStockError ? 'border-red-400 text-red-700 bg-red-50/50' : 'border-slate-200'
                            }`}
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="sm:col-span-2 text-left sm:text-right">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Harga Satuan
                          </label>
                          <p className="text-sm font-medium text-slate-700 py-2 font-mono">
                            {prod ? formatRupiah(prod.price) : '-'}
                          </p>
                        </div>

                        {/* Subtotal */}
                        <div className="sm:col-span-2 text-left sm:text-right">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Subtotal
                          </label>
                          <p className="text-sm font-bold text-slate-900 py-2 font-mono">
                            {formatRupiah(rowSubtotal)}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <div className="sm:col-span-1 flex items-center justify-end sm:pt-4">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length <= 1}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Hapus Baris Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Line Error Message from Server (e.g. Stok tidak mencukupi) */}
                      {itemStockError && (
                        <div className="mt-2.5 pt-2 border-t border-red-200/60 flex items-center gap-2 text-xs font-semibold text-red-600 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{itemStockError[0]}</span>
                        </div>
                      )}
                      {itemProdError && (
                        <div className="mt-2.5 pt-2 border-t border-red-200/60 flex items-center gap-2 text-xs font-semibold text-red-600 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{itemProdError[0]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Summary & Total */}
              <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <p>* Harga dan total resmi dikalkulasi ulang di server database.</p>
                  <p>* Stok akan dipotong otomatis dalam 1 transaksi atomik.</p>
                </div>

                <div className="text-right flex items-center gap-6">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Total Pembayaran:</span>
                    <p className="text-2xl font-black text-blue-600 tracking-tight font-mono">
                      {formatRupiah(calculateTotal())}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !!successOrder}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Order...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Selesaikan Transaksi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
