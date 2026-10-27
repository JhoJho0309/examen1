<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuardarEquipoRequest;
use App\Http\Resources\EquipoResource;
use App\Models\Equipo;
use App\Services\EquipoService;
use Illuminate\Http\Request;

/**
 * Controlador delgado: recibe la petición, delega en EquipoService y responde.
 *
 * Ninguna regla de negocio vive aquí; las reglas R1 y R2 están en el servicio
 * y se traducen a 409 en bootstrap/app.php. Ningún método devuelve el modelo
 * directo: todos responden con EquipoResource.
 */
class EquipoController extends Controller
{
    public function __construct(private EquipoService $service)
    {
    }

    public function index(Request $request)
    {
        $porPagina = min(max($request->integer('per_page', 10), 1), 50);

        return EquipoResource::collection(
            $this->service->listar(
                $request->query('q'),
                $request->query('estado'),
                $porPagina,
            )
        );
    }

    public function show(Equipo $equipo)
    {
        return new EquipoResource($equipo->load('categoria'));
    }

    public function store(GuardarEquipoRequest $request)
    {
        $equipo = $this->service->crear($request->validated());

        return (new EquipoResource($equipo))
            ->response()
            ->setStatusCode(201)
            ->header('Location', route('equipos.show', $equipo));
    }

    public function update(GuardarEquipoRequest $request, Equipo $equipo)
    {
        return new EquipoResource(
            $this->service->actualizar($equipo, $request->validated())
        );
    }

    public function destroy(Equipo $equipo)
    {
        $this->service->eliminar($equipo);

        return response()->noContent();
    }

    public function prestar(Equipo $equipo)
    {
        return new EquipoResource($this->service->prestar($equipo));
    }
}
