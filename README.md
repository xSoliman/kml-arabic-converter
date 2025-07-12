# KML Arabic Converter

A simple web application that converts English letters to Arabic in KML files based on QWERTY keyboard mapping. This is a web version of the Sosa Converter that works entirely in the browser.

## Features

- **File Upload**: Drag & drop or click to select KML files
- **Character Mapping**: Converts English letters to their Arabic keyboard equivalents
- **Arabic Unit Conversion**: Optional feature to convert area units (m²) to Arabic units (سهم، قيراط، فدان)
- **Decimal Preservation**: Keeps commas (,) and periods (.) unchanged to preserve decimal numbers
- **Progress Tracking**: Shows conversion progress in real-time
- **No Server Required**: Works entirely in the browser
- **Free Deployment**: Can be deployed on free hosting platforms

## Character Mapping

The app uses the same character mapping as the original Sosa Converter:

- `e` → `ث`
- `r` → `ق`
- `t` → `ف`
- `y` → `غ`
- `u` → `ع`
- `i` → `ه`
- `o` → `خ`
- `p` → `ح`
- `a` → `ش`
- `s` → `س`
- `d` → `ي`
- `f` → `ب`
- `g` → `ل`
- `h` → `ا`
- `j` → `ت`
- `k` → `ن`
- `l` → `م`
- `z` → `ئ`
- `x` → `ء`
- `c` → `ؤ`
- `v` → `ر`
- `n` → `ى`
- `m` → `ة`
- `b`/`B` → `لا` (special case)
- `,` and `.` → preserved (unchanged)

## How to Use

1. **Upload KML File**: Click the upload area or drag & drop a KML file
2. **Enable Arabic Unit Conversion** (Optional): Check the checkbox to convert area units to Arabic units
3. **Convert**: Click the "Convert KML" button to process the file
4. **Download**: Click "Download Converted File" to save the result

## Arabic Unit Conversion

When enabled, the app will automatically detect and convert area values in placemark names:

- **Supported Formats**: `5000 m²`, `5000 m^2`, `5000 m2`, `5000 m%%142`, etc.
- **Conversion Rules**:
  - 1 فدان (feddan) = 4200.83 m²
  - 1 قيراط (qirat) = 24 سهم (sahm)
  - 1 سهم (sahm) = 7.293125 m²
- **Output Format**: Shows the original value with Arabic "م" unit, followed by the conversion in Arabic-Indic digits
- **Example**: `5000 m²` becomes `5000 م\n1 ف 4 ط 13 س`

## Local Development

1. Clone or download the files
2. Open `index.html` in a web browser
3. The app will work immediately - no server setup required

## Free Deployment Options

### Option 1: GitHub Pages (Recommended)

1. Create a new GitHub repository
2. Upload the files (`index.html`, `converter.js`, `README.md`)
3. Go to repository Settings → Pages
4. Select "Deploy from a branch" and choose "main" branch
5. Your app will be available at `https://yourusername.github.io/repository-name`

### Option 2: Netlify

1. Go to [netlify.com](https://netlify.com) and sign up (free)
2. Drag & drop the folder containing your files
3. Your app will be deployed instantly with a unique URL

### Option 3: Vercel

1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Import your GitHub repository or upload files
3. Deploy with one click

## File Structure

```
kml-converter/
├── index.html          # Main HTML file
├── converter.js        # JavaScript conversion logic
├── style.css           # CSS styling
├── sample.kml          # Sample KML file for testing
└── README.md          # This file
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Technical Details

- **No Backend**: All processing happens in the browser using JavaScript
- **No Database**: No data is stored or transmitted
- **File Processing**: Uses FileReader API to read KML files
- **Character Mapping**: Implements the same logic as the original C# application
- **Progress Tracking**: Simulates progress based on file processing

## Security

- Files are processed locally in the browser
- No data is sent to any server
- No personal information is collected
- Works offline after initial load

## License

This project is open source and available under the MIT License. 