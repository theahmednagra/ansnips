import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ImageCarousel Component - Fixed Height Version
 * Instagram-style image carousel with consistent height
 * Prevents layout shift when swiping between images
 * 
 * @param {Array} images - Array of image URLs
 * @param {string} alt - Alt text for images
 * @param {Function} onImageClick - Callback when image is clicked
 */
const ImageCarousel = ({ images, alt = "Post image", onImageClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [containerHeight, setContainerHeight] = useState(null);
    const [imagesLoaded, setImagesLoaded] = useState({});
    const carouselRef = useRef(null);
    const imageRefs = useRef([]);

    const minSwipeDistance = 50;

    /**
     * Calculate max height from all images
     */
    useEffect(() => {
        if (images.length === 0) return;

        const loadImage = (src, index) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const aspectRatio = img.height / img.width;
                    const containerWidth = carouselRef.current?.offsetWidth || window.innerWidth;
                    const calculatedHeight = Math.min(aspectRatio * containerWidth, 540); // max-h-135 = 540px
                    resolve({ index, height: calculatedHeight });
                };
                img.onerror = () => resolve({ index, height: 400 }); // fallback height
                img.src = src;
            });
        };

        Promise.all(images.map((src, index) => loadImage(src, index)))
            .then((results) => {
                const heights = results.map(r => r.height);
                const maxHeight = Math.max(...heights);
                setContainerHeight(maxHeight);

                // Mark all images as loaded
                const loaded = {};
                results.forEach(r => loaded[r.index] = true);
                setImagesLoaded(loaded);
            });
    }, [images]);

    /**
     * Preload next and previous images
     */
    useEffect(() => {
        if (images.length <= 1) return;

        const preloadImage = (index) => {
            if (index >= 0 && index < images.length && !imagesLoaded[index]) {
                const img = new Image();
                img.src = images[index];
            }
        };

        if (currentIndex < images.length - 1) {
            preloadImage(currentIndex + 1);
        }
        if (currentIndex > 0) {
            preloadImage(currentIndex - 1);
        }
    }, [currentIndex, images, imagesLoaded]);

    /**
     * Keyboard navigation
     */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                e.stopPropagation();
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                e.stopPropagation();
                goToNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    const goToNext = () => {
        if (currentIndex < images.length - 1) {
            setDirection(1);
            setCurrentIndex(prev => prev + 1);
        }
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            setDirection(-1);
            setCurrentIndex(prev => prev - 1);
        }
    };

    const goToSlide = (index) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
    };

    // Touch handlers
    const onTouchStart = (e) => {
        setTouchEnd(0);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            goToNext();
        } else if (isRightSwipe) {
            goToPrevious();
        }
    };

    // Animation variants
    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    // Single image
    if (images.length === 1) {
        return (
            <div
                className="relative w-full bg-gray-50 dark:bg-zinc-950 cursor-pointer"
                onClick={onImageClick}
            >
                <img
                    src={images[0]}
                    alt={alt}
                    className="w-full h-full max-h-135 object-contain"
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div
            ref={carouselRef}
            className="relative w-full bg-gray-50 dark:bg-zinc-950 select-none overflow-hidden"
            style={{ height: containerHeight }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Images Container */}
            <div className="relative w-full h-full">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.img
                        key={currentIndex}
                        src={images[currentIndex]}
                        alt={`${alt} ${currentIndex + 1}`}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "tween", duration: 0.3 },
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute inset-0 w-full h-full max-h-135 object-contain cursor-pointer"
                        onClick={onImageClick}
                        loading="lazy"
                        draggable={false}
                    />
                </AnimatePresence>
            </div>

            {/* Navigation Arrows - Desktop */}
            {images.length > 1 && (
                <>
                    {currentIndex > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrevious();
                            }}
                            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-zinc-700 transition-all active:scale-95"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-white mr-0.5" />
                        </button>
                    )}

                    {currentIndex < images.length - 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNext();
                            }}
                            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-zinc-700 transition-all active:scale-95"
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-900 dark:text-white ml-0.5" />
                        </button>
                    )}
                </>
            )}

            {/* Dot Indicators */}
            {images.length > 1 && (
                <div className=" absolute bottom-2 left-1/2 -translate-x-1/2 z-10  flex gap-1.5 px-3 py-1.5 rounded-full bg-black/20 dark:bg-black/30 backdrop-blur-md">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                goToSlide(index);
                            }}
                            className={`
                                transition-all duration-300 rounded-full
                                ${index === currentIndex
                                    ? "w-6 h-2 bg-white dark:bg-white shadow-lg"
                                    : "w-2 h-2 bg-white/60 dark:bg-white/60"
                                }
                            `}
                        />
                    ))}
                </div>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
                <div className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
};

export default ImageCarousel;
