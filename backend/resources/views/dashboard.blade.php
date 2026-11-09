<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DISDP — Supervision & Effarouchement Acoustique Faune · FabLab UVCI</title>
    
    <!-- Polices modernes & Leaflet Map CSS -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

    <style>
        :root {
            --bg-body: #070b14;
            --bg-sidebar: #0b1120;
            --bg-header: #0b1120;
            --bg-card: #0f172a;
            --bg-card-hover: #162036;
            --border-subtle: #1e293b;
            --border-highlight: #334155;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --text-dim: #64748b;
            --primary: #38bdf8;
            --primary-glow: rgba(56, 189, 248, 0.25);
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --indigo: #6366f1;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            background-color: var(--bg-body);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            overflow-x: hidden;
        }

        /* ---------------- Sidebar ---------------- */
        aside.sidebar {
            width: 250px;
            background: var(--bg-sidebar);
            border-right: 1px solid var(--border-subtle);
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 0;
            height: 100vh;
            flex-shrink: 0;
            z-index: 50;
        }

        .sidebar-brand {
            padding: 20px 18px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid var(--border-subtle);
        }

        .brand-icon {
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #0284c7, #38bdf8);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px var(--primary-glow);
        }

        .brand-text h1 {
            font-size: 1.05rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            background: linear-gradient(to right, #ffffff, #93c5fd);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .brand-text p {
            font-size: 0.68rem;
            color: var(--text-dim);
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.05em;
        }

        .sidebar-nav {
            padding: 16px 10px;
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .nav-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 14px;
            border-radius: 8px;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.88rem;
            font-weight: 500;
            transition: all 0.15s ease;
        }

        .nav-link:hover {
            color: var(--text-main);
            background: rgba(255, 255, 255, 0.04);
        }

        .nav-link.active {
            color: var(--primary);
            background: rgba(56, 189, 248, 0.08);
            font-weight: 600;
        }

        .nav-badge {
            margin-left: auto;
            background: rgba(239, 68, 68, 0.2);
            color: var(--danger);
            font-size: 0.72rem;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 9999px;
            border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .sidebar-footer {
            padding: 16px;
            border-top: 1px solid var(--border-subtle);
            font-size: 0.75rem;
            color: var(--text-dim);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .system-status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--success);
            box-shadow: 0 0 8px var(--success);
            margin-right: 6px;
        }

        /* ---------------- Main Layout ---------------- */
        .main-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            background-color: var(--bg-body);
        }

        /* Top Bar Header */
        header.topbar {
            height: 64px;
            background: var(--bg-header);
            border-bottom: 1px solid var(--border-subtle);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            position: sticky;
            top: 0;
            z-index: 40;
        }

        .search-container {
            position: relative;
            width: 360px;
        }

        .search-input {
            width: 100%;
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid var(--border-highlight);
            border-radius: 8px;
            padding: 8px 12px 8px 36px;
            color: var(--text-main);
            font-size: 0.85rem;
            outline: none;
            transition: border-color 0.15s ease;
        }

        .search-input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px var(--primary-glow);
        }

        .search-icon {
            position: absolute;
            left: 11px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-dim);
            pointer-events: none;
        }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .date-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.82rem;
            color: var(--text-muted);
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-subtle);
            padding: 6px 12px;
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
        }

        .user-profile {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 4px 10px 4px 6px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-subtle);
            border-radius: 20px;
        }

        .user-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #10b981, #059669);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.85rem;
            color: #ffffff;
        }

        .user-info {
            line-height: 1.2;
        }

        .user-name {
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--text-main);
        }

        .user-role {
            font-size: 0.70rem;
            color: var(--text-dim);
        }

        /* ---------------- Dashboard Content ---------------- */
        main.dashboard-content {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow-y: auto;
        }

        /* Alert Flash Notification */
        .alert-flash {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.4);
            color: #a7f3d0;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 0.88rem;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: fadeIn 0.3s ease;
        }

        /* ---------------- Operations Control & Simulation Bar ---------------- */
        .ops-control-panel {
            background: linear-gradient(180deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
            border: 1px solid var(--border-highlight);
            border-radius: 12px;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 14px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .ops-panel-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .ops-badge-drone {
            background: rgba(56, 189, 248, 0.12);
            border: 1px solid rgba(56, 189, 248, 0.3);
            color: var(--primary);
            padding: 6px 12px;
            border-radius: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .ops-buttons-group {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }

        .btn-ops {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 12px;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            text-decoration: none;
            transition: all 0.15s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .btn-ops:hover {
            transform: translateY(-1px);
        }

        .btn-ops-success {
            background: linear-gradient(135deg, #059669, #10b981);
            color: #ffffff;
        }

        .btn-ops-warning {
            background: linear-gradient(135deg, #d97706, #f59e0b);
            color: #ffffff;
        }

        .btn-ops-danger {
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: #ffffff;
        }

        .btn-ops-primary {
            background: linear-gradient(135deg, #0284c7, #38bdf8);
            color: #ffffff;
        }

        .btn-ops-secondary {
            background: #1e293b;
            color: #e2e8f0;
            border: 1px solid var(--border-highlight);
        }

        .btn-ops-launch-flight {
            background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
            color: #ffffff;
            border: 1px solid #34d399;
            padding: 9px 20px;
            border-radius: 8px;
            font-size: 0.84rem;
            font-weight: 800;
            letter-spacing: 0.03em;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 0 18px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255,255,255,0.3);
            transition: all 0.2s ease;
            text-transform: uppercase;
        }

        .btn-ops-launch-flight:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 0 28px rgba(16, 185, 129, 0.8);
        }

        .btn-ops-land-flight {
            background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
            color: #ffffff;
            border: 1px solid #f59e0b;
            padding: 9px 18px;
            border-radius: 8px;
            font-size: 0.82rem;
            font-weight: 800;
            letter-spacing: 0.03em;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 0 16px rgba(245, 158, 11, 0.45);
            transition: all 0.2s ease;
            text-transform: uppercase;
        }

        .btn-ops-land-flight:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 26px rgba(245, 158, 11, 0.7);
        }

        .select-quick-species {
            background: #1e293b;
            color: var(--text-main);
            border: 1px solid var(--border-highlight);
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.76rem;
            outline: none;
        }

        /* ---------------- Audio Floating Waveform Player ---------------- */
        .audio-player-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid var(--primary);
            box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 20px var(--primary-glow);
            border-radius: 12px;
            padding: 12px 18px;
            display: none;
            align-items: center;
            gap: 16px;
            z-index: 999;
            animation: slideUp 0.3s ease;
        }

        .audio-player-toast.playing {
            display: flex;
        }

        .audio-wave-anim {
            display: flex;
            align-items: center;
            gap: 3px;
            height: 22px;
        }

        .wave-bar {
            width: 3px;
            background: var(--primary);
            border-radius: 2px;
            animation: waveMotion 1s infinite ease-in-out;
        }

        .wave-bar:nth-child(1) { height: 6px; animation-delay: 0.1s; }
        .wave-bar:nth-child(2) { height: 16px; animation-delay: 0.2s; }
        .wave-bar:nth-child(3) { height: 22px; animation-delay: 0.3s; }
        .wave-bar:nth-child(4) { height: 12px; animation-delay: 0.4s; }
        .wave-bar:nth-child(5) { height: 8px; animation-delay: 0.5s; }

        @keyframes waveMotion {
            0%, 100% { transform: scaleY(0.3); }
            50% { transform: scaleY(1.0); }
        }

        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .btn-stop-audio {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.4);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.72rem;
            font-weight: 700;
            cursor: pointer;
        }

        /* ---------------- Modal HUD Décollage & Télémétrie Live ---------------- */
        .takeoff-hud-modal {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(2, 6, 23, 0.88);
            backdrop-filter: blur(10px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .takeoff-hud-modal.active {
            display: flex;
        }

        .takeoff-hud-card {
            background: #0f172a;
            border: 1px solid rgba(56, 189, 248, 0.4);
            box-shadow: 0 0 40px rgba(56, 189, 248, 0.25), 0 20px 50px rgba(0, 0, 0, 0.8);
            border-radius: 16px;
            width: 90%;
            max-width: 580px;
            padding: 24px;
            animation: fadeIn 0.25s ease;
        }

        .takeoff-hud-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        .takeoff-timer {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            color: var(--primary);
            background: rgba(56, 189, 248, 0.12);
            border: 1px solid rgba(56, 189, 248, 0.3);
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 700;
        }

        .pulse-ring {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 12px #10b981;
            animation: pulse 1s infinite;
        }

        .takeoff-progress-bar-wrap {
            height: 8px;
            background: #1e293b;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 20px;
        }

        .takeoff-progress-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #38bdf8, #10b981);
            border-radius: 4px;
            transition: width 0.15s ease;
        }

        .takeoff-steps {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border-subtle);
            padding: 14px;
            border-radius: 10px;
        }

        .takeoff-step {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.82rem;
            color: var(--text-muted);
            transition: all 0.2s ease;
        }

        .takeoff-step.active {
            color: #38bdf8;
            font-weight: 700;
        }

        .takeoff-step.done {
            color: #10b981;
            font-weight: 600;
        }

        .takeoff-step .step-check {
            width: 18px;
            text-align: center;
            font-family: 'JetBrains Mono';
        }

        .takeoff-metrics-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }

        .t-metric-box {
            background: #1e293b;
            border: 1px solid var(--border-highlight);
            border-radius: 8px;
            padding: 10px;
            text-align: center;
        }

        .t-metric-box small {
            display: block;
            font-size: 0.68rem;
            color: var(--text-dim);
            margin-bottom: 4px;
            text-transform: uppercase;
        }

        .t-metric-box strong {
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.05rem;
            color: #ffffff;
        }

        .badge-live-pulse {
            font-size: 0.65rem;
            font-family: 'JetBrains Mono';
            font-weight: 800;
            color: #10b981;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.35);
            padding: 2px 6px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            animation: pulse 1.5s infinite;
        }

        /* ---------------- KPI Row (Matching Mockup) ---------------- */
        .kpi-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
        }

        .kpi-card {
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            padding: 18px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            overflow: hidden;
            transition: all 0.2s ease;
        }

        .kpi-card:hover {
            border-color: var(--border-highlight);
            transform: translateY(-2px);
            background: var(--bg-card-hover);
        }

        .kpi-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
        }

        .kpi-battery::before { background: var(--success); }
        .kpi-distance::before { background: var(--primary); }
        .kpi-speed::before { background: var(--warning); }
        .kpi-range::before { background: #f43f5e; }

        .kpi-label {
            font-size: 0.78rem;
            color: var(--text-muted);
            font-weight: 500;
            margin-bottom: 6px;
        }

        .kpi-value-row {
            display: flex;
            align-items: baseline;
            gap: 8px;
        }

        .kpi-value {
            font-size: 1.85rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            color: var(--text-main);
            font-family: 'JetBrains Mono', monospace;
        }

        .pill-sub {
            font-size: 0.72rem;
            color: var(--text-dim);
        }

        .kpi-bar {
            margin-top: 10px;
            height: 4px;
            background: #1e293b;
            border-radius: 2px;
            overflow: hidden;
            width: 140px;
        }

        .kpi-bar-fill {
            height: 100%;
            border-radius: 2px;
        }

        .kpi-icon-wrap {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-subtle);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* ---------------- Center Grid: Video & Telemetry ---------------- */
        .center-grid {
            display: grid;
            grid-template-columns: 2.1fr 1fr;
            gap: 20px;
        }

        /* Live Video Card */
        .video-card {
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .card-header {
            padding: 14px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border-subtle);
        }

        .card-title {
            font-size: 0.92rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-main);
        }

        .video-viewport {
            position: relative;
            width: 100%;
            height: 390px;
            background: #020617;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .video-bg {
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: contrast(1.1) brightness(0.9);
        }

        /* HUD Crosshair */
        .hud-crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120px;
            height: 120px;
            pointer-events: none;
            opacity: 0.85;
        }

        .video-overlay-top {
            position: absolute;
            top: 12px;
            left: 14px;
            right: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            pointer-events: none;
        }

        .live-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(239, 68, 68, 0.85);
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.05em;
        }

        .live-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: white;
            animation: pulse 1.2s infinite;
        }

        .resolution-badge {
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.72rem;
            color: #cbd5e1;
        }

        /* AI Detection Bounding Box Overlay */
        .ai-detection-box {
            position: absolute;
            top: 26%;
            left: 36%;
            width: 140px;
            height: 105px;
            border: 2px solid #ef4444;
            background: rgba(239, 68, 68, 0.12);
            border-radius: 4px;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
            pointer-events: none;
            animation: pulseBox 2s infinite ease-in-out;
        }

        .ai-tag {
            position: absolute;
            top: -22px;
            left: -2px;
            background: #ef4444;
            color: #ffffff;
            font-size: 0.68rem;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 3px;
            white-space: nowrap;
            letter-spacing: 0.03em;
        }

        @keyframes pulseBox {
            0%, 100% { border-color: #ef4444; box-shadow: 0 0 12px rgba(239, 68, 68, 0.5); }
            50% { border-color: #f59e0b; box-shadow: 0 0 22px rgba(245, 158, 11, 0.7); }
        }

        /* Active Detection Ribbon directly in Video Overlay */
        .active-detection-ribbon {
            position: absolute;
            top: 50px;
            left: 14px;
            right: 14px;
            background: rgba(15, 23, 42, 0.88);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(239, 68, 68, 0.4);
            border-radius: 8px;
            padding: 8px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            z-index: 10;
            animation: fadeIn 0.3s ease;
        }

        .ribbon-info {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.80rem;
        }

        .ribbon-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .video-overlay-bottom {
            position: absolute;
            bottom: 12px;
            left: 14px;
            right: 14px;
            display: flex;
            gap: 16px;
            pointer-events: none;
        }

        .osd-metric {
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(6px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.74rem;
            font-family: 'JetBrains Mono', monospace;
            display: flex;
            align-items: center;
            gap: 6px;
            color: #cbd5e1;
        }

        .osd-metric strong {
            color: var(--primary);
        }

        /* Command Bar below Video */
        .video-control-bar {
            padding: 12px 16px;
            background: rgba(15, 23, 42, 0.85);
            border-top: 1px solid var(--border-subtle);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
        }

        .form-inline {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            flex-wrap: wrap;
        }

        .select-sound {
            flex: 1;
            min-width: 180px;
            background: #1e293b;
            border: 1px solid var(--border-highlight);
            color: var(--text-main);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.82rem;
            outline: none;
        }

        .volume-control-wrap {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #1e293b;
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid var(--border-subtle);
        }

        .volume-slider {
            width: 70px;
            accent-color: var(--warning);
            cursor: pointer;
        }

        .btn-fire-sound {
            background: linear-gradient(135deg, #d97706, #ef4444);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.82rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
            transition: all 0.15s ease;
        }

        .btn-fire-sound:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 14px rgba(239, 68, 68, 0.5);
        }

        .btn-listen-sound {
            background: #1e293b;
            color: #38bdf8;
            border: 1px solid var(--border-highlight);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
        }
        .btn-listen-sound:hover {
            background: #334155;
            color: #ffffff;
        }

        /* ---------------- Telemetry & Sensors Right Column ---------------- */
        .telemetry-column {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .card-box {
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            padding: 16px;
        }

        /* Battery Gauge Box */
        .battery-box {
            display: flex;
            align-items: center;
            gap: 18px;
        }

        .gauge-svg-wrap {
            position: relative;
            width: 105px;
            height: 105px;
            flex-shrink: 0;
        }

        .gauge-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }

        .gauge-percent {
            font-size: 1.45rem;
            font-weight: 800;
            font-family: 'JetBrains Mono', monospace;
            display: block;
            color: var(--text-main);
        }

        .gauge-sub {
            font-size: 0.65rem;
            color: var(--text-dim);
            text-transform: uppercase;
            font-weight: 600;
        }

        .battery-details {
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
        }

        .b-detail-item {
            display: flex;
            justify-content: space-between;
            font-size: 0.78rem;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
            padding-bottom: 3px;
        }

        .b-detail-item small {
            color: var(--text-dim);
        }

        .b-detail-item strong {
            font-family: 'JetBrains Mono', monospace;
            color: #cbd5e1;
        }

        /* Motors Grid */
        .motors-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 10px;
        }

        .motor-chip {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border-highlight);
            padding: 8px 10px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.75rem;
        }

        .motor-chip span {
            color: var(--text-muted);
            font-weight: 500;
        }

        .motor-chip strong {
            font-family: 'JetBrains Mono', monospace;
            color: var(--primary);
            font-size: 0.85rem;
        }

        /* Sensors Grid */
        .sensors-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-top: 10px;
        }

        .sensor-item {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border-highlight);
            border-radius: 6px;
            padding: 8px 6px;
            text-align: center;
        }

        .sensor-item small {
            display: block;
            font-size: 0.65rem;
            color: var(--text-dim);
            margin-bottom: 2px;
        }

        .sensor-item strong {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.82rem;
            color: var(--text-main);
        }

        /* ---------------- Flight Data Strip ---------------- */
        .flight-strip {
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            padding: 12px 20px;
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 12px;
        }

        .flight-stat {
            display: flex;
            align-items: center;
            gap: 10px;
            border-right: 1px solid var(--border-subtle);
            padding-right: 10px;
        }

        .flight-stat:last-child {
            border-right: none;
        }

        .flight-stat-icon {
            color: var(--primary);
            opacity: 0.9;
        }

        .flight-stat-info small {
            display: block;
            font-size: 0.70rem;
            color: var(--text-dim);
            text-transform: uppercase;
            font-weight: 600;
        }

        .flight-stat-info strong {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.95rem;
            color: var(--text-main);
        }

        /* ---------------- LABORATOIRE BIO-ACOUSTIQUE ---------------- */
        .acoustic-lab-card {
            background: linear-gradient(180deg, #0f172a, #0b1329);
            border: 1px solid #1e3a5f;
            border-radius: 12px;
            padding: 18px 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .lab-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            border-bottom: 1px solid var(--border-subtle);
            padding-bottom: 12px;
        }

        .lab-title {
            font-size: 0.95rem;
            font-weight: 800;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .species-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 14px;
        }

        .species-card {
            background: rgba(15, 23, 42, 0.7);
            border: 1px solid var(--border-subtle);
            border-radius: 10px;
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            transition: all 0.2s ease;
        }

        .species-card:hover {
            border-color: var(--primary);
            background: rgba(15, 23, 42, 0.95);
            transform: translateY(-2px);
        }

        .species-card.active-target {
            border: 2px solid #ef4444;
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.25);
        }

        .species-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .species-name {
            font-size: 0.88rem;
            font-weight: 700;
            color: #ffffff;
        }

        .species-cat {
            font-size: 0.68rem;
            text-transform: uppercase;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba(56, 189, 248, 0.15);
            color: #38bdf8;
        }

        .species-desc {
            font-size: 0.74rem;
            color: var(--text-dim);
            line-height: 1.3;
        }

        .repellents-tags {
            display: flex;
            flex-direction: column;
            gap: 4px;
            background: rgba(0, 0, 0, 0.25);
            padding: 8px;
            border-radius: 6px;
            border: 1px dashed rgba(255, 255, 255, 0.08);
        }

        .repellent-badge {
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.72rem;
            color: #fbbf24;
            font-weight: 600;
        }

        .species-actions-row {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: auto;
            flex-wrap: wrap;
        }

        .btn-animal-listen {
            background: #1e293b;
            color: #38bdf8;
            border: 1px solid var(--border-highlight);
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.72rem;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.15s ease;
        }

        .btn-animal-listen:hover {
            background: #0284c7;
            color: #ffffff;
        }

        .btn-repel-trigger {
            background: linear-gradient(135deg, #d97706, #ef4444);
            color: #ffffff;
            border: none;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.72rem;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.15s ease;
        }

        .btn-repel-trigger:hover {
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
            transform: scale(1.02);
        }

        /* ---------------- Bottom Multi-Grid ---------------- */
        .bottom-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .table-card {
            background: var(--bg-card);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .table-responsive {
            overflow-x: auto;
            max-height: 290px;
        }

        table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.80rem;
            text-align: left;
        }

        table.data-table th {
            background: rgba(15, 23, 42, 0.9);
            color: var(--text-dim);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.68rem;
            letter-spacing: 0.05em;
            padding: 10px 14px;
            border-bottom: 1px solid var(--border-subtle);
            position: sticky;
            top: 0;
            z-index: 5;
        }

        table.data-table td {
            padding: 10px 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            color: #cbd5e1;
            vertical-align: middle;
        }

        table.data-table tr:hover {
            background: rgba(255, 255, 255, 0.02);
        }

        table.data-table tr.selected {
            background: rgba(56, 189, 248, 0.08);
            border-left: 3px solid var(--primary);
        }

        .status-pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.70rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        .status-en_vol { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .status-disponible { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
        .status-en_retour_base { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .status-en_maintenance { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .status-hors_ligne { background: rgba(100, 116, 139, 0.15); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.3); }

        .gravite-critique { color: #f87171; font-weight: 700; }
        .gravite-elevee { color: #fbbf24; font-weight: 600; }
        .gravite-moyenne { color: #38bdf8; }
        .gravite-faible { color: #94a3b8; }

        .btn-table-action {
            background: #1e293b;
            color: #38bdf8;
            border: 1px solid #334155;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.72rem;
            cursor: pointer;
            transition: all 0.1s ease;
        }

        .btn-table-action:hover {
            background: #334155;
            color: #ffffff;
        }

        .btn-table-resolve {
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .btn-table-resolve:hover {
            background: #059669;
            color: #ffffff;
        }

        /* Map styling */
        .map-card-body {
            height: 290px;
            width: 100%;
            background: #020617;
        }

        /* ---------------- Modal Dialog ---------------- */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(4px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 100;
        }

        .modal-overlay.active {
            display: flex;
        }

        .modal-content {
            background: #0f172a;
            border: 1px solid var(--border-highlight);
            border-radius: 12px;
            width: 90%;
            max-width: 520px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            animation: fadeIn 0.2s ease;
        }

        .modal-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-subtle);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .form-group label {
            font-size: 0.78rem;
            font-weight: 600;
            color: var(--text-muted);
        }

        .form-control {
            background: #1e293b;
            border: 1px solid var(--border-highlight);
            color: var(--text-main);
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            outline: none;
        }

        .form-control:focus {
            border-color: var(--primary);
        }

        .modal-footer {
            padding: 14px 20px;
            border-top: 1px solid var(--border-subtle);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            background: rgba(15, 23, 42, 0.5);
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.9); }
        }
    </style>
</head>
<body>

    <!-- ---------------- Audio Player Toast Floating Notification ---------------- -->
    <div id="audioToast" class="audio-player-toast">
        <div class="audio-wave-anim">
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
            <div class="wave-bar"></div>
        </div>
        <div style="line-height:1.2;">
            <div id="audioToastTitle" style="font-size:0.80rem; font-weight:700; color:#ffffff;">Audio en lecture...</div>
            <div id="audioToastSub" style="font-size:0.68rem; color:var(--primary); font-family:'JetBrains Mono';">Signal sonore actif</div>
        </div>
        <button type="button" class="btn-stop-audio" onclick="stopAudio()">Arrêter ■</button>
    </div>

    <!-- ---------------- Sidebar ---------------- -->
    <aside class="sidebar">
        <div class="sidebar-brand">
            <div class="brand-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
            </div>
            <div class="brand-text">
                <h1>DISDP</h1>
                <p>FabLab UVCI · Agro-Drones</p>
            </div>
        </div>

        <nav class="sidebar-nav">
            <a href="{{ route('dashboard') }}" class="nav-link active">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                Tableau de bord
            </a>
            <a href="#lab-acoustique" class="nav-link" style="color:#fbbf24;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                Cris Animaux &amp; Riposte
            </a>
            <a href="#drones-table" class="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                Flotte de Drones ({{ $drones->count() }})
            </a>
            <a href="#missions-table" class="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="12 6 12 12 16 14"/></svg>
                Missions en vol
            </a>
            <a href="#map-card" class="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
                Parcelles Agricoles
            </a>
            <a href="#alertes-table" class="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                Alertes &amp; Incidents
                @if($kpi['alertes_non_resolues'] > 0)
                    <span class="nav-badge">{{ $kpi['alertes_non_resolues'] }}</span>
                @endif
            </a>
            <a href="#emissions-table" class="nav-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                Historique Dissuasion
            </a>
        </nav>

        <div class="sidebar-footer">
            <div>
                <span class="system-status-dot"></span>
                <span>Base MariaDB Connectée</span>
            </div>
            <span style="font-family:'JetBrains Mono'; font-size:0.7rem; color:var(--primary);">v2.0</span>
        </div>
    </aside>

    <!-- ---------------- Main Wrapper ---------------- -->
    <div class="main-wrapper">
        
        <!-- Header Topbar -->
        <header class="topbar">
            <!-- Search bar with Form Binding -->
            <form method="GET" action="{{ route('dashboard') }}" class="search-container">
                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" name="search" class="search-input" placeholder="Rechercher drone, code (ex: DRN-001)..." value="{{ $search ?? '' }}">
                @if(!empty($search))
                    <a href="{{ route('dashboard') }}" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); color:var(--text-dim); text-decoration:none; font-size:0.8rem;" title="Effacer la recherche">✕</a>
                @endif
            </form>

            <div class="topbar-right">
                <div class="date-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    <span>{{ now()->locale('fr')->isoFormat('dddd D MMMM YYYY · HH:mm') }}</span>
                </div>

                <!-- Bouton d'accès direct au Cockpit React v2.0 -->
                <a href="{{ route('cockpit.react') }}" target="_blank" style="display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg, #0284c7, #4f46e5); color:#ffffff; text-decoration:none; font-size:0.80rem; font-weight:700; padding:6px 14px; border-radius:20px; box-shadow:0 3px 12px rgba(2,132,199,0.35); border:1px solid rgba(255,255,255,0.2); transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
                    <span>Cockpit React v2.0</span>
                </a>

                <!-- Utilisateur unique : Admin FabLab UVCI -->
                <div class="user-profile" title="{{ $currentUser?->email ?? 'admin@fablab.ci' }}">
                    <div class="user-avatar">
                        {{ strtoupper(substr($currentUser?->prenom ?? $currentUser?->nom ?? 'A', 0, 1)) }}
                    </div>
                    <div class="user-info">
                        <div class="user-name">{{ $currentUser?->prenom ?? 'FabLab' }} {{ $currentUser?->nom ?? 'Admin' }}</div>
                        <div class="user-role">{{ ucfirst(is_object($currentUser?->role) ? ($currentUser?->role?->value ?? 'administrateur') : ($currentUser?->role ?? 'admin')) }} · {{ $currentUser?->email ?? 'admin@fablab.ci' }}</div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Content -->
        <main class="dashboard-content">

            <!-- Flash notification message -->
            @if(session('success'))
                <div class="alert-flash">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>{{ session('success') }}</span>
                </div>
            @endif

            <!-- ---------------- CENTRE D'OPÉRATIONS & ESSAI EN DIRECT ---------------- -->
            <section class="ops-control-panel">
                <div class="ops-panel-left">
                    <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-dim); letter-spacing:0.05em;">Drone Actif :</span>
                    <div class="ops-badge-drone">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
                        <span>{{ $selectedDrone->nom }} ({{ $selectedDrone->code_drone }})</span>
                        <span id="active-drone-status-pill" class="status-pill status-{{ $selectedDrone->statut->value }}" style="font-size:0.65rem; padding:2px 6px;">
                            {{ str_replace('_', ' ', $selectedDrone->statut->value) }}
                        </span>
                    </div>
                </div>

                <div class="ops-buttons-group">
                    <!-- BOUTON MAJEUR : METTRE EN MARCHE & FAIRE VOLER -->
                    <div id="flight-controls-container" style="display:inline-flex; align-items:center; gap:8px;">
                        @if($selectedDrone->statut->value !== 'en_vol')
                            <form method="POST" action="{{ route('drones.demarrer-vol', $selectedDrone->id) }}" onsubmit="playDroneTakeoff(event, this)" style="display:inline;">
                                @csrf
                                <button type="submit" id="btn-main-takeoff" class="btn-ops-launch-flight" title="Mettre en marche les 4 moteurs brushless et faire décoller le drone">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
                                    <span>METTRE EN MARCHE &amp; FAIRE VOLER</span>
                                </button>
                            </form>
                        @else
                            <form method="POST" action="{{ route('drones.atterrir', $selectedDrone->id) }}" onsubmit="playDroneLanding(event, this)" style="display:inline;">
                                @csrf
                                <button type="submit" id="btn-main-land" class="btn-ops-land-flight" title="Faire atterrir le drone immédiatement et couper les moteurs">
                                    <span>🛬 ATTERRIR &amp; COUPER MOTEURS</span>
                                </button>
                            </form>
                            <form method="POST" action="{{ route('drones.statut', $selectedDrone->id) }}" style="display:inline;">
                                @csrf
                                <input type="hidden" name="statut" value="en_retour_base">
                                <button type="submit" class="btn-ops btn-ops-warning" title="Ordonner un retour à la base (RTH)">
                                    🏠 RTH (Retour Base)
                                </button>
                            </form>
                        @endif
                    </div>

                    <!-- Bouton Simuler Télémétrie en direct -->
                    <form method="POST" action="{{ route('drones.simuler-telemetrie', $selectedDrone->id) }}" style="display:inline;">
                        @csrf
                        <button type="submit" class="btn-ops btn-ops-primary" title="Injecter un point télémétrique et capteurs">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            +1 Télémétrie &amp; Capteurs
                        </button>
                    </form>

                    <!-- Formulaire Simuler Détection IA avec Choix de l'Espèce -->
                    <form method="POST" action="{{ route('drones.simuler-detection', $selectedDrone->id) }}" style="display:inline-flex; align-items:center; gap:4px;">
                        @csrf
                        <select name="espece_id" class="select-quick-species" title="Choisir l'animal à détecter">
                            @foreach($especes as $esp)
                                <option value="{{ $esp->id }}" {{ $activeDetection && $activeDetection->espece_id === $esp->id ? 'selected' : '' }}>
                                    {{ $esp->nom_commun }}
                                </option>
                            @endforeach
                        </select>
                        <button type="submit" class="btn-ops btn-ops-warning" title="Simuler l'observation de cet animal par caméra IA">
                            ⚡ Simuler Détection
                        </button>
                    </form>

                    <!-- Bouton Alerte Test d'urgence -->
                    <form method="POST" action="{{ route('alertes.creer-test') }}" style="display:inline;">
                        @csrf
                        <input type="hidden" name="drone_id" value="{{ $selectedDrone->id }}">
                        <button type="submit" class="btn-ops btn-ops-danger" title="Créer une alerte test">
                            🚨 Alerte Test
                        </button>
                    </form>

                    <!-- Bouton Nouvelle Mission Modal -->
                    <button type="button" class="btn-ops btn-ops-secondary" onclick="openMissionModal()" title="Planifier une patrouille">
                        + Nouvelle Mission
                    </button>
                </div>
            </section>

            <!-- ---------------- KPI Cards ---------------- -->
            <section class="kpi-row">
                <!-- Battery Card -->
                <div class="kpi-card kpi-battery">
                    <div>
                        <div class="kpi-label">Batterie ({{ $selectedDrone->code_drone }})</div>
                        <div class="kpi-value-row">
                            <span class="kpi-value" id="live-kpi-battery">{{ round($selectedDrone->niveau_batterie) }}%</span>
                            <span class="pill-sub" id="live-kpi-battery-status">({{ $selectedDrone->statut->value === 'en_vol' ? 'en vol' : 'parc' }})</span>
                        </div>
                        <div class="kpi-bar">
                            <div class="kpi-bar-fill" id="live-kpi-battery-bar" style="width: {{ $selectedDrone->niveau_batterie }}%; background: {{ $selectedDrone->niveau_batterie < 20 ? '#ef4444' : '#10b981' }};"></div>
                        </div>
                    </div>
                    <div class="kpi-icon-wrap" style="color: var(--success);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/></svg>
                    </div>
                </div>

                <!-- Speed Card (Vitesse Temps Réel) -->
                <div class="kpi-card kpi-speed">
                    <div>
                        <div class="kpi-label" style="display:flex; align-items:center; justify-content:space-between;">
                            <span>Vitesse en Temps Réel</span>
                            <span id="live-speed-pulse" class="badge-live-pulse" style="display: {{ $selectedDrone->statut->value === 'en_vol' ? 'inline-flex' : 'none' }};">● LIVE</span>
                        </div>
                        <div class="kpi-value-row">
                            <span class="kpi-value" id="live-kpi-speed-ms">{{ $selectedDrone->statut->value === 'en_vol' ? number_format($latestTelemetry->vitesse ?? 8.5, 1) : '0.0' }} m/s</span>
                            <span class="pill-sub" id="live-kpi-speed-kmh">({{ $selectedDrone->statut->value === 'en_vol' ? round(($latestTelemetry->vitesse ?? 8.5) * 3.6) : 0 }} km/h)</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;" id="live-kpi-speed-thrust">
                            {{ $selectedDrone->statut->value === 'en_vol' ? 'Poussée moteurs 76% PWM' : 'Moteurs stationnaires' }}
                        </div>
                    </div>
                    <div class="kpi-icon-wrap" style="color: var(--warning);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    </div>
                </div>

                <!-- Kilométrage Card (Odomètre Parcouru) -->
                <div class="kpi-card kpi-distance">
                    <div>
                        <div class="kpi-label" style="display:flex; align-items:center; justify-content:space-between;">
                            <span>Kilométrage (Odomètre)</span>
                            <span id="live-kilo-pulse" class="badge-live-pulse" style="display: {{ $selectedDrone->statut->value === 'en_vol' ? 'inline-flex' : 'none' }};">● LIVE</span>
                        </div>
                        <div class="kpi-value-row">
                            <span class="kpi-value" id="live-kpi-kilometrage">{{ $selectedDrone->statut->value === 'en_vol' ? '0.350' : '0.000' }} km</span>
                            <span class="pill-sub" id="live-kpi-dist-sub">(mission active)</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;" id="live-kpi-chrono">
                            Chrono : <strong style="color:var(--primary); font-family:'JetBrains Mono';">00:00:00</strong>
                        </div>
                    </div>
                    <div class="kpi-icon-wrap" style="color: var(--primary);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    </div>
                </div>

                <!-- Distance Card (Distance Éloignement Base) -->
                <div class="kpi-card kpi-range">
                    <div>
                        <div class="kpi-label" style="display:flex; align-items:center; justify-content:space-between;">
                            <span>Distance Éloignement Base</span>
                            <span style="font-size:0.65rem; color:#f43f5e; font-weight:700;">LoRa 16 km</span>
                        </div>
                        <div class="kpi-value-row">
                            <span class="kpi-value" id="live-kpi-distance">{{ $selectedDrone->statut->value === 'en_vol' ? '320' : '0' }} m</span>
                            <span class="pill-sub" id="live-kpi-rth-sub">(Station Sol)</span>
                        </div>
                        <div style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;">
                            Portée LoRa : <strong style="color:#f43f5e; font-family:'JetBrains Mono';">{{ number_format($kpi['portee_max_km'], 0) }} km</strong>
                        </div>
                    </div>
                    <div class="kpi-icon-wrap" style="color: #f43f5e;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/></svg>
                    </div>
                </div>
            </section>

            <!-- ---------------- Center Grid: Video & Telemetry ---------------- -->
            <section class="center-grid">
                
                <!-- Video Stream Card -->
                <div class="video-card">
                    <div class="card-header">
                        <div class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>
                            Caméra en direct — {{ $selectedDrone->nom }} ({{ $selectedDrone->code_drone }})
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            @if($selectedDrone->statut->value !== 'en_vol')
                                <form method="POST" action="{{ route('drones.demarrer-vol', $selectedDrone->id) }}" onsubmit="playDroneTakeoff(event, this)" style="display:inline;">
                                    @csrf
                                    <button type="submit" class="btn-ops-launch-flight" style="padding:6px 14px; font-size:0.75rem;" title="Lancer les moteurs et décoller">
                                        🚀 Mettre en marche &amp; Voler
                                    </button>
                                </form>
                            @else
                                <form method="POST" action="{{ route('drones.atterrir', $selectedDrone->id) }}" style="display:inline;">
                                    @csrf
                                    <button type="submit" class="btn-ops-land-flight" style="padding:6px 14px; font-size:0.75rem;" title="Atterrir immédiatement et couper les moteurs">
                                        🛬 Atterrir &amp; Couper
                                    </button>
                                </form>
                            @endif
                            <div style="font-size: 0.78rem; color: var(--text-dim);">
                                Flux RTSP Chiffré AES-256 (ESP32-CAM)
                            </div>
                        </div>
                    </div>

                    <div class="video-viewport">
                        <!-- Simulation de flux vidéo de champ agricole -->
                        <img class="video-bg" src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop" alt="Survol agricole drone">

                        <!-- HUD Crosshair central -->
                        <svg class="hud-crosshair" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="30" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1" fill="none"/>
                            <line x1="50" y1="10" x2="50" y2="35" stroke="rgba(56, 189, 248, 0.7)" stroke-width="1.5"/>
                            <line x1="50" y1="65" x2="50" y2="90" stroke="rgba(56, 189, 248, 0.7)" stroke-width="1.5"/>
                            <line x1="10" y1="50" x2="35" y2="50" stroke="rgba(56, 189, 248, 0.7)" stroke-width="1.5"/>
                            <line x1="65" y1="50" x2="90" y2="50" stroke="rgba(56, 189, 248, 0.7)" stroke-width="1.5"/>
                        </svg>

                        <!-- Box de détection IA si une détection récente existe -->
                        @if($activeDetection && $activeDetection->espece)
                            <div class="ai-detection-box">
                                <span class="ai-tag">🎯 IA: {{ $activeDetection->espece->nom_commun }} ({{ round(($activeDetection->confiance ?? 0.94) * 100) }}%)</span>
                            </div>

                            <!-- Bandeau interactif de riposte sur l'animal détecté -->
                            <div class="active-detection-ribbon">
                                <div class="ribbon-info">
                                    <span class="live-dot" style="background:#ef4444;"></span>
                                    <span>Détection : <strong>{{ $activeDetection->espece->nom_commun }}</strong> ({{ $activeDetection->nombre_estime ?? 8 }} individus)</span>
                                </div>
                                <div class="ribbon-actions">
                                    <!-- Bouton 1 : Écouter le cri de l'animal détecté -->
                                    <button type="button" class="btn-animal-listen" onclick="playAudio('{{ $activeDetection->espece->url_audio }}', 'Cri de l\'animal : {{ $activeDetection->espece->nom_commun }}', false)">
                                        🔊 Écouter son cri
                                    </button>

                                    <!-- Bouton 2 : Effaroucher avec le son répulsif adapté -->
                                    @php
                                        $sonOptimal = $activeDetection->espece->sons->first() ?? $sons->first();
                                    @endphp
                                    <form method="POST" action="{{ route('emissions.declencher') }}" onsubmit="playRepellentAudio(event, this, '{{ $sonOptimal->url_audio }}', '{{ $sonOptimal->nom }}')">
                                        @csrf
                                        <input type="hidden" name="drone_id" value="{{ $selectedDrone->id }}">
                                        <input type="hidden" name="detection_id" value="{{ $activeDetection->id }}">
                                        <input type="hidden" name="son_id" value="{{ $sonOptimal->id }}">
                                        <input type="hidden" name="volume_pct" value="95">
                                        <button type="submit" class="btn-repel-trigger">
                                            📢 Effaroucher avec {{ $sonOptimal->nom }} →
                                        </button>
                                    </form>
                                </div>
                            </div>
                        @endif

                        <div class="video-overlay-top">
                            <div class="live-indicator">
                                <span class="live-dot"></span>
                                LIVE
                            </div>
                            <div class="resolution-badge">
                                {{ $primaryCamera->resolution ?? '1080p • 30 FPS' }}
                            </div>
                        </div>

                        <div class="video-overlay-bottom">
                            <div class="osd-metric">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/></svg>
                                GPS: <strong id="hud-gps">{{ number_format($selectedDrone->latitude_actuelle ?? 5.3551, 4) }}, {{ number_format($selectedDrone->longitude_actuelle ?? -3.8942, 4) }}</strong>
                            </div>
                            <div class="osd-metric">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 2 7 19-7-4-7 4 7-19z"/></svg>
                                Alt: <strong id="hud-alt">{{ $selectedDrone->statut->value === 'en_vol' ? ($latestTelemetry->altitude ?? '45.0') : '0.0' }} m</strong>
                            </div>
                            <div class="osd-metric">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                Vit: <strong id="hud-speed">{{ $selectedDrone->statut->value === 'en_vol' ? number_format($latestTelemetry->vitesse ?? 8.5, 1) : '0.0' }} m/s</strong>
                            </div>
                            <div class="osd-metric">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/></svg>
                                Dist: <strong id="hud-dist">{{ $selectedDrone->statut->value === 'en_vol' ? '320 m' : '0 m' }}</strong>
                            </div>
                            <div class="osd-metric">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                                Odo: <strong id="hud-kilo" style="color:var(--primary);">{{ $selectedDrone->statut->value === 'en_vol' ? '0.350 km' : '0.000 km' }}</strong>
                            </div>
                            <div class="osd-metric" id="hud-chrono-box" style="display: {{ $selectedDrone->statut->value === 'en_vol' ? 'inline-flex' : 'none' }};">
                                ⏱ <strong id="hud-chrono" style="color:#fbbf24;">00:00:00</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Barre d'action rapide : Dissuasion sonore acoustique -->
                    <div class="video-control-bar">
                        <form id="soundForm" class="form-inline" method="POST" action="{{ route('emissions.declencher') }}">
                            @csrf
                            <input type="hidden" name="drone_id" value="{{ $selectedDrone->id }}">
                            @if($currentMission)
                                <input type="hidden" name="mission_id" value="{{ $currentMission->id }}">
                            @endif
                            @if($activeDetection)
                                <input type="hidden" name="detection_id" value="{{ $activeDetection->id }}">
                            @endif

                            <label style="font-size: 0.78rem; color: var(--text-dim); white-space: nowrap; font-weight:600;">🔊 Effarouchement :</label>
                            
                            <select id="mainSonSelect" name="son_id" class="select-sound">
                                @foreach($sons as $son)
                                    <option value="{{ $son->id }}" data-url="{{ $son->url_audio }}">
                                        {{ $son->nom }} ({{ $son->categorie->value }} • {{ $son->duree_secondes }}s)
                                    </option>
                                @endforeach
                            </select>

                            <!-- Bouton pour écouter le son sélectionné avant diffusion -->
                            <button type="button" class="btn-listen-sound" onclick="previewSelectedSon()" title="Écouter le son dans les enceintes avant d'ordonner la diffusion">
                                🎧 Pré-écouter
                            </button>

                            <div class="volume-control-wrap" title="Puissance de diffusion sonore">
                                <span style="font-size:0.7rem; color:var(--text-dim);">Vol:</span>
                                <input type="range" name="volume_pct" class="volume-slider" min="20" max="100" value="90" oninput="document.getElementById('volVal').innerText = this.value + '%'">
                                <span id="volVal" style="font-size:0.75rem; font-family:'JetBrains Mono'; font-weight:700; color:var(--warning);">90%</span>
                            </div>

                            <button type="submit" class="btn-fire-sound" onclick="playSelectedSonOnSubmit(event)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                                Diffuser son répulsif
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Telemetry & Sensors Column -->
                <div class="telemetry-column">
                    
                    <!-- Box Batterie avec Jauge Circulaire SVG -->
                    <div class="card-box battery-box">
                        <div class="gauge-svg-wrap">
                            @php
                                $bat = (float) ($selectedDrone->niveau_batterie ?? 74);
                                $circumference = 2 * pi() * 42;
                                $dashoffset = $circumference - ($bat / 100) * $circumference;
                                $gaugeColor = $bat < 25 ? '#ef4444' : ($bat < 50 ? '#f59e0b' : '#10b981');
                            @endphp
                            <svg width="105" height="105" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" stroke="#1e293b" stroke-width="8" fill="none"/>
                                <circle cx="50" cy="50" r="42" stroke="{{ $gaugeColor }}" stroke-width="8" fill="none"
                                        stroke-dasharray="{{ $circumference }}"
                                        stroke-dashoffset="{{ $dashoffset }}"
                                        stroke-linecap="round"
                                        transform="rotate(-90 50 50)"/>
                            </svg>
                            <div class="gauge-text">
                                <span class="gauge-percent">{{ round($bat) }}%</span>
                                <span class="gauge-sub">Batterie</span>
                            </div>
                        </div>

                        <div class="battery-details">
                            <div class="b-detail-item">
                                <small>Tension pack</small>
                                <strong>{{ $latestTelemetry->tension_batterie_v ?? '23.8' }} V</strong>
                            </div>
                            <div class="b-detail-item">
                                <small>Température</small>
                                <strong>{{ $latestTelemetry->temperature ?? '36.0' }} °C</strong>
                            </div>
                            <div class="b-detail-item">
                                <small>Autonomie estimée</small>
                                <strong>{{ round(($bat / 100) * 38) }} min</strong>
                            </div>
                            <div class="b-detail-item">
                                <small>Signal LoRa (RSSI)</small>
                                <strong>{{ $latestTelemetry->force_signal_dbm ?? '-68' }} dBm</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Box Moteurs / Composants -->
                    <div class="card-box">
                        <div style="font-size: 0.85rem; font-weight: 700; color: #cbd5e1; display:flex; justify-content:space-between;">
                            <span>Contrôle Moteurs (ESP32 PWM)</span>
                            <span id="motor-status-label" style="font-size: 0.72rem; color: {{ $selectedDrone->statut->value === 'en_vol' ? 'var(--success)' : 'var(--text-dim)' }};">
                                {{ $selectedDrone->statut->value === 'en_vol' ? 'Propulsion Active (76%)' : 'Moteurs Arrêtés' }}
                            </span>
                        </div>
                        <div class="motors-grid">
                            @php
                                $mPwm = $selectedDrone->statut->value === 'en_vol' ? 74 : 0;
                            @endphp
                            <div class="motor-chip"><span>M1 (AV-G)</span><strong id="motor-m1">{{ $mPwm > 0 ? $mPwm . '%' : 'OFF' }}</strong></div>
                            <div class="motor-chip"><span>M2 (AV-D)</span><strong id="motor-m2">{{ $mPwm > 0 ? ($mPwm - 2) . '%' : 'OFF' }}</strong></div>
                            <div class="motor-chip"><span>M3 (AR-D)</span><strong id="motor-m3">{{ $mPwm > 0 ? ($mPwm - 1) . '%' : 'OFF' }}</strong></div>
                            <div class="motor-chip"><span>M4 (AR-G)</span><strong id="motor-m4">{{ $mPwm > 0 ? ($mPwm + 2) . '%' : 'OFF' }}</strong></div>
                        </div>
                    </div>

                    <!-- Box Capteurs d'ambiance -->
                    <div class="card-box">
                        <div style="font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">
                            Mesures Capteurs Environnement (IoT)
                        </div>
                        <div class="sensors-row">
                            <div class="sensor-item">
                                <small>Température</small>
                                <strong>{{ $capteursValues['temperature']['valeur'] ?? '31.5' }} °C</strong>
                            </div>
                            <div class="sensor-item">
                                <small>Humidité</small>
                                <strong>{{ $capteursValues['humidite']['valeur'] ?? '78' }} %</strong>
                            </div>
                            <div class="sensor-item">
                                <small>Pression</small>
                                <strong>{{ $capteursValues['pression']['valeur'] ?? '1013' }} hPa</strong>
                            </div>
                            <div class="sensor-item">
                                <small>Tension Bus</small>
                                <strong>{{ $capteursValues['tension']['valeur'] ?? '23.5' }} V</strong>
                            </div>
                        </div>
                    </div>

                </div>

            </section>

            <!-- ---------------- Flight Data Strip ---------------- -->
            <section class="flight-strip">
                <div class="flight-stat">
                    <div class="flight-stat-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                    <div class="flight-stat-info">
                        <small>Altitude Relative</small>
                        <strong id="strip-alt">{{ $selectedDrone->statut->value === 'en_vol' ? ($latestTelemetry->altitude ?? '45.0') : '0.0' }} m</strong>
                    </div>
                </div>

                <div class="flight-stat">
                    <div class="flight-stat-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <div class="flight-stat-info">
                        <small>Vitesse Sol</small>
                        <strong id="strip-speed">{{ $selectedDrone->statut->value === 'en_vol' ? number_format($latestTelemetry->vitesse ?? 8.5, 1) : '0.0' }} m/s</strong>
                    </div>
                </div>

                <div class="flight-stat">
                    <div class="flight-stat-icon" style="color:var(--primary);">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    </div>
                    <div class="flight-stat-info">
                        <small>Kilométrage Parcouru</small>
                        <strong id="strip-kilo" style="color:var(--primary);">{{ $selectedDrone->statut->value === 'en_vol' ? '0.350 km' : '0.000 km' }}</strong>
                    </div>
                </div>

                <div class="flight-stat">
                    <div class="flight-stat-icon" style="color:#f43f5e;">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/></svg>
                    </div>
                    <div class="flight-stat-info">
                        <small>Distance Base</small>
                        <strong id="strip-dist">{{ $selectedDrone->statut->value === 'en_vol' ? '320 m' : '0 m' }}</strong>
                    </div>
                </div>

                <div class="flight-stat">
                    <div class="flight-stat-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2 6.3-6.4 2 2-6.3z"/></svg>
                    </div>
                    <div class="flight-stat-info">
                        <small>Cap / Lacet</small>
                        <strong id="strip-cap">{{ round($latestTelemetry->cap_de_vol ?? 245) }}°</strong>
                    </div>
                </div>

                <div class="flight-stat">
                    <div class="flight-stat-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div class="flight-stat-info">
                        <small>Chrono de Vol</small>
                        <strong id="strip-chrono" style="color:#fbbf24;">00:00:00</strong>
                    </div>
                </div>
            </section>

            <!-- ---------------- SECTION : LABORATOIRE ACOUSTIQUE DES CRIS D'ANIMAUX & EFFAROUCHEMENT ---------------- -->
            <section class="acoustic-lab-card" id="lab-acoustique">
                <div class="lab-header">
                    <div>
                        <div class="lab-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                            Laboratoire Acoustique Animal : Écoute des Cris &amp; Dissuasion Spécifique
                        </div>
                        <p style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">
                            Testez le cri des animaux ravageurs de Côte d'Ivoire et déclenchez les signaux répulsifs biologiques adaptés enregistrés dans la table <code>son_espece</code>.
                        </p>
                    </div>
                    <span style="font-size:0.75rem; color:#10b981; font-weight:700; background:rgba(16, 185, 129, 0.12); padding:4px 10px; border-radius:6px; border:1px solid rgba(16, 185, 129, 0.3);">
                        ✓ 5 Espèces &amp; 5 Répulsifs Opérationnels
                    </span>
                </div>

                <div class="species-grid">
                    @foreach($especes as $esp)
                    @php
                        $isTargeted = $activeDetection && $activeDetection->espece_id === $esp->id;
                        $repulsifOptimal = $esp->sons->first() ?? $sons->first();
                    @endphp
                    <div class="species-card {{ $isTargeted ? 'active-target' : '' }}">
                        <div class="species-top">
                            <div class="species-name">{{ $esp->nom_commun }}</div>
                            <span class="species-cat">{{ $esp->categorie->value }}</span>
                        </div>

                        <div style="font-size:0.72rem; color:#94a3b8; font-style:italic;">
                            {{ $esp->nom_scientifique }}
                        </div>

                        <div class="species-desc">
                            {{ $esp->description }}
                        </div>

                        <!-- Sons répulsifs recommandés pour cette espèce -->
                        <div class="repellents-tags">
                            <div style="font-size:0.68rem; text-transform:uppercase; font-weight:700; color:var(--text-dim);">
                                Répulsif Recommandé (BDD <code>son_espece</code>) :
                            </div>
                            @forelse($esp->sons as $s)
                                <div class="repellent-badge">
                                    <span>🦅 {{ $s->nom }}</span>
                                    <button type="button" class="btn-table-action" style="font-size:0.65rem; padding:1px 5px;" onclick="playAudio('{{ $s->url_audio }}', 'Répulsif : {{ $s->nom }}', true)">
                                        ▶ Écouter
                                    </button>
                                </div>
                            @empty
                                <div style="font-size:0.70rem; color:var(--text-dim);">Détonation générale recommandée</div>
                            @endforelse
                        </div>

                        <!-- Actions interactives par espèce -->
                        <div class="species-actions-row">
                            <!-- 1. Écouter le Cri de l'Animal -->
                            <button type="button" class="btn-animal-listen" onclick="playAudio('{{ $esp->url_audio }}', 'Cri de l\'animal : {{ $esp->nom_commun }}', false)">
                                🔊 Écouter son cri
                            </button>

                            <!-- 2. Simuler détection de cet animal sur le drone -->
                            <form method="POST" action="{{ route('drones.simuler-detection', $selectedDrone->id) }}" style="display:inline;">
                                @csrf
                                <input type="hidden" name="espece_id" value="{{ $esp->id }}">
                                <button type="submit" class="btn-animal-listen" style="color:#fbbf24; border-color:#d97706;" title="Faire apparaître cet animal dans la caméra IA">
                                    🎯 Détecter
                                </button>
                            </form>

                            <!-- 3. Riposter immédiatement par drone -->
                            @if($repulsifOptimal)
                            <form method="POST" action="{{ route('emissions.declencher') }}" onsubmit="playRepellentAudio(event, this, '{{ $repulsifOptimal->url_audio }}', '{{ $repulsifOptimal->nom }}')" style="display:inline;">
                                @csrf
                                <input type="hidden" name="drone_id" value="{{ $selectedDrone->id }}">
                                <input type="hidden" name="son_id" value="{{ $repulsifOptimal->id }}">
                                @if($isTargeted && $activeDetection)
                                    <input type="hidden" name="detection_id" value="{{ $activeDetection->id }}">
                                @endif
                                <input type="hidden" name="volume_pct" value="95">
                                <button type="submit" class="btn-repel-trigger" title="Diffuser le répulsif via le haut-parleur du drone">
                                    📢 Riposter
                                </button>
                            </form>
                            @endif
                        </div>
                    </div>
                    @endforeach
                </div>
            </section>

            <!-- ---------------- Bottom Multi-Grid ---------------- -->
            <section class="bottom-grid">
                
                <!-- Card 1: Liste des Drones -->
                <div class="table-card" id="drones-table">
                    <div class="card-header">
                        <div class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            Flotte de Drones ({{ $drones->count() }})
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size: 0.72rem; color: var(--text-dim);">Cliquez pour inspecter</span>
                            <button type="button" onclick="document.getElementById('modal-ajouter-drone').style.display='flex'" style="background: linear-gradient(135deg, #0284c7, #4f46e5); color:#fff; border:none; padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                <span>Ajouter Drone</span>
                            </button>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Code</th>
                                    <th>Statut</th>
                                    <th>Batterie</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($drones as $d)
                                <tr class="{{ $selectedDrone && $d->id === $selectedDrone->id ? 'selected' : '' }}">
                                    <td><strong>{{ $d->nom }}</strong></td>
                                    <td><code style="color: #38bdf8;">{{ $d->code_drone }}</code></td>
                                    <td>
                                        <span class="status-pill status-{{ $d->statut->value }}">
                                            {{ str_replace('_', ' ', $d->statut->value) }}
                                        </span>
                                    </td>
                                    <td>
                                        <div style="display:flex; align-items:center; gap:6px;">
                                            <div style="width:40px; height:6px; background:#1e293b; border-radius:3px; overflow:hidden;">
                                                <div style="width: {{ $d->niveau_batterie }}%; height:100%; background:{{ $d->niveau_batterie < 20 ? '#ef4444' : '#10b981' }};"></div>
                                            </div>
                                            <span style="font-family:'JetBrains Mono'; font-size:0.75rem;">{{ round($d->niveau_batterie) }}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style="display:flex; align-items:center; gap:6px;">
                                            @if($d->statut->value !== 'en_vol')
                                                <form method="POST" action="{{ route('drones.demarrer-vol', $d->id) }}" onsubmit="playDroneTakeoff(event, this)" style="display:inline;">
                                                    @csrf
                                                    <button type="submit" class="btn-table-action" style="color:#10b981; border-color:rgba(16,185,129,0.4);" title="Démarrer les moteurs et décoller">
                                                        🚀 Voler
                                                    </button>
                                                </form>
                                            @else
                                                <form method="POST" action="{{ route('drones.atterrir', $d->id) }}" style="display:inline;">
                                                    @csrf
                                                    <button type="submit" class="btn-table-action" style="color:#f59e0b; border-color:rgba(245,158,11,0.4);" title="Atterrir immédiatement et couper les moteurs">
                                                        🛬 Poser
                                                    </button>
                                                </form>
                                            @endif

                                            @if($selectedDrone && $d->id === $selectedDrone->id)
                                                <span style="color:var(--primary); font-weight:700; font-size:0.75rem; margin-left:4px;">● Cockpit</span>
                                            @else
                                                <a href="{{ route('dashboard', ['drone' => $d->id]) }}" class="btn-table-action" style="text-decoration:none;">
                                                    Voir →
                                                </a>
                                            @endif
                                        </div>
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Card 2: Détections IA récentes & Effarouchement -->
                <div class="table-card" id="detections-table">
                    <div class="card-header">
                        <div class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" x2="9.17" y1="4.93" y2="9.17"/><line x1="14.83" x2="19.07" y1="14.83" y2="19.07"/></svg>
                            Observations IA &amp; Effarouchement
                        </div>
                        <span style="font-size:0.72rem; color:var(--text-dim);">Caméra Edge</span>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Heure</th>
                                    <th>Espèce Observée</th>
                                    <th>Individus</th>
                                    <th>Confiance</th>
                                    <th>Action Riposte</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($detections as $det)
                                <tr>
                                    <td style="font-family:'JetBrains Mono'; font-size:0.75rem;">{{ $det->date_detection ? $det->date_detection->format('H:i:s') : now()->format('H:i') }}</td>
                                    <td>
                                        <strong>{{ $det->espece->nom_commun ?? 'Animal inconnu' }}</strong>
                                        <button type="button" class="btn-table-action" style="margin-left:4px; padding:1px 5px;" onclick="playAudio('{{ $det->espece?->url_audio }}', 'Cri : {{ $det->espece?->nom_commun }}', false)">
                                            🔊 Cri
                                        </button>
                                    </td>
                                    <td>{{ $det->nombre_estime ?? 1 }}</td>
                                    <td><strong style="color:var(--success);">{{ round(($det->confiance ?? 0.9) * 100) }}%</strong></td>
                                    <td>
                                        @php $sOpt = $det->espece?->sons?->first() ?? $sons->first(); @endphp
                                        @if($sOpt)
                                        <form method="POST" action="{{ route('emissions.declencher') }}" onsubmit="playRepellentAudio(event, this, '{{ $sOpt->url_audio }}', '{{ $sOpt->nom }}')" style="display:inline;">
                                            @csrf
                                            <input type="hidden" name="drone_id" value="{{ $selectedDrone->id }}">
                                            <input type="hidden" name="detection_id" value="{{ $det->id }}">
                                            <input type="hidden" name="son_id" value="{{ $sOpt->id }}">
                                            <input type="hidden" name="volume_pct" value="95">
                                            <button type="submit" class="btn-table-action" style="color:#ef4444; border-color:#ef4444;">
                                                📢 Effaroucher
                                            </button>
                                        </form>
                                        @endif
                                    </td>
                                </tr>
                                @empty
                                <tr>
                                    <td colspan="5" style="text-align:center; color:var(--text-dim); padding:16px;">
                                        Aucune observation récente. Cliquez sur "⚡ Simuler Détection" pour tester.
                                    </td>
                                </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Card 3: Alertes récentes -->
                <div class="table-card" id="alertes-table">
                    <div class="card-header">
                        <div class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            Dernières Alertes ({{ $alertes->count() }})
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Heure</th>
                                    <th>Gravité</th>
                                    <th>Message</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($alertes as $a)
                                <tr>
                                    <td style="font-family:'JetBrains Mono'; font-size:0.75rem;">{{ $a->created_at->format('H:i') }}</td>
                                    <td class="gravite-{{ $a->gravite->value }}">{{ strtoupper($a->gravite->value) }}</td>
                                    <td style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="{{ $a->message }}">{{ $a->message }}</td>
                                    <td>
                                        @if($a->statut->value === 'nouvelle')
                                            <form method="POST" action="{{ route('alertes.acquitter', $a->id) }}" style="display:inline;">
                                                @csrf
                                                <button type="submit" class="btn-table-action">
                                                    Acquitter
                                                </button>
                                            </form>
                                        @elseif($a->statut->value === 'acquittee')
                                            <form method="POST" action="{{ route('alertes.resoudre', $a->id) }}" style="display:inline;">
                                                @csrf
                                                <button type="submit" class="btn-table-action btn-table-resolve">
                                                    ✓ Résoudre
                                                </button>
                                            </form>
                                        @else
                                            <span style="color:var(--success); font-size:0.75rem;">✓ Clôturée</span>
                                        @endif
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Card 4: Carte Interactive Leaflet -->
                <div class="table-card" id="map-card">
                    <div class="card-header">
                        <div class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
                            Carte Géospatiale des Parcelles &amp; Drones
                        </div>
                    </div>
                    <div id="map" class="map-card-body"></div>
                </div>

            </section>

            <!-- Card 5: Historique des diffusions sonores répulsives -->
            <section class="table-card" id="emissions-table">
                <div class="card-header">
                    <div class="card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                        Historique des Émissions Sonores d'Effarouchement Récentes
                    </div>
                    <span style="font-size:0.75rem; color:var(--text-dim);">Table <code>emissions_sonores</code></span>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date &amp; Heure</th>
                                <th>Son Répulsif Diffusé</th>
                                <th>Cible Détectée</th>
                                <th>Drone Opérateur</th>
                                <th>Volume</th>
                                <th>Durée</th>
                                <th>Résultat</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($emissionsRecentes as $em)
                            <tr>
                                <td style="font-family:'JetBrains Mono'; font-size:0.75rem;">{{ $em->date_debut->format('d/m/Y H:i:s') }}</td>
                                <td>
                                    <strong>{{ $em->son->nom ?? 'Son' }}</strong>
                                    <button type="button" class="btn-table-action" style="margin-left:4px; font-size:0.65rem; padding:1px 5px;" onclick="playAudio('{{ $em->son?->url_audio }}', '{{ $em->son?->nom }}', true)">
                                        ▶ Écouter
                                    </button>
                                </td>
                                <td>
                                    @if($em->detection && $em->detection->espece)
                                        <span style="color:#f87171; font-weight:600;">🎯 {{ $em->detection->espece->nom_commun }}</span>
                                    @else
                                        <span style="color:var(--text-dim);">Zone agricole</span>
                                    @endif
                                </td>
                                <td><code>{{ $em->mission->drone->code_drone ?? 'Drone' }}</code></td>
                                <td><strong style="color:var(--warning);">{{ $em->volume_pct }}%</strong></td>
                                <td>{{ $em->duree_secondes }}s</td>
                                <td>
                                    <span style="color:var(--success); font-weight:600;">
                                        ✓ {{ str_replace('_', ' ', $em->resultat->value ?? 'animaux partis') }}
                                    </span>
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="7" style="text-align:center; color:var(--text-dim); padding:20px;">
                                    Aucune émission sonore enregistrée. Utilisez les boutons "Diffuser" ci-dessus pour tester l'actionneur.
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>

        </main>
    </div>

    <!-- ---------------- MODALE : PLANIFIER UNE NOUVELLE MISSION ---------------- -->
    <div id="missionModal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <div class="card-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                    Programmer une Nouvelle Mission
                </div>
                <button type="button" onclick="closeMissionModal()" style="background:none; border:none; color:var(--text-dim); font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
            <form method="POST" action="{{ route('missions.creer') }}">
                @csrf
                <div class="modal-body">
                    <div class="form-group">
                        <label>Titre de la Mission *</label>
                        <input type="text" name="nom_mission" class="form-control" placeholder="ex: Patrouille Crépusculaire Maraîchage" required value="Patrouille Protection {{ now()->format('H:i') }}">
                    </div>

                    <div class="form-group">
                        <label>Drone Assigné *</label>
                        <select name="drone_id" class="form-control" required>
                            @foreach($drones as $d)
                                <option value="{{ $d->id }}" {{ $selectedDrone->id === $d->id ? 'selected' : '' }}>
                                    {{ $d->nom }} ({{ $d->code_drone }}) — Batterie {{ round($d->niveau_batterie) }}%
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Parcelle / Zone de Surveillance *</label>
                        <select name="zone_id" class="form-control" required>
                            @foreach($zones as $z)
                                <option value="{{ $z->id }}">
                                    {{ $z->nom_zone }} ({{ $z->type_culture }} · {{ $z->surface_hectares }} ha)
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Type de Mission *</label>
                        <select name="type_mission" class="form-control" required>
                            <option value="surveillance">Surveillance Périmétrique &amp; Détection IA</option>
                            <option value="dissuasion">Effarouchement Acoustique Ciblé</option>
                            <option value="test">Vol de Test &amp; Calibration Capteurs</option>
                        </select>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <div class="form-group">
                            <label>Altitude de vol (m)</label>
                            <input type="number" name="altitude_prevue" class="form-control" value="40" min="10" max="120">
                        </div>
                        <div class="form-group">
                            <label>Vitesse cible (m/s)</label>
                            <input type="number" name="vitesse_prevue" class="form-control" value="8" min="2" max="20" step="0.5">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-ops btn-ops-secondary" onclick="closeMissionModal()">Annuler</button>
                    <button type="submit" class="btn-ops btn-ops-primary">Programmer la Mission (Générer Waypoints) →</button>
                </div>
            </form>
        </div>
    </div>

    <!-- ---------------- MODAL / HUD SÉQUENCE DE DÉCOLLAGE EN TEMPS RÉEL ---------------- -->
    <div id="takeoffModal" class="takeoff-hud-modal">
        <div class="takeoff-hud-card">
            <div class="takeoff-hud-header">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div class="pulse-ring"></div>
                    <div>
                        <div style="font-size:0.95rem; font-weight:800; color:#ffffff; letter-spacing:0.02em;">
                            🚀 SÉQUENCE D'ARMEMENT &amp; DÉCOLLAGE VERTICAL
                        </div>
                        <div style="font-size:0.75rem; color:var(--primary); font-family:'JetBrains Mono';">
                            Drone {{ $selectedDrone->nom }} ({{ $selectedDrone->code_drone }}) · ESP32 Telemetry
                        </div>
                    </div>
                </div>
                <div class="takeoff-timer" id="takeoff-timer-badge">0.0s</div>
            </div>

            <div class="takeoff-progress-bar-wrap">
                <div class="takeoff-progress-bar-fill" id="takeoff-progress-fill"></div>
            </div>

            <!-- Steps checklist -->
            <div class="takeoff-steps">
                <div class="takeoff-step active" id="t-step-1">
                    <span class="step-check" id="t-check-1">⏳</span>
                    <span>1. Armement ESC &amp; Bips d'initialisation des 4 moteurs brushless</span>
                </div>
                <div class="takeoff-step" id="t-step-2">
                    <span class="step-check" id="t-check-2">⏳</span>
                    <span>2. Montée en régime et synchronisation PWM (0% → 76% poussée)</span>
                </div>
                <div class="takeoff-step" id="t-step-3">
                    <span class="step-check" id="t-check-3">⏳</span>
                    <span>3. Décollage vertical VTOL &amp; Stabilisation altitude cible (45.0 m)</span>
                </div>
                <div class="takeoff-step" id="t-step-4">
                    <span class="step-check" id="t-check-4">⏳</span>
                    <span>4. Flux télémétrique actif : Vitesse, Distance station &amp; Kilométrage en direct</span>
                </div>
            </div>

            <!-- Live takeoff metrics gauge row -->
            <div class="takeoff-metrics-row">
                <div class="t-metric-box">
                    <small>Altitude</small>
                    <strong id="takeoff-alt-disp" style="color:#38bdf8;">0.0 m</strong>
                </div>
                <div class="t-metric-box">
                    <small>Vitesse Sol</small>
                    <strong id="takeoff-spd-disp" style="color:#fbbf24;">0.0 m/s</strong>
                </div>
                <div class="t-metric-box">
                    <small>Kilométrage</small>
                    <strong id="takeoff-kilo-disp" style="color:#10b981;">0.000 km</strong>
                </div>
                <div class="t-metric-box">
                    <small>Moteurs PWM</small>
                    <strong id="takeoff-pwm-disp" style="color:#f43f5e;">OFF</strong>
                </div>
            </div>
        </div>
    </div>

    <!-- Modale Ajout de Drone -->
    <div id="modal-ajouter-drone" class="modal-overlay" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(7,11,20,0.85); backdrop-filter:blur(6px); align-items:center; justify-content:center; padding:16px;">
        <div style="background:#0f172a; border:1px solid #38bdf8; border-radius:16px; max-width:480px; width:100%; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.5); color:#f8fafc;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; border-bottom:1px solid #1e293b; padding-bottom:12px;">
                <h3 style="font-size:1.1rem; font-weight:800; display:flex; align-items:center; gap:8px;">
                    <span style="color:#38bdf8;">+</span> Ajouter un Nouveau Drone
                </h3>
                <button type="button" onclick="document.getElementById('modal-ajouter-drone').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
            <form method="POST" action="{{ route('drones.creer') }}">
                @csrf
                <div style="display:flex; flex-direction:column; gap:12px; font-size:0.85rem;">
                    <div>
                        <label style="display:block; margin-bottom:4px; color:#94a3b8;">Nom du Drone *</label>
                        <input type="text" name="nom" required placeholder="Ex: Faucon UVCI 6" style="width:100%; background:#1e293b; border:1px solid #334155; color:#fff; padding:8px 12px; border-radius:8px;">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <div>
                            <label style="display:block; margin-bottom:4px; color:#94a3b8;">Code (optionnel)</label>
                            <input type="text" name="code_drone" placeholder="Ex: DRN-006" style="width:100%; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-family:'JetBrains Mono',monospace; padding:8px 12px; border-radius:8px;">
                        </div>
                        <div>
                            <label style="display:block; margin-bottom:4px; color:#94a3b8;">Portée max (km)</label>
                            <input type="number" step="0.5" name="portee_max_km" value="15.0" style="width:100%; background:#1e293b; border:1px solid #334155; color:#fbbf24; font-family:'JetBrains Mono',monospace; padding:8px 12px; border-radius:8px;">
                        </div>
                    </div>
                    <div>
                        <label style="display:block; margin-bottom:4px; color:#94a3b8;">Modèle de Drone</label>
                        <input type="text" name="modele" value="Hexacopter Agro-Surveillance V2" style="width:100%; background:#1e293b; border:1px solid #334155; color:#fff; padding:8px 12px; border-radius:8px;">
                    </div>
                    <div style="background:#070b14; border:1px solid #1e293b; padding:10px; border-radius:8px; font-size:0.75rem; color:#64748b;">
                        ✓ Équipement automatique : ESP32-WROOM-32, Caméra AES-256, GPS Neo-6M, Capteurs DHT22/BMP280 &amp; Batterie LiPo 100%.
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px; border-top:1px solid #1e293b; padding-top:12px;">
                        <button type="button" onclick="document.getElementById('modal-ajouter-drone').style.display='none'" style="background:#1e293b; color:#94a3b8; border:none; padding:8px 16px; border-radius:8px; cursor:pointer;">Annuler</button>
                        <button type="submit" style="background:linear-gradient(135deg, #0284c7, #4f46e5); color:#fff; border:none; padding:8px 18px; border-radius:8px; font-weight:700; cursor:pointer;">Enregistrer le Drone</button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- Leaflet JS pour la cartographie interactive -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // Moteur Audio Universel (HTML5 Audio + Web Audio API)
        let currentAudio = null;

        function playAudio(url, title, isRepellent = false) {
            stopAudio();

            const toast = document.getElementById('audioToast');
            const titleEl = document.getElementById('audioToastTitle');
            const subEl = document.getElementById('audioToastSub');

            titleEl.innerText = title;
            subEl.innerText = isRepellent ? "📢 Diffusion Répulsive Active (Haut-parleur Drone)" : "🐦 Cri de l'animal en écoute";
            subEl.style.color = isRepellent ? "#ef4444" : "#38bdf8";
            toast.classList.add('playing');

            try {
                currentAudio = new Audio(url);
                currentAudio.play().catch(e => {
                    console.log('Audio playback error, fallback to Web Audio synthesis:', e);
                    playSynthesizedAudioFallback(isRepellent);
                });

                currentAudio.onended = function() {
                    stopAudio();
                };
            } catch (err) {
                console.log('Error initializing audio:', err);
                playSynthesizedAudioFallback(isRepellent);
            }
        }

        function stopAudio() {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
                currentAudio = null;
            }
            const toast = document.getElementById('audioToast');
            if (toast) toast.classList.remove('playing');
        }

        // Synthèse de secours Web Audio API si fichier indisponible
        function playSynthesizedAudioFallback(isRepellent) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                if (isRepellent) {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(2200, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.6);
                } else {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(2800, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(3400, ctx.currentTime + 0.3);
                }

                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);

                setTimeout(stopAudio, 1000);
            } catch(e) {
                console.log('Synthesis error:', e);
            }
        }

        // Pré-écoute du son sélectionné dans la liste
        function previewSelectedSon() {
            const select = document.getElementById('mainSonSelect');
            const selectedOpt = select.options[select.selectedIndex];
            const url = selectedOpt.getAttribute('data-url');
            const nom = selectedOpt.text;
            playAudio(url, "Pré-écoute : " + nom, true);
        }

        // État de vol et Télémétrie en temps réel
        let flightActive = {{ $selectedDrone->statut->value === 'en_vol' ? 'true' : 'false' }};
        const currentDroneId = {{ $selectedDrone->id }};
        const currentCsrfToken = "{{ csrf_token() }}";

        let liveSpeed = {{ $selectedDrone->statut->value === 'en_vol' ? ($latestTelemetry->vitesse ?? 8.5) : 0.0 }};
        let liveKilometrage = {{ $selectedDrone->statut->value === 'en_vol' ? 0.350 : 0.000 }};
        let liveDistanceBase = {{ $selectedDrone->statut->value === 'en_vol' ? 320 : 0 }};
        let liveAltitude = {{ $selectedDrone->statut->value === 'en_vol' ? ($latestTelemetry->altitude ?? 45.0) : 0.0 }};
        let flightSeconds = {{ $selectedDrone->statut->value === 'en_vol' ? 142 : 0 }};
        let liveBattery = {{ (float) ($selectedDrone->niveau_batterie ?? 74) }};

        let flightInterval = null;
        let dbSyncInterval = null;
        let mapInstance = null;
        let activeDroneMarker = null;
        let flightTrail = null;
        let flightTrailCoords = [];
        let baseLat = {{ $selectedDrone->latitude_actuelle ?? 5.3551 }};
        let baseLon = {{ $selectedDrone->longitude_actuelle ?? -3.8942 }};

        // Formateur Chronomètre HH:MM:SS
        function formatChrono(totalSeconds) {
            const hrs = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;
            return (hrs > 0 ? String(hrs).padStart(2, '0') + ':' : '') +
                   String(mins).padStart(2, '0') + ':' +
                   String(secs).padStart(2, '0');
        }

        // Mise à jour de tous les indicateurs Télémétriques du Dashboard
        function updateDashboardMetrics(spd, alt, kilo, dist) {
            const spdFixed = spd.toFixed(1);
            const spdKmh = Math.round(spd * 3.6);
            const kiloFixed = kilo.toFixed(3);
            const distRound = Math.round(dist);
            const altFixed = alt.toFixed(1);

            // KPI Cards
            const kpiSpdMs = document.getElementById('live-kpi-speed-ms');
            if (kpiSpdMs) kpiSpdMs.innerText = spdFixed + ' m/s';
            const kpiSpdKmh = document.getElementById('live-kpi-speed-kmh');
            if (kpiSpdKmh) kpiSpdKmh.innerText = '(' + spdKmh + ' km/h)';

            const kpiKilo = document.getElementById('live-kpi-kilometrage');
            if (kpiKilo) kpiKilo.innerText = kiloFixed + ' km';

            const kpiDist = document.getElementById('live-kpi-distance');
            if (kpiDist) kpiDist.innerText = (distRound >= 1000 ? (distRound / 1000).toFixed(2) + ' km' : distRound + ' m');

            // Video OSD Overlay
            const hudSpd = document.getElementById('hud-speed');
            if (hudSpd) hudSpd.innerText = spdFixed + ' m/s';
            const hudAlt = document.getElementById('hud-alt');
            if (hudAlt) hudAlt.innerText = altFixed + ' m';
            const hudDist = document.getElementById('hud-dist');
            if (hudDist) hudDist.innerText = distRound + ' m';
            const hudKilo = document.getElementById('hud-kilo');
            if (hudKilo) hudKilo.innerText = kiloFixed + ' km';

            // Flight Data Strip
            const stripSpd = document.getElementById('strip-speed');
            if (stripSpd) stripSpd.innerText = spdFixed + ' m/s';
            const stripAlt = document.getElementById('strip-alt');
            if (stripAlt) stripAlt.innerText = altFixed + ' m';
            const stripKilo = document.getElementById('strip-kilo');
            if (stripKilo) stripKilo.innerText = kiloFixed + ' km';
            const stripDist = document.getElementById('strip-dist');
            if (stripDist) stripDist.innerText = distRound + ' m';
        }

        // Mise à jour de l'affichage des 4 moteurs brushless
        function updateMotorsPwm(pwm) {
            const statusLabel = document.getElementById('motor-status-label');
            const m1 = document.getElementById('motor-m1');
            const m2 = document.getElementById('motor-m2');
            const m3 = document.getElementById('motor-m3');
            const m4 = document.getElementById('motor-m4');

            if (pwm <= 0) {
                if (statusLabel) { statusLabel.innerText = 'Moteurs Arrêtés'; statusLabel.style.color = 'var(--text-dim)'; }
                if (m1) m1.innerText = 'OFF';
                if (m2) m2.innerText = 'OFF';
                if (m3) m3.innerText = 'OFF';
                if (m4) m4.innerText = 'OFF';
            } else {
                if (statusLabel) { statusLabel.innerText = 'Propulsion Active (' + pwm + '%)'; statusLabel.style.color = 'var(--success)'; }
                if (m1) m1.innerText = pwm + '%';
                if (m2) m2.innerText = Math.max(0, pwm - 2) + '%';
                if (m3) m3.innerText = Math.max(0, pwm - 1) + '%';
                if (m4) m4.innerText = Math.min(100, pwm + 2) + '%';
            }
        }

        // Bascule de l'interface visuelle en mode "EN VOL"
        function switchToFlightUI() {
            const statusPill = document.getElementById('active-drone-status-pill');
            if (statusPill) {
                statusPill.className = 'status-pill status-en_vol';
                statusPill.innerText = 'en vol';
            }

            const speedPulse = document.getElementById('live-speed-pulse');
            if (speedPulse) speedPulse.style.display = 'inline-flex';
            const kiloPulse = document.getElementById('live-kilo-pulse');
            if (kiloPulse) kiloPulse.style.display = 'inline-flex';
            const hudChronoBox = document.getElementById('hud-chrono-box');
            if (hudChronoBox) hudChronoBox.style.display = 'inline-flex';

            const batStatus = document.getElementById('live-kpi-battery-status');
            if (batStatus) batStatus.innerText = '(en vol)';

            const thrustLabel = document.getElementById('live-kpi-speed-thrust');
            if (thrustLabel) thrustLabel.innerText = 'Poussée moteurs 76% PWM';

            // Boutons d'actions en vol
            const btnContainer = document.getElementById('flight-controls-container');
            if (btnContainer) {
                btnContainer.innerHTML = `
                    <button type="button" class="btn-ops-land-flight" onclick="playDroneLanding(event)" title="Faire atterrir le drone immédiatement et couper les moteurs">
                        <span>🛬 ATTERRIR &amp; COUPER MOTEURS</span>
                    </button>
                    <form method="POST" action="/drones/${currentDroneId}/statut" style="display:inline;">
                        <input type="hidden" name="_token" value="${currentCsrfToken}">
                        <input type="hidden" name="statut" value="en_retour_base">
                        <button type="submit" class="btn-ops btn-ops-warning" title="Ordonner un retour à la base (RTH)">
                            🏠 RTH (Retour Base)
                        </button>
                    </form>
                `;
            }

            if (activeDroneMarker) {
                const el = activeDroneMarker.getElement();
                if (el && el.querySelector('div')) {
                    el.querySelector('div').style.background = '#10b981';
                    el.querySelector('div').style.boxShadow = '0 0 14px #10b981';
                }
            }
        }

        // Bascule de l'interface visuelle en mode "DISPONIBLE" (Posé)
        function switchToLandedUI() {
            const statusPill = document.getElementById('active-drone-status-pill');
            if (statusPill) {
                statusPill.className = 'status-pill status-disponible';
                statusPill.innerText = 'disponible';
            }

            const speedPulse = document.getElementById('live-speed-pulse');
            if (speedPulse) speedPulse.style.display = 'none';
            const kiloPulse = document.getElementById('live-kilo-pulse');
            if (kiloPulse) kiloPulse.style.display = 'none';
            const hudChronoBox = document.getElementById('hud-chrono-box');
            if (hudChronoBox) hudChronoBox.style.display = 'none';

            const batStatus = document.getElementById('live-kpi-battery-status');
            if (batStatus) batStatus.innerText = '(parc)';

            const thrustLabel = document.getElementById('live-kpi-speed-thrust');
            if (thrustLabel) thrustLabel.innerText = 'Moteurs stationnaires';

            const btnContainer = document.getElementById('flight-controls-container');
            if (btnContainer) {
                btnContainer.innerHTML = `
                    <button type="button" class="btn-ops-launch-flight" onclick="playDroneTakeoff(event)" title="Mettre en marche les 4 moteurs brushless et faire décoller le drone">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
                        <span>METTRE EN MARCHE &amp; FAIRE VOLER</span>
                    </button>
                `;
            }

            if (activeDroneMarker) {
                const el = activeDroneMarker.getElement();
                if (el && el.querySelector('div')) {
                    el.querySelector('div').style.background = '#38bdf8';
                    el.querySelector('div').style.boxShadow = '0 0 10px #38bdf8';
                }
            }
        }

        // Boucle de Télémétrie Continue en Temps Réel (1 Hz)
        function startRealtimeFlightLoop() {
            stopFlightLoop();

            flightInterval = setInterval(function() {
                if (!flightActive) return;

                flightSeconds += 1;
                const chronoStr = formatChrono(flightSeconds);

                // Chronos
                const kpiChrono = document.getElementById('live-kpi-chrono');
                if (kpiChrono) kpiChrono.innerHTML = `Chrono : <strong style="color:var(--primary); font-family:'JetBrains Mono';">${chronoStr}</strong>`;
                const hudChrono = document.getElementById('hud-chrono');
                if (hudChrono) hudChrono.innerText = chronoStr;
                const stripChrono = document.getElementById('strip-chrono');
                if (stripChrono) stripChrono.innerText = chronoStr;

                // Micro-variations aérodynamiques réalistes (vent & correction d'assiette)
                liveSpeed = 8.2 + (Math.sin(flightSeconds * 0.7) * 0.45) + ((Math.random() - 0.5) * 0.3);
                liveAltitude = 45.0 + (Math.sin(flightSeconds * 0.3) * 0.25);
                
                // Incrément dynamique du kilométrage : v (m/s) * 1s / 1000
                liveKilometrage += (liveSpeed / 1000.0);
                liveDistanceBase += (liveSpeed * 0.75);

                // Mise à jour synchrone de tout le dashboard
                updateDashboardMetrics(liveSpeed, liveAltitude, liveKilometrage, liveDistanceBase);

                // Micro-ajustement dynamique PWM des moteurs
                const basePwm = 75 + Math.round(Math.sin(flightSeconds * 1.2) * 2);
                updateMotorsPwm(basePwm);

                // Déplacement réaliste du drone sur la carte Leaflet
                if (mapInstance && activeDroneMarker) {
                    const angle = flightSeconds * 0.04;
                    const curLat = baseLat + (Math.sin(angle) * 0.0016);
                    const curLon = baseLon + (Math.cos(angle) * 0.0022);
                    activeDroneMarker.setLatLng([curLat, curLon]);

                    flightTrailCoords.push([curLat, curLon]);
                    if (flightTrailCoords.length > 40) flightTrailCoords.shift();
                    if (flightTrail) flightTrail.setLatLngs(flightTrailCoords);

                    const hudGps = document.getElementById('hud-gps');
                    if (hudGps) hudGps.innerText = curLat.toFixed(4) + ', ' + curLon.toFixed(4);
                }
            }, 1000);

            // Synchronisation périodique discrète avec MariaDB en arrière-plan toutes les 6 secondes
            dbSyncInterval = setInterval(function() {
                if (!flightActive) return;
                fetch(`/drones/${currentDroneId}/simuler-telemetrie`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': currentCsrfToken,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }).catch(e => console.log('Background DB sync notice:', e));
            }, 6000);
        }

        function stopFlightLoop() {
            if (flightInterval) { clearInterval(flightInterval); flightInterval = null; }
            if (dbSyncInterval) { clearInterval(dbSyncInterval); dbSyncInterval = null; }
        }

        // Action : Démarrage des moteurs et décollage drone avec immersion sonore & HUD
        function playDroneTakeoff(event, form) {
            if (event) event.preventDefault();

            // 1. Ouvrir le modal HUD de décollage
            const takeoffModal = document.getElementById('takeoffModal');
            if (takeoffModal) takeoffModal.classList.add('active');

            // 2. Lancer le son d'armement ESC & démarrage brushless
            playAudio('/audio/drone/drone_motor_startup.wav', '🚀 Armement ESC & Démarrage moteurs brushless...', true);

            // 3. Envoyer la requête backend immédiatement en arrière-plan
            fetch(`/drones/${currentDroneId}/demarrer-vol`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': currentCsrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).then(r => r.json()).catch(err => console.log('Takeoff fetch notice:', err));

            // 4. Animer la séquence d'accélération et décollage sur 3.5 secondes
            const startTime = Date.now();
            const duration = 3500;

            const takeoffAnim = setInterval(function() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(100, Math.round((elapsed / duration) * 100));

                const progFill = document.getElementById('takeoff-progress-fill');
                if (progFill) progFill.style.width = progress + '%';
                const timerBadge = document.getElementById('takeoff-timer-badge');
                if (timerBadge) timerBadge.innerText = (elapsed / 1000).toFixed(1) + 's';

                // Phase 1 : Armement (0s à 0.8s)
                if (elapsed < 800) {
                    const s1 = document.getElementById('t-step-1');
                    if (s1) s1.classList.add('done');
                    const c1 = document.getElementById('t-check-1');
                    if (c1) c1.innerText = '✓';
                    const pwmDisp = document.getElementById('takeoff-pwm-disp');
                    if (pwmDisp) pwmDisp.innerText = 'ARMÉ';
                } 
                // Phase 2 : Montée en régime brushless (0.8s à 2.0s)
                else if (elapsed < 2000) {
                    const pwmPct = Math.round(20 + ((elapsed - 800) / 1200) * 56);
                    const s2 = document.getElementById('t-step-2');
                    if (s2) s2.classList.add('active');
                    const pwmDisp = document.getElementById('takeoff-pwm-disp');
                    if (pwmDisp) pwmDisp.innerText = pwmPct + '%';
                    updateMotorsPwm(pwmPct);
                } 
                // Phase 3 : Décollage vertical VTOL (2.0s à 3.5s)
                else {
                    const s2 = document.getElementById('t-step-2');
                    if (s2) s2.classList.add('done');
                    const c2 = document.getElementById('t-check-2');
                    if (c2) c2.innerText = '✓';
                    const s3 = document.getElementById('t-step-3');
                    if (s3) s3.classList.add('active');

                    const tNorm = (elapsed - 2000) / 1500;
                    const curAlt = Math.min(45.0, (tNorm * 45.0));
                    const curSpd = Math.min(8.5, (tNorm * 8.5));
                    const curKilo = (tNorm * 0.018);

                    const altDisp = document.getElementById('takeoff-alt-disp');
                    if (altDisp) altDisp.innerText = curAlt.toFixed(1) + ' m';
                    const spdDisp = document.getElementById('takeoff-spd-disp');
                    if (spdDisp) spdDisp.innerText = curSpd.toFixed(1) + ' m/s';
                    const kiloDisp = document.getElementById('takeoff-kilo-disp');
                    if (kiloDisp) kiloDisp.innerText = curKilo.toFixed(3) + ' km';
                    const pwmDisp = document.getElementById('takeoff-pwm-disp');
                    if (pwmDisp) pwmDisp.innerText = '76%';
                    updateMotorsPwm(76);

                    // Mise à jour synchrone en temps réel sur le cockpit
                    updateDashboardMetrics(curSpd, curAlt, curKilo, Math.round(tNorm * 45));
                }

                // Fin de la séquence (3.5s) : passage en vol de croisière
                if (elapsed >= duration) {
                    clearInterval(takeoffAnim);
                    const s3 = document.getElementById('t-step-3');
                    if (s3) s3.classList.add('done');
                    const c3 = document.getElementById('t-check-3');
                    if (c3) c3.innerText = '✓';
                    const s4 = document.getElementById('t-step-4');
                    if (s4) s4.classList.add('done');
                    const c4 = document.getElementById('t-check-4');
                    if (c4) c4.innerText = '✓';

                    setTimeout(function() {
                        if (takeoffModal) takeoffModal.classList.remove('active');
                        flightActive = true;
                        liveSpeed = 8.5;
                        liveAltitude = 45.0;
                        liveDistanceBase = 60;
                        liveKilometrage = 0.020;
                        flightSeconds = 4;

                        switchToFlightUI();
                        startRealtimeFlightLoop();
                    }, 400);
                }
            }, 50);
        }

        // Action : Faire atterrir le drone en douceur
        function playDroneLanding(event, form) {
            if (event) event.preventDefault();

            // Notification d'atterrissage
            const titleEl = document.getElementById('audioToastTitle');
            const subEl = document.getElementById('audioToastSub');
            if (titleEl) titleEl.innerText = "🛬 Descente & Atterrissage en cours...";
            if (subEl) subEl.innerText = "Altitude 45m → 0m · Coupure des 4 moteurs brushless";
            const toast = document.getElementById('audioToast');
            if (toast) toast.classList.add('playing');

            // Appel backend
            fetch(`/drones/${currentDroneId}/atterrir`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': currentCsrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }).catch(e => console.log('Landing fetch notice:', e));

            // Animation de descente sur 2 secondes
            let descentAlt = liveAltitude;
            let descentSpd = liveSpeed;

            const descentInterval = setInterval(function() {
                descentAlt = Math.max(0, descentAlt - 3.2);
                descentSpd = Math.max(0, descentSpd - 0.65);

                updateDashboardMetrics(descentSpd, descentAlt, liveKilometrage, liveDistanceBase);
                updateMotorsPwm(Math.round((descentAlt / 45.0) * 72));

                if (descentAlt <= 0) {
                    clearInterval(descentInterval);
                    stopFlightLoop();
                    flightActive = false;
                    liveSpeed = 0.0;
                    liveAltitude = 0.0;

                    updateDashboardMetrics(0.0, 0.0, liveKilometrage, 0);
                    updateMotorsPwm(0);
                    switchToLandedUI();

                    setTimeout(() => { if (toast) toast.classList.remove('playing'); }, 1500);
                }
            }, 100);
        }

        // Émission sonore : joue le son puis soumet le formulaire
        function playRepellentAudio(event, form, url, nom) {
            playAudio(url, "Riposte en cours : " + nom, true);
        }

        function playSelectedSonOnSubmit(event) {
            const select = document.getElementById('mainSonSelect');
            const selectedOpt = select.options[select.selectedIndex];
            const url = selectedOpt.getAttribute('data-url');
            const nom = selectedOpt.text;
            playAudio(url, "Diffusion répulsive : " + nom, true);
        }

        // Modale Mission
        function openMissionModal() {
            document.getElementById('missionModal').classList.add('active');
        }
        function closeMissionModal() {
            document.getElementById('missionModal').classList.remove('active');
        }
        window.addEventListener('click', function(e) {
            const modal = document.getElementById('missionModal');
            if (e.target === modal) closeMissionModal();
        });

        // Carte Leaflet & Initialisation
        document.addEventListener('DOMContentLoaded', function () {
            mapInstance = L.map('map').setView([baseLat, baseLon], 13);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
                maxZoom: 18
            }).addTo(mapInstance);

            // Traçage du sillage de vol du drone actif
            flightTrail = L.polyline([], {
                color: '#10b981',
                weight: 3,
                opacity: 0.7,
                dashArray: '5, 8'
            }).addTo(mapInstance);

            @foreach($zones as $z)
                @if($z->limites_gps && isset($z->limites_gps['coordinates']))
                    const coords_{{ $z->id }} = {!! json_encode($z->limites_gps['coordinates'][0]) !!}.map(c => [c[1], c[0]]);
                    L.polygon(coords_{{ $z->id }}, {
                        color: '#38bdf8',
                        fillColor: '#0284c7',
                        fillOpacity: 0.2,
                        weight: 2
                    }).addTo(mapInstance).bindPopup("<b>{{ $z->nom_zone }}</b><br>Culture: {{ $z->type_culture }}<br>Superficie: {{ $z->surface_hectares }} ha");
                @endif
            @endforeach

            @foreach($drones as $dr)
                @if($dr->latitude_actuelle && $dr->longitude_actuelle)
                    const markerColor_{{ $dr->id }} = "{{ $dr->statut->value === 'en_vol' ? '#10b981' : ($dr->statut->value === 'disponible' ? '#38bdf8' : '#ef4444') }}";
                    const droneIcon_{{ $dr->id }} = L.divIcon({
                        className: 'custom-drone-icon',
                        html: `<div style="background:${markerColor_{{ $dr->id }}}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${markerColor_{{ $dr->id }}};"></div>`,
                        iconSize: [16, 16]
                    });

                    const m_{{ $dr->id }} = L.marker([{{ $dr->latitude_actuelle }}, {{ $dr->longitude_actuelle }}], { icon: droneIcon_{{ $dr->id }} })
                        .addTo(mapInstance)
                        .bindPopup("<b>{{ $dr->nom }} ({{ $dr->code_drone }})</b><br>Statut: {{ str_replace('_', ' ', $dr->statut->value) }}<br>Batterie: {{ round($dr->niveau_batterie) }}%<br><a href='{{ route('dashboard', ['drone' => $dr->id]) }}'>Voir en direct</a>");

                    @if($dr->id === $selectedDrone->id)
                        activeDroneMarker = m_{{ $dr->id }};
                    @endif
                @endif
            @endforeach

            // Démarrage automatique de la télémétrie si le drone est déjà en vol
            if (flightActive) {
                startRealtimeFlightLoop();
            }
        });
    </script>
</body>
</html>
