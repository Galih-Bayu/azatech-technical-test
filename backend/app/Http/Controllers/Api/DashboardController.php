<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    /**
     * Get dashboard summary analytics.
     */
    public function summary(): JsonResponse
    {
        // 1. Total Transaksi
        $totalOrders = Order::count();

        // 2. Total Penjualan (Rp)
        $totalSales = (float) Order::sum('total_amount');

        // 3. 5 Produk Terlaris (Top 5 selling products by sum of quantity)
        $topProducts = OrderItem::select('product_id', DB::raw('SUM(quantity) as total_sold'), DB::raw('SUM(subtotal) as total_revenue'))
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->with(['product' => function ($q) {
                $q->withTrashed()->select('id', 'product_code', 'product_name', 'price', 'stock');
            }])
            ->get()
            ->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'product_code' => $item->product?->product_code ?? '-',
                    'product_name' => $item->product?->product_name ?? 'Produk Dihapus',
                    'total_sold' => (int) $item->total_sold,
                    'total_revenue' => (float) $item->total_revenue,
                ];
            });

        // 4. Produk dengan Stok < 5 (Peringatan Stok Menipis)
        $lowStockProducts = Product::where('stock', '<', 5)
            ->orderBy('stock', 'asc')
            ->get(['id', 'product_code', 'product_name', 'stock', 'price']);

        // 5. Bonus: Trend Penjualan Harian 30 Hari Terakhir (Database-agnostic Collection grouping)
        $thirtyDaysAgo = Carbon::now()->subDays(29)->startOfDay();
        $ordersLast30Days = Order::where('order_date', '>=', $thirtyDaysAgo)
            ->get(['order_date', 'total_amount']);

        $groupedOrders = $ordersLast30Days->groupBy(function ($o) {
            return Carbon::parse($o->order_date)->format('Y-m-d');
        });

        $dailySales = [];
        for ($i = 29; $i >= 0; $i--) {
            $day = Carbon::now()->subDays($i)->format('Y-m-d');
            $dayOrders = $groupedOrders->get($day, collect());
            $dailySales[] = [
                'date' => $day,
                'order_count' => $dayOrders->count(),
                'total_revenue' => (float) $dayOrders->sum('total_amount'),
            ];
        }

        return $this->successResponse([
            'total_transactions' => $totalOrders,
            'total_sales' => $totalSales,
            'top_products' => $topProducts,
            'low_stock_products' => $lowStockProducts,
            'daily_sales_chart' => $dailySales,
        ], 'Ringkasan dashboard berhasil diambil');
    }
}
