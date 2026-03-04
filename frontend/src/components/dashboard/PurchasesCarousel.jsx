import { useState } from 'react';
import { PurchasesEvolutionChart } from './PurchasesEvolutionChart';
import { TopProvidersChart } from './TopProvidersChart';
import { TopArticlesChart } from './TopArticlesChart';
import { TopSubfamiliesChart } from './TopSubfamiliesChart';
import TopDivisionsChart from './TopDivisionsChart';

export function PurchasesCarousel({ evolutionData, providersData, articlesData, subfamiliesData, divisionsData, repsData }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const slides = [
        {
            id: 'divisions',
            title: 'Compras por División',
            component: <TopDivisionsChart data={divisionsData} isEmbed={true} />
        },
        {
            id: 'evolution',
            title: 'Evolución de Compras',
            component: <PurchasesEvolutionChart data={evolutionData} isEmbed={true} />
        },
        {
            id: 'providers',
            title: 'Top Proveedores',
            component: <TopProvidersChart data={providersData} isEmbed={true} />
        },
        {
            id: 'articles',
            title: 'Top Artículos',
            component: <TopArticlesChart data={articlesData} isEmbed={true} />
        },
        {
            id: 'subfamilies',
            title: 'Top Subfamilias',
            component: <TopSubfamiliesChart data={subfamiliesData} isEmbed={true} />
        }
    ];

    const nextSlide = () => setActiveIndex((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <div className="relative w-full h-full group">
            {/* Header Area for Carousel */}
            <div className="absolute top-2 left-4 z-10">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-tighter flex items-center gap-2">
                    <div className={`w-1.5 h-3 rounded-full ${activeIndex === 0 ? 'bg-indigo-500' :
                        activeIndex === 1 ? 'bg-emerald-500' :
                            activeIndex === 2 ? 'bg-amber-500' : 'bg-red-500'
                        }`}></div>
                    {slides[activeIndex].title}
                </h3>
            </div>

            {/* Content Area */}
            <div className="w-full h-full pt-10">
                {slides[activeIndex].component}
            </div>

            {/* Navigation Dots */}
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
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 z-20"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 z-20"
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
