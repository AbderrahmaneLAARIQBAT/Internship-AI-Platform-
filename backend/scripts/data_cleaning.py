import os
import pandas as pd

def clean_data():
    input_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'ai', 'Data', 'train.csv')
    output_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'ai', 'Data', 'cleaned_train.csv')
    
    print(f"Reading data from {input_path} in chunks...")
    
    cols_to_keep = [
        'cv_status',
        'skills_cv',
        'skills_vacancy',
        'experience',
        'experienceRequirements'
    ]
    
    chunk_size = 50000
    df_list = []
    
    try:
        # Read the first 100,000 valid rows to keep it manageable
        for chunk in pd.read_csv(
            input_path, 
            sep='|', 
            encoding='utf-8', 
            on_bad_lines='skip', 
            engine='python',
            usecols=lambda c: c in cols_to_keep,
            chunksize=chunk_size
        ):
            # Drop rows missing critical NLP text
            chunk = chunk.dropna(subset=['skills_cv', 'skills_vacancy', 'cv_status'])
            df_list.append(chunk)
            
            if sum(len(c) for c in df_list) >= 100000:
                break
                
    except Exception as e:
        print(f"Error reading file: {e}")
        return
        
    if not df_list:
        print("No valid data found!")
        return
        
    df = pd.concat(df_list, ignore_index=True)
    
    # We want a max of 100,000 rows
    if len(df) > 100000:
        df = df.sample(n=100000, random_state=42)
        
    print(f"Loaded {len(df)} rows. Normalizing target variable...")
    
    # Analyze target variable
    vals = df['cv_status'].dropna().unique()
    
    if len(vals) > 1:
        # Map the first unique value to 0 and the second to 1
        df['hired'] = (df['cv_status'] == vals[1]).astype(int)
    else:
        print("Warning: Only one or zero unique statuses found. Creating proxy target for demonstration...")
        df['hired'] = df['cv_status'].apply(lambda x: 1 if hash(str(x)) % 3 == 0 else 0)
        
    print(f"Positive samples (hired=1): {df['hired'].sum()} out of {len(df)}")
    
    print(f"Saving cleaned dataset to {output_path}...")
    df.to_csv(output_path, index=False)
    print("Data cleaning complete.")

if __name__ == '__main__':
    clean_data()
