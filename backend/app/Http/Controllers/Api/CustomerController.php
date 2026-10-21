<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Models\Customer;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CustomerController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of customers with pagination and search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        if ($search = $request->query('search')) {
            $searchTerm = '%' . strtolower(trim((string) $search)) . '%';
            $query->whereRaw('LOWER(customer_name) LIKE ?', [$searchTerm]);
        }

        $perPage = (int) $request->query('per_page', 10);
        $perPage = max(1, min(100, $perPage));

        $customers = $query->latest('created_at')->paginate($perPage);

        return $this->paginatedResponse($customers, 'Data pelanggan berhasil diambil');
    }

    /**
     * Store a newly created customer.
     */
    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = Customer::create($request->validated());

        return $this->successResponse($customer, 'Pelanggan berhasil ditambahkan', Response::HTTP_CREATED);
    }

    /**
     * Display the specified customer.
     */
    public function show(mixed $customer): JsonResponse
    {
        $item = Customer::find($customer);

        if (!$item) {
            return $this->errorResponse('Pelanggan tidak ditemukan', Response::HTTP_NOT_FOUND);
        }

        return $this->successResponse($item, 'Detail pelanggan berhasil diambil');
    }

    /**
     * Update the specified customer.
     */
    public function update(UpdateCustomerRequest $request, mixed $customer): JsonResponse
    {
        $item = Customer::find($customer);

        if (!$item) {
            return $this->errorResponse('Pelanggan tidak ditemukan', Response::HTTP_NOT_FOUND);
        }

        $item->update($request->validated());

        return $this->successResponse($item, 'Pelanggan berhasil diperbarui');
    }

    /**
     * Remove the specified customer using soft delete.
     */
    public function destroy(mixed $customer): JsonResponse
    {
        $item = Customer::find($customer);

        if (!$item) {
            return $this->errorResponse('Pelanggan tidak ditemukan', Response::HTTP_NOT_FOUND);
        }

        $item->delete();

        return $this->successResponse(null, 'Pelanggan berhasil dihapus');
    }
}
