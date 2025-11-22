# 📚 Referências de Bibliotecas - Mapa Interativo do Brasil

> Documentação consolidada das bibliotecas para implementação do mapa geográfico no Dashboard Super Admin

**Data de Consulta:** 18 de novembro de 2025  
**Fonte:** Context7 MCP Server

---

## 📊 Recharts (Biblioteca Atual do Projeto)

**Versão:** v3.2.1 / v3.3.0  
**Context7 ID:** `/recharts/recharts`  
**Reputação:** Alta | **Score:** 86.6 | **Snippets:** 93

### Principais Mudanças na v3.0

#### ✨ Custom Components como First-Class Citizens
Na v3.0, componentes customizados podem ser incluídos diretamente sem o wrapper `Customized`:

```tsx
// ✅ v3.0 - Direto
<BarChart width={1100} height={250} data={data}>
  <Bar dataKey="uv" />
  <MyCustomAxes />
</BarChart>

// ⚠️ v2.0 - Com wrapper (ainda suportado)
<BarChart width={1100} height={250} data={data}>
  <Customized component={MyCustomComponent} />
</BarChart>
```

### Customização de Estilos SVG

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

<BarChart width={600} height={300} data={data}>
  <XAxis dataKey="name" stroke="#8884d8" />
  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
  <Bar dataKey="uv" fill="#8884d8" barSize={30} />
</BarChart>
```

### Custom Tooltip com Dados Adicionais

```tsx
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`${label}`}</p>
        <p style={{ margin: '5px 0 0 0', color: payload[0].color }}>
          {`Value: ${payload[0].value}`}
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
          {`Status: ${payload[0].payload.status}`}
        </p>
      </div>
    );
  }
  return null;
};

<Tooltip content={<CustomTooltip />} cursor={{ stroke: 'red', strokeWidth: 2 }} />
```

### Custom Legend

```tsx
const renderCustomLegend = (props) => {
  const { payload } = props;

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', justifyContent: 'center' }}>
      {payload.map((entry, index) => (
        <li key={`item-${index}`} style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: entry.color,
            marginRight: '5px',
            borderRadius: '50%'
          }} />
          <span style={{ color: '#666' }}>{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

<Legend
  content={renderCustomLegend}
  verticalAlign="top"
  height={36}
  onClick={(data) => console.log('Legend clicked:', data)}
/>
```

### Hooks Personalizados (v3.0)

```tsx
import {
  useChartWidth,
  useChartHeight,
  useMargin,
  useOffset,
  usePlotArea,
  useActiveTooltipLabel,
  useActiveTooltipDataPoints,
  useXAxisDomain,
  useYAxisDomain,
} from 'recharts';

function ChartInfo() {
  const width = useChartWidth();
  const height = useChartHeight();
  const margin = useMargin();
  const activeLabel = useActiveTooltipLabel();
  const activeDataPoints = useActiveTooltipDataPoints();

  return (
    <div>
      <p>Width: {width}px, Height: {height}px</p>
      <p>Active Label: {activeLabel}</p>
      <p>Active Data: {JSON.stringify(activeDataPoints)}</p>
    </div>
  );
}
```

### Cores com Cell Customizado

```tsx
import { Cell } from 'recharts';

const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

<Bar dataKey="amt" fill="#8884d8">
  {data.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
  ))}
</Bar>
```

---

## 🗺️ React Simple Maps (Opção para Mapas)

**Context7 ID:** `/zcreativelabs/react-simple-maps`  
**Reputação:** Alta | **Snippets:** 3  
**Descrição:** Mapas SVG com d3-geo e topojson usando API declarativa

### Instalação

```bash
npm install react-simple-maps
# ou
yarn add react-simple-maps
```

### Exemplo Básico - Mapa Mundial

```jsx
import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

// URL para arquivo TopoJSON válido
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

function WorldMap() {
  return (
    <ComposableMap>
      <Geographies geography={geoUrl}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography key={geo.rsmKey} geography={geo} />
          ))
        }
      </Geographies>
    </ComposableMap>
  );
}
```

### 🇧🇷 Adaptação para Mapa do Brasil

Para usar com o Brasil, você precisa:

1. **Obter TopoJSON do Brasil:**
   - https://github.com/tbrugz/geodata-br
   - https://github.com/fititnt/gis-dataset-brasil

2. **Exemplo de Implementação:**

```jsx
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const brazilTopoJSON = "/path/to/brazil-states.json";

function BrazilMap({ statesData, onStateClick }) {
  const getStateColor = (stateCode) => {
    const state = statesData.find(s => s.code === stateCode);
    const churches = state?.churches_count || 0;
    
    if (churches === 0) return '#f3f4f6';
    if (churches <= 5) return '#dbeafe';
    if (churches <= 20) return '#93c5fd';
    if (churches <= 50) return '#3b82f6';
    if (churches <= 100) return '#1d4ed8';
    return '#1e3a8a';
  };

  return (
    <ComposableMap projection="geoMercator">
      <Geographies geography={brazilTopoJSON}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill={getStateColor(geo.properties.sigla)}
              stroke="#ffffff"
              strokeWidth={0.5}
              style={{
                default: { outline: 'none' },
                hover: { fill: '#60a5fa', outline: 'none' },
                pressed: { fill: '#3b82f6', outline: 'none' },
              }}
              onClick={() => onStateClick(geo.properties.sigla)}
            />
          ))
        }
      </Geographies>
    </ComposableMap>
  );
}
```

### Vantagens do React Simple Maps
- ✅ API declarativa com React
- ✅ Suporte nativo a TopoJSON
- ✅ Projeções cartográficas (geoMercator, geoAlbers, etc.)
- ✅ Zoom e pan integrados
- ✅ Leve e performático

---

## 🍃 React Leaflet (Alternativa Robusta)

**Context7 ID:** `/websites/react-leaflet_js`  
**Reputação:** Alta | **Score:** 72.9 | **Snippets:** 331  
**Descrição:** Componentes React para mapas interativos com Leaflet

### Instalação

```bash
npm install react-leaflet leaflet
npm install -D @types/leaflet  # Se usar TypeScript
```

### CSS Obrigatório

```tsx
import 'leaflet/dist/leaflet.css';
```

### Mapa Básico com Marcador

```tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MyMap() {
  const position = [51.505, -0.09];

  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    </MapContainer>
  );
}
```

### Tooltips Interativos

```tsx
import { MapContainer, TileLayer, Marker, Circle, Tooltip } from 'react-leaflet';

function TooltipsExample() {
  const center = [51.505, -0.09];

  return (
    <MapContainer center={center} zoom={13} style={{ height: '400px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Tooltip Permanente */}
      <Marker position={center}>
        <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent>
          Permanent Tooltip
        </Tooltip>
      </Marker>

      {/* Tooltip on Hover */}
      <Circle
        center={[51.51, -0.12]}
        radius={200}
        pathOptions={{ color: 'blue' }}
      >
        <Tooltip>Hover Tooltip on Circle</Tooltip>
      </Circle>
    </MapContainer>
  );
}
```

### Renderizar GeoJSON

```tsx
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';

function GeoJSONExample() {
  const geojsonFeature = {
    type: 'Feature',
    properties: {
      name: 'Sample Area',
      popupContent: 'This is a GeoJSON feature'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[ 
        [-0.09, 51.505],
        [-0.1, 51.51],
        [-0.12, 51.51],
        [-0.12, 51.505],
        [-0.09, 51.505]
      ]]
    }
  };

  const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.popupContent) {
      layer.bindPopup(feature.properties.popupContent);
    }
  };

  const style = {
    color: '#ff7800',
    weight: 2,
    opacity: 0.65,
    fillOpacity: 0.3
  };

  return (
    <MapContainer center={[51.508, -0.105]} zoom={13} style={{ height: '400px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <GeoJSON
        data={geojsonFeature}
        style={style}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  );
}
```

### Vantagens do React Leaflet
- ✅ Biblioteca madura e amplamente usada
- ✅ Suporte completo a GeoJSON
- ✅ Marcadores customizáveis
- ✅ Popups e tooltips ricos
- ✅ Plugins extensíveis
- ⚠️ Desvantagem: Adiciona ~100KB ao bundle

---

## 📐 GeoJSON (Python - Backend)

**Context7 ID:** `/jazzband/geojson`  
**Reputação:** Alta | **Snippets:** 26  
**Descrição:** Bindings Python para GeoJSON com serialização/deserialização

### Instalação

```bash
pip install geojson
```

### Criar Point

```python
import geojson

my_point = geojson.Point((43.24, -1.532))
dump = geojson.dumps(my_point, sort_keys=True)
# '{"coordinates": [43.24, -1.532], "type": "Point"}'
```

### Criar FeatureCollection

```python
from geojson import Feature, Point, FeatureCollection

# Criar features individuais
feature1 = Feature(geometry=Point((1.6432, -19.123)))
feature2 = Feature(geometry=Point((-80.234, -22.532)))

# Criar collection
feature_collection = FeatureCollection([feature1, feature2])

# Validar
feature_collection.errors()  # []

# Acessar features
feature_collection[0]
feature_collection['features'][0]
```

### Controlar Precisão de Coordenadas

```python
from geojson import Point

# Padrão: 6 casas decimais
Point((-115.123412341234, 37.123412341234))
# {"coordinates": [-115.123412, 37.123412], "type": "Point"}

# Custom precision: 8 casas
Point((-115.12341234, 37.12341234), precision=8)
# {"coordinates": [-115.12341234, 37.12341234], "type": "Point"}
```

### Iterar Coordenadas

```python
import geojson

my_line = geojson.LineString([(-152.62, 51.21), (5.21, 10.69)])
my_feature = geojson.Feature(geometry=my_line)

# Extrair todas as coordenadas
list(geojson.utils.coords(my_feature))
# [(-152.62, 51.21), (5.21, 10.69)]
```

### Transformar Coordenadas

```python
import geojson

# Dividir todas as coordenadas por 2
new_point = geojson.utils.map_coords(
    lambda x: x/2, 
    geojson.Point((-115.81, 37.24))
)

geojson.dumps(new_point, sort_keys=True)
# '{"coordinates": [-57.905, 18.62], "type": "Point"}'
```

### 🇧🇷 Exemplo: Gerar GeoJSON de Estados Brasileiros

```python
from geojson import Feature, Point, FeatureCollection
from apps.churches.models import Church
from django.db.models import Count

def generate_brazil_states_geojson():
    """Gera GeoJSON com dados dos estados brasileiros"""
    
    # Agregar dados por estado
    states_data = Church.objects.values('state').annotate(
        churches_count=Count('id'),
        total_users=Count('users', distinct=True)
    )
    
    features = []
    for state in states_data:
        # Coordenadas do centróide do estado
        coords = get_state_coordinates(state['state'])
        
        feature = Feature(
            geometry=Point((coords['lng'], coords['lat'])),
            properties={
                'state_code': state['state'],
                'state_name': get_state_full_name(state['state']),
                'churches_count': state['churches_count'],
                'total_users': state['total_users'],
            }
        )
        features.append(feature)
    
    return FeatureCollection(features)
```

### Integrar Classes Customizadas

```python
import geojson

class MyPoint():
    def __init__(self, x, y):
        self.x = x
        self.y = y

    @property
    def __geo_interface__(self):
        return {'type': 'Point', 'coordinates': (self.x, self.y)}

point_instance = MyPoint(52.235, -19.234)
geojson.dumps(point_instance, sort_keys=True)
# '{"coordinates": [52.235, -19.234], "type": "Point"}'
```

---

## 🎯 Recomendação Final

### Para o Mapa do Brasil no Dashboard Super Admin

**Opção Escolhida: SVG Puro (sem biblioteca adicional)**

#### Justificativa:
1. ✅ **Zero dependências adicionais** - não aumenta bundle
2. ✅ **Máximo controle sobre styling** - integração perfeita com Tailwind
3. ✅ **Performance superior** - renderização direta de SVG
4. ✅ **Consistência visual** - segue o mesmo padrão dos gráficos Recharts
5. ✅ **Customização total** - podemos criar exatamente a UX desejada

#### Implementação Recomendada:

```tsx
// 1. Arquivo de dados geográficos
// src/lib/geo-data.ts
export interface BrazilStateGeo {
  code: string;
  name: string;
  region: string;
  path: string; // SVG path obtido de GeoJSON
  centroid: { lat: number; lng: number };
}

export const brazilStatesGeoJSON: BrazilStateGeo[] = [
  {
    code: 'SP',
    name: 'São Paulo',
    region: 'Sudeste',
    path: 'M 650 580 L 680 590...',  // Path SVG do estado
    centroid: { lat: -23.5505, lng: -46.6333 }
  },
  // ... outros 26 estados
];

// 2. Componente do mapa
// src/components/platform-admin/BrazilMapChart.tsx
export function BrazilMapChart({ data, onStateClick }: Props) {
  return (
    <svg viewBox="0 0 1000 800" className="w-full h-auto">
      {brazilStatesGeoJSON.map((state) => {
        const stateData = data.find(d => d.code === state.code);
        return (
          <path
            key={state.code}
            d={state.path}
            fill={getStateColor(stateData?.churches_count)}
            stroke="#ffffff"
            className="cursor-pointer hover:opacity-80"
            onClick={() => onStateClick(state.code)}
          />
        );
      })}
    </svg>
  );
}
```

### Conversão GeoJSON → SVG

Use ferramenta Node.js para converter uma única vez:

```bash
npm install -D geojson2svg topojson
```

```javascript
// scripts/convert-geojson-to-svg.js
const geojson2svg = require('geojson2svg');
const fs = require('fs');

const statesGeoJSON = require('../data/brazil-states.json');

const converter = geojson2svg({
  viewportSize: { width: 1000, height: 800 },
  mapExtent: {
    left: -73.98,
    bottom: -33.75,
    right: -34.79,
    top: 5.27
  }
});

const svgPaths = statesGeoJSON.features.map(feature => ({
  code: feature.properties.sigla,
  name: feature.properties.nome,
  path: converter.convert(feature),
  centroid: feature.properties.centroid
}));

fs.writeFileSync(
  'src/lib/geo-data.ts',
  `export const brazilStatesGeoJSON = ${JSON.stringify(svgPaths, null, 2)};`
);
```

---

## 📚 Recursos Adicionais

### Dados Geográficos do Brasil
- **TopoJSON Brasil:** https://github.com/tbrugz/geodata-br
- **GeoJSON Brasil:** https://github.com/fititnt/gis-dataset-brasil
- **IBGE Malhas:** https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/

### Ferramentas
- **geojson.io:** Editor visual de GeoJSON
- **Mapshaper:** Simplificar e converter TopoJSON/GeoJSON
- **QGIS:** Software GIS completo para processamento

---

**✅ Documento pronto para consulta durante implementação!**
