<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:150'],
            'customer_address' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'in:Pria,Wanita'],
            'birth_date' => ['required', 'date', 'date_format:Y-m-d'],
            'phone' => ['nullable', 'string', 'max:20'],
        ];
    }
}
