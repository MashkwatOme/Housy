import { useRef, useState } from 'react';
import './VideoWalkthrough.css';

const VideoWalkthrough = ({ walkthrough, propertyTitle = 'Property' }) => {
    const videoRef = useRef(null);
    const markers = [...(walkthrough?.markers || [])].sort((a, b) => Number(a.time_seconds) - Number(b.time_seconds));
    const [activeIndex, setActiveIndex] = useState(0);
    if (!walkthrough?.video_url || markers.length < 2) return null;

    const goTo = index => {
        const next = Math.max(0, Math.min(index, markers.length - 1));
        setActiveIndex(next);
        if (videoRef.current) { videoRef.current.currentTime = Number(markers[next].time_seconds) || 0; videoRef.current.play().catch(() => {}); }
    };

    return <section className="content-section video-walkthrough-section">
        <div className="video-walkthrough-heading"><div><h2>Video Walkthrough</h2><p>Move between rooms using the navigation controls.</p></div><span>{activeIndex + 1} of {markers.length}</span></div>
        <div className="video-walkthrough-stage">
            <video ref={videoRef} src={walkthrough.video_url} controls playsInline preload="metadata" aria-label={`${propertyTitle} video walkthrough`} />
            <div className="current-room-badge">{markers[activeIndex].label}</div>
            <button type="button" className="walkthrough-nav previous" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0}><strong>←</strong><span>{activeIndex ? markers[activeIndex - 1].label : 'Start'}</span></button>
            <button type="button" className="walkthrough-nav next" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === markers.length - 1}><strong>→</strong><span>{activeIndex < markers.length - 1 ? markers[activeIndex + 1].label : 'End'}</span></button>
        </div>
        <div className="walkthrough-room-list">{markers.map((marker, index) => <button type="button" key={`${marker.time_seconds}-${index}`} className={index === activeIndex ? 'active' : ''} onClick={() => goTo(index)}>{marker.label}</button>)}</div>
    </section>;
};

export default VideoWalkthrough;
