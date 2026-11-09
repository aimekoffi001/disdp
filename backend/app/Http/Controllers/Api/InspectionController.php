<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InspectionController extends Controller
{
    public function index(): JsonResponse
    {
        $inspections = Inspection::with(['drone', 'utilisateur'])->latest('date_inspection')->get();
        return response()->json($inspections);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'drone_id' => 'required|exists:drones,id',
            'code_inspection' => 'nullable|string|max:50|unique:inspections,code_inspection',
            'utilisateur_id' => 'nullable|exists:utilisateurs,id',
            'type_inspection' => 'nullable|string|max:50',
            'date_inspection' => 'nullable|date',
            'etat_helices' => 'nullable|string|max:50',
            'etat_moteurs' => 'nullable|string|max:50',
            'etat_batterie' => 'nullable|string|max:50',
            'etat_capteurs' => 'nullable|string|max:50',
            'etat_cameras' => 'nullable|string|max:50',
            'etat_chassis' => 'nullable|string|max:50',
            'resultat_global' => 'required|string|in:apte_au_vol,maintenance_requise,cloue_au_sol',
            'commentaires' => 'nullable|string',
        ], [
            'drone_id.required' => 'Le drone inspecté est obligatoire.',
            'drone_id.exists' => "Le drone sélectionné n'existe pas.",
            'resultat_global.required' => "Le résultat global de l'inspection est obligatoire.",
            'resultat_global.in' => 'Résultat invalide (apte_au_vol, maintenance_requise, cloue_au_sol).',
        ]);

        if (empty($validated['code_inspection'])) {
            $validated['code_inspection'] = 'INSP-' . date('Y') . '-' . strtoupper(Str::random(4));
        }
        if (empty($validated['date_inspection'])) {
            $validated['date_inspection'] = now();
        }

        $inspection = Inspection::create($validated);

        return response()->json([
            'message' => 'Inspection enregistrée avec succès',
            'inspection' => $inspection->load(['drone', 'utilisateur']),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $inspection = Inspection::with(['drone', 'utilisateur'])->findOrFail($id);
        return response()->json($inspection);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $inspection = Inspection::findOrFail($id);

        $validated = $request->validate([
            'drone_id' => 'sometimes|required|exists:drones,id',
            'code_inspection' => 'sometimes|nullable|string|max:50|unique:inspections,code_inspection,' . $inspection->id,
            'utilisateur_id' => 'sometimes|nullable|exists:utilisateurs,id',
            'type_inspection' => 'sometimes|nullable|string|max:50',
            'date_inspection' => 'sometimes|nullable|date',
            'etat_helices' => 'sometimes|nullable|string|max:50',
            'etat_moteurs' => 'sometimes|nullable|string|max:50',
            'etat_batterie' => 'sometimes|nullable|string|max:50',
            'etat_capteurs' => 'sometimes|nullable|string|max:50',
            'etat_cameras' => 'sometimes|nullable|string|max:50',
            'etat_chassis' => 'sometimes|nullable|string|max:50',
            'resultat_global' => 'sometimes|required|string|in:apte_au_vol,maintenance_requise,cloue_au_sol',
            'commentaires' => 'sometimes|nullable|string',
        ]);

        $inspection->update($validated);

        return response()->json([
            'message' => 'Inspection mise à jour avec succès',
            'inspection' => $inspection->fresh(['drone', 'utilisateur']),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $inspection = Inspection::findOrFail($id);
        $inspection->delete();

        return response()->json([
            'message' => 'Inspection supprimée de la base de données avec succès',
        ]);
    }
}

