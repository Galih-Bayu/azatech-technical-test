<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        $gender = fake()->randomElement(['Pria', 'Wanita']);

        return [
            'id' => (string) Str::uuid(),
            'customer_name' => fake()->name($gender === 'Pria' ? 'male' : 'female'),
            'customer_address' => fake()->address(),
            'gender' => $gender,
            'birth_date' => fake()->dateTimeBetween('-50 years', '-18 years')->format('Y-m-d'),
            'phone' => '08' . fake()->numerify('##########'),
        ];
    }
}
