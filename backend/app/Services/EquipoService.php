<?php

namespace App\Services;

use App\Exceptions\ReglaNegocioException;
use App\Models\Equipo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Capa de negocio de equipos.
 *
 * Esta clase no conoce HTTP: no usa request(), response() ni abort().
 * Cuando una regla del dominio impide la operación lanza
 * ReglaNegocioException, que bootstrap/app.php traduce a 409.
 *
 * Reglas de negocio:
 *  R1. No se puede eliminar un equipo prestado.
 *  R2. Solo se puede prestar un equipo disponible; en mantenimiento y
 *      ya prestado tienen cada uno su propio mensaje.
 *
 * El listado carga la categoría de forma anticipada para evitar N+1.
 */
class EquipoService
{
    public function listar(?string $q, ?string $estado, int $porPagina): LengthAwarePaginator
    {
        return Equipo::query()
            ->with('categoria')
            ->when($q, fn ($consulta) => $consulta->where(
                fn ($grupo) => $grupo->where('codigo', 'like', "%{$q}%")
                                     ->orWhere('nombre', 'like', "%{$q}%")
            ))
            ->when($estado, fn ($consulta) => $consulta->where('estado', $estado))
            ->orderBy('codigo')
            ->paginate($porPagina)
            ->withQueryString();
    }

    public function crear(array $datos): Equipo
    {
        return Equipo::create($datos)->load('categoria');
    }

    public function actualizar(Equipo $equipo, array $datos): Equipo
    {
        $equipo->update($datos);

        return $equipo->load('categoria');
    }

    public function eliminar(Equipo $equipo): void
    {
        if ($equipo->estado === 'prestado') {
            throw new ReglaNegocioException('No se puede eliminar un equipo prestado.');
        }

        $equipo->delete();
    }

    public function prestar(Equipo $equipo): Equipo
    {
        if ($equipo->estado === 'mantenimiento') {
            throw new ReglaNegocioException('No se puede prestar un equipo en mantenimiento.');
        }

        if ($equipo->estado === 'prestado') {
            throw new ReglaNegocioException('El equipo ya se encuentra prestado.');
        }

        $equipo->update(['estado' => 'prestado']);

        return $equipo->load('categoria');
    }
}
