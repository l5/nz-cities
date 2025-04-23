# 🗺️ Build Cities CSV from LINZ Functional Urban Area Shapefile

👉 **[Download the latest CSV file here](data/cities_nz.csv)**

This script extracts and transforms New Zealand urban core areas from the 2023 [Functional Urban Area 2023 - Generalised dataset](https://datafinder.stats.govt.nz/layer/111270-functional-urban-area-2023-generalised/) into a clean CSV file with stable UUIDs, metadata, and accurate WGS84 centroid coordinates.

The source data is maintained by [Stats NZ](https://www.stats.govt.nz/) and [Land Information New Zealand (LINZ)](https://www.linz.govt.nz/). It outlines the spatial extent and classification of New Zealand's functional urban areas, grouped by categories such as urban core and commuting zones. This list is derived from official government information and provides a reliable foundation for geographic analysis and urban planning.

## 📂 Output

The output file is:

```
data/cities_nz.csv
```

Each row contains:

- `uuid`: Stable UUID (regenerated only if new FUA ID is found)
- `source_id`: FUA 2023 ID
- `name`: Urban area name
- `intermediate_category`: Urban category (e.g. Urban core)
- `type`: Type code
- `type_name`: Type label
- `land_area`: Raw land area value
- `area_sq_km`: Area in square kilometers
- `override_name`: Reserved for future manual overrides
- `latitude`, `longitude`: WGS84 centroid (calculated from NZTM2000)

## 🧰 Requirements

- Node.js (v18+ recommended)
- Docker or Podman

The following npm modules are used:
- [`shapefile`](https://www.npmjs.com/package/shapefile)
- [`proj4`](https://www.npmjs.com/package/proj4)
- [`@turf/centroid`](https://www.npmjs.com/package/@turf/centroid)

## 🚀 Usage

From the project root, run the script using Podman:

```bash
podman run --rm \
  --network host \
  -v "$(pwd)":/app:Z \
  -w /app/scripts \
  node:20 \
  bash -c "npm install proj4 shapefile @turf/centroid && node build_cities_csv_from_linz.js"
```

This will:
- Read the shapefile located at `data/urban-nz/functional-urban-area-2023-generalised.shp`
- Generate or update `data/cities_nz.csv` with urban core areas
- Preserve UUIDs across runs by looking up existing entries

## 📌 Notes

- Only areas classified as **Urban core** are included.
- Coordinates are converted from NZTM2000 to WGS84 using `proj4`.
- UUIDs remain stable for existing `source_id` entries.

## 📄 License & Attribution

This work uses the LINZ dataset available under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).

© [Land Information New Zealand (LINZ)](https://www.linz.govt.nz/) and [Stats NZ](https://www.stats.govt.nz/), 2023. Contains data sourced from the [Functional Urban Area 2023 - Generalised dataset](https://datafinder.stats.govt.nz/layer/111270-functional-urban-area-2023-generalised/).

Project source licensed under the MIT License.

