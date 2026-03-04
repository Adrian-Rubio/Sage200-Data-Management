import { useState } from 'react';
import { InventoryEvolutionChart } from './InventoryEvolutionChart';
import { InventoryDivisionsChart } from './InventoryDivisionsChart';

export function InventoryCarousel({ evolutionData, divisionsData }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const slides = [
        {
            id: 'divisions',
            title: 'Stock por División',
            component: <InventoryDivisionsChart data={divisionsData} isEmbed={true} />
        },
        {
            id: 'evolution',
            title: 'Histórico de valor',
            component: <InventoryEvolutionChart data={evolutionData} isEmbed={true} />
        }
    ];

    const nextSlide = () => setActiveIndex((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="relative w-full h-full group">
            <div className="absolute top-2 left-4 z-10 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                    {slides[activeIndex].title}
                </h3>
            </div>

            <div className="h-full pt-16">
                {slides[activeIndex].component}
            </div>

            <button
                onClick={prevSlide}
                className="absolute left-1 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 border border-slate-100 shadow-lg text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 border border-slate-100 shadow-lg text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {slides.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-200'}`}
                    />
                ))}
            </div>
        </div>
    );
}
