(function () {
  function initParallax() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const bgElement = document.querySelector('.home .move img') || document.querySelector('.donate-bg-video');
    if (!bgElement) return;

    const overlayElement = document.querySelector('.home .overlay');

    bgElement.style.transformOrigin = 'center center';
    bgElement.style.willChange = 'transform';
    if (overlayElement) {
      overlayElement.style.willChange = 'transform';
    }

    const MAX_OFFSET_BG = 28;
    const MAX_OFFSET_OVERLAY = 8;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isRunning = false;

    function render() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      bgElement.style.transform = `scale(1.08) translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;

      if (overlayElement) {
        const overlayX = (-currentX * 0.3).toFixed(2);
        const overlayY = (-currentY * 0.3).toFixed(2);
        overlayElement.style.transform = `translate3d(${overlayX}px, ${overlayY}px, 0)`;
      }

      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        requestAnimationFrame(render);
      } else {
        isRunning = false;
      }
    }

    function onMouseMove(e) {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;

      targetX = -normX * MAX_OFFSET_BG;
      targetY = -normY * MAX_OFFSET_BG;

      if (!isRunning) {
        isRunning = true;
        requestAnimationFrame(render);
      }
    }

    function onMouseLeave() {
      targetX = 0;
      targetY = 0;
      if (!isRunning) {
        isRunning = true;
        requestAnimationFrame(render);
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParallax);
  } else {
    initParallax();
  }
})();
