'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api, ApiError } from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  stock: number;
  price: number;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal Create/Edit state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formStock, setFormStock] = useState<number | ''>('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Product[]>('/products', {
        page,
        per_page: perPage,
        search,
        sort: sortBy,
        order: sortOrder,
      });
      setProducts(response.data || []);
      if (response.meta) {
        setTotalPages(response.meta.total_pages);
        setTotalItems(response.meta.total);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data produk');
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, sortBy, sortOrder]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [fetchProducts]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormCode('');
    setFormName('');
    setFormStock('');
    setFormPrice('');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormCode(product.product_code);
    setFormName(product.product_name);
    setFormStock(product.stock);
    setFormPrice(product.price);
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    const payload = {
      product_code: formCode.trim(),
      product_name: formName.trim(),
      stock: Number(formStock),
      price: Number(formPrice),
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setIsFormModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        setFormErrors(apiErr.errors);
      } else {
        setFormErrors({ general: [apiErr.message || 'Terjadi kesalahan saat menyimpan data.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await api.delete(`/products/${deletingProduct.id}`);
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Produk</h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola katalog barang, pantau jumlah stok, dan perbarui harga produk.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama atau kode produk..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total {totalItems} Produk Terdaftar
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchProducts} className="underline font-semibold">
              Coba lagi
            </button>
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {isLoading ? (
            <LoadingSpinner message="Memuat daftar produk..." className="py-20" />
          ) : products.length === 0 ? (
            <EmptyState
              title="Produk Tidak Ditemukan"
              description={search ? `Tidak ada produk dengan kata kunci "${search}".` : 'Belum ada produk yang terdaftar.'}
              actionText="Tambah Produk Pertama"
              onAction={openCreateModal}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Kode Produk</th>
                    <th
                      className="py-3.5 px-4 sm:px-6 cursor-pointer hover:text-slate-800"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Nama Produk</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 sm:px-6 cursor-pointer hover:text-slate-800 text-right"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Harga Satuan</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3.5 px-4 sm:px-6 cursor-pointer hover:text-slate-800 text-center"
                      onClick={() => handleSort('stock')}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Sisa Stok</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-mono font-semibold text-slate-800">
                        {p.product_code}
                      </td>
                      <td className="py-4 px-4 sm:px-6 font-medium text-slate-900">
                        {p.product_name}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right font-medium text-slate-800">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            p.stock === 0
                              ? 'bg-red-100 text-red-700'
                              : p.stock < 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(p)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Produk (Soft Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

        {/* Modal Form Tambah/Edit Produk */}
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
          maxWidth="md"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formErrors.general && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">
                {formErrors.general[0]}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Produk (Harus Unik)
              </label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="Contoh: P0026"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
              {formErrors.product_code && (
                <p className="text-xs text-red-500 mt-1">{formErrors.product_code[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Produk
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Hydrococo 150ml"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
              {formErrors.product_name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.product_name[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stok Awal (≥ 0)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                />
                {formErrors.stock && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.stock[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga Satuan (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="12000"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                />
                {formErrors.price && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.price[0]}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{editingProduct ? 'Simpan Perubahan' : 'Tambahkan'}</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Konfirmasi Hapus Produk */}
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Konfirmasi Hapus Produk"
          message="Produk ini akan dihapus dari katalog (Soft Delete). Riwayat order lama yang memuat produk ini akan tetap tersimpan aman."
          itemName={deletingProduct ? `${deletingProduct.product_code} - ${deletingProduct.product_name}` : ''}
          isLoading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
