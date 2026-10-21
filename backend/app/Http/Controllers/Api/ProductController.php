<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of products with pagination, search, and sorting.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        // Search by name or code
        if ($search = $request->query('search')) {
            $searchTerm = '%' . strtolower(trim((string) $search)) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(product_name) LIKE ?', [$searchTerm])
                  ->orWhereRaw('LOWER(product_code) LIKE ?', [$searchTerm]);
            });
        }

        // Sorting: nama, harga (price), stok (stock)
        $allowedSorts = [
            'name' => 'product_name',
            'product_name' => 'product_name',
            'price' => 'price',
            'harga' => 'price',
            'stock' => 'stock',
            'stok' => 'stock',
            'created_at' => 'created_at',
        ];

        $sortBy = $request->query('sort', 'created_at');
        $sortDirection = strtolower((string) $request->query('order', 'desc')) === 'asc' ? 'asc' : 'desc';

        $column = $allowedSorts[$sortBy] ?? 'created_at';
        $query->orderBy($column, $sortDirection);

        $perPage = (int) $request->query('per_page', 10);
        $perPage = max(1, min(100, $perPage));

        $products = $query->paginate($perPage);

        return $this->paginatedResponse($products, 'Data produk berhasil diambil');
    }

    /**
     * Store a newly created product.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());

        return $this->successResponse($product, 'Produk berhasil ditambahkan', Response::HTTP_CREATED);
    }

    /**
     * Display the specified product.
     */
    public function show(mixed $product): JsonResponse
    {
        $item = Product::find($product);

        if (!$item) {
            return $this->errorResponse('Produk tidak ditemukan', Response::HTTP_NOT_FOUND);
        }

        return $this->successResponse($item, 'Detail produk berhasil diambil');
    }

    /**
     * Update the specified product.
     */
    public function update(UpdateProductRequest $request, mixed $product): JsonResponse
    {
        $item = Product::find($product);

        if (!$item) {
            return $this->errorResponse('Produk tidak ditemukan', Response::HTTP_NOT_FOUND);
        }

        $item->update($request->validated());

        return $this->successResponse($item, 'Produk berhasil diperbarui');
    }

    /**
     * Remove the specified product using soft delete.
     */
    public function destroy(mixed $product): JsonResponse
    {
        $item = Product::find($product);

        if (!$item) {
            return $this->errorResponse('Produk tidak ditemukan', Response::HTTP_NOT_FOUND);
        }

        $item->delete();

        return $this->successResponse(null, 'Produk berhasil dihapus');
    }
}
