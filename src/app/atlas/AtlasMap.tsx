'use client';

import * as React from 'react';
import maplibregl, { type Map as MapLibreMap, type Popup as MapLibrePopup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { AtlasMarker } from './atlas-data';

type Props = {
  markers: AtlasMarker[];
  branchen: string[];
  kantone: string[];
};

type Filter = { branche: string; kanton: string };

const SWISSTOPO_TILES =
  'https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg';

function buildGeoJSON(markers: AtlasMarker[], filter: Filter) {
  const filtered = markers.filter(
    (m) =>
      (filter.branche === '' || m.branche === filter.branche) &&
      (filter.kanton === '' || m.kanton === filter.kanton),
  );

  return {
    type: 'FeatureCollection' as const,
    features: filtered.map((m) => ({
      type: 'Feature' as const,
      properties: {
        id: m.id,
        titel: m.titel,
        branche: m.branche,
        kanton: m.kanton,
        jahr: m.jahr ?? null,
        mitarbeitende: m.mitarbeitende ?? null,
        umsatz: m.umsatz ?? null,
        ebitda: m.ebitda ?? null,
        kaufpreis: m.kaufpreis ?? null,
        grund: m.grund ?? null,
      },
      geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
    })),
  };
}

function popupHTML(p: Record<string, unknown>): string {
  const safe = (v: unknown) =>
    v == null ? '' : String(v).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c),
    );
  const row = (label: string, val: unknown) =>
    val == null || val === ''
      ? ''
      : `<div class="flex justify-between gap-3 py-1.5 border-b border-stone last:border-0">
           <span class="font-mono text-[10px] uppercase tracking-widest text-quiet">${label}</span>
           <span class="font-mono text-[12px] text-ink">${safe(val)}</span>
         </div>`;

  return `
    <div class="p-1 max-w-[260px]">
      <div class="font-mono text-[10px] uppercase tracking-widest text-bronze-ink mb-2">${safe(p.branche)} · ${safe(p.kanton)}</div>
      <h3 class="font-serif text-[15px] text-navy leading-snug mb-3" style="font-weight:400;">${safe(p.titel)}</h3>
      <div class="text-[12px] mb-4">
        ${row('Jahr', p.jahr)}
        ${row('Mitarbeitende', p.mitarbeitende)}
        ${row('Umsatz', p.umsatz)}
        ${row('EBITDA', p.ebitda)}
        ${row('Kaufpreis', p.kaufpreis)}
        ${row('Grund', p.grund)}
      </div>
      <a href="/auth/register?ref=atlas&dossier=${safe(p.id)}"
         class="inline-flex items-center justify-center w-full gap-2 bg-navy text-cream rounded-soft px-4 py-2 text-[13px] font-medium hover:bg-ink transition-colors">
        Dossier anfragen →
      </a>
    </div>
  `;
}

export default function AtlasMap({ markers, branchen, kantone }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const popupRef = React.useRef<MapLibrePopup | null>(null);
  const [filter, setFilter] = React.useState<Filter>({ branche: '', kanton: '' });

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'swisstopo-grey': {
            type: 'raster',
            tiles: [SWISSTOPO_TILES],
            tileSize: 256,
            attribution: '© swisstopo',
          },
        },
        layers: [{ id: 'swisstopo-grey', type: 'raster', source: 'swisstopo-grey' }],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      },
      center: [8.227, 46.818],
      zoom: 7.2,
      maxBounds: [
        [5.5, 45.6],
        [10.8, 48.0],
      ],
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('inserate', {
        type: 'geojson',
        data: buildGeoJSON(markers, { branche: '', kanton: '' }),
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 48,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'inserate',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#B8935A',
          'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 20, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FAF8F3',
          'circle-opacity': 0.9,
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'inserate',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Noto Sans Regular'],
          'text-size': 13,
        },
        paint: { 'text-color': '#FAF8F3' },
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'inserate',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#B8935A',
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0B1F3A',
        },
      });

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        if (clusterId == null) return;
        const source = map.getSource('inserate') as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geom = features[0].geometry as GeoJSON.Point;
          map.easeTo({ center: geom.coordinates as [number, number], zoom });
        }).catch(() => {});
      });

      map.on('click', 'unclustered-point', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({
          offset: 14,
          closeButton: true,
          closeOnClick: false,
          className: 'passare-popup',
          maxWidth: '300px',
        })
          .setLngLat(coords)
          .setHTML(popupHTML(f.properties as Record<string, unknown>))
          .addTo(map);
      });

      map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''));
      map.on('mouseenter', 'unclustered-point', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'unclustered-point', () => (map.getCanvas().style.cursor = ''));
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [markers]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource('inserate') as maplibregl.GeoJSONSource | undefined;
      if (src) src.setData(buildGeoJSON(markers, filter));
    };
    if (map.isStyleLoaded()) apply();
    else map.once('idle', apply);
  }, [filter, markers]);

  const filteredCount = React.useMemo(
    () =>
      markers.filter(
        (m) =>
          (filter.branche === '' || m.branche === filter.branche) &&
          (filter.kanton === '' || m.kanton === filter.kanton),
      ).length,
    [filter, markers],
  );

  return (
    <div className="relative">
      {/* Filter-Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-paper border border-stone rounded-soft">
        <div className="flex items-center gap-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-quiet">Branche</label>
          <select
            value={filter.branche}
            onChange={(e) => setFilter((f) => ({ ...f, branche: e.target.value }))}
            className="bg-cream border border-stone rounded-soft px-3 py-1.5 text-[13px] text-ink font-sans focus:outline-none focus:border-bronze focus:shadow-focus"
          >
            <option value="">Alle Branchen</option>
            {branchen.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-mono text-[10px] uppercase tracking-widest text-quiet">Kanton</label>
          <select
            value={filter.kanton}
            onChange={(e) => setFilter((f) => ({ ...f, kanton: e.target.value }))}
            className="bg-cream border border-stone rounded-soft px-3 py-1.5 text-[13px] text-ink font-sans focus:outline-none focus:border-bronze focus:shadow-focus"
          >
            <option value="">Alle Kantone</option>
            {kantone.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-bronze-ink">
          {filteredCount} {filteredCount === 1 ? 'Inserat' : 'Inserate'}
        </span>
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className="w-full h-[560px] md:h-[680px] rounded-card border border-stone overflow-hidden bg-cream"
        style={{ position: 'relative' }}
      />

      {/* Popup-Style-Override */}
      <style jsx global>{`
        .maplibregl-popup-content {
          background: #FAF8F3 !important;
          border: 1px solid #E8E6E0;
          border-radius: 6px;
          padding: 14px;
          box-shadow: 0 8px 24px rgba(11, 31, 58, 0.08);
          font-family: var(--font-sans), system-ui, sans-serif;
        }
        .maplibregl-popup-tip { border-top-color: #E8E6E0 !important; }
        .maplibregl-popup-close-button {
          color: #5A6471;
          font-size: 18px;
          padding: 4px 8px;
        }
        .maplibregl-ctrl-attrib { background: rgba(250, 248, 243, 0.8); }
      `}</style>
    </div>
  );
}
