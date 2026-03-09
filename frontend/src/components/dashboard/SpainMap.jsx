import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const GEO_URL = '/geo/spain-provinces.json';

// Coordenadas aproximadas para los nombres de las provincias (centros)
const provinceCentroids = {
    "MALAGA": [-4.42, 36.72], "MADRID": [-3.70, 40.41], "BARCELONA": [2.17, 41.38],
    "VALENCIA": [-0.37, 39.46], "SEVILLA": [-5.98, 37.38], "ZARAGOZA": [-0.88, 41.64],
    "MURCIA": [-1.13, 37.98], "CORUNA": [-8.41, 43.36], "BIZKAIA": [-2.93, 43.26],
    "ALICANTE": [-0.48, 38.34], "CADIZ": [-6.29, 36.52], "PONTEVEDRA": [-8.64, 42.43],
    "ASTURIAS": [-5.84, 43.36], "GRANADA": [-3.60, 37.17], "TENERIFE": [-16.25, 28.46],
    "PALMAS": [-15.41, 28.12], "ALMERIA": [-2.46, 36.83], "GUIPUZCOA": [-1.98, 43.31],
    "GIRONA": [2.82, 41.97], "TARRAGONA": [1.24, 41.11], "CORDOBA": [-4.77, 37.88],
    "BALEARES": [2.65, 39.56], "VALLADOLID": [-4.72, 41.65], "TOLEDO": [-4.02, 39.86],
    "BADAJOZ": [-6.97, 38.87], "NAVARRA": [-1.64, 42.81], "CANTABRIA": [-3.80, 43.46],
    "CASTELLON": [-0.04, 39.98], "HUELVA": [-6.94, 37.26], "JAEN": [-3.78, 37.77],
    "LEON": [-5.56, 42.59], "LLEIDA": [0.62, 41.61], "CACERES": [-6.37, 39.47],
    "ALAVA": [-2.67, 42.84], "LOGRONO": [-2.44, 42.46], "LUGO": [-7.55, 43.01],
    "OURENSE": [-7.86, 42.33], "BURGOS": [-3.70, 42.34], "SALAMANCA": [-5.66, 40.96],
    "ALBACETE": [-1.85, 38.99], "CUENCA": [-2.13, 40.07], "ZAMORA": [-5.74, 41.50],
    "PALENCIA": [-4.52, 42.01], "AVILA": [-4.69, 40.65], "SEGOVIA": [-4.11, 40.94],
    "SORIA": [-2.46, 41.76], "GUADALAJARA": [-3.16, 40.62], "TERUEL": [-1.10, 40.34],
    "HUESCA": [-0.40, 42.13], "CEUTA": [-5.31, 35.88], "MELILLA": [-2.93, 35.29]
};

const normalizeName = (name) => {
    if (!name) return "";
    return name.toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace("A CORUNA", "CORUNA")
        .replace("LAS PALMAS", "PALMAS")
        .replace("STA. CRUZ DE TENERIFE", "TENERIFE")
        .replace("ILLES BALEARS", "BALEARES")
        .replace("ARABA/ALAVA", "ALAVA")
        .replace("GIPUZKOA", "GUIPUZCOA")
        .trim();
};

export default function SpainMap({ data = [], onRegionClick }) {
    const maxRevenue = useMemo(() => {
        if (data.length === 0) return 1;
        return Math.max(...data.map(d => d.revenue));
    }, [data]);

    const colorScale = useMemo(() => {
        return scaleLinear()
            .domain([0, maxRevenue * 0.1, maxRevenue])
            .range(["#f8fafc", "#bae6fd", "#0284c7"]);
    }, [maxRevenue]);

    const dataMap = useMemo(() => {
        const map = {};
        data.forEach(d => {
            const key = normalizeName(d.region);
            map[key] = d;
        });
        return map;
    }, [data]);

    return (
        <div className="w-full h-full bg-slate-50 relative rounded-xl overflow-hidden shadow-inner border border-slate-200">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 3000,
                    center: [-3.5, 40]
                }}
                className="w-full h-full"
            >
                <ZoomableGroup center={[-3, 40]} zoom={1}>
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const geoName = normalizeName(geo.properties.name);
                                const regionData = dataMap[geoName];
                                const hasData = !!regionData;
                                const revenue = regionData ? regionData.revenue : 0;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => onRegionClick(geo.properties.name, regionData)}
                                        style={{
                                            default: {
                                                fill: hasData ? colorScale(revenue) : "#f1f5f9",
                                                stroke: hasData ? "#0369a1" : "#e2e8f0",
                                                strokeWidth: hasData ? 1.5 : 0.5,
                                                outline: "none",
                                            },
                                            hover: {
                                                fill: "#fbbf24",
                                                stroke: "#b45309",
                                                strokeWidth: 2,
                                                outline: "none",
                                                cursor: "pointer"
                                            },
                                            pressed: { fill: "#f59e0b", outline: "none" }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {/* ETIQUETAS DIRECTAS: Sólo para donde hay clientes */}
                    {data.filter(d => d.clients > 0).map((d) => {
                        const key = normalizeName(d.region);
                        const coords = provinceCentroids[key];
                        if (!coords) return null;

                        return (
                            <Marker key={key} coordinates={coords}>
                                <g transform="translate(-10, -10)">
                                    <rect
                                        x="-2" y="-12"
                                        width={d.region.length * 5 + 25} height="16"
                                        rx="8"
                                        fill="white" fillOpacity="0.85"
                                        stroke="#0369a1" strokeWidth="1"
                                    />
                                    <text
                                        textAnchor="start"
                                        y="0"
                                        style={{
                                            fontFamily: "system-ui",
                                            fontSize: "8px",
                                            fontWeight: "900",
                                            fill: "#0c4a6e",
                                            letterSpacing: "-0.2px"
                                        }}
                                    >
                                        {d.region} <tspan fill="#0284c7">({d.clients})</tspan>
                                    </text>
                                </g>
                            </Marker>
                        );
                    })}
                </ZoomableGroup>
            </ComposableMap>

            {/* Panel de ranking rápido a la izquierda */}
            <div className="absolute top-4 left-4 pointer-events-none space-y-2">
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xl w-48">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <div className="w-1.5 h-3 bg-blue-600 rounded-full"></div>
                        Top 5 Provincias
                    </h4>
                    <div className="space-y-1.5">
                        {data.slice(0, 5).map((d, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-700 truncate mr-2">{d.region}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{d.clients} cl.</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leyenda inteligente */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-500 uppercase">Volumen Ventas</span>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-slate-400">0€</span>
                    <div className="w-32 h-1.5 rounded-full bg-gradient-to-r from-[#bae6fd] to-[#0284c7]"></div>
                    <span className="text-[8px] font-bold text-slate-600">{new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(maxRevenue)}€</span>
                </div>
            </div>
        </div>
    );
}
