// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors()); // Allow cross-origin requests (for Replit or local testing)
app.use(express.json());

// --- Initial radar state ---
let radarState = {
  trueVelocity: 100, // mph
  stormDirection: "N",
  stormSpeed: 50, // mph
  hookEcho: "None",
  mesoCenter: "0 km N of radar",
  radarDegraded: "None",
  envAlerts: "None",
  rotationRPM: 50,

  // Calculated values
  inboundVelocity: 0,
  outboundVelocity: 0,
  velocityCouplet: "steady",
  coupletSize: 0,
  reflectivity: 0,
  highReflectivityCore: false,
  possibleHailCore: false,
  precipitation: 0,
  radarConfidence: 100,
  tornadoIntensityEstimate: 0
};

// --- Helper to recalc dependent values ---
function recalcRadar() {
  const rv = radarState.trueVelocity;
  // Ping-pong simulation
  radarState.inboundVelocity = parseFloat((rv * 0.95).toFixed(2));
  radarState.outboundVelocity = parseFloat((rv * 1.05).toFixed(2));

  // Velocity couplet
  if (radarState.inboundVelocity < radarState.outboundVelocity - 5) {
    radarState.velocityCouplet = "strengthening";
  } else if (radarState.inboundVelocity > radarState.outboundVelocity + 5) {
    radarState.velocityCouplet = "weakening";
  } else {
    radarState.velocityCouplet = "steady";
  }

  // Couplet size (simplified formula)
  radarState.coupletSize = parseFloat((rv * 0.02).toFixed(2));

  // Reflectivity and hail
  radarState.reflectivity = parseFloat((Math.min(rv * 0.5, 70)).toFixed(2));
  radarState.highReflectivityCore = radarState.reflectivity > 55;
  radarState.possibleHailCore = radarState.reflectivity > 60;
  radarState.precipitation = parseFloat((radarState.reflectivity * 0.1).toFixed(2));
  radarState.radarConfidence = 100 - Math.min(radarState.rotationRPM, 100) * 0.5;
  radarState.tornadoIntensityEstimate = radarState.velocityCouplet === "strengthening" ? 3 : 1;
}

// --- GET current radar data ---
app.get("/data", (req, res) => {
  recalcRadar();
  res.json(radarState);
});

// --- POST updates from admin ---
app.post("/update", (req, res) => {
  const updates = req.body;

  for (const key in updates) {
    if (radarState.hasOwnProperty(key)) {
      radarState[key] = updates[key];
    }
  }

  recalcRadar();
  res.json({ status: "ok", radarState });
});

app.listen(PORT, () => {
  console.log(`AMRT Radar server running on http://localhost:${PORT}`);
});
