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
            SAHM_TO_M2: 7.29
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
        const excelBtn = document.getElementById('excelBtn');

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

        // Excel export button
        excelBtn.addEventListener('click', () => this.exportExcel());
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
        document.getElementById('excelBtn').disabled = false;
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
            if (isNaN(area) || area <= 0) return '';

            const arabicConversion = this.convertToArabicUnits(area, true);
            if (!arabicConversion) return '';
            // Reverse parentheses for KML: )content(, with RLE/PDF for correct RTL display
            return '\u202B)' + arabicConversion + '(\u202C';
        });
    }

    convertToArabicUnits(areaInM2, forceArabic = true) {
        try {
            // Always use Arabic for KML conversion (forceArabic=true)
            // Only use lang for UI/side conversion (forceArabic=false)
            const lang = (!forceArabic && typeof getCurrentLang === 'function') ? getCurrentLang() : 'ar';
            // Constants
            const FEDDAN_TO_M2 = this.ARABIC_UNITS.FEDDAN_TO_M2;
            const QIRAT_TO_SAHM = this.ARABIC_UNITS.QIRAT_TO_SAHM;
            const FEDDAN_TO_QIRAT = 24;
            const SAHM_PER_FEDDAN = QIRAT_TO_SAHM * FEDDAN_TO_QIRAT;
            const SAHM_TO_M2 = FEDDAN_TO_M2 / SAHM_PER_FEDDAN;
            // Calculations
            let totalSahm = areaInM2 / SAHM_TO_M2;
            let feddan = Math.floor(totalSahm / SAHM_PER_FEDDAN);
            let remainingSahmAfterFeddan = totalSahm - (feddan * SAHM_PER_FEDDAN);
            let qirat = Math.floor(remainingSahmAfterFeddan / QIRAT_TO_SAHM);
            let sahm = remainingSahmAfterFeddan - (qirat * QIRAT_TO_SAHM);
            let sahmDisplay = Math.round(sahm * 100) / 100;
            // Always output Arabic units and numerals for KML
            if (lang === 'en' && !forceArabic) {
                const parts = [];
                if (feddan > 0) parts.push(`${feddan}F`);
                if (qirat > 0) parts.push(`${qirat}Q`);
                if (sahmDisplay > 0 || parts.length === 0) {
                    parts.push(`${sahmDisplay}S`);
                }
                return parts.join('  '); // two spaces between units
            } else {
                // Arabic-Indic digits, Arabic letters
                const toArabicDigits = (number) => number.toString().replace(/[0-9.]/g, (char) => {
                    if (char === '.') return '٫';
                    return this.numberMap.get(char) || char;
                });
                // Order: Sahm (س), Qirat (ط), Feddan (ف)
                const parts = [];
                if (sahmDisplay > 0 || (feddan === 0 && qirat === 0)) parts.push(`${toArabicDigits(sahmDisplay)}س`);
                if (qirat > 0) parts.push(`${toArabicDigits(qirat)}ط`);
                if (feddan > 0) parts.push(`${toArabicDigits(feddan)}ف`);
                return parts.join(' ');
            }
        } catch (error) {
            return null;
        }
    }

    toArabicDigits(number) {
        // Convert Western digits to Arabic-Indic and '.' to Arabic decimal separator
        return number.toString().replace(/[0-9.]/g, (char) => {
            if (char === '.') return '٫'; // Arabic decimal separator
            return this.numberMap.get(char) || char;
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
        document.getElementById('excelBtn').disabled = true;
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

    // --- Excel Export Feature ---
    exportExcel() {
        if (!this.selectedFile) {
            this.showStatus('يرجى اختيار ملف أولاً.', 'error');
            return;
        }
        this.readFile(this.selectedFile).then(content => {
            const placemarks = this.extractPlacemarksAdvanced(content);
            if (!placemarks.length) {
                this.showStatus('لم يتم العثور على بيانات في الملف.', 'error');
                return;
            }
            // Determine max number of coordinate pairs
            let maxCoords = 0;
            placemarks.forEach(pm => {
                if (pm.coordsArray.length > maxCoords) maxCoords = pm.coordsArray.length;
            });
            // Build header rows
            const header1 = [
                'رقم القطعة',
                'المساحة بالمتر المربع',
                'المساحة', '', '', // سهم, قيراط, فدان (merged under المساحة)
            ];
            for (let i = 0; i < maxCoords; i++) {
                header1.push('الاحداثيات');
                header1.push('');
            }
            const header2 = [
                '', '', 'سهم', 'قيراط', 'فدان'
            ];
            for (let i = 0; i < maxCoords; i++) {
                header2.push('N');
                header2.push('E');
            }
            // Data rows
            const data = [header1, header2];
            placemarks.forEach((pm, idx) => {
                const row = [
                    (idx + 1).toString(),
                    pm.areaM2,
                    pm.sahm,
                    pm.qirat,
                    pm.feddan
                ];
                for (let i = 0; i < maxCoords; i++) {
                    if (pm.coordsArray[i]) {
                        row.push(pm.coordsArray[i].lat);
                        row.push(pm.coordsArray[i].lng);
                    } else {
                        row.push('');
                        row.push('');
                    }
                }
                data.push(row);
            });
            // Create worksheet and workbook
            const ws = XLSX.utils.aoa_to_sheet(data);
            // Merge cells for 'المساحة' header
            ws['!merges'] = ws['!merges'] || [];
            ws['!merges'].push({ s: { r: 0, c: 2 }, e: { r: 0, c: 4 } });
            // Merge each 'الاحداثيات' header
            for (let i = 0; i < maxCoords; i++) {
                ws['!merges'].push({ s: { r: 0, c: 5 + i * 2 }, e: { r: 0, c: 6 + i * 2 } });
            }
            // Style all headers (bold, centered)
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let R = 0; R <= 1; ++R) {
                for (let C = 0; C <= range.e.c; ++C) {
                    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                    if (cell) {
                        cell.s = {
                            font: { bold: true },
                            alignment: { horizontal: 'center', vertical: 'center' },
                            border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
                        };
                    }
                }
            }
            // Style all data rows (centered)
            for (let R = 2; R <= range.e.r; ++R) {
                for (let C = 0; C <= range.e.c; ++C) {
                    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                    if (cell) {
                        cell.s = {
                            alignment: { horizontal: 'center', vertical: 'center' },
                            border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
                        };
                    }
                }
            }
            // Set column widths for better appearance
            ws['!cols'] = [
                { wch: 12 }, // رقم القطعة
                { wch: 18 }, // المساحة بالمتر المربع
                { wch: 8 },  // سهم
                { wch: 8 },  // قيراط
                { wch: 8 },  // فدان
            ];
            for (let i = 0; i < maxCoords; i++) {
                ws['!cols'].push({ wch: 12 }); // N
                ws['!cols'].push({ wch: 12 }); // E
            }
            // Create workbook and export
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Placemarks');
            XLSX.writeFile(wb, this.selectedFile.name.replace(/\.kml$/i, '_placemarks.xlsx'));
            this.showStatus('تم تصدير البيانات إلى Excel بنجاح!', 'success');
        }).catch(() => {
            this.showStatus('حدث خطأ أثناء قراءة الملف.', 'error');
        });
    }

    extractPlacemarksAdvanced(content) {
        // Parse KML XML
        const parser = new DOMParser();
        const xml = parser.parseFromString(content, 'text/xml');
        const placemarkNodes = xml.getElementsByTagName('Placemark');
        const placemarks = [];
        for (let i = 0; i < placemarkNodes.length; i++) {
            const pm = placemarkNodes[i];
            // Area extraction
            let areaM2 = '';
            let sahm = '', qirat = '', feddan = '';
            const name = pm.getElementsByTagName('name')[0]?.textContent || '';
            const description = pm.getElementsByTagName('description')[0]?.textContent || '';
            const areaPattern = /(\d+(?:\.\d+)?)\s*(m\^?2|m%%142|m²|م²|م\^?2|m2|م2)/i;
            let areaMatch = name.match(areaPattern) || description.match(areaPattern);
            if (areaMatch) {
                areaM2 = areaMatch[1];
                const arabic = this.convertToArabicUnits(parseFloat(areaM2), true);
                // Parse arabic units string: "س ... ط ... ف"
                if (arabic) {
                    const parts = arabic.split(' ');
                    sahm = parts.find(p => p.includes('س')) || '';
                    qirat = parts.find(p => p.includes('ط')) || '';
                    feddan = parts.find(p => p.includes('ف')) || '';
                }
            }
            // Coordinates extraction (support Point and Polygon)
            let coordsArray = [];
            // Point
            const point = pm.getElementsByTagName('Point')[0];
            if (point) {
                const coordsText = point.getElementsByTagName('coordinates')[0]?.textContent.trim() || '';
                if (coordsText) {
                    const [lng, lat] = coordsText.split(',').map(x => x.trim());
                    coordsArray.push({ lat, lng });
                }
            }
            // Polygon
            const polygon = pm.getElementsByTagName('Polygon')[0];
            if (polygon) {
                const coordsText = polygon.getElementsByTagName('coordinates')[0]?.textContent.trim() || '';
                if (coordsText) {
                    const pairs = coordsText.split(/\s+/);
                    pairs.forEach(pair => {
                        const [lng, lat] = pair.split(',').map(x => x.trim());
                        if (lat && lng) coordsArray.push({ lat, lng });
                    });
                }
            }
            placemarks.push({
                areaM2,
                sahm,
                qirat,
                feddan,
                coordsArray
            });
        }
        return placemarks;
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

// --- Language Switch Logic ---
const translations = {
    ar: {
        title: 'محول KML العربي',
        subtitle: 'تحويل الحروف الإنجليزية إلى العربية في ملفات KML',
        uploadText: 'انقر لاختيار أو اسحب وأفلت ملف KML',
        convertBtn: 'تحويل KML',
        downloadBtn: 'تحميل الملف المحول',
        excelBtn: 'تحويل لملف excel وتحميله',
        areaOption: 'تحويل وحدات المساحة',
        areaOptionSmall: 'تحويل (م²) إلى الوحدات العربية (سهم، قيراط، فدان)',
        progress: 'جاري المعالجة...',
        statusNoFile: 'يرجى اختيار ملف أولاً.',
        statusNoKML: 'يرجى اختيار ملف KML صحيح.',
        statusSuccess: 'تم تحويل الملف بنجاح!',
        statusNoContent: 'لا يوجد محتوى محول للتحميل.',
        sideTitle: 'حساب المساحة من متر مربع إلى الوحدات العربية',
        sideLabelM2: 'متر مربع (m²)',
        sideLabelDecimal: 'فدان عشري',
        sideLabelArabic: 'الوحدات العربية',
        sidePlaceholderM2: 'المساحة بالمتر المربع',
        sidePlaceholderDecimal: 'فدان (عشري)',
        sidePlaceholderFeddan: 'فدان',
        sidePlaceholderQirat: 'قيراط',
        sidePlaceholderSahm: 'سهم',
        infoHow: 'كيف يعمل:',
        infoStep1: 'الخطوة الأولى: قم برفع ملف KML يحتوي على أسماء المواقع باللغة الإنجليزية',
        infoStep2: 'الخطوة الثانية: اختر تحويل وحدات المساحة (اختياري) إذا كنت تريد تحويل وحدات المساحة إلى الوحدات العربية',
        infoStep3: 'الخطوة الثالثة: اضغط على "تحويل KML" لبدء عملية التحويل',
        infoStep4: 'الخطوة الرابعة: قم بتحميل ملف KML المحول جاهز لـ Google Earth',
        infoFeatures: 'ميزات التحويل:',
        infoF1: 'تحويل الحروف الإنجليزية إلى ما يعادلها في لوحة المفاتيح العربية',
        infoF2: 'الحفاظ على النص العربي الموجود كما هو دون تغيير',
        infoF3: 'تحويل الأرقام الغربية (1,2,3) إلى الأرقام العربية الشرقية (١,٢,٣)',
        infoF4: 'تحويل الفواصل (,) إلى (و) والحفاظ على النقاط (.) للأرقام العشرية',
        infoF5: 'تحويل وحدات المساحة: تحويل (م²) إلى الوحدات العربية (سهم، قيراط، فدان)',
        infoExamples: 'أمثلة على التحويل:',
        infoE1: 'Area: 5000 m² → Area: (١ ف ٤ ط ١٣٫٦٠ س)',
        infoE2: 'Building A → Building A (النص العربي يبقى كما هو)',
        infoE3: '123 Main St → ١٢٣ Main St',
        langBtn: '🌐 English',
        dir: 'rtl',
        lang: 'ar',
    },
    en: {
        title: 'KML Arabic Converter',
        subtitle: 'Convert English letters to Arabic in KML files',
        uploadText: 'Click to select or drag & drop a KML file',
        convertBtn: 'Convert KML',
        downloadBtn: 'Download Converted File',
        excelBtn: 'Convert to Excel & Download',
        areaOption: 'Convert Area Units',
        areaOptionSmall: 'Convert (m²) to Arabic units (Sahm, Qirat, Feddan)',
        progress: 'Processing...',
        statusNoFile: 'Please select a file first.',
        statusNoKML: 'Please select a valid KML file.',
        statusSuccess: 'File converted successfully!',
        statusNoContent: 'No converted content to download.',
        sideTitle: 'Convert Area from m² to Arabic Units',
        sideLabelM2: 'Square Meter (m²)',
        sideLabelDecimal: 'Decimal Feddan',
        sideLabelArabic: 'Arabic Units',
        sidePlaceholderM2: 'Area in m²',
        sidePlaceholderDecimal: 'Feddan (Decimal)',
        sidePlaceholderFeddan: 'Feddan',
        sidePlaceholderQirat: 'Qirat',
        sidePlaceholderSahm: 'Sahm',
        infoHow: 'How it works:',
        infoStep1: 'Step 1: Upload a KML file with place names in English',
        infoStep2: 'Step 2: Choose area unit conversion (optional) if you want to convert area units to Arabic units',
        infoStep3: 'Step 3: Click "Convert KML" to start the conversion',
        infoStep4: 'Step 4: Download the converted KML file ready for Google Earth',
        infoFeatures: 'Conversion Features:',
        infoF1: 'Convert English letters to their Arabic keyboard equivalents',
        infoF2: 'Keep existing Arabic text unchanged',
        infoF3: 'Convert Western digits (1,2,3) to Eastern Arabic digits (١,٢,٣)',
        infoF4: 'Convert commas (,) to (و) and keep dots (.) for decimals',
        infoF5: 'Area unit conversion: Convert (m²) to Arabic units (Sahm, Qirat, Feddan)',
        infoExamples: 'Conversion Examples:',
        infoE1: 'Area: 5000 m² → Area: (١ ف ٤ ط ١٣٫٦٠ س)',
        infoE2: 'Building A → Building A (Arabic text remains unchanged)',
        infoE3: '123 Main St → ١٢٣ Main St',
        langBtn: '🌐 العربية',
        dir: 'ltr',
        lang: 'en',
    }
};

function setLanguage(lang) {
    const t = translations[lang];
    document.documentElement.lang = t.lang;
    document.documentElement.dir = t.dir;
    document.querySelector('.main-title').textContent = t.title;
    document.querySelector('.subtitle').textContent = t.subtitle;
    document.querySelector('.upload-text').textContent = t.uploadText;
    document.getElementById('convertBtn').textContent = t.convertBtn;
    document.getElementById('downloadBtn').textContent = t.downloadBtn;
    document.getElementById('excelBtn').textContent = t.excelBtn;
    document.querySelector('.option-text strong').textContent = t.areaOption;
    document.querySelector('.option-text small').textContent = t.areaOptionSmall;
    document.getElementById('progressText').textContent = t.progress;
    document.querySelector('.side-title').textContent = t.sideTitle;

    // Update placeholders and labels for new inputs
    const inputM2 = document.getElementById('inputM2');
    const inputDecimalFeddan = document.getElementById('inputDecimalFeddan');
    const inputFeddan = document.getElementById('inputFeddan');
    const inputQirat = document.getElementById('inputQirat');
    const inputSahm = document.getElementById('inputSahm');

    if (inputM2) {
        inputM2.placeholder = t.sidePlaceholderM2;
        inputM2.previousElementSibling.textContent = t.sideLabelM2;
    }
    if (inputDecimalFeddan) {
        inputDecimalFeddan.placeholder = t.sidePlaceholderDecimal;
        inputDecimalFeddan.previousElementSibling.textContent = t.sideLabelDecimal;
    }
    if (inputFeddan) {
        inputFeddan.placeholder = t.sidePlaceholderFeddan;
        inputFeddan.nextElementSibling.textContent = t.sidePlaceholderFeddan;
        // Update the main label for Arabic Units group
        inputFeddan.closest('.fqs-inputs').previousElementSibling.textContent = t.sideLabelArabic;
    }
    if (inputQirat) {
        inputQirat.placeholder = t.sidePlaceholderQirat;
        inputQirat.nextElementSibling.textContent = t.sidePlaceholderQirat;
    }
    if (inputSahm) {
        inputSahm.placeholder = t.sidePlaceholderSahm;
        inputSahm.nextElementSibling.textContent = t.sidePlaceholderSahm;
    }
    // Update language toggle UI
    const langAr = document.getElementById('langAr');
    const langEn = document.getElementById('langEn');
    if (lang === 'ar') {
        langAr.classList.add('active');
        langEn.classList.remove('active');
    } else {
        langAr.classList.remove('active');
        langEn.classList.add('active');
    }
    document.getElementById('langSwitchBtn').setAttribute('aria-label', lang === 'ar' ? 'تبديل اللغة إلى الإنجليزية' : 'Switch language to Arabic');
    // Info section
    const info = document.querySelector('.info');
    info.querySelector('h3').textContent = t.infoHow;
    const infoLis = info.querySelectorAll('ul')[0].querySelectorAll('li');
    infoLis[0].innerHTML = `<strong>${t.infoStep1.split(':')[0]}:</strong> ${t.infoStep1.split(':')[1]}`;
    infoLis[1].innerHTML = `<strong>${t.infoStep2.split(':')[0]}:</strong> ${t.infoStep2.split(':')[1]}`;
    infoLis[2].innerHTML = `<strong>${t.infoStep3.split(':')[0]}:</strong> ${t.infoStep3.split(':')[1]}`;
    infoLis[3].innerHTML = `<strong>${t.infoStep4.split(':')[0]}:</strong> ${t.infoStep4.split(':')[1]}`;
    info.querySelector('h4').textContent = t.infoFeatures;
    const featuresLis = info.querySelectorAll('ul')[1].querySelectorAll('li');
    featuresLis[0].textContent = t.infoF1;
    featuresLis[1].textContent = t.infoF2;
    featuresLis[2].textContent = t.infoF3;
    featuresLis[3].textContent = t.infoF4;
    featuresLis[4].innerHTML = `<strong>${t.infoF5.split(':')[0]}:</strong> ${t.infoF5.split(':')[1]}`;
    info.querySelectorAll('h4')[1].textContent = t.infoExamples;
    const examplesLis = info.querySelectorAll('ul')[2].querySelectorAll('li');
    examplesLis[0].innerHTML = `<code>${t.infoE1.split('→')[0].trim()}</code> → <code>${t.infoE1.split('→')[1].trim()}</code>`;
    examplesLis[1].innerHTML = `<code>${t.infoE2.split('→')[0].trim()}</code> → <code>${t.infoE2.split('→')[1].trim()}</code>`;
    examplesLis[2].innerHTML = `<code>${t.infoE3.split('→')[0].trim()}</code> → <code>${t.infoE3.split('→')[1].trim()}</code>`;
}

function getCurrentLang() {
    return localStorage.getItem('lang') || 'ar';
}

function toggleLang() {
    const current = getCurrentLang();
    const next = current === 'ar' ? 'en' : 'ar';
    localStorage.setItem('lang', next);
    setLanguage(next);
}

document.addEventListener('DOMContentLoaded', () => {
    setLanguage(getCurrentLang());
    document.getElementById('langSwitchBtn').addEventListener('click', toggleLang);

    const converter = new KMLConverter();
    // Side conversion logic (real-time)
    const inputM2 = document.getElementById('inputM2');
    const inputDecimalFeddan = document.getElementById('inputDecimalFeddan');
    const inputFeddan = document.getElementById('inputFeddan');
    const inputQirat = document.getElementById('inputQirat');
    const inputSahm = document.getElementById('inputSahm');

    if (inputM2 && inputDecimalFeddan && inputFeddan && inputQirat && inputSahm) {

        // Constants
        const FEDDAN_TO_M2 = 4200.83;
        const QIRAT_TO_SAHM = 24;
        const FEDDAN_TO_QIRAT = 24;
        const SAHM_PER_FEDDAN = QIRAT_TO_SAHM * FEDDAN_TO_QIRAT; // 576
        const SAHM_TO_M2 = FEDDAN_TO_M2 / SAHM_PER_FEDDAN; // ~7.293

        // Helper to update all inputs except the source
        const updateInputs = (source, m2) => {
            if (m2 < 0) return;

            // 1. Update m2 input if not source
            if (source !== 'm2') {
                inputM2.value = m2 === 0 ? '' : parseFloat(m2.toFixed(4));
            }

            // 2. Update Decimal Feddan if not source
            if (source !== 'decimal') {
                const decimalFeddan = m2 / FEDDAN_TO_M2;
                inputDecimalFeddan.value = m2 === 0 ? '' : parseFloat(decimalFeddan.toFixed(6));
            }

            // 3. Update F/Q/S if not source
            if (source !== 'fqs') {
                if (m2 === 0) {
                    inputFeddan.value = '';
                    inputQirat.value = '';
                    inputSahm.value = '';
                } else {
                    let totalSahm = m2 / SAHM_TO_M2;
                    let f = Math.floor(totalSahm / SAHM_PER_FEDDAN);
                    let remainingSahm = totalSahm - (f * SAHM_PER_FEDDAN);
                    let q = Math.floor(remainingSahm / QIRAT_TO_SAHM);
                    let s = remainingSahm - (q * QIRAT_TO_SAHM);

                    inputFeddan.value = f;
                    inputQirat.value = q;
                    inputSahm.value = parseFloat(s.toFixed(4));
                }
            }
        };

        // Event Listeners
        inputM2.addEventListener('input', () => {
            const val = parseFloat(inputM2.value) || 0;
            updateInputs('m2', val);
        });

        inputDecimalFeddan.addEventListener('input', () => {
            const val = parseFloat(inputDecimalFeddan.value) || 0;
            const m2 = val * FEDDAN_TO_M2;
            updateInputs('decimal', m2);
        });

        const updateFromFQS = () => {
            const f = parseFloat(inputFeddan.value) || 0;
            const q = parseFloat(inputQirat.value) || 0;
            const s = parseFloat(inputSahm.value) || 0;

            const totalSahm = (f * SAHM_PER_FEDDAN) + (q * QIRAT_TO_SAHM) + s;
            const m2 = totalSahm * SAHM_TO_M2;
            updateInputs('fqs', m2);
        };

        inputFeddan.addEventListener('input', updateFromFQS);
        inputQirat.addEventListener('input', updateFromFQS);
        inputSahm.addEventListener('input', updateFromFQS);
    }
});

// Patch KMLConverter to use translations for status/progress
const origShowStatus = KMLConverter.prototype.showStatus;
KMLConverter.prototype.showStatus = function (message, type) {
    const lang = getCurrentLang();
    // Map known messages to translation keys
    const map = {
        'يرجى اختيار ملف أولاً.': translations[lang].statusNoFile,
        'يرجى اختيار ملف KML صحيح.': translations[lang].statusNoKML,
        'تم تحويل الملف بنجاح!': translations[lang].statusSuccess,
        'لا يوجد محتوى محول للتحميل.': translations[lang].statusNoContent
    };
    if (map[message]) message = map[message];
    origShowStatus.call(this, message, type);
};
const origShowProgress = KMLConverter.prototype.updateProgress;
KMLConverter.prototype.updateProgress = function (percentage) {
    const lang = getCurrentLang();
    const progressText = document.getElementById('progressText');
    progressText.textContent = `${translations[lang].progress} ${Math.round(percentage)}%`;
    origShowProgress.call(this, percentage);
}; 