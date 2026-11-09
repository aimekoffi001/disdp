<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Son;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SonController extends Controller
{
    public function index(): JsonResponse
    {
        $sons = Son::with(['drone', 'mission'])->latest('date_enregistrement')->get();
        return response()->json($sons);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titre' => 'required|string|max:150',
            'chemin_fichier' => 'required|string|max:255',
            'mission_id' => 'nullable|exists:missions,id',
            'drone_id' => 'nullable|exists:drones,id',
            'type_son' => 'nullable|string|max:50',
            'frequence_hz' => 'nullable|integer',
            'decibels' => 'nullable|numeric',
            'duree_secondes' => 'nullable|integer|min:0',
            'taille_octets' => 'nullable|integer|min:0',
            'actif' => 'nullable|boolean',
            'date_enregistrement' => 'nullable|date',
        ], [
            'titre.required' => 'Le titre du son est obligatoire.',
            'chemin_fichier.required' => 'Le chemin du fichier est obligatoire.',
        ]);

        if (empty($validated['date_enregistrement'])) {
            $validated['date_enregistrement'] = now();
        }
        if (!isset($validated['actif'])) {
            $validated['actif'] = true;
        }

        $son = Son::create($validated);

        return response()->json([
            'message' => 'Enregistrement sonore ajouté avec succès',
            'son' => $son->load(['drone', 'mission']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $son = Son::with(['drone', 'mission'])->findOrFail($id);
        return response()->json($son);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $son = Son::findOrFail($id);

        $validated = $request->validate([
            'titre' => 'sometimes|required|string|max:150',
            'chemin_fichier' => 'sometimes|required|string|max:255',
            'mission_id' => 'sometimes|nullable|exists:missions,id',
            'drone_id' => 'sometimes|nullable|exists:drones,id',
            'type_son' => 'sometimes|nullable|string|max:50',
            'frequence_hz' => 'sometimes|nullable|integer',
            'decibels' => 'sometimes|nullable|numeric',
            'duree_secondes' => 'sometimes|nullable|integer|min:0',
            'taille_octets' => 'sometimes|nullable|integer|min:0',
            'actif' => 'sometimes|nullable|boolean',
            'date_enregistrement' => 'sometimes|nullable|date',
        ]);

        $son->update($validated);

        return response()->json([
            'message' => 'Enregistrement sonore mis à jour avec succès',
            'son' => $son->fresh(['drone', 'mission']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $son = Son::findOrFail($id);
        $son->delete();

        return response()->json([
            'message' => 'Enregistrement sonore supprimé de la base de données avec succès',
        ]);
    }
}

