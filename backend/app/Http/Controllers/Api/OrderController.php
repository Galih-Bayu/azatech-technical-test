<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Models\Order;
use App\Services\OrderService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OrderController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Display a listing of orders with date range and customer filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['customer:id,customer_name,phone', 'creator:id,name'])
            ->withCount('items');

        // Filter by Customer ID
        if ($customerId = $request->query('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        // Filter by Date Range: from & to
        if ($from = $request->query('from')) {
            try {
                $fromDate = Carbon::parse($from)->startOfDay();
                $query->where('order_date', '>=', $fromDate);
            } catch (\Exception $e) {
                // Ignore invalid date format
            }
        }

        if ($to = $request->query('to')) {
            try {
                $toDate = Carbon::parse($to)->endOfDay();
                $query->where('order_date', '<=', $toDate);
            } catch (\Exception $e) {
                // Ignore invalid date format
            }
        }

        // Search by order_number
        if ($search = $request->query('search')) {
            $searchTerm = '%' . strtolower(trim((string) $search)) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(order_number) LIKE ?', [$searchTerm])
                  ->orWhereHas('customer', function ($cq) use ($searchTerm) {
                      $cq->whereRaw('LOWER(customer_name) LIKE ?', [$searchTerm]);
                  });
            });
        }

        $perPage = (int) $request->query('per_page', 10);
        $perPage = max(1, min(100, $perPage));

        $orders = $query->orderBy('order_date', 'desc')->paginate($perPage);

        return $this->paginatedResponse($orders, 'Data order berhasil diambil');
    }

    /**
     * Store a newly created order.
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->createOrder(
            $request->validated(),
            $request->user()->id
        );

        return $this->successResponse($order, 'Order berhasil dibuat', Response::HTTP_CREATED);
    }

    /**
     * Display the specified order with full item details.
     */
    public function show(int $id): JsonResponse
    {
        $order = Order::with([
            'customer',
            'creator:id,name,email',
            'items.product',
        ])->find($id);

        if (!$order) {
            return $this->errorResponse('Order tidak ditemukan', Response::HTTP_NOT_FOUND);
        }

        return $this->successResponse($order, 'Detail order berhasil diambil');
    }
}
