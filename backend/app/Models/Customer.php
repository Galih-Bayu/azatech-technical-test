<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'customer_name',
        'customer_address',
        'gender',
        'birth_date',
        'phone',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
