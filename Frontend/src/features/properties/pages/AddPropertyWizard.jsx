import React, { useState, useEffect } from 'react';
import AddPropertyLayout from './AddPropertyLayout';
import Step1BasicInfo from '../components/Step1BasicInfo';
import Step2Specifications from '../components/Step2Specifications';
import Step3AmenitiesLocation from '../components/Step3AmenitiesLocation';
import Step4Images from '../components/Step4Images';
import { useProperties } from '../hooks/useProperties';
import toast from 'react-hot-toast';
import './AddPropertyWizard.css';

const AddPropertyWizard = ({ onNavigate, propertyId, isEdit = false }) => {
    const { createProperty, editProperty, getPropertyById, loading } = useProperties();
    const [currentStep, setCurrentStep] = useState(1);
    const [loadingDetails, setLoadingDetails] = useState(isEdit);

    const [formData, setFormData] = useState({
        title: '',
        listing_type: 'full_property',
        property_type: 'apartment',
        description: '',
        available_from: '',
        total_bedrooms: 2,
        total_bathrooms: 1,
        area: '',
        total_units: 1,
        monthly_rent: '',
        expected_security_deposit: '',
        amenities: [],
        address: '',
        local_area: '',
        district: '',
        division: '',
        latitude: null,
        longitude: null,
        files: [],
        existing_images: [],
        removed_images: [],
        tour_config: [],
        walkthrough_video: null,
        existing_walkthrough: null,
        remove_walkthrough_video: false,
        walkthrough_markers: []
    });

    useEffect(() => {
        if (isEdit && propertyId) {
            const loadDetails = async () => {
                try {
                    const data = await getPropertyById(propertyId);
                    const property = data.property;
                    setFormData({
                        title: property.title || '',
                        listing_type: property.listing_type || 'full_property',
                        property_type: property.property_type || 'apartment',
                        description: property.description || '',
                        available_from: property.available_from ? property.available_from.split('T')[0] : '',
                        total_bedrooms: property.total_bedrooms || 0,
                        total_bathrooms: property.total_bathrooms || 0,
                        area: property.property_size_sqft || '',
                        total_units: property.total_units || 1,
                        monthly_rent: property.monthly_rent || '',
                        expected_security_deposit: property.expected_security_deposit || '',
                        amenities: property.amenities ? property.amenities.map(a => a.id) : [],
                        address: property.address || '',
                        local_area: property.area || '',
                        district: property.district || '',
                        division: property.division || '',
                        latitude: property.latitude || null,
                        longitude: property.longitude || null,
                        files: [],
                        existing_images: property.images || [],
                        removed_images: [],
                        tour_config: (property.images || [])
                            .slice()
                            .sort((a, b) => Number(a.tour_order ?? Number.MAX_SAFE_INTEGER) - Number(b.tour_order ?? Number.MAX_SAFE_INTEGER))
                            .map((img, index) => ({
                                source: 'existing',
                                image_id: img.id,
                                location_name: img.location_name || (index === 0 ? 'Entrance' : `Room ${index}`),
                                tour_order: index,
                                enabled: true
                            })),
                        walkthrough_video: null,
                        existing_walkthrough: property.walkthrough || null,
                        remove_walkthrough_video: false,
                        walkthrough_markers: property.walkthrough?.markers || []
                    });
                } catch (error) {
                    toast.error('Failed to load property details');
                    onNavigate('ownerdashboard');
                } finally {
                    setLoadingDetails(false);
                }
            };
            loadDetails();
        }
    }, [isEdit, propertyId, getPropertyById, onNavigate]);

    const updateFormData = (fields) => {
        setFormData(prev => ({ ...prev, ...fields }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async () => {
        try {
            if (isEdit) {
                await editProperty(propertyId, formData);
                toast.success('Property updated successfully!');
            } else {
                await createProperty(formData);
                toast.success('Property created successfully!');
            }
            onNavigate('ownerdashboard');
        } catch (error) {
            toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} property`);
        }
    };

    const stepMeta = [
        { title: isEdit ? 'Edit Property Details' : 'Add New Property', counterLabel: 'Step 1 of 4' },
        { title: 'Property Specifications', counterLabel: '50%', prefixLabel: 'STEP 2 OF 4' },
        { title: 'Amenities & Location', counterLabel: '75% Complete', prefixLabel: 'Step 3 of 4: Amenities & Location' },
        { title: isEdit ? 'Manage Photos' : 'Add Images', counterLabel: 'Last saved', prefixLabel: 'STEP 4 OF 4' }
    ];

    if (loadingDetails) {
        return (
            <AddPropertyLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #0056b3', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <span style={{ fontSize: '15px', color: '#64748b', fontWeight: '500' }}>Loading property details...</span>
                </div>
            </AddPropertyLayout>
        );
    }

    const meta = stepMeta[currentStep - 1];
    const isFullPage = currentStep > 1;
    const progressPercent = (currentStep / 4) * 100;

    const sharedProps = {
        data: formData,
        updateData: updateFormData,
        onNext: nextStep,
        onPrev: prevStep,
        onSubmit: handleSubmit,
        loading,
        onCancel: () => onNavigate('ownerdashboard')
    };

    return (
        <AddPropertyLayout>
            {isFullPage ? (
                /* Full-page layout for Steps 2, 3, 4 */
                <div className="wide-wizard-wrapper">
                    {/* Top header bar */}
                    <div className="wide-step-header">
                        <div className="wide-step-title-row">
                            <div>
                                {meta.prefixLabel && <span className="wide-step-prefix">{meta.prefixLabel}</span>}
                                <h2 className="wide-step-title">{meta.title}</h2>
                            </div>
                            <span className="wide-step-counter">{meta.counterLabel}</span>
                        </div>
                        <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>

                    {/* Step content */}
                    {currentStep === 2 && <Step2Specifications {...sharedProps} />}
                    {currentStep === 3 && <Step3AmenitiesLocation {...sharedProps} />}
                    {currentStep === 4 && <Step4Images {...sharedProps} />}

                    {/* Footer */}
                    <footer className="wizard-page-footer">
                        <span className="footer-brand">© 2026 Housy</span>
                        <div className="footer-links">
                            <span>Support</span>
                            <span>Privacy Policy</span>
                            <span>Terms of Service</span>
                        </div>
                    </footer>
                </div>
            ) : (
                /* Narrow card layout for Step 1 */
                <div className="wizard-card-wrapper">
                    <div className="wizard-card">
                        <div className="wizard-step-header">
                            <div className="step-title-row">
                                <h2 className="step-title">{meta.title}</h2>
                                <span className="step-counter">{meta.counterLabel}</span>
                            </div>
                            <div className="progress-bar-container">
                                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>
                        <div className="wizard-step-content">
                            <Step1BasicInfo {...sharedProps} />
                        </div>
                    </div>
                </div>
            )}
        </AddPropertyLayout>
    );
};

export default AddPropertyWizard;
