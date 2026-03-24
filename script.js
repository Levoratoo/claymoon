/* ============================================================
   LEVORATO PRESS KIT — SCRIPT
   Particle system, animations, navbar, counters
   ============================================================ */

'use strict';

// ============================================================
// PARTICLE SYSTEM — canvas (hero only, pauses when off-screen)
// ============================================================

const canvas = document.getElementById('particle-canvas');
const ctx    = canvas.getContext('2d');
let particles = [];
let rafId;
let canvasVisible = true;

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.init();
    }

    init() {
        this.x     = Math.random() * canvas.width;
        this.y     = Math.random() * canvas.height;
        this.size  = Math.random() * 1.2 + 0.3;
        this.vx    = (Math.random() - 0.5) * 0.22;
        this.vy    = (Math.random() - 0.5) * 0.22;
        this.alpha = Math.random() * 0.4 + 0.06;
        this.isRed = Math.random() > 0.7;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -2)               this.x = canvas.width  + 2;
        if (this.x > canvas.width + 2) this.x = -2;
        if (this.y < -2)               this.y = canvas.height + 2;
        if (this.y > canvas.height + 2) this.y = -2;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.isRed
            ? `rgba(255, 26, 26, ${this.alpha})`
            : `rgba(200, 200, 200, ${this.alpha * 0.35})`;
        ctx.fill();
    }
}

function buildParticles() {
    particles = [];
    // Cap at 60 — enough for effect, light on GPU
    const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 22000));
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function tickParticles() {
    if (!canvasVisible) {
        rafId = requestAnimationFrame(tickParticles);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
        p.update();
        p.draw();
    }
    rafId = requestAnimationFrame(tickParticles);
}

// Pause canvas loop when hero is off-screen
(function watchCanvasVisibility() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    const obs = new IntersectionObserver(entries => {
        canvasVisible = entries[0].isIntersecting;
    }, { threshold: 0 });

    obs.observe(heroSection);
})();

// ============================================================
// NAVBAR
// ============================================================

const navbar    = document.getElementById('navbar');
const navToggle = document.getElementById('nav-toggle');
const navMenu   = document.getElementById('nav-menu');

function onScroll() {
    if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    updateActiveNav();
}

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ============================================================
// SMOOTH SCROLL (offset for fixed navbar)
// ============================================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const id     = this.getAttribute('href');
        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();

        const navH = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
        ) || 68;

        window.scrollTo({
            top:      target.getBoundingClientRect().top + window.scrollY - navH,
            behavior: 'smooth',
        });
    });
});

// ============================================================
// ACTIVE NAV LINK
// ============================================================

const navSections = Array.from(document.querySelectorAll('section[id]'));

function updateActiveNav() {
    const mid = window.scrollY + window.innerHeight / 3;

    let current = '';
    for (const section of navSections) {
        if (section.offsetTop <= mid) {
            current = section.id;
        }
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle(
            'active',
            link.getAttribute('href') === `#${current}`
        );
    });
}

// ============================================================
// INTERSECTION OBSERVER — REVEAL ANIMATIONS
// ============================================================

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
    revealObserver.observe(el);
});

// ============================================================
// NUMBER COUNTER ANIMATION
// ============================================================

function animateCounter(el, target) {
    const duration = target > 999 ? 2200 : 1600;
    const start    = performance.now();

    function tick(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3);
        const value    = Math.round(eased * target);

        el.textContent = value.toLocaleString('pt-BR');

        if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el     = entry.target;
                const target = parseInt(el.dataset.target, 10);
                if (!isNaN(target)) animateCounter(el, target);
                counterObserver.unobserve(el);
            }
        });
    },
    { threshold: 0.5 }
);

document.querySelectorAll('.number-value[data-target]').forEach(el => {
    counterObserver.observe(el);
});

// ============================================================
// CURSOR GLOW (subtle red spotlight, desktop only)
// ============================================================

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    (function setupCursorGlow() {
        const glow = document.createElement('div');
        glow.style.cssText = `
            position:fixed;width:300px;height:300px;border-radius:50%;
            background:radial-gradient(circle,rgba(255,26,26,0.04) 0%,transparent 70%);
            pointer-events:none;z-index:0;transform:translate(-50%,-50%);
            transition:opacity 0.4s ease;opacity:0;
        `;
        document.body.appendChild(glow);

        let ticking = false;
        document.addEventListener('mousemove', e => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                glow.style.left    = e.clientX + 'px';
                glow.style.top     = e.clientY + 'px';
                glow.style.opacity = '1';
                ticking = false;
            });
        });

        document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
    })();
}

// ============================================================
// WINDOW EVENTS
// ============================================================

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        resizeCanvas();
        buildParticles();
    }, 250);
}, { passive: true });

window.addEventListener('scroll', onScroll, { passive: true });

// ============================================================
// TIMELINE — DRAG-TO-SCROLL DJ GALLERY
// ============================================================

function initDjGallery() {
    const gallery = document.getElementById('tl-dj-gallery');
    if (!gallery) return;

    let isDown = false, startX = 0, scrollLeft = 0;

    gallery.addEventListener('mousedown', e => {
        isDown = true;
        gallery.classList.add('grabbing');
        startX     = e.pageX - gallery.offsetLeft;
        scrollLeft = gallery.scrollLeft;
    });

    const endDrag = () => { isDown = false; gallery.classList.remove('grabbing'); };
    gallery.addEventListener('mouseleave', endDrag);
    gallery.addEventListener('mouseup',    endDrag);

    gallery.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        gallery.scrollLeft = scrollLeft - (e.pageX - gallery.offsetLeft - startX) * 1.6;
    });

    let touchStartX = 0, touchScrollLeft = 0;
    gallery.addEventListener('touchstart', e => {
        touchStartX     = e.touches[0].pageX;
        touchScrollLeft = gallery.scrollLeft;
    }, { passive: true });
    gallery.addEventListener('touchmove', e => {
        gallery.scrollLeft = touchScrollLeft + (touchStartX - e.touches[0].pageX);
    }, { passive: true });
}

// ============================================================
// TIMELINE — MOBILE CAROUSEL DRAG
// ============================================================

function initTimelineMobileCarousels() {
    const carousels = document.querySelectorAll('.tl-vc-mask');
    if (!carousels.length) return;

    carousels.forEach(carousel => {
        let isPointerDown = false, startX = 0, startY = 0;
        let startScrollLeft = 0, isHorizontalDrag = false;

        carousel.addEventListener('pointerdown', e => {
            if (window.innerWidth > 900) return;
            isPointerDown = true; isHorizontalDrag = false;
            startX = e.clientX; startY = e.clientY;
            startScrollLeft = carousel.scrollLeft;
        });

        carousel.addEventListener('pointermove', e => {
            if (!isPointerDown || window.innerWidth > 900) return;
            const dx = e.clientX - startX, dy = e.clientY - startY;
            if (!isHorizontalDrag) {
                if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return;
                isHorizontalDrag = true;
            }
            e.preventDefault();
            carousel.scrollLeft = startScrollLeft - dx;
        });

        const end = () => { isPointerDown = false; isHorizontalDrag = false; };
        carousel.addEventListener('pointerup',          end);
        carousel.addEventListener('pointercancel',      end);
        carousel.addEventListener('lostpointercapture', end);
    });
}

// ============================================================
// TIMELINE — TENSION BLOCK GLITCH
// ============================================================

function initTensionGlitch() {
    const el = document.getElementById('tl-glitch');
    if (!el) return;

    let glitchVisible = false;
    const obs = new IntersectionObserver(entries => {
        glitchVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    obs.observe(el);

    setInterval(() => {
        if (!glitchVisible || Math.random() > 0.55) return;
        el.style.transform = `translateX(${(Math.random() - 0.5) * 8}px)`;
        setTimeout(() => { el.style.transform = ''; }, 80);
    }, 600);
}

// ============================================================
// TIMELINE — SPINE LINE SCROLL ANIMATION
// ============================================================

function initSpineLine() {
    const wrapper   = document.querySelector('.tl-spine-wrapper');
    const spineLine = document.getElementById('tl-spine-line');
    const endDot    = document.querySelector('#tl-ch2 .tl-node-dot');
    if (!wrapper || !spineLine) return;

    function updateSpine() {
        const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
        let endY;
        if (endDot) {
            const dotRect = endDot.getBoundingClientRect();
            endY = dotRect.top + window.scrollY + endDot.offsetHeight / 2;
        } else {
            endY = wrapperTop + wrapper.offsetHeight;
        }

        const totalSpan = endY - wrapperTop;
        const scrolled  = Math.max(0, window.scrollY + window.innerHeight * 0.55 - wrapperTop);
        const pct       = Math.min(100, (scrolled / totalSpan) * 100);
        spineLine.style.height = ((pct / 100) * totalSpan) + 'px';
    }

    window.addEventListener('scroll', updateSpine, { passive: true });
    updateSpine();
}

// ============================================================
// TIMELINE — SCROLL REVEAL WITH STAGGER
// ============================================================

function initTimelineReveal() {
    const items = document.querySelectorAll(
        '.tl-node-text, .tl-photo-grid--3, .tl-photo-grid--mosaic, .tl-tension-content, .tl-node-photos--gallery'
    );

    const obs = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.transitionDelay = `${i * 0.06}s`;
                entry.target.classList.add('tl-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    items.forEach(el => {
        el.style.opacity   = '0';
        el.style.transform = 'translateY(28px)';
        el.style.transition = 'opacity 0.75s ease, transform 0.75s ease';
        obs.observe(el);
    });

    document.querySelectorAll('.tl-node-dot-inner').forEach(dot => {
        dot.style.opacity   = '0';
        dot.style.transform = 'scale(0)';
        dot.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        const dotObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.style.opacity   = '1';
                    e.target.style.transform = 'scale(1)';
                    dotObs.unobserve(e.target);
                }
            });
        }, { threshold: 0.8 });
        dotObs.observe(dot);
    });

    const style = document.createElement('style');
    style.textContent = `.tl-visible { opacity: 1 !important; transform: none !important; }`;
    document.head.appendChild(style);
}

// ============================================================
// TIMELINE — TENSION SECTION: red flicker on entry
// ============================================================

function initTensionEntry() {
    const tension = document.getElementById('tl-ch3');
    if (!tension) return;

    const tensionObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bg = tension.querySelector('.tl-tension-bg');
                if (!bg) return;
                let count = 0;
                const flicker = setInterval(() => {
                    bg.style.opacity = count % 2 === 0 ? '1.6' : '0.4';
                    count++;
                    if (count >= 6) { clearInterval(flicker); bg.style.opacity = ''; }
                }, 80);
                tensionObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.35 });

    tensionObs.observe(tension);
}

// ============================================================
// HERO — CSS PARTICLES (generated at runtime, reduced count)
// ============================================================

function initHeroParticles() {
    const container = document.getElementById('hero-particles');
    if (!container) return;

    // Fewer particles on mobile/low-end
    const isMobile = window.innerWidth < 768;
    const COUNT    = isMobile ? 40 : 70;
    const COLORS   = ['#ff1a1a', '#ff3b3b', '#cc0000', '#ff5555', '#800000'];
    const frag     = document.createDocumentFragment();

    for (let i = 0; i < COUNT; i++) {
        const el    = document.createElement('span');
        const size  = (Math.random() * 7 + 2).toFixed(1);
        const top   = (Math.random() * 100).toFixed(1);
        const left  = (Math.random() * 100).toFixed(1);
        const dur   = (Math.random() * 3.5 + 2.5).toFixed(2);
        const delay = (Math.random() * 5).toFixed(2);
        const op    = (Math.random() * 0.5 + 0.2).toFixed(2);
        const rise  = `-${(Math.random() * 30 + 10).toFixed(0)}px`;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        // Only add glow to larger particles to save GPU
        const glow  = size > 6 ? `0 0 ${Math.round(size * 1.3)}px ${color}88` : 'none';

        el.className = 'hp';
        el.style.cssText = `width:${size}px;height:${size}px;top:${top}%;left:${left}%;background:${color};box-shadow:${glow};animation-duration:${dur}s;animation-delay:-${delay}s;--hp-op:${op};--hp-rise:${rise};`;
        frag.appendChild(el);
    }

    container.appendChild(frag);
}

// ============================================================
// MUSIC — STREAM TABS
// ============================================================

function initStreamTabs() {
    const tabs   = document.querySelectorAll('.stream-tab');
    const panels = document.querySelectorAll('.stream-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t   => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.getElementById('panel-' + target);
            if (panel) panel.classList.add('active');
        });
    });
}

// ============================================================
// INIT
// ============================================================

function init() {
    resizeCanvas();
    buildParticles();
    tickParticles();
    onScroll();
    initDjGallery();
    initTimelineMobileCarousels();
    initTensionGlitch();
    initSpineLine();
    initTimelineReveal();
    initTensionEntry();
    initHeroParticles();
    initStreamTabs();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
