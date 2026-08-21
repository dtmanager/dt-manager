// Ícono de trofeo parametrizable (pedido explícito: implementar el diseño
// "Trofeos Manager App" de claude.ai/design — silueta inspirada en la
// proporción de cada trofeo real, sin copiar ningún grabado o marca
// oficial: plato para la Bundesliga, corona para la Premier League,
// hexágono para Ligue 1, orejas gigantes para la Champions, etc.) —
// puerto fiel del componente SVG del diseño (TrophyIcon.dc.html) a React,
// mismos paths/gradientes, adaptado de `{{ uid }}`/`sc-if` a useId()/JSX
// condicional. Ver src/data/trofeos.ts para el catálogo de qué props usa
// cada competencia real del juego.
import { useId } from 'react';

export type FormaTrofeo = 'cup' | 'plate' | 'crown' | 'hexagon' | 'big-ears' | 'faceted' | 'mug' | 'rings';
export type MetalTrofeo = 'gold' | 'silver';
export type TamanoTrofeo = 'xs' | 'sm' | 'md' | 'lg';
export type TopperTrofeo = 'sphere' | 'star' | 'globe';

export interface TrofeoIconProps {
  shape?: FormaTrofeo;
  metal?: MetalTrofeo;
  size?: TamanoTrofeo;
  handles?: boolean;
  ornate?: boolean;
  topper?: TopperTrofeo;
  accent?: string;
  bandText?: string;
  className?: string;
}

const TAMANOS: Record<TamanoTrofeo, number> = {
  xs: 0.74, sm: 0.87, md: 1.0, lg: 1.13,
};

export function TrofeoIcon({
  shape = 'cup', metal = 'silver', size = 'sm', handles = false, ornate = false, topper = 'sphere',
  accent = '#888888', bandText = '', className,
}: TrofeoIconProps) {
  const uid = useId();
  const stops = metal === 'gold'
    ? { a: '#fbe6a3', b: '#cf9f3c', c: '#8a6a1f' }
    : { a: '#f6f7f9', b: '#c3c8cf', c: '#82878f' };
  const { a: gA, b: gB, c: gC } = stops;
  const scale = TAMANOS[size];
  const banda = bandText.toUpperCase();

  return (
    <svg viewBox="0 0 240 300" width="100%" height="100%" style={{ display: 'block', overflow: 'visible' }} className={className}>
      <defs>
        <linearGradient id={`mOuter-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gA} />
          <stop offset="55%" stopColor={gB} />
          <stop offset="100%" stopColor={gC} />
        </linearGradient>
        <linearGradient id={`mFace-${uid}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor={gB} />
          <stop offset="100%" stopColor={gA} />
        </linearGradient>
        <radialGradient id={`mHub-${uid}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={gA} />
          <stop offset="100%" stopColor={gC} />
        </radialGradient>
        <radialGradient id={`gem-${uid}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="white" stopOpacity={0.85} />
          <stop offset="35%" stopColor={accent} />
          <stop offset="100%" stopColor={accent} stopOpacity={0.55} />
        </radialGradient>
        <linearGradient id={`cupBody-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gC} />
          <stop offset="45%" stopColor={gA} />
          <stop offset="60%" stopColor="white" stopOpacity={0.6} />
          <stop offset="75%" stopColor={gA} />
          <stop offset="100%" stopColor={gC} />
        </linearGradient>
        <linearGradient id={`cupBase-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={gB} />
          <stop offset="100%" stopColor={gC} />
        </linearGradient>
        <radialGradient id={`ball-${uid}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="white" stopOpacity={0.9} />
          <stop offset="45%" stopColor={accent} />
          <stop offset="100%" stopColor={gC} />
        </radialGradient>
      </defs>

      <g transform={`translate(120,300) scale(${scale}) translate(-120,-300)`}>
        {shape === 'plate' && (
          <g>
            <path d="M95,205 L100,245 L140,245 L145,205 Z" fill={`url(#cupBase-${uid})`} />
            <ellipse cx={120} cy={255} rx={46} ry={10} fill={`url(#cupBase-${uid})`} />
            <ellipse cx={120} cy={150} rx={100} ry={44} fill={`url(#mOuter-${uid})`} stroke={gC} strokeWidth={2} />
            <ellipse cx={120} cy={153} rx={86} ry={37} fill={`url(#mFace-${uid})`} />
            <circle cx={120} cy={150} r={26} fill={`url(#mHub-${uid})`} stroke={gC} strokeWidth={1.5} />
            <polygon points="120,133 133,140 134,153 124,163 116,163 106,153 107,140" fill={`url(#gem-${uid})`} stroke={gC} strokeWidth={1} />
          </g>
        )}

        {shape === 'crown' && (
          <g>
            <ellipse cx={120} cy={278} rx={48} ry={10} fill={`url(#cupBase-${uid})`} />
            <path d="M78,228 C63,238 58,258 68,273 L78,268 C71,255 73,241 85,231 Z" fill={accent} />
            <path d="M162,228 C177,238 182,258 172,273 L162,268 C169,255 167,241 155,231 Z" fill={accent} />
            <path d="M70,210 L170,210 L161,240 L79,240 Z" fill={`url(#mOuter-${uid})`} stroke={gC} strokeWidth={1.5} />
            <polygon points="80,210 95,210 87,175" fill={`url(#mHub-${uid})`} stroke={gC} strokeWidth={1} />
            <polygon points="108,210 132,210 120,148" fill={`url(#mHub-${uid})`} stroke={gC} strokeWidth={1} />
            <polygon points="145,210 160,210 152,175" fill={`url(#mHub-${uid})`} stroke={gC} strokeWidth={1} />
          </g>
        )}

        {shape === 'hexagon' && (
          <g>
            <ellipse cx={120} cy={272} rx={44} ry={9} fill={`url(#cupBase-${uid})`} />
            <polygon points="120,128 158,158 152,232 120,260 88,232 82,158" fill={`url(#cupBody-${uid})`} stroke={gC} strokeWidth={1.5} />
            <rect x={90} y={188} width={60} height={18} fill={accent} />
          </g>
        )}

        {shape === 'big-ears' && (
          <g>
            <ellipse cx={120} cy={252} rx={54} ry={11} fill={`url(#cupBase-${uid})`} />
            <path
              d="M70,220 C70,195 90,180 120,180 C150,180 170,195 170,220 C170,235 150,245 120,245 C90,245 70,235 70,220 Z"
              fill={`url(#cupBody-${uid})`}
              stroke={gC}
              strokeWidth={1.5}
            />
            <ellipse cx={120} cy={181} rx={48} ry={8} fill={`url(#mFace-${uid})`} />
            <ellipse cx={120} cy={236} rx={40} ry={5} fill="none" stroke={accent} strokeWidth={3} />
            <path d="M85,205 C40,192 34,112 90,96" fill="none" stroke={`url(#cupBody-${uid})`} strokeWidth={13} strokeLinecap="round" />
            <path d="M155,205 C200,192 206,112 150,96" fill="none" stroke={`url(#cupBody-${uid})`} strokeWidth={13} strokeLinecap="round" />
          </g>
        )}

        {shape === 'faceted' && (
          <g>
            <ellipse cx={120} cy={272} rx={44} ry={9} fill={`url(#cupBase-${uid})`} />
            <polygon points="120,138 155,160 150,208 165,234 120,256 75,234 90,208 85,160" fill={`url(#cupBody-${uid})`} stroke={gC} strokeWidth={1.5} />
            <polygon points="120,138 155,160 120,190" fill="white" opacity={0.28} />
            <polygon points="120,190 150,208 120,256 90,208" fill={accent} opacity={0.5} />
          </g>
        )}

        {shape === 'mug' && (
          <g>
            <rect x={82} y={248} width={76} height={20} fill={`url(#cupBase-${uid})`} />
            <rect x={92} y={266} width={56} height={10} fill={gC} />
            <rect x={90} y={150} width={60} height={98} rx={4} fill={`url(#cupBody-${uid})`} stroke={gC} strokeWidth={1.5} />
            <ellipse cx={120} cy={150} rx={30} ry={8} fill={`url(#mFace-${uid})`} />
            <rect x={90} y={205} width={60} height={16} fill={accent} />
            <path d="M150,175 C186,180 186,220 150,223" fill="none" stroke={`url(#cupBody-${uid})`} strokeWidth={9} strokeLinecap="round" />
          </g>
        )}

        {shape === 'rings' && (
          <g>
            <path d="M96,222 L100,255 L140,255 L144,222 Z" fill={`url(#cupBase-${uid})`} />
            <ellipse cx={120} cy={262} rx={42} ry={9} fill={`url(#cupBase-${uid})`} />
            <circle cx={120} cy={170} r={88} fill="none" stroke={`url(#mOuter-${uid})`} strokeWidth={13} />
            <circle cx={120} cy={170} r={64} fill="none" stroke={`url(#mFace-${uid})`} strokeWidth={9} />
            <circle cx={120} cy={170} r={40} fill={`url(#mHub-${uid})`} stroke={gC} strokeWidth={1.5} />
            <polygon points="120,153 132,160 133,172 124,182 116,182 107,172 108,160" fill={`url(#gem-${uid})`} stroke={gC} strokeWidth={1} />
          </g>
        )}

        {shape === 'cup' && (
          <g>
            <ellipse cx={120} cy={292} rx={52} ry={13} fill={`url(#cupBase-${uid})`} />
            <path d="M92,288 L102,272 L138,272 L148,288 Z" fill={`url(#cupBase-${uid})`} />
            <path
              d="M105,272 C108,254 110,236 114,220 C90,214 64,188 59,148 C57,143 62,138 70,138 L170,138 C178,138 183,143 181,148 C176,188 150,214 126,220 C130,236 132,254 135,272 Z"
              fill={`url(#cupBody-${uid})`}
              stroke={gC}
              strokeWidth={1.5}
            />
            {ornate && (
              <g stroke={gC} strokeWidth={2} fill="none" opacity={0.55}>
                <path d="M85,165 C82,185 88,205 100,218" />
                <path d="M120,150 C118,175 120,198 124,218" />
                <path d="M155,165 C158,185 152,205 142,218" />
              </g>
            )}
            <ellipse cx={120} cy={139} rx={56} ry={11} fill={gB} stroke={gC} strokeWidth={1} />
            <ellipse cx={120} cy={141} rx={45} ry={7} fill={gC} opacity={0.8} />
            {handles && (
              <g fill="none" stroke={`url(#cupBody-${uid})`} strokeWidth={9} strokeLinecap="round">
                <path d="M64,160 C30,168 26,200 62,214" />
                <path d="M176,160 C210,168 214,200 178,214" />
              </g>
            )}
            <rect x={78} y={224} width={84} height={24} rx={3} fill={accent} />
            <text x={120} y={240} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={11} fill="white" letterSpacing={1}>
              {banda}
            </text>

            {topper === 'sphere' && (
              <circle cx={120} cy={118} r={22} fill={`url(#ball-${uid})`} stroke={gC} strokeWidth={1.5} />
            )}
            {topper === 'star' && (
              <g transform="translate(120,116)">
                <circle cx={0} cy={4} r={18} fill={`url(#mHub-${uid})`} stroke={gC} strokeWidth={1} />
                <polygon
                  points="0,-20 5.9,-6.4 20,-6.4 8.6,2.7 12.7,18 0,9.1 -12.7,18 -8.6,2.7 -20,-6.4 -5.9,-6.4"
                  fill={accent}
                  stroke={gC}
                  strokeWidth={1}
                />
              </g>
            )}
            {topper === 'globe' && (
              <g transform="translate(120,112)">
                <circle cx={0} cy={0} r={26} fill={`url(#ball-${uid})`} stroke={gC} strokeWidth={1.5} />
                <ellipse cx={0} cy={0} rx={26} ry={9} fill="none" stroke={gC} strokeWidth={1} opacity={0.7} />
                <ellipse cx={0} cy={0} rx={9} ry={26} fill="none" stroke={gC} strokeWidth={1} opacity={0.7} />
                <polygon
                  points="0,-38 3.5,-30 12,-30 5.2,-24.8 7.6,-16.6 0,-21.6 -7.6,-16.6 -5.2,-24.8 -12,-30 -3.5,-30"
                  fill={gA}
                  stroke={gC}
                  strokeWidth={1}
                />
              </g>
            )}
          </g>
        )}
      </g>
    </svg>
  );
}
