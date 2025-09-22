/**
 * Orbweaver Natural Landcare
 * Main JavaScript - Progressive Enhancement
 */

(() => {
    'use strict';

    // Feature Detection
    const supports = {
        intersectionObserver: 'IntersectionObserver' in window,
        scrollBehavior: 'scrollBehavior' in document.documentElement.style,
        customProperties: CSS && CSS.supports && CSS.supports('--test', '0')
    };

    // Lazy Loading Images with Intersection Observer
    if (supports.intersectionObserver) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Enhanced Form Validation
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const inputs = contactForm.querySelectorAll('input[required], textarea[required]');
        
        inputs.forEach(input => {
            // Real-time validation feedback
            input.addEventListener('blur', () => {
                validateField(input);
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    validateField(input);
                }
            });
        });

        function validateField(field) {
            const isValid = field.checkValidity();
            
            if (!isValid) {
                field.classList.add('error');
                showError(field);
            } else {
                field.classList.remove('error');
                clearError(field);
            }
            
            return isValid;
        }

        function showError(field) {
            let errorEl = field.parentElement.querySelector('.field-error');
            if (!errorEl) {
                errorEl = document.createElement('span');
                errorEl.className = 'field-error';
                field.parentElement.appendChild(errorEl);
            }
            
            if (field.validity.valueMissing) {
                errorEl.textContent = 'This field is required';
            } else if (field.validity.typeMismatch) {
                errorEl.textContent = 'Please enter a valid ' + field.type;
            } else if (field.validity.tooShort) {
                errorEl.textContent = `Please enter at least ${field.minLength} characters`;
            }
        }

        function clearError(field) {
            const errorEl = field.parentElement.querySelector('.field-error');
            if (errorEl) {
                errorEl.remove();
            }
        }
    }

    // Smooth Scroll Enhancement
    if (!supports.scrollBehavior) {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offset = target.getBoundingClientRect().top + window.pageYOffset - 100;
                    window.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Enhance Card Animations with Intersection Observer
    if (supports.intersectionObserver) {
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -10% 0px'
        });

        document.querySelectorAll('article').forEach(card => {
            cardObserver.observe(card);
        });
    }

    // Prefetch on Hover for Performance
    const prefetchLinks = () => {
        const links = document.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                if (!link.dataset.prefetched) {
                    const prefetchLink = document.createElement('link');
                    prefetchLink.rel = 'prefetch';
                    prefetchLink.href = link.href;
                    document.head.appendChild(prefetchLink);
                    link.dataset.prefetched = 'true';
                }
            });
        });
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(prefetchLinks);
    } else {
        setTimeout(prefetchLinks, 1);
    }

    // Respect User Motion Preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    function handleMotionPreference() {
        if (prefersReducedMotion.matches) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
    }

    handleMotionPreference();
    prefersReducedMotion.addEventListener('change', handleMotionPreference);

    // Service Worker Registration for Offline Support
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Service worker registration failed, app still works
            });
        });
    }

    // Dark Mode Toggle (if you want to add manual control)
    const initThemeToggle = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    };

    initThemeToggle();

})();
