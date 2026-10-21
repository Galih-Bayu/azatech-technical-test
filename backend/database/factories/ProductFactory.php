<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'product_code' => 'P' . str_pad((string) fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'product_name' => fake()->words(3, true),
            'stock' => fake()->numberBetween(0, 50),
            'price' => fake()->randomFloat(2, 5000, 250000),
        ];
    }
}
