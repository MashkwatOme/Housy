import { useEffect, useMemo, useState } from 'react';
import './InteractiveWalkthrough.css';

const InteractiveWalkthrough = ({ images = [], propertyTitle = 'Property' }) => {
    const tourImages = useMemo(() => {
        const configured = images.filter(image => Boolean(image.is_tour_enabled));
        const source = configured.length >= 2 ? configured : images;
        return source.slice().sort((a, b) => Number(a.tour_order ?? Number.MAX_SAFE_INTEGER) - Number(b.tour_order ?? Number.MAX_SAFE_INTEGER));
    }, [images]);
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const closeTour = () => { setIsOpen(false); setCurrentIndex(0); };
    const goBack = () => setCurrentIndex(index => Math.max(0, index - 1));
    const goForward = () => setCurrentIndex(index => Math.min(tourImages.length - 1, index + 1));

    useEffect(() => {
        if (!isOpen) return undefined;
        const handleKeyDown = event => {
            if (event.key === 'Escape') closeTour();
            if (event.key === 'ArrowLeft') setCurrentIndex(index => Math.max(0, index - 1));
            if (event.key === 'ArrowRight') setCurrentIndex(index => Math.min(tourImages.length - 1, index + 1));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, tourImages.length]);

    if (tourImages.length < 2) return null;
    const current = tourImages[currentIndex];
    const locationName = (image, index) => image?.location_name || (index === 0 ? 'Entrance' : `Room ${index}`);

    return <section className="walkthrough-section">
        <div><span className="walkthrough-eyebrow">ROOM-TO-ROOM EXPERIENCE</span><h2>Interactive Property Walkthrough</h2><p>Explore the property photographs in walking order using Forward and Back.</p></div>
        <button type="button" className="walkthrough-start-button" onClick={() => setIsOpen(true)}>Start Walkthrough →</button>
        {isOpen && <div className="walkthrough-modal" role="dialog" aria-modal="true" aria-label={`${propertyTitle} interactive walkthrough`} onClick={closeTour}>
            <div className="walkthrough-viewer" onClick={event => event.stopPropagation()}>
                <div className="walkthrough-topbar"><div><strong>{propertyTitle}</strong><span>{currentIndex + 1} of {tourImages.length}</span></div><button type="button" onClick={closeTour} aria-label="Close walkthrough">×</button></div>
                <div className="walkthrough-image-stage"><img key={current.id} src={current.image_url} alt={locationName(current, currentIndex)} /><div className="walkthrough-location-label">{locationName(current, currentIndex)}</div><button type="button" className="photo-walkthrough-nav walkthrough-back" onClick={goBack} disabled={currentIndex === 0} aria-label="Go to previous location"><span>←</span><small>{currentIndex > 0 ? locationName(tourImages[currentIndex - 1], currentIndex - 1) : 'Start'}</small></button><button type="button" className="photo-walkthrough-nav walkthrough-forward" onClick={goForward} disabled={currentIndex === tourImages.length - 1} aria-label="Go to next location"><span>→</span><small>{currentIndex < tourImages.length - 1 ? locationName(tourImages[currentIndex + 1], currentIndex + 1) : 'End'}</small></button></div>
                <div className="walkthrough-progress" aria-label="Walkthrough progress">{tourImages.map((image, index) => <button type="button" key={image.id} className={index === currentIndex ? 'active' : ''} onClick={() => setCurrentIndex(index)} aria-label={`Go to ${locationName(image, index)}`} />)}</div>
            </div>
        </div>}
    </section>;
};

export default InteractiveWalkthrough;
