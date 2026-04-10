'use strict';

// ── GLOBALS ───────────────────────────────────
let lenis, currentPage = 'home';
const pt    = document.getElementById('pt');
const ptTxt = document.getElementById('pt-txt');

// ── LENIS SMOOTH SCROLL ───────────────────────
function initLenis() {
  lenis = new Lenis({
    duration: 1.45,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    lerp: 0.07,
  });
  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);
}

// ── ROUTER ────────────────────────────────────
function goTo(page) {
  if (page === currentPage) return;
  ptTxt.textContent = page.toUpperCase();

  gsap.fromTo(pt, { yPercent: 100 }, {
    yPercent: 0, duration: .55, ease: 'power3.inOut',
    onComplete() {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-' + page).classList.add('active');
      document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.page === page));
      currentPage = page;
      lenis.scrollTo(0, { immediate: true });
      gsap.to(pt, {
        yPercent: -100, duration: .55, ease: 'power3.inOut', delay: .08,
        onComplete() {
          gsap.set(pt, { yPercent: 100 });
          initAnimations();
        }
      });
    }
  });
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-page]');
  if (el) { e.preventDefault(); goTo(el.dataset.page); }
});
gsap.set(pt, { yPercent: 100 });

// ── CURSOR ────────────────────────────────────
const cur  = document.getElementById('cur');
const curf = document.getElementById('cur-f');
let mx = -100, my = -100, fx = -100, fy = -100;

gsap.set(cur,  { xPercent: -50, yPercent: -50, x: mx, y: my });
gsap.set(curf, { xPercent: -50, yPercent: -50, x: mx, y: my });

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.classList.add('vis'); curf.classList.add('vis');
  gsap.to(cur, { x: mx, y: my, duration: .1, ease: 'none' });
});
(function curLoop() {
  fx += (mx - fx) * .12; fy += (my - fy) * .12;
  gsap.set(curf, { x: fx, y: fy });
  requestAnimationFrame(curLoop);
})();

function addHover(sel) {
  document.querySelectorAll(sel).forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('hov'));
    el.addEventListener('mouseleave', () => cur.classList.remove('hov'));
  });
}
addHover('a,button,.pc,.pcard,.soc-a,.ctag,.btn,.sni');

// ── THREE.JS HERO ─────────────────────────────
function initThree() {
  const canvas = document.getElementById('hc');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const cam   = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 1000);
  cam.position.z = 5;

  // ── Particles ──
  const N   = 2800;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random() - .5) * 22;
    pos[i*3+1] = (Math.random() - .5) * 22;
    pos[i*3+2] = (Math.random() - .5) * 14;
    const acc  = Math.random() > .72;
    col[i*3]   = acc ? .78 : .95;
    col[i*3+1] = acc ? 1.0 : .94;
    col[i*3+2] = acc ? .24 : .92;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const pm  = new THREE.PointsMaterial({ size: .018, vertexColors: true, transparent: true, opacity: .55, sizeAttenuation: true });
  const pts = new THREE.Points(pg, pm);
  scene.add(pts);

  // ── Outer icosahedron ──
  const ico  = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.2, 1),
    new THREE.MeshBasicMaterial({ color: 0xc8ff3e, wireframe: true, transparent: true, opacity: .055 })
  );
  scene.add(ico);

  // ── Inner icosahedron ──
  const ico2 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.0, 0),
    new THREE.MeshBasicMaterial({ color: 0xc8ff3e, wireframe: true, transparent: true, opacity: .13 })
  );
  scene.add(ico2);

  // ── Orbital ring ──
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.8, .004, 8, 80),
    new THREE.MeshBasicMaterial({ color: 0xc8ff3e, transparent: true, opacity: .12 })
  );
  ring.rotation.x = Math.PI / 3;
  scene.add(ring);

  let tx = 0, ty = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    tx = (e.clientX / innerWidth  - .5) * 1.6;
    ty = -(e.clientY / innerHeight - .5) * 1.6;
  });

  window.addEventListener('resize', () => {
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  (function anim() {
    requestAnimationFrame(anim);
    const t = Date.now() * .0005;
    rx += (ty * .5 - rx) * .045;
    ry += (tx * .5 - ry) * .045;
    ico.rotation.x   = rx + t * .28;
    ico.rotation.y   = ry + t * .48;
    ico2.rotation.x  = -rx + t * .52;
    ico2.rotation.y  = -ry + t * .3;
    ring.rotation.z  = t * .2;
    pts.rotation.y   = t * .09;
    pts.rotation.x   = t * .045;
    ico2.scale.setScalar(1 + Math.sin(t * 1.8) * .055);
    renderer.render(scene, cam);
  })();
}

// ── GSAP ANIMATIONS ───────────────────────────
gsap.registerPlugin(ScrollTrigger);

function initAnimations() {
  ScrollTrigger.getAll().forEach(t => t.kill());

  // ─ Hero entrance
  const lines = document.querySelectorAll('#ht1,#ht2,#ht3');
  if (lines.length) {
    gsap.from(lines, { y: '105%', duration: 1.2, stagger: .13, ease: 'power4.out', delay: .35 });
    gsap.from('.tag',              { y: 25, opacity: 0, duration: .85, ease: 'power3.out', delay: .2 });
    gsap.from('.hdesc,.scroll-hint', { y: 28, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out', delay: .65 });
  }

  // ─ Hero PARALLAX
  const heroEnd = 'center top';
  gsap.to('#ht1',    { scrollTrigger: { trigger: '#hero', start: 'top top', end: heroEnd, scrub: 1.2 }, y: -80,  opacity: 0, ease: 'none' });
  gsap.to('#ht2',    { scrollTrigger: { trigger: '#hero', start: 'top top', end: heroEnd, scrub: 1.6 }, y: -55,  opacity: 0, ease: 'none' });
  gsap.to('#ht3',    { scrollTrigger: { trigger: '#hero', start: 'top top', end: heroEnd, scrub: 2   }, y: -35,  opacity: 0, ease: 'none' });
  gsap.to('.tag',    { scrollTrigger: { trigger: '#hero', start: 'top top', end: heroEnd, scrub: 0.8 }, y: -100, opacity: 0, ease: 'none' });
  gsap.to('.hbottom',{ scrollTrigger: { trigger: '#hero', start: 'top top', end: heroEnd, scrub: 1   }, y: -90,  opacity: 0, ease: 'none' });
  gsap.to('#hc',     { scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 2.5 }, y: 80, scale: 1.06, ease: 'none' });

  // ─ Marquee
  const mq = document.getElementById('mq');
  if (mq) {
    let pos = 0, speed = 1.2;
    const halfW = mq.scrollWidth / 2;
    function mqAnim() {
      pos -= speed;
      if (Math.abs(pos) >= halfW) pos = 0;
      mq.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(mqAnim);
    }
    mqAnim();
    ScrollTrigger.create({
      trigger: '.mq-sec', start: 'top bottom', end: 'bottom top',
      onUpdate: self => { speed = 1.2 + Math.abs(self.getVelocity()) / 4000; }
    });
  }

  // ─ Section titles reveal
  gsap.utils.toArray('.sec-h').forEach(el => {
    gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 82%' }, y: 55, opacity: 0, duration: 1, ease: 'power3.out' });
  });

  // ─ Project cards
  gsap.utils.toArray('.pc').forEach((c, i) => {
    gsap.from(c, { scrollTrigger: { trigger: c, start: 'top 92%' }, y: 70, opacity: 0, duration: .85, ease: 'power3.out', delay: i * .07 });
  });

  // ─ Stats counter (IntersectionObserver — fiable même sans ScrollTrigger actif)
  gsap.utils.toArray('.stat-n').forEach((el, i) => {
    const target = +el.dataset.target;
    let fired = false;
    function runCount() {
      if (fired) return; fired = true;
      gsap.to({ v: 0 }, {
        v: target, duration: 1.8, ease: 'power2.out', delay: i * 0.18,
        onUpdate()   { el.textContent = Math.round(this.targets()[0].v) + '+'; },
        onComplete() { el.textContent = target + '+'; }
      });
    }
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { runCount(); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
  });

  // ─ Parallax image (about teaser)
  const atImg = document.querySelector('.at-img');
  if (atImg) {
    gsap.to(atImg, { scrollTrigger: { trigger: '.at-sec', start: 'top bottom', end: 'bottom top', scrub: 1.4 }, y: -100 });
  }

  // ─ CTA title
  const ctaT = document.querySelector('.cta-t');
  if (ctaT) {
    gsap.from(ctaT, { scrollTrigger: { trigger: '.cta-sec', start: 'top 78%' }, y: 90, opacity: 0, duration: 1.3, ease: 'power4.out' });
  }

  // ─ Post cards
  gsap.utils.toArray('.pcard').forEach((c, i) => {
    gsap.from(c, { scrollTrigger: { trigger: c, start: 'top 92%' }, y: 55, opacity: 0, duration: .75, ease: 'power3.out', delay: i * .06 });
  });

  // ─ About story blocks + year parallax
  gsap.utils.toArray('.sb').forEach(b => {
    gsap.from(b, { scrollTrigger: { trigger: b, start: 'top 82%' }, y: 45, opacity: 0, duration: .95, ease: 'power3.out' });
    const yr = b.querySelector('.sy');
    if (yr) {
      gsap.to(yr, { scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: 2.2 }, y: -40, opacity: .7 });
    }
  });

  // ─ Skill items
  gsap.utils.toArray('.ski').forEach((el, i) => {
    gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 92%' }, x: 22, opacity: 0, duration: .5, ease: 'power2.out', delay: i * .025 });
  });

  // ─ Tool items
  gsap.utils.toArray('.ti').forEach((el, i) => {
    gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 92%' }, scale: .75, opacity: 0, duration: .5, ease: 'back.out(2)', delay: i * .025 });
  });

  // ─ Values
  gsap.utils.toArray('.vi').forEach((el, i) => {
    gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 86%' }, x: -35, opacity: 0, duration: .8, ease: 'power3.out', delay: i * .04 });
  });

  // ─ Social links
  gsap.utils.toArray('.soc-a').forEach((el, i) => {
    gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 90%' }, y: 38, opacity: 0, duration: .65, ease: 'power3.out', delay: i * .07 });
  });

  // ─ Contact form groups
  gsap.utils.toArray('.fg').forEach((el, i) => {
    gsap.from(el, { scrollTrigger: { trigger: '.cform', start: 'top 82%' }, y: 28, opacity: 0, duration: .65, ease: 'power3.out', delay: i * .07 });
  });

  // ─ Featured post image parallax
  const fi = document.querySelector('.feat-img');
  if (fi) {
    gsap.to(fi, { scrollTrigger: { trigger: '.feat-post', start: 'top bottom', end: 'bottom top', scrub: 1.2 }, y: -80 });
  }
}

// ── NAV HIDE/SHOW ──────────────────────────────
let lastScroll = 0;
function initNavScroll() {
  if (!lenis) return;
  lenis.on('scroll', ({ scroll }) => {
    const nav = document.getElementById('nav');
    if (scroll > lastScroll + 10 && scroll > 120) {
      gsap.to(nav, { yPercent: -120, duration: .4, ease: 'power3.in' });
    } else if (scroll < lastScroll - 5) {
      gsap.to(nav, { yPercent: 0, duration: .4, ease: 'power3.out' });
    }
    lastScroll = scroll;
  });
}

// ── MAGNETIC BUTTONS ──────────────────────────
function initMagnetic() {
  document.querySelectorAll('.btn-p').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * .22, y: (e.clientY - r.top - r.height / 2) * .22, duration: .45, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.35)' });
    });
  });
}

// ── CLOCK ─────────────────────────────────────
function updateClock() {
  const now = new Date();
  const wat = new Date(now.getTime() + (1 * 60 + now.getTimezoneOffset()) * 60000);
  const h   = String(wat.getHours()).padStart(2, '0');
  const m   = String(wat.getMinutes()).padStart(2, '0');
  const s   = String(wat.getSeconds()).padStart(2, '0');
  const el  = document.getElementById('clock');
  if (el) el.textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── CATEGORY FILTER ───────────────────────────
document.querySelectorAll('.ctag').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.ctag').forEach(x => x.classList.remove('on'));
    t.classList.add('on');
  });
});

// ── EMAILJS CONFIG ────────────────────────────
// 1. Va sur https://www.emailjs.com et crée un compte gratuit
// 2. "Add New Service" → Gmail → connecte justs4857@gmail.com → copie le Service ID
// 3. "Email Templates" → crée un template avec les variables ci-dessous → copie le Template ID
// 4. "Account" → copie ta Public Key
const EMAILJS_PUBLIC_KEY  = 'HsT12LET8wuaggu1f';   // ← remplacer
const EMAILJS_SERVICE_ID  = 'service_qkcn9f9';   // ← remplacer
const EMAILJS_TEMPLATE_ID = 'template_xair8nk';  // ← remplacer

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

function handleSubmit(e) {
  e.preventDefault();
  const form   = document.getElementById('contact-form');
  const btn    = form.querySelector('[type=submit]');
  const txt    = document.getElementById('send-txt');

  // Combine prénom + nom pour {{name}} dans le template
  const firstName = form.querySelector('[name="first_name"]').value.trim();
  const lastName  = form.querySelector('[name="last_name"]').value.trim();
  document.getElementById('hidden-name').value = `${firstName} ${lastName}`;

  // État : chargement
  btn.disabled = true;
  txt.textContent = 'Sending…';

  emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
    .then(() => {
      txt.textContent = 'Message Sent ✓';
      gsap.from(btn, { scale: 1.08, duration: .4, ease: 'back.out(2)' });
      form.reset();
      setTimeout(() => {
        txt.textContent = 'Send Message';
        btn.disabled = false;
      }, 3500);
    })
    .catch((err) => {
      console.error('EmailJS error:', err);
      txt.textContent = 'Error — Try Again';
      btn.style.background = 'var(--accent2)';
      setTimeout(() => {
        txt.textContent = 'Send Message';
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    });

  return false;
}

// ── STORY NAV ────────────────────────────────
document.querySelectorAll('.sni').forEach((el, i) => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.sni').forEach(x => x.classList.remove('on'));
    el.classList.add('on');
    const blocks = document.querySelectorAll('.sb');
    if (blocks[i]) lenis.scrollTo(blocks[i], { offset: -100 });
  });
});

// ── INIT ─────────────────────────────────────
initLenis();
initThree();
initAnimations();
initNavScroll();
initMagnetic();

// ── I18N ─────────────────────────────────────
const translations = {
  en: {
    'nav.home':'Home','nav.about':'About','nav.blog':'Blog','nav.contact':'Contact',
    'home.tag':'UI/UX Designer & Frontend Developer — Cotonou, Bénin',
    'home.ht2':'DESIGNS','home.ht3':'THE WEB',
    'home.desc':'Crafting digital experiences that live at the intersection of <em style="font-style:italic;color:var(--accent)">beauty</em> and function. Building for humans, worldwide.',
    'home.scroll':'Scroll',
    'home.proj.num':'01 — Selected Work','home.proj.title':'Projects<br>That Matter','home.proj.viewall':'View All',
    'badge.live':'Live ↗','badge.soon':'Coming Soon',
    'proj.aurum.cat':'Banking · Mobile App','proj.pulse.cat':'Health · Dashboard',
    'proj.forge.cat':'Developer Tools · Web','proj.nomad.cat':'Travel · Booking Platform',
    'stat.projects':'Projects<br>Completed','stat.clients':'Happy<br>Clients',
    'stat.years':'Years of<br>Experience','stat.awards':'Design<br>Awards',
    'home.about.num':'02 — Who I Am',
    'home.about.title':'I bridge <em>beautiful design</em> and <em>functional code</em>',
    'home.about.desc':"Every pixel, every interaction, every line of code serves a purpose. I don't just design screens — I craft experiences that resonate, convert, and endure long after launch.",
    'home.about.cta':'More about me',
    'home.cta.title':"<span>Let's</span><br><span class=\"out\">Create</span><br><span>Together</span>",
    'home.cta.btn':'Start a Project',
    'about.tag':'About me — The Designer Behind the Screen',
    'about.hero':'I design digital<br>experiences that<br>feel <em>human</em>',
    'about.s1.nav':'The Beginning','about.s2.nav':'The Growth','about.s3.nav':'The Vision',
    'about.s1.title':'The Beginning',
    'about.s1.desc':"Started as a self-taught designer with nothing but curiosity and a laptop. I fell in love with the idea that code and design together could create experiences that genuinely move people — not just look pretty, but feel alive and purposeful.",
    'about.s2.title':'The Growth',
    'about.s2.desc':"Three years in, I'd shipped products used by thousands across West Africa and beyond. Started specializing in the overlap between design and engineering — building design systems, crafting component libraries, bridging the gap that most teams struggle with daily.",
    'about.s3.title':'The Vision',
    'about.s3.desc':"Today I work with ambitious teams globally, bringing a uniquely holistic approach: I design it, and I build it. No handoff friction, no lost intent. Just experiences that work exactly as envisioned — from first concept to final deployment.",
    'about.skills.num':'02 — Expertise','about.skills.title':'What I Do Best',
    'about.tools.num':'03 — Arsenal','about.tools.title':'My Tools & Stack',
    'about.vals.num':'04 — Philosophy','about.vals.title':'What I Believe In',
    'val.1.t':'Craft over comfort','val.1.d':"Good enough is never good enough. Every detail deserves attention, every interaction deserves thought. The difference between okay and extraordinary lives in the details most people never notice — but always feel.",
    'val.2.t':'Simplicity through complexity','val.2.d':"The hardest thing in design is making something complex feel simple. Real elegance isn't decoration — it's the ruthless elimination of everything that doesn't serve the user's core need.",
    'val.3.t':'Design with empathy','val.3.d':"Behind every screen is a human with goals, fears, and limited time. My job is to understand that human deeply enough to build something they never want to leave.",
    'val.4.t':'Ship, then perfect','val.4.d':"Perfection is a moving target. Ship something excellent, learn from real usage, then iterate relentlessly. The best products are never finished — they just keep getting better.",
    'blog.tag':'Blog — Thoughts, Insights & Tutorials','blog.featured':'Featured',
    'blog.feat.title':'Building a Design System That Developers Actually Love',
    'blog.feat.btn':'Read Article',
    'blog.nl.num':'05 — Stay Updated','blog.nl.btn':'Subscribe',
    'contact.tag':"Get in Touch — Let's Build Something Great",
    'contact.info.title':'Start a Conversation',
    'contact.svc.num':'02 — Services','contact.svc.title':'What I Offer',
    'contact.avail.num':'03 — Availability','contact.avail.title':"When I'm Available",
    'contact.soc.num':'04 — Connect','contact.soc.title':'Find Me Online',
    'form.send':'Send Message',
  },
  fr: {
    'nav.home':'Accueil','nav.about':'À propos','nav.blog':'Blog','nav.contact':'Contact',
    'home.tag':'Designer UI/UX & Développeur Frontend — Cotonou, Bénin',
    'home.ht2':'CONÇOIT','home.ht3':'LE WEB',
    'home.desc':'Créer des expériences digitales à la croisée de la <em style="font-style:italic;color:var(--accent)">beauté</em> et de la fonctionnalité. Pour les humains, partout dans le monde.',
    'home.scroll':'Défiler',
    'home.proj.num':'01 — Travaux Sélectionnés','home.proj.title':'Projets<br>Qui Comptent','home.proj.viewall':'Voir Tout',
    'badge.live':'En ligne ↗','badge.soon':'Bientôt',
    'proj.aurum.cat':'Banque · App Mobile','proj.pulse.cat':'Santé · Dashboard',
    'proj.forge.cat':'Outils Dev · Web','proj.nomad.cat':'Voyage · Réservation',
    'stat.projects':'Projets<br>Réalisés','stat.clients':'Clients<br>Satisfaits',
    'stat.years':"Années<br>d'Expérience",'stat.awards':'Prix de<br>Design',
    'home.about.num':'02 — Qui Suis-Je',
    'home.about.title':'Je crée le pont entre un <em>beau design</em> et un <em>code fonctionnel</em>',
    'home.about.desc':"Chaque pixel, chaque interaction, chaque ligne de code a un but. Je ne crée pas seulement des écrans — je forge des expériences qui résonnent, convertissent et perdurent bien après le lancement.",
    'home.about.cta':'En savoir plus',
    'home.cta.title':"<span>Créons</span><br><span class=\"out\">Ensemble</span><br><span>Quelque Chose</span>",
    'home.cta.btn':'Démarrer un Projet',
    'about.tag':"À propos — Le Designer Derrière l'Écran",
    'about.hero':'Je conçois des expériences<br>digitales qui semblent<br><em>humaines</em>',
    'about.s1.nav':'Les Débuts','about.s2.nav':'La Croissance','about.s3.nav':'La Vision',
    'about.s1.title':'Les Débuts',
    'about.s1.desc':"Autodidacte, j'ai commencé avec rien d'autre que de la curiosité et un ordinateur. J'ai vite compris que le code et le design ensemble pouvaient créer des expériences qui touchent vraiment les gens — pas seulement belles à regarder, mais vivantes et utiles.",
    'about.s2.title':'La Croissance',
    'about.s2.desc':"Trois ans plus tard, j'avais livré des produits utilisés par des milliers de personnes en Afrique de l'Ouest et au-delà. Spécialisation à l'intersection du design et de l'ingénierie — systèmes de design, bibliothèques de composants, combler le fossé que la plupart des équipes peinent à franchir.",
    'about.s3.title':'La Vision',
    'about.s3.desc':"Aujourd'hui je travaille avec des équipes ambitieuses à l'échelle mondiale, avec une approche holistique : je conçois et je code. Pas de friction au handoff, pas d'intention perdue. Juste des expériences qui fonctionnent exactement comme imaginées.",
    'about.skills.num':'02 — Expertise','about.skills.title':'Ce Que Je Fais Le Mieux',
    'about.tools.num':'03 — Arsenal','about.tools.title':'Mes Outils & Stack',
    'about.vals.num':'04 — Philosophie','about.vals.title':'Ce En Quoi Je Crois',
    'val.1.t':'Le soin avant le confort','val.1.d':"Le « assez bien » n'est jamais assez bien. Chaque détail mérite attention, chaque interaction mérite réflexion. La différence entre l'ordinaire et l'extraordinaire réside dans les détails que la plupart ne remarquent pas — mais ressentent toujours.",
    'val.2.t':'La simplicité par la complexité','val.2.d':"La chose la plus difficile en design est de rendre quelque chose de complexe simple à utiliser. La vraie élégance n'est pas de la décoration — c'est l'élimination impitoyable de tout ce qui ne sert pas le besoin essentiel de l'utilisateur.",
    'val.3.t':'Designer avec empathie','val.3.d':"Derrière chaque écran se trouve un être humain avec des objectifs, des craintes et peu de temps. Mon travail est de comprendre cet humain assez profondément pour construire quelque chose dont il ne veut plus se passer.",
    'val.4.t':'Livrer, puis perfectionner','val.4.d':"La perfection est une cible mouvante. Livrez quelque chose d'excellent, apprenez de l'usage réel, puis itérez sans relâche. Les meilleurs produits ne sont jamais terminés — ils ne font que s'améliorer.",
    'blog.tag':'Blog — Réflexions, Insights & Tutoriels','blog.featured':'À la Une',
    'blog.feat.title':'Construire un Design System que les Développeurs Adorent Vraiment',
    'blog.feat.btn':"Lire l'Article",
    'blog.nl.num':'05 — Rester Informé','blog.nl.btn':"S'abonner",
    'contact.tag':"Contactez-Moi — Construisons Quelque Chose",
    'contact.info.title':'Démarrons une Conversation',
    'contact.svc.num':'02 — Services','contact.svc.title':'Ce Que Je Propose',
    'contact.avail.num':'03 — Disponibilité','contact.avail.title':'Quand Je Suis Disponible',
    'contact.soc.num':'04 — Réseaux','contact.soc.title':'Me Retrouver En Ligne',
    'form.send':'Envoyer le Message',
  }
};

let currentLang = localStorage.getItem('lang') || 'en';

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  const t = translations[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t[el.dataset.i18n];
    if (v !== undefined) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const v = t[el.dataset.i18nPh];
    if (v !== undefined) el.placeholder = v;
  });
  document.querySelectorAll('.lang-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  document.documentElement.lang = lang;
}

const lt = document.getElementById('lang-toggle');
if (lt) lt.addEventListener('click', e => {
  const opt = e.target.closest('.lang-opt');
  if (opt) applyLang(opt.dataset.lang);
});

applyLang(currentLang);