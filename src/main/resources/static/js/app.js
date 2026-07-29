document.addEventListener('DOMContentLoaded', () => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const HISTORY_KEY = 'ocr_history';
    const HISTORY_LIMIT = 20;

    const elements = {
        dropzone: document.getElementById('dropzone'),
        fileInput: document.getElementById('fileInput'),
        prompt: document.getElementById('dropzonePrompt'),
        previewContainer: document.getElementById('previewContainer'),
        preview: document.getElementById('imagePreview'),
        removeImage: document.getElementById('removeImageBtn'),
        extract: document.getElementById('extractBtn'),
        spinner: document.getElementById('btnSpinner'),
        buttonText: document.querySelector('#extractBtn .btn-text'),
        langChips: document.querySelectorAll('.lang-chip'),
        statusDot: document.querySelector('.status-dot'),
        statusText: document.getElementById('engineStatusText'),
        metricTime: document.getElementById('metricTime'),
        metricWords: document.getElementById('metricWords'),
        metricLines: document.getElementById('metricLines'),
        metricSize: document.getElementById('metricSize'),
        resultFileName: document.getElementById('resultFileName'),
        emptyState: document.getElementById('emptyState'),
        result: document.getElementById('resultTextarea'),
        tts: document.getElementById('ttsBtn'),
        copy: document.getElementById('copyBtn'),
        download: document.getElementById('downloadBtn'),
        infoBox: document.getElementById('infoBox'),
        infoContent: document.getElementById('infoContent'),
        historySearch: document.getElementById('historySearch'),
        clearHistory: document.getElementById('clearHistoryBtn'),
        historyGrid: document.getElementById('historyGrid')
    };

    let currentFile = null;
    let selectedLanguage = 'kor+eng';

    checkEngineStatus();
    renderHistory();

    async function checkEngineStatus() {
        try {
            const response = await fetch('/api/ocr/status');
            if (!response.ok) throw new Error();
            const status = await response.json();
            elements.statusText.textContent = status.available ? 'OCR 엔진 준비됨' : 'OCR 엔진 확인 필요';
            elements.statusDot.classList.toggle('active', status.available);
            elements.statusDot.classList.remove('pulse');
            if (!status.available) showNotice(status.message, true);
        } catch {
            elements.statusText.textContent = '서버 연결 안 됨';
            elements.statusDot.classList.remove('pulse');
            showNotice('OCR 서버 상태를 확인할 수 없습니다.', true);
        }
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        elements.dropzone.addEventListener(eventName, event => {
            event.preventDefault();
            elements.dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        elements.dropzone.addEventListener(eventName, event => {
            event.preventDefault();
            elements.dropzone.classList.remove('dragover');
        });
    });

    elements.dropzone.addEventListener('drop', event => {
        const [file] = event.dataTransfer.files;
        if (file) selectFile(file);
    });

    elements.fileInput.addEventListener('change', event => {
        const [file] = event.target.files;
        if (file) selectFile(file);
    });

    function selectFile(file) {
        if (!file.type.startsWith('image/')) {
            showNotice('이미지 파일만 업로드할 수 있습니다.', true);
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showNotice('파일 크기는 10MB를 넘을 수 없습니다.', true);
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        reader.addEventListener('load', event => {
            elements.preview.src = event.target.result;
            elements.prompt.classList.add('hidden');
            elements.previewContainer.classList.remove('hidden');
            elements.extract.disabled = false;
        });
        reader.readAsDataURL(file);
        elements.metricSize.textContent = formatBytes(file.size);
        elements.resultFileName.textContent = file.name;
        hideNotice();
    }

    elements.removeImage.addEventListener('click', event => {
        event.stopPropagation();
        resetWorkspace();
    });

    function resetWorkspace() {
        currentFile = null;
        elements.fileInput.value = '';
        elements.preview.removeAttribute('src');
        elements.prompt.classList.remove('hidden');
        elements.previewContainer.classList.add('hidden');
        elements.extract.disabled = true;
        elements.resultFileName.textContent = '텍스트 인식 대기 중';
        elements.result.value = '';
        elements.result.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
        setResultActions(false);
        updateMetrics();
        window.speechSynthesis?.cancel();
        hideNotice();
    }

    elements.langChips.forEach(chip => {
        chip.addEventListener('click', () => {
            elements.langChips.forEach(item => item.classList.remove('active'));
            chip.classList.add('active');
            selectedLanguage = chip.dataset.lang;
        });
    });

    elements.extract.addEventListener('click', async () => {
        if (!currentFile) return;
        setLoading(true);

        const body = new FormData();
        body.append('file', currentFile);
        body.append('lang', selectedLanguage);

        try {
            const response = await fetch('/api/ocr/extract', { method: 'POST', body });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.errorMessage || '텍스트를 추출하지 못했습니다.');
            }
            showResult(data);
            saveHistory(data);
        } catch (error) {
            showNotice(error.message || 'OCR 서버와 통신하지 못했습니다.', true);
        } finally {
            setLoading(false);
        }
    });

    function showResult(data) {
        elements.emptyState.classList.add('hidden');
        elements.result.classList.remove('hidden');
        elements.result.value = data.text || '';
        elements.resultFileName.textContent = data.fileName || currentFile?.name || 'OCR 결과';
        updateMetrics(data);
        setResultActions(Boolean(data.text));
        showNotice(data.text
            ? `텍스트 추출을 완료했습니다. 결과를 직접 교정할 수 있습니다.`
            : '이미지에서 인식된 텍스트가 없습니다.');
    }

    function updateMetrics(data = {}) {
        elements.metricTime.textContent = data.processingTimeMs != null ? `${data.processingTimeMs} ms` : '-';
        elements.metricWords.textContent = data.wordCount ?? '-';
        elements.metricLines.textContent = data.lineCount ?? '-';
        elements.metricSize.textContent = data.fileSize != null
            ? formatBytes(data.fileSize)
            : currentFile ? formatBytes(currentFile.size) : '-';
    }

    function setLoading(loading) {
        elements.extract.disabled = loading || !currentFile;
        elements.spinner.classList.toggle('hidden', !loading);
        elements.buttonText.textContent = loading ? '텍스트 인식 중...' : '텍스트 추출';
    }

    function setResultActions(enabled) {
        elements.tts.disabled = !enabled;
        elements.copy.disabled = !enabled;
        elements.download.disabled = !enabled;
    }

    elements.result.addEventListener('input', () => setResultActions(Boolean(elements.result.value.trim())));

    elements.tts.addEventListener('click', () => {
        const text = elements.result.value.trim();
        if (!text) return;
        if (!('speechSynthesis' in window)) {
            showNotice('이 브라우저는 음성 읽기를 지원하지 않습니다.', true);
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = selectedLanguage.includes('kor') ? 'ko-KR' : 'en-US';
        utterance.addEventListener('start', () => { elements.tts.textContent = '읽는 중...'; });
        utterance.addEventListener('end', () => { elements.tts.textContent = '음성 듣기'; });
        utterance.addEventListener('error', () => { elements.tts.textContent = '음성 듣기'; });
        window.speechSynthesis.speak(utterance);
    });

    elements.copy.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(elements.result.value);
            elements.copy.textContent = '복사 완료';
            setTimeout(() => { elements.copy.textContent = '복사'; }, 1500);
        } catch {
            showNotice('클립보드에 복사하지 못했습니다.', true);
        }
    });

    elements.download.addEventListener('click', () => {
        const blob = new Blob([elements.result.value], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const baseName = (currentFile?.name || 'ocr-result').replace(/\.[^.]+$/, '');
        link.href = url;
        link.download = `${baseName}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    });

    function saveHistory(data) {
        const history = readHistory();
        history.unshift({
            id: Date.now(),
            fileName: data.fileName || currentFile?.name || '이미지',
            text: data.text || '',
            createdAt: new Date().toISOString(),
            processingTimeMs: data.processingTimeMs,
            wordCount: data.wordCount,
            lineCount: data.lineCount,
            fileSize: data.fileSize,
            language: selectedLanguage
        });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
        renderHistory(elements.historySearch.value);
    }

    function readHistory() {
        try {
            const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function renderHistory(query = '') {
        const keyword = query.trim().toLowerCase();
        const history = readHistory().filter(item =>
            !keyword
            || String(item.fileName || '').toLowerCase().includes(keyword)
            || String(item.text || '').toLowerCase().includes(keyword)
        );

        elements.clearHistory.disabled = readHistory().length === 0;
        if (history.length === 0) {
            elements.historyGrid.innerHTML = `
                <div class="empty-history">
                    <p>${keyword ? '검색 결과가 없습니다.' : '아직 저장된 OCR 작업이 없습니다.'}</p>
                    <span>${keyword ? '다른 검색어를 입력해보세요.' : '이미지를 변환하면 이곳에서 다시 불러올 수 있습니다.'}</span>
                </div>`;
            return;
        }

        elements.historyGrid.innerHTML = history.map(item => `
            <article class="history-card">
                <div class="history-meta">
                    <strong>${escapeHtml(item.fileName || '이미지')}</strong>
                    <time>${formatDate(item.createdAt, item.time)}</time>
                </div>
                <p>${escapeHtml(item.text || '인식된 텍스트 없음')}</p>
                <div class="history-footer">
                    <span>${item.processingTimeMs ?? '-'}ms · ${item.wordCount ?? countWords(item.text)}단어</span>
                    <div>
                        <button type="button" class="text-btn" data-action="load" data-id="${item.id}">불러오기</button>
                        <button type="button" class="text-btn danger" data-action="delete" data-id="${item.id}">삭제</button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    elements.historySearch.addEventListener('input', event => renderHistory(event.target.value));

    elements.historyGrid.addEventListener('click', event => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const id = Number(button.dataset.id);
        if (button.dataset.action === 'delete') {
            deleteHistory(id);
        } else {
            loadHistory(id);
        }
    });

    elements.clearHistory.addEventListener('click', () => {
        if (!readHistory().length || !window.confirm('최근 OCR 작업을 모두 삭제할까요?')) return;
        localStorage.removeItem(HISTORY_KEY);
        renderHistory(elements.historySearch.value);
    });

    function deleteHistory(id) {
        const history = readHistory().filter(item => Number(item.id) !== id);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        renderHistory(elements.historySearch.value);
    }

    function loadHistory(id) {
        const item = readHistory().find(historyItem => Number(historyItem.id) === id);
        if (!item) return;
        elements.emptyState.classList.add('hidden');
        elements.result.classList.remove('hidden');
        elements.result.value = item.text || '';
        elements.resultFileName.textContent = item.fileName || '저장된 OCR 결과';
        selectedLanguage = item.language || selectedLanguage;
        elements.langChips.forEach(chip => chip.classList.toggle('active', chip.dataset.lang === selectedLanguage));
        updateMetrics(item);
        setResultActions(Boolean(item.text));
        showNotice('저장된 OCR 결과를 불러왔습니다. 편집 후 복사하거나 저장할 수 있습니다.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showNotice(message, error = false) {
        elements.infoContent.textContent = message;
        elements.infoBox.classList.remove('hidden');
        elements.infoBox.classList.toggle('error', error);
    }

    function hideNotice() {
        elements.infoBox.classList.add('hidden');
        elements.infoBox.classList.remove('error');
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
    }

    function formatDate(isoDate, legacyTime) {
        const date = new Date(isoDate);
        return Number.isNaN(date.getTime()) ? (legacyTime || '') : date.toLocaleString('ko-KR', {
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    }

    function countWords(text = '') {
        const trimmed = text.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
