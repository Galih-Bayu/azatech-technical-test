# Azatech Online Shop — Order Management System
> **Technical Test — Medior Fullstack Developer**  
> **PT Laksmada Aza Simetri**

Repository ini memuat aplikasi fullstack untuk mengelola produk, pelanggan, dan transaksi penjualan (order management) dengan integritas bisnis atomik, pemisahan service backend & frontend yang bersih, serta automated test suite yang menyeluruh.

---

## 📌 Ringkasan Tech Stack & Alasan Pemilihan

Sesuai ketentuan soal, backend dan frontend dibangun sebagai dua service terpisah (*two-tier architecture*):

| Komponen | Pilihan Teknologi | Alasan & Justifikasi Teknis |
| :--- | :--- | :--- |
| **Backend Runtime & Framework** | **PHP 8.3 / Laravel 13** (Track B) | • **Integritas Bisnis Transaksional**: Fitur `DB::transaction()` dan pessimistic locking `lockForUpdate()` bawaan Laravel sangat matang untuk mencegah *race condition* stok.<br>• **Standardisasi & Efisiensi Boilerplate**: *Laravel Sanctum* untuk autentikasi API token, *Form Request* untuk validasi ketat, serta *SoftDeletes* bawaan mengeliminasi risiko bug keamanan manual, memungkinkan fokus penuh pada logika bisnis pemesanan.<br>• **Data Seeding & Testing**: Eloquent Factory memudahkan generasi 30 order acak dalam rentang 30 hari terakhir. |
| **Database** | **PostgreSQL 14** | Tipe data `decimal(14,2)` yang presisi untuk uang/harga, kepatuhan ACID yang tinggi, performa indexing yang handal, serta integritas relasional (*foreign key constraints*). |
| **Frontend Framework** | **React 19 + Next.js 16 (App Router)** | Komponen berbasis TypeScript, kecepatan routing, navigasi reaktif, dan integrasi mudah dengan REST API. |
| **Styling & Icons** | **Tailwind CSS v4 + Lucide React** | Desain modern, bersih, responsive (mobile & desktop), dilengkapi state loading skeleton, empty state, dan error banner. |
| **Testing** | **PHPUnit / Laravel Feature Test** | Trait `RefreshDatabase` menguji skenario transaksi database atomik secara cepat dan terisolasi. |

---

## 🚀 Panduan Setup & Menjalankan Aplikasi

Aplikasi dapat dijalankan dari `git clone` sampai siap digunakan melalui **6 langkah praktis** berikut:

### Prasyarat
- **PHP** $\ge$ 8.3 (dengan ekstensi `pdo_pgsql`, `zip`, `mbstring`)
- **Composer** $\ge$ 2.x
- **Node.js** $\ge$ 20.x & **NPM**
- **PostgreSQL** $\ge$ 14 (berjalan di port default `5432`)

---

### Langkah Instalasi (Maksimal 6 Perintah)

```bash
# 1. Clone repository dan masuk ke folder
git clone https://github.com/Galih-Bayu/azatech-technical-test.git
cd azatech-technical-test

# 2. Setup konfigurasi environment backend
cp backend/.env.example backend/.env
# Pastikan DB_USERNAME dan DB_PASSWORD di backend/.env sesuai dengan konfigurasi PostgreSQL Anda
# Buat database kosong 'azatech_order' di PostgreSQL

# 3. Install dependency backend & generate application key
cd backend && composer install && php artisan key:generate

# 4. Jalankan database migration dan seeder
php artisan migrate --seed

# 5. Jalankan backend server (berjalan di http://127.0.0.1:8000)
php artisan serve

# 6. Di terminal baru, install dependency dan jalankan frontend
cd ../frontend && npm install && npm run dev
```

Aplikasi frontend siap diakses melalui browser di: **`http://localhost:3000`**

---

## 🔑 Akun Login Pengujian (Seeder)

Database seeder secara otomatis membuat akun Administrator:
- **Email**: `admin@azatech.id`
- **Password**: `password123`

> 💡 *Pada halaman login (`http://localhost:3000/login`), tersedia tombol **"Isi Akun Admin Otomatis"** untuk mempermudah sesi pengujian.*

---

## 🧠 Penjelasan Logika Bisnis & Arsitektur Aplikasi

### 1. Alur Pembuatan Order & Penanganan Stok Atomik
Salah satu titik krusial dari sistem ini adalah **integritas stok barang saat transaksi penjualan berlangsung**:
- **Validasi Kuantitas & Ketersediaan**: Saat request `POST /api/orders` diterima, server mengunci baris produk yang dipesan menggunakan `Product::lockForUpdate()` di dalam blok `DB::transaction(function() { ... })`. Ini mencegah *race condition* jika dua transaksi terjadi di milidetik yang sama.
- **Rollback Atomik Menyeluruh**: Jika stok salah satu produk tidak mencukupi (misal diminta 5 tersisa 3), sistem melempar `InsufficientStockException`. Seluruh proses transaksi langsung di-*rollback* seketika:
  - **Tidak ada record order** yang tersimpan di database.
  - **Tidak ada stok yang terpotong** pada produk lain yang stoknya mencukupi.
- **Kalkulasi Server-Side**: Harga satuan dan total transaksi **mutlak dihitung di server** berdasarkan harga master saat itu. Client hanya mengirimkan `customer_id` dan daftar `items: [{ product_id, quantity }]`.
- **Snapshot `unit_price`**: Harga saat transaksi disimpan permanen ke kolom `order_items.unit_price`. Jika di kemudian hari admin menaikkan atau menurunkan harga di master produk, nominal faktur dan laporan keuangan historis pelanggan **tetap akurat dan tidak berubah**.
- **Generasi Format Invoice Unik**: Nomor pesanan diformat otomatis dengan pola `INV-YYYYMMDD-XXXX` (contoh: `INV-20261022-0001`) yang bertambah secara berurutan per hari menggunakan sequence locking.

### 2. Perlindungan Data Historis (Soft Deletes)
- Tabel `products` dan `customers` mengimplementasikan fitur `SoftDeletes` (`deleted_at`).
- Jika produk atau pelanggan dihapus dari master data, relasi pada faktur dan riwayat order masa lalu tetap dapat ditampilkan dengan utuh via relasi `->withTrashed()`.

### 3. Standar Format Response API
Seluruh respons API dibungkus menggunakan response helper yang konsisten:
- **Sukses**:
  ```json
  {
    "success": true,
    "message": "Order berhasil dibuat",
    "data": { ... }
  }
  ```
- **Error Validasi / Stok Kurang (HTTP 422)**:
  ```json
  {
    "success": false,
    "message": "Stok tidak mencukupi",
    "errors": {
      "items.0.quantity": ["Stok Hydrococo 150ml tersisa 3, diminta 5"]
    }
  }
  ```

---

## 🧪 Cara Menjalankan Automated Test

Aplikasi dilengkapi dengan automated integration/feature test suite menggunakan PHPUnit bawaan Laravel:

```bash
cd backend
php artisan test
```

### Hasil Pengujian:
```text
PASS  Tests\Feature\OrderManagementTest
✓ cannot access protected routes without token              (HTTP 401 Unauthorized)
✓ create order validation fails with invalid data           (HTTP 422 Validation Error)
✓ create order fails when product stock is insufficient     (HTTP 422 Insufficient Stock)
✓ order rolls back atomically when one item exceeds stock   (Atomic Transaction Rollback)
✓ create order successfully and deducts stock               (HTTP 201 Created & Inventory Deduction)
✓ auth login and dashboard summary                          (Sanctum Token & Analytical Dashboard)

Tests:    8 passed (53 assertions)
Duration: ~1.5s
```

---

## 📦 Dokumentasi API (Postman Collection)

File blueprint Postman Collection disertakan langsung di root repository:
📄 **`Azatech_Order_Management.postman_collection.json`**

### Cara Import ke Postman:
1. Buka aplikasi **Postman**.
2. Klik tombol **Import** di pojok kiri atas.
3. Pilih file `Azatech_Order_Management.postman_collection.json`.
4. Seluruh koleksi endpoint (Auth, Products, Customers, Orders, Dashboard) akan otomatis terkonfigurasi lengkap dengan variabel `{{baseUrl}}` dan token extractor otomatis pada request login.

---

## 🌟 Fitur Bonus yang Telah Diimplementasikan

- [x] **Grafik Penjualan Harian**: Visualisasi tren omzet transaksi harian 30 hari terakhir pada Dashboard ringkasan.
- [x] **Export Riwayat Transaksi ke CSV**: Tombol satu klik untuk mengunduh laporan order dalam format file spreadsheet Excel/CSV.
- [x] **Print-Friendly Invoice**: Tampilan cetak faktur bersih tanpa elemen navigasi website saat dicetak ke printer atau disimpan sebagai PDF.
- [x] **Interactive Demo Helpers**: Tombol auto-fill kredensial pada login untuk efisiensi sesi review teknis.

---

## ⚖️ Asumsi, Keterbatasan, & Rencana Pengembangan Lanjutan

### Asumsi Bisnis
1. Sistem beroperasi dalam mata uang tunggal (Rupiah / IDR) dan skema inventaris satu gudang (*single warehouse*).
2. Transaksi dianggap lunas secara langsung setelah checkout diselesaikan (*instant direct settlement*).

### Keterbatasan Saat Ini
1. Pengecekan stok dilakukan saat tombol checkout ditekan, belum ada mekanisme *temporary reservation* saat produk masih berada di keranjang belanja.
2. Filter riwayat transaksi difokuskan pada rentang tanggal, nomor order, dan pelanggan.

### Rencana Peningkatan (*If Given More Time*)
1. **Payment Gateway Integration**: Menghubungkan webhook pembayaran otomatis via Midtrans / Xendit.
2. **Asynchronous Queue / Workers**: Pengiriman notifikasi email faktur via Redis queue (*Laravel Jobs/Queues*) agar respon order pembuatan menjadi lebih cepat (< 100ms).
3. **Multi-Warehouse Support**: Memungkinkan produk disimpan di berbagai cabang gudang dengan rute logistik terdekat.
4. **End-to-End Testing**: Menambahkan testing otomatis antarmuka browser menggunakan Playwright / Cypress.

---

## 🤖 AI Usage (Transparansi Penggunaan AI Assistant)

Sesuai ketentuan pada dokumen soal Halaman 6:
- **Tools yang Digunakan**: Antigravity AI Assistant.
- **Ruang Lingkup Penggunaan**:
  - Brainstorming arsitektur dan penentuan skenario automated test integrasi.
  - Scaffolding awal struktur monorepo dan komponen UI Tailwind CSS.
  - Konsultasi struktur data seeder agar memenuhi 30 hari riwayat transaksi secara realistis.

---

*Dikembangkan oleh **Galih Bayu Pratama** untuk Technical Assessment PT Laksmada Aza Simetri.*
