// build_cities_csv_from_linz.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import shapefile from 'shapefile';
import crypto from 'crypto';
import centroid from '@turf/centroid';
import proj4 from 'proj4';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_SHAPE = path.resolve(__dirname, '../data/urban-nz/functional-urban-area-2023-generalised.shp');
const OUTPUT = path.resolve(__dirname, '../data/cities_nz.csv');

// Define NZTM2000 projection (EPSG:2193)
proj4.defs("EPSG:2193", "+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +datum=GD2000 +units=m +no_defs");

const uuidMap = new Map();
const existingRows = new Map();

if (fs.existsSync(OUTPUT)) {
  const lines = fs.readFileSync(OUTPUT, 'utf-8').split('\n').slice(1);
  for (const line of lines) {
    const parts = line.split(',');
    const [uuid, source_id] = parts;
    if (uuid && source_id) {
      uuidMap.set(source_id, uuid);
      existingRows.set(source_id, parts);
    }
  }
}

const updatedRows = new Map();

console.log('📦 Reading shapefile via Node.js...');
await shapefile.open(RAW_SHAPE, undefined, { encoding: 'utf-8' })
  .then(source => source.read()
    .then(function log(result) {
      if (result.done) return;

      const props = result.value.properties;
      const geom = result.value.geometry;

      if (props['IFUA2023_1'] !== 'Urban core') return source.read().then(log);

      const source_id = props['FUA2023_V1'];
      const name = props['FUA2023__1'];
      const intcat = props['IFUA2023_V'];
      const intname = props['IFUA2023_1'];
      const type = props['TFUA2023_V'];
      const typename = props['TFUA2023_1'];
      const land = props['LAND_AREA_'];
      const area_sq_km = props['AREA_SQ_KM'];

      let lat, lon;
      try {
        const geojsonFeature = {
          type: 'Feature',
          geometry: geom,
          properties: {}
        };

        const rawCentroid = centroid(geojsonFeature).geometry.coordinates; // [X, Y] in NZTM2000
        const [x, y] = rawCentroid;
        [lon, lat] = proj4('EPSG:2193', 'WGS84', [x, y]);
      } catch (e) {
        console.warn(`⚠️  Failed to compute centroid for "${name}" (${source_id}): ${e.message}`);
        return source.read().then(log);
      }

      let uuid = uuidMap.get(source_id);
      if (!uuid) {
        uuid = crypto.randomUUID();
        uuidMap.set(source_id, uuid);
      }

      const newRow = [
        uuid,
        source_id,
        name,
        intcat,
        intname,
        type,
        typename,
        land,
        area_sq_km,
        '',
        lat,
        lon
      ];

      updatedRows.set(source_id, newRow);

      return source.read().then(log);
    }))
  .catch(error => console.error('❌ Error reading shapefile:', error));

const allRows = [
  'uuid,source_id,name,intermediate_category_id,intermediate_category_name,type,type_name,land_area,area_sq_km,override_name,latitude,longitude',
  ...Array.from(new Set([
    ...[...existingRows.entries()].map(([id, oldRow]) => {
      const updated = updatedRows.get(id);
      return updated ? updated.join(',') : oldRow.join(',');
    }),
    ...[...updatedRows.entries()].filter(([id]) => !existingRows.has(id)).map(([, newRow]) => newRow.join(','))
  ]))
];

fs.writeFileSync(OUTPUT, allRows.join('\n') + '\n');

console.log(`✅ cities_nz.csv generated at ${OUTPUT}`);
