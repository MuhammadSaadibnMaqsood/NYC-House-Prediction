# NYC-House-Prediction

A small machine learning project that trains a classifier to predict Airbnb `room_type` for listings in New York City using the `AB_NYC_2019.csv` dataset and exposes a FastAPI endpoint for inference.

**Contents**
- `AB_NYC_2019.csv` — dataset used for training and EDA
- `nyc_house_prediction.ipynb` — Jupyter notebook with EDA, preprocessing, model selection, and export of the trained pipeline (`model_pipeline.pkl`)
- `main.py` — FastAPI application exposing `/predict` to run inference with the trained pipeline
- `model_pipeline.pkl` — the serialized scikit-learn pipeline produced by the notebook (not included by default)
- `requirements.txt` — Python dependencies (populate with the required packages)

**Overview**

This repo demonstrates a typical ML workflow: exploratory data analysis, preprocessing, model tuning using `RandomizedSearchCV` over a `RandomForestClassifier`, and packaging the resulting scikit-learn `Pipeline` for serving via FastAPI.

Prerequisites
- Python 3.9+ (3.10+ recommended)
- A working `pip` and virtual environment

Recommended dependencies (add these to `requirements.txt`):

- pandas
- numpy
- scikit-learn
- joblib
- fastapi
- uvicorn
- matplotlib
- seaborn

Setup

1. Create and activate a virtual environment

```bash
python -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# Windows (cmd.exe)
.venv\Scripts\activate.bat
```

2. Install dependencies

```bash
pip install -r requirements.txt
```

If `requirements.txt` is empty, install the packages listed above manually:

```bash
pip install pandas numpy scikit-learn joblib fastapi uvicorn matplotlib seaborn
```

Reproduce training and create `model_pipeline.pkl`

1. Open and run `nyc_house_prediction.ipynb` in Jupyter or VS Code notebooks.
2. The notebook performs EDA, preprocessing (ColumnTransformer + pipelines), trains multiple models, runs a `RandomizedSearchCV` over a `RandomForestClassifier`, evaluates results, and at the end saves the best estimator:

```python
joblib.dump(search.best_estimator_, "model_pipeline.pkl")
```

Place the resulting `model_pipeline.pkl` file in the repository root before serving the API.

Run the API

Start the FastAPI app with Uvicorn:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API endpoints

- `GET /` — simple health/greeting endpoint.
- `POST /predict` — inference endpoint. Accepts JSON with the features listed below and returns a JSON object with `predicted_type` (predicted `room_type`) and `probability`.

Prediction input schema (JSON body)

- `latitude` (float, -90..90)
- `longitude` (float, -180..180)
- `price` (float, >= 0)
- `minimum_nights` (int, 0..365)
- `number_of_reviews` (int, >= 0)
- `reviews_per_month` (float, >= 0)
- `calculated_host_listings_count` (int, >= 0)
- `availability_365` (int, 0..365)
- `neighbourhood_group` (string)
- `neighbourhood` (string)

Example request (curl)

```bash
curl -X POST "http://localhost:8000/predict" \
	-H "Content-Type: application/json" \
	-d '{
		"latitude": 40.7128,
		"longitude": -74.0060,
		"price": 100,
		"minimum_nights": 2,
		"number_of_reviews": 5,
		"reviews_per_month": 0.5,
		"calculated_host_listings_count": 1,
		"availability_365": 200,
		"neighbourhood_group": "Manhattan",
		"neighbourhood": "Harlem"
	}'
```

Notes & recommendations

- `main.py` currently loads `model_pipeline.pkl` at import time. If `model_pipeline.pkl` is missing, the app will fail to start. For production, consider lazy-loading the model inside the endpoint or adding robust error handling and health checks.
- Ensure the columns and categorical values in the input match what the pipeline expects (especially one-hot encoded `neighbourhood_group` and `neighbourhood`).
- Add a populated `requirements.txt` and consider adding a lightweight test that posts to `/predict`.

Contributing

If you want me to:

- add a populated `requirements.txt` file,
- change `main.py` to lazy-load the model and return a helpful error if missing,
- or add a simple test script for the API,

tell me which change you prefer and I will implement it.

License

This repository does not include a license. Add one if you plan to share or publish the code.
