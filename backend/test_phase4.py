import httpx
import time
import sys

BASE_URL = "http://localhost:8000/v1"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRfaWQiOiIxYjk5YzdkNy1lZTU1LTQ2ZDktYTMxOC1kZWJhMWIwOGMzNjMiLCJleHAiOjE3NzgxMTc2NTF9.181sUHMzNcSusnmI60Izrk6isuK-UqcUQMLQOGNKt14"
SCHEMA_ID = "521ef325-ed20-429e-8acd-47a745ae20cf"
FILE_PATH = "/Users/krishianjanlanka/Downloads/synthetic_prescription_dataset/images.pdf/prescription_3.png"

headers = {"Authorization": f"Bearer {TOKEN}"}

def upload_and_process():
    print(f"Uploading {FILE_PATH}...")
    with open(FILE_PATH, "rb") as f:
        files = {"file": ("prescription_3.png", f, "image/png")}
        resp = httpx.post(f"{BASE_URL}/upload", headers=headers, files=files, timeout=60)
    
    if resp.status_code != 202:
        print(f"Upload failed: {resp.text}")
        return
    
    data = resp.json()
    doc_id = data["doc_id"]
    print(f"Upload successful. Doc ID: {doc_id}")
    
    print(f"Linking schema {SCHEMA_ID}...")
    link_resp = httpx.post(f"{BASE_URL}/extraction/{doc_id}/link-schema/{SCHEMA_ID}", headers=headers)
    print(f"Link schema status: {link_resp.status_code}")
    
    print("Waiting for processing...")
    for _ in range(60):
        status_resp = httpx.get(f"{BASE_URL}/documents/{doc_id}/status", headers=headers)
        status_data = status_resp.json()
        status = status_data["status"]
        print(f"Current status: {status}")
        
        if status == "READY":
            print("Processing complete! Fetching extraction results...")
            ext_resp = httpx.get(f"{BASE_URL}/extraction/{doc_id}", headers=headers)
            print("--- EXTRACTION RESULTS ---")
            print(ext_resp.text)
            return
        elif status == "FAILED":
            print(f"Processing failed: {status_data.get('error_message')}")
            return
        
        time.sleep(10)
    
    print("Timed out waiting for processing.")

if __name__ == "__main__":
    upload_and_process()
