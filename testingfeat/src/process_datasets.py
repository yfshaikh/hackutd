import argparse
import os
from typing import List
import pandas as pd
from tqdm import tqdm
from .gemini_client import analyze_transcript
from .scoring import clamp_and_label

REQUIRED_COLUMNS = [
    "call_id", "city", "state", "category", "subcategory",
    "total_seconds", "resolution", "transcript"
]

def find_csvs(path: str) -> List[str]:
    if os.path.isdir(path):
        return sorted(
            [os.path.join(path, f) for f in os.listdir(path) if f.endswith(".csv")]
        )
    if os.path.isfile(path) and path.endswith(".csv"):
        return [path]
    raise FileNotFoundError(f"No CSVs found at: {path}")

def process_one(csv_path: str, out_dir: str):
    df = pd.read_csv(csv_path)
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"{csv_path} missing required columns: {missing}")

    results = []
    for _, row in tqdm(df.iterrows(), total=len(df), desc=os.path.basename(csv_path)):
        transcript = str(row["transcript"]).strip()
        if not transcript:
            results.append({"csat_1_5": 3, "sentiment_score": 0.0, "sentiment_label": "neutral"})
            continue

        # Call Gemini to analyze this transcript
        data = analyze_transcript(transcript)

        # Final clamps / reconciliation
        data = clamp_and_label(data)
        results.append(data)

    scored = pd.concat([df.reset_index(drop=True), pd.DataFrame(results)], axis=1)
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.splitext(os.path.basename(csv_path))[0]
    out_path = os.path.join(out_dir, f"{base}__scored.csv")
    scored.to_csv(out_path, index=False)
    print(f"Wrote: {out_path}")

def main():
    parser = argparse.ArgumentParser(description="Score CSAT & sentiment with Gemini.")
    parser.add_argument("--input", required=True, help="Path to a CSV file or a folder containing CSVs.")
    parser.add_argument("--out", default="out", help="Output folder for scored CSVs.")
    args = parser.parse_args()

    csvs = find_csvs(args.input)
    for csv_path in csvs:
        process_one(csv_path, args.out)

if __name__ == "__main__":
    main()
