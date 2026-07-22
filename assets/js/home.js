/* ---------- seamless marquees ----------
   Clones the group until the track is at least twice the viewport width,
   then shifts by exactly one group so the loop never shows a gap or a jump. */
(function(){
  var tracks = [].slice.call(document.querySelectorAll('[data-marquee]'));
  if(!tracks.length) return;

  function build(track){
    var group = track.querySelector(':scope > *');
    if(!group) return;
    if(!track.dataset.html) track.dataset.html = group.outerHTML;
    track.innerHTML = track.dataset.html;
    group = track.firstElementChild;

    var groupW = group.getBoundingClientRect().width;
    if(!groupW) return;
    var need = (track.parentElement.clientWidth || window.innerWidth) * 2;
    var copies = Math.max(2, Math.ceil(need / groupW));
    for(var i = 1; i < copies; i++) track.appendChild(group.cloneNode(true));

    var speed = parseFloat(track.getAttribute('data-speed')) || 60; /* px per second */
    track.style.setProperty('--shift', (100 / copies) + '%');
    track.style.setProperty('--dur', (groupW / speed) + 's');
  }

  function buildAll(){ tracks.forEach(build); }
  buildAll();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(buildAll);

  var t;
  window.addEventListener('resize', function(){
    clearTimeout(t);
    t = setTimeout(buildAll, 250);
  });
})();

/* ---------- hero product slider ---------- */
(function(){
  var slider = document.getElementById('hslider');
  if(!slider) return;
  var slides = [].slice.call(slider.querySelectorAll('.hslide'));
  var dotsBox = document.getElementById('hdots');
  var count = document.getElementById('hcount');
  var i = 0, timer = null, DELAY = 6000;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  slides.forEach(function(_, n){
    var b = document.createElement('button');
    b.className = 'hdot' + (n === 0 ? ' is-active' : '');
    b.type = 'button';
    b.setAttribute('aria-label', 'Go to slide ' + (n + 1));
    b.addEventListener('click', function(){ go(n); restart(); });
    dotsBox.appendChild(b);
  });
  var dots = [].slice.call(dotsBox.children);

  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function go(n){
    i = (n + slides.length) % slides.length;
    slides.forEach(function(s, k){ s.classList.toggle('is-active', k === i); });
    dots.forEach(function(d, k){ d.classList.toggle('is-active', k === i); });
    count.textContent = pad(i + 1) + ' / ' + pad(slides.length);
  }
  function next(){ go(i + 1); }
  function restart(){ if(reduce) return; clearInterval(timer); timer = setInterval(next, DELAY); }

  document.getElementById('hnext').addEventListener('click', function(){ next(); restart(); });
  document.getElementById('hprev').addEventListener('click', function(){ go(i - 1); restart(); });
  slider.addEventListener('mouseenter', function(){ clearInterval(timer); });
  slider.addEventListener('mouseleave', restart);
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ clearInterval(timer); } else { restart(); }
  });

  /* swipe on touch */
  var x0 = null;
  slider.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive:true});
  slider.addEventListener('touchend', function(e){
    if(x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if(Math.abs(dx) > 45){ dx < 0 ? next() : go(i - 1); restart(); }
    x0 = null;
  });

  go(0);
  restart();
})();

/* ---------- product carousel ---------- */
(function(){
  var track = document.getElementById('ptrack');
  if(!track) return;
  var prev = document.getElementById('cprev');
  var next = document.getElementById('cnext');
  var fill = document.getElementById('pbarfill');

  function step(){
    var card = track.querySelector('.pcard');
    if(!card) return track.clientWidth;
    var gap = parseFloat(getComputedStyle(track).columnGap || 24) || 24;
    return card.getBoundingClientRect().width + gap;
  }
  function update(){
    var max = track.scrollWidth - track.clientWidth;
    var ratio = max > 4 ? track.scrollLeft / max : 0;
    var visible = max > 4 ? Math.min(1, track.clientWidth / track.scrollWidth) : 1;
    fill.style.width = (visible * 100) + '%';
    fill.style.transform = 'translateX(' + (ratio * (100 / visible - 100)) + '%)';
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = track.scrollLeft >= max - 4;
  }
  prev.addEventListener('click', function(){ track.scrollBy({left: -step(), behavior: 'smooth'}); });
  next.addEventListener('click', function(){ track.scrollBy({left: step(), behavior: 'smooth'}); });
  track.addEventListener('scroll', function(){ window.requestAnimationFrame(update); }, {passive:true});
  window.addEventListener('resize', update);

  /* category filters */
  var filters = document.getElementById('cfilters');
  if(filters){
    filters.addEventListener('click', function(e){
      var btn = e.target.closest('.cf');
      if(!btn) return;
      var f = btn.getAttribute('data-f');
      [].forEach.call(filters.querySelectorAll('.cf'), function(b){ b.classList.toggle('is-active', b === btn); });
      [].forEach.call(track.querySelectorAll('.pcard'), function(card){
        card.hidden = !(f === 'all' || card.getAttribute('data-cat') === f);
      });
      track.scrollTo({left: 0, behavior: 'smooth'});
      update();
    });
  }

  update();
})();