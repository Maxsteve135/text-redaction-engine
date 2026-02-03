// Global state
let currentRedactedText = '';
let redactionSpans = [];
let processingStartTime = null;
let currentFileName = '';
let currentFileType = '';

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
const clearFileBtn = document.getElementById('clearFileBtn');
const processedFileName = document.getElementById('processedFileName');
const downloadTxtBtn = document.getElementById('downloadTxtBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const copyRedactedBtn = document.getElementById('copyRedactedBtn');

// API Configuration
const API_BASE = 'https://text-redaction-engine-backend.onrender.com';
let isBackendConnected = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkBackendConnection();
    setupEventListeners();
    updateTextStats();
    updateRulePreviews();
    loadFromLocalStorage();
});

// Backend Connection
async function checkBackendConnection() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
            updateConnectionStatus('connected', 'Backend connected');
            isBackendConnected = true;
        } else {
            throw new Error('Backend not responding');
        }
    } catch (error) {
        updateConnectionStatus('disconnected', 'Backend offline');
        isBackendConnected = false;
        showToast('Using client-side detection only', 'warning');
    }
}

function updateConnectionStatus(status, message) {
    connectionStatus.innerHTML = `<i class="fas fa-circle"></i> ${message}`;
    const icon = connectionStatus.querySelector('.fa-circle');
    
    if (status === 'connected') {
        icon.style.color = '#10b981';
    } else if (status === 'disconnected') {
        icon.style.color = '#ef4444';
    } else {
        icon.style.color = '#f59e0b';
    }
}

// Event Listeners
function setupEventListeners() {
    // Text input
    inputText.addEventListener('input', updateTextStats);
    
    // File upload
    fileUploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    clearFileBtn.addEventListener('click', clearUploadedFile);
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#3b82f6';
        fileUploadArea.style.background = '#f0f9ff';
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = '#d1d5db';
        fileUploadArea.style.background = '#f9fafb';
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#d1d5db';
        fileUploadArea.style.background = '#f9fafb';
        
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload({ target: { files: e.dataTransfer.files } });
        }
    });
    
    // Buttons
    clearTextBtn.addEventListener('click', clearText);
    loadExampleBtn.addEventListener('click', loadExample);
    autoDetectBtn.addEventListener('click', autoDetectAndPreview);
    redactBtn.addEventListener('click', performRedaction);
    
    // Download buttons
    downloadTxtBtn.addEventListener('click', downloadAsTxt);
    downloadPdfBtn.addEventListener('click', downloadAsPdf);
    copyRedactedBtn.addEventListener('click', copyRedactedToClipboard);
    
    // Rules
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', updateRulePreviews);
    });
}

// File Upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    currentFileName = file.name;
    currentFileType = file.type || file.name.split('.').pop().toLowerCase();
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size exceeds 5MB limit', 'error');
        return;
    }
    
    showLoading(`Processing ${file.name}...`);
    
    try {
        let text = '';
        
        if (currentFileType.includes('text') || currentFileType === 'txt') {
            text = await readTextFile(file);
        } else if (currentFileType.includes('pdf')) {
            text = await extractTextFromPDF(file);
        } else if (currentFileType.includes('docx')) {
            text = await extractTextFromDOCX(file);
        } else {
            showToast('Unsupported file format', 'error');
            hideLoading();
            return;
        }
        
        inputText.value = text;
        updateTextStats();
        
        // Show file info
        fileName.textContent = currentFileName;
        fileInfo.style.display = 'block';
        processedFileName.textContent = currentFileName;
        
        showToast(`File "${currentFileName}" loaded successfully!`, 'success');
        
    } catch (error) {
        console.error('Error processing file:', error);
        showToast('Error processing file', 'error');
    } finally {
        hideLoading();
    }
}

function clearUploadedFile() {
    fileInput.value = '';
    currentFileName = '';
    currentFileType = '';
    fileInfo.style.display = 'none';
    processedFileName.textContent = 'Manual Input';
}

// File Processing
function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

async function extractTextFromPDF(file) {
    showToast('PDF extraction is limited. Use TXT for best results.', 'warning');
    return await readTextFile(file);
}

async function extractTextFromDOCX(file) {
    showToast('DOCX extraction is basic. Use TXT for best results.', 'warning');
    return await readTextFile(file);
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
    
    saveToLocalStorage();
}

// Load Example
function loadExample() {
    const exampleText = `Hello, my name is John Doe. You can contact me at john.doe@company.com or call me at (555) 123-4567. My SSN is 123-45-6789 and my account number is 9876543210.

You can also reach my colleague Jane Smith at jane.smith@example.org or (444) 555-6677. Her credit card is 4111-1111-1111-1111.

Our office address is 123 Business Street, Suite 500, New York, NY 10001. For billing inquiries, contact billing@company.com or call 1-800-555-0199.`;
    
    inputText.value = exampleText;
    updateTextStats();
    showToast('Example text loaded', 'success');
}

// Clear Text
function clearText() {
    inputText.value = '';
    updateTextStats();
    showToast('Text cleared', 'info');
}

// Rule Previews
function updateRulePreviews() {
    const emailRule = document.querySelector('input[name="emailRule"]:checked').value;
    document.getElementById('emailPreview').textContent = getPreviewText('john.doe@example.com', emailRule, 'EMAIL');
    
    const phoneRule = document.querySelector('input[name="phoneRule"]:checked').value;
    document.getElementById('phonePreview').textContent = getPreviewText('(555) 123-4567', phoneRule, 'PHONE');
    
    const ssnRule = document.querySelector('input[name="ssnRule"]:checked').value;
    document.getElementById('ssnPreview').textContent = getPreviewText('123-45-6789', ssnRule, 'SSN');
    
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
            return '█'.repeat(text.length - 4) + lastFour;
        case 'TOKEN':
            const tokens = {
                'EMAIL': '[EMAIL_REDACTED]',
                'PHONE': '[PHONE_REDACTED]',
                'SSN': '[SSN_REDACTED]',
                'ACCOUNT': '[ACCOUNT_REDACTED]'
            };
            return tokens[type] || '[REDACTED]';
        default:
            return text;
    }
}

// Auto Detect
function autoDetectAndPreview() {
    const text = inputText.value.trim();
    if (!text) {
        showToast('Please enter some text first', 'warning');
        return;
    }
    
    redactionSpans = detectSensitiveData(text);
    
    if (redactionSpans.length === 0) {
        showToast('No sensitive data detected', 'info');
        return;
    }
    
    showPreview(text, redactionSpans);
    showToast(`Detected ${redactionSpans.length} sensitive items`, 'success');
}

function detectSensitiveData(text) {
    const spans = [];
    
    // Email
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
    
    // Phone
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
    
    // SSN
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
    
    // Account
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
    
    return spans;
}

// Show Preview
function showPreview(originalText, spans) {
    // Original with highlights
    let originalHTML = escapeHtml(originalText);
    const sortedSpans = [...spans].sort((a, b) => b.start - a.start);
    
    sortedSpans.forEach(span => {
        const before = originalHTML.substring(0, span.start);
        const match = originalHTML.substring(span.start, span.end);
        const after = originalHTML.substring(span.end);
        originalHTML = `${before}<span class="redacted" title="${span.type}">${match}</span>${after}`;
    });
    
    originalPreview.innerHTML = originalHTML;
    
    // Redacted text
    let redactedText = originalText;
    sortedSpans.forEach(span => {
        const redactedPart = applyRedactionRule(span.originalText, span.rule, span.type);
        redactedText = redactedText.substring(0, span.start) + redactedPart + redactedText.substring(span.end);
    });
    
    currentRedactedText = redactedText;
    redactedPreview.textContent = redactedText;
    
    // Show results
    resultsSection.style.display = 'block';
    redactionCount.textContent = spans.length;
}

function applyRedactionRule(text, rule, type) {
    switch(rule) {
        case 'FULL':
            return '█'.repeat(text.length);
        case 'PARTIAL':
            if (text.length <= 4) return '█'.repeat(text.length);
            const lastFour = text.slice(-4);
            return '█'.repeat(text.length - 4) + lastFour;
        case 'TOKEN':
            const tokens = {
                'EMAIL': '[EMAIL_REDACTED]',
                'PHONE': '[PHONE_REDACTED]',
                'SSN': '[SSN_REDACTED]',
                'ACCOUNT': '[ACCOUNT_REDACTED]'
            };
            return tokens[type] || '[REDACTED]';
        default:
            return text;
    }
}

// Main Redaction
async function performRedaction() {
    const text = inputText.value.trim();
    if (!text) {
        showToast('Please enter some text first', 'warning');
        return;
    }
    
    const rules = {
        email: document.querySelector('input[name="emailRule"]:checked').value,
        phone: document.querySelector('input[name="phoneRule"]:checked').value,
        ssn: document.querySelector('input[name="ssnRule"]:checked').value,
        account: document.querySelector('input[name="accountRule"]:checked').value
    };
    
    showLoading('Processing text...');
    processingStartTime = Date.now();
    
    try {
        let result;
        // Complete the performRedaction function and add remaining functions...

if (isBackendConnected) {
    const response = await fetch(`${API_BASE}/redact`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text,
            rules: rules
        })
    });
    
    if (!response.ok) {
        throw new Error('Backend error');
    }
    
    result = await response.json();
    redactionSpans = result.redaction_spans || [];
    currentRedactedText = result.redacted_text || '';
    
} else {
    throw new Error('Backend not connected');
}

// Display results
if (redactionSpans.length > 0) {
    showPreview(text, redactionSpans);
} else if (currentRedactedText) {
    originalPreview.textContent = text;
    redactedPreview.textContent = currentRedactedText;
    resultsSection.style.display = 'block';
    redactionCount.textContent = '0';
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
    
    // Fallback to client-side
    showToast('Using client-side detection', 'warning');
    redactionSpans = detectSensitiveData(text);
    
    if (redactionSpans.length > 0) {
        showPreview(text, redactionSpans);
        showToast(`Redacted ${redactionSpans.length} items`, 'success');
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
    
    showToast('Downloaded as TXT', 'success');
}

function downloadAsPdf() {
    if (!currentRedactedText) {
        showToast('Please redact text first', 'warning');
        return;
    }
    
    showLoading('Creating PDF...');
    
    try {
        const fileName = currentFileName 
            ? `redacted_${currentFileName.replace(/\.[^/.]+$/, '')}.pdf`
            : 'redacted_text.pdf';
        
        const documentDefinition = {
            content: [
                { text: 'Redacted Document', style: 'header' },
                { text: 'Generated by Text Redaction Engine', style: 'subheader' },
                { text: `Original File: ${currentFileName || 'Manual Input'}` },
                { text: ' ', margin: [0, 20] },
                { text: currentRedactedText, style: 'content' },
                { text: ' ', margin: [0, 20] },
                { text: `Redactions: ${redactionSpans.length}` },
                { text: `Generated: ${new Date().toLocaleString()}` }
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 12, color: '#666', margin: [0, 0, 0, 20] },
                content: { fontSize: 11, lineHeight: 1.5 }
            }
        };
        
        pdfMake.createPdf(documentDefinition).download(fileName);
        
        hideLoading();
        showToast('Downloaded as PDF', 'success');
        
    } catch (error) {
        console.error('PDF error:', error);
        hideLoading();
        showToast('PDF creation failed', 'error');
    }
}

function copyRedactedToClipboard() {
    if (!currentRedactedText) {
        showToast('Please redact text first', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(currentRedactedText)
        .then(() => showToast('Copied to clipboard', 'success'))
        .catch(() => showToast('Copy failed', 'error'));
}

// Loading Functions
function showLoading(message = 'Processing...') {
    loadingMessage.textContent = message;
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
    processingStartTime = null;
}

// Toast Function
function showToast(message, type = 'info') {
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    
    toast.textContent = message;
    toast.className = 'toast show';
    
    switch(type) {
        case 'success':
            toast.style.background = '#10b981';
            break;
        case 'warning':
            toast.style.background = '#f59e0b';
            break;
        case 'error':
            toast.style.background = '#ef4444';
            break;
        default:
            toast.style.background = '#3b82f6';
    }
    
    toast.timeoutId = setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Local Storage
function saveToLocalStorage() {
    const data = {
        text: inputText.value,
        rules: {
            email: document.querySelector('input[name="emailRule"]:checked').value,
            phone: document.querySelector('input[name="phoneRule"]:checked').value,
            ssn: document.querySelector('input[name="ssnRule"]:checked').value,
            account: document.querySelector('input[name="accountRule"]:checked').value
        },
        fileName: currentFileName
    };
    
    try {
        localStorage.setItem('redactorData', JSON.stringify(data));
    } catch (error) {
        console.warn('Save failed:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('redactorData');
        if (saved) {
            const data = JSON.parse(saved);
            
            if (data.text) {
                inputText.value = data.text;
                updateTextStats();
            }
            
            if (data.rules) {
                Object.keys(data.rules).forEach(ruleType => {
                    const radio = document.querySelector(`input[name="${ruleType}Rule"][value="${data.rules[ruleType]}"]`);
                    if (radio) radio.checked = true;
                });
                updateRulePreviews();
            }
            
            if (data.fileName) {
                currentFileName = data.fileName;
                processedFileName.textContent = currentFileName;
            }
            
            showToast('Session restored', 'info');
        }
    } catch (error) {
        console.warn('Load failed:', error);
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Shortcut Keys
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!redactBtn.disabled) performRedaction();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (!autoDetectBtn.disabled) autoDetectAndPreview();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        downloadAsTxt();
    }
    
    if (e.key === 'Escape') {
        clearText();
    }
});