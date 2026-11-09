<?php

function createWavFile(string $filePath, callable $sampleGenerator, float $durationSeconds, int $sampleRate = 22050): void
{
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $numSamples = (int) ($durationSeconds * $sampleRate);
    $data = '';

    for ($i = 0; $i < $numSamples; $i++) {
        $t = $i / $sampleRate;
        $val = $sampleGenerator($t, $durationSeconds);
        // Clamp to [-1.0, 1.0]
        $val = max(-1.0, min(1.0, $val));
        $sample = (int) ($val * 32767);
        $data .= pack('v', $sample);
    }

    $subChunk2Size = strlen($data);
    $chunkSize = 36 + $subChunk2Size;

    $header = 'RIFF' . pack('V', $chunkSize) . 'WAVE';
    $header .= 'fmt ' . pack('V', 16) . pack('v', 1) . pack('v', 1);
    $header .= pack('V', $sampleRate) . pack('V', $sampleRate * 2);
    $header .= pack('v', 2) . pack('v', 16);
    $header .= 'data' . pack('V', $subChunk2Size);

    file_put_contents($filePath, $header . $data);
}

// 1. Cri du Mange-mil (Quelea quelea) - Nuée d'oiseaux granivores : piaillements et pépiements rapides
createWavFile(__DIR__ . '/../../public/audio/animaux/mange_mil.wav', function($t) {
    // Répétition de trilles rapides
    $cycle = fmod($t, 0.22);
    if ($cycle > 0.18) return 0.0;
    $freq = 2400 + 900 * sin(2 * M_PI * 18 * $cycle) + 400 * sin(2 * M_PI * 45 * $cycle);
    $envelope = sin(M_PI * ($cycle / 0.18));
    return $envelope * 0.7 * sin(2 * M_PI * $freq * $t);
}, 3.5);

// 2. Cri de l'Aulacode (Agouti / Rongeur) - Couinement & grognement d'alerte
createWavFile(__DIR__ . '/../../public/audio/animaux/aulacode.wav', function($t) {
    $cycle = fmod($t, 0.45);
    if ($cycle > 0.35) return 0.0;
    $freq = 650 + 250 * exp(-$cycle * 8);
    $envelope = sin(M_PI * ($cycle / 0.35));
    $noise = ((rand(0, 1000) / 500) - 1.0) * 0.15;
    return $envelope * (0.6 * sin(2 * M_PI * $freq * $t) + $noise);
}, 3.0);

// 3. Cri du Babouin olive (Primate) - Aboiement d'alerte grave "Wahoo"
createWavFile(__DIR__ . '/../../public/audio/animaux/babouin.wav', function($t) {
    $cycle = fmod($t, 0.8);
    if ($cycle > 0.5) return 0.0;
    $freq = 320 + 120 * sin(M_PI * ($cycle / 0.5));
    $envelope = sin(M_PI * ($cycle / 0.5));
    return $envelope * 0.8 * (sin(2 * M_PI * $freq * $t) + 0.5 * sin(2 * M_PI * $freq * 2 * $t));
}, 3.2);

// 4. Cri du Calao à joues brunes - Coassement nasal caverneux
createWavFile(__DIR__ . '/../../public/audio/animaux/calao.wav', function($t) {
    $cycle = fmod($t, 0.6);
    if ($cycle > 0.4) return 0.0;
    $freq = 480 + 80 * sin(2 * M_PI * 5 * $cycle);
    $envelope = sin(M_PI * ($cycle / 0.4));
    return $envelope * 0.7 * (sin(2 * M_PI * $freq * $t) + 0.4 * sin(2 * M_PI * ($freq * 1.5) * $t));
}, 3.0);

// 5. Chauve-souris / Roussette paillée - Clics d'écholocation haute fréquence
createWavFile(__DIR__ . '/../../public/audio/animaux/chauve_souris.wav', function($t) {
    $cycle = fmod($t, 0.08);
    if ($cycle > 0.02) return 0.0;
    $freq = 7500 + 4000 * (1 - $cycle / 0.02);
    $envelope = sin(M_PI * ($cycle / 0.02));
    return $envelope * 0.6 * sin(2 * M_PI * $freq * $t);
}, 2.5);

// =================== SONS RÉPULSIFS ===================

// 6. Cri territorial du Faucon pèlerin (Prédateur aviaire) - "Kee-kee-kee-arrr" perçant
createWavFile(__DIR__ . '/../../public/audio/repulsifs/faucon_pelerin_cri.wav', function($t) {
    $cycle = fmod($t, 0.5);
    $freq = 2800 - 1400 * ($cycle / 0.5);
    $envelope = exp(-$cycle * 3.5);
    $vibrato = sin(2 * M_PI * 25 * $t);
    return $envelope * 0.85 * (sin(2 * M_PI * ($freq + 150 * $vibrato) * $t) + 0.3 * sin(2 * M_PI * $freq * 2 * $t));
}, 4.0);

// 7. Cri d'attaque de l'Aigle huppé - Glissando prédateur perçant
createWavFile(__DIR__ . '/../../public/audio/repulsifs/aigle_huppe_attaque.wav', function($t) {
    $cycle = fmod($t, 1.2);
    $freq = 3200 - 1800 * ($cycle / 1.2);
    $envelope = sin(M_PI * ($cycle / 1.2));
    return $envelope * 0.85 * (sin(2 * M_PI * $freq * $t) + 0.4 * sin(2 * M_PI * ($freq * 1.8) * $t));
}, 4.5);

// 8. Détonation sonore canon effaroucheur - Déflagration puissante / Boom acoustique
createWavFile(__DIR__ . '/../../public/audio/repulsifs/detonation_canon.wav', function($t) {
    $cycle = fmod($t, 1.5);
    if ($cycle > 1.2) return 0.0;
    $decay = exp(-$cycle * 6);
    $bass = sin(2 * M_PI * (75 * exp(-$cycle * 5)) * $t);
    $noise = ((rand(0, 1000) / 500) - 1.0) * exp(-$cycle * 15);
    return ($bass * 0.7 + $noise * 0.8) * $decay;
}, 3.0);
// Copie pour chemin .mp3 attendu dans FauneEtSonSeeder
copy(__DIR__ . '/../../public/audio/repulsifs/detonation_canon.wav', __DIR__ . '/../../public/audio/repulsifs/detonation_canon.mp3');

// 9. Balayage ultrasonique anti-rongeurs (Audible deterrent sweep)
createWavFile(__DIR__ . '/../../public/audio/repulsifs/ultrason_rongeurs_25khz.wav', function($t) {
    // Balayage modulé rapide 4000 Hz - 9000 Hz (reprenant le spectre de dérangement acoustique rongeurs)
    $freq = 4500 + 3500 * sin(2 * M_PI * 12 * $t);
    $pulse = sin(2 * M_PI * 8 * $t) > 0 ? 1.0 : 0.2;
    return $pulse * 0.5 * sin(2 * M_PI * $freq * $t);
}, 3.5);

// 10. Sirène d'alerte modulée dissuasive
createWavFile(__DIR__ . '/../../public/audio/repulsifs/sirene_alerte_agro.wav', function($t) {
    $freq = 900 + 500 * sin(2 * M_PI * 2 * $t);
    return 0.7 * sin(2 * M_PI * $freq * $t);
}, 4.0);
copy(__DIR__ . '/../../public/audio/repulsifs/sirene_alerte_agro.wav', __DIR__ . '/../../public/audio/repulsifs/sirene_alerte_agro.mp3');

echo "Tous les fichiers audio WAV ont été générés avec succès !\n";

