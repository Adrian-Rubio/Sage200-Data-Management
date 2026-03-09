import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const GEO_URL = '/geo/world-countries.json';

// Mapping ISO2 (from SAGE) to ISO3 (often in world maps)
// Note: The downloaded GeoJSON uses ISO3 IDs or name properties. 
// We will match by name if ID is missing or ambiguous.
const countryCodeMap = {
    'TR': 'Turkey', 'PE': 'Peru', 'DE': 'Germany', 'IN': 'India', 'CL': 'Chile',
    'NO': 'Norway', 'SG': 'Singapore', 'VG': 'British Virgin Islands', 'LU': 'Luxembourg', 'FI': 'Finland',
    'FR': 'France', 'IT': 'Italy', 'PT': 'Portugal', 'GB': 'United Kingdom', 'US': 'United States of America',
    'CN': 'China', 'MA': 'Morocco', 'DZ': 'Algeria', 'TN': 'Tunisia', 'MX': 'Mexico'
};

export default function WorldMap({ data = [], onRegionClick }) {
    // data structure: [{ region: 'DE', revenue: 100 }, ...]

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
            const key = (d.region || "").toUpperCase();
            map[key] = d;
        });
        return map;
    }, [data]);

    return (
        <div className="w-full h-full bg-slate-50/50 rounded-lg overflow-hidden border border-slate-100">
            <ComposableMap
                projectionConfig={{ scale: 140 }}
                style={{ width: "100%", height: "100%" }}
            >
                <ZoomableGroup center={[10, 20]} zoom={1.2}>
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                // Match by Name or ID if possible. SAGE uses ISO2. 
                                // We'll look up the ISO2 from our map if we find the country name.
                                const geoName = geo.properties.name;
                                const countryCode = Object.keys(countryCodeMap).find(key => countryCodeMap[key] === geoName) || geo.id;

                                const regionData = dataMap[countryCode];
                                const revenue = regionData ? regionData.revenue : 0;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => onRegionClick(geoName, regionData)}
                                        style={{
                                            default: {
                                                fill: colorScale(revenue),
                                                stroke: "#cbd5e1",
                                                strokeWidth: 0.3,
                                                outline: "none",
                                                transition: "all 250ms"
                                            },
                                            hover: {
                                                fill: "#fbbf24",
                                                stroke: "#f59e0b",
                                                strokeWidth: 0.5,
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

            <div className="absolute bottom-4 left-4 flex flex-col gap-1 bg-white/80 backdrop-blur-sm p-2 rounded border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Ventas Internacionales</span>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#1e40af]"></div>
                    <span className="text-[9px] text-slate-600 font-medium">Máximo: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(maxRevenue)}</span>
                </div>
            </div>
        </div>
    );
}
