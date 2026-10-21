<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. User Admin
        $admin = User::updateOrCreate(
            ['email' => 'admin@azatech.id'],
            [
                'name' => 'Admin AZA',
                'password' => Hash::make('password123'),
            ]
        );

        // 2. 25 Realistic Products (some with stock < 5 for dashboard low-stock alert)
        $productCatalog = [
            ['code' => 'P0001', 'name' => 'Hydrococo 150ml', 'stock' => 18, 'price' => 7500.00],
            ['code' => 'P0002', 'name' => 'Teh Botol Kotak 250ml', 'stock' => 35, 'price' => 5000.00],
            ['code' => 'P0003', 'name' => 'Indomie Goreng Spesial', 'stock' => 120, 'price' => 3500.00],
            ['code' => 'P0004', 'name' => 'Ultra Milk Cokelat 250ml', 'stock' => 24, 'price' => 7000.00],
            ['code' => 'P0005', 'name' => 'Aqua Botol 600ml', 'stock' => 50, 'price' => 4000.00],
            ['code' => 'P0006', 'name' => 'Pocari Sweat 500ml', 'stock' => 15, 'price' => 9000.00],
            ['code' => 'P0007', 'name' => 'Chitato Sapi Panggang 68g', 'stock' => 3, 'price' => 11500.00], // stock < 5
            ['code' => 'P0008', 'name' => 'Silverqueen Almond 58g', 'stock' => 2, 'price' => 16500.00], // stock < 5
            ['code' => 'P0009', 'name' => 'Beng Beng Maxx 32g', 'stock' => 45, 'price' => 4500.00],
            ['code' => 'P0010', 'name' => 'Nabati Wafer Keju 132g', 'stock' => 12, 'price' => 8500.00],
            ['code' => 'P0011', 'name' => 'Sari Gandum Sandwich 115g', 'stock' => 4, 'price' => 9500.00], // stock < 5
            ['code' => 'P0012', 'name' => 'Buavita Guava 250ml', 'stock' => 22, 'price' => 8500.00],
            ['code' => 'P0013', 'name' => 'Nescafe Classic Jar 100g', 'stock' => 8, 'price' => 42000.00],
            ['code' => 'P0014', 'name' => 'Kapal Api Special Mix 10s', 'stock' => 30, 'price' => 14000.00],
            ['code' => 'P0015', 'name' => 'Taro Net Seaweed 65g', 'stock' => 1, 'price' => 6000.00], // stock < 5
            ['code' => 'P0016', 'name' => 'Pocky Chocolate 40g', 'stock' => 19, 'price' => 9500.00],
            ['code' => 'P0017', 'name' => 'Good Day Cappuccino 5s', 'stock' => 28, 'price' => 12500.00],
            ['code' => 'P0018', 'name' => 'Milo Kotak 180ml', 'stock' => 32, 'price' => 6500.00],
            ['code' => 'P0019', 'name' => 'Bear Brand 189ml', 'stock' => 4, 'price' => 10500.00], // stock < 5
            ['code' => 'P0020', 'name' => 'Minyak Goreng Filma 2L', 'stock' => 14, 'price' => 38000.00],
            ['code' => 'P0021', 'name' => 'Gula Pasir Gulaku 1kg', 'stock' => 25, 'price' => 18000.00],
            ['code' => 'P0022', 'name' => 'Beras Ramos 5kg', 'stock' => 10, 'price' => 74000.00],
            ['code' => 'P0023', 'name' => 'Saus Sambal ABC 335ml', 'stock' => 16, 'price' => 15000.00],
            ['code' => 'P0024', 'name' => 'Kecap Manis Bango 520ml', 'stock' => 20, 'price' => 25000.00],
            ['code' => 'P0025', 'name' => 'Kopi Kenangan Mantancino', 'stock' => 11, 'price' => 10000.00],
        ];

        $createdProducts = [];
        foreach ($productCatalog as $item) {
            $createdProducts[] = Product::updateOrCreate(
                ['product_code' => $item['code']],
                [
                    'product_name' => $item['name'],
                    'stock' => $item['stock'],
                    'price' => $item['price'],
                ]
            );
        }

        // 3. 15 Realistic Customers
        $customerList = [
            ['name' => 'Budi Santoso', 'address' => 'Jl. Sudirman No. 45, Jakarta Selatan', 'gender' => 'Pria', 'birth' => '1990-05-14', 'phone' => '081234567801'],
            ['name' => 'Siti Rahmawati', 'address' => 'Jl. Malioboro No. 12, Yogyakarta', 'gender' => 'Wanita', 'birth' => '1995-02-10', 'phone' => '081234567802'],
            ['name' => 'Agus Pratama', 'address' => 'Jl. Diponegoro No. 88, Bandung', 'gender' => 'Pria', 'birth' => '1988-11-23', 'phone' => '081234567803'],
            ['name' => 'Dewi Lestari', 'address' => 'Jl. Pemuda No. 7, Semarang', 'gender' => 'Wanita', 'birth' => '1993-08-30', 'phone' => '081234567804'],
            ['name' => 'Hendra Wijaya', 'address' => 'Jl. Basuki Rahmat No. 19, Surabaya', 'gender' => 'Pria', 'birth' => '1992-04-17', 'phone' => '081234567805'],
            ['name' => 'Rina Kurnia', 'address' => 'Jl. Gajah Mada No. 64, Medan', 'gender' => 'Wanita', 'birth' => '1997-01-25', 'phone' => '081234567806'],
            ['name' => 'Eko Prasetyo', 'address' => 'Jl. Slamet Riyadi No. 101, Solo', 'gender' => 'Pria', 'birth' => '1989-09-05', 'phone' => '081234567807'],
            ['name' => 'Maya Anggraini', 'address' => 'Jl. Ahmad Yani No. 33, Malang', 'gender' => 'Wanita', 'birth' => '1996-06-19', 'phone' => '081234567808'],
            ['name' => 'Rizky Ramadhan', 'address' => 'Jl. Veteran No. 50, Palembang', 'gender' => 'Pria', 'birth' => '1994-12-01', 'phone' => '081234567809'],
            ['name' => 'Nurul Hidayah', 'address' => 'Jl. Urip Sumoharjo No. 82, Makassar', 'gender' => 'Wanita', 'birth' => '1998-07-14', 'phone' => '081234567810'],
            ['name' => 'Ahmad Fauzi', 'address' => 'Jl. Gatot Subroto No. 27, Denpasar', 'gender' => 'Pria', 'birth' => '1991-03-08', 'phone' => '081234567811'],
            ['name' => 'Sri Wahyuni', 'address' => 'Jl. Pahlawan No. 15, Bogor', 'gender' => 'Wanita', 'birth' => '1993-10-12', 'phone' => '081234567812'],
            ['name' => 'Dian Permata', 'address' => 'Jl. Juanda No. 91, Bekasi', 'gender' => 'Wanita', 'birth' => '1995-09-28', 'phone' => '081234567813'],
            ['name' => 'Fajar Nugroho', 'address' => 'Jl. MT Haryono No. 72, Balikpapan', 'gender' => 'Pria', 'birth' => '1987-04-03', 'phone' => '081234567814'],
            ['name' => 'Putri Ayu', 'address' => 'Jl. Teuku Umar No. 18, Bandar Lampung', 'gender' => 'Wanita', 'birth' => '1999-11-16', 'phone' => '081234567815'],
        ];

        $createdCustomers = [];
        foreach ($customerList as $cust) {
            $createdCustomers[] = Customer::create([
                'id' => (string) Str::uuid(),
                'customer_name' => $cust['name'],
                'customer_address' => $cust['address'],
                'gender' => $cust['gender'],
                'birth_date' => $cust['birth'],
                'phone' => $cust['phone'],
            ]);
        }

        // 4. 30 Orders scattered over the last 30 days
        $now = Carbon::now();
        $dailyCounter = [];

        for ($i = 0; $i < 30; $i++) {
            $daysAgo = (int) floor(($i * 29) / 29);
            $orderDate = $now->copy()->subDays($daysAgo)->setTime(rand(8, 20), rand(0, 59), rand(0, 59));
            $datePrefix = $orderDate->format('Ymd');

            if (!isset($dailyCounter[$datePrefix])) {
                $dailyCounter[$datePrefix] = 1;
            } else {
                $dailyCounter[$datePrefix]++;
            }

            $orderNumber = sprintf('INV-%s-%04d', $datePrefix, $dailyCounter[$datePrefix]);
            $customer = $createdCustomers[array_rand($createdCustomers)];

            $itemCount = rand(1, 4);
            $selectedProductKeys = (array) array_rand($createdProducts, $itemCount);
            
            $orderTotal = 0.0;
            $itemsData = [];

            foreach ($selectedProductKeys as $k) {
                $prod = $createdProducts[$k];
                $qty = rand(1, 3);
                $unitPrice = (float) $prod->price;
                $subtotal = $qty * $unitPrice;
                $orderTotal += $subtotal;

                $itemsData[] = [
                    'product_id' => $prod->id,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ];
            }

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $customer->id,
                'created_by' => $admin->id,
                'order_date' => $orderDate,
                'total_amount' => $orderTotal,
                'created_at' => $orderDate,
                'updated_at' => $orderDate,
            ]);

            foreach ($itemsData as $item) {
                $item['order_id'] = $order->id;
                OrderItem::create($item);
            }
        }
    }
}
