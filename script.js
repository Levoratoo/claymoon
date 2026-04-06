/* ============================================================
   LEVORATO PRESS KIT, SCRIPT
   Particle system, animations, navbar, counters
   ============================================================ */

'use strict';

// ============================================================
// PARTICLE SYSTEM, canvas (hero only, pauses when off-screen)
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
        this.size  = Math.random() * 1.3 + 0.25;
        this.vx    = (Math.random() - 0.5) * 0.20;
        this.vy    = (Math.random() - 0.5) * 0.20;
        this.alpha = Math.random() * 0.38 + 0.06;
        // Arcade palette: 50% cyan, 28% orange, 22% neutral blue-white
        const r = Math.random();
        this.colorType = r < 0.50 ? 'cyan' : r < 0.78 ? 'orange' : 'neutral';
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
        if (this.colorType === 'cyan') {
            ctx.fillStyle = `rgba(0, 229, 255, ${this.alpha})`;
        } else if (this.colorType === 'orange') {
            ctx.fillStyle = `rgba(255, 123, 0, ${this.alpha * 0.75})`;
        } else {
            ctx.fillStyle = `rgba(160, 210, 240, ${this.alpha * 0.28})`;
        }
        ctx.fill();
    }
}

function buildParticles() {
    particles = [];
    // Cap at 60, enough for effect, light on GPU
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

// Hero parallax, moves ::before background at 25% scroll speed
const heroEl               = document.querySelector('.hero');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function onScroll() {
    if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    if (heroEl && !prefersReducedMotion.matches) {
        const py = Math.min(window.scrollY * 0.25, 90);
        heroEl.style.setProperty('--hero-parallax', `${py}px`);
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
// SMOOTH SCROLL (navbar + scroll-padding-top em html)
// ============================================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const id     = this.getAttribute('href');
        if (!id || id === '#' || id.length < 2) return;

        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
            behavior: prefersReduced ? 'auto' : 'smooth',
            block: 'start',
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
// INTERSECTION OBSERVER, REVEAL ANIMATIONS
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
// TIMELINE, DRAG-TO-SCROLL DJ GALLERY
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
// TIMELINE, MOBILE CAROUSEL DRAG
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
// TIMELINE, TENSION BLOCK GLITCH
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
// TIMELINE, SPINE LINE SCROLL ANIMATION
// ============================================================

function initSpineLine() {
    const wrappers = document.querySelectorAll('.tl-spine-wrapper');
    if (!wrappers.length) return;

    function updateSpine(wrapper) {
        const spineLine = wrapper.querySelector('.tl-spine-line');
        if (!spineLine) return;
        const nodes = wrapper.querySelectorAll('.tl-node');
        const lastNode = nodes[nodes.length - 1];
        const endDot = lastNode ? lastNode.querySelector('.tl-node-dot') : null;

        const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
        let endY;
        if (endDot) {
            const dotRect = endDot.getBoundingClientRect();
            endY = dotRect.top + window.scrollY + endDot.offsetHeight / 2;
        } else {
            endY = wrapperTop + wrapper.offsetHeight;
        }

        const totalSpan = Math.max(1, endY - wrapperTop);
        const scrolled  = Math.max(0, window.scrollY + window.innerHeight * 0.55 - wrapperTop);
        const pct       = Math.min(100, (scrolled / totalSpan) * 100);
        spineLine.style.height = ((pct / 100) * totalSpan) + 'px';
    }

    function updateAll() {
        wrappers.forEach(updateSpine);
    }

    window.addEventListener('scroll', updateAll, { passive: true });
    updateAll();
}

// ============================================================
// TIMELINE, SCROLL REVEAL WITH STAGGER
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
// TIMELINE, TENSION SECTION: red flicker on entry
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
// HERO, CSS PARTICLES (generated at runtime, reduced count)
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
// MUSIC, STREAM TABS
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

function initDownloadsTabs() {
    const root = document.getElementById('downloads-tabs');
    if (!root) return;
    const tabs = root.querySelectorAll('.downloads-tab');
    const panels = root.parentElement.querySelectorAll('.downloads-panel');
    if (!tabs.length || !panels.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('active')) return;
            const target = tab.dataset.dlPanel;
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panel = document.getElementById('dl-panel-' + target);
            if (panel) panel.classList.add('active');
        });
    });
}

// ============================================================
// INTERNATIONALIZATION (i18n)
// ============================================================

const i18n = {
    pt: {
        'nav-historia'       : 'História',
        'nav-sobre'          : 'Sobre',
        'nav-musicas'        : 'Músicas',
        'hero-desc'          : 'Tech House com groove de House e Minimal Deep Tech: sets que ligam o moderno ao retrô.',
        'hero-listen'        : 'Ouvir Agora',
        'hero-pill'          : 'DJ & Producer • Porto, Portugal',
        'hero-highlight'     : 'Groove moderno com alma retrô',
        'stat-years'         : 'Anos como DJ',
        'stat-styles'        : 'Estilos',
        'hero-badge-location': 'Porto • PT',
        'hero-badge-genre'   : 'Tech House',
        'tl-section-tag'     : 'A HISTÓRIA',
        'tl-section-title'   : 'Uma trajetória de <span class="text-glow">2 anos</span>',
        'ch01-tag'           : 'CAPÍTULO 01',
        'ch01-title'         : 'Onde tudo<br><span class="tl-title-accent">começou.</span>',
        'ch01-desc'          : 'Raízes no Brasil e formação musical baseada em método e sensibilidade.<br><br>A virada veio na Europa, Dublin e a cena eletrônica como laboratório.<br><br>Foi ali que nasceu o ClayMoon.music: groove de pista, referências europeias e uma identidade entre Tech House e Minimal Deep Tech.<br><br>Este é o ponto de partida.',
        'ch02-tag'           : 'CAPÍTULO 02',
        'ch02-title'         : 'Onde eu<br><span class="tl-title-accent">cheguei.</span>',
        'ch02-crowd'         : 'Porto · press kit &amp; som pronto',
        'ch02-desc'          : 'Hoje meu projeto está consolidado: identidade visual definida, press kit estruturado e uma linha sonora clara entre Tech House e Minimal Deep Tech.<br><br>Minha proposta é pista, groove, energia e conexão com o público, sempre buscando referências da cena europeia.<br><br>O foco agora é expandir para novos palcos, construindo uma carreira sólida, consistente e alinhada com o mercado.',
        'ch03-tag'           : 'CAPÍTULO 03',
        'tension-e'          : 'E',
        'tension-phrase'     : ' onde estou',
        'tension-now'        : 'AGORA??',
        'tension-sub'        : 'A resposta está abaixo.',
        'ch04-tag'           : 'CAPÍTULO 03',
        'ch04-year'          : '2025, HOJE',
        'ch04-title'         : 'Novo<br><span class="tl-title-accent">Ciclo.</span>',
        'ch04-quote'         : 'Dois anos construindo o ClayMoon.music: identidade sólida, referências europeias e uma sonoridade que conecta Tech House e Minimal Deep Tech.<br><br>Agora começa um novo ciclo: mais maduro, mais estratégico e pronto para ocupar novos espaços na cena.',
        'sobre-tag'          : 'SOBRE',
        'sobre-title'        : 'Da pista local para a<br><span class="text-glow">cena europeia</span>',
        'sobre-p1'           : 'Claymoon.music é DJ há 2 anos e produtor musical, com início de trajetória em Dublin, Irlanda, onde teve contato direto com a cena eletrônica europeia e desenvolveu sua identidade sonora.',
        'sobre-p2'           : 'Hoje, baseado em Porto, Portugal, busca expandir sua presença nas pistas locais levando uma proposta única: um tech house groovado, com influências de house e minimal deep tech, construindo sets dinâmicos que surpreendem e mantêm a pista em movimento constante.',
        'sobre-p3'           : 'Sua estética mistura o moderno com o nostálgico, criando uma experiência sonora e visual que conecta passado e futuro na pista.',
        'sobre-p4'           : 'Minha formação em música pela <strong>Universidade Estadual de Maringá</strong> trouxe uma base forte, mas é na vivência que meu som ganha verdade.',
        'sobre-p5'           : 'Meu maior sonho é não entregar apenas o que o público quer, mas levar todo mundo para um lugar onde ninguém esteve antes.',
        'lugares-tag'        : 'PRESENÇA DE PALCO',
        'lugares-title'      : 'Lugares onde<br><span class="text-glow">já toquei</span>',
        'dl-tag'             : 'MATERIAL DE IMPRENSA',
        'dl-title'           : 'Fotos em <span class="text-glow">alta qualidade</span>',
        'dl-desc'            : 'Baixe individualmente ou o pacote completo sem perda de qualidade.',
        'dl-cta'             : 'Baixar todas as fotos (.zip)',
        'dl-btn'             : 'Baixar',
        'dl-tab-photos'      : 'Minhas fotos',
        'dl-tab-logo'        : 'Logo',
        'dl-logo-tag'        : 'LOGO OFICIAL',
        'dl-logo-title'      : 'Logo oficial para midia e contratantes',
        'dl-logo-desc'       : 'Baixe a logo oficial separada das fotos para aplicar em flyers, lineups, artes e materiais de divulgacao.',
        'dl-logo-btn'        : 'Baixar logo (.png)',
        'fs-tag': 'DESTAQUE',
        'fs-new': 'NOVO SET',
        'fs-title1': 'GROOVE',
        'fs-subtitle': 'Tech House &middot; Mar 2026',
        'fs-desc': 'Pure groove no dancefloor. Set de Tech House e Groove cheio de energia e textura, do início ao fim, pista em movimento.',
        'fs-listen': 'Ouvir no SoundCloud',
        'music-tag'          : 'OUÇA',
        'music-title'        : 'Sets no <span class="text-glow">SoundCloud</span>',
        'music-desc'         : 'Todos os sets disponíveis, ouça direto no player.',
        'sc-cta'             : 'Ver todos no SoundCloud',
        'booking-tag'        : 'CONTATO',
        'booking-title'      : 'Pronto para<br><span class="text-glow">levar ao limite?</span>',
        'booking-desc'       : 'Disponível para clubs, eventos e festivais.<br>Entre em contato e vamos criar algo memorável.',
        'booking-email-btn'  : 'E-mail em breve',
        'booking-email-aria' : 'E-mail ainda não disponível',
        'available-private'  : 'Eventos Privados',
        'footer-tagline'     : 'Groove moderno com alma retrô',
        'footer-nav-heading' : 'Navegação',
        'footer-sobre'       : 'Sobre',
        'footer-musicas'     : 'Músicas',
        'footer-social-heading': 'Redes Sociais',
        'footer-copy'        : '© 2026 Claymoon.music. Todos os direitos reservados.',
        'footer-credit-text' : 'Site desenvolvido por',
    },
    en: {
        'nav-historia'       : 'History',
        'nav-sobre'          : 'About',
        'nav-musicas'        : 'Music',
        'hero-desc'          : 'Tech House with groove from House &amp; Minimal Deep Tech: sets that connect the modern with the retro.',
        'hero-listen'        : 'Listen Now',
        'hero-pill'          : 'DJ & Producer • Porto, Portugal',
        'hero-highlight'     : 'Modern groove with a retro soul',
        'stat-years'         : 'Years as DJ',
        'stat-styles'        : 'Styles',
        'hero-badge-location': 'Porto • PT',
        'hero-badge-genre'   : 'Tech House',
        'tl-section-tag'     : 'THE STORY',
        'tl-section-title'   : 'A journey of <span class="text-glow">2 years</span>',
        'ch01-tag'           : 'CHAPTER 01',
        'ch01-title'         : 'Where it all<br><span class="tl-title-accent">began.</span>',
        'ch01-desc'          : 'Roots in Brazil and a musical foundation built on method and sensitivity.<br><br>The turning point came in Europe, Dublin and the electronic scene as a laboratory.<br><br>That’s where ClayMoon.music was born: floor groove, European references, and an identity between Tech House and Minimal Deep Tech.<br><br>This is the starting point.',
        'ch02-tag'           : 'CHAPTER 02',
        'ch02-title'         : 'How far<br><span class="tl-title-accent">I came.</span>',
        'ch02-crowd'         : 'Porto · press kit &amp; sound locked in',
        'ch02-desc'          : 'Today my project is consolidated: a defined visual identity, a structured press kit, and a clear sonic line between Tech House and Minimal Deep Tech.<br><br>My proposal is the floor, groove, energy, and connection with the crowd, always drawing from the European scene.<br><br>The focus now is expanding to new stages, building a solid, consistent career aligned with the market.',
        'ch03-tag'           : 'CHAPTER 03',
        'tension-e'          : 'And',
        'tension-phrase'     : ' where am I',
        'tension-now'        : 'NOW??',
        'tension-sub'        : 'The answer is below.',
        'ch04-tag'           : 'CHAPTER 03',
        'ch04-year'          : '2025, TODAY',
        'ch04-title'         : 'New<br><span class="tl-title-accent">Cycle.</span>',
        'ch04-quote'         : 'Two years building ClayMoon.music: solid identity, European references, and a sound that bridges Tech House and Minimal Deep Tech.<br><br>A new cycle is beginning now: more mature, more strategic, and ready to claim new space in the scene.',
        'sobre-tag'          : 'ABOUT',
        'sobre-title'        : 'From the local dance floor to the<br><span class="text-glow">European scene</span>',
        'sobre-p1'           : 'Claymoon.music has been a DJ for 2 years and is also a music producer, having started his journey in Dublin, Ireland, where he had direct contact with the European electronic scene and shaped his sonic identity.',
        'sobre-p2'           : 'Now based in Porto, Portugal, he is looking to expand his presence on local dance floors with a unique proposal: groovy tech house with influences from house and minimal deep tech, building dynamic sets that surprise and keep the floor in constant motion.',
        'sobre-p3'           : 'His aesthetic blends the modern with the nostalgic, creating a sonic and visual experience that connects past and future on the dance floor.',
        'sobre-p4'           : 'My music training at <strong>Universidade Estadual de Maringá</strong> gave me a strong foundation, but it\'s lived experience that gives my sound its truth.',
        'sobre-p5'           : 'My biggest dream is not just to deliver what the crowd wants, but to take everyone to a place where no one has ever been before.',
        'lugares-tag'        : 'STAGE PRESENCE',
        'lugares-title'      : 'Places where<br><span class="text-glow">I\'ve played</span>',
        'dl-tag'             : 'PRESS MATERIAL',
        'dl-title'           : 'Photos in <span class="text-glow">high quality</span>',
        'dl-desc'            : 'Download individually or the full package without quality loss.',
        'dl-cta'             : 'Download all photos (.zip)',
        'dl-btn'             : 'Download',
        'dl-tab-photos'      : 'My photos',
        'dl-tab-logo'        : 'Logo',
        'dl-logo-tag'        : 'OFFICIAL LOGO',
        'dl-logo-title'      : 'Official logo for media and bookers',
        'dl-logo-desc'       : 'Download the official logo separately from photos for flyers, lineups, artworks and promo materials.',
        'dl-logo-btn'        : 'Download logo (.png)',
        'fs-tag': 'FEATURED',
        'fs-new': 'NEW SET',
        'fs-title1': 'GROOVE',
        'fs-subtitle': 'Tech House &middot; Mar 2026',
        'fs-desc': 'Pure groove on the dancefloor. A Tech House set full of energy and texture, from start to finish, floor in motion.',
        'fs-listen': 'Listen on SoundCloud',
        'music-tag'          : 'LISTEN',
        'music-title'        : 'Sets on <span class="text-glow">SoundCloud</span>',
        'music-desc'         : 'All available sets, listen directly in the player.',
        'sc-cta'             : 'See all on SoundCloud',
        'booking-tag'        : 'CONTACT',
        'booking-title'      : 'Ready to<br><span class="text-glow">push the limits?</span>',
        'booking-desc'       : 'Available for clubs, events and festivals.<br>Get in touch and let\'s create something memorable.',
        'booking-email-btn'  : 'Email coming soon',
        'booking-email-aria' : 'Email not available yet',
        'available-private'  : 'Private Events',
        'footer-tagline'     : 'Modern groove with a retro soul',
        'footer-nav-heading' : 'Navigation',
        'footer-sobre'       : 'About',
        'footer-musicas'     : 'Music',
        'footer-social-heading': 'Social Media',
        'footer-copy'        : '© 2026 Claymoon.music. All rights reserved.',
        'footer-credit-text' : 'Website developed by',
    },
    es: {
        'nav-historia'       : 'Historia',
        'nav-sobre'          : 'Sobre',
        'nav-musicas'        : 'Música',
        'hero-desc'          : 'Tech House con groove de House y Minimal Deep Tech: sets que conectan lo moderno con el retro.',
        'hero-listen'        : 'Escuchar Ahora',
        'hero-pill'          : 'DJ & Producer • Porto, Portugal',
        'hero-highlight'     : 'Groove moderno con alma retro',
        'stat-years'         : 'Años como DJ',
        'stat-styles'        : 'Estilos',
        'hero-badge-location': 'Porto • PT',
        'hero-badge-genre'   : 'Tech House',
        'tl-section-tag'     : 'LA HISTORIA',
        'tl-section-title'   : 'Un viaje de <span class="text-glow">2 años</span>',
        'ch01-tag'           : 'CAPÍTULO 01',
        'ch01-title'         : 'Donde todo<br><span class="tl-title-accent">comenzó.</span>',
        'ch01-desc'          : 'Raíces en Brasil y formación musical basada en método y sensibilidad.<br><br>El giro llegó en Europa, Dublín y la electrónica como laboratorio.<br><br>Ahí nació ClayMoon.music: groove de pista, referencias europeas y una identidad entre Tech House y Minimal Deep Tech.<br><br>Este es el punto de partida.',
        'ch02-tag'           : 'CAPÍTULO 02',
        'ch02-title'         : 'Hasta donde<br><span class="tl-title-accent">llegué.</span>',
        'ch02-crowd'         : 'Oporto · press kit y sonido listo',
        'ch02-desc'          : 'Hoy mi proyecto está consolidado: identidad visual definida, press kit estructurado y una línea sonora clara entre Tech House y Minimal Deep Tech.<br><br>Mi propuesta es la pista, el groove, la energía y la conexión con el público, buscando siempre referencias de la escena europea.<br><br>El foco ahora es expandirse a nuevos escenarios, construyendo una carrera sólida, consistente y alineada con el mercado.',
        'ch03-tag'           : 'CAPÍTULO 03',
        'tension-e'          : 'Y',
        'tension-phrase'     : ' dónde estoy',
        'tension-now'        : '¿AHORA??',
        'tension-sub'        : 'La respuesta está abajo.',
        'ch04-tag'           : 'CAPÍTULO 03',
        'ch04-year'          : '2025, HOY',
        'ch04-title'         : 'Nuevo<br><span class="tl-title-accent">Ciclo.</span>',
        'ch04-quote'         : 'Dos años construyendo ClayMoon.music: identidad sólida, referencias europeas y una sonoridad que conecta Tech House y Minimal Deep Tech.<br><br>Ahora empieza un nuevo ciclo: más maduro, más estratégico y listo para ocupar nuevos espacios en la escena.',
        'sobre-tag'          : 'SOBRE',
        'sobre-title'        : 'De la pista local a la<br><span class="text-glow">escena europea</span>',
        'sobre-p1'           : 'Claymoon.music es DJ desde hace 2 años y productor musical, con inicio de trayectoria en Dublín, Irlanda, donde tuvo contacto directo con la escena electrónica europea y desarrolló su identidad sonora.',
        'sobre-p2'           : 'Hoy, establecido en Porto, Portugal, busca expandir su presencia en las pistas locales con una propuesta única: un tech house con groove, con influencias de house y minimal deep tech, construyendo sets dinámicos que sorprenden y mantienen la pista en movimiento constante.',
        'sobre-p3'           : 'Su estética mezcla lo moderno con lo nostálgico, creando una experiencia sonora y visual que conecta pasado y futuro en la pista.',
        'sobre-p4'           : 'Mi formación en música en la <strong>Universidade Estadual de Maringá</strong> me dio una base sólida, pero es en la vivencia donde mi sonido cobra verdad.',
        'sobre-p5'           : 'Mi mayor sueño no es solo entregar lo que el público quiere, sino llevar a todos a un lugar donde nadie ha estado antes.',
        'lugares-tag'        : 'PRESENCIA EN ESCENARIO',
        'lugares-title'      : 'Lugares donde<br><span class="text-glow">he tocado</span>',
        'dl-tag'             : 'MATERIAL DE PRENSA',
        'dl-title'           : 'Fotos en <span class="text-glow">alta calidad</span>',
        'dl-desc'            : 'Descarga individualmente o el paquete completo sin pérdida de calidad.',
        'dl-cta'             : 'Descargar todas las fotos (.zip)',
        'dl-btn'             : 'Descargar',
        'dl-tab-photos'      : 'Mis fotos',
        'dl-tab-logo'        : 'Logo',
        'dl-logo-tag'        : 'LOGO OFICIAL',
        'dl-logo-title'      : 'Logo oficial para prensa y bookers',
        'dl-logo-desc'       : 'Descarga el logo oficial separado de las fotos para usar en flyers, lineups, artes y materiales promocionales.',
        'dl-logo-btn'        : 'Descargar logo (.png)',
        'fs-tag': 'DESTACADO',
        'fs-new': 'NUEVO SET',
        'fs-title1': 'GROOVE',
        'fs-subtitle': 'Tech House &middot; Mar 2026',
        'fs-desc': 'Groove puro en la pista. Set de Tech House lleno de energía y textura, de principio a fin, la pista en movimiento.',
        'fs-listen': 'Escuchar en SoundCloud',
        'music-tag'          : 'ESCUCHA',
        'music-title'        : 'Sets en <span class="text-glow">SoundCloud</span>',
        'music-desc'         : 'Todos los sets disponibles, escucha directamente en el reproductor.',
        'sc-cta'             : 'Ver todos en SoundCloud',
        'booking-tag'        : 'CONTACTO',
        'booking-title'      : 'Listo para<br><span class="text-glow">llevar al límite?</span>',
        'booking-desc'       : 'Disponible para clubs, eventos y festivales.<br>Contáctame y creemos algo memorable.',
        'booking-email-btn'  : 'Correo en breve',
        'booking-email-aria' : 'Correo aún no disponible',
        'available-private'  : 'Eventos Privados',
        'footer-tagline'     : 'Groove moderno con alma retro',
        'footer-nav-heading' : 'Navegación',
        'footer-sobre'       : 'Sobre',
        'footer-musicas'     : 'Música',
        'footer-social-heading': 'Redes Sociales',
        'footer-copy'        : '© 2026 Claymoon.music. Todos los derechos reservados.',
        'footer-credit-text' : 'Sitio desarrollado por',
    },
    zh: {
        'nav-historia'       : '历程',
        'nav-sobre'          : '关于',
        'nav-musicas'        : '音乐',
        'hero-desc'          : '融合 House 与 Minimal Deep Tech 的律动 Tech House：连接现代与复古的 set。',
        'hero-listen'        : '立即收听',
        'hero-pill'          : 'DJ / 音乐制作人 • 葡萄牙波尔图',
        'hero-highlight'     : '现代律动，复古灵魂',
        'stat-years'         : 'DJ 年限',
        'stat-styles'        : '风格',
        'hero-badge-location': '波尔图 • PT',
        'hero-badge-genre'   : 'Tech House',
        'tl-section-tag'     : '历程',
        'tl-section-title'   : '2年的<span class="text-glow">旅程</span>',
        'ch01-tag'           : '第一章',
        'ch01-title'         : '一切<br><span class="tl-title-accent">开始的地方。</span>',
        'ch01-desc'          : '根在巴西，音乐训练建立在方法与感受之上。<br><br>转折在欧洲到来：都柏林与电子场景成为实验室。<br><br>ClayMoon.music 在那里诞生：舞池律动、欧洲参照，以及介于 Tech House 与 Minimal Deep Tech 之间的身份。<br><br>这里是起点。',
        'ch02-tag'           : '第二章',
        'ch02-title'         : '我<br><span class="tl-title-accent">到达的地方。</span>',
        'ch02-crowd'         : '波尔图 · 宣传素材与声音已就绪',
        'ch02-desc'          : '如今我的项目已成型：视觉识别清晰、宣传物料完整，并在 Tech House 与 Minimal Deep Tech 之间形成明确的音乐走向。<br><br>我的主张是舞池、律动、能量与和观众的连接，并持续汲取欧洲场景的灵感。<br><br>当下的重点是走向更多舞台，打造稳固、一致且与市场同频的长期事业。',
        'ch03-tag'           : '第三章',
        'tension-e'          : '而',
        'tension-phrase'     : ' 我现在在哪里',
        'tension-now'        : '现在？？',
        'tension-sub'        : '答案就在下面。',
        'ch04-tag'           : '第三章',
        'ch04-year'          : '2025, 至今',
        'ch04-title'         : '新<br><span class="tl-title-accent">篇章。</span>',
        'ch04-quote'         : '打造 ClayMoon.music 的两年：扎实的视觉识别、欧洲参照，以及连接 Tech House 与 Minimal Deep Tech 的声线。<br><br>新的周期正在开启：更成熟、更有策略，并准备在场景中占据更多位置。',
        'sobre-tag'          : '关于',
        'sobre-title'        : '从本地舞池到<br><span class="text-glow">欧洲场景</span>',
        'sobre-p1'           : 'Claymoon.music 做 DJ 已有 2 年，同时也是音乐制作人。他的旅程始于爱尔兰都柏林，在那里他直接接触了欧洲电子音乐场景，并逐步建立起自己的声音身份。',
        'sobre-p2'           : '如今他定居葡萄牙波尔图，正试图在本地舞池中扩大自己的存在感，带来独特的提案：以 House 和 Minimal Deep Tech 为影响、充满律动感的 Tech House，构建出既惊喜又让舞池持续流动的动态 set。',
        'sobre-p3'           : '他的美学把现代感与怀旧感结合在一起，创造出连接舞池中过去与未来的声音与视觉体验。',
        'sobre-p4'           : '在<strong>马林加州立大学（Universidade Estadual de Maringá）</strong>的音乐学习为我打下了扎实基础，但真正让我的声音有说服力的，是生活里的历练。',
        'sobre-p5'           : '我最大的梦想不只是提供观众想要的，而是带所有人去一个从未有人到过的地方。',
        'lugares-tag'        : '舞台足迹',
        'lugares-title'      : '我曾<br><span class="text-glow">演出的地方</span>',
        'dl-tag'             : '媒体素材',
        'dl-title'           : '高清<span class="text-glow">照片素材</span>',
        'dl-desc'            : '单独下载或下载完整套装，无损画质。',
        'dl-cta'             : '下载所有照片（.zip）',
        'dl-btn'             : '下载',
        'dl-tab-photos'      : '我的照片',
        'dl-tab-logo'        : 'Logo',
        'dl-logo-tag'        : '官方 LOGO',
        'dl-logo-title'      : '面向演出方与媒体的官方 Logo',
        'dl-logo-desc'       : '将官方 logo 与照片分开下载，用于海报、阵容图与宣传物料。',
        'dl-logo-btn'        : '下载 logo (.png)',
        'fs-tag': '精选',
        'fs-new': '新曲集',
        'fs-title1': 'GROOVE',
        'fs-subtitle': 'Tech House &middot; 2026年3月',
        'fs-desc': '舞池上的纯粹律动。充满能量与质感的 Tech House 曲目集, 从头到尾，舞池持续沸腾。',
        'fs-listen': '在 SoundCloud 收听',
        'music-tag'          : '收听',
        'music-title'        : '<span class="text-glow">SoundCloud</span> 上的曲目集',
        'music-desc'         : '所有可用曲目集, 直接在播放器中收听。',
        'sc-cta'             : '在 SoundCloud 查看全部',
        'booking-tag'        : '联系',
        'booking-title'      : '准备好<br><span class="text-glow">突破极限了吗？</span>',
        'booking-desc'       : '可接受俱乐部、活动和音乐节演出邀约。<br>联系我，一起创造难忘的体验。',
        'booking-email-btn'  : '邮箱稍后公布',
        'booking-email-aria' : '邮箱暂不可用',
        'available-private'  : '私人活动',
        'footer-tagline'     : '现代律动，复古灵魂',
        'footer-nav-heading' : '导航',
        'footer-sobre'       : '关于',
        'footer-musicas'     : '音乐',
        'footer-social-heading': '社交媒体',
        'footer-copy'        : '© 2026 Claymoon.music. 保留所有权利。',
        'footer-credit-text' : '网站开发者',
    },
    de: {
        'nav-historia'       : 'Geschichte',
        'nav-sobre'          : 'Über mich',
        'nav-musicas'        : 'Musik',
        'hero-desc'          : 'Tech House mit Groove aus House &amp; Minimal Deep Tech: Sets, die Modernes mit Retro verbinden.',
        'hero-listen'        : 'Jetzt hören',
        'hero-pill'          : 'DJ & Producer • Porto, Portugal',
        'hero-highlight'     : 'Moderner Groove mit Retro-Seele',
        'stat-years'         : 'Jahre als DJ',
        'stat-styles'        : 'Stile',
        'hero-badge-location': 'Porto • PT',
        'hero-badge-genre'   : 'Tech House',
        'tl-section-tag'     : 'DIE GESCHICHTE',
        'tl-section-title'   : 'Eine Reise von <span class="text-glow">2 Jahren</span>',
        'ch01-tag'           : 'KAPITEL 01',
        'ch01-title'         : 'Wo alles<br><span class="tl-title-accent">begann.</span>',
        'ch01-desc'          : 'Wurzeln in Brasilien und eine musikalische Basis aus Methode und Feingefühl.<br><br>Die Wendung kam in Europa: Dublin und die Elektronikszene als Labor.<br><br>Dort entstand ClayMoon.music: Floor-Groove, europäische Referenzen und eine Identität zwischen Tech House und Minimal Deep Tech.<br><br>Das ist der Ausgangspunkt.',
        'ch02-tag'           : 'KAPITEL 02',
        'ch02-title'         : 'Wie weit<br><span class="tl-title-accent">ich kam.</span>',
        'ch02-crowd'         : 'Porto · Press kit &amp; Sound steht',
        'ch02-desc'          : 'Heute ist mein Projekt gefestigt: klare visuelle Identität, strukturiertes Presskit und eine klare Klanglinie zwischen Tech House und Minimal Deep Tech.<br><br>Mein Anspruch ist Dancefloor, Groove, Energie und Verbindung zum Publikum, mit Blick auf die europäische Szene.<br><br>Jetzt geht es darum, auf neue Bühnen zu wachsen und eine solide, konsistente, marktgerechte Karriere aufzubauen.',
        'ch03-tag'           : 'KAPITEL 03',
        'tension-e'          : 'Und',
        'tension-phrase'     : ' wo bin ich',
        'tension-now'        : 'JETZT??',
        'tension-sub'        : 'Die Antwort liegt unten.',
        'ch04-tag'           : 'KAPITEL 03',
        'ch04-year'          : '2025, HEUTE',
        'ch04-title'         : 'Neuer<br><span class="tl-title-accent">Zyklus.</span>',
        'ch04-quote'         : 'Zwei Jahre ClayMoon.music: solide Identität, europäische Referenzen und ein Sound zwischen Tech House und Minimal Deep Tech.<br><br>Jetzt beginnt ein neuer Zyklus: reifer, strategischer und bereit, neue Räume in der Szene zu besetzen.',
        'sobre-tag'          : 'ÜBER',
        'sobre-title'        : 'Vom lokalen Dancefloor zur<br><span class="text-glow">europäischen Szene</span>',
        'sobre-p1'           : 'Claymoon.music ist seit 2 Jahren DJ und Musikproduzent. Seine Laufbahn begann in Dublin, Irland, wo er direkten Kontakt mit der europäischen elektronischen Szene hatte und seine klangliche Identität entwickelte.',
        'sobre-p2'           : 'Heute lebt er in Porto, Portugal, und will seine Präsenz auf lokalen Dancefloors mit einem einzigartigen Ansatz ausbauen: grooviger Tech House mit Einflüssen aus House und Minimal Deep Tech, in dynamischen Sets, die überraschen und den Floor konstant in Bewegung halten.',
        'sobre-p3'           : 'Seine Ästhetik verbindet das Moderne mit dem Nostalgischen und schafft ein klangliches und visuelles Erlebnis, das Vergangenheit und Zukunft auf dem Dancefloor zusammenführt.',
        'sobre-p4'           : 'Meine musikalische Ausbildung an der <strong>Universidade Estadual de Maringá</strong> hat mir ein starkes Fundament gegeben, aber in der gelebten Erfahrung gewinnt mein Sound seine Wahrheit.',
        'sobre-p5'           : 'Mein größter Traum ist nicht nur, das zu liefern, was das Publikum will, sondern alle an einen Ort zu bringen, wo noch niemand gewesen ist.',
        'lugares-tag'        : 'BÜHNENPRÄSENZ',
        'lugares-title'      : 'Orte, wo ich<br><span class="text-glow">gespielt habe</span>',
        'dl-tag'             : 'PRESSEMATERIAL',
        'dl-title'           : 'Fotos in <span class="text-glow">hoher Qualität</span>',
        'dl-desc'            : 'Einzeln oder als komplettes Paket ohne Qualitätsverlust herunterladen.',
        'dl-cta'             : 'Alle Fotos herunterladen (.zip)',
        'dl-btn'             : 'Herunterladen',
        'dl-tab-photos'      : 'Meine Fotos',
        'dl-tab-logo'        : 'Logo',
        'dl-logo-tag'        : 'OFFIZIELLES LOGO',
        'dl-logo-title'      : 'Offizielles Logo für Presse und Booker',
        'dl-logo-desc'       : 'Lade das offizielle Logo getrennt von den Fotos herunter für Flyer, Lineups, Artworks und Promo-Material.',
        'dl-logo-btn'        : 'Logo herunterladen (.png)',
        'fs-tag': 'HIGHLIGHT',
        'fs-new': 'NEUES SET',
        'fs-title1': 'GROOVE',
        'fs-subtitle': 'Tech House &middot; März 2026',
        'fs-desc': 'Purer Groove auf dem Dancefloor. Ein Tech House Set voller Energie und Textur, von Anfang bis Ende, der Floor in Bewegung.',
        'fs-listen': 'Auf SoundCloud anhören',
        'music-tag'          : 'HÖREN',
        'music-title'        : 'Sets auf <span class="text-glow">SoundCloud</span>',
        'music-desc'         : 'Alle verfügbaren Sets, direkt im Player anhören.',
        'sc-cta'             : 'Alle auf SoundCloud ansehen',
        'booking-tag'        : 'KONTAKT',
        'booking-title'      : 'Bereit, ans<br><span class="text-glow">Limit zu gehen?</span>',
        'booking-desc'       : 'Verfügbar für Clubs, Events und Festivals.<br>Melde dich, lass uns etwas Unvergessliches schaffen.',
        'booking-email-btn'  : 'E-Mail folgt in Kürze',
        'booking-email-aria' : 'E-Mail noch nicht verfügbar',
        'available-private'  : 'Private Events',
        'footer-tagline'     : 'Moderner Groove mit Retro-Seele',
        'footer-nav-heading' : 'Navigation',
        'footer-sobre'       : 'Über',
        'footer-musicas'     : 'Musik',
        'footer-social-heading': 'Social Media',
        'footer-copy'        : '© 2026 Claymoon.music. Alle Rechte vorbehalten.',
        'footer-credit-text' : 'Website entwickelt von',
    },
    ja: {
        'nav-historia'       : 'ヒストリー',
        'nav-sobre'          : 'プロフィール',
        'nav-musicas'        : 'ミュージック',
        'hero-desc'          : 'House × Minimal Deep Tech のグルーヴが宿る Tech House：モダンとレトロを繋ぐセット。',
        'hero-listen'        : '今すぐ聴く',
        'hero-pill'          : 'DJ / Producer • Porto, Portugal',
        'hero-highlight'     : 'モダングルーヴ、レトロな魂',
        'stat-years'         : 'DJ歴',
        'stat-styles'        : 'スタイル',
        'hero-badge-location': 'Porto • PT',
        'hero-badge-genre'   : 'Tech House',
        'tl-section-tag'     : 'ヒストリー',
        'tl-section-title'   : '<span class="text-glow">2年間</span>の軌跡',
        'ch01-tag'           : 'チャプター 01',
        'ch01-title'         : 'すべてが<br><span class="tl-title-accent">始まった場所。</span>',
        'ch01-desc'          : 'ブラジルに根ざし、メソッドと感性に基づく音楽の土台。<br><br>転機はヨーロッパで、ダブリンとエレクトロニックのシーンが実験場になった。<br><br>そこで ClayMoon.music が生まれた：フロアのグルーヴ、ヨーロッパの参照、Tech House と Minimal Deep Tech のあいだのアイデンティティ。<br><br>ここが出発点。',
        'ch02-tag'           : 'チャプター 02',
        'ch02-title'         : '私が<br><span class="tl-title-accent">到達した場所。</span>',
        'ch02-crowd'         : 'ポルト · プレスキット＆サウンド完成',
        'ch02-desc'          : 'いまプロジェクトは固まった：ビジュアルの方向性、整ったプレスキット、Tech House と Minimal Deep Tech をつなぐ明確なサウンドライン。<br><br>提案はフロア、グルーヴ、エネルギー、観客とのつながり、常にヨーロッパのシーンを参照すること。<br><br>次の焦点は新しいステージへ広げ、市場に沿った、安定した一貫性のあるキャリアを築くこと。',
        'ch03-tag'           : 'チャプター 03',
        'tension-e'          : 'そして',
        'tension-phrase'     : ' 今どこにいるのか',
        'tension-now'        : '今？？',
        'tension-sub'        : '答えは下にあります。',
        'ch04-tag'           : 'チャプター 03',
        'ch04-year'          : '2025, 現在',
        'ch04-title'         : '新しい<br><span class="tl-title-accent">サイクル。</span>',
        'ch04-quote'         : 'ClayMoon.music を築いてきた2年：揃ったアイデンティティ、ヨーロッパの参照、Tech House と Minimal Deep Tech をつなぐサウンド。<br><br>いま新しいサイクルが始まる：より成熟し、戦略的に、シーンで新たな場を取りにいく準備ができている。',
        'sobre-tag'          : 'プロフィール',
        'sobre-title'        : 'ローカルフロアから<br><span class="text-glow">ヨーロッパのシーンへ</span>',
        'sobre-p1'           : 'Claymoon.music は DJ として 2 年の経験を持ち、音楽プロデューサーとしても活動しています。キャリアの始まりはアイルランドのダブリンで、そこでヨーロッパの電子音楽シーンに直接触れ、自身のサウンドアイデンティティを育てました。',
        'sobre-p2'           : '現在はポルトガルのポルトを拠点に、House と Minimal Deep Tech の影響を受けたグルーヴィーな Tech House で、驚きがありフロアを絶えず動かし続けるダイナミックなセットを届けながら、ローカルシーンでの存在感を広げようとしています。',
        'sobre-p3'           : '彼の美学はモダンさとノスタルジーを融合させ、ダンスフロアで過去と未来をつなぐサウンドとビジュアルの体験を生み出します。',
        'sobre-p4'           : '<strong>Universidade Estadual de Maringá</strong>での音楽教育は強い土台をくれましたが、サウンドに真実を与えるのは日々の経験です。',
        'sobre-p5'           : '私の最大の夢は、オーディエンスが求めるものを届けるだけでなく、誰も行ったことのない場所へ皆を連れて行くことです。',
        'lugares-tag'        : 'ステージ実績',
        'lugares-title'      : '演奏した<br><span class="text-glow">場所</span>',
        'dl-tag'             : 'プレス素材',
        'dl-title'           : '高画質<span class="text-glow">フォト素材</span>',
        'dl-desc'            : '個別またはフルパッケージを画質を損なわずにダウンロード。',
        'dl-cta'             : 'すべての写真をダウンロード（.zip）',
        'dl-btn'             : 'ダウンロード',
        'dl-tab-photos'      : '写真',
        'dl-tab-logo'        : 'ロゴ',
        'dl-logo-tag'        : '公式ロゴ',
        'dl-logo-title'      : 'ブッカーとメディア向け公式ロゴ',
        'dl-logo-desc'       : 'フライヤー、ラインナップ、告知素材に使える公式ロゴを写真と分けてダウンロード。',
        'dl-logo-btn'        : 'ロゴをダウンロード (.png)',
        'fs-tag': '注目',
        'fs-new': '新着セット',
        'fs-title1': 'GROOVE',
        'fs-subtitle': 'Tech House &middot; 2026年3月',
        'fs-desc': 'フロアで純粋なグルーヴを。エネルギーとテクスチャに満ちた Tech House セット, 最初から最後まで、フロアが動き続ける。',
        'fs-listen': 'SoundCloudで聴く',
        'music-tag'          : '聴く',
        'music-title'        : '<span class="text-glow">SoundCloud</span>のセット',
        'music-desc'         : '全セット, プレーヤーで直接再生。',
        'sc-cta'             : 'SoundCloudですべて見る',
        'booking-tag'        : 'コンタクト',
        'booking-title'      : '限界を<br><span class="text-glow">超える準備はできていますか？</span>',
        'booking-desc'       : 'クラブ、イベント、フェスティバルへの出演受付中。<br>お問い合わせください。一緒に忘れられない体験を。',
        'booking-email-btn'  : 'メールは準備中',
        'booking-email-aria' : 'メールはまだ利用できません',
        'available-private'  : 'プライベートイベント',
        'footer-tagline'     : 'モダングルーヴ、レトロな魂',
        'footer-nav-heading' : 'ナビゲーション',
        'footer-sobre'       : 'プロフィール',
        'footer-musicas'     : '音楽',
        'footer-social-heading': 'ソーシャルメディア',
        'footer-copy'        : '© 2026 Claymoon.music. 無断複製禁止。',
        'footer-credit-text' : 'ウェブサイト制作',
    },
};

// Maps lang code → [flag class, short code]
const langMeta = {
    pt: ['fi-br', 'PT'],
    en: ['fi-us', 'EN'],
    es: ['fi-es', 'ES'],
    zh: ['fi-cn', '中文'],
    de: ['fi-de', 'DE'],
    ja: ['fi-jp', 'JP'],
};

function applyLang(lang) {
    const t = i18n[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const val = t[key];
        if (val === undefined) return;
        if (/<[^>]+>/.test(val)) {
            el.innerHTML = val;
        } else {
            el.textContent = val;
        }
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        const val = key ? t[key] : undefined;
        if (val !== undefined) el.setAttribute('aria-label', val);
    });

    // Keep data-text in sync for the CSS glitch effect
    const glitch = document.getElementById('tl-glitch');
    if (glitch) glitch.dataset.text = t['tension-now'] || glitch.dataset.text;

    // Update trigger pill display
    const meta = langMeta[lang] || ['fi-br', 'PT'];
    const triggerFlag = document.getElementById('trigger-flag');
    const triggerCode = document.getElementById('trigger-code');
    if (triggerFlag) {
        triggerFlag.className = `fi ${meta[0]} fis lang-flag`;
    }
    if (triggerCode) triggerCode.textContent = meta[1];

    // Update active option highlight in dropdown
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('lang-option--active', opt.dataset.lang === lang);
    });

    const langMap = { pt: 'pt-BR', en: 'en', es: 'es', zh: 'zh-CN', de: 'de', ja: 'ja' };
    document.documentElement.lang = langMap[lang] || lang;
    localStorage.setItem('levorato-lang', lang);
}

function initI18n() {
    const switcher = document.getElementById('lang-switcher');
    const trigger  = document.getElementById('lang-trigger');
    const dropdown = document.getElementById('lang-dropdown');
    if (!switcher || !trigger || !dropdown) return;

    // Toggle dropdown on trigger click
    trigger.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = switcher.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen);
    });

    // Select language from dropdown
    dropdown.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => {
            applyLang(opt.dataset.lang);
            switcher.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        });
    });

    // Close on outside click
    document.addEventListener('click', e => {
        if (!switcher.contains(e.target)) {
            switcher.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            switcher.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    // Apply saved language
    const saved = localStorage.getItem('levorato-lang') || 'pt';
    if (saved !== 'pt') applyLang(saved);
}

// ============================================================
// TITLE GLITCH, chromatic aberration on all section headings
// ============================================================

function initTitleGlitch() {
    const DURATIONS = [7, 8, 9, 10, 11, 12, 13, 14, 15];
    const els = document.querySelectorAll(
        '.section-title, .booking-title, .fs-title-line1, .fs-title-line2, .tl-chapter-title'
    );
    els.forEach((el, i) => {
        el.setAttribute('data-text', el.textContent.trim());
        el.classList.add('title-glitch');
        const dur = DURATIONS[i % DURATIONS.length];
        // Negative delay starts the animation mid-cycle so they're all offset
        const delay = -((Math.random() * dur * 0.9 + dur * 0.05).toFixed(2));
        el.style.setProperty('--tg-dur', dur + 's');
        el.style.setProperty('--tg-delay', delay + 's');
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
    initDownloadsTabs();
    initI18n();
    initTitleGlitch();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
