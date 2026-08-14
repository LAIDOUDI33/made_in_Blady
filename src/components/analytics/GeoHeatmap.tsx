'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MapPin, TrendingUp } from 'lucide-react';

// ============================================
// Types
// ============================================

interface WilayaData {
  code: string;
  name: string;
  nameAr?: string;
  value: number; // Activity count or metric
  change?: number; // Percentage change
}

interface GeoHeatmapProps {
  title?: string;
  data: WilayaData[];
  onWilayaClick?: (wilaya: WilayaData) => void;
  className?: string;
  colorScale?: 'green' | 'blue' | 'orange' | 'purple';
  showLegend?: boolean;
  showValues?: boolean;
}

// ============================================
// Algeria Wilayas SVG Paths (Simplified)
// These are simplified paths for each wilaya
// ============================================

const WILAYA_PATHS: Record<string, { path: string; cx: number; cy: number }> = {
  '01': { path: 'M180,20 L200,25 L195,45 L175,40 Z', cx: 188, cy: 32 }, // Adrar
  '02': { path: 'M140,30 L170,28 L172,50 L142,52 Z', cx: 156, cy: 40 }, // Chlef
  '03': { path: 'M200,35 L225,38 L222,58 L197,55 Z', cx: 211, cy: 46 }, // Laghouat
  '04': { path: 'M100,60 L130,58 L132,80 L102,82 Z', cx: 116, cy: 70 }, // Oum El Bouaghi
  '05': { path: 'M160,65 L190,63 L192,85 L162,87 Z', cx: 176, cy: 75 }, // Batna
  '06': { path: 'M220,70 L250,68 L252,90 L222,92 Z', cx: 236, cy: 80 }, // Béjaïa
  '07': { path: 'M70,90 L100,88 L102,110 L72,112 Z', cx: 86, cy: 100 }, // Biskra
  '08': { path: 'M130,95 L160,93 L162,115 L132,117 Z', cx: 146, cy: 105 }, // Béchar
  '09': { path: 'M185,100 L215,98 L217,120 L187,122 Z', cx: 201, cy: 110 }, // Blida
  '10': { path: 'M240,105 L270,103 L272,125 L242,127 Z', cx: 256, cy: 115 }, // Bouira
  '11': { path: 'M50,125 L80,123 L82,145 L52,147 Z', cx: 66, cy: 135 }, // Tamanrasset
  '12': { path: 'M110,130 L140,128 L142,150 L112,152 Z', cx: 126, cy: 140 }, // Tébessa
  '13': { path: 'M165,135 L195,133 L197,155 L167,157 Z', cx: 181, cy: 145 }, // Tlemcen
  '14': { path: 'M220,140 L250,138 L252,160 L222,162 Z', cx: 236, cy: 150 }, // Tiaret
  '15': { path: 'M275,145 L305,143 L307,165 L277,167 Z', cx: 291, cy: 155 }, // Tizi Ouzou
  '16': { path: 'M80,165 L110,163 L112,185 L82,187 Z', cx: 96, cy: 175 }, // Alger
  '17': { path: 'M140,170 L170,168 L172,190 L142,192 Z', cx: 156, cy: 180 }, // Djelfa
  '18': { path: 'M200,175 L230,173 L232,195 L202,197 Z', cx: 216, cy: 185 }, // Jijel
  '19': { path: 'M260,180 L290,178 L292,200 L262,202 Z', cx: 276, cy: 190 }, // Sétif
  '20': { path: 'M100,205 L130,203 L132,225 L102,227 Z', cx: 116, cy: 215 }, // Saïda
  '21': { path: 'M160,210 L190,208 L192,230 L162,232 Z', cx: 176, cy: 220 }, // Skikda
  '22': { path: 'M220,215 L250,213 L252,235 L222,237 Z', cx: 236, cy: 225 }, // Sidi Bel Abbès
  '23': { path: 'M280,220 L310,218 L312,240 L282,242 Z', cx: 296, cy: 230 }, // Annaba
  '24': { path: 'M70,245 L100,243 L102,265 L72,267 Z', cx: 86, cy: 255 }, // Guelma
  '25': { path: 'M130,250 L160,248 L162,270 L132,272 Z', cx: 146, cy: 260 }, // Constantine
  '26': { path: 'M190,255 L220,253 L222,275 L192,277 Z', cx: 206, cy: 265 }, // M'Sila
  '27': { path: 'M250,260 L280,258 L282,280 L252,282 Z', cx: 266, cy: 270 }, // Mostaganem
  '28': { path: 'M310,265 L340,263 L342,285 L312,287 Z', cx: 326, cy: 275 }, // M'sila (duplicate - using different)
  '29': { path: 'M90,290 L120,288 L122,310 L92,312 Z', cx: 106, cy: 300 }, // Mascara
  '30': { path: 'M150,295 L180,293 L182,315 L152,317 Z', cx: 166, cy: 305 }, // Ouargla
  '31': { path: 'M210,300 L240,298 L242,320 L212,322 Z', cx: 226, cy: 310 }, // Oran
  '32': { path: 'M270,305 L300,303 L302,325 L272,327 Z', cx: 286, cy: 315 }, // El Bayadh
  '33': { path: 'M330,310 L360,308 L362,330 L332,332 Z', cx: 346, cy: 320 }, // Illizi
  '34': { path: 'M110,335 L140,333 L142,355 L112,357 Z', cx: 126, cy: 345 }, // Bordj Bou Arréridj
  '35': { path: 'M170,340 L200,338 L202,360 L172,362 Z', cx: 186, cy: 350 }, // Boumerdès
  '36': { path: 'M230,345 L260,343 L262,365 L232,367 Z', cx: 246, cy: 355 }, // El Tarf
  '37': { path: 'M290,350 L320,348 L322,370 L292,372 Z', cx: 306, cy: 360 }, // Tindouf
  '38': { path: 'M50,375 L80,373 L82,395 L52,397 Z', cx: 66, cy: 385 }, // Tissemsilt
  '39': { path: 'M130,380 L160,378 L162,400 L132,402 Z', cx: 146, cy: 390 }, // El Oued
  '40': { path: 'M190,385 L220,383 L222,405 L192,407 Z', cx: 206, cy: 395 }, // Khenchela
  '41': { path: 'M250,390 L280,388 L282,410 L252,412 Z', cx: 266, cy: 400 }, // Souk Ahras
  '42': { path: 'M310,395 L340,393 L342,415 L312,417 Z', cx: 326, cy: 405 }, // Tipaza
  '43': { path: 'M70,420 L100,418 L102,440 L72,442 Z', cx: 86, cy: 430 }, // Mila
  '44': { path: 'M150,425 L180,423 L182,445 L152,447 Z', cx: 166, cy: 435 }, // Aïn Defla
  '45': { path: 'M210,430 L240,428 L242,450 L212,452 Z', cx: 226, cy: 440 }, // Naâma
  '46': { path: 'M270,435 L300,433 L302,455 L272,457 Z', cx: 286, cy: 445 }, // Aïn Témouchent
  '47': { path: 'M330,440 L360,438 L362,460 L332,462 Z', cx: 346, cy: 450 }, // Ghardaïa
  '48': { path: 'M100,465 L130,463 L132,485 L102,487 Z', cx: 116, cy: 475 }, // Relizane
  '49': { path: 'M180,470 L210,468 L212,490 L182,492 Z', cx: 196, cy: 480 }, // Timimoun
  '50': { path: 'M240,475 L270,473 L272,495 L242,497 Z', cx: 256, cy: 485 }, // Bordj Badji Mokhtar
  '51': { path: 'M300,480 L330,478 L332,500 L302,502 Z', cx: 316, cy: 490 }, // Ouled Djellal
  '52': { path: 'M60,505 L90,503 L92,525 L62,527 Z', cx: 76, cy: 515 }, // Béni Abbès
  '53': { path: 'M140,510 L170,508 L172,530 L142,532 Z', cx: 156, cy: 520 }, // In Salah
  '54': { path: 'M220,515 L250,513 L252,535 L222,537 Z', cx: 236, cy: 525 }, // In Guezzam
  '55': { path: 'M280,520 L310,518 L312,540 L282,542 Z', cx: 296, cy: 530 }, // Togggourt
  '56': { path: 'M340,525 L370,523 L372,545 L342,547 Z', cx: 356, cy: 535 }, // Djanet
  '57': { path: 'M110,550 L140,548 L142,570 L112,572 Z', cx: 126, cy: 560 }, // El M'Ghair
  '58': { path: 'M170,555 L200,553 L202,575 L172,577 Z', cx: 186, cy: 565 }, // El Menia
};

// ============================================
// Color Scale Functions
// ============================================

const colorScales = {
  green: {
    low: '#e8f5e9',
    mid: '#81c784',
    high: '#006233', // Algeria green
  },
  blue: {
    low: '#e3f2fd',
    mid: '#64b5f6',
    high: '#1565c0',
  },
  orange: {
    low: '#fff3e0',
    mid: '#ffb74d',
    high: '#e65100',
  },
  purple: {
    low: '#f3e5f5',
    mid: '#ba68c8',
    high: '#7b1fa2',
  },
};

function getColorForValue(
  value: number,
  min: number,
  max: number,
  scale: keyof typeof colorScales
): string {
  const colors = colorScales[scale];
  
  if (max === min) return colors.mid;
  
  const ratio = (value - min) / (max - min);
  
  if (ratio < 0.33) return colors.low;
  if (ratio < 0.66) return colors.mid;
  return colors.high;
}

// ============================================
// Main GeoHeatmap Component
// ============================================

export function GeoHeatmap({
  title = 'Carte de Chaleur par Wilaya',
  data,
  onWilayaClick,
  className,
  colorScale = 'green',
  showLegend = true,
  showValues = true,
}: GeoHeatmapProps) {
  const [hoveredWilaya, setHoveredWilaya] = useState<string | null>(null);

  // Calculate min/max for color scale
  const { minValue, maxValue } = useMemo(() => {
    if (!data.length) return { minValue: 0, maxValue: 100 };
    
    const values = data.map(d => d.value);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
    };
  }, [data]);

  // Create a map of wilaya code to data
  const dataMap = useMemo(() => {
    const map = new Map<string, WilayaData>();
    data.forEach(d => map.set(d.code, d));
    return map;
  }, [data]);

  // Handle wilaya click
  const handleWilayaClick = (code: string) => {
    const wilayaData = dataMap.get(code);
    if (wilayaData && onWilayaClick) {
      onWilayaClick(wilayaData);
    }
  };

  // Get top wilayas for list display
  const topWilayas = useMemo(() => {
    return [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
          
          {showLegend && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Faible</span>
              <div className="flex gap-0.5">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: colorScales[colorScale].low }}
                />
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: colorScales[colorScale].mid }}
                />
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: colorScales[colorScale].high }}
                />
              </div>
              <span>Élevée</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SVG Map */}
          <div className="relative bg-muted/30 rounded-lg p-4 overflow-hidden">
            <svg 
              viewBox="0 0 420 600" 
              className="w-full h-auto"
              role="img"
              aria-label="Carte des wilayas d'Algérie"
            >
              {/* Background */}
              <rect width="420" height="600" fill="#f8fafc" rx="8" />
              
              {/* Title overlay */}
              <text x="210" y="25" textAnchor="middle" className="fill-muted-foreground text-xs font-medium">
                Algérie - Activité par Wilaya
              </text>
              
              {/* Wilaya shapes */}
              {Object.entries(WILAYA_PATHS).map(([code, { path, cx, cy }]) => {
                const wilayaData = dataMap.get(code);
                const value = wilayaData?.value ?? 0;
                const isHovered = hoveredWilaya === code;
                
                return (
                  <g key={code}>
                    <path
                      d={path}
                      fill={wilayaData 
                        ? getColorForValue(value, minValue, maxValue, colorScale)
                        : '#e5e7eb'
                      }
                      stroke={isHovered ? '#000' : '#fff'}
                      strokeWidth={isHovered ? 2 : 1}
                      className="cursor-pointer transition-all duration-200 hover:opacity-80"
                      onMouseEnter={() => setHoveredWilaya(code)}
                      onMouseLeave={() => setHoveredWilaya(null)}
                      onClick={() => handleWilayaClick(code)}
                    />
                    
                    {/* Tooltip on hover */}
                    {isHovered && wilayaData && (
                      <g transform={`translate(${cx}, ${cy - 20})`}>
                        <rect
                          x="-60"
                          y="-15"
                          width="120"
                          height="40"
                          fill="#1e293b"
                          rx="4"
                        />
                        <text
                          x="0"
                          y="2"
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="11"
                          fontWeight="500"
                        >
                          {wilayaData.name}
                        </text>
                        <text
                          x="0"
                          y="16"
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="10"
                        >
                          {value.toLocaleString('fr-DZ')} activités
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
            
            {/* Hover info card */}
            {hoveredWilaya && dataMap.get(hoveredWilaya) && (
              <div className="absolute bottom-4 left-4 right-4 bg-background border rounded-lg p-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{dataMap.get(hoveredWilaya)?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {dataMap.get(hoveredWilaya)?.value.toLocaleString('fr-DZ')} activités
                    </p>
                  </div>
                  {(() => {
                    const wilayaData = dataMap.get(hoveredWilaya);
                    return wilayaData?.change !== undefined && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className={cn(
                          'h-4 w-4',
                          (wilayaData?.change ?? 0) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        )} />
                        <span className={cn(
                          'text-sm font-medium',
                          (wilayaData?.change ?? 0) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        )}>
                          {(wilayaData?.change ?? 0) > 0 ? '+' : ''}
                          {(wilayaData?.change ?? 0).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Top Wilayas List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Top 10 Wilayas les plus actives
            </h4>
            
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {topWilayas.map((wilaya, index) => (
                <button
                  key={wilaya.code}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
                    'hover:bg-muted text-left',
                    hoveredWilaya === wilaya.code && 'bg-muted'
                  )}
                  onClick={() => handleWilayaClick(wilaya.code)}
                  onMouseEnter={() => setHoveredWilaya(wilaya.code)}
                  onMouseLeave={() => setHoveredWilaya(null)}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                      index < 3 ? 'bg-primary' : 'bg-muted-foreground'
                    )}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{wilaya.name}</p>
                      {wilaya.change !== undefined && (
                        <p className={cn(
                          'text-xs',
                          wilaya.change >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {wilaya.change > 0 ? '+' : ''}{wilaya.change.toFixed(1)}% vs période précédente
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold tabular-nums">
                      {showValues ? wilaya.value.toLocaleString('fr-DZ') : '-'}
                    </span>
                    
                    {/* Mini bar indicator */}
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(wilaya.value / maxValue) * 100}%`,
                          backgroundColor: getColorForValue(
                            wilaya.value, 
                            minValue, 
                            maxValue, 
                            colorScale
                          ),
                        }}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {topWilayas.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucune donnée disponible
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default GeoHeatmap;
