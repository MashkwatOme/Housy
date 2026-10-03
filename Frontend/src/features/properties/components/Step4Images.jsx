import { useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

const defaultLocationName = index => index === 0 ? 'Entrance' : `Room ${index}`;
const formatTime = seconds => { const safe = Math.max(0, Math.floor(Number(seconds) || 0)); return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`; };

const Step4Images = ({ data, updateData, onPrev, onSubmit, loading }) => {
    const fileInputRef = useRef(null); const videoInputRef = useRef(null); const videoRef = useRef(null);
    const newImageUrls = useMemo(() => (data.files || []).map(file => URL.createObjectURL(file)), [data.files]);
    const videoUrl = useMemo(() => data.walkthrough_video ? URL.createObjectURL(data.walkthrough_video) : null, [data.walkthrough_video]);
    useEffect(() => () => newImageUrls.forEach(url => URL.revokeObjectURL(url)), [newImageUrls]);
    useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

    const allImages = [
        ...(data.existing_images || []).map(img => ({ type: 'existing', imageId: img.id, url: img.image_url, key: img.id })),
        ...(data.files || []).map((file, fileIndex) => ({ type: 'new', fileIndex, url: newImageUrls[fileIndex], key: `${file.name}-${file.size}-${file.lastModified}-${fileIndex}` }))
    ];
    const buildTourConfig = (images = allImages, previous = data.tour_config || []) => images.map((image, index) => {
        const match = image.type === 'existing'
            ? previous.find(item => item.source === 'existing' && item.image_id === image.imageId)
            : previous.find(item => item.source === 'new' && Number(item.file_index) === image.fileIndex);
        return { source: image.type, ...(image.type === 'existing' ? { image_id: image.imageId } : { file_index: image.fileIndex }), location_name: match?.location_name || defaultLocationName(index), tour_order: match?.tour_order ?? index, enabled: true };
    });
    const configuredTour = buildTourConfig().sort((a, b) => Number(a.tour_order) - Number(b.tour_order));
    const activeVideoUrl = videoUrl || (!data.remove_walkthrough_video ? data.existing_walkthrough?.video_url : null);
    const markers = [...(data.walkthrough_markers || [])].sort((a, b) => Number(a.time_seconds) - Number(b.time_seconds));

    const handleFileChange = event => {
        const selectedFiles = Array.from(event.target.files || []); if (!selectedFiles.length) return;
        const nextFiles = [...(data.files || []), ...selectedFiles];
        const nextImages = [...(data.existing_images || []).map(img => ({ type: 'existing', imageId: img.id })), ...nextFiles.map((file, fileIndex) => ({ type: 'new', fileIndex, file }))];
        updateData({ files: nextFiles, tour_config: buildTourConfig(nextImages) }); event.target.value = '';
    };
    const handleRemoveImage = item => {
        if (item.type === 'existing') {
            const remainingExisting = data.existing_images.filter(img => img.id !== item.imageId);
            const nextImages = [...remainingExisting.map(img => ({ type: 'existing', imageId: img.id })), ...(data.files || []).map((file, fileIndex) => ({ type: 'new', fileIndex, file }))];
            updateData({ existing_images: remainingExisting, removed_images: [...(data.removed_images || []), item.url], tour_config: buildTourConfig(nextImages, configuredTour.filter(config => config.image_id !== item.imageId)) });
            return;
        }
        const nextFiles = data.files.filter((_, index) => index !== item.fileIndex);
        const remainingConfig = configuredTour.filter(config => !(config.source === 'new' && Number(config.file_index) === item.fileIndex)).map(config => config.source === 'new' && Number(config.file_index) > item.fileIndex ? { ...config, file_index: Number(config.file_index) - 1 } : config);
        const nextImages = [...(data.existing_images || []).map(img => ({ type: 'existing', imageId: img.id })), ...nextFiles.map((file, fileIndex) => ({ type: 'new', fileIndex, file }))];
        updateData({ files: nextFiles, tour_config: buildTourConfig(nextImages, remainingConfig) });
    };
    const imageForConfig = config => config.source === 'existing' ? allImages.find(image => image.type === 'existing' && image.imageId === config.image_id) : allImages.find(image => image.type === 'new' && image.fileIndex === Number(config.file_index));
    const updateLocationName = (index, locationName) => { const config = configuredTour.map(item => ({ ...item })); config[index].location_name = locationName; updateData({ tour_config: config }); };
    const moveTourPhoto = (index, offset) => { const config = configuredTour.map(item => ({ ...item })); const target = index + offset; if (target < 0 || target >= config.length) return; [config[index], config[target]] = [config[target], config[index]]; updateData({ tour_config: config.map((item, order) => ({ ...item, tour_order: order })) }); };

    const handleVideoChange = event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 100 * 1024 * 1024) { toast.error('The walkthrough video must be 100 MB or smaller.'); event.target.value = ''; return; } updateData({ walkthrough_video: file, remove_walkthrough_video: false, walkthrough_markers: [{ label: 'Entrance', time_seconds: 0 }] }); event.target.value = ''; };
    const removeVideo = () => updateData({ walkthrough_video: null, existing_walkthrough: null, remove_walkthrough_video: true, walkthrough_markers: [] });
    const addMarker = () => { const time = Number((videoRef.current?.currentTime || 0).toFixed(2)); updateData({ walkthrough_markers: [...markers, { label: `Room ${markers.length}`, time_seconds: time }].sort((a, b) => a.time_seconds - b.time_seconds) }); };
    const updateMarker = (index, field, value) => updateData({ walkthrough_markers: markers.map((marker, markerIndex) => markerIndex === index ? { ...marker, [field]: field === 'time_seconds' ? Math.max(0, Number(value) || 0) : value } : marker) });
    const removeMarker = index => updateData({ walkthrough_markers: markers.filter((_, markerIndex) => markerIndex !== index) });
    const submitProperty = () => { if (configuredTour.length < 2) return toast.error('Add at least two photos for the interactive walkthrough.'); if (configuredTour.some(item => !item.location_name?.trim())) return toast.error('Give every walkthrough photo a location name.'); if (activeVideoUrl && markers.length < 2) return toast.error('Add at least two room markers to the walkthrough video.'); if (activeVideoUrl && markers.some(marker => !marker.label?.trim())) return toast.error('Give every video marker a room name.'); onSubmit(); };

    return <div>
        <div className="wide-two-col-layout">
            <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="upload-dropzone-wide"><div className="upload-icon-circle">↑</div><h3 className="upload-title">Interactive walkthrough photos</h3><p className="upload-desc">Upload photos in walking order, beginning at the entrance.<br />Supported formats: JPG, PNG, WEBP.</p><input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} /><button type="button" className="btn-wide-solid" onClick={() => fileInputRef.current?.click()}>Browse Photos</button></div>
                <div className="tour-builder-card"><div className="tour-builder-heading"><div><h3>Photo Walkthrough Order</h3><p>This replaces the normal property gallery for renters.</p></div></div><div className="tour-location-list">{configuredTour.map((item, index) => { const image = imageForConfig(item); if (!image) return null; return <div className="tour-location-row" key={`${item.source}-${item.image_id || item.file_index}`}><span className="tour-sequence-number">{index + 1}</span><img src={image.url} alt={item.location_name || `Location ${index + 1}`} /><input value={item.location_name || ''} maxLength={100} onChange={event => updateLocationName(index, event.target.value)} placeholder={index === 0 ? 'Entrance' : 'Room name'} aria-label={`Location name for photo ${index + 1}`} /><div className="tour-order-actions"><button type="button" onClick={() => moveTourPhoto(index, -1)} disabled={index === 0}>↑</button><button type="button" onClick={() => moveTourPhoto(index, 1)} disabled={index === configuredTour.length - 1}>↓</button></div><button type="button" className="marker-remove-button" onClick={() => handleRemoveImage(image)} aria-label={`Remove ${item.location_name || `photo ${index + 1}`}`}>&times;</button></div>; })}{!configuredTour.length && <p className="tour-empty-message">Upload at least two photos to build the walkthrough.</p>}</div></div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}><div className="wide-content-card"><h3 className="wide-card-title">Walkthrough Photo Guide</h3>{[{ title: 'Begin at the Entrance', desc: 'The first image becomes the starting point.' }, { title: 'Follow Walking Order', desc: 'Arrange rooms in the order a visitor would reach them.' }, { title: 'Name Every Location', desc: 'Use clear names such as Living Room, Kitchen, and Bedroom.' }].map(item => <div className="guideline-row" key={item.title}><div className="guideline-check">✓</div><div><div className="guideline-title">{item.title}</div><div className="guideline-desc">{item.desc}</div></div></div>)}</div><div className="tip-box"><div className="tip-text"><strong>Renter experience:</strong> Forward and Back arrows move through the ordered property photos.</div></div></div>
        </div>
        <div className="video-walkthrough-layout">
            <div className="tour-builder-card video-tour-builder">
                <div className="tour-builder-heading">
                    <div><h3>Video Walkthrough</h3><p>Upload one continuous property video and mark each important room.</p></div>
                    <input type="file" ref={videoInputRef} style={{ display: 'none' }} accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoChange} />
                    <button type="button" className="btn-wide-outline" onClick={() => videoInputRef.current?.click()}>{activeVideoUrl ? 'Replace Video' : 'Upload Video'}</button>
                </div>
                {activeVideoUrl && <>
                    <video ref={videoRef} className="walkthrough-editor-video" src={activeVideoUrl} controls preload="metadata" />
                    <div className="video-marker-toolbar"><button type="button" className="btn-wide-solid" onClick={addMarker}>Add marker at current time</button><button type="button" className="btn-wide-outline danger-button" onClick={removeVideo}>Remove Video</button></div>
                    <div className="tour-location-list">{markers.map((marker, index) => <div className="tour-location-row video-marker-row" key={`${marker.time_seconds}-${index}`}><span className="tour-sequence-number">{index + 1}</span><input value={marker.label} maxLength={100} onChange={event => updateMarker(index, 'label', event.target.value)} placeholder="Room name" aria-label={`Room name ${index + 1}`} /><label className="marker-time-field"><span>Time</span><input type="number" min="0" step="0.1" value={marker.time_seconds} onChange={event => updateMarker(index, 'time_seconds', event.target.value)} /></label><button type="button" className="marker-seek-button" onClick={() => { if (videoRef.current) videoRef.current.currentTime = Number(marker.time_seconds); }}>{formatTime(marker.time_seconds)}</button><button type="button" className="marker-remove-button" onClick={() => removeMarker(index)} aria-label={`Remove ${marker.label}`}>&times;</button></div>)}</div>
                </>}
            </div>
            <div className="wide-content-card video-guide-card">
                <h3 className="wide-card-title">Video Recording Guide</h3>
                {[{ title: 'Start at the Entrance', desc: 'Begin recording from the property entrance.' }, { title: 'Walk Slowly', desc: 'Keep the phone steady and show every room clearly.' }, { title: 'Use One Continuous Video', desc: 'Avoid stopping the recording between rooms.' }, { title: 'Add Room Markers', desc: 'Pause at each room and add a marker at that video time.' }].map(item => <div className="guideline-row" key={item.title}><div className="guideline-check">✓</div><div><div className="guideline-title">{item.title}</div><div className="guideline-desc">{item.desc}</div></div></div>)}
                <div className="tip-box"><div className="tip-text"><strong>How renters navigate:</strong> Forward and Back controls move between the room markers while the same video continues playing.</div></div>
            </div>
        </div>
        <div className="wide-step-footer"><button type="button" className="btn-wide-outline" onClick={onPrev}>← Back</button><div className="footer-right-group"><button type="button" className="btn-wide-ghost">Save as Draft</button><button type="button" className="btn-wide-solid" onClick={submitProperty} disabled={loading}>{loading ? 'Publishing...' : 'Publish Listing'} →</button></div></div>
    </div>;
};

export default Step4Images;
