import { useState } from 'react';
import { SalesByRepChart } from './SalesByRepChart';
import { SalesByDayChart } from './SalesByDayChart';
import { SalesMarginEvolutionChart } from './SalesMarginEvolutionChart';

export function DashboardCarousel({ salesByRepData, salesByDayData, marginEvolutionData }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const slides = [
        {
            id: 'rep',
            title: 'Facturación por Comercial',
            component: <SalesByRepChart data={salesByRepData} isEmbed={true} />
        },
        {
            id: 'day',
            title: 'Facturación por Día',
            component: <SalesByDayChart data={salesByDayData} isEmbed={true} />
        },
        {
            id: 'margin',
            title: 'Evolución de Margen',
            component: <SalesMarginEvolutionChart data={marginEvolutionData} isEmbed={true} />
        }
    ];

    const nextSlide = () => setActiveIndex((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="relative w-full h-full group">
            {/* Content Area */}
            <div className="w-full h-full pt-12">
                {slides[activeIndex].component}
            </div>

            {/* Navigation Dots (Moved to Top to avoid Legend overlap) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 z-10 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeIndex ? 'bg-slate-800 w-8' : 'bg-slate-300 hover:bg-slate-400'
                            }`}
                        title={slides[idx].title}
                    />
                ))}
            </div>

            {/* Arrows */}
            <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-600"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-600"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>

            {/* Slide Label (Floating) */}
            <div className="absolute top-4 right-4 bg-slate-800/10 backdrop-blur-sm text-slate-800 text-[10px] font-bold uppercase tracking-tighter px-2 py-1 rounded border border-slate-800/20">
                {activeIndex + 1} / {slides.length}
            </div>
        </div>
    );
}
