document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // Navigation Logic
  const navItems = document.querySelectorAll('.nav-item');
  const viewSections = document.querySelectorAll('.view-section');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetView = item.getAttribute('data-view');
      if (!targetView) return;

      // Update Sidebar state
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Update Main View state
      viewSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetView) {
          section.classList.add('active');
          // Trigger any view-specific animations
          animateCharts(section);
        }
      });
    });
  });

  // Mock Chart Animation
  function animateCharts(section) {
    const bars = section.querySelectorAll('.bar');
    bars.forEach(bar => {
      const originalHeight = bar.style.height;
      bar.style.transition = 'none';
      bar.style.height = '0';
      
      setTimeout(() => {
        bar.style.transition = 'height 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        bar.style.height = originalHeight;
      }, 50);
    });
  }

  // Initial animation for the first view
  animateCharts(document.querySelector('.view-section.active'));

  // Handle Logo Glow based on position or time?
  // Let's just add a small pulse to the logo orb
  const logoOrb = document.querySelector('.logo-orb');
  if (logoOrb) {
    let brightness = 1;
    setInterval(() => {
      brightness = brightness === 1 ? 1.5 : 1;
      logoOrb.style.filter = `drop-shadow(0 0 ${10 * brightness}px rgba(139, 92, 246, 0.4))`;
    }, 2000);
  }
});
