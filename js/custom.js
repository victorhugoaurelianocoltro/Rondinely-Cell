(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var nav = document.querySelector('.main-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });
  }

  function setupHeader() {
    var header = document.querySelector('.site-header');
    var progress = document.querySelector('.scroll-progress');
    function update() {
      var scrollable = document.documentElement.scrollHeight - window.innerHeight;
      var percent = scrollable > 0 ? (window.pageYOffset / scrollable) * 100 : 0;
      if (header) header.classList.toggle('scrolled', window.pageYOffset > 24);
      if (progress) progress.style.width = percent + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function setupReveal() {
    var items = document.querySelectorAll('.reveal');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries, current) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          current.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    items.forEach(function (item) { observer.observe(item); });
  }

  function setupTilt() {
    var device = document.querySelector('[data-tilt]');
    var wrap = document.querySelector('.hero-device-wrap');
    if (!device || !wrap) return;
    if ('IntersectionObserver' in window && wrap) {
      var visibilityObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          device.classList.toggle('is-offscreen', !entry.isIntersecting);
        });
      }, { threshold: 0.05 });
      visibilityObserver.observe(wrap);
    }
    if (reducedMotion || window.matchMedia('(pointer: coarse)').matches) return;
    wrap.addEventListener('pointermove', function (event) {
      var rect = wrap.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      device.style.setProperty('--mouse-x', x.toFixed(3));
      device.style.setProperty('--mouse-y', y.toFixed(3));
      wrap.style.setProperty('--orbit-x', (x * 18).toFixed(2) + 'px');
      wrap.style.setProperty('--orbit-y', (y * 12).toFixed(2) + 'px');
      wrap.style.setProperty('--orbit-x-two', (x * -11).toFixed(2) + 'px');
      wrap.style.setProperty('--orbit-y-two', (y * -8).toFixed(2) + 'px');
    });
    wrap.addEventListener('pointerleave', function () {
      device.style.setProperty('--mouse-x', '0');
      device.style.setProperty('--mouse-y', '0');
      wrap.style.setProperty('--orbit-x', '0px');
      wrap.style.setProperty('--orbit-y', '0px');
      wrap.style.setProperty('--orbit-x-two', '0px');
      wrap.style.setProperty('--orbit-y-two', '0px');
    });
  }

  async function setupWebGLHero() {
    var canvas = document.getElementById('heroCanvas');
    var wrap = document.querySelector('.hero-device-wrap');
    if (!canvas || !wrap || reducedMotion || !window.WebGLRenderingContext) return;
    try {
      var THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
      var roundedModule = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js');
      var RoundedBoxGeometry = roundedModule.RoundedBoxGeometry;
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x071017, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      var scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x071017, 0.055);
      var camera = new THREE.PerspectiveCamera(27, 1, .1, 100);
      camera.position.set(0, 0, 5.4);
      var phone = new THREE.Group();
      phone.position.set(0, .02, 0);
      scene.add(phone);

      var metal = new THREE.MeshPhysicalMaterial({ color: 0x93aeb2, metalness: .92, roughness: .2, clearcoat: .8, clearcoatRoughness: .16 });
      var darkMetal = new THREE.MeshPhysicalMaterial({ color: 0x182a32, metalness: .88, roughness: .23, clearcoat: .55 });
      var screenMaterial = new THREE.MeshPhysicalMaterial({ color: 0x0b202a, metalness: .08, roughness: .12, clearcoat: 1, clearcoatRoughness: .08, emissive: 0x092d3a, emissiveIntensity: .32 });
      var glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0xbce8eb, metalness: .05, roughness: .06, transmission: .18, thickness: .035, transparent: true, opacity: .32, clearcoat: 1, clearcoatRoughness: .03 });
      var body = new THREE.Mesh(new RoundedBoxGeometry(1.68, 3.28, .22, 8, .15), metal);
      body.castShadow = true;
      phone.add(body);
      var screen = new THREE.Mesh(new RoundedBoxGeometry(1.48, 3.02, .035, 8, .12), screenMaterial);
      screen.position.z = .13;
      phone.add(screen);
      var glass = new THREE.Mesh(new RoundedBoxGeometry(1.49, 3.03, .018, 8, .12), glassMaterial);
      glass.position.z = .155;
      phone.add(glass);
      var notch = new THREE.Mesh(new RoundedBoxGeometry(.53, .1, .02, 6, .045), darkMetal);
      notch.position.set(0, 1.35, .18);
      phone.add(notch);

      var uiCanvas = document.createElement('canvas');
      uiCanvas.width = 420; uiCanvas.height = 840;
      var ui = uiCanvas.getContext('2d');
      var gradient = ui.createLinearGradient(0, 0, 420, 840);
      gradient.addColorStop(0, '#102d38'); gradient.addColorStop(.55, '#163f49'); gradient.addColorStop(1, '#091b24');
      ui.fillStyle = gradient; ui.fillRect(0, 0, 420, 840);
      ui.strokeStyle = 'rgba(139,210,223,.22)'; ui.lineWidth = 2;
      for (var grid = 0; grid < 8; grid += 1) { ui.beginPath(); ui.moveTo(grid * 60, 0); ui.lineTo(grid * 60 + 170, 840); ui.stroke(); }
      ui.fillStyle = '#d5b36a'; ui.font = '600 18px Arial'; ui.fillText('RONDINELI CELL', 34, 70);
      ui.fillStyle = '#aee7eb'; ui.font = '12px Arial'; ui.fillText('PRECISION LAB / ACTIVE', 34, 103);
      ui.strokeStyle = 'rgba(213,179,106,.8)'; ui.beginPath(); ui.arc(210, 405, 103, 0, Math.PI * 2); ui.stroke();
      ui.fillStyle = '#f3f8f6'; ui.font = '600 86px Arial'; ui.textAlign = 'center'; ui.fillText('RC', 210, 435);
      ui.fillStyle = '#aee7eb'; ui.font = '14px Arial'; ui.fillText('TECNOLOGIA / PRECISAO / CUIDADO', 210, 485);
      ui.textAlign = 'left'; ui.fillStyle = 'rgba(243,248,246,.6)'; ui.font = '12px Arial'; ui.fillText('SYSTEM CHECK', 34, 760); ui.fillText('READY FOR ANALYSIS', 34, 790);
      var uiTexture = new THREE.CanvasTexture(uiCanvas); uiTexture.colorSpace = THREE.SRGBColorSpace;
      screenMaterial.map = uiTexture; screenMaterial.needsUpdate = true;

      var lensMaterial = new THREE.MeshPhysicalMaterial({ color: 0x0c171d, metalness: .72, roughness: .1, clearcoat: 1, clearcoatRoughness: .04 });
      var lensGlass = new THREE.MeshPhysicalMaterial({ color: 0x6fd2df, metalness: .15, roughness: .04, transmission: .3, transparent: true, opacity: .8 });
      var cameraBlock = new THREE.Mesh(new RoundedBoxGeometry(.66, .8, .07, 6, .08), darkMetal);
      cameraBlock.position.set(-.43, 1.02, -.15); phone.add(cameraBlock);
      [-.58, -.29].forEach(function (x) {
        var lens = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .035, 32), lensMaterial);
        lens.rotation.x = Math.PI / 2; lens.position.set(x, 1.2, -.2); phone.add(lens);
        var glint = new THREE.Mesh(new THREE.CircleGeometry(.064, 24), lensGlass);
        glint.position.set(x, 1.2, -.22); glint.rotation.x = -Math.PI / 2; phone.add(glint);
      });
      var sideButton = new THREE.Mesh(new THREE.BoxGeometry(.035, .34, .08), darkMetal); sideButton.position.set(.86, .63, 0); phone.add(sideButton);
      var volumeButton = new THREE.Mesh(new THREE.BoxGeometry(.035, .2, .08), darkMetal); volumeButton.position.set(-.86, .7, 0); phone.add(volumeButton);

      var keyLight = new THREE.PointLight(0xc7f4ff, 22, 7, 2); keyLight.position.set(3, 2, 4); scene.add(keyLight);
      var rimLight = new THREE.PointLight(0xd5b36a, 16, 6, 2); rimLight.position.set(-3, -1, 2); scene.add(rimLight);
      var topLight = new THREE.DirectionalLight(0xffffff, 1.5); topLight.position.set(0, 4, 3); scene.add(topLight);
      scene.add(new THREE.HemisphereLight(0x8bd2df, 0x071017, 1.25));

      var particleGeometry = new THREE.BufferGeometry();
      var particlePositions = new Float32Array(90 * 3);
      for (var point = 0; point < 90; point += 1) { particlePositions[point * 3] = (Math.random() - .5) * 5; particlePositions[point * 3 + 1] = (Math.random() - .5) * 5; particlePositions[point * 3 + 2] = (Math.random() - .5) * 3; }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      var particleMaterial = new THREE.PointsMaterial({ color: 0x8bd2df, size: .018, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false });
      var particles = new THREE.Points(particleGeometry, particleMaterial); scene.add(particles);

      var targetX = 0; var targetY = 0; var currentX = 0; var currentY = 0; var clock = new THREE.Clock(); var active = true;
      canvas.addEventListener('pointermove', function (event) { var rect = canvas.getBoundingClientRect(); targetX = ((event.clientX - rect.left) / rect.width - .5) * 2; targetY = ((event.clientY - rect.top) / rect.height - .5) * 2; });
      canvas.addEventListener('pointerleave', function () { targetX = 0; targetY = 0; });
      if ('IntersectionObserver' in window) { var sceneObserver = new IntersectionObserver(function (entries) { active = entries[0].isIntersecting; }, { threshold: .04 }); sceneObserver.observe(wrap); }
      function resize() { var rect = wrap.getBoundingClientRect(); var width = Math.max(rect.width, 1); var height = Math.max(rect.height, 1); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }
      resize(); window.addEventListener('resize', resize);
      wrap.classList.add('webgl-ready');
      function render() {
        window.requestAnimationFrame(render); if (!active) return;
        var time = clock.getElapsedTime(); currentX += (targetX - currentX) * .035; currentY += (targetY - currentY) * .035;
        phone.rotation.y = Math.sin(time * .52) * .18 + currentX * .15;
        phone.rotation.x = Math.sin(time * .37 + 1) * .035 - currentY * .08;
        phone.rotation.z = Math.sin(time * .43) * .018 + currentX * .018;
        phone.position.y = Math.sin(time * .74) * .07 + currentY * -.035;
        keyLight.position.x = 2.3 + Math.sin(time * .7) * 1.1 + currentX * 1.4;
        keyLight.position.y = 1.4 + Math.cos(time * .55) * .7 - currentY;
        rimLight.position.x = -2.2 + Math.cos(time * .45) * .8;
        particles.rotation.y = time * .018; particles.rotation.x = Math.sin(time * .12) * .04;
        camera.position.x += (currentX * .12 - camera.position.x) * .025; camera.position.y += (-currentY * .08 - camera.position.y) * .025; camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      }
      render();
    } catch (error) {
      canvas.setAttribute('data-webgl-error', 'true');
    }
  }

  function setupParticles() {
    var canvas = document.getElementById('particleField');
    if (!canvas || reducedMotion) return;
    var context = canvas.getContext('2d');
    if (!context) return;
    var particles = [];
    var width = 0;
    var height = 0;
    var density = window.innerWidth < 700 ? 24 : 48;
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    function seed() {
      particles = [];
      for (var index = 0; index < density; index += 1) {
        particles.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + .3, vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .12, alpha: Math.random() * .45 + .08 });
      }
    }
    function draw() {
      context.clearRect(0, 0, width, height);
      particles.forEach(function (particle) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
        context.beginPath();
        context.fillStyle = 'rgba(139, 210, 223, ' + particle.alpha + ')';
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        context.fill();
      });
      window.requestAnimationFrame(draw);
    }
    resize();
    seed();
    window.addEventListener('resize', function () { resize(); seed(); });
    draw();
  }

  function setupDiagnosticFlow() {
    var brandSelect = document.getElementById('deviceBrand');
    var modelSelect = document.getElementById('deviceModel');
    var issueSelect = document.getElementById('deviceIssue');
    var title = document.getElementById('diagnosticTitle');
    var text = document.getElementById('diagnosticText');
    var tagOne = document.getElementById('tagOne');
    var tagTwo = document.getElementById('tagTwo');
    var tagThree = document.getElementById('tagThree');
    var meta = document.getElementById('resultMeta');
    var button = document.getElementById('quoteDiagnosisBtn');
    if (!brandSelect || !modelSelect || !issueSelect || !title || !text || !tagOne || !tagTwo || !tagThree || !meta || !button) return;

    var profiles = {
      iphone: ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone SE'],
      samsung: ['Galaxy S23', 'Galaxy S24', 'Galaxy A54', 'Galaxy A34', 'Galaxy Note'],
      motorola: ['Moto G8', 'Moto G100', 'Moto Edge', 'Moto One Vision'],
      xiaomi: ['Redmi Note 11', 'Redmi Note 12', 'POCO F5', 'Xiaomi 13'],
      outros: ['Outros modelos', 'Android genérico', 'iPhone não listado', 'Samsung não listado']
    };

    var recommendations = {
      tela: { title: 'Troca de tela', text: 'A falha costuma aparecer por impacto, vidro rachado ou perda de sensibilidade ao toque. O diagnóstico técnico é essencial para garantir encaixe perfeito e evitar problemas recorrentes.', tags: ['Tela', 'Precisão', 'Touch'], meta: 'Tempo de resposta: 1 a 2 dias úteis' },
      bateria: { title: 'Troca de bateria', text: 'Se o aparelho descarrega rápido, esfria, ou desliga sozinho, a melhor solução é a troca com análise de desgaste e desempenho do componente.', tags: ['Bateria', 'Autonomia', 'Segurança'], meta: 'Tempo de resposta: 24 a 48 horas' },
      carga: { title: 'Conector de carga', text: 'Falhas de encaixe e carregamento podem indicar desgaste do conector ou problemas internos de alimentação. A revisão aponta a causa antes da substituição.', tags: ['Carga', 'Conector', 'Estabilidade'], meta: 'Tempo de resposta: 2 a 3 dias úteis' },
      camera: { title: 'Reparo de câmera', text: 'Problemas de foco, lente turva ou imagem distorcida precisam de diagnóstico preciso para confirmar se a solução é limpeza, lente ou módulo completo.', tags: ['Camera', 'Foco', 'Lente'], meta: 'Tempo de resposta: 2 a 4 dias úteis' },
      audio: { title: 'Microfone / alto-falante', text: 'Som baixo, falhas de gravação ou ausência de áudio em chamadas são sinais comuns de defeito no módulo áudio. O diagnóstico evita troca sem necessidade.', tags: ['Áudio', 'Clareza', 'Chamada'], meta: 'Tempo de resposta: 1 a 3 dias úteis' },
      diagnostico: { title: 'Diagnóstico e manutenção', text: 'Quando o sintoma não é único, a análise técnica precisa verificar cada ponto do aparelho para indicar a correção correta e evitar gasto desnecessário.', tags: ['Diagnóstico', 'Manutenção', 'Teste'], meta: 'Tempo de resposta: 24 horas' }
    };

    function populateModels() {
      var currentBrand = brandSelect.value;
      modelSelect.innerHTML = profiles[currentBrand].map(function (model) {
        return '<option value="' + model + '">' + model + '</option>';
      }).join('');
      refreshSummary();
    }

    function refreshSummary() {
      var currentIssue = issueSelect.value;
      var current = recommendations[currentIssue];
      if (!current) return;
      title.textContent = current.title;
      text.textContent = current.text;
      tagOne.textContent = current.tags[0];
      tagTwo.textContent = current.tags[1];
      tagThree.textContent = current.tags[2];
      meta.textContent = current.meta;
    }

    brandSelect.addEventListener('change', populateModels);
    issueSelect.addEventListener('change', refreshSummary);
    populateModels();

    button.addEventListener('click', function () {
      var brand = brandSelect.options[brandSelect.selectedIndex].text;
      var model = modelSelect.value;
      var issue = issueSelect.options[issueSelect.selectedIndex].text;
      var textMessage = 'Olá, Rondineli Cell. Gostaria de solicitar um orçamento para ' + brand + ' ' + model + '. Problema: ' + issue + '. Por favor, me retornem com a melhor solução e o valor.';
      window.open('https://api.whatsapp.com/send?phone=5511947482819&text=' + encodeURIComponent(textMessage), '_blank', 'noopener');
    });
  }

  function setupQuoteForm() {
    var form = document.getElementById('quoteForm');
    if (!form) return;
    var whatsappNumber = '5511947482819';
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = document.getElementById('quoteName').value.trim();
      var device = document.getElementById('quoteDevice').value.trim();
      var message = document.getElementById('quoteMessage').value.trim();
      if (!name || !device) return;
      var text = 'Olá, Rondineli Cell. Meu nome é ' + name + '.%0A%0AAparelho e serviço: ' + device + '.%0A' + (message ? 'Detalhes: ' + message : 'Gostaria de solicitar uma avaliação.');
      window.open('https://api.whatsapp.com/send?phone=' + whatsappNumber + '&text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  function init() {
    setupMenu();
    setupHeader();
    setupReveal();
    setupTilt();
    setupParticles();
    setupDiagnosticFlow();
    setupQuoteForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
