<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validación de creación y actualización de equipos.
 *
 * El mismo Form Request se usa en store() y en update(). Al actualizar,
 * la regla unique sobre "codigo" ignora el equipo actual, que se obtiene
 * de $this->route('equipo') gracias al route model binding.
 *
 * El campo "estado" solo admite "disponible" o "mantenimiento":
 * "prestado" se asigna únicamente mediante POST /equipos/{id}/prestamo.
 *
 * Todos los mensajes están en español y asociados a cada campo.
 */
class GuardarEquipoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $equipo = $this->route('equipo');

        return [
            'codigo' => [
                'required',
                'string',
                'max:20',
                'regex:/^EQ-\d{4}$/',
                Rule::unique('equipos', 'codigo')->ignore($equipo),
            ],
            'nombre'            => ['required', 'string', 'min:3', 'max:120'],
            'categoria_id'      => ['required', 'integer', 'exists:categorias,id'],
            'estado'            => ['sometimes', Rule::in(['disponible', 'mantenimiento'])],
            'fecha_adquisicion' => ['required', 'date', 'before_or_equal:today'],
            'costo_interno'     => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo.required' => 'El código es obligatorio.',
            'codigo.string'   => 'El código debe ser texto.',
            'codigo.max'      => 'El código no puede tener más de 20 caracteres.',
            'codigo.regex'    => 'El código debe tener el formato EQ-0000.',
            'codigo.unique'   => 'Ya existe un equipo con ese código.',

            'nombre.required' => 'El nombre es obligatorio.',
            'nombre.string'   => 'El nombre debe ser texto.',
            'nombre.min'      => 'El nombre debe tener al menos 3 caracteres.',
            'nombre.max'      => 'El nombre no puede tener más de 120 caracteres.',

            'categoria_id.required' => 'La categoría es obligatoria.',
            'categoria_id.integer'  => 'La categoría no es válida.',
            'categoria_id.exists'   => 'La categoría seleccionada no existe.',

            'estado.in' => 'El estado solo puede ser disponible o mantenimiento.',

            'fecha_adquisicion.required'        => 'La fecha de adquisición es obligatoria.',
            'fecha_adquisicion.date'            => 'La fecha de adquisición no es válida.',
            'fecha_adquisicion.before_or_equal' => 'La fecha de adquisición no puede ser futura.',

            'costo_interno.required' => 'El costo es obligatorio.',
            'costo_interno.numeric'  => 'El costo debe ser un número.',
            'costo_interno.min'      => 'El costo no puede ser negativo.',
        ];
    }
}
