import React, { createContext, useState, useContext } from 'react';

const SearchContext = createContext();

export const useSearchState = () => {
    return useContext(SearchContext);
};

export const SearchProvider = ({ children }) => {
    const [messages, setMessages] = useState([
        {
            type: 'ai',
            text: "Hello! I'm Housy AI. What kind of property are you looking for today? (e.g., '2 bedroom apartments in downtown under ৳3000')"
        }
    ]);
    const [properties, setProperties] = useState([]);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hoveredPropertyId, setHoveredPropertyId] = useState(null);

    const value = {
        messages,
        setMessages,
        properties,
        setProperties,
        nearbyPlaces,
        setNearbyPlaces,
        loading,
        setLoading,
        hoveredPropertyId,
        setHoveredPropertyId
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};
