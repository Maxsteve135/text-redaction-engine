# 🔐 Text Redaction Engine
Visit our live demo: [](https://text-redaction-engine-production.up.railway.app/)]
!
**A powerful, privacy-focused tool for automatically detecting and redacting sensitive information from text and documents.**

## ✨ Features

### 🚀 **Core Functionality**
- 🔍 **Smart Detection**: Automatically finds emails, phone numbers, SSNs, and account numbers
- 🎯 **Multiple Redaction Styles**: Choose between full, partial, or token-based redaction
- 📁 **File Support**: Upload TXT, DOCX, and PDF files (drag & drop supported)
- 💾 **Local Storage**: Your work is automatically saved and restored

### 🎨 **User Experience**
- ⚡ **Real-time Processing**: See results instantly
- 📊 **Live Statistics**: Character, word, and line counts
- 👁️ **Preview Mode**: Compare original vs redacted text side-by-side
- 🎯 **Clean Interface**: Simple, intuitive design

### 📤 **Export Options**
- 📄 **Download as TXT**: Save redacted text as plain text
- 📊 **Download as PDF**: Generate formatted PDF with metadata
- 📋 **Copy to Clipboard**: One-click copy for quick sharing
- 🖨️ **Print Ready**: Clean formatting for physical documents

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────┐
│             Frontend (Browser)              │
│  ┌──────────────────────────────────────┐  │
│  │  User Interface (HTML/CSS/JavaScript) │  │
│  └──────────────────────────────────────┘  │
│                     │                      │
│          (Backend when available)          │
│                     │                      │
│  ┌──────────────────────────────────────┐  │
│  │      Client-side Fallback Engine     │  │
│  │  • Email Detection                   │  │
│  │  • Phone Number Detection            │  │
│  │  • SSN Detection                     │  │
│  │  • Account Number Detection          │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## 🚀 **Quick Start**

### **Option 1: Use Online Demo**
Visit our live demo: [](https://text-redaction-engine-production.up.railway.app/)]

### **Option 2: Local Installation**
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/text-redaction-engine.git

# 2. Navigate to the project folder
cd text-redaction-engine

# 3. Open the application
# Simply open index.html in your browser, or use a local server:

# Using Python
python -m http.server 8000

# Using Node.js with http-server
npx http-server

# 4. Open browser and navigate to:
http://localhost:8000
```

## 📖 **How to Use**

### **Step 1: Input Your Text**
- ✍️ **Type directly** into the text area
- 📁 **Upload a file**: Drag & drop or click "Browse Files"
- 🎯 **Load example**: Click "Load Example" to try with sample data

### **Step 2: Configure Redaction Rules**
For each type of sensitive data, choose your redaction style:

| Data Type | Full Redaction | Partial Redaction | Token Replacement |
|-----------|----------------|-------------------|-------------------|
| **Email** | `██████████████` | `***@example.com` | `[EMAIL_REDACTED]` |
| **Phone** | `████████████` | `***-***-4567` | `[PHONE_REDACTED]` |
| **SSN** | `██████████` | `***-**-6789` | `[SSN_REDACTED]` |
| **Account** | `████████████` | `**** **** **** 1111` | `[ACCOUNT_REDACTED]` |

### **Step 3: Process & Review**
- 🔍 Click **"Auto-Detect"** to preview detected sensitive data
- 🔐 Click **"Redact Text"** to apply redaction rules
- 👁️ Compare **original vs redacted** text in side-by-side preview

### **Step 4: Export Results**
- 📥 **Download as TXT** - Plain text file
- 📊 **Download as PDF** - Formatted document with metadata
- 📋 **Copy to Clipboard** - Quick sharing
- 🖨️ **Print** - Physical copy

## 🛠️ **Technical Details**

### **Detection Patterns**
```javascript
// Email addresses
/[\w.%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// US Phone numbers
/(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g

// Social Security Numbers
/\d{3}-\d{2}-\d{4}/g

// Account numbers (8-12 digits)
/\b\d{8,12}\b/g
```

### **File Support**
| Format | Support Level | Notes |
|--------|---------------|-------|
| **TXT** | ✅ Full | Best performance and accuracy |
| **DOCX** | ⚠️ Basic | Text extraction limited |
| **PDF** | ⚠️ Limited | Convert to TXT for best results |

### **Browser Compatibility**
| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Full support | Recommended |
| Firefox | ✅ Full support | |
| Safari | ✅ Full support | |
| Edge | ✅ Full support | |

## 🎯 **Use Cases**

### **📋 Legal & Compliance**
- Redact sensitive information from legal documents
- Prepare documents for public disclosure
- Comply with privacy regulations (GDPR, HIPAA, etc.)

### **🏢 Business & Corporate**
- Share financial reports with sensitive data removed
- Prepare meeting minutes for distribution
- Sanitize customer data for case studies

### **👨‍💻 Developers & IT**
- Remove credentials from log files
- Sanitize configuration files for sharing
- Prepare error reports for external teams

### **🎓 Education & Research**
- Anonymize research data
- Prepare case studies for publication
- Share educational materials safely

## 🔧 **Advanced Features**

### **Keyboard Shortcuts**
| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Redact text |
| `Ctrl + D` | Auto-detect sensitive data |
| `Ctrl + S` | Download as TXT |
| `Escape` | Clear text |

### **Local Storage**
- 💾 Text content is auto-saved every 5 seconds
- ⚙️ Redaction rules are remembered
- 📁 File metadata is preserved
- 🔄 Session automatically restored on revisit

### **Responsive Design**
- 📱 Mobile-friendly interface
- 🖥️ Optimized for desktop
- 🎨 Consistent experience across devices

## 📊 **Performance**

| Operation | Typical Time | Notes |
|-----------|--------------|-------|
| Text processing (1,000 chars) | < 100ms | Client-side |
| File upload (1MB) | 1-3 seconds | Depends on connection |
| PDF generation | 2-5 seconds | Client-side processing |
| Backend processing | 200-500ms | When available |

## 🔒 **Privacy & Security**

### **What We Don't Do**
- ❌ We **don't** store your text on our servers
- ❌ We **don't** send data to third parties
- ❌ We **don't** track your usage
- ❌ We **don't** require registration

### **What We Do**
- ✅ **100% client-side** processing by default
- ✅ **Optional backend** for improved accuracy
- ✅ **Local storage only** (your browser)
- ✅ **No tracking cookies**
- ✅ **Open source** - inspect our code

## 🚧 **Troubleshooting**

### **Common Issues**

| Issue | Solution |
|-------|----------|
| **File not uploading** | Check file size (<5MB) and format (TXT, DOCX, PDF) |
| **No detection** | Try the example text to verify functionality |
| **PDF download fails** | Try TXT download instead, or check browser permissions |
| **Slow processing** | Use smaller files or plain text format |
| **Backend offline** | Client-side fallback will activate automatically |

### **Browser Console Commands**
```javascript
// Check application state
console.log('Current file:', currentFileName);
console.log('Redactions:', redactionSpans.length);
console.log('Backend status:', isBackendConnected);

// Manual redaction trigger
performRedaction();

// Force client-side detection
redactionSpans = detectSensitiveData(inputText.value);
showPreview(inputText.value, redactionSpans);
```

## 📈 **Future Roadmap**

### **Planned Features** 🚧
- 🌐 **Multi-language support** for international phone numbers
- 🔤 **Custom pattern detection** with regex builder
- 🖼️ **Image OCR** for redacting text in images
- 🔌 **API Access** for developers
- 📦 **Batch processing** for multiple files
- 👥 **Team collaboration** features

### **Under Consideration** 💭
- 🔄 **Real-time collaboration**
- 📱 **Mobile app** versions
- 🔗 **Integration plugins** (Word, Google Docs, etc.)
- 🎨 **Customizable UI themes**
- 📊 **Advanced analytics dashboard**

## 🤝 **Contributing**

We welcome contributions! Here's how you can help:

1. 🐛 **Report bugs** - Open an issue with detailed description
2. 💡 **Suggest features** - Share your ideas for improvement
3. 🔧 **Fix issues** - Submit pull requests for bug fixes
4. 📚 **Improve docs** - Help make documentation better
5. 🌍 **Translate** - Help translate the interface


Made with ❤️ for privacy-conscious users everywhere

**🔐 Keep your data safe. Keep your privacy intact.**


### **Common Workflows**
1. **Quick Redaction**: Upload file → Auto-detect → Redact → Download
2. **Batch Processing**: Prepare multiple TXT files in a folder
3. **Template Setup**: Save your preferred redaction rules
4. **Team Sharing**: Use consistent redaction settings across team

### **Pro Tips**
- Use **TXT files** for best performance
- **Save your rules** for consistent redaction
- **Check preview** before downloading
- **Use keyboard shortcuts** for efficiency
- **Clear browser cache** if experiencing issues

---

**⭐ Star this project if you find it useful!**
