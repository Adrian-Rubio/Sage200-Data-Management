import React, { useState } from 'react';

/**
 * slides: Array of {
 *   title: string,
 *   render: () => ReactNode,
 *   headerRight?: ReactNode
 * }
 * containerHeightClass: string (default: 'h-[650px]')
 */
export function ChartCarousel({ slides = [], containerHeightClass = 'h-[650px]' }) {
    const [carouselIndex, setCarouselIndex] = useState(0);

    if (!slides || slides.length === 0) return null;

    const currentSlide = slides[carouselIndex];

    const prevSlide = (e) => {
        e.stopPropagation();
        setCarouselIndex(prev => (prev - 1 + slides.length) % slides.length);
    };

    const nextSlide = (e) => {
        e.stopPropagation();
        setCarouselIndex(prev => (prev + 1) % slides.length);
    };

    return (
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 ${containerHeightClass} relative group overflow-hidden transition-colors flex flex-col animate-fadeIn`}>
            {/* Dots navigation in center */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-3 z-10 bg-slate-50 dark:bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700/50 shadow-sm transition-colors">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCarouselIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'bg-slate-800 dark:bg-slate-200 w-8' : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-500'}`}
                    />
                ))}
            </div>

            {/* Slide Index indicator */}
            <div className="absolute top-4 right-8 flex items-center gap-4">
                {currentSlide.headerRight && (
                    <div className="hidden sm:block">
                        {currentSlide.headerRight}
                    </div>
                )}
                <div className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-colors">
                    {carouselIndex + 1} / {slides.length}
                </div>
            </div>

            {/* Slide Content */}
            <div className="w-full h-full pt-10 flex flex-col flex-1">
                {currentSlide.title && (
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 text-center mb-4 transition-colors">
                        {currentSlide.title}
                    </h3>
                )}
                <div className="flex-1 w-full min-h-0">
                    {currentSlide.render()}
                </div>
            </div>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-all border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-all border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-300"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
}
