# B-Mapa - interaktywna mapa meteorologiczna

Samodzielna interaktywna mapa synoptyczna i radarowa na żywo (HTML/CSS/JS, bez build stepu), z opcjonalnym logowaniem Firebase Auth do podglądu 5-godzinnej historii i trendów z Firebase RTDB.

## Funkcjonalności

- **Telemetria IMGW-PIB, R.R. (10m) oraz stacje SYNOP**: temperatura (T2m), temperatura gruntu, punkt rosy, wilgotność, LCL, wiatr średni i porywy, ciśnienie zredukowane QFF oraz pokrywa śnieżna i świeży śnieg (z automatycznym odświeżaniem dobowym i kontrolą jakości QC).
- **Stacje zagraniczne i model numeryczny**: europejskie depesze METAR/ASOS (IEM Iowa State University) oraz opcjonalne dopełnienie modelem DWD ICON przez API Open-Meteo.
- **Interpolacja przestrzenna IDW i izobary**: izotropowa interpolacja kilometrowa z przezroczystym tłem dla wartości zerowych/niskich (śnieg, wiatr, trendy), przycinana do granic RP w skali 1:1 000 000 (Eurostat GISCO / EuroGeographics).
- **Radar opadów**: kompozyt IMGW POLRAD CMAX (5-minutowy) oraz RainViewer z odtwarzaczem i osią czasu.
- **Satelita EUMETSAT WMS**: tryb dzienny MSG FES RGB oraz nocny MTG-I1 FCI IR 10.5 µm zsynchronizowane z osią czasu radaru.
- **Eksport CSV (R / Excel)**: pobieranie bieżącego parametru lub zbioru wszystkich parametrów z metadanymi czasu UTC i kodowaniem UTF-8 BOM.
- **Menedżer warstw i podkłady**: kontrola kolejności i krycia warstw rastrowych (Radar, Interpolacja, Satelita), 8 podkładów mapowych (Esri, OpenStreetMap, OpenTopoMap) oraz wielopoziomowa nakładka etykiet miejscowości (GeoNames CC BY 4.0) z detekcją kolizji względem stacji i wartości.

## Źródła danych i klauzule

- Źródłem pochodzenia danych jest Instytut Meteorologii i Gospodarki Wodnej - Państwowy Instytut Badawczy.
- Dane Instytutu Meteorologii i Gospodarki Wodnej - Państwowego Instytutu Badawczego zostały przetworzone. Bieżące pomiary operacyjne mogą stanowić dane niezweryfikowane.
- Pozostałe źródła: Rafał Raczyński (`rafalraczynski.com.pl`), DWD / Open-Meteo (CC BY 4.0), IEM ASOS (Iowa State University), RainViewer, EUMETSAT WMS, Esri, OpenStreetMap (ODbL), OpenTopoMap (CC-BY-SA), GeoNames (CC BY 4.0), Eurostat GISCO / EuroGeographics oraz GUGiK (PRG).

## Uruchomienie na GitHub Pages

1. Wypchnij zawartość repozytorium na gałąź `main`.
2. W ustawieniach repozytorium (*Settings* -> *Pages*) wybierz źródło: `Deploy from a branch` -> `main` / `root`.
