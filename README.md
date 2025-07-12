# KML Arabic Converter

A modern web application that converts English text to Arabic in KML files using QWERTY keyboard mapping, with optional Arabic unit conversion for area measurements.

## 🌟 Features

- **📁 File Upload**: Drag & drop or click to select KML files
- **🔤 Character Mapping**: Converts English letters to Arabic keyboard equivalents
- **📏 Arabic Unit Conversion**: Optional conversion of area units (m²) to Arabic units (سهم، قيراط، فدان)
- **🔢 Number Conversion**: Converts Western numerals to Arabic-Indic digits (١,٢,٣)
- **📊 Progress Tracking**: Real-time conversion progress indicator
- **🌐 Browser-Based**: Works entirely in the browser - no server required
- **🎨 Modern UI**: Clean, responsive design with Arabic RTL support
- **🔒 Privacy-First**: All processing happens locally - no data sent to servers

## 🚀 Quick Start

1. **Upload**: Drag & drop a KML file or click to browse
2. **Configure**: Optionally enable Arabic unit conversion
3. **Convert**: Click "تحويل KML" to process the file
4. **Download**: Save the converted KML file

## 📋 Character Mapping

The application uses QWERTY keyboard mapping to convert English characters to Arabic:

| English | Arabic | English | Arabic | English | Arabic |
|---------|--------|---------|--------|---------|--------|
| `e` | `ث` | `r` | `ق` | `t` | `ف` |
| `y` | `غ` | `u` | `ع` | `i` | `ه` |
| `o` | `خ` | `p` | `ح` | `a` | `ش` |
| `s` | `س` | `d` | `ي` | `f` | `ب` |
| `g` | `ل` | `h` | `ا` | `j` | `ت` |
| `k` | `ن` | `l` | `م` | `z` | `ئ` |
| `x` | `ء` | `c` | `ؤ` | `v` | `ر` |
| `n` | `ى` | `m` | `ة` | `b`/`B` | `لا` |
| `,` | `و` | `.` | `.` | - | - |

**Special Cases:**
- `.` (period) is preserved unchanged (for decimal numbers)
- Arabic text is kept unchanged
- Numbers are converted to Arabic-Indic digits

## 📏 Arabic Unit Conversion

When enabled, the application automatically detects and converts area measurements in placemark names.

### Supported Formats
- `5000 m²`
- `5000 m^2`
- `5000 m2`
- `5000 m%%142`
- `2500 م²`

### Conversion Rules
- **1 فدان (feddan)** = 4200.83 m²
- **1 قيراط (qirat)** = 24 سهم (sahm)
- **1 سهم (sahm)** = 7.293125 m²

### Output Format
The original value is replaced with Arabic "م" unit, followed by the conversion in Arabic-Indic digits.

**Example:**
```
Input:  "Area: 5000 m²"
Output: "Area: 5000 م
        1 ف 4 ط 13 س"
```

## 🛠️ Installation & Usage

### Local Development
1. Clone or download the project files
2. Open `index.html` in a web browser
3. Start converting KML files immediately

## 📁 Project Structure

```
Sosa Converter/
├── index.html          # Main application interface
├── converter.js        # Core conversion logic
├── style.css           # Application styling
├── sample.kml          # Sample KML file for testing
└── README.md          # Project documentation
```

## 🧪 Testing

Use the included `sample.kml` file to test the application:

1. Upload `sample.kml`
2. Enable Arabic unit conversion
3. Convert and verify the results
4. Check that area values are properly converted

## 🌐 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 60+ | ✅ Supported |
| Firefox | 55+ | ✅ Supported |
| Safari | 12+ | ✅ Supported |
| Edge | 79+ | ✅ Supported |

## 🔧 Technical Details

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **File Processing**: FileReader API for KML parsing
- **Character Encoding**: UTF-8 support for Arabic text
- **Responsive Design**: Mobile-friendly interface
- **Progressive Enhancement**: Works without JavaScript (basic functionality)

## 🔒 Security & Privacy

- **Local Processing**: All file operations happen in the browser
- **No Data Transmission**: Files are never sent to external servers
- **No Storage**: No data is stored or cached
- **Offline Capable**: Works without internet connection after initial load

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with modern web standards
- Designed for Arabic-speaking users
- Optimized for KML file processing

---

**Made with ❤️ for the Arabic-speaking community** 