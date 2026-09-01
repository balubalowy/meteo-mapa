# B-Meteo — Standalone Weather Map 

W pełni funkcjonalna, samodzielna i otwarta interaktywna mapa meteorologiczna na żywo. Działa w 100% statycznie (HTML/CSS/JS) bez backendu i bez wymagań kluczy API.

## Funkcjonalności:
- **Telemetria IMGW & Stacje SYNOP**: Temperatura, Ciśnienie zredukowane QNH (65 stacji), Porywy wiatru, Punkt Rosy, Wysokość podstawy chmur (LCL), Wilgotność, Temp. Gruntu.
- **Interpolacja Przestrzenna IDW & Izobary**: Generowanie rastrowej mapy pól z konfigurowalnym krokiem izolinii.
- **Radar Opadów**: IMGW CMAX 5-minutowy oraz RainViewer z odtwarzaczem i osią czasu.
- **Satelita EUMETSAT WMS**: Dzienny HRV (High-Resolution Visible) oraz Nocny MTG-IR zsynchronizowany z osią czasu radaru.
- **Wyładowania na Żywo**: WebSocket Blitzortung.
- **Kreator Synoptyczny**: Rysowanie frontów (chłodny, ciepły, okluzja, linia zbieżności) i symboli meteo.
- **Menedżer Warstw**: Dostosowywanie kolejności Z-Index i przezroczystości suwakami (0–100%).

## Uruchomienie na GitHub Pages:
1. Utwórz nowe repozytorium na GitHubie.
2. Wypchnij zawartość tego katalogu na gałąź `main`.
3. W ustawieniach repozytorium (*Settings* -> *Pages*) wybierz źródło: `Deploy from a branch` -> `main` / `root`.
