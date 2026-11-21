import os
import pickle
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

def map_education(edu_str):
    if pd.isna(edu_str):
        return 1
    edu_str = str(edu_str).lower()
    if 'phd' in edu_str:
        return 4
    elif 'master' in edu_str:
        return 3
    elif 'type 2' in edu_str:
        return 2
    else:
        return 1

def train_model():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'ai', 'Data', 'recruitment_mydata.csv')
    
    print(f"Loading data from {data_path}...")
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print("Data file not found!")
        return

    # Keep only the features we can map from our application
    # Our app features: EducationLevel, ExperienceYears, SkillScore
    # We will encode EducationLevel
    
    print("Preprocessing data...")
    df['EducationEncoded'] = df['EducationLevel'].apply(map_education)
    
    # Handle NaNs in numerical columns by filling with median
    df['ExperienceYears'] = df['ExperienceYears'].fillna(df['ExperienceYears'].median())
    df['SkillScore'] = df['SkillScore'].fillna(df['SkillScore'].median())
    df['HiringDecision'] = df['HiringDecision'].fillna(0)

    X = df[['EducationEncoded', 'ExperienceYears', 'SkillScore']]
    y = df['HiringDecision']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training RandomForestClassifier...")
    # Use classifier since target is binary
    model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)

    print("Evaluating model...")
    predictions = model.predict(X_test)
    acc = accuracy_score(y_test, predictions)
    print(f"Accuracy: {acc:.4f}")
    print(classification_report(y_test, predictions))

    # Save the model
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'ai', 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'match_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"Model successfully trained and saved to {model_path}")

if __name__ == '__main__':
    train_model()
