(function () {
  'use strict';

  const TIPS = [''];

 // replace with — reads localStorage directly, same source of truth as main.js:
// Replace entire getLogoImgs() with:
function getLogoImgs() {
  // Reads both possible theme keys (landing page vs dashboard)
  const theme = localStorage.getItem('kashly_theme')   // dashboard key
             || localStorage.getItem('kashly_admin_theme') 
             || localStorage.getItem('kashly_banker_theme')    
             || 'dark';
  return theme === 'light'
    ? { bar: 'assets/loader/1.png',       curve: 'assets/loader/2.png' }
    : { bar: 'assets/loader/1-light.png', curve: 'assets/loader/2-light.png' };
}

  const CSS = `
    #kl-loader {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #kl-loader .kl-bg {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }

    [data-theme="light"] #kl-loader .kl-bg {
      background: rgba(255, 255, 255, 0.60);
    }

    #kl-loader .kl-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    #kl-loader .loader {
      position: relative;
      width: 124px;
      height: 128px;
    }

    #kl-loader .bar,
    #kl-loader .curve {
      position: absolute;
      top: 0;
      background-repeat: no-repeat;
      background-size: contain;
      will-change: transform, opacity;
    }

    #kl-loader .bar {
      left: 0;
      width: 37px;
      height: 124px;
      background-position: left center;
      opacity: 0;
      animation: kl-show-bar 0.4s forwards;
    }

    #kl-loader .curve {
      left: 22px;
      width: 92px;
      height: 124px;
      background-position: left center;
      opacity: 0;
      transform: translateX(-25px);
      animation: kl-slide-in 0.4s 0.15s forwards;
    }

    @keyframes kl-show-bar {
      to { opacity: 1; }
    }

    @keyframes kl-slide-in {
      to { transform: translateX(0); opacity: 1; }
    }

    #kl-loader .progress-track {
      width: 114px;
    margin-left: -13px;
      height: 3px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      overflow: hidden;
    }

    [data-theme="light"] #kl-loader .progress-track {
      background: rgba(0, 0, 0, 0.12);
    }

    #kl-loader .progress-fill {
      height: 100%;
      width: 0%;
      border-radius: 4px;
      background: #D4AF37;
      transition: width 0.12s linear;
    }

    #kl-loader .kl-tip {
      color: rgba(255, 255, 255, 0.55);
      font-size: 12px;
      font-family: Inter, sans-serif;
      text-align: center;
      max-width: 220px;
      line-height: 1.6;
      margin: 0;
    }

    [data-theme="light"] #kl-loader .kl-tip {
      color: rgba(0, 0, 0, 0.45);
    }
  `;

  function inject() {
    if (document.getElementById('kl-loader')) return;

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    const el  = document.createElement('div');
    el.id     = 'kl-loader';
    el.innerHTML = `
      <div class="kl-bg"></div>
      <div class="kl-card">
        <div class="loader">
          <div class="bar"></div>
          <div class="curve"></div>
        </div>
        <div class="progress-track">
          <div class="progress-fill"></div>
        </div>
        <p class="kl-tip"> ${tip}</p>
      </div>`;
    document.body.prepend(el);

    const bar   = el.querySelector('.bar');
    const curve = el.querySelector('.curve');
    const fill  = el.querySelector('.progress-fill');

    // ── Apply correct images for current theme ──
    function applyImages() {
      const imgs = getLogoImgs();
      bar.style.backgroundImage   = `url('${imgs.bar}')`;
      curve.style.backgroundImage = `url('${imgs.curve}')`;
    }

    // ── Logo loop — only bar+curve repeat ──
    let loopId;
    function runLoop() {
      // Reset
      bar.style.animation   = 'none';
      curve.style.animation = 'none';
      // Re-check theme each loop (handles mid-load theme toggle)
      applyImages();
      // Force reflow
      void bar.offsetWidth;
      // Restart animations
      bar.style.animation   = 'kl-show-bar 0.4s forwards';
      curve.style.animation = 'kl-slide-in 0.4s 0.15s forwards';
      // Next cycle after animation + hold
      loopId = setTimeout(runLoop, 650);
    }
    runLoop();

    // ── Progress crawl ──
    let w = 0;
    const iv = setInterval(() => {
      w = Math.min(w + Math.random() * 8 + 2, 90);
      fill.style.width = w + '%';
    }, 120);

    // ── Hide ──
    function hide() {
      clearTimeout(loopId);
      clearInterval(iv);
      fill.style.width = '100%';
      setTimeout(() => {
        el.style.opacity    = '0';
        el.style.transition = 'opacity 0.4s ease';
        setTimeout(() => el.remove(), 420);
      }, 300);
    }

    let loaded = false, elapsed = false;
    const tryHide = () => { if (loaded && elapsed) hide(); };
    setTimeout(() => { elapsed = true; tryHide(); }, 2000);
    window.addEventListener('load', () => { loaded = true; tryHide(); }, { once: true });
    setTimeout(hide, 3000); // hard cap
  }

  if (document.body) {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject, { once: true });
  }
})();