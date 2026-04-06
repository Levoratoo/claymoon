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

// Hero parallax — moves ::before background at 25% scroll speed
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

function initTimelineStoryTabs() {
    const root = document.getElementById('timeline-story-tabs');
    if (!root) return;
    const tabs = root.querySelectorAll('.downloads-tab');
    const panels = document.querySelectorAll('.tl-timeline-panel');
    if (!tabs.length || !panels.length) return;

    function activate(target) {
        tabs.forEach(t => {
            const on = t.getAttribute('data-tl-panel') === target;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach(p => {
            const panelTarget = p.getAttribute('data-tl-panel') || p.id.replace(/^tl-panel-/, '');
            const on = panelTarget === target;
            p.classList.toggle('active', on);
            p.setAttribute('aria-hidden', on ? 'false' : 'true');
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('active')) return;
            const target = tab.getAttribute('data-tl-panel');
            if (!target) return;
            activate(target);
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
        'tl-tab-performance' : 'Performance nos palcos',
        'tl-tab-education'   : 'Educação musical',
        'edu-01-tag'         : 'AGO 2015 — NOV 2015',
        'edu-01-title'       : 'Tok Music',
        'edu-01-role'        : 'Professor de guitarra e violão · Maringá, PR',
        'edu-01-desc'        : 'Onde comecei a ensinar: alunos em diferentes níveis, foco em aprendizado leve, prático e próximo, desenvolvendo didática e motivação desde o primeiro contato com o instrumento.',
        'edu-01-aria'        : 'Tok Music — abrir em nova aba',
        'edu-02-tag'         : 'FEV 2016 — JUL 2016',
        'edu-02-title'       : 'Universidade Estadual de Maringá',
        'edu-02-role'        : 'Projeto de extensão · Colégio de Aplicação Pedagógica (CAP)',
        'edu-02-desc'        : 'Atuação durante a graduação em Música: educação musical em ambiente escolar, com percepção, ritmo e instrumentos, alinhada à proposta pedagógica do projeto de extensão.',
        'edu-02-aria'        : 'CAP UEM — abrir em nova aba',
        'edu-03-tag'         : 'JUL 2016 — NOV 2016',
        'edu-03-title'       : 'Colégio Estadual Alberto Jackson Byington Junior',
        'edu-03-role'        : 'Professor de música · projeto de extensão · Maringá, PR',
        'edu-03-desc'        : 'Ensino de música no ambiente escolar público, adaptando conteúdo ao nível dos alunos e conectando teoria da graduação à prática em sala.',
        'edu-03-aria'        : 'Colégio Byington Junior — abrir em nova aba',
        'edu-04-tag'         : 'OUT 2016 — AGO 2018',
        'edu-04-title'       : 'Art Musica',
        'edu-04-role'        : 'Professor freelance · guitarra, violão, baixo e cavaquinho',
        'edu-04-desc'        : 'Aulas particulares para diferentes perfis e objetivos, com ênfase na prática e no repertório, usando a teoria como suporte quando fazia sentido para cada aluno.',
        'edu-04-aria'        : 'Art Musica — abrir em nova aba',
        'edu-05-tag'         : 'JAN 2017 — NOV 2017',
        'edu-05-title'       : 'Escola Municipal Victor Beloti',
        'edu-05-role'        : 'Estágio · educação musical · part-time · Maringá, PR',
        'edu-05-desc'        : 'Estágio no ensino público com acompanhamento pedagógico: planejamento, condução de turma e desenvolvimento de percepção e ritmo com instrumentos.',
        'edu-05-aria'        : 'Escola Municipal Victor Beloti — abrir em nova aba',
        'edu-06-tag'         : 'JAN 2017 — JUL 2019',
        'edu-06-title'       : 'Colégio Estadual do Jardim Independência',
        'edu-06-role'        : 'Estágio · professor de música · part-time · Maringá, PR',
        'edu-06-desc'        : 'Estágio no último ano da graduação em Música: autonomia em sala, planejamento das aulas e acompanhamento da evolução dos alunos em educação musical escolar.',
        'edu-06-aria'        : 'Colégio Jardim Independência — abrir em nova aba',
        'edu-07-tag'         : 'FEV 2017 — NOV 2017',
        'edu-07-title'       : 'Ateliê Da Criança',
        'edu-07-role'        : 'Educação musical infantil · bebês · Maringá, PR',
        'edu-07-desc'        : 'Trabalho com primeira infância: estímulos sonoros, ritmos, movimentos e vivências lúdicas, com sensibilidade, vínculo com as famílias e abordagem fora do modelo técnico tradicional.',
        'edu-07-aria'        : 'Ateliê Da Criança — abrir em nova aba',
        'edu-08-tag'         : 'ABR 2017 — OUT 2019',
        'edu-08-title'       : 'Som Maior Música e Arte',
        'edu-08-role'        : 'Professor · guitarra, violão, baixo e cavaquinho · Maringá, PR',
        'edu-08-desc'        : 'Aulas com foco prático e adaptação ao objetivo de cada aluno — da base técnica ao repertório — reforçando versatilidade instrumental e contato com perfis diversos.',
        'edu-08-aria'        : 'Som Maior Música e Arte — abrir em nova aba',
        'edu-09-tag'         : 'JUL 2017 — SET 2020',
        'edu-09-title'       : 'Belas Artes',
        'edu-09-role'        : 'Professor de música · guitarra, violão e outros instrumentos · part-time · Maringá, PR',
        'edu-09-desc'        : 'Aulas com foco prático, adaptadas ao objetivo de cada aluno — de iniciantes a repertório e técnica mais avançados — com teoria como apoio quando fazia sentido.',
        'edu-09-aria'        : 'Belas Artes — abrir em nova aba',
        'edu-10-tag'         : 'JUN 2018 — ABR 2019',
        'edu-10-title'       : 'Projeto de assistência social',
        'edu-10-role'        : 'Professor de música · idosos · part-time · Maringá, PR',
        'edu-10-desc'        : 'Música com foco em saúde e bem-estar: coordenação motora, memória, socialização e acolhimento. Instrumentos e atividades adaptados, apresentações em grupo e protagonismo dos participantes.',
        'edu-11-tag'         : 'MAR 2020 — DEZ 2020',
        'edu-11-title'       : 'Passantes Pensantes',
        'edu-11-role'        : 'Aulas coletivas de teclado e violão · part-time · Maringá, PR',
        'edu-11-desc'        : 'Turmas em grupo: prática colaborativa, níveis diferentes na mesma turma com adaptação contínua, ritmo, harmonia e repertório de forma acessível e dinâmica.',
        'edu-11-aria'        : 'Passantes e Pensantes — abrir em nova aba',
        'edu-12-tag'         : 'NOV 2021 — AGO 2023',
        'edu-12-title'       : 'Estação da Música',
        'edu-12-role'        : 'Professor multinstrumental e teoria · part-time · Itajaí, SC',
        'edu-12-desc'        : 'Guitarra, piano, violão, cavaquinho, pandeiro, percussão, teclado, contrabaixo e teoria musical para várias idades e níveis — técnica, repertório, percepção e ritmo com didática clara.',
        'edu-12-aria'        : 'Estação da Música — abrir em nova aba',
        'edu-13-tag'         : 'JUN 2022 — DEZ 2022',
        'edu-13-title'       : 'Centro Musicall',
        'edu-13-role'        : 'Professor multinstrumental e teoria · part-time · Balneário Camboriú, SC',
        'edu-13-desc'        : 'Ensino multinstrumental e teoria: prática equilibrada com fundamentos teóricos, técnica, interpretação e adaptação a cada objetivo.',
        'edu-13-aria'        : 'Centro Musicall — abrir em nova aba',
        'ch01-tag'           : 'CAPÍTULO 01',
        'ch01-title'         : 'Onde tudo<br><span class="tl-title-accent">começou.</span>',
        'ch01-desc'          : 'Raízes no Brasil e formação em música: método e ouvido antes de cruzar o Atlântico. Na Europa, Dublin e a cena eletrônica viraram laboratório — e há dois anos a jornada ganhou nome: ClayMoon.music, com estudo de groove, referências de pista e um som entre Tech House e Minimal Deep Tech. A foto ao lado é desse começo, antes do projeto assumir o visual e o discurso de hoje.',
        'ch02-tag'           : 'CAPÍTULO 02',
        'ch02-title'         : 'Onde eu<br><span class="tl-title-accent">cheguei.</span>',
        'ch02-crowd'         : 'Porto · press kit &amp; som pronto',
        'ch02-desc'          : 'Hoje o projeto está redondo: identidade visual, fotos de imprensa, sets no SoundCloud e um discurso de pista claro — groove, energia e referência europeia. A proposta é club, open air e warm-ups com Tech House e Minimal Deep Tech; o próximo passo é levar isso para o line-up certo, com material e postura de quem constrói carreira com consistência.',
        'ch03-tag'           : 'CAPÍTULO 03',
        'tension-e'          : 'E',
        'tension-phrase'     : ' onde estou',
        'tension-now'        : 'AGORA??',
        'tension-sub'        : 'A resposta está abaixo.',
        'ch04-tag'           : 'CAPÍTULO 03',
        'ch04-year'          : '2025 — HOJE',
        'ch04-title'         : 'Novo<br><span class="tl-title-accent">Ciclo.</span>',
        'ch04-quote'         : 'Dois anos focados em ClayMoon.music: referências europeias, estética arcade e sets que mostram onde quero chegar na pista — Minimal Bass no sangue, groove na cabeça e vontade de estrear o próximo capítulo com o time certo.',
        'sobre-tag'          : 'SOBRE',
        'sobre-title'        : 'Da pista local para a<br><span class="text-glow">cena europeia</span>',
        'sobre-p1'           : 'Claymoon.music é DJ há 2 anos e produtor musical, com início de trajetória em Dublin, Irlanda — onde teve contato direto com a cena eletrônica europeia e desenvolveu sua identidade sonora.',
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
        'fs-desc': 'Pure groove no dancefloor. Set de Tech House e Groove cheio de energia e textura — do início ao fim, pista em movimento.',
        'fs-listen': 'Ouvir no SoundCloud',
        'music-tag'          : 'OUÇA',
        'music-title'        : 'Sets no <span class="text-glow">SoundCloud</span>',
        'music-desc'         : 'Todos os sets disponíveis — ouça direto no player.',
        'sc-cta'             : 'Ver todos no SoundCloud',
        'booking-tag'        : 'CONTATO',
        'booking-title'      : 'Pronto para<br><span class="text-glow">levar ao limite?</span>',
        'booking-desc'       : 'Disponível para clubs, eventos e festivais.<br>Entre em contato e vamos criar algo memorável.',
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
        'tl-tab-performance' : 'Stage performance',
        'tl-tab-education'   : 'Music education',
        'edu-01-tag'         : 'AUG 2015 — NOV 2015',
        'edu-01-title'       : 'Tok Music',
        'edu-01-role'        : 'Guitar & acoustic guitar teacher · Maringá, PR',
        'edu-01-desc'        : 'Where I started teaching: students at different levels, with a light, hands-on, close approach, building pedagogy and motivation from the first contact with the instrument.',
        'edu-01-aria'        : 'Tok Music — open in new tab',
        'edu-02-tag'         : 'FEB 2016 — JUL 2016',
        'edu-02-title'       : 'Universidade Estadual de Maringá',
        'edu-02-role'        : 'Extension project · Colégio de Aplicação Pedagógica (CAP)',
        'edu-02-desc'        : 'Work during my Music degree: music education in a school setting — perception, rhythm and instruments — aligned with the extension project’s pedagogy.',
        'edu-02-aria'        : 'CAP UEM — open in new tab',
        'edu-03-tag'         : 'JUL 2016 — NOV 2016',
        'edu-03-title'       : 'Alberto Jackson Byington Junior State School',
        'edu-03-role'        : 'Music teacher · extension project · Maringá, PR',
        'edu-03-desc'        : 'Music teaching in public schools, adapting content to students’ levels and connecting degree theory with classroom practice.',
        'edu-03-aria'        : 'Byington Junior school — open in new tab',
        'edu-04-tag'         : 'OCT 2016 — AUG 2018',
        'edu-04-title'       : 'Art Musica',
        'edu-04-role'        : 'Freelance teacher · guitar, acoustic bass & cavaquinho',
        'edu-04-desc'        : 'Private lessons for different goals and profiles, emphasis on practice and repertoire, using theory as support when it made sense for each student.',
        'edu-04-aria'        : 'Art Musica — open in new tab',
        'edu-05-tag'         : 'JAN 2017 — NOV 2017',
        'edu-05-title'       : 'Victor Beloti Municipal School',
        'edu-05-role'        : 'Internship · music education · part-time · Maringá, PR',
        'edu-05-desc'        : 'Public-school internship with pedagogical mentoring: planning, leading classes, and building perception and rhythm with instruments.',
        'edu-05-aria'        : 'Victor Beloti school — open in new tab',
        'edu-06-tag'         : 'JAN 2017 — JUL 2019',
        'edu-06-title'       : 'Jardim Independência State School',
        'edu-06-role'        : 'Internship · music teacher · part-time · Maringá, PR',
        'edu-06-desc'        : 'Final-year Music degree internship: autonomy in the classroom, lesson planning, and tracking students’ progress in school music education.',
        'edu-06-aria'        : 'Jardim Independência school — open in new tab',
        'edu-07-tag'         : 'FEB 2017 — NOV 2017',
        'edu-07-title'       : 'Ateliê Da Criança',
        'edu-07-role'        : 'Early childhood music education · babies · Maringá, PR',
        'edu-07-desc'        : 'Work with infants: sound stimuli, rhythm, movement and playful experiences, with sensitivity, family connection, and a non-traditional technical approach.',
        'edu-07-aria'        : 'Ateliê Da Criança — open in new tab',
        'edu-08-tag'         : 'APR 2017 — OCT 2019',
        'edu-08-title'       : 'Som Maior Música e Arte',
        'edu-08-role'        : 'Teacher · guitar, acoustic bass & cavaquinho · Maringá, PR',
        'edu-08-desc'        : 'Lessons focused on practice and each student’s goals — from technique to repertoire — building versatility and diverse audiences.',
        'edu-08-aria'        : 'Som Maior Música e Arte — open in new tab',
        'edu-09-tag'         : 'JUL 2017 — SEP 2020',
        'edu-09-title'       : 'Belas Artes',
        'edu-09-role'        : 'Music teacher · guitar, acoustic & other instruments · part-time · Maringá, PR',
        'edu-09-desc'        : 'Practice-focused lessons tailored to each student — from beginners to advanced repertoire and technique — with theory as support when needed.',
        'edu-09-aria'        : 'Belas Artes — open in new tab',
        'edu-10-tag'         : 'JUN 2018 — APR 2019',
        'edu-10-title'       : 'Social outreach project',
        'edu-10-role'        : 'Music teacher · seniors · part-time · Maringá, PR',
        'edu-10-desc'        : 'Music for health and wellbeing: motor coordination, memory, social connection and care. Adapted instruments and activities, group performances and participant agency.',
        'edu-11-tag'         : 'MAR 2020 — DEC 2020',
        'edu-11-title'       : 'Passantes Pensantes',
        'edu-11-role'        : 'Group keyboard & guitar classes · part-time · Maringá, PR',
        'edu-11-desc'        : 'Group classes: collaborative practice, mixed levels in one room with ongoing adaptation, rhythm, harmony and repertoire in an accessible, dynamic way.',
        'edu-11-aria'        : 'Passantes e Pensantes — open in new tab',
        'edu-12-tag'         : 'NOV 2021 — AUG 2023',
        'edu-12-title'       : 'Estação da Música',
        'edu-12-role'        : 'Multi-instrument & theory teacher · part-time · Itajaí, SC',
        'edu-12-desc'        : 'Guitar, piano, acoustic, cavaquinho, pandeiro, percussion, keys, bass and theory for different ages and levels — technique, repertoire, ear training and rhythm with clear teaching.',
        'edu-12-aria'        : 'Estação da Música — open in new tab',
        'edu-13-tag'         : 'JUN 2022 — DEC 2022',
        'edu-13-title'       : 'Centro Musicall',
        'edu-13-role'        : 'Multi-instrument & theory teacher · part-time · Balneário Camboriú, SC',
        'edu-13-desc'        : 'Multi-instrument and theory: balanced practice with fundamentals, technique, interpretation and goals tailored to each student.',
        'edu-13-aria'        : 'Centro Musicall — open in new tab',
        'ch01-tag'           : 'CHAPTER 01',
        'ch01-title'         : 'Where it all<br><span class="tl-title-accent">began.</span>',
        'ch01-desc'          : 'Roots in Brazil and a formal music education: discipline and ear before crossing the Atlantic. In Europe, Dublin and the electronic scene became a lab — and for two years the journey has had a name: ClayMoon.music, studying groove, club references, and a sound between Tech House and Minimal Deep Tech. The photos are from that earlier chapter, before the project took on today’s look and voice.',
        'ch02-tag'           : 'CHAPTER 02',
        'ch02-title'         : 'How far<br><span class="tl-title-accent">I came.</span>',
        'ch02-crowd'         : 'Porto · press kit &amp; sound locked in',
        'ch02-desc'          : 'Today the project is rounded out: visual identity, press shots, SoundCloud sets, and a clear dance-floor story — groove, energy, and a European reference. The pitch is clubs, open air, and warm-ups with Tech House and Minimal Deep Tech; the next step is the right line-up, with assets and attitude built for the long run.',
        'ch03-tag'           : 'CHAPTER 03',
        'tension-e'          : 'And',
        'tension-phrase'     : ' where am I',
        'tension-now'        : 'NOW??',
        'tension-sub'        : 'The answer is below.',
        'ch04-tag'           : 'CHAPTER 03',
        'ch04-year'          : '2025 — TODAY',
        'ch04-title'         : 'New<br><span class="tl-title-accent">Cycle.</span>',
        'ch04-quote'         : 'Two years focused on ClayMoon.music: European references, arcade aesthetics, and sets that show where I want the night to go — Minimal Bass in the DNA, groove in the head, and ready to open the next chapter with the right crew.',
        'sobre-tag'          : 'ABOUT',
        'sobre-title'        : 'From the local dance floor to the<br><span class="text-glow">European scene</span>',
        'sobre-p1'           : 'Claymoon.music has been a DJ for 2 years and is also a music producer, having started his journey in Dublin, Ireland — where he had direct contact with the European electronic scene and shaped his sonic identity.',
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
        'fs-desc': 'Pure groove on the dancefloor. A Tech House set full of energy and texture — from start to finish, floor in motion.',
        'fs-listen': 'Listen on SoundCloud',
        'music-tag'          : 'LISTEN',
        'music-title'        : 'Sets on <span class="text-glow">SoundCloud</span>',
        'music-desc'         : 'All available sets — listen directly in the player.',
        'sc-cta'             : 'See all on SoundCloud',
        'booking-tag'        : 'CONTACT',
        'booking-title'      : 'Ready to<br><span class="text-glow">push the limits?</span>',
        'booking-desc'       : 'Available for clubs, events and festivals.<br>Get in touch and let\'s create something memorable.',
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
        'tl-tab-performance' : 'Actuación en escena',
        'tl-tab-education'   : 'Educación musical',
        'edu-01-tag'         : 'AGO 2015 — NOV 2015',
        'edu-01-title'       : 'Tok Music',
        'edu-01-role'        : 'Profesor de guitarra y guitarra acústica · Maringá, PR',
        'edu-01-desc'        : 'Donde empecé a enseñar: alumnos de distintos niveles, enfoque ligero, práctico y cercano, desarrollando didáctica y motivación desde el primer contacto con el instrumento.',
        'edu-01-aria'        : 'Tok Music — abrir en nueva pestaña',
        'edu-02-tag'         : 'FEB 2016 — JUL 2016',
        'edu-02-title'       : 'Universidade Estadual de Maringá',
        'edu-02-role'        : 'Proyecto de extensión · Colégio de Aplicação Pedagógica (CAP)',
        'edu-02-desc'        : 'Actuación durante la licenciatura en Música: educación musical en contexto escolar, con percepción, ritmo e instrumentos, alineada con la propuesta del proyecto de extensión.',
        'edu-02-aria'        : 'CAP UEM — abrir en nueva pestaña',
        'edu-03-tag'         : 'JUL 2016 — NOV 2016',
        'edu-03-title'       : 'Colégio Estadual Alberto Jackson Byington Junior',
        'edu-03-role'        : 'Profesor de música · proyecto de extensión · Maringá, PR',
        'edu-03-desc'        : 'Enseñanza de música en escuela pública, adaptando contenidos al nivel del alumnado y conectando la teoría de la carrera con la práctica en sala.',
        'edu-03-aria'        : 'Colégio Byington Junior — abrir en nueva pestaña',
        'edu-04-tag'         : 'OCT 2016 — AGO 2018',
        'edu-04-title'       : 'Art Musica',
        'edu-04-role'        : 'Profesor freelance · guitarra, guitarra acústica, bajo y cavaquinho',
        'edu-04-desc'        : 'Clases particulares para distintos perfiles y objetivos, con énfasis en práctica y repertorio, usando la teoría como apoyo cuando tenía sentido para cada alumno.',
        'edu-04-aria'        : 'Art Musica — abrir en nueva pestaña',
        'edu-05-tag'         : 'ENE 2017 — NOV 2017',
        'edu-05-title'       : 'Escuela Municipal Victor Beloti',
        'edu-05-role'        : 'Prácticas · educación musical · tiempo parcial · Maringá, PR',
        'edu-05-desc'        : 'Prácticas en enseñanza pública con acompañamiento pedagógico: planificación, conducción de grupo y desarrollo de percepción y ritmo con instrumentos.',
        'edu-05-aria'        : 'Escuela Municipal Victor Beloti — abrir en nueva pestaña',
        'edu-06-tag'         : 'ENE 2017 — JUL 2019',
        'edu-06-title'       : 'Colégio Estadual do Jardim Independência',
        'edu-06-role'        : 'Prácticas · profesor de música · tiempo parcial · Maringá, PR',
        'edu-06-desc'        : 'Prácticas en el último año de la licenciatura en Música: autonomía en sala, planificación de clases y seguimiento del alumnado en educación musical escolar.',
        'edu-06-aria'        : 'Colégio Jardim Independência — abrir en nueva pestaña',
        'edu-07-tag'         : 'FEB 2017 — NOV 2017',
        'edu-07-title'       : 'Ateliê Da Criança',
        'edu-07-role'        : 'Educación musical infantil · bebés · Maringá, PR',
        'edu-07-desc'        : 'Trabajo con primera infancia: estímulos sonoros, ritmos, movimientos y vivencias lúdicas, con sensibilidad, vínculo con las familias y enfoque fuera del modelo técnico tradicional.',
        'edu-07-aria'        : 'Ateliê Da Criança — abrir en nueva pestaña',
        'edu-08-tag'         : 'ABR 2017 — OCT 2019',
        'edu-08-title'       : 'Som Maior Música e Arte',
        'edu-08-role'        : 'Profesor · guitarra, guitarra acústica, bajo y cavaquinho · Maringá, PR',
        'edu-08-desc'        : 'Clases con enfoque práctico y adaptación al objetivo de cada alumno — de la base técnica al repertorio — reforzando versatilidad instrumental y perfiles diversos.',
        'edu-08-aria'        : 'Som Maior Música e Arte — abrir en nueva pestaña',
        'edu-09-tag'         : 'JUL 2017 — SEP 2020',
        'edu-09-title'       : 'Belas Artes',
        'edu-09-role'        : 'Profesor de música · guitarra, guitarra acústica y otros instrumentos · tiempo parcial · Maringá, PR',
        'edu-09-desc'        : 'Clases prácticas adaptadas al objetivo de cada alumno — de principiantes a repertorio y técnica avanzados — con teoría como apoyo cuando tenía sentido.',
        'edu-09-aria'        : 'Belas Artes — abrir en nueva pestaña',
        'edu-10-tag'         : 'JUN 2018 — ABR 2019',
        'edu-10-title'       : 'Proyecto de asistencia social',
        'edu-10-role'        : 'Profesor de música · personas mayores · tiempo parcial · Maringá, PR',
        'edu-10-desc'        : 'Música centrada en salud y bienestar: coordinación motriz, memoria, socialización y acogida. Instrumentos y actividades adaptados, presentaciones en grupo y protagonismo de los participantes.',
        'edu-11-tag'         : 'MAR 2020 — DIC 2020',
        'edu-11-title'       : 'Passantes Pensantes',
        'edu-11-role'        : 'Clases colectivas de teclado y guitarra · tiempo parcial · Maringá, PR',
        'edu-11-desc'        : 'Grupos: práctica colaborativa, distintos niveles en la misma clase con adaptación continua, ritmo, armonía y repertorio de forma accesible y dinámica.',
        'edu-11-aria'        : 'Passantes e Pensantes — abrir en nueva pestaña',
        'edu-12-tag'         : 'NOV 2021 — AGO 2023',
        'edu-12-title'       : 'Estação da Música',
        'edu-12-role'        : 'Profesor de multiinstrumento y teoría · tiempo parcial · Itajaí, SC',
        'edu-12-desc'        : 'Guitarra, piano, guitarra acústica, cavaquinho, pandeiro, percusión, teclado, bajo y teoría musical para todas las edades y niveles — técnica, repertorio, percepción y ritmo con didáctica clara.',
        'edu-12-aria'        : 'Estação da Música — abrir en nueva pestaña',
        'edu-13-tag'         : 'JUN 2022 — DIC 2022',
        'edu-13-title'       : 'Centro Musicall',
        'edu-13-role'        : 'Profesor de multiinstrumento y teoría · tiempo parcial · Balneário Camboriú, SC',
        'edu-13-desc'        : 'Enseñanza multiinstrumental y teoría: práctica equilibrada con fundamentos teóricos, técnica, interpretación y adaptación a cada objetivo.',
        'edu-13-aria'        : 'Centro Musicall — abrir en nueva pestaña',
        'ch01-tag'           : 'CAPÍTULO 01',
        'ch01-title'         : 'Donde todo<br><span class="tl-title-accent">comenzó.</span>',
        'ch01-desc'          : 'Raíces en Brasil y formación musical: método y oído antes de cruzar el Atlántico. En Europa, Dublín y la electrónica fueron laboratorio — y desde hace dos años el viaje tiene nombre: ClayMoon.music, con estudio de groove, referencias de pista y un sonido entre Tech House y Minimal Deep Tech. La imagen es de ese inicio, antes de la estética actual.',
        'ch02-tag'           : 'CAPÍTULO 02',
        'ch02-title'         : 'Hasta donde<br><span class="tl-title-accent">llegué.</span>',
        'ch02-crowd'         : 'Oporto · press kit y sonido listo',
        'ch02-desc'          : 'Hoy el proyecto está redondo: identidad visual, fotos de prensa, sets en SoundCloud y un discurso claro para la pista. La propuesta es club, open air y warm-ups con Tech House y Minimal Deep Tech; el siguiente paso es el line-up adecuado, con material y actitud profesional.',
        'ch03-tag'           : 'CAPÍTULO 03',
        'tension-e'          : 'Y',
        'tension-phrase'     : ' dónde estoy',
        'tension-now'        : '¿AHORA??',
        'tension-sub'        : 'La respuesta está abajo.',
        'ch04-tag'           : 'CAPÍTULO 03',
        'ch04-year'          : '2025 — HOY',
        'ch04-title'         : 'Nuevo<br><span class="tl-title-accent">Ciclo.</span>',
        'ch04-quote'         : 'Dos años enfocados en ClayMoon.music: referencias europeas, estética arcade y sets que muestran hacia dónde quiero llevar la noche — Minimal Bass en la sangre, groove en la cabeza y ganas de abrir el próximo capítulo con el equipo adecuado.',
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
        'fs-desc': 'Groove puro en la pista. Set de Tech House lleno de energía y textura — de principio a fin, la pista en movimiento.',
        'fs-listen': 'Escuchar en SoundCloud',
        'music-tag'          : 'ESCUCHA',
        'music-title'        : 'Sets en <span class="text-glow">SoundCloud</span>',
        'music-desc'         : 'Todos los sets disponibles — escucha directamente en el reproductor.',
        'sc-cta'             : 'Ver todos en SoundCloud',
        'booking-tag'        : 'CONTACTO',
        'booking-title'      : 'Listo para<br><span class="text-glow">llevar al límite?</span>',
        'booking-desc'       : 'Disponible para clubs, eventos y festivales.<br>Contáctame y creemos algo memorable.',
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
        'tl-tab-performance' : '舞台演出',
        'tl-tab-education'   : '音乐教育',
        'edu-01-tag'         : '2015年8月 — 2015年11月',
        'edu-01-title'       : 'Tok Music',
        'edu-01-role'        : '吉他教师 · 马林加，巴拉那州',
        'edu-01-desc'        : '我开始教学的地方：不同水平的学员，轻松、务实、贴近的教学方式，从第一次接触乐器就培养教学法与动力。',
        'edu-01-aria'        : 'Tok Music — 在新标签页打开',
        'edu-02-tag'         : '2016年2月 — 2016年7月',
        'edu-02-title'       : '马林加州立大学（Universidade Estadual de Maringá）',
        'edu-02-role'        : '推广项目 · 教育应用学校（CAP）',
        'edu-02-desc'        : '音乐本科期间：学校环境下的音乐教育，包括听觉、节奏与乐器，与推广项目的教学理念一致。',
        'edu-02-aria'        : 'CAP UEM — 在新标签页打开',
        'edu-03-tag'         : '2016年7月 — 2016年11月',
        'edu-03-title'       : 'Alberto Jackson Byington Junior 州立中学',
        'edu-03-role'        : '音乐教师 · 推广项目 · 马林加，巴拉那州',
        'edu-03-desc'        : '公立学校音乐教学，根据学生程度调整内容，将本科理论联系课堂实践。',
        'edu-03-aria'        : 'Byington Junior 学校 — 在新标签页打开',
        'edu-04-tag'         : '2016年10月 — 2018年8月',
        'edu-04-title'       : 'Art Musica',
        'edu-04-role'        : '自由教师 · 吉他、木吉他、贝斯与卡瓦奎尼奥',
        'edu-04-desc'        : '针对不同目标与学员的一对一课程，强调实践与曲目，必要时辅以理论。',
        'edu-04-aria'        : 'Art Musica — 在新标签页打开',
        'edu-05-tag'         : '2017年1月 — 2017年11月',
        'edu-05-title'       : 'Victor Beloti 市立学校',
        'edu-05-role'        : '实习 · 音乐教育 · 兼职 · 马林加，巴拉那州',
        'edu-05-desc'        : '公立学校实习，带教学辅导：备课、课堂组织与用乐器培养听觉与节奏。',
        'edu-05-aria'        : 'Victor Beloti 学校 — 在新标签页打开',
        'edu-06-tag'         : '2017年1月 — 2019年7月',
        'edu-06-title'       : 'Jardim Independência 州立中学',
        'edu-06-role'        : '实习 · 音乐教师 · 兼职 · 马林加，巴拉那州',
        'edu-06-desc'        : '音乐本科最后一年实习：课堂自主、课程规划与跟踪学生在校音乐教育中的进展。',
        'edu-06-aria'        : 'Jardim Independência 学校 — 在新标签页打开',
        'edu-07-tag'         : '2017年2月 — 2017年11月',
        'edu-07-title'       : 'Ateliê Da Criança',
        'edu-07-role'        : '幼儿音乐教育 · 婴儿 · 马林加，巴拉那州',
        'edu-07-desc'        : '面向婴幼儿：声音刺激、节奏、动作与游戏化体验，注重家庭连结与非传统技术路线。',
        'edu-07-aria'        : 'Ateliê Da Criança — 在新标签页打开',
        'edu-08-tag'         : '2017年4月 — 2019年10月',
        'edu-08-title'       : 'Som Maior Música e Arte',
        'edu-08-role'        : '教师 · 吉他、木吉他、贝斯与卡瓦奎尼奥 · 马林加，巴拉那州',
        'edu-08-desc'        : '以实践为目标、因人而异的课程——从基础技术到曲目——培养多面手与多样学员。',
        'edu-08-aria'        : 'Som Maior Música e Arte — 在新标签页打开',
        'edu-09-tag'         : '2017年7月 — 2020年9月',
        'edu-09-title'       : 'Belas Artes',
        'edu-09-role'        : '音乐教师 · 吉他、木吉他及其他乐器 · 兼职 · 马林加，巴拉那州',
        'edu-09-desc'        : '注重实践的课程，按目标调整——从初学者到进阶曲目与技术——需要时辅以理论。',
        'edu-09-aria'        : 'Belas Artes — 在新标签页打开',
        'edu-10-tag'         : '2018年6月 — 2019年4月',
        'edu-10-title'       : '社会援助项目',
        'edu-10-role'        : '音乐教师 · 长者 · 兼职 · 马林加，巴拉那州',
        'edu-10-desc'        : '以健康与福祉为重的音乐：运动协调、记忆、社交与关怀。适配的乐器与活动、小组演出与参与者主体性。',
        'edu-11-tag'         : '2020年3月 — 2020年12月',
        'edu-11-title'       : 'Passantes Pensantes',
        'edu-11-role'        : '键盘与吉他集体课 · 兼职 · 马林加，巴拉那州',
        'edu-11-desc'        : '小组课：协作练习、同班混龄与持续调整，节奏、和声与曲目，轻松而有活力。',
        'edu-11-aria'        : 'Passantes e Pensantes — 在新标签页打开',
        'edu-12-tag'         : '2021年11月 — 2023年8月',
        'edu-12-title'       : 'Estação da Música',
        'edu-12-role'        : '多乐器与乐理教师 · 兼职 · 伊塔雅伊，圣卡塔琳娜州',
        'edu-12-desc'        : '吉他、钢琴、木吉他、卡瓦奎尼奥、铃鼓、打击、键盘、低音与乐理，面向不同年龄与水平——技术、曲目、听觉与节奏，教学清晰。',
        'edu-12-aria'        : 'Estação da Música — 在新标签页打开',
        'edu-13-tag'         : '2022年6月 — 2022年12月',
        'edu-13-title'       : 'Centro Musicall',
        'edu-13-role'        : '多乐器与乐理教师 · 兼职 · 巴尔内阿里奥坎博里乌，圣卡塔琳娜州',
        'edu-13-desc'        : '多乐器与乐理：实践与基础理论平衡，技术、诠释与目标因人而异。',
        'edu-13-aria'        : 'Centro Musicall — 在新标签页打开',
        'ch01-tag'           : '第一章',
        'ch01-title'         : '一切<br><span class="tl-title-accent">开始的地方。</span>',
        'ch01-desc'          : '根在巴西，受过系统的音乐训练：在跨洋之前有方法与耳朵。在欧洲，都柏林与电子场景成了实验室——两年来，这段路有了名字：ClayMoon.music，钻研律动、舞池审美，以及 Tech House 与 Minimal Deep Tech 之间的声音。照片来自更早的阶段，那时项目还没有今天的视觉与叙事。',
        'ch02-tag'           : '第二章',
        'ch02-title'         : '我<br><span class="tl-title-accent">到达的地方。</span>',
        'ch02-crowd'         : '波尔图 · 宣传素材与声音已就绪',
        'ch02-desc'          : '如今项目完整：视觉识别、宣传照、SoundCloud 上的 set，以及清晰的舞池叙事——律动、能量与欧洲参照。面向俱乐部、户外与暖场，风格为 Tech House 与 Minimal Deep Tech；下一步是进入合适的阵容，以专业素材与态度长期经营。',
        'ch03-tag'           : '第三章',
        'tension-e'          : '而',
        'tension-phrase'     : ' 我现在在哪里',
        'tension-now'        : '现在？？',
        'tension-sub'        : '答案就在下面。',
        'ch04-tag'           : '第三章',
        'ch04-year'          : '2025 — 至今',
        'ch04-title'         : '新<br><span class="tl-title-accent">篇章。</span>',
        'ch04-quote'         : '两年专注于 ClayMoon.music：欧洲参照、街机美学与 sets，展现我想把夜晚带向何方——Minimal Bass 在血液里，律动感在脑中，并准备好与合适的团队开启下一章。',
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
        'fs-desc': '舞池上的纯粹律动。充满能量与质感的 Tech House 曲目集——从头到尾，舞池持续沸腾。',
        'fs-listen': '在 SoundCloud 收听',
        'music-tag'          : '收听',
        'music-title'        : '<span class="text-glow">SoundCloud</span> 上的曲目集',
        'music-desc'         : '所有可用曲目集——直接在播放器中收听。',
        'sc-cta'             : '在 SoundCloud 查看全部',
        'booking-tag'        : '联系',
        'booking-title'      : '准备好<br><span class="text-glow">突破极限了吗？</span>',
        'booking-desc'       : '可接受俱乐部、活动和音乐节演出邀约。<br>联系我，一起创造难忘的体验。',
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
        'tl-tab-performance' : 'Auf der Bühne',
        'tl-tab-education'   : 'Musikpädagogik',
        'edu-01-tag'         : 'AUG 2015 — NOV 2015',
        'edu-01-title'       : 'Tok Music',
        'edu-01-role'        : 'Gitarre- & Akustikgitarrenlehrer · Maringá, PR',
        'edu-01-desc'        : 'Wo ich mit dem Unterricht begann: unterschiedliche Niveaus, leichter, praxisnaher, persönlicher Ansatz, Didaktik und Motivation vom ersten Kontakt mit dem Instrument an.',
        'edu-01-aria'        : 'Tok Music — in neuem Tab öffnen',
        'edu-02-tag'         : 'FEB 2016 — JUL 2016',
        'edu-02-title'       : 'Universidade Estadual de Maringá',
        'edu-02-role'        : 'Erweiterungsprojekt · Colégio de Aplicação Pedagógica (CAP)',
        'edu-02-desc'        : 'Tätigkeit während des Musikstudiums: musikalische Bildung in der Schule — Wahrnehmung, Rhythmus und Instrumente — im Einklang mit der Projektpädagogik.',
        'edu-02-aria'        : 'CAP UEM — in neuem Tab öffnen',
        'edu-03-tag'         : 'JUL 2016 — NOV 2016',
        'edu-03-title'       : 'Staatliche Schule Alberto Jackson Byington Junior',
        'edu-03-role'        : 'Musiklehrer · Erweiterungsprojekt · Maringá, PR',
        'edu-03-desc'        : 'Musikunterricht in öffentlichen Schulen, Inhalte an das Niveau angepasst und Studientheorie mit Unterrichtspraxis verbunden.',
        'edu-03-aria'        : 'Byington Junior — in neuem Tab öffnen',
        'edu-04-tag'         : 'OKT 2016 — AUG 2018',
        'edu-04-title'       : 'Art Musica',
        'edu-04-role'        : 'Freiberuflicher Lehrer · Gitarre, Akustik, Bass & Cavaquinho',
        'edu-04-desc'        : 'Einzelunterricht für verschiedene Ziele und Profile, Schwerpunkt Praxis und Repertoire, Theorie als Stütze wenn sinnvoll.',
        'edu-04-aria'        : 'Art Musica — in neuem Tab öffnen',
        'edu-05-tag'         : 'JAN 2017 — NOV 2017',
        'edu-05-title'       : 'Gemeinschaftsschule Victor Beloti',
        'edu-05-role'        : 'Praktikum · musikalische Bildung · Teilzeit · Maringá, PR',
        'edu-05-desc'        : 'Praktikum im öffentlichen Schulsystem mit pädagogischer Begleitung: Planung, Klassenführung, Wahrnehmung und Rhythmus mit Instrumenten.',
        'edu-05-aria'        : 'Victor Beloti — in neuem Tab öffnen',
        'edu-06-tag'         : 'JAN 2017 — JUL 2019',
        'edu-06-title'       : 'Staatliche Schule Jardim Independência',
        'edu-06-role'        : 'Praktikum · Musiklehrer · Teilzeit · Maringá, PR',
        'edu-06-desc'        : 'Praktikum im letzten Studienjahr: Eigenständigkeit im Unterricht, Stundenplanung und Begleitung der Schüler in schulischer Musikerziehung.',
        'edu-06-aria'        : 'Jardim Independência — in neuem Tab öffnen',
        'edu-07-tag'         : 'FEB 2017 — NOV 2017',
        'edu-07-title'       : 'Ateliê Da Criança',
        'edu-07-role'        : 'Musik in der frühen Kindheit · Babys · Maringá, PR',
        'edu-07-desc'        : 'Arbeit mit Kleinkindern: Klänge, Rhythmus, Bewegung und Spiel, mit Sensibilität, Elternbezug und unkonventionellem Ansatz.',
        'edu-07-aria'        : 'Ateliê Da Criança — in neuem Tab öffnen',
        'edu-08-tag'         : 'APR 2017 — OKT 2019',
        'edu-08-title'       : 'Som Maior Música e Arte',
        'edu-08-role'        : 'Lehrer · Gitarre, Akustik, Bass & Cavaquinho · Maringá, PR',
        'edu-08-desc'        : 'Praxisorientierter Unterricht nach Zielen — von Technik bis Repertoire — mit vielseitigem Instrumentarium und verschiedenen Lernenden.',
        'edu-08-aria'        : 'Som Maior Música e Arte — in neuem Tab öffnen',
        'edu-09-tag'         : 'JUL 2017 — SEP 2020',
        'edu-09-title'       : 'Belas Artes',
        'edu-09-role'        : 'Musiklehrer · Gitarre, Akustik & weitere Instrumente · Teilzeit · Maringá, PR',
        'edu-09-desc'        : 'Praxisnaher Unterricht nach Ziel — von Anfängern bis fortgeschrittenem Repertoire — Theorie bei Bedarf.',
        'edu-09-aria'        : 'Belas Artes — in neuem Tab öffnen',
        'edu-10-tag'         : 'JUN 2018 — APR 2019',
        'edu-10-title'       : 'Soziales Hilfsprojekt',
        'edu-10-role'        : 'Musiklehrer · Senioren · Teilzeit · Maringá, PR',
        'edu-10-desc'        : 'Musik für Gesundheit und Wohlbefinden: Motorik, Gedächtnis, Austausch und Zuwendung. Angepasste Instrumente und Aktivitäten, Gruppenauftritte und Mitgestaltung.',
        'edu-11-tag'         : 'MÄR 2020 — DEZ 2020',
        'edu-11-title'       : 'Passantes Pensantes',
        'edu-11-role'        : 'Gruppenunterricht Keyboard & Gitarre · Teilzeit · Maringá, PR',
        'edu-11-desc'        : 'Gruppen: gemeinsames Üben, gemischte Niveaus mit laufender Anpassung, Rhythmus, Harmonie und Repertoire zugänglich und lebendig.',
        'edu-11-aria'        : 'Passantes e Pensantes — in neuem Tab öffnen',
        'edu-12-tag'         : 'NOV 2021 — AUG 2023',
        'edu-12-title'       : 'Estação da Música',
        'edu-12-role'        : 'Multi-Instrument & Theorie · Teilzeit · Itajaí, SC',
        'edu-12-desc'        : 'Gitarre, Klavier, Akustik, Cavaquinho, Pandeiro, Percussion, Keys, Bass und Theorie für alle Altersstufen — Technik, Repertoire, Gehör und Rhythmus mit klarer Didaktik.',
        'edu-12-aria'        : 'Estação da Música — in neuem Tab öffnen',
        'edu-13-tag'         : 'JUN 2022 — DEZ 2022',
        'edu-13-title'       : 'Centro Musicall',
        'edu-13-role'        : 'Multi-Instrument & Theorie · Teilzeit · Balneário Camboriú, SC',
        'edu-13-desc'        : 'Multi-Instrument und Theorie: ausgewogene Praxis mit Grundlagen, Technik, Interpretation und Zielen pro Person.',
        'edu-13-aria'        : 'Centro Musicall — in neuem Tab öffnen',
        'ch01-tag'           : 'KAPITEL 01',
        'ch01-title'         : 'Wo alles<br><span class="tl-title-accent">begann.</span>',
        'ch01-desc'          : 'Wurzeln in Brasilien und eine musikalische Ausbildung: Methode und Gehör, bevor der Atlantik kam. In Europa wurden Dublin und die Elektronik zum Labor — seit zwei Jahren trägt diesen Weg ein Name: ClayMoon.music, mit Groove-Studium, Club-Referenzen und einem Sound zwischen Tech House und Minimal Deep Tech. Das Bild zeigt den frühen Abschnitt, bevor Look und Story von heute entstanden.',
        'ch02-tag'           : 'KAPITEL 02',
        'ch02-title'         : 'Wie weit<br><span class="tl-title-accent">ich kam.</span>',
        'ch02-crowd'         : 'Porto · Press kit &amp; Sound steht',
        'ch02-desc'          : 'Heute ist das Projekt rund: visuelle Identität, Pressefotos, SoundCloud-Sets und eine klare Dancefloor-Story — Groove, Energie und europäische Referenz. Das Angebot: Club, Open Air und Warm-ups mit Tech House und Minimal Deep Tech; der nächste Schritt ist das passende Line-up, mit Material und Haltung für die langfristige Karriere.',
        'ch03-tag'           : 'KAPITEL 03',
        'tension-e'          : 'Und',
        'tension-phrase'     : ' wo bin ich',
        'tension-now'        : 'JETZT??',
        'tension-sub'        : 'Die Antwort liegt unten.',
        'ch04-tag'           : 'KAPITEL 03',
        'ch04-year'          : '2025 — HEUTE',
        'ch04-title'         : 'Neuer<br><span class="tl-title-accent">Zyklus.</span>',
        'ch04-quote'         : 'Zwei Jahre Fokus auf ClayMoon.music: europäische Referenzen, Arcade-Ästhetik und Sets, die zeigen, wohin die Nacht soll — Minimal Bass im Blut, Groove im Kopf und bereit für das nächste Kapitel mit dem richtigen Team.',
        'sobre-tag'          : 'ÜBER',
        'sobre-title'        : 'Vom lokalen Dancefloor zur<br><span class="text-glow">europäischen Szene</span>',
        'sobre-p1'           : 'Claymoon.music ist seit 2 Jahren DJ und Musikproduzent. Seine Laufbahn begann in Dublin, Irland, wo er direkten Kontakt mit der europäischen elektronischen Szene hatte und seine klangliche Identität entwickelte.',
        'sobre-p2'           : 'Heute lebt er in Porto, Portugal, und will seine Präsenz auf lokalen Dancefloors mit einem einzigartigen Ansatz ausbauen: grooviger Tech House mit Einflüssen aus House und Minimal Deep Tech, in dynamischen Sets, die überraschen und den Floor konstant in Bewegung halten.',
        'sobre-p3'           : 'Seine Ästhetik verbindet das Moderne mit dem Nostalgischen und schafft ein klangliches und visuelles Erlebnis, das Vergangenheit und Zukunft auf dem Dancefloor zusammenführt.',
        'sobre-p4'           : 'Meine musikalische Ausbildung an der <strong>Universidade Estadual de Maringá</strong> hat mir ein starkes Fundament gegeben — aber in der gelebten Erfahrung gewinnt mein Sound seine Wahrheit.',
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
        'fs-desc': 'Purer Groove auf dem Dancefloor. Ein Tech House Set voller Energie und Textur — von Anfang bis Ende, der Floor in Bewegung.',
        'fs-listen': 'Auf SoundCloud anhören',
        'music-tag'          : 'HÖREN',
        'music-title'        : 'Sets auf <span class="text-glow">SoundCloud</span>',
        'music-desc'         : 'Alle verfügbaren Sets — direkt im Player anhören.',
        'sc-cta'             : 'Alle auf SoundCloud ansehen',
        'booking-tag'        : 'KONTAKT',
        'booking-title'      : 'Bereit, ans<br><span class="text-glow">Limit zu gehen?</span>',
        'booking-desc'       : 'Verfügbar für Clubs, Events und Festivals.<br>Melde dich — lass uns etwas Unvergessliches schaffen.',
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
        'tl-tab-performance' : 'ステージ',
        'tl-tab-education'   : '音楽教育',
        'edu-01-tag'         : '2015年8月 — 2015年11月',
        'edu-01-title'       : 'Tok Music',
        'edu-01-role'        : 'ギター講師 · マリンガ、パラナ州',
        'edu-01-desc'        : '指導を始めた場所：さまざまなレベルの生徒へ、軽やかで実践的・身近なアプローチ。最初の一音から教学法とモチベーションを育てる。',
        'edu-01-aria'        : 'Tok Music — 新しいタブで開く',
        'edu-02-tag'         : '2016年2月 — 2016年7月',
        'edu-02-title'       : 'Universidade Estadual de Maringá',
        'edu-02-role'        : '拡張プロジェクト · CAP（教育応用校）',
        'edu-02-desc'        : '音楽学士課程中の活動：学校での音楽教育（聴覚・リズム・楽器）、拡張プロジェクトの方針に沿った内容。',
        'edu-02-aria'        : 'CAP UEM — 新しいタブで開く',
        'edu-03-tag'         : '2016年7月 — 2016年11月',
        'edu-03-title'       : 'Alberto Jackson Byington Junior 州立校',
        'edu-03-role'        : '音楽教師 · 拡張プロジェクト · マリンガ、パラナ州',
        'edu-03-desc'        : '公立校での音楽指導。生徒の水準に合わせて内容を調整し、大学の理論と教室の実践をつなぐ。',
        'edu-03-aria'        : 'Byington Junior — 新しいタブで開く',
        'edu-04-tag'         : '2016年10月 — 2018年8月',
        'edu-04-title'       : 'Art Musica',
        'edu-04-role'        : 'フリーランス講師 · ギター、アコースティック、ベース、カヴァキーニョ',
        'edu-04-desc'        : '目的とプロフィールに合わせた個人レッスン。実践とレパートリーを重視し、必要に応じて理論をサポート。',
        'edu-04-aria'        : 'Art Musica — 新しいタブで開く',
        'edu-05-tag'         : '2017年1月 — 2017年11月',
        'edu-05-title'       : 'Victor Beloti 市立校',
        'edu-05-role'        : 'インターンシップ · 音楽教育 · パートタイム · マリンガ、パラナ州',
        'edu-05-desc'        : '公立校インターン（指導伴走）：計画、クラス運営、楽器を使った聴覚とリズムの育成。',
        'edu-05-aria'        : 'Victor Beloti — 新しいタブで開く',
        'edu-06-tag'         : '2017年1月 — 2019年7月',
        'edu-06-title'       : 'Jardim Independência 州立校',
        'edu-06-role'        : 'インターンシップ · 音楽教師 · パートタイム · マリンガ、パラナ州',
        'edu-06-desc'        : '音楽学士最終年のインターン：教室での自律、授業設計、学校音楽教育での生徒の成長をフォロー。',
        'edu-06-aria'        : 'Jardim Independência — 新しいタブで開く',
        'edu-07-tag'         : '2017年2月 — 2017年11月',
        'edu-07-title'       : 'Ateliê Da Criança',
        'edu-07-role'        : '幼児音楽教育 · 乳児 · マリンガ、パラナ州',
        'edu-07-desc'        : '乳幼児向け：音の刺激、リズム、動き、遊びを通した体験。家族とのつながりと、従来型の技術偏重ではないアプローチ。',
        'edu-07-aria'        : 'Ateliê Da Criança — 新しいタブで開く',
        'edu-08-tag'         : '2017年4月 — 2019年10月',
        'edu-08-title'       : 'Som Maior Música e Arte',
        'edu-08-role'        : '講師 · ギター、アコースティック、ベース、カヴァキーニョ · マリンガ、パラナ州',
        'edu-08-desc'        : '実践重視で一人ひとりの目標に合わせるレッスン — 基礎からレパートリまで — 多様な生徒との経験を重ねる。',
        'edu-08-aria'        : 'Som Maior Música e Arte — 新しいタブで開く',
        'edu-09-tag'         : '2017年7月 — 2020年9月',
        'edu-09-title'       : 'Belas Artes',
        'edu-09-role'        : '音楽講師 · ギター、アコースティック、その他楽器 · パートタイム · マリンガ、パラナ州',
        'edu-09-desc'        : '実践中心で目標に合わせたレッスン — 初級から上級の技法・レパートリまで — 必要に応じて理論を補助。',
        'edu-09-aria'        : 'Belas Artes — 新しいタブで開く',
        'edu-10-tag'         : '2018年6月 — 2019年4月',
        'edu-10-title'       : '社会支援プロジェクト',
        'edu-10-role'        : '音楽講師 · シニア · パートタイム · マリンガ、パラナ州',
        'edu-10-desc'        : '健康とウェルビーイングを意識した音楽：運動協調、記憶、交流と受け止め。楽器と活動を調整し、グループ発表と参加者の主役性。',
        'edu-11-tag'         : '2020年3月 — 2020年12月',
        'edu-11-title'       : 'Passantes Pensantes',
        'edu-11-role'        : 'キーボードとギターのグループレッスン · パートタイム · マリンガ、パラナ州',
        'edu-11-desc'        : 'グループレッスン：協働練習、混在レベルを継続的に調整、リズム・和声・レパートリをわかりやすくダイナミックに。',
        'edu-11-aria'        : 'Passantes e Pensantes — 新しいタブで開く',
        'edu-12-tag'         : '2021年11月 — 2023年8月',
        'edu-12-title'       : 'Estação da Música',
        'edu-12-role'        : '多楽器・理論講師 · パートタイム · イタジャイ、SC',
        'edu-12-desc'        : 'ギター、ピアノ、アコースティック、カヴァキーニョ、パンデイロ、打楽器、キーボード、ベースと理論。年齢・レベルに応じて技法、レパートリ、聴音とリズムを明確に指導。',
        'edu-12-aria'        : 'Estação da Música — 新しいタブで開く',
        'edu-13-tag'         : '2022年6月 — 2022年12月',
        'edu-13-title'       : 'Centro Musicall',
        'edu-13-role'        : '多楽器・理論講師 · パートタイム · バルネアリオ・カンボリウ、SC',
        'edu-13-desc'        : '多楽器と理論：実践と基礎理論のバランス、技法、解釈、一人ひとりの目標に合わせた指導。',
        'edu-13-aria'        : 'Centro Musicall — 新しいタブで開く',
        'ch01-tag'           : 'チャプター 01',
        'ch01-title'         : 'すべてが<br><span class="tl-title-accent">始まった場所。</span>',
        'ch01-desc'          : 'ブラジルで育ち、音楽の基礎を学ぶ：海を渡る前に技法と耳を鍛える。ヨーロッパではダブリンとエレクトロニックが実験場になり——ここ2年、その旅に名前がついた ClayMoon.music。グルーヴの研究、クラブのリファレンス、Tech House と Minimal Deep Tech のあいだのサウンド。写真は、いまのビジュアルと物語の前の章。',
        'ch02-tag'           : 'チャプター 02',
        'ch02-title'         : '私が<br><span class="tl-title-accent">到達した場所。</span>',
        'ch02-crowd'         : 'ポルト · プレスキット＆サウンド完成',
        'ch02-desc'          : 'いまプロジェクトは揃った：ビジュアル、アーティスト写真、SoundCloud のセット、そして明確なフロアのストーリー——グルーヴ、エネルギー、ヨーロッパの参照。クラブ、野外、ウォームアップまで、Tech House と Minimal Deep Tech で提案。次の一歩は適したラインナップへ、長く続く姿勢で。',
        'ch03-tag'           : 'チャプター 03',
        'tension-e'          : 'そして',
        'tension-phrase'     : ' 今どこにいるのか',
        'tension-now'        : '今？？',
        'tension-sub'        : '答えは下にあります。',
        'ch04-tag'           : 'チャプター 03',
        'ch04-year'          : '2025 — 現在',
        'ch04-title'         : '新しい<br><span class="tl-title-accent">サイクル。</span>',
        'ch04-quote'         : '2年間、ClayMoon.music に集中：ヨーロッパの参照、アーケードの美学、夜をどこへ運びたいかが伝わるセット——Minimal Bass を骨格に、グルーヴを頭に、次の章を正しいチームで。',
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
        'fs-desc': 'フロアで純粋なグルーヴを。エネルギーとテクスチャに満ちた Tech House セット — 最初から最後まで、フロアが動き続ける。',
        'fs-listen': 'SoundCloudで聴く',
        'music-tag'          : '聴く',
        'music-title'        : '<span class="text-glow">SoundCloud</span>のセット',
        'music-desc'         : '全セット — プレーヤーで直接再生。',
        'sc-cta'             : 'SoundCloudですべて見る',
        'booking-tag'        : 'コンタクト',
        'booking-title'      : '限界を<br><span class="text-glow">超える準備はできていますか？</span>',
        'booking-desc'       : 'クラブ、イベント、フェスティバルへの出演受付中。<br>お問い合わせください。一緒に忘れられない体験を。',
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
    initTimelineStoryTabs();
    initI18n();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
