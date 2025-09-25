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
            this.initHeroAnimation();
            this.initScrollAnimations();
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
                    // Add proper carousel ARIA attributes
                    container.setAttribute('aria-label', 'Carousel');
                    container.setAttribute('role', 'region');

                    // Set up focus management for cards
                    cards.forEach((card, index) => {
                        card.setAttribute('tabindex',
                            index === this.carouselState[config.containerId].currentIndex ? '0' : '-1');
                        card.setAttribute('aria-label', `Slide ${index + 1} of ${cards.length}`);
                    });

                    // Create dot indicators
                    if (dotsContainer.children.length !== cards.length) {
                        dotsContainer.innerHTML = "";
                        cards.forEach((_, index) => {
                            const dot = document.createElement("button");
                            dot.type = "button";
                            dot.classList.toggle('active',
                                index === this.carouselState[config.containerId].currentIndex);
                            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
                            dot.addEventListener('click', () => {
                                this.goToSlide(config.containerId, index, cards, container);
                            });
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
                                const dots = dotsContainer.querySelectorAll("button");
                                dots.forEach((dot, index) => {
                                    dot.classList.toggle("active", index === currentIndex);
                                });

                                // Update focus management for cards
                                cards.forEach((card, index) => {
                                    card.setAttribute('tabindex', index === currentIndex ? '0' : '-1');
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

        // Navigate to specific slide in carousel
        goToSlide(containerId, targetIndex, cards, container) {
            if (!cards || !cards[targetIndex]) return;

            const cardWidth = cards[0].offsetWidth + 16;
            container.scrollTo({
                left: targetIndex * cardWidth,
                behavior: 'smooth'
            });

            // Update state and focus
            this.carouselState[containerId].currentIndex = targetIndex;

            // Focus the target card for keyboard navigation
            setTimeout(() => {
                cards[targetIndex].focus();
            }, 300);
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

                        // Update ARIA status region for success
                        this.updateFormStatus("Message sent successfully! We'll be in touch within a week.");

                        // Clear all field errors
                        inputs.forEach(input => input.classList.remove('error'));
                        form.querySelectorAll('.field-error').forEach(errorEl => {
                            errorEl.textContent = '';
                        });

                        form.reset();
                        btn.textContent = "Message sent ✓";
                        btn.classList.add('success');

                        setTimeout(() => {
                            btn.textContent = "Let's talk";
                            btn.classList.remove('success');
                            btn.disabled = false;
                            messageDiv.style.display = "none";
                            this.updateFormStatus('');
                        }, 6000);
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
            const existingError = field.parentElement.querySelector('.field-error');
            if (existingError && !existingError.textContent) {
                // Use the existing error div with proper ARIA
                const errorEl = existingError;

                if (field.validity.valueMissing) {
                    if (field.type === 'email') {
                        errorEl.textContent = 'We need your email to get back to you';
                    } else if (field.id === 'contact-name') {
                        errorEl.textContent = 'Let us know what to call you';
                    } else if (field.id === 'contact-message') {
                        errorEl.textContent = 'Tell us about your outdoor space';
                    } else {
                        errorEl.textContent = 'This field is required';
                    }
                } else if (field.validity.typeMismatch) {
                    if (field.type === 'email') {
                        errorEl.textContent = 'Please enter a valid email address (like you@example.com)';
                    } else if (field.type === 'tel') {
                        errorEl.textContent = 'Please enter a valid phone number';
                    } else {
                        errorEl.textContent = `Please enter a valid ${field.type}`;
                    }
                } else if (field.validity.tooShort) {
                    errorEl.textContent = `Please enter at least ${field.minLength} characters`;
                } else if (field.validity.patternMismatch) {
                    errorEl.textContent = 'Please check the format of this field';
                }

                // Update status region
                this.updateFormStatus(`Error in ${field.labels[0]?.textContent || field.name}: ${errorEl.textContent}`);
            }
        },

        // Clear field error
        clearError(field) {
            const errorEl = field.parentElement.querySelector('.field-error');
            if (errorEl) {
                errorEl.textContent = '';
                // Update status region to clear error
                this.updateFormStatus('');
            }
        },

        // Update form status region for screen readers
        updateFormStatus(message) {
            const statusEl = document.getElementById('form-status');
            if (statusEl) {
                statusEl.textContent = message;
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

        // Service worker registration with improved error handling
        registerServiceWorker() {
            if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                        .then(registration => {
                            // Update service worker when new version is available
                            if (registration.waiting) {
                                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                            }
                        })
                        .catch(err => {
                            // Silently fail in production, only log in development
                            if (window.location.hostname === 'localhost') {
                                console.log('Service worker registration failed:', err);
                            }
                        });
                });

                // PWA install prompt
                this.initInstallPrompt();
            }
        },

        // PWA Install Prompt
        initInstallPrompt() {
            let deferredPrompt;

            window.addEventListener('beforeinstallprompt', (e) => {
                // Prevent the mini-infobar from appearing on mobile
                e.preventDefault();
                deferredPrompt = e;

                // Show install banner after 30 seconds if user hasn't already dismissed it
                const hasInstallPromptDismissed = localStorage.getItem('pwa-install-dismissed');
                if (!hasInstallPromptDismissed) {
                    setTimeout(() => {
                        this.showInstallPrompt(deferredPrompt);
                    }, 30000);
                }
            });

            window.addEventListener('appinstalled', () => {
                // Clear the deferredPrompt so it can be garbage collected
                deferredPrompt = null;
                localStorage.setItem('pwa-install-dismissed', 'true');
            });
        },

        // Show PWA install prompt
        showInstallPrompt(deferredPrompt) {
            if (!deferredPrompt) return;

            const installBanner = document.createElement('div');
            installBanner.innerHTML = `
                <div style="
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--meadow);
                    color: #2a1a08;
                    padding: 1rem 1.5rem;
                    border-radius: 1rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 1000;
                    max-width: 90vw;
                    text-align: center;
                    font-family: inherit;
                ">
                    <div style="margin-bottom: 0.75rem; font-weight: 600;">
                        📱 Install Orbweaver as an app for easier access
                    </div>
                    <button id="pwa-install-btn" style="
                        background: #2a1a08;
                        color: var(--meadow);
                        border: none;
                        padding: 0.5rem 1rem;
                        border-radius: 0.5rem;
                        font-weight: 600;
                        margin-right: 0.5rem;
                        cursor: pointer;
                    ">Install</button>
                    <button id="pwa-dismiss-btn" style="
                        background: transparent;
                        color: #2a1a08;
                        border: 1px solid #2a1a08;
                        padding: 0.5rem 1rem;
                        border-radius: 0.5rem;
                        font-weight: 600;
                        cursor: pointer;
                    ">Not now</button>
                </div>
            `;

            document.body.appendChild(installBanner);

            // Install button click
            document.getElementById('pwa-install-btn').addEventListener('click', async () => {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;

                if (outcome === 'accepted') {
                    localStorage.setItem('pwa-install-dismissed', 'true');
                }

                document.body.removeChild(installBanner);
                deferredPrompt = null;
            });

            // Dismiss button click
            document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
                localStorage.setItem('pwa-install-dismissed', 'true');
                document.body.removeChild(installBanner);
            });

            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (document.body.contains(installBanner)) {
                    document.body.removeChild(installBanner);
                }
            }, 10000);
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
        },

        // Scroll-triggered animations with Intersection Observer
        initScrollAnimations() {
            // Skip animations if user prefers reduced motion
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }

            // Elements to animate on scroll
            const animateElements = document.querySelectorAll('section, .cards-wrapper, .service-details');

            // Add initial animation classes
            animateElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            });

            // Intersection Observer for scroll animations
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Animate in
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';

                        // Add staggered animation for cards
                        const cards = entry.target.querySelectorAll('article');
                        if (cards.length > 0) {
                            cards.forEach((card, index) => {
                                card.style.opacity = '0';
                                card.style.transform = 'translateY(20px)';
                                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

                                setTimeout(() => {
                                    card.style.opacity = '1';
                                    card.style.transform = 'translateY(0)';
                                }, index * 150); // 150ms delay between cards
                            });
                        }

                        // Stop observing once animated
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            // Start observing elements
            animateElements.forEach(el => {
                observer.observe(el);
            });
        },

        // Hero Animation System with error handling
        initHeroAnimation() {
            try {
                const canvas = document.getElementById('hero-canvas');
                if (!canvas) return;

                // Respect motion preferences
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    return;
                }

                // Check for canvas support
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const heroSection = canvas.closest('.hero-image');
                if (!heroSection) return;

            let mouseX = 0;
            let mouseY = 0;
            let mouseStillTimer = 0;
            let lastMouseX = 0;
            let lastMouseY = 0;

            // Set canvas size
            const resizeCanvas = () => {
                canvas.width = heroSection.offsetWidth;
                canvas.height = heroSection.offsetHeight;
            };
            resizeCanvas();

            // Mouse tracking within hero section
            heroSection.addEventListener('mousemove', (e) => {
                const rect = heroSection.getBoundingClientRect();
                mouseX = e.clientX - rect.left;
                mouseY = e.clientY - rect.top;
                mouseStillTimer = 0;
            });

            // Orb class for floating lights
            class Orb {
                constructor(canvas) {
                    this.canvas = canvas;
                    this.reset();
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height;
                }

                reset() {
                    this.targetX = Math.random() * this.canvas.width;
                    this.targetY = Math.random() * this.canvas.height;
                    this.size = Math.random() * 8 + 4;
                    this.baseOpacity = Math.random() * 0.3 + 0.1;
                    this.opacity = 0;
                    this.pulsePhase = Math.random() * Math.PI * 2;
                    this.speed = Math.random() * 0.3 + 0.2;
                    this.hasApproached = false;
                    this.approachCooldown = 0;
                    this.glowIntensity = 0;
                }

                update() {
                    // Fade in gradually
                    if (this.opacity < this.baseOpacity) {
                        this.opacity += 0.001;
                    }

                    // Gentle movement toward target
                    const dx = this.targetX - this.x;
                    const dy = this.targetY - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > 5) {
                        this.x += (dx / distance) * this.speed;
                        this.y += (dy / distance) * this.speed;
                    } else {
                        this.targetX = Math.random() * this.canvas.width;
                        this.targetY = Math.random() * this.canvas.height;
                    }

                    // Floating motion
                    this.x += Math.sin(Date.now() * 0.0001 + this.pulsePhase) * 0.2;
                    this.y += Math.cos(Date.now() * 0.0001 + this.pulsePhase) * 0.15;
                    this.pulsePhase += 0.008;

                    // Mouse interaction
                    if (mouseStillTimer > 100 && !this.hasApproached && this.approachCooldown <= 0) {
                        const mouseDistance = Math.sqrt(
                            Math.pow(this.x - mouseX, 2) + Math.pow(this.y - mouseY, 2)
                        );

                        if (mouseDistance < 150) {
                            this.targetX = mouseX + (Math.random() - 0.5) * 40;
                            this.targetY = mouseY + (Math.random() - 0.5) * 40;
                            this.speed = 0.6;
                            this.glowIntensity = Math.min(0.8, this.glowIntensity + 0.015);

                            if (mouseDistance < 30) {
                                this.hasApproached = true;
                                this.approachCooldown = 200;
                                this.createGlimmer();
                            }
                        }
                    } else {
                        this.speed = Math.random() * 0.3 + 0.2;
                        this.glowIntensity = Math.max(0, this.glowIntensity - 0.008);
                    }

                    if (this.approachCooldown > 0) {
                        this.approachCooldown--;
                        if (this.approachCooldown === 0) {
                            this.hasApproached = false;
                        }
                    }

                    // Keep in bounds
                    if (this.x < 0) this.targetX = this.canvas.width;
                    if (this.x > this.canvas.width) this.targetX = 0;
                    if (this.y < 0) this.targetY = this.canvas.height;
                    if (this.y > this.canvas.height) this.targetY = 0;
                }

                draw(ctx) {
                    const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
                    const currentSize = this.size * pulse;

                    // Warm glow gradient
                    const gradient = ctx.createRadialGradient(
                        this.x, this.y, 0,
                        this.x, this.y, currentSize * 2.5
                    );

                    gradient.addColorStop(0, `rgba(255, 248, 220, ${this.opacity * 0.6 + this.glowIntensity * 0.2})`);
                    gradient.addColorStop(0.4, `rgba(255, 236, 179, ${this.opacity * 0.3})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, currentSize * 2.5, 0, Math.PI * 2);
                    ctx.fill();

                    // Inner light
                    ctx.fillStyle = `rgba(255, 255, 240, ${this.opacity * 0.4 + this.glowIntensity * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, currentSize * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }

                createGlimmer() {
                    const glimmer = document.createElement('div');
                    glimmer.className = 'glimmer';
                    glimmer.style.left = this.x + 'px';
                    glimmer.style.top = this.y + 'px';
                    heroSection.appendChild(glimmer);

                    setTimeout(() => {
                        if (heroSection.contains(glimmer)) {
                            heroSection.removeChild(glimmer);
                        }
                    }, 3000);
                }
            }

            // Create orbs (fewer for subtlety)
            const orbs = [];
            const orbCount = 5;

            for (let i = 0; i < orbCount; i++) {
                setTimeout(() => {
                    orbs.push(new Orb(canvas));
                }, i * 1500);
            }

            // Butterfly creation (less frequent)
            const createButterfly = () => {
                const butterfly = document.createElement('div');
                butterfly.className = 'butterfly';
                butterfly.innerHTML = `
                    <div class="butterfly-wing left"></div>
                    <div class="butterfly-wing right"></div>
                `;
                heroSection.appendChild(butterfly);

                const startX = Math.random() < 0.5 ? -40 : canvas.width + 40;
                let x = startX;
                let y = Math.random() * canvas.height;
                let vx = startX < 0 ? 1.2 : -1.2;
                let vy = (Math.random() - 0.5) * 0.4;
                let wavePhase = Math.random() * Math.PI * 2;

                butterfly.style.left = x + 'px';
                butterfly.style.top = y + 'px';

                setTimeout(() => {
                    butterfly.style.opacity = '0.6';
                }, 100);

                const moveButterfly = () => {
                    x += vx * 1.5;
                    y += vy * 1.5 + Math.sin(wavePhase) * 1.2;
                    wavePhase += 0.04;

                    if (Math.random() < 0.015) {
                        vy = (Math.random() - 0.5) * 0.4;
                    }

                    butterfly.style.left = x + 'px';
                    butterfly.style.top = y + 'px';

                    if (x < -50 || x > canvas.width + 50) {
                        butterfly.style.opacity = '0';
                        setTimeout(() => {
                            if (heroSection.contains(butterfly)) {
                                heroSection.removeChild(butterfly);
                            }
                        }, 2000);
                    } else {
                        requestAnimationFrame(moveButterfly);
                    }
                };

                requestAnimationFrame(moveButterfly);
            };

            // Occasional butterflies
            setInterval(() => {
                if (Math.random() < 0.2 && !document.hidden) {
                    createButterfly();
                }
            }, 20000);

            // Optimized animation loop with performance monitoring
            let lastTime = 0;
            const animate = (currentTime) => {
                if (document.hidden) {
                    requestAnimationFrame(animate);
                    return;
                }

                // Throttle to 30fps for better battery life on mobile
                if (currentTime - lastTime < 33) {
                    requestAnimationFrame(animate);
                    return;
                }
                lastTime = currentTime;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Update mouse stillness
                if (Math.abs(mouseX - lastMouseX) < 2 && Math.abs(mouseY - lastMouseY) < 2) {
                    mouseStillTimer++;
                } else {
                    mouseStillTimer = 0;
                }
                lastMouseX = mouseX;
                lastMouseY = mouseY;

                // Update and draw orbs with batched operations
                orbs.forEach(orb => {
                    orb.update();
                    orb.draw(ctx);
                });

                requestAnimationFrame(animate);
            };

            // Start animation
            animate();

            // Handle resize
            window.addEventListener('resize', this.throttle(resizeCanvas, 250));

            // Initial butterfly after delay
            setTimeout(createButterfly, 8000);

            } catch (error) {
                // Gracefully handle animation failures
                if (window.location.hostname === 'localhost') {
                    console.warn('Hero animation failed to initialize:', error);
                }
            }
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => OrbweaverApp.init());
    } else {
        OrbweaverApp.init();
    }

})();
