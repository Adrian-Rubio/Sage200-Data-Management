import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const GEO_URL = '/geo/world-countries.json';

// SAGE (ISO2) -> Map (Name in GeoJSON or ISO3)
const countryCodeMap = {
    'TR': 'Turkey', 'PE': 'Peru', 'DE': 'Germany', 'IN': 'India', 'CL': 'Chile',
    'NO': 'Norway', 'SG': 'Singapore', 'VG': 'British Virgin Islands', 'LU': 'Luxembourg', 'FI': 'Finland',
    'FR': 'France', 'IT': 'Italy', 'PT': 'Portugal', 'GB': 'United Kingdom', 'US': 'United States of America',
    'CN': 'China', 'MA': 'Morocco', 'DZ': 'Algeria', 'TN': 'Tunisia', 'MX': 'Mexico', 'BR': 'Brazil',
    'AR': 'Argentina', 'SE': 'Sweden', 'NL': 'Netherlands', 'BE': 'Belgium', 'UY': 'Uruguay', 'CO': 'Colombia',
    'CH': 'Switzerland', 'PL': 'Poland', 'IE': 'Ireland', 'CZ': 'Czech Rep.', 'RO': 'Romania', 'GR': 'Greece'
};

// ISO3 -> ISO2 for mapping GeoJSON features back to SAGE data
const iso3ToIso2 = {
    'TUR': 'TR', 'PER': 'PE', 'DEU': 'DE', 'IND': 'IN', 'CHL': 'CL', 'NOR': 'NO', 'SGP': 'SG',
    'LUX': 'LU', 'FIN': 'FI', 'FRA': 'FR', 'ITA': 'IT', 'PRT': 'PT', 'GBR': 'GB', 'USA': 'US',
    'CHN': 'CN', 'MEX': 'MX', 'BRA': 'BR', 'ARG': 'AR', 'SWE': 'SE', 'NLD': 'NL', 'BEL': 'BE',
    'URY': 'UY', 'COL': 'CO', 'CHE': 'CH', 'POL': 'PL', 'IRL': 'IE', 'CZE': 'CZ', 'ROU': 'RO',
    'GRC': 'GR', 'MAR': 'MA', 'DZA': 'DZ', 'TUN': 'TN'
};

const spanishCountryNames = {
    'Turkey': 'Turquía', 'Peru': 'Perú', 'Germany': 'Alemania', 'India': 'India', 'Chile': 'Chile',
    'Norway': 'Noruega', 'Singapore': 'Singapur', 'British Virgin Islands': 'Islas Vírgenes Británicas',
    'Luxembourg': 'Luxemburgo', 'Finland': 'Finlandia', 'France': 'Francia', 'Italy': 'Italia',
    'Portugal': 'Portugal', 'United Kingdom': 'Reino Unido', 'United States of America': 'EE.UU.',
    'China': 'China', 'Morocco': 'Marruecos', 'Algeria': 'Argelia', 'Tunisia': 'Túnez', 'Mexico': 'México',
    'Brazil': 'Brasil', 'Argentina': 'Argentina', 'Sweden': 'Suecia', 'Netherlands': 'Países Bajos',
    'Belgium': 'Bélgica', 'Uruguay': 'Uruguay', 'Colombia': 'Colombia', 'Switzerland': 'Suiza',
    'Poland': 'Polonia', 'Ireland': 'Irlanda', 'Czech Rep.': 'República Checa', 'Romania': 'Rumanía',
    'Greece': 'Grecia'
};

export default function WorldMap({ data = [], onRegionClick }) {
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
            const key = (d.region || "").toUpperCase();
            map[key] = d;
        });
        return map;
    }, [data]);

    return (
        <div className="w-full h-full bg-slate-50 relative rounded-xl overflow-hidden shadow-inner border border-slate-200">
            <ComposableMap
                projectionConfig={{ scale: 150 }}
                style={{ width: "100%", height: "100%" }}
            >
                <ZoomableGroup center={[10, 20]} zoom={1}>
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                // Match SAGE ISO2 ('MX') with GeoJSON properties
                                const geoName = geo.properties.name;
                                const spanishName = spanishCountryNames[geoName] || geoName;
                                const iso3 = geo.properties.ISO_A3 || geo.id;
                                const iso2 = iso3ToIso2[iso3] || Object.keys(countryCodeMap).find(key => countryCodeMap[key] === geoName);

                                const regionData = dataMap[iso2];
                                const hasData = !!regionData;
                                const revenue = regionData ? regionData.revenue : 0;

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => hasData && onRegionClick(spanishName, regionData)}
                                        style={{
                                            default: {
                                                fill: hasData ? colorScale(revenue) : "#f1f5f9",
                                                stroke: hasData ? "#0369a1" : "#e2e8f0",
                                                strokeWidth: hasData ? 1 : 0.3,
                                                outline: "none",
                                            },
                                            hover: {
                                                fill: hasData ? "#fbbf24" : "#f1f5f9",
                                                stroke: hasData ? "#b45309" : "#e2e8f0",
                                                strokeWidth: hasData ? 2 : 0.3,
                                                outline: "none",
                                                cursor: hasData ? "pointer" : "default"
                                            },
                                            pressed: { fill: "#f59e0b", outline: "none" }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>

                    {/* Labels for active countries */}
                    {geographies =>
                        geographies && geographies.map(geo => {
                            const iso3 = geo.properties.ISO_A3 || geo.id;
                            const iso2 = iso3ToIso2[iso3];
                            const regionData = dataMap[iso2];

                            if (!regionData || regionData.clients === 0) return null;

                            // We'd need centroids for all countries to place markers perfectly.
                            // For now, let's stick to the color highlights or a very limited set.
                            return null;
                        })
                    }
                </ZoomableGroup>
            </ComposableMap>

            <div className="absolute top-4 left-4 pointer-events-none space-y-2">
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-xl w-48">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <div className="w-1.5 h-3 bg-blue-600 rounded-full"></div>
                        Ventas Globales
                    </h4>
                    <div className="space-y-1.5">
                        {data.slice(0, 5).map((d, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-700 truncate mr-2">
                                    {spanishCountryNames[countryCodeMap[d.region]] || d.region}
                                </span>
                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">{d.clients} cl.</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-500 uppercase">Intensidad Ventas</span>
                <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold text-slate-400">0€</span>
                    <div className="w-32 h-1.5 rounded-full bg-gradient-to-r from-[#bae6fd] to-[#0284c7]"></div>
                    <span className="text-[8px] font-bold text-slate-600">{new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(maxRevenue)}€</span>
                </div>
            </div>
        </div>
    );
}
