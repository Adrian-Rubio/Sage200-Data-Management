import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const GEO_URL = '/geo/spain-provinces.json';

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
            .domain([0, maxRevenue * 0.2, maxRevenue])
            .range(["#fdfaff", "#818cf8", "#4338ca"]); // De lavanda a índigo intenso
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
        <div className="w-full h-full bg-[#f8fafc] relative rounded-2xl overflow-hidden shadow-inner border border-slate-200">
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
                                                fill: hasData ? colorScale(revenue) : "#ffffff",
                                                stroke: hasData ? "#312e81" : "#e2e8f0",
                                                strokeWidth: hasData ? 1.5 : 0.5,
                                                outline: "none",
                                            },
                                            hover: {
                                                fill: "#ec4899", // Rosa neón al pasar el ratón (muy intuitivo)
                                                stroke: "#9d174d",
                                                strokeWidth: 2.5,
                                                outline: "none",
                                                cursor: "pointer"
                                            },
                                            pressed: { fill: "#db2777", outline: "none" }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {data.filter(d => d.clients > 0).map((d) => {
                        const key = normalizeName(d.region);
                        const coords = provinceCentroids[key];
                        if (!coords) return null;

                        return (
                            <Marker key={key} coordinates={coords}>
                                <g transform="translate(-10, -10)">
                                    <rect
                                        x="-4" y="-14"
                                        width={d.region.length * 5 + 35} height="20"
                                        rx="10"
                                        fill="white" fillOpacity="0.95"
                                        stroke="#4338ca" strokeWidth="1.5"
                                        className="shadow-sm"
                                    />
                                    <text
                                        textAnchor="start"
                                        x="4"
                                        y="0"
                                        style={{
                                            fontFamily: "Inter, system-ui",
                                            fontSize: "9px",
                                            fontWeight: "900",
                                            fill: "#1e1b4b",
                                            letterSpacing: "-0.2px"
                                        }}
                                    >
                                        {d.region} <tspan fill="#6366f1">({d.clients})</tspan>
                                    </text>
                                </g>
                            </Marker>
                        );
                    })}
                </ZoomableGroup>
            </ComposableMap>

            {/* Ranking con diseño Premium */}
            <div className="absolute top-6 left-6 pointer-events-none">
                <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white/40 shadow-2xl w-56 flex flex-col gap-3">
                    <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-[0.1em] flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Top Provincias
                    </h4>
                    <div className="space-y-2">
                        {data.slice(0, 5).map((d, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <span className="text-[11px] font-bold text-slate-700">{d.region}</span>
                                <span className="text-[10px] font-black text-white bg-indigo-600 px-2 py-0.5 rounded-full shadow-sm">
                                    {d.clients}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leyenda Inteligente */}
            <div className="absolute bottom-6 right-6 bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white/40 shadow-2xl flex flex-col gap-2">
                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider">Flujo de Ventas</span>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-slate-400">0€</span>
                    <div className="w-36 h-2 rounded-full bg-gradient-to-r from-[#818cf8] to-[#4338ca] shadow-inner"></div>
                    <span className="text-[9px] font-extrabold text-indigo-800">{new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(maxRevenue)}€</span>
                </div>
            </div>
        </div>
    );
}
