class KMLConverter {
    constructor() {
        this.charMap = new Map();
        this.charMapCapital = new Map();
        this.selectedFile = null;
        this.convertedContent = null;
        
        // Arabic unit conversion constants
        this.ARABIC_UNITS = {
            FEDDAN_TO_M2: 4200.83,
            QIRAT_TO_SAHM: 24,
            SAHM_TO_M2: 7.293125
        };
        
        this.initializeCharMaps();
        this.initializeEventListeners();
    }

    initializeCharMaps() {
        // English lowercase characters
        const en = ['`', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'z', 'x', 'c', 'v', 'n', 'm', ',', '.', '/'];
        
        // English uppercase characters
        const enCapital = ['~', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', 'Z', 'X', 'C', 'V', 'N', 'M', '<', '>', '?'];
        
        // Arabic characters (same mapping as in the C# code)
        const ar = ['ذ', 'ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د', 'ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط', 'ئ', 'ء', 'ؤ', 'ر', 'ى', 'ة', 'و', 'ز', 'ظ'];

        // Create character mappings
        for (let i = 0; i < en.length; i++) {
            this.charMap.set(en[i], ar[i]);
            this.charMapCapital.set(enCapital[i], ar[i]);
        }

        // Initialize number mapping (Western to Eastern Arabic numerals)
        this.numberMap = new Map();
        this.numberMap.set('0', '٠');
        this.numberMap.set('1', '١');
        this.numberMap.set('2', '٢');
        this.numberMap.set('3', '٣');
        this.numberMap.set('4', '٤');
        this.numberMap.set('5', '٥');
        this.numberMap.set('6', '٦');
        this.numberMap.set('7', '٧');
        this.numberMap.set('8', '٨');
        this.numberMap.set('9', '٩');
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const convertBtn = document.getElementById('convertBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        // File selection
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // Convert button
        convertBtn.addEventListener('click', () => this.convertFile());

        // Download button
        downloadBtn.addEventListener('click', () => this.downloadFile());
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.kml')) {
            this.showStatus('يرجى اختيار ملف KML صحيح.', 'error');
            return;
        }

        this.selectedFile = file;
        this.displayFileInfo(file);
        this.enableConvertButton();
        this.hideStatus();
    }

    displayFileInfo(file) {
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const selectedFileDiv = document.getElementById('selectedFile');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        selectedFileDiv.classList.add('show');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    enableConvertButton() {
        document.getElementById('convertBtn').disabled = false;
        document.getElementById('downloadBtn').disabled = true;
    }

    async convertFile() {
        if (!this.selectedFile) {
            this.showStatus('يرجى اختيار ملف أولاً.', 'error');
            return;
        }

        try {
            this.showProgress();
            this.disableButtons();

            const content = await this.readFile(this.selectedFile);
            this.convertedContent = this.processKML(content);
            
            this.hideProgress();
            this.enableDownloadButton();
            this.showStatus('تم تحويل الملف بنجاح!', 'success');

        } catch (error) {
            this.hideProgress();
            this.enableConvertButton();
            this.showStatus(`خطأ: ${error.message}`, 'error');
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    processKML(content) {
        let conversionCount = 0;
        let processedLength = 0;
        const totalLength = content.length;

        // First pass - check with specific style pattern
        let pattern = /(<Placemark>\s*<name>)([^<]+)(<\/name>\s*<styleUrl>#TEXT[^<]*<\/styleUrl>)/g;
        let outputContent = content.replace(pattern, (match, prefix, name, suffix) => {
            const convertedName = this.convertName(name);
            conversionCount++;
            
            // Update progress
            processedLength += match.length;
            this.updateProgress((processedLength / totalLength) * 50);
            
            return prefix + convertedName + suffix;
        });

        // If no conversions were made, try the more general pattern
        if (conversionCount === 0) {
            this.updateProgress(50);
            processedLength = 0;
            
            pattern = /(<Placemark>\s*<name>)([^<]+)(<\/name>)/g;
            outputContent = content.replace(pattern, (match, prefix, name, suffix) => {
                const convertedName = this.convertName(name);
                conversionCount++;
                
                // Update progress for second 50%
                processedLength += match.length;
                this.updateProgress(50 + (processedLength / totalLength) * 50);
                
                return prefix + convertedName + suffix;
            });
        } else {
            this.updateProgress(100);
        }

        if (conversionCount === 0) {
            throw new Error('لم يتم العثور على أسماء مواقع للتحويل في الملف.');
        }

        return outputContent;
    }

    convertName(name) {
        if (!name || name.trim() === '') {
            return name;
        }

        // Check if the name starts with an asterisk to keep it without changes
        if (name.trim().startsWith('*')) {
            // For now, we'll always remove the asterisk as in the original code
            return name.trim().substring(1);
        }

        // Check if Arabic unit conversion is enabled
        const arabicUnitsEnabled = document.getElementById('arabicUnitsCheckbox').checked;
        
        // Process area conversion if enabled
        if (arabicUnitsEnabled) {
            name = this.processAreaConversion(name);
        }

        // Replace HTML entities with Arabic characters
        name = name.replace(/&gt;/g, 'ز');
        name = name.replace(/&lt;/g, 'و');
        name = name.replace(/&apos;/g, 'ط');

        // 1. Remove unnecessary underscores (keep if between numbers)
        name = name.replace(/(?<!\d)_(?!\d)/g, '');

        // 2. Convert inside parentheses (), then wrap the whole with RLE/PDF
        const convertInner = (inner) => {
            let result = '';
            for (let i = 0; i < inner.length; i++) {
                const char = inner[i];
                if (char.charCodeAt(0) >= 0x0600 && char.charCodeAt(0) <= 0x06FF) {
                    result += char;
                } else if (char === 'b' || char === 'B') {
                    result += 'لا';
                } else if (char === ',') {
                    result += 'و';
                } else if (char === '.') {
                    result += char;
                } else if (this.numberMap.has(char)) {
                    result += this.numberMap.get(char);
                } else if (this.charMap.has(char)) {
                    result += this.charMap.get(char);
                } else if (this.charMapCapital.has(char)) {
                    result += this.charMapCapital.get(char);
                } else {
                    result += char;
                }
            }
            return result;
        };

        // Only replace parenthesis substrings: ()
        name = name.replace(/\(([^)]*)\)/g, (match, inner) => {
            return '\u202B(' + convertInner(inner) + ')\u202C';
        });

        // Now convert the rest of the string (outside brackets)
        let convertedName = '';
        for (let i = 0; i < name.length; i++) {
            const char = name[i];
            if (char.charCodeAt(0) >= 0x0600 && char.charCodeAt(0) <= 0x06FF) {
                convertedName += char;
            } else if (char === 'b' || char === 'B') {
                convertedName += 'لا';
            } else if (char === ',') {
                convertedName += 'و';
            } else if (char === '.') {
                convertedName += char;
            } else if (this.numberMap.has(char)) {
                convertedName += this.numberMap.get(char);
            } else if (this.charMap.has(char)) {
                convertedName += this.charMap.get(char);
            } else if (this.charMapCapital.has(char)) {
                convertedName += this.charMapCapital.get(char);
            } else {
                convertedName += char;
            }
        }

        return convertedName;
    }

    processAreaConversion(name) {
        // Regex to match area patterns like "5000 m²", "5000 m^2", "5000 m%%142", etc.
        // Also matches variations with spaces and different formats
        const areaPattern = /(\d+(?:\.\d+)?)\s*(m\^?2|m%%142|m²|م²|م\^?2|m2|م2)/gi;
        
        return name.replace(areaPattern, (match, areaValue, unit) => {
            const area = parseFloat(areaValue);
            if (isNaN(area) || area <= 0) return match;
            
            const arabicConversion = this.convertToArabicUnits(area);
            if (!arabicConversion) return match;
            
            // Replace the unit with Arabic "م" and add the conversion
            return `${areaValue} م\n${arabicConversion}`;
        });
    }

    convertToArabicUnits(areaInM2) {
        try {
            // Convert to sahm first (smallest unit)
            const totalSahm = areaInM2 / this.ARABIC_UNITS.SAHM_TO_M2;
            
            // Convert to larger units
            const totalQirat = totalSahm / this.ARABIC_UNITS.QIRAT_TO_SAHM;
            const totalFeddan = totalQirat / 24; // 1 feddan = 24 qirat
            
            // Calculate whole units and remainders
            const feddan = Math.floor(totalFeddan);
            const remainingQirat = Math.floor(totalQirat - (feddan * 24));
            const remainingSahm = Math.floor(totalSahm - (feddan * 24 * this.ARABIC_UNITS.QIRAT_TO_SAHM) - (remainingQirat * this.ARABIC_UNITS.QIRAT_TO_SAHM));
            
            // Format with Arabic-Indic digits
            const parts = [];
            
            if (feddan > 0) {
                parts.push(`${this.toArabicDigits(feddan)} ف`);
            }
            if (remainingQirat > 0) {
                parts.push(`${this.toArabicDigits(remainingQirat)} ط`);
            }
            if (remainingSahm > 0) {
                parts.push(`${this.toArabicDigits(remainingSahm)} س`);
            }
            
            // If no conversion possible, return null
            if (parts.length === 0) {
                return null;
            }
            
            // Reverse the order to show feddan first, then qirat, then sahm
            return parts.reverse().join(' ');
        } catch (error) {
            console.error('Error converting to Arabic units:', error);
            return null;
        }
    }

    toArabicDigits(number) {
        return number.toString().replace(/[0-9]/g, (digit) => {
            return this.numberMap.get(digit) || digit;
        });
    }

    // Test method for debugging Arabic unit conversion
    testArabicUnitConversion() {
        const testCases = [
            { input: 5000, expected: '1 ف 4 ط 13 س' },
            { input: 10000, expected: '2 ف 15 ط 8 س' },
            { input: 1000, expected: '5 ط 12 س' },
            { input: 100, expected: '13 س' }
        ];

        console.log('Testing Arabic unit conversion:');
        testCases.forEach(testCase => {
            const result = this.convertToArabicUnits(testCase.input);
            console.log(`${testCase.input} m² -> ${result} (expected: ${testCase.expected})`);
        });
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        progressFill.style.width = `${Math.min(percentage, 100)}%`;
        progressText.textContent = `جاري المعالجة... ${Math.round(percentage)}%`;
    }

    showProgress() {
        document.getElementById('progressContainer').classList.add('show');
        this.updateProgress(0);
    }

    hideProgress() {
        document.getElementById('progressContainer').classList.remove('show');
    }

    disableButtons() {
        document.getElementById('convertBtn').disabled = true;
        document.getElementById('downloadBtn').disabled = true;
    }

    enableDownloadButton() {
        document.getElementById('downloadBtn').disabled = false;
    }

    downloadFile() {
        if (!this.convertedContent) {
            this.showStatus('لا يوجد محتوى محول للتحميل.', 'error');
            return;
        }

        const blob = new Blob([this.convertedContent], { type: 'application/vnd.google-earth.kml+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.selectedFile.name.replace('.kml', '_converted.kml');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status show ${type}`;
    }

    hideStatus() {
        document.getElementById('status').classList.remove('show');
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new KMLConverter();
}); 