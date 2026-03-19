import json
import re
import os

def anonymize_text(text):
    if not isinstance(text, str):
        return text
    
    # Phone numbers
    text = re.sub(r'\+?\d{1,4}[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', '555-0100', text)
    
    # Business Name (specific to the samples I saw)
    text = text.replace('Κυπριακόν', 'Anonymized Business')
    text = text.replace('Kypriakon', 'Anonymized Business')
    
    # Common Address parts
    text = text.replace('Old port, Λεμεσός 3042', '123 Anonymized St, City 1234')
    text = text.replace('Λεμεσός', 'Anonymized City')
    
    return text

def anonymize_recursive(data):
    if isinstance(data, dict):
        return {k: anonymize_recursive(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [anonymize_recursive(i) for i in data]
    elif isinstance(data, str):
        # Specific patterns in these JSON blobs
        # Reviews names usually follow a pattern in these nested lists
        # But for safety, let's just do bulk string replacements on the final dump
        return anonymize_text(data)
    else:
        return data

def process_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Bulk replacements for names found in greps/views
    names_to_anonymize = [
        "Lia Matykowska", "Vaios Gaintatzis", "Moze Karim", "chris muckley", 
        "Laia Vizcaino", "Катерина Морозова", "Georgios Georgallides", 
        "minulee100", "Vaios Gaintatzis", "Katerina Morozova"
    ]
    
    for name in names_to_anonymize:
        content = content.replace(name, "Anonymized User")

    # Business name
    content = content.replace('Κυπριακόν', 'Anonymized Business')
    content = content.replace('Kypriakon', 'Anonymized Business')
    
    # Address
    content = content.replace('Old port, Λεμεσός 3042', '123 Anonymized St, City 1234')
    
    # Phone (regex)
    content = re.sub(r'\b\d{2,4}[-\s]?\d{2,4}[-\s]?\d{3,4}\b', '555-0100', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

testdata_dir = r"c:\Users\pacc1\Documents\Antigravity\VGVX - NOVA\google-maps-scraper-main\testdata"
files = ["output.json", "panic.json", "panic2.json", "raw.json", "raw2.json"]

for filename in files:
    path = os.path.join(testdata_dir, filename)
    if os.path.exists(path):
        process_file(path)
    else:
        print(f"File {path} not found.")

print("Anonymization complete.")
