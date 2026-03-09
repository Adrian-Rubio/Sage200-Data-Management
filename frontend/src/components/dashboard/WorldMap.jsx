import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const GEO_URL = '/geo/world-countries.json';

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

const countryCodeMap = {
    'TR': 'Turkey', 'PE': 'Peru', 'DE': 'Germany', 'IN': 'India', 'CL': 'Chile',
    'NO': 'Norway', 'SG': 'Singapore', 'VG': 'British Virgin Islands', 'LU': 'Luxembourg', 'FI': 'Finland',
    'FR': 'France', 'IT': 'Italy', 'PT': 'Portugal', 'GB': 'United Kingdom', 'US': 'United States of America',
    'CN': 'China', 'MA': 'Morocco', 'DZ': 'Algeria', 'TN': 'Tunisia', 'MX': 'Mexico', 'BR': 'Brazil',
    'AR': 'Argentina', 'SE': 'Sweden', 'NL': 'Netherlands', 'BE': 'Belgium', 'UY': 'Uruguay', 'CO': 'Colombia',
    'CH': 'Switzerland', 'PL': 'Poland', 'IE': 'Ireland', 'CZ': 'Czech Rep.', 'RO': 'Romania', 'GR': 'Greece'
};

export default function WorldMap({ data = [], onRegionClick }) {
    const maxRevenue = useMemo(() => {
        if (data.length === 0) return 1;
        return Math.max(...data.map(d => d.revenue));
    }, [data]);

    const colorScale = useMemo(() => {
        return scaleLinear()
            .domain([0, maxRevenue * 0.2, maxRevenue])
            .range(["#fdfaff", "#818cf8", "#4338ca"]);
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
        <div className="w-full h-full bg-[#f8fafc] relative rounded-2xl overflow-hidden shadow-inner border border-slate-200">
            <ComposableMap
                projectionConfig={{ scale: 155 }}
                style={{ width: "100%", height: "100%" }}
            >
                <ZoomableGroup center={[10, 20]} zoom={1}>
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
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
                                                fill: hasData ? colorScale(revenue) : "#ffffff",
                                                stroke: hasData ? "#312e81" : "#e2e8f0",
                                                strokeWidth: hasData ? 1.5 : 0.5,
                                                outline: "none",
                                            },
                                            hover: {
                                                fill: hasData ? "#ec4899" : "#ffffff",
                                                stroke: hasData ? "#9d174d" : "#e2e8f0",
                                                strokeWidth: 2,
                                                outline: "none",
                                                cursor: hasData ? "pointer" : "default"
                                            },
                                            pressed: { fill: "#db2777", outline: "none" }
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            <div className="absolute top-6 left-6 pointer-events-none space-y-2">
                <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl border border-white/40 shadow-2xl w-56 flex flex-col gap-3">
                    <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-[0.1em] flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Ventas Globales
                    </h4>
                    <div className="space-y-2">
                        {data.slice(0, 5).map((d, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <span className="text-[11px] font-bold text-slate-700 truncate mr-2">
                                    {spanishCountryNames[countryCodeMap[d.region]] || d.region}
                                </span>
                                <span className="text-[10px] font-black text-white bg-indigo-600 px-2 py-0.5 rounded-full shadow-sm">
                                    {d.clients}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

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
