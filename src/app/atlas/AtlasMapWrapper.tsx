'use client';

import dynamic from 'next/dynamic';

const AtlasMap = dynamic(() => import('./AtlasMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[560px] md:h-[680px] rounded-card border border-stone bg-cream flex items-center justify-center">
      <p className="font-mono text-[11px] uppercase tracking-widest text-quiet">Karte wird geladen …</p>
    </div>
  ),
});

export default AtlasMap;
