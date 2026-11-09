<?php

function createWav(string $filePath, callable $generator, float $duration, int $rate = 22050): void
{
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $numSamples = (int) ($duration * $rate);
    $data = '';

    for ($i = 0; $i < $numSamples; $i++) {
        $t = $i / $rate;
        $val = max(-1.0, min(1.0, $generator($t, $duration)));
        $sample = (int) ($val * 32767);
        $data .= pack('v', $sample);
    }

    $subChunk2 = strlen($data);
    $header = 'RIFF' . pack('V', 36 + $subChunk2) . 'WAVE';
    $header .= 'fmt ' . pack('V', 16) . pack('v', 1) . pack('v', 1);
    $header .= pack('V', $rate) . pack('V', $rate * 2) . pack('v', 2) . pack('v', 16);
    $header .= 'data' . pack('V', $subChunk2);

    file_put_contents($filePath, $header . $data);
}

// Bruit de démarrage moteurs drone brushless + décollage
createWav(__DIR__ . '/../../public/audio/drone/drone_motor_startup.wav', function($t, $duration) {
    // 0 à 1.0s : Bips d'armement ESC (bip-bip-bip)
    if ($t < 0.8) {
        $beepCycle = fmod($t, 0.25);
        if ($beepCycle < 0.12) {
            return 0.4 * sin(2 * M_PI * 1400 * $t);
        }
        return 0.0;
    }

    // 0.8 à 3.5s : Montée en régime des 4 moteurs brushless quadcopter
    $spinTime = $t - 0.8;
    $progress = min(1.0, $spinTime / 1.8);
    $baseFreq = 120 + 340 * ($progress * $progress); // 120Hz -> 460Hz

    // 4 moteurs avec léger décalage de phase et harmonique de pale
    $m1 = sin(2 * M_PI * $baseFreq * $t);
    $m2 = sin(2 * M_PI * ($baseFreq * 1.02) * $t);
    $m3 = sin(2 * M_PI * ($baseFreq * 0.98) * $t);
    $m4 = sin(2 * M_PI * ($baseFreq * 1.01) * $t);
    $droneWhine = ($m1 + $m2 + $m3 + $m4) / 4.0;

    // Bruit de souffle des hélices (hiss)
    $noise = ((rand(0, 1000) / 500) - 1.0) * (0.2 + 0.3 * $progress);

    $volume = min(1.0, $spinTime / 0.5);
    return $volume * (0.65 * $droneWhine + $noise);
}, 3.5);

echo "Son de démarrage drone généré avec succès !\n";

