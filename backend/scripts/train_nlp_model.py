import os
import pickle
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import re

def clean_text(text):
    if pd.isna(text):
        return ""
    text = str(text).lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    return text.strip()

def train_nlp_model():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'ai', 'Data', 'cleaned_train.csv')
    
    print(f"Loading cleaned data from {data_path}...")
    try:
        df = pd.read_csv(data_path)
    except FileNotFoundError:
        print("Cleaned data file not found! Run data_cleaning.py first.")
        return

    print("Cleaning text fields...")
    df['skills_cv'] = df['skills_cv'].apply(clean_text)
    df['skills_vacancy'] = df['skills_vacancy'].apply(clean_text)
    
    # Fill numeric NAs
    df['experience'] = pd.to_numeric(df['experience'], errors='coerce').fillna(0.0)
    
    print("Fitting TF-IDF Vectorizer on all text corpus...")
    # Combine all text to build a shared vocabulary
    all_text = pd.concat([df['skills_cv'], df['skills_vacancy']])
    
    # Limit max_features to 5000 to keep the model fast and lightweight
    vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
    vectorizer.fit(all_text)
    
    print("Computing NLP Cosine Similarities...")
    # Transform
    X_cv = vectorizer.transform(df['skills_cv'])
    X_vac = vectorizer.transform(df['skills_vacancy'])
    
    # Calculate cosine similarity per row.
    # We can do this efficiently using numpy/scipy operations.
    # X_cv and X_vac are sparse matrices.
    # cosine_sim(a,b) = (a * b) / (|a|*|b|)
    # TfidfVectorizer outputs L2 normalized vectors by default, so dot product IS cosine similarity!
    similarities = np.asarray(X_cv.multiply(X_vac).sum(axis=1)).flatten()
    
    # Create feature matrix
    # Features: [nlp_similarity, experience]
    X_features = np.column_stack((similarities, df['experience'].values))
    y = df['hired'].values
    
    print("Training RandomForestClassifier on NLP features...")
    X_train, X_test, y_train, y_test = train_test_split(X_features, y, test_size=0.2, random_state=42)
    
    # Balance classes or use class_weight
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, class_weight='balanced', random_state=42)
    clf.fit(X_train, y_train)
    
    print("Evaluating model...")
    preds = clf.predict(X_test)
    print(f"Accuracy: {accuracy_score(y_test, preds):.4f}")
    print(classification_report(y_test, preds))
    
    # Save the vectorizer and classifier
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'app', 'ai', 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    pipeline = {
        'vectorizer': vectorizer,
        'classifier': clf
    }
    
    model_path = os.path.join(model_dir, 'match_nlp_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(pipeline, f)
        
    print(f"NLP Pipeline successfully trained and saved to {model_path}")

if __name__ == '__main__':
    train_nlp_model()
