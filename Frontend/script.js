// Global state
let currentRedactedText = '';
let redactionSpans = [];
let processingStartTime = null;
let currentFileName = '';
let currentFileType = '';
let uploadedFileContent = '';

// DOM Elements
const connectionStatus = document.getElementById('connectionStatus');
const inputText = document.getElementById('inputText');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const lineCount = document.getElementById('lineCount');
const redactBtn = document.getElementById('redactBtn');
const autoDetectBtn = document.getElementById('autoDetectBtn');
const loadExampleBtn = document.getElementById('loadExampleBtn');
const clearTextBtn = document.getElementById('clearTextBtn');
const resultsSection = document.getElementById('resultsSection');
const originalPreview = document.getElementById('originalPreview');
const redactedPreview = document.getElementById('redactedPreview');
const redactionCount = document.getElementById('redactionCount');
const processingTime = document.getElementById('processingTime');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMessage = document.getElementById('loadingMessage');
const toast = document.getElementById('toast');
const fileInput = document.getElementById('fileInput');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileStats = document.getElementById('fileStats');
const clearFileBtn = document.getElementById('clearFileBtn');
const processedFileName = document.getElementById('processedFileName');
const downloadTxtBtn = document.getElementById('downloadTxtBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const copyRedactedBtn = document.getElementById('copyRedactedBtn');
const printBtn = document.getElementById('printBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// API Configuration
const API_BASE = 'https://text-redaction-engine-backend.onrender.com';
let isBackendConnected = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkBackendConnection();
    setupEventListeners();
    updateTextStats();
    updateRulePreviews();
    
    // Auto-save input every 5 seconds
    setInterval(saveToLocalStorage, 5000);
    
    // Load saved data
    loadFromLocalStorage();
});

// Backend Connection Check
async function checkBackendConnection() {
    try {
        updateConnectionStatus('connecting', 'Connecting to backend...');
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
            const data = await response.json();
            updateConnectionStatus('connected', 'Backend connected');
            isBackendConnected = true;
            redactBtn.disabled = false;
            autoDetectBtn.disabled = false;
            loadExampleBtn.disabled = false;
            fileInput.disabled = false;
        } else {
            throw new Error('Backend not responding');
        }
    } catch (error) {
        updateConnectionStatus('disconnected', 'Backend offline');
        isBackendConnected = false;
        redactBtn.disabled = true;
        autoDetectBtn.disabled = true;
        loadExampleBtn.disabled = true;
        fileInput.disabled = true;
        showToast('⚠️ Backend server is offline. Using client-side detection only.', 'warning');
        
        // Retry every 10 seconds
        setTimeout(checkBackendConnection, 10000);
    }
}

function updateConnectionStatus(status, message) {
    connectionStatus.innerHTML = `<i class="fas fa-circle"></i> ${message}`;
    connectionStatus.className = 'connection-status ' + status;
}

// Event Listeners
function setupEventListeners() {
    // Text input events
    inputText.addEventListener('input', () => {
        updateTextStats();
        saveToLocalStorage();
    });
    
    // Clear text button
    clearTextBtn.addEventListener('click', clearText);
    
    // Load example button
    loadExampleBtn.addEventListener('click', loadExample);
    
    // Rule change events
    document.querySelectorAll('input[type="radio"][name$="Rule"]').forEach(radio => {
        radio.addEventListener('change', updateRulePreviews);
    });
    
    // Button events
    redactBtn.addEventListener('click', performRedaction);
    autoDetectBtn.addEventListener('click', autoDetectAndPreview);
    
    // File upload events
    setupFileUploadListeners();
    
    // Download and copy buttons
    downloadTxtBtn.addEventListener('click', downloadAsTxt);
    downloadPdfBtn.addEventListener('click', downloadAsPdf);
    copyRedactedBtn.addEventListener('click', copyRedactedToClipboard);
    printBtn.addEventListener('click', printRedacted);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (!redactBtn.disabled) {
                performRedaction();
            }
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            if (!autoDetectBtn.disabled) {
                autoDetectAndPreview();
            }
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            downloadAsTxt();
        }
        
        if (e.key === 'Escape') {
            clearText();
        }
    });
}

// File Upload Setup
function setupFileUploadListeners() {
    // Click to upload
    fileUploadArea.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('drag-over');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('drag-over');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // Clear file button
    clearFileBtn.addEventListener('click', clearUploadedFile);
}

async function handleFileUpload(file) {
    currentFileName = file.name;
    currentFileType = file.type || file.name.split('.').pop().toLowerCase();
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit', 'error');
        return;
    }
    
    // Show loading
    showLoading(`Processing ${file.name}...`);
    
    try {
        let text = '';
        
        if (currentFileType.includes('text') || currentFileType === 'txt') {
            text = await readTextFile(file);
        } else if (currentFileType.includes('pdf')) {
            text = await extractTextFromPDF(file);
        } else if (currentFileType.includes('docx') || currentFileType.includes('word')) {
            text = await extractTextFromDOCX(file);
        } else if (currentFileType.includes('rtf')) {
            text = await extractTextFromRTF(file);
        } else {
            showToast('Unsupported file format', 'error');
            hideLoading();
            return;
        }
        
        // Update text area
        inputText.value = text;
        uploadedFileContent = text;
        updateTextStats();
      // Continue from handleFileUpload function...

        // Update file info display
        fileName.textContent = currentFileName;
        updateFileStats(file, text.length);
        fileInfo.style.display = 'block';
        fileUploadArea.style.display = 'none';
        
        // Update processed file name
        processedFileName.textContent = currentFileName;
        
        showToast(`File "${currentFileName}" loaded successfully!`, 'success');
        
    } catch (error) {
        console.error('Error processing file:', error);
        showToast('Error processing file. Please try a different format.', 'error');
    } finally {
        hideLoading();
    }
}

function updateFileStats(file, textLength) {
    const fileSize = formatFileSize(file.size);
    const wordCount = inputText.value.trim() ? inputText.value.trim().split(/\s+/).length : 0;
    
    fileStats.innerHTML = `
        <span><i class="fas fa-weight-hanging"></i> Size: ${fileSize}</span>
        <span><i class="fas fa-font"></i> Characters: ${textLength}</span>
        <span><i class="fas fa-file-word"></i> Words: ${wordCount}</span>
    `;
}

function clearUploadedFile() {
    fileInput.value = '';
    currentFileName = '';
    currentFileType = '';
    uploadedFileContent = '';
    
    fileInfo.style.display = 'none';
    fileUploadArea.style.display = 'block';
    processedFileName.textContent = 'Manual Input';
    
    showToast('File cleared', 'info');
}

// File Processing Functions
async function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

async function extractTextFromPDF(file) {
    try {
        // For PDF extraction, we need to use a library
        // Since we don't have PDF.js loaded, we'll show a message
        showToast('PDF extraction requires additional libraries. Please use TXT or DOCX files for now.', 'warning');
        hideLoading();
        
        // Return empty string for now
        return 'PDF extraction requires PDF.js library. Please convert to text file first.';
        
        // Uncomment below when PDF.js is properly included:
        /*
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        return fullText;
        */
    } catch (error) {
        throw new Error('PDF extraction failed');
    }
}

async function extractTextFromDOCX(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        
        // Simple DOCX extraction (extracts text from the Word document)
        // This is a basic implementation - in production you'd want a proper library
        const data = new Uint8Array(arrayBuffer);
        let text = '';
        
        // Look for text between <w:t> tags in the DOCX XML (simplified approach)
        const decoder = new TextDecoder('utf-8');
        const content = decoder.decode(data);
        
        // Simple regex to extract text from DOCX (this is very basic)
        const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (textMatches) {
            text = textMatches.map(match => {
                return match.replace(/<[^>]+>/g, '');
            }).join(' ');
        }
        
        if (!text) {
            // Fallback: try to extract any readable text
            text = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        }
        
        return text || 'Unable to extract text from DOCX file. Please try a TXT file.';
    } catch (error) {
        console.error('DOCX extraction error:', error);
        return 'Error extracting text from DOCX file. Please try a TXT file.';
    }
}

async function extractTextFromRTF(file) {
    try {
        const text = await readTextFile(file);
        // Simple RTF text extraction - remove RTF control words
        return text
            .replace(/\\[a-z]+\d*\s?/g, ' ')  // Remove RTF control words
            .replace(/[{}]/g, ' ')             // Remove braces
            .replace(/\s+/g, ' ')              // Normalize whitespace
            .trim();
    } catch (error) {
        throw new Error('RTF extraction failed');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Text Statistics
function updateTextStats() {
    const text = inputText.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 0;
    
    charCount.textContent = `Characters: ${chars}`;
    wordCount.textContent = `Words: ${words}`;
    lineCount.textContent = `Lines: ${lines}`;
}

// Load Example Text
function loadExample() {
    const exampleText = `Hello, my name is John Doe. You can contact me at john.doe@company.com or call me at (555) 123-4567. My SSN is 123-45-6789 and my account number is 9876543210.

You can also reach my colleague Jane Smith at jane.smith@example.org or (444) 555-6677. Her credit card is 4111-1111-1111-1111.

Our office address is 123 Business Street, Suite 500, New York, NY 10001. For billing inquiries, contact billing@company.com or call 1-800-555-0199.

Additional contact: support@helpdesk.com | Emergency: 911
Customer ID: 8765432109 | Reference: A1B2C3D4E5`;

    inputText.value = exampleText;
    updateTextStats();
    saveToLocalStorage();
    showToast('Example text loaded successfully!', 'success');
}

// Clear Text
function clearText() {
    inputText.value = '';
    updateTextStats();
    saveToLocalStorage();
    showToast('Text cleared', 'info');
    
    // Clear results if shown
    resultsSection.style.display = 'none';
    originalPreview.textContent = 'No text processed yet.';
    redactedPreview.textContent = 'No text processed yet.';
}

// Rule Preview Updates
function updateRulePreviews() {
    // Email preview
    const emailRule = document.querySelector('input[name="emailRule"]:checked').value;
    document.getElementById('emailPreview').textContent = getPreviewText('john.doe@example.com', emailRule, 'EMAIL');
    
    // Phone preview
    const phoneRule = document.querySelector('input[name="phoneRule"]:checked').value;
    document.getElementById('phonePreview').textContent = getPreviewText('(555) 123-4567', phoneRule, 'PHONE');
    
    // SSN preview
    const ssnRule = document.querySelector('input[name="ssnRule"]:checked').value;
    document.getElementById('ssnPreview').textContent = getPreviewText('123-45-6789', ssnRule, 'SSN');
    
    // Account preview
    const accountRule = document.querySelector('input[name="accountRule"]:checked').value;
    document.getElementById('accountPreview').textContent = getPreviewText('9876543210', accountRule, 'ACCOUNT');
}

function getPreviewText(text, rule, type) {
    switch(rule) {
        case 'FULL':
            return '█'.repeat(text.length);
        case 'PARTIAL':
            if (text.length <= 4) return '█'.repeat(text.length);
            const lastFour = text.slice(-4);
            const masked = '█'.repeat(text.length - 4);
            return masked + lastFour;
        case 'TOKEN':
            const tokens = {
                'EMAIL': '[EMAIL_REDACTED]',
                'PHONE': '[PHONE_REDACTED]',
                'SSN': '[SSN_REDACTED]',
                'ACCOUNT': '[ACCOUNT_REDACTED]'
            };
            return tokens[type] || '[REDACTED]';
        default:
            return '█'.repeat(text.length);
    }
}

// Auto-detection (Client-side fallback)
function autoDetectAndPreview() {
    const text = inputText.value.trim();
    if (!text) {
        showToast('Please enter some text first', 'warning');
        return;
    }
    
    redactionSpans = detectSensitiveData(text);
    
    if (redactionSpans.length === 0) {
        showToast('No sensitive data detected in the text', 'info');
        return;
    }
    
    // Show preview with client-side detection
    showPreview(text, redactionSpans);
    showToast(`Detected ${redactionSpans.length} sensitive items (client-side)`, 'success');
}

function detectSensitiveData(text) {
    const spans = [];
    
    // Email detection
    const emailRegex = /[\w.%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    let match;
    while ((match = emailRegex.exec(text)) !== null) {
        spans.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'EMAIL',
            originalText: match[0],
            rule: document.querySelector('input[name="emailRule"]:checked').value
        });
    }
    
    // Phone number detection (US format)
    const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    while ((match = phoneRegex.exec(text)) !== null) {
        spans.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'PHONE',
            originalText: match[0],
            rule: document.querySelector('input[name="phoneRule"]:checked').value
        });
    }
    
    // SSN detection
    const ssnRegex = /\d{3}-\d{2}-\d{4}/g;
    while ((match = ssnRegex.exec(text)) !== null) {
        spans.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'SSN',
            originalText: match[0],
            rule: document.querySelector('input[name="ssnRule"]:checked').value
        });
    }
    
    // Account number detection (8-12 digits)
    const accountRegex = /\b\d{8,12}\b/g;
    while ((match = accountRegex.exec(text)) !== null) {
        spans.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'ACCOUNT',
            originalText: match[0],
            rule: document.querySelector('input[name="accountRule"]:checked').value
        });
    }
    
    // Credit card detection (simplified)
    const creditCardRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
    while ((match = creditCardRegex.exec(text)) !== null) {
        spans.push({
            start: match.index,
            end: match.index + match[0].length,
            type: 'ACCOUNT',
            originalText: match[0],
            rule: document.querySelector('input[name="accountRule"]:checked').value
        });
    }
    
    return spans;
}

// Preview Display
function showPreview(originalText, spans) {
    // Display original text with highlights
    let originalHTML = escapeHtml(originalText);
    
    // Sort spans by start position (descending) for proper highlighting
    const sortedSpans = [...spans].sort((a, b) => b.start - a.start);
    
    sortedSpans.forEach(span => {
        const before = originalHTML.substring(0, span.start);
        const match = originalHTML.substring(span.start, span.end);
        const after = originalHTML.substring(span.end);
        
        originalHTML = `${before}<span class="redacted" title="${span.type}: ${span.originalText}">${match}</span>${after}`;
    });
    
    originalPreview.innerHTML = originalHTML;
    
    // Generate redacted text
    let redactedText = originalText;
    sortedSpans.forEach(span => {
        const redactedPart = applyRedactionRule(span.originalText, span.rule, span.type);
        redactedText = redactedText.substring(0, span.start) + redactedPart + redactedText.substring(span.end);
        
        // Adjust subsequent spans positions
        for (let i = 0; i < sortedSpans.length; i++) {
            if (sortedSpans[i].start > span.start) {
                sortedSpans[i].start += redactedPart.length - span.originalText.length;
                sortedSpans[i].end += redactedPart.length - span.originalText.length;
            }
        }
    });
    
    currentRedactedText = redactedText;
    redactedPreview.textContent = redactedText;
    
    // Update counts
    const originalCount = document.getElementById('originalCount');
    const redactedCount = document.getElementById('redactedCount');
    
    originalCount.textContent = `${spans.length} items`;
    redactedCount.textContent = `${spans.length} redacted`;
    
    // Show results section
    resultsSection.style.display = 'block';
    redactionCount.textContent = `${spans.length} redaction${spans.length !== 1 ? 's' : ''}`;
}

function applyRedactionRule(text, rule, type) {
    switch(rule) {
        case 'FULL':
            return '█'.repeat(text.length);
        case 'PARTIAL':
            if (text.length <= 4) return '█'.repeat(text.length);
            const lastFour = text.slice(-4);
            const masked = '█'.repeat(text.length - 4);
            return masked + lastFour;
        case 'TOKEN':
            const tokens = {
                'EMAIL': '[EMAIL_REDACTED]',
                'PHONE': '[PHONE_REDACTED]',
                'SSN': '[SSN_REDACTED]',
                'ACCOUNT': '[ACCOUNT_REDACTED]'
            };
            return tokens[type] || '[REDACTED]';
        default:
            return '█'.repeat(text.length);
    }
}

// Main Redaction Function
async function performRedaction() {
    const text = inputText.value.trim();
    
    if (!text) {
        showToast('Please enter some text first', 'warning');
        return;
    }
    
    // Get current rule settings
    const rules = {
        email: document.querySelector('input[name="emailRule"]:checked').value,
        phone: document.querySelector('input[name="phoneRule"]:checked').value,
        ssn: document.querySelector('input[name="ssnRule"]:checked').value,
        account: document.querySelector('input[name="accountRule"]:checked').value
    };
    
    // Show loading overlay
    showLoading('Processing text...');
    processingStartTime = Date.now();
    
    try {
        let result;
        
        if (isBackendConnected) {
            // Try backend first
            const response = await fetch(`${API_BASE}/redact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    rules: rules
                }),
                timeout: 15000 // 15 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`Backend responded with status: ${response.status}`);
            }
            
            result = await response.json();
            redactionSpans = result.redaction_spans || [];
            currentRedactedText = result.redacted_text || '';
            
        } else {
            // Fallback to client-side detection
            throw new Error('Backend not connected');
        }
        
        // Display results
        if (redactionSpans.length > 0) {
            showPreview(text, redactionSpans);
        } else if (currentRedactedText) {
            // If backend returned redacted text but no spans
            originalPreview.textContent = text;
            redactedPreview.textContent = currentRedactedText;
            resultsSection.style.display = 'block';
            redactionCount.textContent = '0 redactions';
        } else {
            showToast('No sensitive data detected', 'info');
        }
        
        // Update processing time
        if (processingStartTime) {
            const elapsed = Date.now() - processingStartTime;
            processingTime.textContent = `${elapsed}ms`;
        }
        
        hideLoading();
        
    } catch (error) {
        console.error('Redaction error:', error);
        
        // Fallback to client-side detection
        showToast('Using client-side detection (backend unavailable)', 'warning');
        redactionSpans = detectSensitiveData(text);
        
        if (redactionSpans.length > 0) {
            showPreview(text, redactionSpans);
            showToast(`Redacted ${redactionSpans.length} items (client-side)`, 'success');
        } else {
            showToast('No sensitive data detected', 'info');
        }
        
        if (processingStartTime) {
            const elapsed = Date.now() - processingStartTime;
            processingTime.textContent = `${elapsed}ms (client-side)`;
        }
        
        hideLoading();
    }
}

// Download Functions
function downloadAsTxt() {
    if (!currentRedactedText) {
        showToast('Please redact text first', 'warning');
        return;
    }
    
    const fileName = currentFileName 
        ? `redacted_${currentFileName.replace(/\.[^/.]+$/, '')}.txt`
        : 'redacted_text.txt';
    
    const blob = new Blob([currentRedactedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Redacted text downloaded as TXT!', 'success');
}

async function downloadAsPdf() {
    if (!currentRedactedText) {
        showToast('Please redact text first', 'warning');
        return;
    }
    
    showLoading('Generating PDF...');
    
    try {
        const fileName = currentFileName 
            ? `redacted_${currentFileName.replace(/\.[^/.]+$/, '')}.pdf`
            : 'redacted_text.pdf';
        
        // Using pdfmake for PDF generation
        const documentDefinition = {
            content: [
                {
                    text: 'Redacted Document',
                    style: 'header',
                    margin: [0, 0, 0, 20]
                },
                {
                    text: 'Generated by Text Redaction Engine',
                    style: 'subheader',
                    margin: [0, 0, 0, 10]
                },
                {
                    text: 'Original File: ' + (currentFileName || 'Manual Input'),
                    margin: [0, 0, 0, 20]
                },
                {
                    text: currentRedactedText,
                    style: 'body',
                    margin: [0, 0, 0, 20]
                },
                {
                    text: `Generated on: ${new Date().toLocaleString()}`,
                    style: 'footer',
                    margin: [0, 20, 0, 0]
                },
                {
                    text: `Redactions Applied: ${redactionSpans.length}`,
                    style: 'footer'
                }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'center'
                },
                subheader: {
                    fontSize: 12,
                    italics: true,
                    alignment: 'center',
                    color: '#666'
                },
                body: {
                    fontSize: 10,
                    lineHeight: 1.5
                },
                footer: {
                    fontSize: 8,
                    color: '#888'
                }
            },
            defaultStyle: {
                font: 'Helvetica'
            }
        };
        
        pdfMake.createPdf(documentDefinition).download(fileName);
        
        hideLoading();
        showToast('Redacted text downloaded as PDF!', 'success');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        hideLoading();
        showToast('Error generating PDF. Try downloading as TXT instead.', 'error');
    }
}

function copyRedactedToClipboard() {
    if (!currentRedactedText) {
        showToast('Please redact text first', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(currentRedactedText).then(() => {
        showToast('Redacted text copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy to clipboard', 'error');
    });
}

function printRedacted() {
    if (!currentRedactedText) {
        showToast('Please redact text first', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Redacted Document</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2cm; }
                    h1 { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
                    .meta { color: #666; margin-bottom: 20px; }
                    .content { white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 20px; border-radius: 5px; }
                    .footer { margin-top: 30px; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 10px; }
                </style>
            </head>
            <body>
                <h1>Redacted Document</h1>
                <div class="meta">
                    <p><strong>Original File:</strong> ${currentFileName || 'Manual Input'}</p>
                    <p><strong>Redactions Applied:</strong> ${redactionSpans.length}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div class="content">${escapeHtml(currentRedactedText)}</div>
                <div class="footer">
                    <p>Generated by Text Redaction Engine</p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// Loading Overlay Functions
function showLoading(message = 'Processing...') {
    loadingMessage.textContent = message;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
    processingStartTime = null;
}

// Toast Notification
function showToast(message, type = 'info') {
    // Clear any existing timeout
    if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
    }
    
    // Set message and style
    toast.textContent = message;
    toast.className = 'toast show';
    
    // Add icon based on type
    let icon = 'ℹ️';
    switch(type) {
        case 'success':
            icon = '✅';
            toast.style.backgroundColor = '#10b981';
            break;
        case 'warning':
            icon = '⚠️';
            toast.style.backgroundColor = '#f59e0b';
            break;
        case 'error':
            icon = '❌';
            toast.style.backgroundColor = '#ef4444';
            break;
        default:
            icon = 'ℹ️';
            toast.style.backgroundColor = '#3b82f6';
    }
    
    toast.innerHTML = `${icon} ${message}`;
    
    // Auto-hide after 3 seconds
    toast.timeoutId = setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Local Storage Functions
function saveToLocalStorage() {
    const data = {
        text: inputText.value,
        rules: {
            email: document.querySelector('input[name="emailRule"]:checked').value,
            phone: document.querySelector('input[name="phoneRule"]:checked').value,
            ssn: document.querySelector('input[name="ssnRule"]:checked').value,
            account: document.querySelector('input[name="accountRule"]:checked').value
        },
        fileName: currentFileName,
        fileType: currentFileType
    };
    
    try {
        localStorage.setItem('textRedactorData', JSON.stringify(data));
    } catch (error) {
        console.warn('Could not save to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('textRedactorData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Restore text
            if (data.text) {
                inputText.value = data.text;
                updateTextStats();
            }
            
            // Restore rules
            if (data.rules) {
                Object.keys(data.rules).forEach(ruleType => {
                    const selector = `input[name="${ruleType}Rule"][value="${data.rules[ruleType]}"]`;
                    const radio = document.querySelector(selector);
                    if (radio) {
                        radio.checked = true;
                    }
                });
                updateRulePreviews();
            }
            
            // Restore file info
            if (data.fileName) {
                currentFileName = data.fileName;
                currentFileType = data.fileType;
                processedFileName.textContent = currentFileName;
            }
            
            showToast('Restored previous session', 'info');
        }
    } catch (error) {
        console.warn('Could not load from localStorage:', error);
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update progress bar (for future use)
function updateProgress(percent, message = '') {
    progressContainer.style.display = 'block';
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
    
    if (message) {
        loadingMessage.textContent = message;
    }
}