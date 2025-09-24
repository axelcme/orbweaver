/**
 * Orbweaver Natural Landcare
 * Main JavaScript - Consolidated and Optimized
 */

(() => {
    'use strict';

    // Module pattern to avoid global namespace pollution
    const OrbweaverApp = {
        // State management
        carouselState: {},
        
        // Initialize everything
        init() {
            this.initCarousels();
            this.initFormHandler();
            this.initSmoothScroll();
            this.handleMotionPreference();
            this.registerServiceWorker();
            this.initResizeHandler();
        },

        // Utility: Throttle function
        throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            }
        },

        // Carousel initialization
        initCarousels() {
            const carousels = [
                { containerId: "howWeWorkCards", dotsId: "howWeWorkDots" },
                { containerId: "whatWeDoCards", dotsId: "whatWeDoDots" },
            ];

            carousels.forEach((config) => {
                const container = document.getElementById(config.containerId);
                const dotsContainer = document.getElementById(config.dotsId);

                if (!container || !dotsContainer) return;

                const cards = container.querySelectorAll("article");
                
                // Initialize state for this carousel
                if (!this.carouselState[config.containerId]) {
                    this.carouselState[config.containerId] = { 
                        currentIndex: 0,
                        scrollHandler: null
                    };
                }

                // Add keyboard navigation
                if (!container.dataset.keyboardInit) {
                    container.dataset.keyboardInit = 'true';
                    container.addEventListener("keydown", (e) => {
                        if (!cards.length) return;

                        const cardWidth = cards[0].offsetWidth + 16;
                        const currentScroll = container.scrollLeft;
                        const currentIndex = Math.round(currentScroll / cardWidth);

                        if (e.key === "ArrowRight") {
                            e.preventDefault();
                            const nextIndex = Math.min(currentIndex + 1, cards.length - 1);
                            container.scrollTo({
                                left: nextIndex * cardWidth,
                                behavior: "smooth",
                            });
                        } else if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            const prevIndex = Math.max(currentIndex - 1, 0);
                            container.scrollTo({
                                left: prevIndex * cardWidth,
                                behavior: "smooth",
                            });
                        }
                    });
                }

                // Mobile carousel setup
                if (window.innerWidth <= 768 && cards.length > 0) {
                    // Create dot indicators
                    if (dotsContainer.children.length !== cards.length) {
                        dotsContainer.innerHTML = "";
                        cards.forEach((_, index) => {
                            const dot = document.createElement("span");
                            dot.classList.toggle('active', 
                                index === this.carouselState[config.containerId].currentIndex);
                            dotsContainer.appendChild(dot);
                        });
                    }

                    // Remove old scroll handler if exists
                    if (this.carouselState[config.containerId].scrollHandler) {
                        container.removeEventListener('scroll', 
                            this.carouselState[config.containerId].scrollHandler);
                    }

                    // Create throttled scroll handler
                    const updateDots = this.throttle(() => {
                        const scrollPosition = container.scrollLeft;
                        const cardWidth = cards[0].offsetWidth + 16;
                        const currentIndex = Math.round(scrollPosition / cardWidth);

                        if (this.carouselState[config.containerId].currentIndex !== currentIndex) {
                            this.carouselState[config.containerId].currentIndex = currentIndex;
                            
                            requestAnimationFrame(() => {
                                const dots = dotsContainer.querySelectorAll("span");
                                dots.forEach((dot, index) => {
                                    dot.classList.toggle("active", index === currentIndex);
                                });
                            });
                        }
                    }, 100);

                    // Store and add scroll handler
                    this.carouselState[config.containerId].scrollHandler = updateDots;
                    container.addEventListener("scroll", updateDots, { passive: true });
                    
                    // Restore scroll position
                    if (this.carouselState[config.containerId].currentIndex > 0) {
                        const cardWidth = cards[0].offsetWidth + 16;
                        container.scrollLeft = this.carouselState[config.containerId].currentIndex * cardWidth;
                    }
                } else {
                    // Clear dots on desktop
                    dotsContainer.innerHTML = "";
                    if (this.carouselState[config.containerId].scrollHandler) {
                        container.removeEventListener('scroll', 
                            this.carouselState[config.containerId].scrollHandler);
                        this.carouselState[config.containerId].scrollHandler = null;
                    }
                }
            });
        },

        // Form handler with validation
        initFormHandler() {
            const contactForm = document.getElementById('contactForm');
            if (!contactForm) return;

            // Field validation on blur/input
            const inputs = contactForm.querySelectorAll('input[required], textarea[required]');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });

                input.addEventListener('input', () => {
                    if (input.classList.contains('error')) {
                        this.validateField(input);
                    }
                });
            });

            // Form submission
            contactForm.addEventListener("submit", async (e) => {
                e.preventDefault();

                // Validate all required fields first
                let isValid = true;
                inputs.forEach(input => {
                    if (!this.validateField(input)) {
                        isValid = false;
                    }
                });

                if (!isValid) {
                    // Scroll to first error field
                    const firstError = contactForm.querySelector('.error');
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }

                const form = e.target;
                const formData = new FormData(form);
                const btn = form.querySelector('button[type="submit"]');
                const messageDiv = document.getElementById("formMessage");

                // Check honeypot
                if (formData.get("website")) {
                    return; // Bot detected
                }

                // Disable button and show loading
                btn.textContent = "Sending...";
                btn.disabled = true;
                messageDiv.style.display = "none";

                try {
                    const response = await fetch("https://formspree.io/f/xyzdqbaw", {
                        method: "POST",
                        headers: { Accept: "application/json" },
                        body: formData
                    });

                    const result = await response.json();

                    if (response.ok) {
                        messageDiv.textContent = "Message received! We'll be in touch within a week.";
                        messageDiv.className = "form-message success";
                        messageDiv.style.display = "block";
                        form.reset();

                        setTimeout(() => {
                            btn.textContent = "Let's talk";
                            btn.disabled = false;
                            messageDiv.style.display = "none";
                        }, 5000);
                    } else {
                        throw new Error(result.error || "Form submission failed. Please try again.");
                    }
                } catch (error) {
                    console.error("Form error:", error);
                    messageDiv.textContent = error.message || 
                        "Something went wrong. Please try again or call us at 250-710-1010.";
                    messageDiv.className = "form-message error";
                    messageDiv.style.display = "block";
                    btn.textContent = "Let's talk";
                    btn.disabled = false;
                }
            });
        },

        // Field validation
        validateField(field) {
            const isValid = field.checkValidity();
            
            if (!isValid) {
                field.classList.add('error');
                this.showError(field);
            } else {
                field.classList.remove('error');
                this.clearError(field);
            }
            
            return isValid;
        },

        // Show field error
        showError(field) {
            let errorEl = field.parentElement.querySelector('.field-error');
            if (!errorEl) {
                errorEl = document.createElement('span');
                errorEl.className = 'field-error';
                field.parentElement.appendChild(errorEl);
            }
            
            if (field.validity.valueMissing) {
                errorEl.textContent = 'This field is required';
            } else if (field.validity.typeMismatch) {
                errorEl.textContent = `Please enter a valid ${field.type}`;
            } else if (field.validity.tooShort) {
                errorEl.textContent = `Please enter at least ${field.minLength} characters`;
            }
        },

        // Clear field error
        clearError(field) {
            const errorEl = field.parentElement.querySelector('.field-error');
            if (errorEl) {
                errorEl.remove();
            }
        },

        // Smooth scroll for anchor links
        initSmoothScroll() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener("click", (e) => {
                    e.preventDefault();
                    const target = document.querySelector(anchor.getAttribute("href"));
                    if (target) {
                        target.scrollIntoView({ behavior: "smooth" });
                    }
                });
            });
        },

        // Respect motion preferences
        handleMotionPreference() {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
            
            const handleChange = () => {
                if (prefersReducedMotion.matches) {
                    document.documentElement.classList.add('reduce-motion');
                } else {
                    document.documentElement.classList.remove('reduce-motion');
                }
            };

            handleChange();
            prefersReducedMotion.addEventListener('change', handleChange);
        },

        // Service worker registration
        registerServiceWorker() {
            if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').catch(err => {
                        console.log('Service worker registration failed:', err);
                    });
                });
            }
        },

        // Resize handler
        initResizeHandler() {
            let resizeTimeout;
            window.addEventListener("resize", () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.initCarousels();
                }, 250);
            });
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => OrbweaverApp.init());
    } else {
        OrbweaverApp.init();
    }

})();
