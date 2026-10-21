<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\InsufficientStockException;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class OrderService
{
    /**
     * Create a new sales order with atomic database transaction and stock validation.
     *
     * @param array{customer_id: string, items: array<int, array{product_id: int, quantity: int}>} $data
     * @param int $userId
     * @return Order
     * @throws InsufficientStockException
     */
    public function createOrder(array $data, int $userId): Order
    {
        return DB::transaction(function () use ($data, $userId) {
            $customer = Customer::findOrFail($data['customer_id']);

            $stockErrors = [];
            $preparedItems = [];
            $totalAmount = 0.0;

            // 1. Lock and validate all requested items first
            foreach ($data['items'] as $index => $itemData) {
                $productId = (int) $itemData['product_id'];
                $requestedQty = (int) $itemData['quantity'];

                /** @var Product|null $product */
                $product = Product::lockForUpdate()->find($productId);

                if (!$product) {
                    $stockErrors["items.{$index}.quantity"] = [
                        "Produk dengan ID {$productId} tidak ditemukan atau sudah tidak aktif.",
                    ];
                    continue;
                }

                if ($product->stock < $requestedQty) {
                    $stockErrors["items.{$index}.quantity"] = [
                        "Stok {$product->product_name} tersisa {$product->stock}, diminta {$requestedQty}",
                    ];
                }

                $unitPrice = (float) $product->price;
                $subtotal = $unitPrice * $requestedQty;
                $totalAmount += $subtotal;

                $preparedItems[] = [
                    'product' => $product,
                    'quantity' => $requestedQty,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                ];
            }

            // 2. If any item fails stock validation, abort immediately (atomic rollback)
            if (!empty($stockErrors)) {
                throw new InsufficientStockException($stockErrors, 'Stok tidak mencukupi');
            }

            // 3. Generate unique order number: INV-YYYYMMDD-XXXX
            $orderDate = Carbon::now();
            $orderNumber = $this->generateOrderNumber($orderDate);

            // 4. Create Order
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $customer->id,
                'created_by' => $userId,
                'order_date' => $orderDate,
                'total_amount' => $totalAmount,
            ]);

            // 5. Deduct stock and create order items
            foreach ($preparedItems as $item) {
                /** @var Product $product */
                $product = $item['product'];
                $product->decrement('stock', $item['quantity']);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['subtotal'],
                ]);
            }

            return $order->load(['customer', 'creator:id,name,email', 'items.product']);
        });
    }

    /**
     * Generate sequential unique order number formatted as INV-YYYYMMDD-XXXX.
     */
    protected function generateOrderNumber(Carbon $date): string
    {
        $datePrefix = $date->format('Ymd');
        $pattern = "INV-{$datePrefix}-%";

        // Find the latest order number for this specific day using lockForUpdate
        $latestOrder = Order::where('order_number', 'LIKE', $pattern)
            ->orderBy('order_number', 'desc')
            ->lockForUpdate()
            ->first();

        $nextSequence = 1;
        if ($latestOrder) {
            $parts = explode('-', $latestOrder->order_number);
            if (isset($parts[2]) && is_numeric($parts[2])) {
                $nextSequence = (int) $parts[2] + 1;
            }
        }

        return sprintf('INV-%s-%04d', $datePrefix, $nextSequence);
    }
}
