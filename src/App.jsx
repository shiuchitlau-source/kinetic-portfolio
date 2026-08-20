import { useCallback, useEffect, useRef, useState } from "react";
import { HORSE_FRAME_HEIGHT, HORSE_FRAME_WIDTH, HORSE_FRAMES } from "./horseFrames";
import { projects } from "./projects";

const PIXEL_TILE_COUNT = 96;
const PIXEL_COLUMNS = 12;

const serviceOffers = [
  {
    title: "Motion direction",
    capabilities: ["Creative development", "Storyboards", "Styleframes", "Direction"],
    description: "From the first frame to final delivery, I shape the visual idea, rhythm and production approach so every moving part speaks with one voice.",
    visualProject: "motion-wheel",
    relatedProjects: ["motion-wheel", "tug-of-war"],
  },
  {
    title: "Brand motion systems",
    capabilities: ["Motion principles", "Toolkits", "Idents", "Social templates"],
    description: "I translate brand identity into a practical motion language—clear rules, repeatable behaviours and flexible assets built to work across teams and channels.",
    visualProject: "samsung-skate-park",
    relatedProjects: ["wise-future-store-london", "samsung-skate-park"],
  },
  {
    title: "3D & CGI",
    capabilities: ["Look development", "Animation", "Simulation", "Product films"],
    description: "Tactile materials, precise lighting and considered camera movement turn products and abstract ideas into distinctive cinematic worlds.",
    visualProject: "hublot-tourbillion",
    relatedProjects: ["hublot-tourbillion", "scholl-campaign"],
  },
  {
    title: "Campaign content",
    capabilities: ["Launch films", "Social content", "AI production", "Adaptations"],
    description: "I build campaign systems with enough character for the hero moment and enough range to stay coherent through every cutdown, screen and format.",
    visualProject: "aigc-for-midnite",
    relatedProjects: ["aigc-for-midnite", "adidas-ss23"],
  },
];

const clientNames = [
  "Samsung",
  "adidas",
  "Wise",
  "Scholl",
  "Midnite",
  "Cinch",
  "Nector",
  "Hublot Tourbillion",
  "ASOS",
  "Jack Daniel’s",
  "TUMI",
  "La Mer",
  "Christie’s",
  "Acer",
  "Wacom",
  "Alcon",
  "Starbucks",
  "VISA",
];

function createRandomGenerator(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function createPixelTransitionSchedule() {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  const random = createRandomGenerator(seed);
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1],
  ];

  const createOrder = () => {
    const [directionX, directionY] = directions[Math.floor(random() * directions.length)];
    const focusX = random() * (PIXEL_COLUMNS - 1);
    const focusY = random() * ((PIXEL_TILE_COUNT / PIXEL_COLUMNS) - 1);
    const maxDistance = Math.hypot(PIXEL_COLUMNS - 1, (PIXEL_TILE_COUNT / PIXEL_COLUMNS) - 1);

    return Array.from({ length: PIXEL_TILE_COUNT }, (_, index) => {
      const column = index % PIXEL_COLUMNS;
      const row = Math.floor(index / PIXEL_COLUMNS);
      const projection = (
        ((column / (PIXEL_COLUMNS - 1)) * directionX)
        + ((row / ((PIXEL_TILE_COUNT / PIXEL_COLUMNS) - 1)) * directionY)
        + 2
      ) / 4;
      const cluster = Math.hypot(column - focusX, row - focusY) / maxDistance;

      return {
        index,
        score: (random() * 0.72) + (projection * 0.18) + (cluster * 0.1),
      };
    })
      .sort((a, b) => a.score - b.score)
      .map(({ index }) => index);
  };

  const coverOrder = createOrder();
  const revealOrder = createOrder();
  const coverRanks = new Map(coverOrder.map((index, rank) => [index, rank]));
  const revealRanks = new Map(revealOrder.map((index, rank) => [index, rank]));

  return Array.from({ length: PIXEL_TILE_COUNT }, (_, index) => {
    const coverProgress = coverRanks.get(index) / (PIXEL_TILE_COUNT - 1);
    const revealProgress = revealRanks.get(index) / (PIXEL_TILE_COUNT - 1);
    const coverDelay = Math.round((coverProgress ** 0.92) * 445 + random() * 34);
    const revealDelay = Math.round((revealProgress ** 0.9) * 450 + random() * 30);

    return {
      "--pixel-cover-delay": `${coverDelay}ms`,
      "--pixel-reveal-delay": `${revealDelay}ms`,
    };
  });
}

function useContainedFocus(containerRef, onClose) {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const container = containerRef.current;
    if (!container) return undefined;

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "iframe",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");
    const getFocusable = () => [...container.querySelectorAll(focusableSelector)]
      .filter((element) => !element.hasAttribute("hidden") && element.getClientRects().length > 0);
    const focusFrame = window.requestAnimationFrame(() => {
      const preferredFocus = container.querySelector("[data-autofocus]");
      (preferredFocus || getFocusable()[0])?.focus({ preventScroll: true });
    });

    const containFocus = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", containFocus);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", containFocus);
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [containerRef]);
}

function Media({ src, alt, className = "" }) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return src.endsWith(".mp4") ? (
    <video className={className} src={src} muted loop autoPlay={!reduceMotion} playsInline preload="metadata" aria-label={alt} />
  ) : (
    <img className={className} src={src} alt={alt} loading="lazy" decoding="async" />
  );
}

function ProjectDialog({ project, onClose, onNext, onPrevious }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef(null);
  const dialogRef = useRef(null);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(onClose, reducedMotion ? 0 : 280);
  };

  useContainedFocus(dialogRef, requestClose);

  useEffect(() => {
    document.body.classList.add("dialog-open");
    return () => {
      window.clearTimeout(closeTimer.current);
      document.body.classList.remove("dialog-open");
    };
  }, [onClose]);

  return (
    <div className={`dialog-backdrop${closing ? " is-closing" : ""}`} role="presentation" onMouseDown={requestClose}>
      <article ref={dialogRef} className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-summary" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-bar">
          <p>{project.type} · {project.year}</p>
          <button type="button" onClick={requestClose}>Close project</button>
        </div>
        <div className="dialog-hero">
          <p>{project.eyebrow || project.type}</p>
          <h2 id="dialog-title">{project.title}</h2>
          <p id="dialog-summary">{project.summary}</p>
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

function CommandMenu({ onClose, onNavigate, commands }) {
  const [closing, setClosing] = useState(false);
  const [command, setCommand] = useState("");
  const closingRef = useRef(false);
  const closeTimer = useRef(null);
  const menuRef = useRef(null);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(onClose, reducedMotion ? 0 : 280);
  };

  useContainedFocus(menuRef, requestClose);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const navigate = (event) => onNavigate(event, requestClose);
  const submitCommand = (event) => {
    event.preventDefault();
    const value = command.trim().toLowerCase();
    if (!value) return;
    if (value === "close" || value === "exit") {
      requestClose();
      return;
    }
    const destination = commands.find(({ label }) => label.startsWith(value));
    if (destination) {
      menuRef.current?.querySelector(`a[href="${destination.href}"]`)?.click();
    }
  };

  return (
    <aside id="command-menu" ref={menuRef} className={`command-menu${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label="Site command menu">
      <div className="command-menu-top">
        <p>BL Command Terminal</p>
        <button type="button" onClick={requestClose} aria-label="Close command menu">×</button>
      </div>
      <form onSubmit={submitCommand}>
        <label>
          <span aria-hidden="true">:/</span>
          <span className="sr-only">Enter command</span>
          <input data-autofocus value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Enter command" autoComplete="off" spellCheck="false" autoFocus />
        </label>
      </form>
      <p className="command-menu-help">Start typing and see where it leads you… or use one of the prompts below.</p>
      <nav aria-label="Command shortcuts">
        {commands.map(({ label, href }) => <a key={label} href={href} onClick={navigate}>{label}</a>)}
        <button type="button" onClick={requestClose}>close</button>
      </nav>
      <div className="command-menu-foot">
        <p><kbd>ESC</kbd> to close</p>
        <button type="button" onClick={() => setCommand("")}>Clear</button>
      </div>
    </aside>
  );
}

function PixelTransition({ phase, schedule }) {
  return (
    <div className="pixel-transition" data-phase={phase} aria-hidden="true">
      {schedule.map((timing, index) => (
        <span
          className="pixel-transition-tile"
          key={index}
          style={timing}
        />
      ))}
    </div>
  );
}

const GALLOP_FRAME_DURATIONS = [160, 165, 150, 135, 125, 120, 135, 170];
const HORSE_DOT_COLOR = "#ff4a17";
const HORSE_DOT_SPACING = 4;
const HORSE_POINTS = HORSE_FRAMES.map((encoded) => {
  const binary = atob(encoded);
  const points = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) points[index] = binary.charCodeAt(index);
  return points;
});
const HORSE_DOT_FRAMES = HORSE_POINTS.map((points) => {
  const cells = new Map();

  for (let index = 0; index < points.length; index += 3) {
    const column = Math.floor(points[index] / HORSE_DOT_SPACING);
    const row = Math.floor(points[index + 1] / HORSE_DOT_SPACING);
    const key = `${column}:${row}`;
    const cell = cells.get(key) || { column, row, count: 0 };
    cell.count += 1;
    cells.set(key, cell);
  }

  return [...cells.values()].map(({ column, row, count }) => ({
    x: column * HORSE_DOT_SPACING + HORSE_DOT_SPACING / 2,
    y: row * HORSE_DOT_SPACING + HORSE_DOT_SPACING / 2,
    radius: 0.48 + Math.min(count / 10, 1) * 0.92,
  }));
});

function drawHorseFrame(canvas, frame) {
  const bounds = canvas.getBoundingClientRect();
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round((bounds.width || HORSE_FRAME_WIDTH) * density));
  const height = Math.max(1, Math.round((bounds.height || HORSE_FRAME_HEIGHT) * density));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, width, height);
  context.save();
  context.scale(width / HORSE_FRAME_WIDTH, height / HORSE_FRAME_HEIGHT);
  const dots = HORSE_DOT_FRAMES[frame];

  context.fillStyle = HORSE_DOT_COLOR;
  context.beginPath();
  dots.forEach(({ x, y, radius }) => {
    context.moveTo(x + radius, y);
    context.arc(x, y, radius, 0, Math.PI * 2);
  });
  context.fill();
  context.restore();
}

function HorseCanvas({ frame }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(frame);

  useEffect(() => {
    frameRef.current = frame;
    if (canvasRef.current) drawHorseFrame(canvasRef.current, frame);
  }, [frame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const draw = () => drawHorseFrame(canvas, frameRef.current);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return <canvas className="runner-canvas" ref={canvasRef} data-frame={frame} aria-hidden="true" />;
}

function HeroBackgroundVideo() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(!reducedMotion);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!playing) {
      video.pause();
      return;
    }
    video.play().catch(() => setPlaying(false));
  }, [playing]);

  return (
    <>
      <video
        className="hero-background-video"
        ref={videoRef}
        src="/assets/motion-reel-2025-c.mp4"
        muted
        loop
        autoPlay={!reducedMotion}
        playsInline
        preload="auto"
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        className="hero-reel-control"
        type="button"
        onClick={() => setPlaying((current) => !current)}
        aria-label={playing ? "Pause background motion reel" : "Play background motion reel"}
      >
        <span aria-hidden="true">{playing ? "Pause reel" : "Play reel"}</span>
      </button>
    </>
  );
}

function AnimatedHorseHero({ onNavigate }) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const playing = !reducedMotion;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!playing) return undefined;
    let current = frame;
    let timer = 0;
    const advance = () => {
      timer = window.setTimeout(() => {
        current = (current + 1) % HORSE_FRAMES.length;
        setFrame(current);
        advance();
      }, GALLOP_FRAME_DURATIONS[current]);
    };
    advance();
    return () => window.clearTimeout(timer);
  }, [playing]);

  return (
    <div className="horse-stage horse-stage-single">
      <div className="hero-static-title" aria-hidden="true">
        <span>MOVING</span>
        <span>PIXELS</span>
      </div>
      <a
        className={`horse-animation${playing ? " is-playing" : " is-paused"}`}
        href="#work"
        aria-label="View selected work"
        data-playing={playing ? "true" : "false"}
        onClick={onNavigate}
      >
        <HorseCanvas frame={frame} />
      </a>
      <h1 className="sr-only" id="hero-title">Moving Pixels — animated pixel horse</h1>
    </div>
  );
}

function InteractiveRodinModel() {
  const mountRef = useRef(null);
  const targetRotationRef = useRef({ ...DEFAULT_MODEL_ROTATION });
  const touchActiveRef = useRef(false);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let cancelled = false;
    let cleanupRenderer = () => {};

    const setupModel = async () => {
      const [THREE, { GLTFLoader }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
      ]);
      if (cancelled) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 0.05, 3.15);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.78;
      renderer.domElement.className = "rodin-model-canvas";
      renderer.domElement.setAttribute("aria-hidden", "true");
      mount.appendChild(renderer.domElement);

      const modelPivot = new THREE.Group();
      modelPivot.rotation.set(DEFAULT_MODEL_ROTATION.x, DEFAULT_MODEL_ROTATION.y, 0);
      scene.add(modelPivot);

      scene.add(new THREE.HemisphereLight(0xd8d1c6, 0x090908, 0.95));
      const keyLight = new THREE.DirectionalLight(0xe8e2d8, 1.75);
      keyLight.position.set(3.5, 4.5, 4);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0xa83a22, 0.55);
      rimLight.position.set(-4, 1.5, -2.5);
      scene.add(rimLight);

      let loadedModel = null;
      let animationFrame = 0;
      let visible = true;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const resize = () => {
        const { width, height } = mount.getBoundingClientRect();
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };

      const render = () => {
        animationFrame = 0;
        if (!visible || cancelled) return;
        if (!reducedMotion) {
          modelPivot.rotation.x += (targetRotationRef.current.x - modelPivot.rotation.x) * 0.075;
          modelPivot.rotation.y += (targetRotationRef.current.y - modelPivot.rotation.y) * 0.075;
        }
        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(render);
      };

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(mount);
      resize();

      const visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !animationFrame) animationFrame = window.requestAnimationFrame(render);
      }, { threshold: 0.02 });
      visibilityObserver.observe(mount);

      const loader = new GLTFLoader();
      loader.load(
        "/assets/rodin-3d-v2.glb",
        (gltf) => {
          if (cancelled) return;
          loadedModel = gltf.scene;
          const bounds = new THREE.Box3().setFromObject(loadedModel);
          const center = bounds.getCenter(new THREE.Vector3());
          const size = bounds.getSize(new THREE.Vector3());
          loadedModel.position.sub(center);
          loadedModel.scale.setScalar(1.5 / Math.max(size.x, size.y, size.z));
          loadedModel.rotation.y = Math.PI;
          loadedModel.traverse((node) => {
            if (!node.isMesh) return;
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.filter(Boolean).forEach((material) => {
              if ("metalness" in material) material.metalness = 0.02;
              if ("roughness" in material) material.roughness = 0.95;
              if ("metalnessMap" in material) material.metalnessMap = null;
              if ("roughnessMap" in material) material.roughnessMap = null;
              if ("envMapIntensity" in material) material.envMapIntensity = 0.04;
              material.needsUpdate = true;
            });
          });
          modelPivot.add(loadedModel);
          setStatus("ready");
        },
        undefined,
        () => {
          if (!cancelled) setStatus("error");
        },
      );

      animationFrame = window.requestAnimationFrame(render);

      cleanupRenderer = () => {
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        const textures = new Set();
        loadedModel?.traverse((node) => {
          node.geometry?.dispose();
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.filter(Boolean).forEach((material) => {
            Object.values(material).forEach((value) => {
              if (value?.isTexture) textures.add(value);
            });
            material.dispose();
          });
        });
        textures.forEach((texture) => texture.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    setupModel().catch(() => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      cleanupRenderer();
    };
  }, []);

  const updateRotation = (event) => {
    if (event.pointerType === "touch" && !touchActiveRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    targetRotationRef.current = {
      x: DEFAULT_MODEL_ROTATION.x + y * 0.28,
      y: DEFAULT_MODEL_ROTATION.y + x * 0.9,
    };
    event.currentTarget.dataset.interacting = "true";
    event.currentTarget.dataset.rotationTarget = `${targetRotationRef.current.x.toFixed(3)},${targetRotationRef.current.y.toFixed(3)}`;
  };

  const resetRotation = (event) => {
    touchActiveRef.current = false;
    targetRotationRef.current = { ...DEFAULT_MODEL_ROTATION };
    event.currentTarget.dataset.interacting = "false";
    event.currentTarget.dataset.rotationTarget = DEFAULT_MODEL_ROTATION_TARGET;
  };

  const startTouchRotation = (event) => {
    touchActiveRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateRotation(event);
  };

  const rotateWithKeyboard = (event) => {
    const movement = {
      ArrowLeft: { x: 0, y: -0.18 },
      ArrowRight: { x: 0, y: 0.18 },
      ArrowUp: { x: -0.12, y: 0 },
      ArrowDown: { x: 0.12, y: 0 },
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    targetRotationRef.current = {
      x: Math.max(-0.5, Math.min(0.5, targetRotationRef.current.x + movement.x)),
      y: Math.max(
        DEFAULT_MODEL_ROTATION.y - 1.1,
        Math.min(DEFAULT_MODEL_ROTATION.y + 1.1, targetRotationRef.current.y + movement.y),
      ),
    };
    event.currentTarget.dataset.interacting = "true";
    event.currentTarget.dataset.rotationTarget = `${targetRotationRef.current.x.toFixed(3)},${targetRotationRef.current.y.toFixed(3)}`;
  };

  return (
    <div className="model-stage">
      <div className="hero-static-title" aria-hidden="true">
        <span>MOVING</span>
        <span>PIXELS</span>
      </div>
      <div
        className={`rodin-model rodin-model-${status}`}
        role="img"
        aria-label="Interactive 3D sculpture. Move the cursor or use arrow keys to rotate it."
        aria-busy={status === "loading"}
        data-model-state={status}
        data-interacting="false"
        data-rotation-target={DEFAULT_MODEL_ROTATION_TARGET}
        tabIndex={0}
        onPointerDown={startTouchRotation}
        onPointerMove={updateRotation}
        onPointerUp={resetRotation}
        onPointerCancel={resetRotation}
        onPointerLeave={resetRotation}
        onKeyDown={rotateWithKeyboard}
      >
        <div className="rodin-model-mount" ref={mountRef} />
        {status === "loading" ? <span className="rodin-model-status">Loading 3D model</span> : null}
        {status === "error" ? <span className="rodin-model-status">3D model unavailable</span> : null}
        <span className="rodin-model-hint" aria-hidden="true">Move or drag to rotate</span>
      </div>
      <h1 className="sr-only" id="hero-title">Moving Pixels — interactive 3D sculpture</h1>
    </div>
  );
}

function ProjectItem({ project, index, onSelect }) {
  const hasPreview = project.id === "samsung-skate-park";

  return (
    <article className={`project-item project-item-${index + 1}`}>
      <button className="project-visual" type="button" onClick={() => onSelect(project)} aria-label={`Open ${project.title} case study`}>
        {hasPreview ? (
          <video
            src="/assets/shiuchit/samsung-skate-park-img-6089.mp4"
            poster={project.cover}
            muted
            loop
            autoPlay={!window.matchMedia("(prefers-reduced-motion: reduce)").matches}
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={project.cover} alt={`${project.title} cover`} loading={index < 2 ? "eager" : "lazy"} decoding="async" />
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
  const isServicesPage = window.location.pathname.replace(/\/+$/, "") === "/services";
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pixelPhase, setPixelPhase] = useState("intro-covered");
  const [pixelSchedule, setPixelSchedule] = useState(createPixelTransitionSchedule);
  const pixelPhaseRef = useRef("intro-covered");
  const pixelTimersRef = useRef([]);
  const pixelFramesRef = useRef([]);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const navigationItems = isServicesPage
    ? [["Home", "/"], ["Work", "/#work"], ["Services", "#top"], ["Contact", "#contact"]]
    : [["Home", "#top"], ["Work", "#work"], ["Services", "/services"], ["Contact", "#contact"]];
  const commandItems = navigationItems.map(([label, href]) => ({ label: label.toLowerCase(), href }));

  useEffect(() => {
    const openCommandMenu = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable)) return;
      event.preventDefault();
      setMenuOpen(true);
    };
    window.addEventListener("keydown", openCommandMenu);
    return () => window.removeEventListener("keydown", openCommandMenu);
  }, []);

  useEffect(() => {
    pixelPhaseRef.current = pixelPhase;
    document.body.classList.toggle("pixel-transition-active", pixelPhase !== "idle");
    return () => document.body.classList.remove("pixel-transition-active");
  }, [pixelPhase]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setPixelPhase("idle");
      return undefined;
    }

    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => setPixelPhase("intro-reveal"));
      pixelFramesRef.current.push(secondFrame);
    });
    const finishIntro = window.setTimeout(() => setPixelPhase("idle"), 720);
    pixelFramesRef.current.push(firstFrame);
    pixelTimersRef.current.push(finishIntro);

    return () => {
      pixelFramesRef.current.forEach((frame) => window.cancelAnimationFrame(frame));
      pixelTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const handlePixelNavigation = (event, afterNavigate) => {
    const href = event.currentTarget.getAttribute("href");
    if (!href?.startsWith("#")) return;
    event.preventDefault();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const navigate = () => {
      document.querySelector(href)?.scrollIntoView({ behavior: "instant", block: "start" });
      window.history.pushState(null, "", href);
      afterNavigate?.();
    };

    if (reducedMotion) {
      navigate();
      return;
    }
    if (pixelPhaseRef.current !== "idle") return;

    setPixelSchedule(createPixelTransitionSchedule());
    setPixelPhase("cover-start");
    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => setPixelPhase("covering"));
      pixelFramesRef.current.push(secondFrame);
    });
    pixelFramesRef.current.push(firstFrame);

    const coverComplete = window.setTimeout(() => {
      navigate();
      setPixelPhase("covered");
      const revealStart = window.setTimeout(() => setPixelPhase("revealing"), 60);
      const revealComplete = window.setTimeout(() => setPixelPhase("idle"), 720);
      pixelTimersRef.current.push(revealStart, revealComplete);
    }, 560);
    pixelTimersRef.current.push(coverComplete);
  };

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hero = document.querySelector(".nameplate");
    const horse = hero?.querySelector(".horse-animation");
    if (!hero || !horse) return undefined;

    if (reducedMotion) {
      horse.style.setProperty("--horse-scroll-scale", "1");
      horse.dataset.scrollScale = "1.0000";
      return undefined;
    }

    let frame = 0;

    const updateHorseScale = () => {
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const progress = Math.min(Math.max(-bounds.top / Math.max(bounds.height, 1), 0), 1);
      const scale = 1 - progress * 0.7;

      horse.style.setProperty("--horse-scroll-scale", scale.toFixed(4));
      horse.dataset.scrollScale = scale.toFixed(4);
    };

    const requestHorseScaleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateHorseScale);
    };

    updateHorseScale();
    window.addEventListener("scroll", requestHorseScaleUpdate, { passive: true });
    window.addEventListener("resize", requestHorseScaleUpdate);

    return () => {
      window.removeEventListener("scroll", requestHorseScaleUpdate);
      window.removeEventListener("resize", requestHorseScaleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      horse.style.removeProperty("--horse-scroll-scale");
      delete horse.dataset.scrollScale;
    };
  }, []);

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
        const scale = 0.8 + eased * 0.2;

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

  useEffect(() => {
    if (!isServicesPage) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = [...document.querySelectorAll(".service-row")];
    const revealGroups = [...rows, ...document.querySelectorAll(".clients-section")];

    if (reducedMotion) {
      revealGroups.forEach((group) => group.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });

    revealGroups.forEach((group) => observer.observe(group));

    let frame = 0;
    const updateServiceImages = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;

      rows.forEach((row) => {
        const visual = row.querySelector(".service-visual");
        if (!visual) return;
        const bounds = visual.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > viewportHeight) return;
        const visualCenter = bounds.top + bounds.height / 2;
        const offset = Math.max(-1, Math.min(1, (visualCenter - viewportHeight / 2) / viewportHeight));
        visual.style.setProperty("--service-parallax", `${(offset * -14).toFixed(2)}px`);
      });
    };

    const requestServiceImageUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateServiceImages);
    };

    updateServiceImages();
    window.addEventListener("scroll", requestServiceImageUpdate, { passive: true });
    window.addEventListener("resize", requestServiceImageUpdate);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestServiceImageUpdate);
      window.removeEventListener("resize", requestServiceImageUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      rows.forEach((row) => row.querySelector(".service-visual")?.style.removeProperty("--service-parallax"));
    };
  }, [isServicesPage]);

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
    <main className={`site${menuOpen ? " command-open" : ""}${isServicesPage ? " services-site" : ""}`} id="top">
      <header className="hero-topbar">
        <a className="hero-brand" href={isServicesPage ? "/" : "#top"} aria-label="Benjamin Lau, home" onClick={handlePixelNavigation}>
          <span className="hero-brand-compact" aria-hidden="true">
            <img className="hero-monogram" src="/assets/b-logo-angular-option-2.png" alt="" />
          </span>
          <span className="hero-brand-expanded">
            <img className="hero-monogram" src="/assets/b-logo-angular-option-2.png" alt="" />
            <span className="hero-brand-name"><span>Benjamin</span><span>Lau</span></span>
          </span>
        </a>
        <nav className="hero-nav" aria-label="Primary navigation">
          {navigationItems.map(([label, href], index) => (
            <a className={`${index % 2 === 0 ? "nav-chip nav-chip-square" : "nav-chip nav-chip-pill"}${isServicesPage && label === "Services" ? " is-active" : ""}`} href={href} onClick={handlePixelNavigation} key={label}>
              <span className="nav-chip-mask"><span>{label}</span><span aria-hidden="true">{label}</span></span>
            </a>
          ))}
        </nav>
        <button type="button" className="menu-button" aria-expanded={menuOpen} aria-controls="command-menu" onClick={() => setMenuOpen((open) => !open)}>
          <span className="menu-desktop-label">Press <kbd>/</kbd> for ?</span>
          <span className="menu-mobile-label">{menuOpen ? "Close" : "Menu"}</span>
        </button>
      </header>

      {!isServicesPage && (
        <>
          <section className="nameplate" aria-labelledby="hero-title">
            <HeroBackgroundVideo />
            <div className="hero-statement">
              <AnimatedHorseHero onNavigate={handlePixelNavigation} />
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
            <a className="view-all" href="#project-index" onClick={handlePixelNavigation}>View all ({projects.length})</a>
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
        </>
      )}

      {isServicesPage && <section className="services" aria-labelledby="services-title">
        <div className="services-hero">
          <div>
            <p className="section-kicker services-kicker"><span>Independent services</span></p>
            <h2 id="services-title" aria-label="Ideas built to move.">
              <span className="services-title-line" aria-hidden="true"><span>Ideas built</span></span>
              <span className="services-title-line" aria-hidden="true"><span>to move.</span></span>
            </h2>
          </div>
          <div className="services-intro-copy">
            <div className="services-copy-mask"><p>I partner with brands, agencies and production teams to turn a clear idea into motion people can feel.</p></div>
            <div className="services-copy-mask"><p>Bring me in for one defining film or a complete motion language—from early direction through final delivery.</p></div>
          </div>
        </div>

        <div className="service-list">
          {serviceOffers.map((service, index) => {
            const visualProject = projects.find((project) => project.id === service.visualProject);
            const relatedProjects = service.relatedProjects
              .map((id) => projects.find((project) => project.id === id))
              .filter(Boolean);
            return (
              <article className="service-row" key={service.title}>
                <div className="service-visual">
                  <img src={visualProject?.cover} alt={`Still from ${visualProject?.title}`} loading="lazy" />
                </div>
                <div className="service-details">
                  <div className="service-title-row">
                    <span>({String(index + 1).padStart(2, "0")})</span>
                    <h3><span>{service.title}</span></h3>
                  </div>
                  <div className="service-tags">
                    {service.capabilities.map((capability, capabilityIndex) => <span style={{ "--tag-index": capabilityIndex }} key={capability}>{capability}</span>)}
                  </div>
                  <p>{service.description}</p>
                  <div className="service-work">
                    <span>Selected work</span>
                    <div>
                      {relatedProjects.map((project, projectIndex) => (
                        <button style={{ "--work-index": projectIndex }} type="button" onClick={() => setSelected(project)} key={project.id}>{project.title}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <section className="clients-section" aria-labelledby="clients-title">
          <div className="clients-intro">
            <div className="clients-title-mask"><h2 id="clients-title">Clients</h2></div>
            <p>Collaborating with global brands, category leaders and ambitious teams across culture, fashion, technology and entertainment.</p>
          </div>
          <ul className="clients-list" aria-label="Selected clients">
            {clientNames.map((client, index) => (
              <li style={{ "--client-index": index }} key={client}>
                <span className="client-pill-label" aria-label={client}>
                  <span className="client-pill-mask" aria-hidden="true">
                    <span>{client}</span>
                    <span>{client}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </section>}

      <footer id="contact">
        <div className="footer-lead">
          <p>Available for selected projects</p>
          <h2>Let’s make<br />pixels move.</h2>
          <a href="https://www.linkedin.com/in/ben-shiu-chit-lau/" target="_blank" rel="noreferrer">Start a conversation</a>
        </div>
        <div className="footer-meta">
          <p>London / UK</p>
          <a href="#top" onClick={handlePixelNavigation}>Back to top</a>
          <span>© 2026 Benjamin Lau</span>
        </div>
      </footer>

      {menuOpen && <CommandMenu onClose={closeMenu} onNavigate={handlePixelNavigation} commands={commandItems} />}
      {selected && (
        <ProjectDialog
          key={selected.id}
          project={selected}
          onClose={() => setSelected(null)}
          onNext={nextProject}
          onPrevious={previousProject}
        />
      )}
      <PixelTransition phase={pixelPhase} schedule={pixelSchedule} />
    </main>
  );
}
