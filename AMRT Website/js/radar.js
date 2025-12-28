let rotationSpeed = 50;
let rotationPeriod = 60 / rotationSpeed;

let trueVelocity = 25;
let inboundVelocity = trueVelocity;
let outboundVelocity = trueVelocity;
let velocityDirection = 1;

let rotationTimer = 0;
const scanInterval = 0.1;

let velocityUpdateRotations = 2;
let velocityTimer = velocityUpdateRotations * rotationPeriod;
let coupletSizeTimer = 2 * rotationPeriod;
let velocityCoupletTimer = 6 * rotationPeriod;

let velocityHistory = [];

// Fetch config from JSON
function loadConfig() {
  fetch('config.json')
    .then(res => res.json())
    .then(config => {
      rotationSpeed = parseFloat(config.rotationSpeed);
      rotationPeriod = 60 / rotationSpeed;

      trueVelocity = parseFloat(config.trueVelocity);
      inboundVelocity = trueVelocity;
      outboundVelocity = trueVelocity;
      velocityDirection = 1;

      document.getElementById('radarVehicle').textContent = config.radarVehicle;
      document.getElementById('rotationSpeedDisplay').textContent = rotationSpeed.toFixed(2);
      document.getElementById('stormDirection').textContent = config.stormDirection;
      document.getElementById('stormSpeed').textContent = parseFloat(config.stormSpeed).toFixed(2);
      document.getElementById('hookEcho').textContent = config.hookEcho;
      document.getElementById('mesocyclone').textContent = config.mesocyclone;
      document.getElementById('degraded').textContent = config.degraded;
      document.getElementById('alerts').textContent = config.alerts;

      // Reset timers
      rotationTimer = 0;
      velocityTimer = velocityUpdateRotations * rotationPeriod;
      coupletSizeTimer = 2 * rotationPeriod;
      velocityCoupletTimer = 6 * rotationPeriod;
      velocityHistory = [];
    });
}

// Call initially
loadConfig();

// ---------------- UPDATE LOOP ----------------
setInterval(() => {
  rotationTimer += scanInterval;

  // VELOCITIES
  velocityTimer -= scanInterval;
  if (velocityTimer <= 0) {
    inboundVelocity += velocityDirection * 0.5;
    outboundVelocity -= velocityDirection * 0.5;
    if (inboundVelocity >= trueVelocity + 10 || inboundVelocity <= trueVelocity - 10) velocityDirection *= -1;
    document.getElementById('inbound').textContent = inboundVelocity.toFixed(2);
    document.getElementById('outbound').textContent = outboundVelocity.toFixed(2);
    velocityTimer = velocityUpdateRotations * rotationPeriod;
  }
  document.getElementById('inbound-timer').textContent = velocityTimer.toFixed(1);
  document.getElementById('outbound-timer').textContent = velocityTimer.toFixed(1);

  // COUPLET SIZE
  coupletSizeTimer -= scanInterval;
  if (coupletSizeTimer <= 0) {
    const coupletRandom = (Math.random() - 0.5) * 0.2;
    const coupletSize = Math.min(1.5, 0.01 * inboundVelocity + coupletRandom);
    document.getElementById('coupletSize').textContent = coupletSize.toFixed(2);
    coupletSizeTimer = 2 * rotationPeriod;
  }
  document.getElementById('coupletSize-timer').textContent = coupletSizeTimer.toFixed(1);

  // Track velocity history
  if (rotationTimer >= rotationPeriod) {
    velocityHistory.push(inboundVelocity);
    if (velocityHistory.length > 5) velocityHistory.shift();
  }

  // VELOCITY COUPLET
  velocityCoupletTimer -= scanInterval;
  if (velocityCoupletTimer <= 0) {
    updateVelocityCouplet();
    velocityCoupletTimer = 6 * rotationPeriod;
  }
  document.getElementById('coupletStatus-timer').textContent = velocityCoupletTimer.toFixed(1);

  // AUTOMATED METRICS
  updateReflectivityMetrics();

}, scanInterval*1000);

// ---------------- FUNCTIONS ----------------
function updateVelocityCouplet() {
  if (velocityHistory.length < 2) return;
  let increasing = 0, decreasing = 0;
  for (let i = 1; i < velocityHistory.length; i++) {
    let diff = velocityHistory[i] - velocityHistory[i-1];
    if (diff > 0.5) increasing++;
    else if (diff < -0.5) decreasing++;
  }
  let status = 'steady';
  if (increasing >= 3) status = 'strengthening';
  else if (decreasing >= 3) status = 'weakening';
  document.getElementById('coupletStatus').textContent = status;
}

function updateReflectivityMetrics() {
  const avgVelocity = (inboundVelocity + outboundVelocity)/2;
  const reflectivity = Math.min(80, avgVelocity * 0.7 + Math.random()*5);
  document.getElementById('reflectivity').textContent = reflectivity.toFixed(2);
  document.getElementById('highCore').textContent = reflectivity > 50 ? 'Yes' : 'No';
  document.getElementById('hailCore').textContent = reflectivity > 65 ? 'Yes' : 'No';
  document.getElementById('precipitation').textContent = (reflectivity * 0.6).toFixed(2);

  let stability = 0;
  for(let i=1;i<velocityHistory.length;i++){
    stability += Math.abs(velocityHistory[i]-velocityHistory[i-1]);
  }
  stability = velocityHistory.length>1 ? stability/(velocityHistory.length-1) : 0;
  const confidence = Math.max(30, 100 - stability*5);
  document.getElementById('confidence').textContent = confidence.toFixed(2);

  const coupletText = document.getElementById('coupletStatus').textContent;
  const coupletSize = parseFloat(document.getElementById('coupletSize').textContent);
  let efRating = 'EF0';
  if (coupletSize>0.8 && coupletText==='strengthening') efRating='EF3';
  else if (coupletSize>0.5 && coupletText==='strengthening') efRating='EF2';
  else if (coupletSize>0.3) efRating='EF1';
  document.getElementById('efRating').textContent = efRating;
}

