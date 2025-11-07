import csv
import re

# Read the original CSV
input_file = 'public/sample-alumni.csv'
output_file = 'public/sample-alumni-fixed.csv'

with open(input_file, 'r', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)
    rows = list(reader)

# Fix the photo paths
for row in rows:
    photo_path = row['photo_file']
    
    # Remove leading/trailing quotes and spaces
    photo_path = photo_path.strip().strip("'").strip('"')
    
    # Extract just the filename portion after /photos/
    if photo_path and '/photos/' in photo_path:
        # Get everything after /photos/
        match = re.search(r'/photos/(.+)$', photo_path)
        if match:
            relative_path = match.group(1)
            row['photo_file'] = f'/photos/{relative_path}'
        else:
            row['photo_file'] = ''
    elif photo_path:
        # If it doesn't contain /photos/, clear it
        row['photo_file'] = ''

# Write the fixed CSV
with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
    fieldnames = ['first_name', 'middle_name', 'last_name', 'class_role', 'grad_year', 'grad_date', 'photo_file']
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    
    writer.writeheader()
    writer.writerows(rows)

print(f"✅ Fixed CSV saved to: {output_file}")
print(f"✅ Processed {len(rows)} alumni records")
