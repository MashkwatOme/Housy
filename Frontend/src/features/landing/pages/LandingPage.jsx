import React, { useEffect, useRef } from 'react';
import './LandingPage.css';
import { useProperties } from '../../properties/hooks/useProperties';

const LandingPage = ({ onNavigate }) => {
    const { properties, fetchAllProperties } = useProperties();
    const pageRef = useRef(null);
    const navRef = useRef(null);
    const progressRef = useRef(null);
    const imageFrameRef = useRef(null);
    const prefersReducedMotion = typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        fetchAllProperties({ sortBy: 'Newest First' });
    }, [fetchAllProperties]);

    useEffect(() => {
        const sections = pageRef.current?.querySelectorAll('.landing-reveal');
        if (!sections?.length) return undefined;

        const observer = new IntersectionObserver(
            (entries) => entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            }),
            { threshold: 0.14 }
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, []);

    // Scroll progress bar + nav elevation on scroll
    useEffect(() => {
        const nav = navRef.current;
        const progressBar = progressRef.current;
        if (!nav || !progressBar) return undefined;

        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? Math.min(1, scrollTop / scrollHeight) : 0;
            progressBar.style.transform = `scaleX(${progress})`;
            nav.classList.toggle('is-scrolled', scrollTop > 40);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Subtle cursor parallax on the hero image
    const handleHeroPointerMove = (e) => {
        if (prefersReducedMotion || !imageFrameRef.current) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        const relX = (e.clientX - bounds.left) / bounds.width - 0.5;
        const relY = (e.clientY - bounds.top) / bounds.height - 0.5;
        imageFrameRef.current.style.transform = `translate(${relX * -14}px, ${relY * -10}px)`;
    };
    const handleHeroPointerLeave = () => {
        if (imageFrameRef.current) imageFrameRef.current.style.transform = '';
    };

    // Tilt + spotlight hover for category cards
    const handleCardTilt = (e) => {
        if (prefersReducedMotion) return;
        const card = e.currentTarget;
        const bounds = card.getBoundingClientRect();
        const relX = (e.clientX - bounds.left) / bounds.width;
        const relY = (e.clientY - bounds.top) / bounds.height;
        card.style.transform = `perspective(700px) rotateX(${(0.5 - relY) * 10}deg) rotateY(${(relX - 0.5) * 14}deg) scale(1.015)`;
        card.style.setProperty('--spot-x', `${relX * 100}%`);
        card.style.setProperty('--spot-y', `${relY * 100}%`);
    };
    const resetCardTilt = (e) => {
        e.currentTarget.style.transform = '';
    };

    // Click ripple feedback for primary CTA buttons
    const spawnRipple = (e) => {
        if (prefersReducedMotion) return;
        const btn = e.currentTarget;
        const bounds = btn.getBoundingClientRect();
        const size = Math.max(bounds.width, bounds.height);
        const ripple = document.createElement('span');
        ripple.className = 'landing-ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - bounds.left - size / 2}px`;
        ripple.style.top = `${e.clientY - bounds.top - size / 2}px`;
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    };

    const featuredProperties = properties.slice(0, 3);
    const fallbackProperties = [
        { id: 'featured-1', title: 'Skyline Deluxe Apartment', address: 'Gulshan, Dhaka', monthly_rent: 42000, total_bedrooms: 3, total_bathrooms: 2, property_size_sqft: 1650, cover_image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=85' },
        { id: 'featured-2', title: 'Serene Garden House', address: 'Uttara, Dhaka', monthly_rent: 58000, total_bedrooms: 4, total_bathrooms: 3, property_size_sqft: 2400, cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=85' },
        { id: 'featured-3', title: 'Modern Waterfront Suite', address: 'Banani, Dhaka', monthly_rent: 35000, total_bedrooms: 2, total_bathrooms: 2, property_size_sqft: 1350, cover_image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800&q=85' }
    ];
    const displayProperties = featuredProperties.length ? featuredProperties : fallbackProperties;

    return (
        <div className="landing-page" ref={pageRef}>
            <div className="landing-scroll-progress"><span ref={progressRef}></span></div>
            <header className="landing-nav" ref={navRef}>
                <button className="landing-brand" onClick={() => onNavigate('landing')}>
                    Housy
                </button>
                <div className="landing-nav-actions">
                    <button className="landing-login-link" onClick={() => onNavigate('login')}>Log in</button>
                    <button className="landing-signup-btn" onClick={(e) => { spawnRipple(e); onNavigate('signup'); }}>Create account</button>
                </div>
            </header>

            <main>
                <section className="landing-hero" onMouseMove={handleHeroPointerMove} onMouseLeave={handleHeroPointerLeave}>
                    <div className="landing-orb landing-orb-one"></div>
                    <div className="landing-orb landing-orb-two"></div>
                    <div className="landing-hero-copy">
                        <span className="landing-eyebrow">A better way to find your place</span>
                        <h1>Find a home that feels <em>like yours.</em></h1>
                        <p>
                            Discover beautiful homes, connect with trusted owners, and manage every step of your rental journey in one calm, simple space.
                        </p>
                        <div className="landing-hero-actions">
                            <button className="landing-primary-btn" onClick={(e) => { spawnRipple(e); onNavigate('browse'); }}>
                                Explore available homes <span>→</span>
                            </button>
                            <button className="landing-secondary-btn" onClick={(e) => { spawnRipple(e); onNavigate('signup'); }}>
                                I want to list a property
                            </button>
                        </div>
                        <div className="landing-trust-row">
                            <div className="landing-avatar-stack">
                                <span>F</span><span>A</span><span>R</span><span>+</span>
                            </div>
                            <div><strong>Loved by growing communities</strong><small>Simple renting, made human.</small></div>
                        </div>
                    </div>
                    <div className="landing-hero-visual">
                        <div className="landing-image-frame" ref={imageFrameRef}>
                            <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=85" alt="Bright modern living room" />
                            <div className="landing-floating-card landing-location-card">
                                <span className="landing-card-icon">⌖</span>
                                <div><small>Popular location</small><strong>Dhanmondi, Dhaka</strong></div>
                            </div>
                            <div className="landing-floating-card landing-match-card">
                                <span className="landing-match-check">✓</span>
                                <div><strong>98% match</strong><small>Perfect for your lifestyle</small></div>
                            </div>
                        </div>
                        <div className="landing-image-accent"></div>
                    </div>
                </section>

                <section className="landing-featured landing-reveal">
                    <div className="landing-section-heading landing-featured-heading">
                        <div>
                            <span className="landing-eyebrow">Fresh from Housy</span>
                            <h2>Explore our featured homes.</h2>
                        </div>
                        <button className="landing-browse-link" onClick={() => onNavigate('browse')}>See all properties <span>↗</span></button>
                    </div>
                    <div className="landing-property-grid">
                        {displayProperties.map((property) => (
                            <article className="landing-property-card" key={property.id}>
                                <div className="landing-property-image">
                                    <img src={property.cover_image || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=85'} alt={property.title} />
                                    <span className="landing-property-badge">Featured</span>
                                    <span className="landing-property-heart">♡</span>
                                </div>
                                <div className="landing-property-body">
                                    <div className="landing-property-type">AVAILABLE FOR RENT</div>
                                    <div className="landing-property-title-row"><h3>{property.title}</h3><strong>৳{Number(property.monthly_rent || 0).toLocaleString()}<small>/mo</small></strong></div>
                                    <p className="landing-property-address">{property.address || property.district || 'Dhaka, Bangladesh'}</p>
                                    <div className="landing-property-meta"><span>⌂ {property.total_bedrooms || 0} Beds</span><span>◌ {property.total_bathrooms || 0} Baths</span><span>▧ {property.property_size_sqft || 0} sqft</span></div>
                                    <button className="landing-property-action" onClick={() => property.id.toString().startsWith('featured-') ? onNavigate('browse') : onNavigate('details', property.id)}>View details <span>→</span></button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="landing-category-explorer landing-reveal">
                    <div className="landing-category-heading landing-section-heading">
                        <span className="landing-eyebrow">Find your next home</span>
                        <h2>Explore homes for every way of living.</h2>
                        <p>Start with the kind of place that feels most like you.</p>
                    </div>
                    <div className="landing-category-grid">
                        <button className="landing-category-card" onClick={() => onNavigate('browse')} onMouseMove={handleCardTilt} onMouseLeave={resetCardTilt}>
                            <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=85" alt="Bright studio apartment" />
                            <span className="landing-category-overlay"></span><span className="landing-category-content"><small>For independent living</small><strong>Apartment rentals</strong><i>Explore homes &rarr;</i></span>
                        </button>
                        <button className="landing-category-card" onClick={() => onNavigate('browse')} onMouseMove={handleCardTilt} onMouseLeave={resetCardTilt}>
                            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85" alt="Comfortable family house" />
                            <span className="landing-category-overlay"></span><span className="landing-category-content"><small>Room to grow</small><strong>Family homes</strong><i>Explore homes &rarr;</i></span>
                        </button>
                        <button className="landing-category-card" onClick={() => onNavigate('browse')} onMouseMove={handleCardTilt} onMouseLeave={resetCardTilt}>
                            <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85" alt="Furnished modern interior" />
                            <span className="landing-category-overlay"></span><span className="landing-category-content"><small>Ready when you are</small><strong>Furnished stays</strong><i>Explore homes &rarr;</i></span>
                        </button>
                        <button className="landing-category-card" onClick={() => onNavigate('browse')} onMouseMove={handleCardTilt} onMouseLeave={resetCardTilt}>
                            <img src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85" alt="Modern affordable home" />
                            <span className="landing-category-overlay"></span><span className="landing-category-content"><small>Made for your budget</small><strong>Value rentals</strong><i>Explore homes &rarr;</i></span>
                        </button>
                    </div>
                    <button className="landing-discovery-cta" onClick={(e) => { spawnRipple(e); onNavigate('browse'); }}>Browse all available homes <span>&rarr;</span></button>
                </section>

                <section className="landing-locations landing-reveal">
                    <div className="landing-section-heading">
                        <span className="landing-eyebrow">Explore Dhaka</span>
                        <h2>Find a place in the neighbourhood you love.</h2>
                        <p>Discover rentals in some of Dhaka's most sought-after areas.</p>
                    </div>
                    <div className="landing-location-grid">
                        <button onClick={() => onNavigate('browse')}><strong>Gulshan</strong><span>Premium city living</span></button>
                        <button onClick={() => onNavigate('browse')}><strong>Banani</strong><span>Connected and vibrant</span></button>
                        <button onClick={() => onNavigate('browse')}><strong>Dhanmondi</strong><span>Culture close to home</span></button>
                        <button onClick={() => onNavigate('browse')}><strong>Uttara</strong><span>Space to settle in</span></button>
                        <button onClick={() => onNavigate('browse')}><strong>Bashundhara</strong><span>Modern residential life</span></button>
                        <button onClick={() => onNavigate('browse')}><strong>Mirpur</strong><span>Everyday convenience</span></button>
                    </div>
                    <button className="landing-browse-link" onClick={() => onNavigate('browse')}>Explore all Dhaka locations <span>&rarr;</span></button>
                </section>

                <section className="landing-discovery-old" aria-hidden="true">
                    <div className="landing-discovery-intro">
                        <div className="landing-section-heading">
                            <span className="landing-eyebrow">How Housy works</span>
                            <h2>From first search to first night, made simple.</h2>
                            <p>A smoother rental journey with the tools you need at every step.</p>
                        </div>
                        <button className="landing-discovery-cta" onClick={() => onNavigate('browse')}>Start exploring homes <span>→</span></button>
                    </div>
                    <div className="landing-feature-grid">
                        <article className="landing-journey-card">
                            <div className="landing-journey-top"><span className="landing-feature-icon">⌕</span><span className="landing-feature-number">01</span></div>
                            <h3>Find your fit</h3><p>Use thoughtful filters and complete listing details to narrow down homes that feel right.</p>
                            <span className="landing-journey-label">Search with confidence</span>
                        </article>
                        <article className="landing-journey-card">
                            <div className="landing-journey-top"><span className="landing-feature-icon">↗</span><span className="landing-feature-number">02</span></div>
                            <h3>Meet the owner</h3><p>Ask questions, chat directly, and schedule a viewing when it works for both of you.</p>
                            <span className="landing-journey-label">Connect directly</span>
                        </article>
                        <article className="landing-journey-card">
                            <div className="landing-journey-top"><span className="landing-feature-icon">✓</span><span className="landing-feature-number">03</span></div>
                            <h3>Move in, easily</h3><p>Keep your agreement, rent payments, and rental support in one calm place.</p>
                            <span className="landing-journey-label">Settle in smoothly</span>
                        </article>
                    </div>
                </section>

                <section className="landing-benefits landing-reveal">
                    <div className="landing-section-heading">
                        <span className="landing-eyebrow">Seamless rental experience</span>
                        <h2>Why tenants and owners choose Housy.</h2>
                        <p>We replace complicated rental journeys with a transparent digital home rental system.</p>
                    </div>
                    <div className="landing-benefit-grid">
                        <article><span className="landing-benefit-icon">◉</span><h3>100% genuinely verified</h3><p>Clear property information helps you make decisions with confidence.</p></article>
                        <article><span className="landing-benefit-icon">▣</span><h3>Digital lease & e-sign</h3><p>Review agreements, sign securely, and keep important documents in one place.</p></article>
                        <article><span className="landing-benefit-icon">⌑</span><h3>Instant in-person visits</h3><p>Choose a convenient time and meet owners without endless back-and-forth.</p></article>
                        <article><span className="landing-benefit-icon">৳</span><h3>Flexible rent payments</h3><p>Track rent, deposits, and payment history with a clear record.</p></article>
                        <article><span className="landing-benefit-icon">♧</span><h3>Direct conversations</h3><p>Connect tenants and owners through simple, purposeful messaging.</p></article>
                        <article><span className="landing-benefit-icon">✦</span><h3>Support after move-in</h3><p>Stay organized with maintenance and lease support when you need it.</p></article>
                    </div>
                </section>

                <section className="landing-faq landing-reveal">
                    <div className="landing-section-heading">
                        <span className="landing-eyebrow">Got questions?</span>
                        <h2>Frequently asked questions.</h2>
                    </div>
                    <div className="landing-faq-list">
                        <details open><summary>How does Housy verify rental properties?</summary><p>Listings are reviewed with clear property details so renters can explore homes with greater confidence.</p></details>
                        <details><summary>What documents are needed for a tenant application?</summary><p>Requirements depend on the owner and property. The relevant information is shared before you submit a request.</p></details>
                        <details><summary>How are digital lease agreements signed?</summary><p>Both parties can review the agreement and complete the signing process digitally from their Housy account.</p></details>
                        <details><summary>What payment methods are supported?</summary><p>Housy supports digital payment flows and recorded cash payments where configured by the property owner.</p></details>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <div className="landing-footer-main">
                    <div className="landing-footer-brand"><button onClick={() => onNavigate('landing')}>Housy</button><p>Find your place. Live your story.</p><small>Housy makes renting feel simpler, clearer, and more human.</small></div>
                    <div className="landing-footer-links"><strong>Discover</strong><button onClick={() => onNavigate('browse')}>Browse homes</button><button onClick={() => onNavigate('browse')}>Featured homes</button><button onClick={() => onNavigate('browse')}>Dhaka locations</button></div>
                    <div className="landing-footer-links"><strong>With Housy</strong><button onClick={() => onNavigate('signup')}>Create an account</button><button onClick={() => onNavigate('signup')}>List a property</button><button onClick={() => onNavigate('login')}>Sign in</button></div>
                    <div className="landing-footer-note"><strong>A better rental journey</strong><p>From search and viewings to agreements and payments, keep everything in one place.</p><button onClick={() => onNavigate('signup')}>Get started <span>&rarr;</span></button></div>
                </div>
                <div className="landing-footer-bottom"><small>&copy; 2026 Housy. All rights reserved.</small><span>Made for renters and owners in Bangladesh.</span></div>
            </footer>
            <footer className="landing-footer-old" aria-hidden="true">
                <strong>Housy</strong>
                <span>Find your place. Live your story.</span>
                <small>© 2026 Housy</small>
            </footer>
        </div>
    );
};

export default LandingPage;
