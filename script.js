const form = document.getElementById("prediction-form");
const exampleButton = document.getElementById("example-btn");
const loadingOverlay = document.getElementById("loading-overlay");
const errorMessage = document.getElementById("error-message");

const certificateBlank = document.getElementById("certificate-blank");
const certificateResult = document.getElementById("certificate-result");
const stampEl = document.getElementById("stamp");
const resultType = document.getElementById("result-type");
const resultConfidence = document.getElementById("result-confidence");
const gaugeFill = document.getElementById("gauge-fill");
const gaugeNeedle = document.getElementById("gauge-needle");
const caseNumber = document.getElementById("case-number");

const GAUGE_DASH_LENGTH = 251; // matches stroke-dasharray in styles.css

const fieldIds = [
  "neighbourhood_group",
  "neighbourhood",
  "latitude",
  "longitude",
  "price",
  "minimum_nights",
  "number_of_reviews",
  "reviews_per_month",
  "calculated_host_listings_count",
  "availability_365",
];

const isLocalEnvironment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_ORIGIN = isLocalEnvironment
  ? "http://127.0.0.1:8000"
  : (window.__BACKEND_URL__ || window.location.origin);
const API_PATH = "/predict";

// ---- Case number: filing-flavor, generated on load ----
function setCaseNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  caseNumber.textContent = `${year}-${rand}`;
}
setCaseNumber();

// ---- Demo values ----
exampleButton.addEventListener("click", () => {
  const values = {
    neighbourhood_group: "Brooklyn",
    neighbourhood: "Williamsburg",
    latitude: 40.7081,
    longitude: -73.9571,
    price: 125.0,
    minimum_nights: 3,
    number_of_reviews: 15,
    reviews_per_month: 1.25,
    calculated_host_listings_count: 2,
    availability_365: 180,
  };

  fieldIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.value = values[id] ?? "";
    }
  });
  hideError();
  resetCertificate();
});

// ---- Certificate state helpers ----
function resetCertificate() {
  certificateResult.classList.add("hidden");
  certificateBlank.classList.remove("hidden");
}

function setGauge(confidencePercent) {
  const clamped = Math.max(0, Math.min(100, confidencePercent));
  const offset = GAUGE_DASH_LENGTH - (GAUGE_DASH_LENGTH * clamped) / 100;

  // Reset without transition so repeated submissions replay the animation.
  gaugeFill.style.transition = "none";
  gaugeFill.style.strokeDashoffset = String(GAUGE_DASH_LENGTH);
  gaugeNeedle.style.transition = "none";
  gaugeNeedle.style.transform = "translateX(-50%) rotate(-90deg)";
  gaugeFill.getBoundingClientRect(); // force reflow

  requestAnimationFrame(() => {
    gaugeFill.style.transition = "";
    gaugeFill.style.strokeDashoffset = String(offset);
    gaugeNeedle.style.transition = "";
    const angle = -90 + (clamped / 100) * 180;
    gaugeNeedle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  });
}

function renderResult(predictedType, confidencePercent) {
  certificateBlank.classList.add("hidden");
  certificateResult.classList.remove("hidden");

  // Restart the stamp animation on every submission.
  stampEl.style.animation = "none";
  stampEl.offsetWidth; // force reflow
  stampEl.style.animation = "";

  resultType.textContent = predictedType || "Unknown";
  resultConfidence.textContent = `${confidencePercent.toFixed(1)}%`;
  setGauge(confidencePercent);
}

// ---- Submit handler ----
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();
  resetCertificate();
  showLoader(true);

  const payload = {};
  fieldIds.forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;

    const rawValue = input.value;
    if (id === "neighbourhood_group" || id === "neighbourhood") {
      payload[id] = rawValue;
      return;
    }

    const numeric = Number(rawValue);
    payload[id] = Number.isNaN(numeric) ? rawValue : numeric;
  });

  try {
    const response = await fetch(`${API_ORIGIN}${API_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Unable to reach prediction API.");
    }

    const data = await response.json();
    renderResult(data.predicted_type, (data.probability ?? 0) * 100);
  } catch (error) {
    showError(error.message || "Something went wrong while predicting.");
  } finally {
    showLoader(false);
  }
});

function showLoader(active) {
  loadingOverlay.classList.toggle("hidden", !active);
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function hideError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");
}