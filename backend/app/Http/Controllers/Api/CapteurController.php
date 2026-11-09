<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Capteur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CapteurController extends Controller
{
    public function index(): JsonResponse
    {
        $capteurs = Capteur::with('drone')->latest()->get();
        return response()->json($capteurs);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'drone_id' => 'required|exists:drones,id',
            'nom' => 'required|string|max:100',
            'type_capteur' => 'required|string|max:50',
            'unite_mesure' => 'nullable|string|max:20',
            'derniere_valeur' => 'nullable|numeric',
            'frequence_echantillonnage_hz' => 'nullable|integer|min:1',
            'statut' => 'nullable|string|in:actif,inactif,en_erreur,etalonnage',
        ], [
            'drone_id.required' => 'Le drone associé est obligatoire.',
            'nom.required' => 'Le nom du capteur est obligatoire.',
            'type_capteur.required' => 'Le type de capteur est obligatoire.',
        ]);

        if (empty($validated['statut'])) {
            $validated['statut'] = 'actif';
        }

        $capteur = Capteur::create($validated);

        return response()->json([
            'message' => 'Capteur ajouté avec succès',
            'capteur' => $capteur->load('drone'),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $capteur = Capteur::with('drone')->findOrFail($id);
        return response()->json($capteur);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $capteur = Capteur::findOrFail($id);

        $validated = $request->validate([
            'drone_id' => 'sometimes|required|exists:drones,id',
            'nom' => 'sometimes|required|string|max:100',
            'type_capteur' => 'sometimes|required|string|max:50',
            'unite_mesure' => 'sometimes|nullable|string|max:20',
            'derniere_valeur' => 'sometimes|nullable|numeric',
            'frequence_echantillonnage_hz' => 'sometimes|nullable|integer|min:1',
            'statut' => 'sometimes|nullable|string|in:actif,inactif,en_erreur,etalonnage',
        ]);

        $capteur->update($validated);

        return response()->json([
            'message' => 'Capteur mis à jour avec succès',
            'capteur' => $capteur->fresh('drone'),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $capteur = Capteur::findOrFail($id);
        $capteur->delete();

        return response()->json([
            'message' => 'Capteur supprimé de la base de données avec succès',
        ]);
    }
}

