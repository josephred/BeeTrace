// ApiGestion Landing Page Interactions

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    // Close mobile nav when clicking a link
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }

  // Actor Tabs Switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const actorContents = document.querySelectorAll('.actor-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetActor = btn.getAttribute('data-actor');

      // Update active tab button
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active content
      actorContents.forEach((content) => {
        content.classList.remove('active');
        if (content.id === `content-${targetActor}`) {
          content.classList.add('active');
        }
      });
    });
  });

  // FAQ Accordion
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach((item) => {
    const header = item.querySelector('.accordion-header');
    if (header) {
      header.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        // Close all items
        accordionItems.forEach((i) => i.classList.remove('active'));

        // Toggle current item
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    }
  });

  // Open first FAQ by default
  if (accordionItems.length > 0) {
    accordionItems[0].classList.add('active');
  }
});
