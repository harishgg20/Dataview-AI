
import os

target_file = "c:/Users/haris/Downloads/Data Analyst/analytics-platform/backend/app/api/v1/data_sources.py"
temp_file = "c:/Users/haris/.gemini/antigravity/brain/ee4644af-fa33-47c2-89eb-fba1a2a79874/temp_query_endpoint.py"

# Read the first 482 lines of the target file
try:
    with open(target_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        valid_lines = lines[:482]
except Exception as e:
    print(f"Error reading target file: {e}")
    exit(1)

# Read the new content
try:
    with open(temp_file, 'r', encoding='utf-8') as f:
        new_content = f.read()
except Exception as e:
    print(f"Error reading temp file: {e}")
    exit(1)

# Write back combined content
try:
    with open(target_file, 'w', encoding='utf-8') as f:
        f.writelines(valid_lines)
        f.write("\n")
        f.write(new_content)
    print("Successfully repaired data_sources.py")
except Exception as e:
    print(f"Error writing to target file: {e}")
    exit(1)
