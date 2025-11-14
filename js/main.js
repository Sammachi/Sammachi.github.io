// js/main.js — small interactions

// Smooth scroll for in-page anchors (if any)
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', function(e){
    e.preventDefault();
    const t = document.querySelector(this.getAttribute('href'));
    if(t) t.scrollIntoView({behavior:'smooth'});
  });
});

// Mobile navigation toggle
(function(){
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('siteNav');
  if(!toggle || !nav) return;
  toggle.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    // move focus into the nav for keyboard users
    if(open){
      const firstLink = nav.querySelector('a');
      if(firstLink) firstLink.focus();
    } else {
      toggle.focus();
    }
  });

  // Close nav on Escape
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && nav.classList.contains('open')){
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      toggle.focus();
    }
  });
})();
