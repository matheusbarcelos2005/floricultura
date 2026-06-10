(function () {
  'use strict';

  let currentRaf = null;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Replicates the mouth position calculation from updateVisualizer()
  // so the animation starts exactly at the vase opening.
  function getMouthPosition(canvas) {
    const container  = document.getElementById('canvas-container');
    const renderZone = document.getElementById('flowers-render-zone');
    const baseZone   = document.getElementById('base-render-zone');
    if (!container || !renderZone || !baseZone) return null;

    const containerRect = container.getBoundingClientRect();
    canvas.width  = Math.round(containerRect.width);
    canvas.height = Math.round(containerRect.height);

    const renderRect = renderZone.getBoundingClientRect();
    let centerX     = renderRect.width / 2;
    let VASE_OPEN_Y = (configurador.base && configurador.base.aberturaY) || 180;

    const img = baseZone.querySelector('img');
    if (img && img.complete && img.naturalWidth > 0) {
      const imgRect             = img.getBoundingClientRect();
      const imgBottomFromRender = Math.round(renderRect.bottom - imgRect.bottom);
      const imgRenderedHeight   = Math.round(imgRect.height);
      const imgRenderedWidth    = Math.round(imgRect.width);
      const imgLeftFromRender   = Math.round(imgRect.left - renderRect.left);

      if (imgRenderedHeight > 20) {
        if (configurador.base && configurador.base.mouthYPercent) {
          VASE_OPEN_Y = Math.round(imgBottomFromRender + imgRenderedHeight * configurador.base.mouthYPercent);
        } else {
          const depth = configurador.base && configurador.base.tipo === 'Embalagem' ? 40 : 30;
          VASE_OPEN_Y = Math.round(imgBottomFromRender + imgRenderedHeight - depth);
        }
        if (configurador.base && configurador.base.mouthXPercent) {
          centerX = Math.round(imgLeftFromRender + imgRenderedWidth * configurador.base.mouthXPercent);
        }
      }
    }

    // Convert from render-zone-bottom-relative to canvas-top-left-relative
    const rx = renderRect.left - containerRect.left;
    const ry = renderRect.top  - containerRect.top;
    return {
      x: rx + centerX,
      y: ry + renderRect.height - VASE_OPEN_Y
    };
  }

  function runAnimation(petalColor, mouthX, mouthY, canvas) {
    const ctx      = canvas.getContext('2d');
    const DURATION = 1800;
    const stemH    = Math.min(105, mouthY * 0.65);
    const flowerY  = mouthY - stemH;

    // Random sparkle directions seeded once per animation
    const sparkles = Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2 + (Math.random() * 0.4 - 0.2),
      speed: 26 + Math.random() * 16
    }));

    const startTime = performance.now();

    function frame(now) {
      const t         = Math.min((now - startTime) / DURATION, 1);
      const fadeAlpha = t > 0.68 ? Math.max(0, 1 - (t - 0.68) / 0.32) : 1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // — STEM (0 → 0.28) ——————————————————————————————————
      const stemT = easeOut(Math.min(t / 0.28, 1));
      ctx.beginPath();
      ctx.moveTo(mouthX, mouthY);
      ctx.lineTo(mouthX, mouthY - stemH * stemT);
      ctx.strokeStyle = '#43a047';
      ctx.lineWidth   = 4;
      ctx.lineCap     = 'round';
      ctx.globalAlpha = fadeAlpha;
      ctx.stroke();

      // — LEAVES (0.22 → 0.55) ——————————————————————————————
      const leafT = easeOut(Math.max(0, Math.min((t - 0.22) / 0.33, 1)));
      if (leafT > 0) {
        const ly = mouthY - stemH * 0.44;
        ctx.fillStyle   = '#66bb6a';
        ctx.globalAlpha = leafT * fadeAlpha;

        ctx.save();
        ctx.translate(mouthX, ly);
        ctx.rotate(-0.9);
        ctx.beginPath();
        ctx.ellipse(-11 * leafT, 0, 15 * leafT, 6 * leafT, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(mouthX, ly - 11);
        ctx.rotate(0.9);
        ctx.beginPath();
        ctx.ellipse(11 * leafT, 0, 15 * leafT, 6 * leafT, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // — PETALS (0.36 → 0.80) ——————————————————————————————
      const bloomT = easeInOut(Math.max(0, Math.min((t - 0.36) / 0.44, 1)));
      if (bloomT > 0) {
        const maxPetal  = 26;
        const pLen      = maxPetal * bloomT;
        const petalCount = 6;

        ctx.globalAlpha = bloomT * fadeAlpha;
        ctx.fillStyle   = petalColor;

        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.ellipse(
            mouthX  + Math.cos(angle) * pLen * 0.52,
            flowerY + Math.sin(angle) * pLen * 0.52,
            pLen * 0.58, pLen * 0.28,
            angle, 0, Math.PI * 2
          );
          ctx.fill();
        }

        // Golden center
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(mouthX, flowerY, 7.5 * bloomT, 0, Math.PI * 2);
        ctx.fill();
      }

      // — SPARKLES (0.48 → 0.82) ————————————————————————————
      const sparkT = Math.max(0, Math.min((t - 0.48) / 0.34, 1));
      if (sparkT > 0 && sparkT < 1) {
        sparkles.forEach((s, i) => {
          const dist = s.speed * sparkT;
          ctx.globalAlpha = (1 - sparkT) * fadeAlpha;
          ctx.fillStyle   = i % 2 === 0 ? petalColor : '#ffd54f';
          ctx.beginPath();
          ctx.arc(
            mouthX  + Math.cos(s.angle) * dist,
            flowerY + Math.sin(s.angle) * dist,
            2.5 * (1 - sparkT * 0.4), 0, Math.PI * 2
          );
          ctx.fill();
        });
      }

      ctx.globalAlpha = 1;

      if (t < 1) {
        currentRaf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        currentRaf = null;
      }
    }

    currentRaf = requestAnimationFrame(frame);
  }

  window.triggerFlowerAnimation = function (florObj) {
    if (currentRaf !== null) {
      cancelAnimationFrame(currentRaf);
      currentRaf = null;
    }

    const canvas = document.getElementById('flower-anim-canvas');
    if (!canvas) return;

    const pos = getMouthPosition(canvas);
    if (!pos) return;

    const color = (florObj && florObj.cor) ? florObj.cor : '#e91e63';
    runAnimation(color, pos.x, pos.y, canvas);
  };
})();
