import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const GEO_URL = '/geo/spain-provinces.json';

// Mapping for normalization (Backend often has accents or uppercase differences)
const normalizeName = (name) => {
    if (!name) return "";
    return name.toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace("A CORUNA", "A CORUÑA") // Keep common SAGE spellings if needed
        .trim();
};

export default function SpainMap({ data = [], onRegionClick }) {
    // data structure: [{ region: 'MÁLAGA', revenue: 100 }, ...]

    const maxRevenue = useMemo(() => {
        if (data.length === 0) return 1;
        return Math.max(...data.map(d => d.revenue));
    }, [data]);

    const colorScale = useMemo(() => {
        return scaleLinear()
            .domain([0, maxRevenue * 0.1, maxRevenue])
            .range(["#f1f5f9", "#93c5fd", "#1e40af"]);
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
        <div className="w-full h-full bg-slate-50/50 rounded-lg overflow-hidden border border-slate-100">
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 2500,
                    center: [-3, 40]
                }}
                style={{ width: "100%", height: "100%" }}
            >
                <ZoomableGroup center={[-3, 40]} zoom={1}>
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const geoName = normalizeName(geo.properties.name);
                                const regionData = dataMap[geoName];
                                const revenue = regionData ? regionData.revenue : 0;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => onRegionClick(geo.properties.name, regionData)}
                                        style={{
                                            default: {
                                                fill: colorScale(revenue),
                                                stroke: "#cbd5e1",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                                transition: "all 250ms"
                                            },
                                            hover: {
                                                fill: "#fbbf24",
                                                stroke: "#f59e0b",
                                                strokeWidth: 1,
                                                outline: "none",
                                                cursor: "pointer"
                                            },
                                            pressed: {
                                                fill: "#d97706",
                                                outline: "none"
                                            }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-1 bg-white/80 backdrop-blur-sm p-2 rounded border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Volumen Ventas</span>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#f1f5f9] border border-slate-200"></div>
                    <span className="text-[9px] text-slate-600 font-medium">Sin ventas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#1e40af]"></div>
                    <span className="text-[9px] text-slate-600 font-medium">Máximo: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(maxRevenue)}</span>
                </div>
            </div>
        </div>
    );
}
