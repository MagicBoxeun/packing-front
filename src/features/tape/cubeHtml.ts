import { BoxVariant, TapeData } from '../../types';

export const MAX_TAPES = 50;

const CUBE_FACE_TEMPLATES: Record<'plain' | 'label', string> = {
  plain: '',
  label: `<div class="facelabel"><div class="lbl-line"></div><div class="lbl-line short"></div><div class="lbl-line short"></div></div>`,
};

export function cubeHtml(variant: BoxVariant, soundDataUri: string): string {
  const hasLabel = variant === 'label';
  const labelPatch = hasLabel ? CUBE_FACE_TEMPLATES.label : '';
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; height: 100%; width: 100%;
    background: transparent; overflow: hidden;
    -webkit-user-select: none; user-select: none;
    -webkit-touch-callout: none;
  }
  #root { position: absolute; inset: 0; display: flex; flex-direction: column; touch-action: none; }
  #stage {
    height: 462px; flex: 0 0 auto; position: relative;
    display: flex; align-items: center; justify-content: center;
    perspective: 720px; perspective-origin: 50% 48%;
    cursor: grab;
  }
  #world { transform: scale(1.15); transform-style: preserve-3d; }
  #world.press { animation: bounce 0.26s ease; }
  @keyframes bounce { 0% { transform: scale(1.15); } 45% { transform: scale(1.07); } 100% { transform: scale(1.15); } }
  #scene {
    position: relative; width: 150px; height: 150px;
    transform-style: preserve-3d; will-change: transform;
  }
  .face {
    position: absolute; width: 150px; height: 150px;
    display: flex; align-items: center; justify-content: center;
    border: 0;
    box-shadow: none;
    backface-visibility: hidden;
    overflow: hidden;
  }
  .f-front  { background: #d9a33b; transform: translateZ(75px); }
  .f-back   { background: #c79032; transform: rotateY(180deg) translateZ(75px); }
  .f-right  { background: #ffc55e; transform: rotateY(90deg) translateZ(75px); }
  .f-left   { background: #d9a33b; transform: rotateY(-90deg) translateZ(75px); }
  .f-top    { background: #ffd381; transform: rotateX(90deg) translateZ(75px); }
  .f-bottom { background: #9b7028; transform: rotateX(-90deg) translateZ(75px); }
  .face::before, .face::after { content: ''; position: absolute; display: none; }
  .f-top::before {
    display: block; left: 50%; top: -6px; bottom: -6px; width: 2px;
    background: rgba(137,92,26,0.45); transform: translateX(-1px);
  }
  .facelabel {
    position: absolute; right: 10px; bottom: 10px; width: 58px; height: 40px;
    background: #f5f1e6; border: 1px solid #5a4a28;
    display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 5px 6px;
  }
  .lbl-line { height: 3px; background: #2c2c2c; width: 100%; }
  .lbl-line.short { width: 58%; }
  .tape {
    position: absolute;
    background: rgba(47, 95, 224, 0.78); border: 0; border-radius: 0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.18);
    z-index: 5;
  }
  .tape::after {
    content: ''; position: absolute; left: 3px; right: 3px; top: 2px; height: 2px;
    background: rgba(255,255,255,0.28); border-radius: 1px;
  }
  #dispenser {
    position: relative; height: 80px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  #roll { display: none; }
  #roll::after {
    content: ''; position: absolute; top: 3px; left: 50%;
    width: 4px; height: 4px; border-radius: 50%;
    background: rgba(255,255,255,0.3);
    transform: translateX(-50%);
  }
  #tab { display: none; }
  #grab { display: none; }
  #roller {
    position: absolute; display: none; z-index: 30;
    width: 52px; height: 52px; border-radius: 50%;
    background: #2F5FE0;
    border: 3px solid rgba(255,255,255,0.92);
    box-shadow: 0 2px 10px rgba(0,0,0,0.45);
    pointer-events: auto;
    cursor: pointer;
  }
  #roller.show {
    display: block;
    animation: rollerHint 1.8s ease-in-out infinite;
  }
  @keyframes rollerHint {
    0%, 100% { box-shadow: 0 2px 10px rgba(0,0,0,0.45), 0 0 0 0 rgba(47,95,224,0.5); }
    50% { box-shadow: 0 2px 10px rgba(0,0,0,0.45), 0 0 0 14px rgba(47,95,224,0); }
  }
  #roller::after {
    content: ''; position: absolute; top: 5px; left: 50%;
    width: 6px; height: 6px; border-radius: 50%;
    background: #fff;
    transform: translateX(-50%);
  }
  .tape.live { opacity: 0.85; }
  .hint {
    position: absolute; left: 0; right: 0; bottom: 6px; text-align: center;
    color: rgba(255,255,255,0.4); font-size: 11px;
    pointer-events: none;
  }
</style>
</head>
<body>
  <div id="root">
    <div id="stage">
      <div id="world">
        <div id="scene">
          <div class="face f-front" data-face="front">${labelPatch}</div>
          <div class="face f-back" data-face="back"></div>
          <div class="face f-right" data-face="right"></div>
          <div class="face f-left" data-face="left"></div>
          <div class="face f-top" data-face="top"></div>
          <div class="face f-bottom" data-face="bottom"></div>
        </div>
      </div>
    </div>
    <div id="dispenser">
      <div id="roll"></div>
      <div id="tab"></div>
      <div id="grab"></div>
      <div class="hint">테이프를 길게 누르고 있으면 계속 포장돼요</div>
    </div>
    <div id="roller"></div>
  </div>
<script>
(function () {
  var SOUND_URI = "${soundDataUri}";
  var tapeAudio = SOUND_URI ? new Audio(SOUND_URI) : null;
  function playTapeSound() {
    if (tapeAudio) {
      tapeAudio.currentTime = 0;
      var p = tapeAudio.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  var MAX_WRAPS = 30, wrapCount = 0;
  var MAX = MAX_WRAPS * 4 + 8, SIDE = 150, HALF = SIDE / 2, TAPE_W = 22;
  var ROLL_R = 19;
  var scene = document.getElementById('scene');
  var world = document.getElementById('world');
  var stage = document.getElementById('stage');
  var roller = document.getElementById('roller');
  var dispenser = document.getElementById('dispenser');
  var faces = {};
  Array.prototype.forEach.call(document.querySelectorAll('.face'), function (f) {
    faces[f.dataset.face] = f;
  });
  var rotX = -16, rotY = -28, total = 0;
  var mode = 'idle';

  function render() {
    scene.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
  }
  render();

  var tapes = [];

  function notify() {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ count: total, tapes: tapes }));
    }
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function sceneCenter() {
    var r = scene.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function frontFace() {
    var N = {
      front: [0, 0, 1], back: [0, 0, -1],
      right: [1, 0, 0], left: [-1, 0, 0],
      top: [0, -1, 0], bottom: [0, 1, 0]
    };
    var cy = Math.cos(rotY * Math.PI / 180), sy = Math.sin(rotY * Math.PI / 180);
    var cx = Math.cos(rotX * Math.PI / 180), sx = Math.sin(rotX * Math.PI / 180);
    var best = 'front', bz = -2;
    Object.keys(N).forEach(function (k) {
      var x = N[k][0], y = N[k][1], z = N[k][2];
      var z1 = -x * sy + z * cy;
      var z2 = y * sx + z1 * cx;
      if (z2 > bz) { bz = z2; best = k; }
    });
    return best;
  }

  function toLocal(sdx, sdy) {
    var rxd = rotX * Math.PI / 180, ryd = rotY * Math.PI / 180;
    var cx = Math.cos(rxd), sx = Math.sin(rxd), cy = Math.cos(ryd), sy = Math.sin(ryd);
    return { lx: sdx * cy + sdy * sx * sy, ly: sdy * cx };
  }

  function pulse() {
    world.classList.remove('press');
    void world.offsetWidth;
    world.classList.add('press');
  }

  function placeTapeEl(el, faceName, x1, y1, x2, y2) {
    var midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.hypot(dx, dy);
    var ang = Math.atan2(dy, dx) * 180 / Math.PI;
    el.style.width = len + 'px';
    el.style.height = TAPE_W + 'px';
    el.style.left = (HALF + midX - len / 2) + 'px';
    el.style.top = (HALF + midY - TAPE_W / 2) + 'px';
    el.style.transform = 'rotate(' + ang + 'deg)';
    el.style.transformOrigin = 'center center';
    if (el.parentNode !== faces[faceName]) {
      faces[faceName].appendChild(el);
    }
  }

  // place a single full-edge strip on one face (no sound/pulse — wrap handles that)
  function commitStrip(faceName, x1, y1, x2, y2) {
    if (total >= MAX) return false;
    var t = document.createElement('div');
    t.className = 'tape';
    placeTapeEl(t, faceName, x1, y1, x2, y2);
    tapes.push({ face: faceName, x1: x1, y1: y1, x2: x2, y2: y2 });
    total++;
    return true;
  }

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function rollerRestPos() {
    var r = dispenser.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  var sessionDir = 1;
  var lastStripRotY = 0;
  var STRIDE = 26;
  var EDGE = HALF;               // span the full face so strips meet at the box edges
  var LANE_MAX = HALF - TAPE_W / 2;
  function jit(a) { return (Math.random() * 2 - 1) * a; }

  // A "wrap" is one continuous run of tape across several faces so the tape
  // connects over the box edges and always lands on the top face. Lane is
  // RANDOM across the whole face (not a fixed grid) and each wrap gets a slight
  // tilt/slope so it looks hand-applied, not mechanically static.
  function placeWrap() {
    if (wrapCount >= MAX_WRAPS || total >= MAX) return;
    wrapCount++;
    var lane = clamp(jit(LANE_MAX * 1.08), -LANE_MAX, LANE_MAX);
    var r = Math.random();
    if (r < 0.4) {
      // longitudinal over the top seam, slight hand tilt: front -> top -> back
      var t = jit(9);
      commitStrip('front', lane - t, -EDGE, lane + t, EDGE);
      commitStrip('top', lane - t, -EDGE, lane + t, EDGE);
      commitStrip('back', -lane + t, -EDGE, -lane - t, EDGE);
    } else if (r < 0.68) {
      // girth belt around the four sides, slight slope
      var s = jit(8);
      commitStrip('front', -EDGE, lane - s, EDGE, lane + s);
      commitStrip('right', -EDGE, lane - s, EDGE, lane + s);
      commitStrip('back', -EDGE, lane - s, EDGE, lane + s);
      commitStrip('left', -EDGE, lane - s, EDGE, lane + s);
    } else {
      // diagonal spiral around the four sides (ends meet at each vertical edge)
      var dir = Math.random() < 0.5 ? 1 : -1;
      var d = dir * (12 + Math.random() * 10);
      var y = lane * 0.3 - 1.5 * d;
      var order = ['front', 'right', 'back', 'left'];
      for (var i = 0; i < 4; i++) {
        commitStrip(order[i], -EDGE, y, EDGE, y + d);
        y += d;
      }
    }
    notify();
    pulse();
    playTapeSound();
  }

  var holding = false;
  var userRotating = false;
  var holdTimer = null;

  function positionRoller() {
    var p = rollerRestPos();
    roller.classList.add('show');
    roller.style.left = p.x + 'px';
    roller.style.top = p.y + 'px';
    roller.style.transform = 'translate(-50%, -50%)';
  }

  // Spin the cube a bit (smooth) so each wrap lands on a fresh orientation.
  function spinABit() {
    var targetY = rotY + sessionDir * (70 + Math.random() * 40);
    var targetX = clamp(-18 + (Math.random() * 2 - 1) * 12, -42, 18);
    var startY = rotY, startX = rotX;
    var DUR = 240, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var t = Math.min((ts - t0) / DUR, 1);
      var e = easeInOut(t);
      rotY = startY + (targetY - startY) * e;
      rotX = startX + (targetX - startX) * e;
      render();
      if (t < 1 && holding) { requestAnimationFrame(step); }
    }
    requestAnimationFrame(step);
  }

  // One "tick" = one wrap. Driven by a timer (not RAF recursion) so it keeps
  // going reliably for the whole hold, up to MAX_WRAPS (30) packings.
  function tick() {
    if (!holding) return;
    if (wrapCount >= MAX_WRAPS) { stopHold(); return; }
    spinABit();
    placeWrap();
  }

  function startHold(e) {
    if (e) e.preventDefault();
    if (holding || wrapCount >= MAX_WRAPS) return;
    holding = true;
    sessionDir = Math.random() < 0.5 ? 1 : -1;
    roller.style.transform = 'translate(-50%, -50%) scale(0.85)';
    tick();
    if (holdTimer) { clearInterval(holdTimer); }
    holdTimer = setInterval(tick, 300);
  }

  function stopHold() {
    holding = false;
    if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
    roller.style.transform = 'translate(-50%, -50%)';
  }

  roller.addEventListener('mousedown', startHold);
  roller.addEventListener('touchstart', startHold, { passive: false });
  window.addEventListener('mouseup', stopHold);
  window.addEventListener('touchend', stopHold);
  window.addEventListener('touchcancel', stopHold);

  positionRoller();
  window.addEventListener('resize', positionRoller);

  function pOf(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }
  var dragStart = null;
  function dragDown(e) {
    var p = pOf(e);
    dragStart = { x: p.x, y: p.y, rx: rotX, ry: rotY };
    userRotating = true;
    e.preventDefault();
  }
  function dragMove(e) {
    if (!dragStart) return;
    var p = pOf(e);
    rotY = dragStart.ry + (p.x - dragStart.x) * 0.5;
    rotX = clamp(dragStart.rx + (p.y - dragStart.y) * 0.5, -80, 80);
    render();
    e.preventDefault();
  }
  function dragUp() {
    dragStart = null;
    userRotating = false;
  }
  stage.addEventListener('mousedown', dragDown);
  stage.addEventListener('touchstart', dragDown, { passive: false });
  window.addEventListener('mousemove', dragMove);
  window.addEventListener('touchmove', dragMove, { passive: false });
  window.addEventListener('mouseup', dragUp);
  window.addEventListener('touchend', dragUp);
  window.addEventListener('touchcancel', dragUp);
})();
</script>
</body>
</html>`;
}

export function displayCubeHtml(
  variant: BoxVariant,
  tapes: TapeData[],
  stamp?: 'confession' | 'ok',
): string {
  const hasLabel = variant === 'label';
  const labelPatch = hasLabel ? CUBE_FACE_TEMPLATES.label : '';
  const tapesJson = JSON.stringify(tapes);
  const spinScript = stamp
    ? ''
    : `function spin(ts) {
    rotY += 0.35;
    if (rotY >= 360) rotY -= 360;
    if (rotY <= -360) rotY += 360;
    rotX = -16 + Math.sin(ts * 0.0005) * 5;
    render();
    requestAnimationFrame(spin);
  }
  requestAnimationFrame(spin);`;
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; height: 100%; width: 100%;
    background: transparent; overflow: hidden;
    -webkit-user-select: none; user-select: none;
    -webkit-touch-callout: none;
  }
  #stage {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    perspective: 720px; perspective-origin: 50% 48%;
  }
  #world { transform: scale(1.05); transform-style: preserve-3d; }
  #scene {
    position: relative; width: 150px; height: 150px;
    transform-style: preserve-3d; will-change: transform;
  }
  .face {
    position: absolute; width: 150px; height: 150px;
    display: flex; align-items: center; justify-content: center;
    border: 0; box-shadow: none; backface-visibility: hidden; overflow: hidden;
  }
  .f-front  { background: #d9a33b; transform: translateZ(75px); }
  .f-back   { background: #c79032; transform: rotateY(180deg) translateZ(75px); }
  .f-right  { background: #ffc55e; transform: rotateY(90deg) translateZ(75px); }
  .f-left   { background: #d9a33b; transform: rotateY(-90deg) translateZ(75px); }
  .f-top    { background: #ffd381; transform: rotateX(90deg) translateZ(75px); }
  .f-bottom { background: #9b7028; transform: rotateX(-90deg) translateZ(75px); }
  .f-top::before {
    content: ''; position: absolute; display: block;
    left: 50%; top: -6px; bottom: -6px; width: 2px;
    background: rgba(137,92,26,0.45); transform: translateX(-1px);
  }
  .facelabel {
    position: absolute; right: 10px; bottom: 10px; width: 58px; height: 40px;
    background: #f5f1e6; border: 1px solid #5a4a28;
    display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 5px 6px;
  }
  .lbl-line { height: 3px; background: #2c2c2c; width: 100%; }
  .lbl-line.short { width: 58%; }
  .tape {
    position: absolute;
    background: rgba(47, 95, 224, 0.78); border: 0; border-radius: 0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.18);
    z-index: 5;
  }
  .tape::after {
    content: ''; position: absolute; left: 3px; right: 3px; top: 2px; height: 2px;
    background: rgba(255,255,255,0.28); border-radius: 1px;
  }
</style>
</head>
<body>
  <div id="stage">
    <div id="world">
      <div id="scene">
        <div class="face f-front" data-face="front">${labelPatch}</div>
        <div class="face f-back" data-face="back"></div>
        <div class="face f-right" data-face="right"></div>
        <div class="face f-left" data-face="left"></div>
        <div class="face f-top" data-face="top"></div>
        <div class="face f-bottom" data-face="bottom"></div>
      </div>
    </div>
  </div>
<script>
(function () {
  var SIDE = 150, HALF = SIDE / 2, TAPE_W = 22;
  var TAPES = ${tapesJson};
  var scene = document.getElementById('scene');
  var faces = {};
  Array.prototype.forEach.call(document.querySelectorAll('.face'), function (f) {
    faces[f.dataset.face] = f;
  });
  function placeTapeEl(el, faceName, x1, y1, x2, y2) {
    var midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.hypot(dx, dy);
    var ang = Math.atan2(dy, dx) * 180 / Math.PI;
    el.style.width = len + 'px';
    el.style.height = TAPE_W + 'px';
    el.style.left = (HALF + midX - len / 2) + 'px';
    el.style.top = (HALF + midY - TAPE_W / 2) + 'px';
    el.style.transform = 'rotate(' + ang + 'deg)';
    el.style.transformOrigin = 'center center';
    faces[faceName].appendChild(el);
  }
  TAPES.forEach(function (t) {
    var el = document.createElement('div');
    el.className = 'tape';
    placeTapeEl(el, t.face, t.x1, t.y1, t.x2, t.y2);
  });
  var rotX = -16, rotY = -28;
  function render() {
    scene.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
  }
  render();
  ${spinScript}
})();
</script>
</body>
</html>`;
}
