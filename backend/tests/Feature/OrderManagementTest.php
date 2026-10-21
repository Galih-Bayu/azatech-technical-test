<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Create an authorized test user and issue Sanctum token
        $this->user = User::factory()->create([
            'name' => 'Admin AZA',
            'email' => 'admin@azatech.id',
            'password' => bcrypt('password123'),
        ]);

        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    /**
     * Helper to perform authenticated requests.
     */
    protected function authJson(string $method, string $uri, array $data = []): \Illuminate\Testing\TestResponse
    {
        return $this->json($method, $uri, $data, [
            'Authorization' => "Bearer {$this->token}",
            'Accept' => 'application/json',
        ]);
    }

    /**
     * 1. Test: Akses tanpa token wajib ditolak (HTTP 401).
     */
    public function test_cannot_access_protected_routes_without_token(): void
    {
        // Try accessing protected product list
        $responseProduct = $this->getJson('/api/products');
        $responseProduct->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated',
            ]);

        // Try creating an order without token
        $responseOrder = $this->postJson('/api/orders', []);
        $responseOrder->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated',
            ]);

        // Try accessing dashboard without token
        $responseDashboard = $this->getJson('/api/dashboard/summary');
        $responseDashboard->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated',
            ]);
    }

    /**
     * 2. Test: Validasi input gagal jika payload tidak sesuai (HTTP 422).
     */
    public function test_create_order_validation_fails_with_invalid_data(): void
    {
        // Payload kosong
        $responseEmpty = $this->authJson('POST', '/api/orders', []);
        $responseEmpty->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ])
            ->assertJsonValidationErrors(['customer_id', 'items']);

        // Customer ID bukan UUID atau tidak terdaftar
        $responseInvalidCustomer = $this->authJson('POST', '/api/orders', [
            'customer_id' => 'non-existent-uuid',
            'items' => [
                ['product_id' => 9999, 'quantity' => 1],
            ],
        ]);
        $responseInvalidCustomer->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'items.0.product_id']);

        // Quantity negatif atau 0
        $customer = Customer::factory()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $responseInvalidQty = $this->authJson('POST', '/api/orders', [
            'customer_id' => $customer->id,
            'items' => [
                ['product_id' => $product->id, 'quantity' => 0],
            ],
        ]);
        $responseInvalidQty->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.quantity']);
    }

    /**
     * 3. Test: Buat order gagal ketika stok produk tidak cukup (HTTP 422).
     */
    public function test_create_order_fails_when_product_stock_is_insufficient(): void
    {
        $customer = Customer::factory()->create();
        $product = Product::factory()->create([
            'product_name' => 'Hydrococo 150ml',
            'stock' => 3,
            'price' => 7500.00,
        ]);

        $payload = [
            'customer_id' => $customer->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5, // Request 5 padahal stok cuma 3
                ],
            ],
        ];

        $response = $this->authJson('POST', '/api/orders', $payload);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Stok tidak mencukupi',
                'errors' => [
                    'items.0.quantity' => [
                        "Stok Hydrococo 150ml tersisa 3, diminta 5",
                    ],
                ],
            ]);

        // Pastikan stok di database tidak berkurang sama sekali
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 3,
        ]);

        // Pastikan order tidak tersimpan
        $this->assertEquals(0, Order::count());
    }

    /**
     * 4. Test: Transaksi atomik - Jika 1 item gagal stok, seluruh transaksi di-rollback (tidak ada stok terpotong).
     */
    public function test_order_rolls_back_atomically_when_one_item_exceeds_stock(): void
    {
        $customer = Customer::factory()->create();

        // Produk 1: Stok cukup (10)
        $product1 = Product::factory()->create([
            'product_name' => 'Indomie Goreng',
            'stock' => 10,
            'price' => 3500.00,
        ]);

        // Produk 2: Stok habis (0)
        $product2 = Product::factory()->create([
            'product_name' => 'Bear Brand',
            'stock' => 0,
            'price' => 10500.00,
        ]);

        $payload = [
            'customer_id' => $customer->id,
            'items' => [
                ['product_id' => $product1->id, 'quantity' => 2], // Cukup
                ['product_id' => $product2->id, 'quantity' => 1], // Kurang (stok 0)
            ],
        ];

        $response = $this->authJson('POST', '/api/orders', $payload);
        $response->assertStatus(422);

        // Uji integritas atomik: Stok Produk 1 TIDAK BOLEH berkurang!
        $this->assertEquals(10, $product1->fresh()->stock);
        $this->assertEquals(0, $product2->fresh()->stock);

        // Tidak ada order yang terbuat
        $this->assertEquals(0, Order::count());
    }

    /**
     * 5. Test: Buat order sukses, stok berkurang, invoice terbuat, dan harga di-snapshot (HTTP 201).
     */
    public function test_create_order_successfully_and_deducts_stock(): void
    {
        $customer = Customer::factory()->create();

        $product1 = Product::factory()->create([
            'product_name' => 'Aqua Botol 600ml',
            'stock' => 20,
            'price' => 4000.00,
        ]);

        $product2 = Product::factory()->create([
            'product_name' => 'Pocari Sweat 500ml',
            'stock' => 10,
            'price' => 9000.00,
        ]);

        $payload = [
            'customer_id' => $customer->id,
            'items' => [
                ['product_id' => $product1->id, 'quantity' => 2], // 2 * 4000 = 8000
                ['product_id' => $product2->id, 'quantity' => 1], // 1 * 9000 = 9000
            ],
        ];

        $response = $this->authJson('POST', '/api/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Order berhasil dibuat',
            ]);

        $responseData = $response->json('data');

        // Pastikan format nomor invoice: INV-YYYYMMDD-XXXX
        $this->assertMatchesRegularExpression('/^INV-\d{8}-\d{4}$/', $responseData['order_number']);

        // Pastikan total dihitung akurat di server (8000 + 9000 = 17000)
        $this->assertEquals(17000.00, (float) $responseData['total_amount']);

        // Pastikan stok di database terpotong dengan benar
        $this->assertEquals(18, $product1->fresh()->stock); // 20 - 2
        $this->assertEquals(9, $product2->fresh()->stock);   // 10 - 1

        // Pastikan order_items tersimpan dengan snapshot unit_price yang benar
        $this->assertDatabaseHas('order_items', [
            'product_id' => $product1->id,
            'quantity' => 2,
            'unit_price' => 4000.00,
            'subtotal' => 8000.00,
        ]);

        $this->assertDatabaseHas('order_items', [
            'product_id' => $product2->id,
            'quantity' => 1,
            'unit_price' => 9000.00,
            'subtotal' => 9000.00,
        ]);
    }

    /**
     * 6. Test: Login mengembalikan token dan Dashboard Summary menampilkan statistik.
     */
    public function test_auth_login_and_dashboard_summary(): void
    {
        // Test login
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'admin@azatech.id',
            'password' => 'password123',
        ]);

        $loginResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login berhasil',
            ])
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user' => ['id', 'name', 'email'],
                ],
            ]);

        // Test dashboard summary
        $dashboardResponse = $this->authJson('GET', '/api/dashboard/summary');
        $dashboardResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'total_transactions',
                    'total_sales',
                    'top_products',
                    'low_stock_products',
                    'daily_sales_chart',
                ],
            ]);
    }
}
