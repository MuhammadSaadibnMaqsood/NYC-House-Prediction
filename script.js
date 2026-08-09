const form = document.getElementById("prediction-form");
const resultCard = document.getElementById("result-card");
const resultType = document.getElementById("result-type");
const resultConfidence = document.getElementById("result-confidence");
const errorMessage = document.getElementById("error-message");
const loadingOverlay = document.getElementById("loading-overlay");
const exampleButton = document.getElementById("example-btn");

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
  resultCard.classList.add("hidden");
});

const API_ORIGIN = window.location.protocol === "file:" ? "http://localhost:8000" : window.location.origin;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError();
  resultCard.classList.add("hidden");
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
    const response = await fetch(`${API_ORIGIN}/predict`, {
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
    resultType.textContent = data.predicted_type || "Unknown";
    resultConfidence.textContent = `Confidence: ${(data.probability * 100).toFixed(1)}%`;
    resultCard.classList.remove("hidden");
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
