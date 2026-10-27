<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Recurso de API de un equipo: forma exacta que exige el contrato.
 *
 * Expone id, codigo, nombre, estado, fecha_adquisicion en formato Y-m-d
 * y categoria, esta última solo si la relación viene cargada.
 *
 * costo_interno, created_at y updated_at nunca se exponen: los campos se
 * listan de forma explícita para que el contrato no dependa del esquema
 * de la tabla.
 */
class EquipoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'codigo'            => $this->codigo,
            'nombre'            => $this->nombre,
            'estado'            => $this->estado,
            'fecha_adquisicion' => $this->fecha_adquisicion?->format('Y-m-d'),
            'categoria'         => new CategoriaResource($this->whenLoaded('categoria')),
        ];
    }
}
