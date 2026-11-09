<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ZoneStatique;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ZoneStatiqueController extends Controller
{
    public function index(): JsonResponse
    {
        $zones = ZoneStatique::with('missions')->latest()->get();
        return response()->json($zones);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom_zone' => 'required|string|max:100',
            'code_zone' => 'nullable|string|max:50|unique:zones_statiques,code_zone',
            'type_zone' => 'nullable|string|max:50',
            'surface_hectares' => 'nullable|numeric|min:0',
            'latitude_centre' => 'nullable|numeric',
            'longitude_centre' => 'nullable|numeric',
            'altitude_reference' => 'nullable|numeric',
            'limites_gps' => 'nullable',
            'niveau_risque' => 'nullable|string|in:faible,moyen,eleve',
            'description' => 'nullable|string',
        ], [
            'nom_zone.required' => 'Le nom de la zone est obligatoire.',
            'code_zone.unique' => 'Ce code zone est déjà utilisé.',
        ]);

        if (empty($validated['code_zone'])) {
            $validated['code_zone'] = 'ZN-' . strtoupper(Str::random(4));
        }
        if (empty($validated['niveau_risque'])) {
            $validated['niveau_risque'] = 'faible';
        }

        $zone = ZoneStatique::create($validated);

        return response()->json([
            'message' => 'Zone statique créée avec succès',
            'zone' => $zone,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $zone = ZoneStatique::with('missions')->findOrFail($id);
        return response()->json($zone);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $zone = ZoneStatique::findOrFail($id);

        $validated = $request->validate([
            'nom_zone' => 'sometimes|required|string|max:100',
            'code_zone' => 'sometimes|nullable|string|max:50|unique:zones_statiques,code_zone,' . $zone->id,
            'type_zone' => 'sometimes|nullable|string|max:50',
            'surface_hectares' => 'sometimes|nullable|numeric|min:0',
            'latitude_centre' => 'sometimes|nullable|numeric',
            'longitude_centre' => 'sometimes|nullable|numeric',
            'altitude_reference' => 'sometimes|nullable|numeric',
            'limites_gps' => 'sometimes|nullable',
            'niveau_risque' => 'sometimes|nullable|string|in:faible,moyen,eleve',
            'description' => 'sometimes|nullable|string',
        ]);

        $zone->update($validated);

        return response()->json([
            'message' => 'Zone statique mise à jour avec succès',
            'zone' => $zone,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $zone = ZoneStatique::findOrFail($id);
        $zone->delete();

        return response()->json([
            'message' => 'Zone statique supprimée de la base de données avec succès',
        ]);
    }
}
