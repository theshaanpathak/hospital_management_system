import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Users, Clock, ArrowRight } from 'lucide-react';
import AppIcon from '../components/AppIcon';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-container">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="nav-brand">
                    <AppIcon icon={Activity} size={32} className="text-primary" />
                    <span>HMS Core</span>
                </div>
                <div className="nav-links d-none d-md-flex">
                    <a href="#features" className="nav-link">Features</a>
                    <a href="#about" className="nav-link">About</a>
                    <a href="#contact" className="nav-link">Contact</a>
                </div>
                <Link to="/login" className="btn-signin">Sign In</Link>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <span className="hero-badge">Healthcare Management Excellence</span>
                    <h1 className="hero-title">
                        Advanced Care, <span>Seamless</span> Management.
                    </h1>
                    <p className="hero-subtitle">
                        Experience the next generation of Hospital Management. Secure, efficient, and built for modern healthcare providers and patients.
                    </p>
                    <div className="hero-actions">
                        <Link to="/login" className="btn-primary-lg">
                            Get Started <AppIcon icon={ArrowRight} size={18} className="ms-2" />
                        </Link>
                        <a href="#features" className="btn-outline-lg">Learn More</a>
                    </div>

                    <div className="stats-container">
                        <div className="stat-item">
                            <h3>500+</h3>
                            <p>Specialists</p>
                        </div>
                        <div className="stat-item">
                            <h3>10k+</h3>
                            <p>Active Patients</p>
                        </div>
                        <div className="stat-item">
                            <h3>24/7</h3>
                            <p>Medical Support</p>
                        </div>
                    </div>
                </div>

                <div className="hero-image d-none d-lg-block">
                    <div className="img-wrapper">
                        <img 
                            src="/assets/hero.png" 
                            alt="Modern Hospital" 
                            className="hero-img"
                        />
                    </div>
                </div>
            </header>

            {/* Features Preview */}
            <section id="features" className="features-preview py-5 px-5">
                <div className="container text-center">
                    <h2 className="fw-bold mb-5">Why Choose HMS Core?</h2>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="p-4 rounded-4 bg-light">
                                <AppIcon icon={Shield} size={40} className="text-primary mb-3" />
                                <h5 className="fw-bold">Secure Records</h5>
                                <p className="text-muted">State-of-the-art encryption for all patient and medical records.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-4 rounded-4 bg-light">
                                <AppIcon icon={Clock} size={40} className="text-primary mb-3" />
                                <h5 className="fw-bold">Instant Scheduling</h5>
                                <p className="text-muted">Book and manage appointments in real-time with ease.</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="p-4 rounded-4 bg-light">
                                <AppIcon icon={Users} size={40} className="text-primary mb-3" />
                                <h5 className="fw-bold">Unified Care</h5>
                                <p className="text-muted">A central platform for doctors, patients, and administrators.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
