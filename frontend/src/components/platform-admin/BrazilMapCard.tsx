import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GeoStateData } from '@/types/platformAdmin';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import geoJson from '@/lib/brazil-states.json';

interface BrazilMapCardProps {
  data?: GeoStateData[];
  isLoading?: boolean;
}

const colorScale = (value: number) => {
  if (value > 100) return '#1d4ed8';
  if (value > 50) return '#2563eb';
  if (value > 20) return '#3b82f6';
  if (value > 5) return '#60a5fa';
  if (value > 0) return '#bfdbfe';
  return '#e5e7eb';
};

export function BrazilMapCard({ data, isLoading }: BrazilMapCardProps) {
  const lookup = new Map<string, GeoStateData>();
  data?.forEach((item) => lookup.set(item.code?.toUpperCase(), item));

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-900">
            Mapa de Igrejas por Estado
          </CardTitle>
          <span className="text-xs text-slate-500">Dados reais do sistema</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Skeleton className="h-[320px] w-full" />}

        {!isLoading && (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="h-[320px]">
              <ComposableMap projection="geoMercator" projectionConfig={{ scale: 750, center: [-55, -15] }}>
                <Geographies geography={geoJson as any}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const stateCode = geo.properties?.sigla || geo.id || '';
                      const value = lookup.get(stateCode.toUpperCase());
                      const fill = colorScale(value?.churches_count || 0);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke="#fff"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none', fill: '#1d4ed8' },
                            pressed: { outline: 'none' },
                          }}
                          title={`${stateCode}: ${value?.churches_count || 0} igrejas`}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900">Top estados</h4>
              <div className="space-y-1">
                {data
                  ?.slice()
                  .sort((a, b) => b.churches_count - a.churches_count)
                  .slice(0, 6)
                  .map((item, idx) => (
                    <div
                      key={item.code}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">#{idx + 1}</span>
                        <span className="text-sm font-semibold text-slate-900">{item.code}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.churches_count} igrejas
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.active_members} membros ativos
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">Legenda</h4>
                <div className="space-y-1 text-xs text-slate-600">
                  <LegendItem color="#1d4ed8" label="100+ igrejas" />
                  <LegendItem color="#2563eb" label="51-100" />
                  <LegendItem color="#3b82f6" label="21-50" />
                  <LegendItem color="#60a5fa" label="6-20" />
                  <LegendItem color="#bfdbfe" label="1-5" />
                  <LegendItem color="#e5e7eb" label="0" />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
