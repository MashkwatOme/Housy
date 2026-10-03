import React from 'react';
import SearchChat from '../components/SearchChat';
import SearchMap from '../components/SearchMap';
import { useSearch } from '../hooks/useSearch';
import { SearchProvider } from '../states/SearchContext';
import './SearchPage.css';

class MapErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Google Maps rendering error captured:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: '12px', color: '#94a3b8'}}>
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                        <line x1="8" y1="2" x2="8" y2="18"></line>
                        <line x1="16" y1="6" x2="16" y2="22"></line>
                    </svg>
                    <h3 style={{fontWeight: '600', color: '#334155', marginBottom: '8px', fontSize: '16px'}}>Map is temporarily offline</h3>
                    <p style={{fontSize: '13px', maxWidth: '320px', margin: '0 auto', lineHeight: '1.4'}}>
                        The properties list and Housy AI conversational search remain fully functional.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

const SearchPageContent = ({ onNavigate }) => {
    const {
        messages,
        properties,
        nearbyPlaces,
        loading,
        hoveredPropertyId,
        setHoveredPropertyId,
        submitQuery
    } = useSearch();

    return (
        <div className="search-page-container">
            <div className="search-sidebar">
                <SearchChat 
                    messages={messages}
                    loading={loading}
                    submitQuery={submitQuery}
                    setHoveredPropertyId={setHoveredPropertyId}
                    onNavigate={onNavigate} 
                />
            </div>
            <div className="search-map-area">
                <MapErrorBoundary>
                    <SearchMap
                        properties={properties}
                        nearbyPlaces={nearbyPlaces}
                        hoveredPropertyId={hoveredPropertyId}
                    />
                </MapErrorBoundary>
            </div>
        </div>
    );
};

const SearchPage = ({ onNavigate, isLoggedIn, user }) => {
    return (
        <SearchProvider>
            <SearchPageContent onNavigate={onNavigate} />
        </SearchProvider>
    );
};

export default SearchPage;
