import './style.css'

const FLEE_DISTANCE = 150
const FLEE_TOUCH_RADIUS = 120
const YES_GLOW_DISTANCE = 200
const hearts = ['💕', '💖', '💗', '💘', '💝', '❤️', '💓', '💞']
const confettiColors = ['#ff6b9d', '#ff85b3', '#c44569', '#ffb6c1', '#ff1493', '#fff', '#ffd700']

let pointerX = -1000
let pointerY = -1000
let noX = 0
let noY = 0
let noPlaced = false
let noScale = 1
let yesScale = 1

// Web Audio typing sound
let audioCtx
function playTypeSound() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.frequency.value = 600 + Math.random() * 400
  osc.type = 'sine'
  gain.gain.setValueAtTime(0.06, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.08)
}

function typeText(element, text, callback) {
  let i = 0
  element.textContent = ''
  const interval = setInterval(() => {
    element.textContent += text[i]
    playTypeSound()
    i++
    if (i >= text.length) {
      clearInterval(interval)
      element.classList.add('typed')
      if (callback) setTimeout(callback, 300)
    }
  }, 80)
}

// Cursor heart trail
function initHeartTrail() {
  const trailHearts = ['💙', '🩵', '💎']
  let lastSpawn = 0

  function spawnTrailHeart(x, y) {
    const now = Date.now()
    if (now - lastSpawn < 60) return
    lastSpawn = now

    const heart = document.createElement('span')
    heart.className = 'trail-heart'
    heart.textContent = trailHearts[Math.floor(Math.random() * trailHearts.length)]
    heart.style.left = `${x}px`
    heart.style.top = `${y}px`
    heart.style.fontSize = `${10 + Math.random() * 12}px`
    document.body.appendChild(heart)
    setTimeout(() => heart.remove(), 1000)
  }

  document.addEventListener('pointermove', (e) => spawnTrailHeart(e.clientX, e.clientY))
  document.addEventListener('touchmove', (e) => {
    spawnTrailHeart(e.touches[0].clientX, e.touches[0].clientY)
  }, { passive: true })
}

// Firefly particles
function initFireflies() {
  const container = document.createElement('div')
  container.className = 'firefly-container'
  document.body.appendChild(container)

  function spawnFirefly() {
    const fly = document.createElement('div')
    fly.className = 'firefly'
    fly.style.left = `${Math.random() * 100}%`
    fly.style.top = `${Math.random() * 100}%`
    const size = 2 + Math.random() * 4
    fly.style.width = `${size}px`
    fly.style.height = `${size}px`
    const hue = Math.random() > 0.5 ? `330, 80%, 70%` : `45, 100%, 70%`
    fly.style.setProperty('--hue', hue)
    fly.style.setProperty('--dx', `${Math.random() * 120 - 60}px`)
    fly.style.setProperty('--dy', `${Math.random() * 120 - 60}px`)
    fly.style.animationDuration = `${4 + Math.random() * 6}s`
    fly.style.animationDelay = `${Math.random() * 3}s`
    container.appendChild(fly)
    setTimeout(() => fly.remove(), 12000)
  }

  for (let i = 0; i < 20; i++) {
    setTimeout(() => spawnFirefly(), i * 400)
  }
  setInterval(spawnFirefly, 800)
}

function init() {
  const app = document.querySelector('#app')

  app.innerHTML = `
    <div class="content">
      <h1 class="question"></h1>
      <div class="buttons hidden" id="buttons">
        <button class="btn-yes" id="btnYes">Yes!</button>
      </div>
    </div>
    <button class="btn-no hidden" id="btnNo">No</button>
  `

  const btnYes = document.getElementById('btnYes')
  const btnNo = document.getElementById('btnNo')
  const question = document.querySelector('.question')
  const buttons = document.getElementById('buttons')

  initHeartTrail()
  initFireflies()

  // Type out the question, then reveal buttons
  typeText(question, 'Will you be my Valentine?', () => {
    buttons.classList.remove('hidden')
    btnNo.classList.remove('hidden')
    placeNoButton(btnNo)
  })

  // Track pointer position globally
  document.addEventListener('pointermove', (e) => {
    pointerX = e.clientX
    pointerY = e.clientY
  })

  document.addEventListener('touchmove', (e) => {
    pointerX = e.touches[0].clientX
    pointerY = e.touches[0].clientY
  }, { passive: true })

  // On mobile, touchstart is the earliest signal we get.
  // Update pointer + immediately check if touch landed near the No button.
  document.addEventListener('touchstart', (e) => {
    pointerX = e.touches[0].clientX
    pointerY = e.touches[0].clientY
    immediateFleeCheck(btnNo)
  }, { passive: true })

  // Yes button
  btnYes.addEventListener('click', showYesScreen)
  btnYes.addEventListener('touchend', (e) => {
    e.preventDefault()
    showYesScreen()
  })

  // No button: flee on any interaction.
  // touchstart with preventDefault stops the tap from ever registering on mobile.
  btnNo.addEventListener('touchstart', (e) => {
    e.preventDefault()
    fleeNoButton(btnNo)
  })

  btnNo.addEventListener('click', (e) => {
    e.preventDefault()
    fleeNoButton(btnNo)
  })

  // Main animation loop
  requestAnimationFrame(() => gameLoop(btnYes, btnNo))
}

function placeNoButton(btn) {
  const yesBtn = document.getElementById('btnYes')
  const yesRect = yesBtn.getBoundingClientRect()
  const bw = btn.offsetWidth
  const bh = btn.offsetHeight
  const pad = 20

  // Place to the right of Yes, clamped to viewport
  noX = Math.min(yesRect.right + 24, window.innerWidth - bw - pad)
  noY = yesRect.top + (yesRect.height / 2) - (bh / 2)
  btn.style.left = `${noX}px`
  btn.style.top = `${noY}px`
  noPlaced = true
}

function immediateFleeCheck(btn) {
  if (!noPlaced) return
  const noCenterX = noX + btn.offsetWidth / 2
  const noCenterY = noY + btn.offsetHeight / 2
  const dist = Math.hypot(pointerX - noCenterX, pointerY - noCenterY)
  if (dist < FLEE_TOUCH_RADIUS) {
    fleeNoButton(btn)
  }
}

function fleeNoButton(btn) {
  const w = window.innerWidth
  const h = window.innerHeight
  const bw = btn.offsetWidth
  const bh = btn.offsetHeight
  const pad = 20

  // Shrink No, grow Yes
  noScale = Math.max(0.15, noScale * 0.75)
  yesScale = Math.min(1.6, yesScale + 0.08)
  btn.style.transform = `scale(${noScale})`
  const yesBtn = document.getElementById('btnYes')
  yesBtn.style.transform = `scale(${yesScale})`

  // Pick a random spot far from pointer
  let newX, newY, dist
  let attempts = 0

  do {
    newX = pad + Math.random() * (w - bw - pad * 2)
    newY = pad + Math.random() * (h - bh - pad * 2)
    dist = Math.hypot(newX - pointerX, newY - pointerY)
    attempts++
  } while (dist < 200 && attempts < 50)

  noX = newX
  noY = newY
  btn.style.left = `${noX}px`
  btn.style.top = `${noY}px`
}

function gameLoop(btnYes, btnNo) {
  // Yes button glow when pointer is nearby
  const yesRect = btnYes.getBoundingClientRect()
  const yesCenterX = yesRect.left + yesRect.width / 2
  const yesCenterY = yesRect.top + yesRect.height / 2
  const yesDist = Math.hypot(pointerX - yesCenterX, pointerY - yesCenterY)

  if (yesDist < YES_GLOW_DISTANCE) {
    btnYes.classList.add('nearby')
  } else {
    btnYes.classList.remove('nearby')
  }

  // No button flees when pointer approaches
  if (noPlaced) {
    const bw = btnNo.offsetWidth
    const bh = btnNo.offsetHeight
    const noCenterX = noX + bw / 2
    const noCenterY = noY + bh / 2
    const noDist = Math.hypot(pointerX - noCenterX, pointerY - noCenterY)

    if (noDist < FLEE_DISTANCE) {
      // Calculate flee direction (away from pointer)
      const angle = Math.atan2(noCenterY - pointerY, noCenterX - pointerX)
      const fleeForce = (FLEE_DISTANCE - noDist) * 0.4

      let newX = noX + Math.cos(angle) * fleeForce
      let newY = noY + Math.sin(angle) * fleeForce

      const w = window.innerWidth
      const h = window.innerHeight
      const pad = 10

      // Bounce off edges
      if (newX < pad) newX = pad + Math.random() * 100
      if (newX > w - bw - pad) newX = w - bw - pad - Math.random() * 100
      if (newY < pad) newY = pad + Math.random() * 100
      if (newY > h - bh - pad) newY = h - bh - pad - Math.random() * 100

      noX = newX
      noY = newY
      btnNo.style.left = `${noX}px`
      btnNo.style.top = `${noY}px`
    }
  }

  requestAnimationFrame(() => gameLoop(btnYes, btnNo))
}

function spawnFloatingHearts() {
  const container = document.getElementById('heartBg')
  const count = 15

  for (let i = 0; i < count; i++) {
    setTimeout(() => createFloatingHeart(container), i * 800)
  }

  setInterval(() => createFloatingHeart(container), 2000)
}

function createFloatingHeart(container) {
  const heart = document.createElement('span')
  heart.className = 'floating-heart'
  heart.textContent = hearts[Math.floor(Math.random() * hearts.length)]
  heart.style.left = `${Math.random() * 100}%`
  heart.style.fontSize = `${14 + Math.random() * 18}px`
  heart.style.animationDuration = `${6 + Math.random() * 8}s`
  heart.style.animationDelay = `${Math.random() * 2}s`
  container.appendChild(heart)

  setTimeout(() => heart.remove(), 16000)
}

function showYesScreen() {
  const app = document.querySelector('#app')

  // Heart explosion from center
  const explosion = document.createElement('div')
  explosion.className = 'heart-explosion'

  for (let i = 0; i < 30; i++) {
    const h = document.createElement('span')
    h.className = 'explosion-heart'
    h.textContent = hearts[Math.floor(Math.random() * hearts.length)]
    h.style.left = '50%'
    h.style.top = '50%'
    h.style.fontSize = `${20 + Math.random() * 30}px`

    const angle = (Math.PI * 2 * i) / 30
    const dist = 100 + Math.random() * 300
    h.style.setProperty('--tx', `${Math.cos(angle) * dist}px`)
    h.style.setProperty('--ty', `${Math.sin(angle) * dist}px`)
    h.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`)
    h.style.animationDelay = `${Math.random() * 0.3}s`

    explosion.appendChild(h)
  }

  document.body.appendChild(explosion)

  // Haptic feedback on supported devices
  if (navigator.vibrate) navigator.vibrate(100)

  setTimeout(() => {
    app.innerHTML = `
      <div class="heart-bg" id="heartBg"></div>
      <div class="yes-screen">
        <div class="yes-heart">💖</div>
        <div class="yes-text"></div>
        <div class="yes-subtext"></div>
      </div>
    `

    typeText(document.querySelector('.yes-text'), 'Yay! I knew you\'d say yes!', () => {
      typeText(document.querySelector('.yes-subtext'), 'My heart is doing backflips right now')
    })

    // Intense heart rain for celebration
    const container = document.getElementById('heartBg')
    for (let i = 0; i < 25; i++) {
      setTimeout(() => createFloatingHeart(container), i * 150)
    }
    setInterval(() => createFloatingHeart(container), 600)

    // Continuous confetti bursts
    spawnConfetti()
    setInterval(spawnConfetti, 2500)

    explosion.remove()
  }, 800)
}

function spawnConfetti() {
  const container = document.createElement('div')
  container.className = 'confetti-burst'
  document.body.appendChild(container)

  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('span')
    piece.className = 'confetti-piece'
    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)]
    piece.style.setProperty('--color', color)
    piece.style.left = `${30 + Math.random() * 40}%`
    piece.style.top = '-5%'
    piece.style.setProperty('--drift', `${Math.random() * 200 - 100}px`)
    piece.style.setProperty('--fall', `${window.innerHeight + 50}px`)
    piece.style.setProperty('--spin', `${Math.random() * 720 - 360}deg`)
    piece.style.animationDuration = `${1.5 + Math.random() * 2}s`
    piece.style.animationDelay = `${Math.random() * 0.8}s`
    container.appendChild(piece)
  }

  setTimeout(() => container.remove(), 4500)
}

init()
