'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';

interface Customer {
  id: string;
  customer_name: string;
  customer_address: string;
  gender: 'Pria' | 'Wanita';
  birth_date: string;
  phone: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');

  // Modal Create/Edit state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formGender, setFormGender] = useState<'Pria' | 'Wanita'>('Pria');
  const [formBirthDate, setFormBirthDate] = useState('1995-01-01');
  const [formPhone, setFormPhone] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Customer[]>('/customers', {
        page,
        per_page: perPage,
        search,
      });
      setCustomers(response.data || []);
      if (response.meta) {
        setTotalPages(response.meta.total_pages);
        setTotalItems(response.meta.total);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data pelanggan');
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [fetchCustomers]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormAddress('');
    setFormGender('Pria');
    setFormBirthDate('1995-01-01');
    setFormPhone('');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.customer_name);
    setFormAddress(customer.customer_address);
    setFormGender(customer.gender);
    setFormBirthDate(customer.birth_date);
    setFormPhone(customer.phone || '');
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    const payload = {
      customer_name: formName.trim(),
      customer_address: formAddress.trim(),
      gender: formGender,
      birth_date: formBirthDate,
      phone: formPhone.trim() || null,
    };

    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, payload);
      } else {
        await api.post('/customers', payload);
      }
      setIsFormModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        setFormErrors(apiErr.errors);
      } else {
        setFormErrors({ general: [apiErr.message || 'Gagal menyimpan data pelanggan.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (customer: Customer) => {
    setDeletingCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    try {
      await api.delete(`/customers/${deletingCustomer.id}`);
      setIsDeleteModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pelanggan');
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pelanggan</h1>
            <p className="text-sm text-slate-500 mt-1">
              Data pelanggan terdaftar untuk pembuatan faktur dan transaksi penjualan.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>

        {/* Search Bar */}
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
              placeholder="Cari nama pelanggan..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total {totalItems} Pelanggan Terdaftar
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchCustomers} className="underline font-semibold">
              Coba lagi
            </button>
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {isLoading ? (
            <LoadingSpinner message="Memuat daftar pelanggan..." className="py-20" />
          ) : customers.length === 0 ? (
            <EmptyState
              title="Pelanggan Tidak Ditemukan"
              description={search ? `Tidak ada pelanggan dengan nama "${search}".` : 'Belum ada data pelanggan.'}
              actionText="Tambah Pelanggan Baru"
              onAction={openCreateModal}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Nama Lengkap</th>
                    <th className="py-3.5 px-4 sm:px-6">Gender &amp; Tanggal Lahir</th>
                    <th className="py-3.5 px-4 sm:px-6">Alamat Domisili</th>
                    <th className="py-3.5 px-4 sm:px-6">Kontak (HP)</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {c.customer_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{c.customer_name}</p>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[120px] sm:max-w-xs">{c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold mb-1 ${
                            c.gender === 'Pria' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {c.gender}
                        </span>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(c.birth_date)}</span>
                        </p>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-700 text-xs sm:text-sm max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.customer_address}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-700 font-mono text-xs">
                        {c.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Data Pelanggan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(c)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Pelanggan (Soft Delete)"
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

        {/* Modal Form Tambah/Edit Pelanggan */}
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
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
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
              {formErrors.customer_name && (
                <p className="text-xs text-red-500 mt-1">{formErrors.customer_name[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Domisili
              </label>
              <textarea
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Contoh: Jl. Sudirman No. 45, Jakarta Selatan"
                required
                rows={2}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
              {formErrors.customer_address && (
                <p className="text-xs text-red-500 mt-1">{formErrors.customer_address[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={formGender}
                  onChange={(e) => setFormGender(e.target.value as 'Pria' | 'Wanita')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                >
                  <option value="Pria">Pria</option>
                  <option value="Wanita">Wanita</option>
                </select>
                {formErrors.gender && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.gender[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={formBirthDate}
                  onChange={(e) => setFormBirthDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                />
                {formErrors.birth_date && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.birth_date[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Handphone / WhatsApp (Opsional)
              </label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 font-mono"
              />
              {formErrors.phone && (
                <p className="text-xs text-red-500 mt-1">{formErrors.phone[0]}</p>
              )}
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
                <span>{editingCustomer ? 'Simpan Perubahan' : 'Tambahkan'}</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Konfirmasi Hapus Pelanggan */}
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Konfirmasi Hapus Pelanggan"
          message="Pelanggan ini akan dihapus (Soft Delete). Riwayat order transaksi pelanggan ini akan tetap tercatat di sistem."
          itemName={deletingCustomer?.customer_name}
          isLoading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}
