// Bloque de anuncios de Google AdSense (pedido explícito) — componente
// reutilizable: cada pantalla que quiera un anuncio pone <AdUnit adSlot="..." />
// una vez. El client (ca-pub-1290253642789032) ya está cargado por el script
// global en index.html; acá sólo hace falta el adSlot de cada bloque puntual,
// que se crea desde el panel de AdSense recién cuando el sitio está aprobado
// — hasta entonces este componente no tiene ningún adSlot real para pasarle,
// no se usa en ninguna pantalla todavía.
//
// Por qué el useEffect con array vacío alcanza acá (a diferencia de una SPA
// con react-router-dom, que necesita re-disparar el push en cada cambio de
// URL): esta app no usa rutas, cambia de pantalla con un switch de estado en
// App.tsx — cada pantalla se monta/desmonta sola al navegar entre ellas, así
// que "se montó este componente" y "el usuario llegó a esta pantalla" son
// exactamente lo mismo acá, no hace falta escuchar ningún evento aparte.
import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AD_CLIENT = 'ca-pub-1290253642789032';

export function AdUnit({ adSlot, className }: { adSlot: string; className?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Si el script todavía no cargó (ad blocker del usuario, o el sitio
      // recién enviado a revisión y todavía no aprobado) no tiene sentido
      // romper la pantalla — el <ins> queda vacío en vez de tirar un error
      // visible al usuario.
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle block ${className ?? ''}`}
      style={{ display: 'block' }}
      data-ad-client={AD_CLIENT}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
