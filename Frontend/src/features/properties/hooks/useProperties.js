import { useState, useCallback } from 'react';
import propertiesApi from '../services/properties.api';
import { useAuth } from '../../auth/hooks/useAuth';

export const useProperties = () => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchOwnerProperties = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await propertiesApi.getOwnerProperties();
            setProperties(data.properties || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch properties');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAllProperties = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await propertiesApi.getAllProperties(filters);
            setProperties(data.properties || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch properties');
        } finally {
            setLoading(false);
        }
    }, []);

    const getPropertyById = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            return await propertiesApi.getPropertyById(id);
        } catch (err) {
            setError(err.message || 'Failed to fetch property details');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createProperty = useCallback(async (propertyData) => {
        setLoading(true);
        setError(null);
        try {
            return await propertiesApi.createProperty(propertyData);
        } catch (err) {
            setError(err.message || 'Failed to create property');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const editProperty = useCallback(async (id, propertyData) => {
        setLoading(true);
        setError(null);
        try {
            return await propertiesApi.editProperty(id, propertyData);
        } catch (err) {
            setError(err.message || 'Failed to edit property');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteProperty = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            return await propertiesApi.deleteProperty(id);
        } catch (err) {
            setError(err.message || 'Failed to delete property');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const [amenities, setAmenities] = useState([]);

    const fetchAmenities = useCallback(async () => {
        try {
            const data = await propertiesApi.getAmenities();
            setAmenities(data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch amenities');
        }
    }, []);

    return {
        properties,
        loading,
        error,
        fetchOwnerProperties,
        fetchAllProperties,
        getPropertyById,
        createProperty,
        editProperty,
        deleteProperty,
        amenities,
        fetchAmenities
    };
};
