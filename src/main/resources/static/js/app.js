document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const dropzonePrompt = document.getElementById('dropzonePrompt');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    
    const extractBtn = document.getElementById('extractBtn');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = extractBtn.querySelector('.btn-text');

    const langChips = document.querySelectorAll('.lang-chip');
    
    const engineStatusBadge = document.getElementById('engineStatusBadge');
    const engineStatusText = document.getElementById('engineStatusText');
    const statusDot = engineStatusBadge.querySelector('.status-dot');

    const metricTime = document.getElementById('metricTime');
    const metricWords = document.getElementById('metricWords');
    const metricLines = document.getElementById('metricLines');
    const metricSize = document.getElementById('metricSize');

    const resultFileName = document.getElementById('resultFileName');
    const resultArea = document.getElementById('resultArea');
    const emptyState = document.getElementById('emptyState');
    const resultTextarea = document.getElementById('resultTextarea');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    const infoBox = document.getElementById('infoBox');
    const infoContent = document.getElementById('infoContent');

    let currentFile = null;
    let selectedLanguage = 'kor+eng';

    // Fetch System Engine Status
    fetchEngineStatus();

    async function fetchEngineStatus() {
        try {
            const res = await fetch('/api/ocr/status');
            const status = await res.json();

            if (status.available) {
                statusDot.classList.add('active');
                statusDot.classList.remove('pulse');
                engineStatusText.textContent = `Tesseract Ready (${status.availableLanguages.join(', ') || 'kor/eng'})`;
            } else {
                statusDot.style.backgroundColor = 'var(--warning)';
                engineStatusText.textContent = 'Engine Warning';
                showInfoNotice(status.message);
            }
        } catch (e) {
            engineStatusText.textContent = 'Server Status Disconnected';
        }
    }

    // Drag and Drop Handling
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    function handleFileSelect(file) {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            dropzonePrompt.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            extractBtn.disabled = false;
        };
        reader.readAsDataURL(file);

        // Update stats preview
        metricSize.textContent = formatBytes(file.size);
        resultFileName.textContent = file.name;
    }

    removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetImageSelection();
    });

    function resetImageSelection() {
        currentFile = null;
        fileInput.value = '';
        imagePreview.src = '';
        dropzonePrompt.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        extractBtn.disabled = true;
        
        resultFileName.textContent = '텍스트 인식 대기 중...';
        metricSize.textContent = '-';
        metricTime.textContent = '-';
        metricWords.textContent = '-';
        metricLines.textContent = '-';

        emptyState.classList.remove('hidden');
        resultTextarea.classList.add('hidden');
        resultTextarea.value = '';
        copyBtn.disabled = true;
        downloadBtn.disabled = true;
    }

    // Language Selector
    langChips.forEach(chip => {
        chip.addEventListener('click', () => {
            langChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedLanguage = chip.dataset.lang;
        });
    });

    // Extract Text API Call
    extractBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        setLoading(true);

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('lang', selectedLanguage);

        try {
            const response = await fetch('/api/ocr/extract', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                renderResult(data);
            } else {
                handleError(data.errorMessage || '텍스트 추출 중 오류가 발생했습니다.');
            }
        } catch (error) {
            handleError('서버와의 통신에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    });

    function renderResult(data) {
        metricTime.textContent = `${data.processingTimeMs} ms`;
        metricWords.textContent = data.wordCount;
        metricLines.textContent = data.lineCount;

        emptyState.classList.add('hidden');
        resultTextarea.classList.remove('hidden');
        resultTextarea.value = data.text;

        copyBtn.disabled = !data.text;
        downloadBtn.disabled = !data.text;

        showInfoNotice(`인식 완료! (엔진: ${data.engine}, 소요 시간: ${data.processingTimeMs}ms)`);
    }

    function handleError(msg) {
        alert(msg);
        showInfoNotice(`오류 발생: ${msg}`);
    }

    function setLoading(isLoading) {
        extractBtn.disabled = isLoading;
        if (isLoading) {
            btnSpinner.classList.remove('hidden');
            btnText.textContent = '인식 분석 중...';
        } else {
            btnSpinner.classList.add('hidden');
            btnText.textContent = '텍스트 추출 시작';
        }
    }

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        if (!resultTextarea.value) return;
        navigator.clipboard.writeText(resultTextarea.value).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = '복사됨!';
            setTimeout(() => {
                copyBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg> 복사
                `;
            }, 2000);
        });
    });

    // Download Text
    downloadBtn.addEventListener('click', () => {
        if (!resultTextarea.value) return;
        const blob = new Blob([resultTextarea.value], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ocr-result-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    function showInfoNotice(msg) {
        infoBox.classList.remove('hidden');
        infoContent.textContent = msg;
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
});
