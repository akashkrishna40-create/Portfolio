(() => {
  const cap = value => Math.max(0, Math.min(1, value));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // -------------------------------------------------------------
  // TRACE & LIQUID CHROME PARTICLES
  // -------------------------------------------------------------
  function trace(ctx, points, progress, tailLength = Infinity) {
    const lengths = points.slice(1).map(([x, y], i) =>
      Math.hypot(x - points[i][0], y - points[i][1]));
    const visible = lengths.reduce((sum, length) => sum + length, 0) * cap(progress);
    const start = Math.max(0, visible - tailLength);
    let traveled = 0;
    ctx.beginPath();
    for (let i = 0; i < lengths.length && traveled < visible; i++) {
      const length = lengths[i];
      const [x, y] = points[i];
      const [nextX, nextY] = points[i + 1];
      if (traveled + length > start) {
        if (traveled <= start) {
          const from = (start - traveled) / length;
          ctx.moveTo(x + (nextX - x) * from, y + (nextY - y) * from);
        }
        const to = Math.min(1, (visible - traveled) / length);
        ctx.lineTo(x + (nextX - x) * to, y + (nextY - y) * to);
      }
      traveled += length;
    }
    ctx.stroke();
  }

  function traceChrome(ctx, points, progress) {
    trace(ctx, points, progress);
    if (progress <= 0 || progress >= 1) return;
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.globalAlpha = Math.min(0.9, progress * 6, (1 - progress) * 7);
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    trace(ctx, points, progress, 22);
    ctx.restore();
  }

  function drawSpark(ctx, x, y, age, scale = 1) {
    if (age >= 1) return;
    ctx.save();
    ctx.globalAlpha = (1 - age) * 0.95;
    ctx.strokeStyle = ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#e2e8f0';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2 * scale;
    ctx.fillRect(x - 2 * scale, y - 2 * scale, 4 * scale, 4 * scale);
    for (let i = 0; i < 8; i++) {
      const angle = i * 2.3999;
      const dx = Math.cos(angle), dy = Math.sin(angle);
      const distance = (5 + age * (17 + i * 2)) * scale;
      const end = distance + 7 * scale;
      trace(ctx, [[x + dx * distance, y + dy * distance], [x + dx * end, y + dy * end]], 1);
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // DYNAMIC CHROME SPECULAR LIGHT-ANGLE TRACKER (MOUSE REACTIVE)
  // -------------------------------------------------------------
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function initializeChromeSpecularTracking() {
    if (reduced.matches || !hasFinePointer) return;
    const cards = document.querySelectorAll('.feature, .project, .button, .about-card, .plant-card');

    cards.forEach(card => {
      let rect = null;
      let rafId = 0;
      let targetAngle = 145;

      const updateAngle = () => {
        rafId = 0;
        card.style.setProperty('--light-angle', `${targetAngle}deg`);
      };

      card.addEventListener('mouseenter', () => {
        rect = card.getBoundingClientRect();
      }, { passive: true });

      card.addEventListener('mousemove', e => {
        if (!rect) rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        targetAngle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI) + 90);
        if (!rafId) rafId = requestAnimationFrame(updateAngle);
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        rect = null;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        card.style.setProperty('--light-angle', '145deg');
      }, { passive: true });
    });
  }

  // -------------------------------------------------------------
  // HERO 3-PANEL 3D OPTICAL MOUSE PARALLAX
  // -------------------------------------------------------------
  function initializeHeroPanelParallax() {
    if (reduced.matches || !hero || !hasFinePointer) return;
    const panels = hero.querySelectorAll('.portrait-panel');
    if (!panels.length) return;

    // Cache panel depths once to eliminate getComputedStyle overhead on mousemove
    const panelData = [...panels].map(p => ({
      element: p,
      depth: parseFloat(p.style.getPropertyValue('--depth') || getComputedStyle(p).getPropertyValue('--depth') || '1')
    }));

    let heroRect = null;
    let parallaxRaf = 0;
    let normX = 0;
    let normY = 0;

    const applyParallax = () => {
      parallaxRaf = 0;
      panelData.forEach(({ element, depth }) => {
        const tx = (normX * 18 * depth).toFixed(1);
        const ty = (normY * 12 * depth).toFixed(1);
        element.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    };

    hero.addEventListener('mouseenter', () => {
      heroRect = hero.getBoundingClientRect();
    }, { passive: true });

    hero.addEventListener('mousemove', e => {
      if (!heroRect) heroRect = hero.getBoundingClientRect();
      normX = (e.clientX - heroRect.left) / heroRect.width - 0.5;
      normY = (e.clientY - heroRect.top) / heroRect.height - 0.5;
      if (!parallaxRaf) parallaxRaf = requestAnimationFrame(applyParallax);
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
      heroRect = null;
      if (parallaxRaf) {
        cancelAnimationFrame(parallaxRaf);
        parallaxRaf = 0;
      }
      panelData.forEach(({ element }) => {
        element.style.transform = 'translate3d(0, 0, 0)';
      });
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (heroRect) heroRect = hero.getBoundingClientRect();
    }, { passive: true });
  }

  // Initialize schematic
  initializeSchematic(document.querySelector('#schematic'));

  const hero = document.querySelector('.hero');
  if (!hero) {
    initializeChromeSpecularTracking();
    initializeHeroPanelParallax();
    return;
  }

  const work = document.querySelector('.work');
  const circuit = document.querySelector('#circuit');
  const firstProject = document.querySelector('.feature');
  const electrical = document.querySelector('#electrical');
  const electricalCircuit = document.querySelector('#electrical-circuit');
  const electricalInk = electricalCircuit ? electricalCircuit.getContext('2d') : null;
  const stages = document.querySelectorAll('.scroll-stage');
  const timeline = document.querySelector('.timeline-entries');
  const timelineCanvas = timeline ? timeline.querySelector('.timeline-sparks') : null;
  const timelineInk = timelineCanvas ? timelineCanvas.getContext('2d') : null;
  const markerOffset = timeline ? parseFloat(getComputedStyle(timeline).getPropertyValue('--node-y') || '25') : 25;
  const milestones = timeline ? [...timeline.querySelectorAll('.milestone')].map(element => ({
    element, reached: false, sparkStart: -Infinity
  })) : [];
  const context = circuit ? circuit.getContext('2d') : null;

  let frame = 0;
  let width = 0;
  let height = 0;
  let fired = false;
  let sparkStart = -Infinity;
  let endCircuitFired = false;
  let endCircuitSparkStart = -Infinity;
  let electricalDrawn = -1;
  let electricalFired = false;
  let electricalSparkStart = -Infinity;

  let milestonePositions = [];
  let timelineFirstPos = 0;
  let timelineRailHeight = 0;
  let timelineCanvasCssWidth = 0;
  let previousTimelineProgress = -1;

  function measureTimelineLayout() {
    if (!timeline) return;
    milestonePositions = milestones.map(({element}) => element.offsetTop + element.clientTop + markerOffset);
    if (!milestonePositions.length) return;
    timelineFirstPos = milestonePositions[0];
    timelineRailHeight = milestonePositions.at(-1) - timelineFirstPos;
    timeline.style.setProperty('--rail-start', timelineFirstPos + 'px');
    timeline.style.setProperty('--rail-height', timelineRailHeight + 'px');

    if (timelineCanvas && timelineInk) {
      const pixelRatio = Math.min(devicePixelRatio || 1, 2);
      timelineCanvasCssWidth = timelineCanvas.clientWidth;
      const cssHeight = timelineCanvas.clientHeight;
      timelineCanvas.width = Math.round(timelineCanvasCssWidth * pixelRatio);
      timelineCanvas.height = Math.round(cssHeight * pixelRatio);
      timelineInk.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }
  }

  const stageData = [...stages].map(section => ({
    section,
    prevProgress: -1
  }));

  function drawSectionProgress(time, viewport) {
    if (reduced.matches) return;

    for (let i = 0; i < stageData.length; i++) {
      const item = stageData[i];
      const rect = item.section.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > viewport + 80) continue;
      const prog = cap((viewport * 0.91 - rect.top) / (viewport * 0.56));
      if (Math.abs(prog - item.prevProgress) > 0.005) {
        item.section.style.setProperty('--stage-progress', prog);
        item.prevProgress = prog;
      }
    }

    if (work && electrical) {
      const elRect = electrical.getBoundingClientRect();
      const electricalProgress = cap((viewport * 0.91 - elRect.top) / (viewport * 0.72));
      work.style.setProperty('--electrical-progress', electricalProgress);
      drawElectricalTrace(time, electricalProgress);
    }

    if (timeline) {
      drawTimeline(time, viewport);
    }
  }

  function drawTimeline(time, viewport) {
    if (!timeline || !milestonePositions.length) return;
    const top = timeline.getBoundingClientRect().top;
    if (top > viewport * 1.5 || top < -timelineRailHeight - 200) return;

    const cursor = viewport * 0.43 - top;
    const currentProgress = reduced.matches ? 1 : cap((cursor - timelineFirstPos) / timelineRailHeight);

    if (Math.abs(currentProgress - previousTimelineProgress) > 0.003) {
      timeline.style.setProperty('--timeline-progress', currentProgress);
      previousTimelineProgress = currentProgress;
    }

    if (timelineInk) {
      timelineInk.clearRect(0, 0, timelineCanvas.width, timelineCanvas.height);
    }

    const sparkX = timelineCanvasCssWidth / 2;
    milestones.forEach((milestone, index) => {
      const y = milestonePositions[index];
      const reached = reduced.matches || cursor >= y;
      if (cursor < y - 12) {
        milestone.reached = false;
        milestone.sparkStart = -Infinity;
      }
      if (!milestone.reached && cursor >= y) {
        milestone.reached = true;
        if (!reduced.matches && top + y > 0) milestone.sparkStart = time;
      }
      if (milestone.isReachedAttr !== reached) {
        milestone.element.toggleAttribute('data-reached', reached);
        milestone.isReachedAttr = reached;
      }
      const age = (time - milestone.sparkStart) / 580;
      if (timelineInk && !reduced.matches && age < 1) {
        drawSpark(timelineInk, sparkX, y, age, 0.75);
        requestRender();
      }
    });
  }

  function drawElectricalTrace(time, progress) {
    if (!electricalInk) return;

    if (progress < 0.25 || reduced.matches) {
      electricalFired = false;
      electricalSparkStart = -Infinity;
    }

    if (!electricalFired && !reduced.matches && progress > 0.82) {
      electricalFired = true;
      electricalSparkStart = time;
    }

    const sparkAge = (time - electricalSparkStart) / 540;
    const isSparking = sparkAge < 1 && !reduced.matches;

    if (progress === electricalDrawn && !isSparking) return;
    electricalDrawn = progress;
    const ctx = electricalInk;
    ctx.clearRect(0, 0, electricalCircuit.width, electricalCircuit.height);

    const chrome = ctx.createLinearGradient(60, 8, 510, 202);
    chrome.addColorStop(0, '#535b64');
    chrome.addColorStop(0.5, '#ffffff');
    chrome.addColorStop(1, '#7a8591');

    ctx.strokeStyle = chrome;
    ctx.lineWidth = 2.4;
    traceChrome(ctx, [[380, 0], [380, 53], [348, 85], [348, 109], [320, 137], [320, 204]], progress * 1.65);

    ctx.lineWidth = 1.8;
    traceChrome(ctx, [[348, 85], [290, 85], [259, 116], [182, 116], [144, 154], [48, 154]], (progress - 0.32) * 1.55);
    traceChrome(ctx, [[348, 109], [396, 109], [429, 142], [480, 142], [503, 165], [503, 199]], (progress - 0.4) * 1.75);
    traceChrome(ctx, [[320, 137], [265, 137], [234, 168], [193, 168], [158, 203], [74, 203]], (progress - 0.49) * 2);

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.globalAlpha = cap((progress - 0.36) * 3);
    ctx.fillRect(345, 82, 6, 6);
    ctx.globalAlpha = cap((progress - 0.47) * 3);
    ctx.fillRect(318, 135, 4, 4);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Terminal sparks when electrical trace reaches endpoints
    if (isSparking) {
      drawSpark(ctx, 48, 154, sparkAge, 0.7);
      drawSpark(ctx, 503, 199, sparkAge, 0.7);
      drawSpark(ctx, 74, 203, sparkAge, 0.7);
      drawSpark(ctx, 320, 204, sparkAge, 0.85);
      requestRender();
    }
  }

  let prevLeaving = -1;
  let prevBuild = -1;

  function render(time) {
    frame = 0;
    const viewport = window.innerHeight;
    const workTop = work ? work.getBoundingClientRect().top : 0;
    const heroBox = hero.getBoundingClientRect();
    const leaving = cap((viewport * 0.72 - heroBox.bottom) / (viewport * 0.72));
    const build = reduced.matches ? 1 : cap((viewport - workTop) / (viewport * 0.98));

    // Authentic hero portrait segmented mask parallax - only update when visible or changing
    if (heroBox.bottom > -40 && Math.abs(leaving - prevLeaving) > 0.004) {
      hero.style.setProperty('--portrait-alpha', 1 - (reduced.matches ? 0 : leaving));
      hero.style.setProperty('--portrait-shift', reduced.matches ? '0px' : (leaving * 65).toFixed(1) + 'px');
      prevLeaving = leaving;
    }

    if (work && Math.abs(build - prevBuild) > 0.004) {
      work.style.setProperty('--finish-opacity', reduced.matches ? 1 : cap((build - 0.12) * 1.5));
      prevBuild = build;
    }

    drawSectionProgress(time, viewport);

    if (context && circuit) {
      context.clearRect(0, 0, width, height);

      const edge = width * (width < 620 ? 0.82 : 0.73);
      const joint = [edge + width * 0.065, 77];
      const branch = [edge + width * 0.10, 142];

      context.lineWidth = 1.2;
      context.strokeStyle = 'rgba(235, 245, 255, 0.7)';
      traceChrome(context, [[edge, 0], [edge, 40], [edge + width * 0.045, 40], joint], build * 2.8);

      context.strokeStyle = 'rgba(180, 195, 210, 0.55)';
      traceChrome(context, [joint, [joint[0] - 14, 100], [joint[0] + 2, 107], branch, [width * 0.94, 142], [width * 0.94, 218]], (build - 0.29) * 2);
      traceChrome(context, [joint, [edge + 5, 90], [edge - 21, 116], [edge - 92, 116], [edge - 92, 154]], (build - 0.38) * 2);
      traceChrome(context, [branch, [branch[0], 188], [branch[0] - 28, 208], [branch[0] - 28, 270]], (build - 0.57) * 2.6);

      if (build > 0.32) {
        context.fillStyle = '#ffffff';
        context.shadowColor = '#ffffff';
        context.shadowBlur = 6;
        context.fillRect(joint[0] - 2.5, joint[1] - 2.5, 5, 5);
        context.shadowBlur = 0;
      }

      if (build < 0.14) {
        fired = false;
        sparkStart = -Infinity;
      }

      // Midway branch junction spark
      if (!fired && !reduced.matches && build > 0.34 && firstProject && firstProject.getBoundingClientRect().top < viewport * 0.88) {
        fired = true;
        sparkStart = time;
      }

      const spark = (time - sparkStart) / 510;
      if (spark < 1 && !reduced.matches) {
        context.strokeStyle = 'rgba(255, 255, 255, ' + (1 - spark) * 0.9 + ')';
        context.shadowColor = '#ffffff';
        context.shadowBlur = 8;
        for (let i = 0; i < 9; i++) {
          const angle = i * 2.3999;
          const distance = spark * (18 + i * 3);
          const point = [joint[0] + Math.cos(angle) * distance, joint[1] + Math.sin(angle) * distance];
          trace(context, [point, [point[0] + Math.cos(angle) * 7, point[1] + Math.sin(angle) * 7]], 1);
        }
        context.shadowBlur = 0;
        requestRender();
      }

      // Terminal sparks when background circuit ends
      if (build < 0.25) {
        endCircuitFired = false;
        endCircuitSparkStart = -Infinity;
      }

      if (!endCircuitFired && !reduced.matches && build > 0.82) {
        endCircuitFired = true;
        endCircuitSparkStart = time;
      }

      const endSpark = (time - endCircuitSparkStart) / 540;
      if (endSpark < 1 && !reduced.matches) {
        drawSpark(context, branch[0] - 28, 270, endSpark, 0.85);
        drawSpark(context, edge - 92, 154, endSpark, 0.75);
        drawSpark(context, width * 0.94, 218, endSpark, 0.75);
        requestRender();
      }
    }
  }

  function requestRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function resize() {
    measureTimelineLayout();
    if (!circuit || !context) return;
    width = circuit.clientWidth;
    height = circuit.clientHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    circuit.width = Math.round(width * scale);
    circuit.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    requestRender();
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', requestRender, { passive: true });
  reduced.addEventListener('change', requestRender);

  initializeChromeSpecularTracking();
  initializeHeroPanelParallax();

  // Scroll reveal observer
  if ('IntersectionObserver' in window) {
    const seen = new WeakSet();
    const directions = {
      left: 'translateX(-28px)',
      right: 'translateX(28px)',
      bottom: 'translateY(28px)'
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const card = entry.target;
        if (!entry.isIntersecting && entry.boundingClientRect.top >= innerHeight) {
          seen.delete(card);
        }
        if (entry.intersectionRatio < 0.16 || seen.has(card)) continue;
        seen.add(card);
        if (reduced.matches || card.matches(':focus-within') || entry.boundingClientRect.top <= 0) continue;
        card.animate([
          { transform: directions[card.dataset.reveal] || 'translateY(24px)', opacity: 0.4 },
          { transform: 'none', opacity: 1 }
        ], { duration: 750, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      }
    }, { threshold: [0, 0.16] });

    document.querySelectorAll('[data-reveal]').forEach(card => observer.observe(card));
  }

  // -------------------------------------------------------------
  // LIQUID CHROME SINGLE-LINE DIAGRAM (SCHEMATIC)
  // -------------------------------------------------------------
  function initializeSchematic(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const {width, height} = canvas;
    const ground = {x: 618, y: 294};

    let drawingFrame = 0;
    let previous = -1;
    let previousSpark = false;
    let lastTick = 0;
    let sparked = false;
    let sparkStart = -Infinity;

    const stage = (progress, start, span) => cap((progress - start) / span);

    function box(x, y, w, h, progress) {
      trace(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], progress);
    }

    function draw(progress, spark) {
      ctx.fillStyle = '#17191e';
      ctx.fillRect(0, 0, width, height);

      // Fine titanium brushed graticule
      ctx.strokeStyle = 'rgba(215, 230, 245, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 24) trace(ctx, [[x, 0], [x, height]], 1);
      for (let y = 0; y < height; y += 24) trace(ctx, [[0, y], [width, y]], 1);

      // Main Incomer Box (Liquid Chrome)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
      ctx.shadowBlur = 6;
      box(287, 89, 146, 61, stage(progress, 0, 0.22));
      ctx.shadowBlur = 0;

      // Incomer Feed Line
      traceChrome(ctx, [[360, 150], [360, 215]], stage(progress, 0.18, 0.16));

      // Main Busbar in Liquid Chrome
      const bus = stage(progress, 0.32, 0.24);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 8;
      trace(ctx, [[360, 215], [102, 215]], bus);
      trace(ctx, [[360, 215], [ground.x, 215]], bus);
      ctx.shadowBlur = 0;

      // Typography
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '600 15px monospace';
      ctx.globalAlpha = stage(progress, 0.1, 0.11);
      ctx.fillText('MAIN BOARD', 360, 126);
      ctx.globalAlpha = 1;

      // Distribution Branches
      ['SUB-BOARD', 'LAB LOADS', 'UPS', 'EARTHING'].forEach((label, index) => {
        const x = 102 + index * 172;
        const branch = stage(progress, 0.53 + index * 0.045, 0.33);
        if (!branch) return;

        // Chrome Junction Node
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.fillRect(x - 3.5, 211.5, 7, 7);
        ctx.shadowBlur = 0;

        // Branch Line
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.8;
        traceChrome(ctx, [[x, 215], [x, 275]], stage(branch, 0, 0.31));

        // Sub Box
        box(x - 24, 275, 48, 38, stage(branch, 0.25, 0.50));

        // Contact symbol
        trace(ctx, [[x - 8, 303], [x + 8, 285]], stage(branch, 0.63, 0.23));
        trace(ctx, [[x, 312], [x, 339]], stage(branch, 0.75, 0.25));

        // Labels
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '500 13px monospace';
        ctx.globalAlpha = stage(branch, 0.80, 0.2);
        ctx.fillText(label, x, 367);
        ctx.globalAlpha = 1;
      });

      // Bottom Legend
      ctx.textAlign = 'left';
      ctx.fillStyle = '#828e9c';
      ctx.font = '12px monospace';
      ctx.fillText('ILLUSTRATIVE SINGLE-LINE DIAGRAM // CAD REV 3.2', 34, 431);

      // Arc spark at earthing pit
      drawSpark(ctx, ground.x, ground.y, spark, 1.15);
    }

    let inView = true;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) schedule();
      }, { rootMargin: '120px 0px' });
      observer.observe(canvas);
    }

    function update(time) {
      drawingFrame = 0;
      if (!inView && previous === 1 && !previousSpark) return;
      const view = canvas.getBoundingClientRect();
      const start = innerHeight * 0.97;
      const finish = Math.min(innerHeight * 0.42, start - view.height * 0.9);
      const target = reduced.matches ? 1 : cap((start - view.top) / (start - finish));
      const visible = view.bottom > 0 && view.top < innerHeight;
      const maxStep = Math.min(time - lastTick, 34) / 1050;
      const from = Math.max(previous, 0);
      const remaining = target - from;
      const progress = reduced.matches || !visible || Math.abs(remaining) <= maxStep
        ? target
        : from + Math.sign(remaining) * maxStep;

      lastTick = time;
      if (target < 0.72 || reduced.matches) {
        sparked = false;
        sparkStart = -Infinity;
      }
      if (progress === 1 && !sparked && !reduced.matches && visible) {
        sparked = true;
        sparkStart = time;
      }

      const spark = (time - sparkStart) / 600;
      if (progress !== previous || spark <= 1 || previousSpark) draw(progress, spark);
      previous = progress;
      previousSpark = spark < 1;
      if (previousSpark || (inView && progress !== target)) schedule();
    }

    function schedule() {
      if (!inView && previous === 1 && !previousSpark) return;
      if (!drawingFrame) drawingFrame = requestAnimationFrame(update);
    }

    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduced.addEventListener('change', schedule);
  }

  // -------------------------------------------------------------
  // RESUME DROPDOWN INTERACTION
  // -------------------------------------------------------------
  const resumeWrap = document.getElementById('resume-dropdown-wrap');
  const resumeBtn = document.getElementById('hero-resume-btn');
  const resumeMenu = document.getElementById('resume-menu');

  if (resumeWrap && resumeBtn && resumeMenu) {
    function toggleResumeMenu(open) {
      const willOpen = typeof open === 'boolean' ? open : !resumeWrap.classList.contains('is-open');
      resumeWrap.classList.toggle('is-open', willOpen);
      resumeBtn.setAttribute('aria-expanded', String(willOpen));
    }

    resumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleResumeMenu();
    });

    resumeMenu.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        toggleResumeMenu(false);
      }
    });

    document.addEventListener('click', (e) => {
      if (!resumeWrap.contains(e.target)) {
        toggleResumeMenu(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleResumeMenu(false);
        resumeBtn.focus();
      }
    });
  }
})();
