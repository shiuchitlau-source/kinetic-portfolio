import { useEffect, useRef, useState } from "react";
import { HORSE_FRAMES, HORSE_FRAME_HEIGHT, HORSE_FRAME_WIDTH } from "./horseFrames";
import { projects } from "./projects";

const horsePalette = ["#1746d1", "#e73f10", "#ff4a17", "#ff7a3d"];
const backHorses = [
  { offset: 1, dotOpacity: 0.34 },
  { offset: 4, dotOpacity: 0.44 },
  { offset: 6, dotOpacity: 0.25 },
];
const frontHorses = [
  { offset: 0, dotOpacity: 1 },
  { offset: 3, dotOpacity: 0.9 },
];
let decodedHorseFrames;

function getHorseFrames() {
  if (!decodedHorseFrames) {
    decodedHorseFrames = HORSE_FRAMES.map((encoded) => {
      const binary = window.atob(encoded);
      return Uint8Array.from(binary, (character) => character.charCodeAt(0));
    });
  }
  return decodedHorseFrames;
}

function drawHorseFrame(canvas, frameIndex, dotOpacity = 1) {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(bounds.width * pixelRatio);
  const height = Math.round(bounds.height * pixelRatio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");
  const scale = Math.min(
    bounds.width / HORSE_FRAME_WIDTH,
    bounds.height / HORSE_FRAME_HEIGHT,
  );
  const offsetX = (bounds.width - HORSE_FRAME_WIDTH * scale) / 2;
  const offsetY = (bounds.height - HORSE_FRAME_HEIGHT * scale) / 2;
  const points = getHorseFrames()[frameIndex];

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, bounds.width, bounds.height);
  context.save();
  context.translate(offsetX, offsetY);
  context.scale(scale, scale);

  context.beginPath();
  context.fillStyle = "#f3f0e8";
  for (let index = 0; index < points.length; index += 3) {
    context.moveTo(points[index] + 0.76, points[index + 1]);
    context.arc(points[index], points[index + 1], 0.76, 0, Math.PI * 2);
  }
  context.fill();

  context.globalAlpha = dotOpacity;
  horsePalette.forEach((color, shade) => {
    context.beginPath();
    context.fillStyle = color;
    for (let index = 0; index < points.length; index += 3) {
      if (points[index + 2] !== shade) continue;
      context.moveTo(points[index] + 0.38, points[index + 1]);
      context.arc(points[index], points[index + 1], 0.38, 0, Math.PI * 2);
    }
    context.fill();
  });

  context.restore();
}

function Media({ src, alt, className = "" }) {
  return src.endsWith(".mp4") ? (
    <video className={className} src={src} muted loop autoPlay playsInline aria-label={alt} />
  ) : (
    <img className={className} src={src} alt={alt} loading="lazy" />
  );
}

function ProjectDialog({ project, onClose, onNext, onPrevious }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef(null);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(onClose, reducedMotion ? 0 : 280);
  };

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && requestClose();
    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("dialog-open");
    return () => {
      window.clearTimeout(closeTimer.current);
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("dialog-open");
    };
  }, [onClose]);

  return (
    <div className={`dialog-backdrop${closing ? " is-closing" : ""}`} role="presentation" onMouseDown={requestClose}>
      <article className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-bar">
          <p>{project.type} · {project.year}</p>
          <button type="button" onClick={requestClose}>Close project</button>
        </div>
        <div className="dialog-hero">
          <p>{project.eyebrow || project.type}</p>
          <h2 id="dialog-title">{project.title}</h2>
          <p>{project.summary}</p>
        </div>
        <dl className="project-meta">
          <div><dt>Client</dt><dd>{project.client}</dd></div>
          <div><dt>Year</dt><dd>{project.year}</dd></div>
          <div><dt>Duration</dt><dd>{project.duration}</dd></div>
          <div><dt>Role</dt><dd>{project.roles.join(" · ")}</dd></div>
        </dl>
        <div className="dialog-gallery">
          {project.youtubeId ? (
            <div className="youtube-film">
              {videoOpen ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${project.youtubeId}?autoplay=1&rel=0`}
                  title={`${project.title} film`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button type="button" onClick={() => setVideoOpen(true)} aria-label={`Play ${project.title} film`}>
                  <img src={project.cover} alt="" />
                  <span>Play film</span>
                </button>
              )}
            </div>
          ) : (
            <img className="gallery-lead" src={project.cover} alt={`${project.title} lead visual`} />
          )}
          {project.gallery.map((src, index) => (
            <Media
              className={`gallery-visual gallery-visual-${index + 1}${project.gallery.length === 1 ? " gallery-single" : ""}`}
              key={src}
              src={src}
              alt={`${project.title} project visual ${index + 1}`}
            />
          ))}
        </div>
        <div className="case-copy">
          <div><p>01 / The challenge</p><h3>{project.challenge}</h3></div>
          <div><p>02 / The solution</p><h3>{project.solution}</h3></div>
        </div>
        <nav className="project-navigation" aria-label="Project navigation">
          <button type="button" onClick={onPrevious}>
            <span>Previous project</span>
            <strong>{projects[(projects.indexOf(project) - 1 + projects.length) % projects.length].title}</strong>
          </button>
          <button type="button" onClick={onNext}>
            <span>Next project</span>
            <strong>{projects[(projects.indexOf(project) + 1) % projects.length].title}</strong>
          </button>
        </nav>
      </article>
    </div>
  );
}

function FullscreenMenu({ onClose }) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef(null);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(onClose, reducedMotion ? 0 : 260);
  };

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && requestClose();
    document.addEventListener("keydown", closeOnEscape);
    document.body.classList.add("dialog-open");
    return () => {
      window.clearTimeout(closeTimer.current);
      document.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("dialog-open");
    };
  }, [onClose]);

  const navigate = () => requestClose();

  return (
    <aside className={`fullscreen-menu${closing ? " is-closing" : ""}`} aria-label="Site menu">
      <div className="menu-top">
        <p>Benjamin Lau</p>
        <button type="button" onClick={requestClose}>Close</button>
      </div>
      <nav>
        <a href="#work" onClick={navigate}><span>01</span>Work</a>
        <a href="#about" onClick={navigate}><span>02</span>Profile</a>
        <a href="#contact" onClick={navigate}><span>03</span>Contact</a>
      </nav>
      <div className="menu-foot">
        <p>Motion Designer · London / UK</p>
        <a href="https://www.linkedin.com/in/ben-shiu-chit-lau/" target="_blank" rel="noreferrer">LinkedIn</a>
      </div>
    </aside>
  );
}

function HorseCanvas({ frame, dotOpacity = 1 }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(frame);

  useEffect(() => {
    frameRef.current = frame;
    if (canvasRef.current) drawHorseFrame(canvasRef.current, frame, dotOpacity);
  }, [frame, dotOpacity]);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    const draw = () => drawHorseFrame(canvas, frameRef.current, dotOpacity);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [dotOpacity]);

  return <canvas className="horse-canvas" ref={canvasRef} aria-hidden="true" />;
}

function RunningHorse({ active, onToggle }) {
  const [frame, setFrame] = useState(2);
  const stageRef = useRef(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!active || reducedMotion) return undefined;

    const startedAt = window.performance.now();
    let animationFrame;
    let previousFrame = -1;
    const animate = (time) => {
      const nextFrame = Math.floor((time - startedAt) / 110) % HORSE_FRAMES.length;
      if (nextFrame !== previousFrame) {
        previousFrame = nextFrame;
        setFrame(nextFrame);
      }
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [active]);

  const moveHorse = (event) => {
    if (!active || !stageRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 26;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 14;
    stageRef.current.style.setProperty("--horse-x", `${x}px`);
    stageRef.current.style.setProperty("--horse-y", `${y}px`);
  };

  const resetHorse = () => {
    stageRef.current?.style.setProperty("--horse-x", "0px");
    stageRef.current?.style.setProperty("--horse-y", "0px");
  };

  return (
    <div
      className={`horse-stage${active ? " horse-stage-active" : ""}`}
      onPointerMove={moveHorse}
      onPointerLeave={resetHorse}
    >
      <div className="horse-position" ref={stageRef}>
        <button
          className="horse-control herd-control"
          type="button"
          aria-pressed={active}
          aria-label={`${active ? "Pause" : "Play"} running horse herd animation`}
          onClick={onToggle}
        >
          <span className="herd-scene" aria-hidden="true">
            <span className="herd-plane herd-plane-back">
              {backHorses.map((horse, index) => (
                <span className={`herd-horse herd-horse-back-${index + 1}`} key={`back-${horse.offset}`}>
                  <HorseCanvas
                    frame={(frame + horse.offset) % HORSE_FRAMES.length}
                    dotOpacity={horse.dotOpacity}
                  />
                </span>
              ))}
            </span>
            <span className="herd-marquee">
              <span className="herd-marquee-track">
                <span className="herd-marquee-copy">MAKE PIXELS MOVE&nbsp;&nbsp;</span>
                <span className="herd-marquee-copy">MAKE PIXELS MOVE&nbsp;&nbsp;</span>
              </span>
            </span>
            <span className="herd-plane herd-plane-front">
              {frontHorses.map((horse, index) => (
                <span className={`herd-horse herd-horse-front-${index + 1}`} key={`front-${horse.offset}`}>
                  <HorseCanvas
                    frame={(frame + horse.offset) % HORSE_FRAMES.length}
                    dotOpacity={horse.dotOpacity}
                  />
                </span>
              ))}
            </span>
          </span>
        </button>
      </div>
      <h1 className="sr-only" id="hero-title">Make pixels move — animated halftone horse herd</h1>
    </div>
  );
}

function ProjectItem({ project, index, onSelect }) {
  const hasPreview = project.id === "samsung-skate-park";

  return (
    <article className={`project-item project-item-${index + 1}`}>
      <button className="project-visual" type="button" onClick={() => onSelect(project)} aria-label={`Open ${project.title} case study`}>
        {hasPreview ? (
          <video src="/assets/shiuchit/samsung-skate-park-img-6089.mp4" poster={project.cover} muted loop autoPlay playsInline />
        ) : (
          <img src={project.cover} alt={`${project.title} cover`} loading={index < 2 ? "eager" : "lazy"} />
        )}
        <span>View project</span>
      </button>
      <button className="project-label" type="button" onClick={() => onSelect(project)}>
        <small>{String(index + 1).padStart(2, "0")}</small>
        <span>
          <strong>{project.title}</strong>
          <em>{project.eyebrow || project.type} · {project.year}</em>
        </span>
      </button>
    </article>
  );
}

export function App() {
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroMotion, setHeroMotion] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const items = [...document.querySelectorAll(".project-item")];
    let frame = 0;

    const updateProjectScale = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const focusLine = viewportHeight * 0.52;

      items.forEach((item) => {
        const visual = item.querySelector(".project-visual");
        if (!visual) return;

        const bounds = visual.getBoundingClientRect();
        const center = bounds.top + bounds.height / 2;
        const distance = Math.min(Math.abs(center - focusLine) / (viewportHeight * 0.78), 1);
        const influence = 1 - distance;
        const eased = influence * influence * (3 - 2 * influence);
        const scale = 0.94 + eased * 0.1;

        visual.style.setProperty("--scroll-scale", scale.toFixed(4));
      });
    };

    const requestScaleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProjectScale);
    };

    updateProjectScale();
    window.addEventListener("scroll", requestScaleUpdate, { passive: true });
    window.addEventListener("resize", requestScaleUpdate);

    return () => {
      window.removeEventListener("scroll", requestScaleUpdate);
      window.removeEventListener("resize", requestScaleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const nextProject = () => {
    const index = projects.indexOf(selected);
    setSelected(projects[(index + 1) % projects.length]);
    document.querySelector(".project-dialog")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const previousProject = () => {
    const index = projects.indexOf(selected);
    setSelected(projects[(index - 1 + projects.length) % projects.length]);
    document.querySelector(".project-dialog")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="site" id="top">
      <section className={`nameplate${heroMotion ? " hero-motion-on" : ""}`} aria-labelledby="hero-title">
        <header className="hero-topbar">
          <a className="hero-brand" href="#top" aria-label="Benjamin Lau, home">
            <img className="hero-monogram" src="/assets/b-logo-angular-option-2.png" alt="" />
            <span className="hero-brand-name">
              <span>Benjamin</span>
              <span>Lau</span>
            </span>
          </a>
          <nav className="hero-nav" aria-label="Primary navigation">
            <a href="#work">Work</a>
            <a href="#about">Profile</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="hero-availability">
            <span aria-hidden="true"></span>
            <p>Available for selected collaborations</p>
          </div>
          <button type="button" className="menu-button" onClick={() => setMenuOpen(true)}>Menu</button>
        </header>
        <div className="hero-statement">
          <p className="hero-kicker">Independent motion designer · London / UK</p>
          <RunningHorse active={heroMotion} onToggle={() => setHeroMotion((current) => !current)} />
        </div>
      </section>

      <section className="work" id="work" aria-labelledby="work-title">
        <div className="work-intro">
          <p>Selected work</p>
          <h2 className="sr-only" id="work-title">Projects in motion.</h2>
        </div>
        <div className="project-constellation">
          {projects.map((project, index) => (
            <ProjectItem key={project.id} project={project} index={index} onSelect={setSelected} />
          ))}
        </div>
        <a className="view-all" href="#project-index">View all ({projects.length})</a>
      </section>

      <section className="project-index" id="project-index" aria-labelledby="index-title">
        <p className="section-kicker">Project index</p>
        <h2 id="index-title">Selected work, 2022—2026</h2>
        <div className="index-list">
          {projects.map((project, index) => (
            <button type="button" onClick={() => setSelected(project)} key={project.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{project.title}</strong>
              <em>{project.eyebrow || project.type}</em>
              <time>{project.year}</time>
            </button>
          ))}
        </div>
      </section>

      <section className="profile" id="about" aria-labelledby="profile-title">
        <div>
          <p className="section-kicker">Profile</p>
          <h2 id="profile-title">Ideas made<br />to move.</h2>
        </div>
        <div className="profile-copy">
          <p>Benjamin Lau is a London-based motion designer working across brand, film, events and emerging technology.</p>
          <p>He combines art direction, animation and experimentation to build visual stories with a precise sense of rhythm.</p>
          <div className="capabilities">
            <span>Motion design</span><span>3D animation</span><span>Art direction</span><span>AI tools</span>
          </div>
        </div>
      </section>

      <footer id="contact">
        <div className="footer-lead">
          <p>Available for selected projects</p>
          <h2>Let’s make<br />something move.</h2>
          <a href="https://www.linkedin.com/in/ben-shiu-chit-lau/" target="_blank" rel="noreferrer">Start a conversation</a>
        </div>
        <div className="footer-meta">
          <p>London / UK</p>
          <a href="#top">Back to top</a>
          <span>© 2026 Benjamin Lau</span>
        </div>
      </footer>

      {menuOpen && <FullscreenMenu onClose={() => setMenuOpen(false)} />}
      {selected && (
        <ProjectDialog
          key={selected.id}
          project={selected}
          onClose={() => setSelected(null)}
          onNext={nextProject}
          onPrevious={previousProject}
        />
      )}
    </main>
  );
}
