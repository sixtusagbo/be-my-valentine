import './style.css'

const FLEE_DISTANCE = 150
const FLEE_TOUCH_RADIUS = 120
const YES_GLOW_DISTANCE = 200
const hearts = ['💕', '💖', '💗', '💘', '💝', '❤️', '💓', '💞']

let pointerX = -1000
let pointerY = -1000
let noX = 0
let noY = 0
let noPlaced = false

function init() {
  const app = document.querySelector('#app')

  app.innerHTML = `
    <div class="heart-bg" id="heartBg"></div>
    <div class="content">
      <h1 class="question">Will you be my Valentine?</h1>
      <div class="buttons">
        <button class="btn-yes" id="btnYes">Yes!</button>
      </div>
    </div>
    <button class="btn-no" id="btnNo">No</button>
  `

  const btnYes = document.getElementById('btnYes')
  const btnNo = document.getElementById('btnNo')

  placeNoButton(btnNo)
  spawnFloatingHearts()

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
        <div class="yes-text">Yay! I knew you'd say yes!</div>
        <div class="yes-subtext">You just made me the happiest person ever</div>
      </div>
    `

    // Intense heart rain for celebration
    const container = document.getElementById('heartBg')
    for (let i = 0; i < 25; i++) {
      setTimeout(() => createFloatingHeart(container), i * 150)
    }
    setInterval(() => createFloatingHeart(container), 600)

    explosion.remove()
  }, 800)
}

init()
