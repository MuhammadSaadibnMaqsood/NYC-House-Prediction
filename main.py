from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pydantic import BaseModel, Field
import joblib

# import model
model = joblib.load("model_pipeline.pkl")


COLUMNS = [
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
]


class Features(BaseModel):
    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
        description="Latitude of the property, must be between -90 and 90.",
    )
    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
        description="Longitude of the property, must be between -180 and 180.",
    )
    price: float = Field(
        ..., ge=0, description="Price of the property, must be a non-negative value."
    )
    minimum_nights: int = Field(
        ...,
        ge=0,
        le=365,
        description="Minimum number of nights for booking, must be a non-negative integer.",
    )
    number_of_reviews: int = Field(
        ...,
        ge=0,
        description="Number of reviews for the property, must be a non-negative integer.",
    )
    reviews_per_month: float = Field(
        ...,
        ge=0,
        description="Reviews per month for the property, must be a non-negative value.",
    )
    calculated_host_listings_count: int = Field(
        ...,
        ge=0,
        description="Calculated host listings count for the property, must be a non-negative integer.",
    )
    availability_365: int = Field(
        ...,
        ge=0,
        le=365,
        description="Availability of the property in days for a year, must be between 0 and 365.",
    )
    neighbourhood_group: str = Field(
        ..., min_length=1, description="Neighbourhood group of the property."
    )
    neighbourhood: str = Field(
        ..., min_length=1, description="Neighbourhood of the property."
    )


class PredictionResponse(BaseModel):
    predicted_type: str = Field(..., description="Predicted price of the property.")
    probability: float = Field(..., description="Probability of the predicted price.")


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)

@app.get("/")
def greet():
    return "HALLO"


@app.post("/predict", response_model=PredictionResponse)
@app.post("/predict", response_model=PredictionResponse)
def predict(features: Features):

    # Convert Pydantic model to dictionary
    data = features.model_dump()

    # Create DataFrame with the same columns used during training
    row = pd.DataFrame([data], columns=COLUMNS)

    # Prediction
    pred = model.predict(row)

    # Probabilities
    probabilities = model.predict_proba(row)

    # Get probability of the predicted class
    predicted_class_index = list(model.classes_).index(pred[0])
    probability = probabilities[0][predicted_class_index]

    return PredictionResponse(
        predicted_type=str(pred[0]),
        probability=float(probability)
    )