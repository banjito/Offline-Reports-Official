#!/usr/bin/env python3
"""
Extract report template data from web app React components
and generate a TypeScript mapping file for the desktop app.
"""

import os
import re
import json

REPORTS_DIR = "/Users/cohn/ampOS/Active-Website-Software-master/src/components/reports"
OUTPUT_FILE = "/Users/cohn/ampOS/field-tech-desktop/src/data/reportTemplatesGenerated.ts"

def extract_visual_inspection(content):
    """Extract visual inspection items from setFormData initial state"""
    # Find visualInspectionItems array in initial state
    pattern = r'visualInspectionItems:\s*\[(.*?)\](?=,\s*(?:ins|cont|diel|test|comments|temp|nameplate))'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return []
    
    items_str = match.group(1)
    # Extract individual items
    item_pattern = r'\{\s*id:\s*[\'"]([^\'"]+)[\'"],\s*description:\s*[\'"]([^\'"]+)[\'"],\s*result:\s*[\'"]([^\'"]*)[\'"]'
    items = re.findall(item_pattern, items_str)
    
    return [{'id': id, 'description': desc, 'result': result or 'Select One'} 
            for id, desc, result in items]

def extract_report_slug(content):
    """Extract the report slug from reportSlug variable"""
    pattern = r'reportSlug\s*=\s*[\'"]([^\'\"]+)[\'"]'
    match = re.search(pattern, content)
    return match.group(1) if match else None

def process_report_file(filepath):
    """Process a single report file and extract template data"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    slug = extract_report_slug(content)
    if not slug:
        return None
    
    visual_inspection = extract_visual_inspection(content)
    
    data = {
        'slug': slug,
        'visual_mechanical': {
            'items': visual_inspection
        } if visual_inspection else None
    }
    
    return data

def generate_typescript_file(templates_data):
    """Generate the TypeScript file with all templates"""
    pass

# Main
print("Extracting report templates...")
templates = []

for filename in os.listdir(REPORTS_DIR):
    if filename.endswith('Report.tsx'):
        filepath = os.path.join(REPORTS_DIR, filename)
        print(f"Processing {filename}...")
        data = process_report_file(filepath)
        if data:
            templates.append(data)
            print(f"  ✓ Extracted: {data['slug']}")

print(f"\nExtracted {len(templates)} templates")
print(json.dumps(templates[:2], indent=2))
