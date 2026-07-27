document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation & View Switching ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const viewSections = document.querySelectorAll('.view-section');

    window.switchView = function(viewId) {
        navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewId);
        });
        viewSections.forEach(sec => {
            sec.classList.toggle('active', sec.id === viewId);
        });
        if (viewId === 'boardView') {
            fetchPosts();
        } else if (viewId === 'searchView') {
            renderHistory();
        }
    };

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
        });
    });

    document.getElementById('logoHomeBtn')?.addEventListener('click', () => switchView('homeView'));

    // --- OCR Elements ---
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
    const statusDot = document.querySelector('.status-dot');
    const engineStatusText = document.getElementById('engineStatusText');

    const metricTime = document.getElementById('metricTime');
    const metricWords = document.getElementById('metricWords');
    const metricLines = document.getElementById('metricLines');
    const metricSize = document.getElementById('metricSize');

    const resultFileName = document.getElementById('resultFileName');
    const emptyState = document.getElementById('emptyState');
    const resultTextarea = document.getElementById('resultTextarea');

    const ttsBtn = document.getElementById('ttsBtn');
    const shareBoardBtn = document.getElementById('shareBoardBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    const infoBox = document.getElementById('infoBox');
    const infoContent = document.getElementById('infoContent');

    let currentFile = null;
    let selectedLanguage = 'kor+eng';

    // Fetch Engine Status
    fetchEngineStatus();

    async function fetchEngineStatus() {
        try {
            const res = await fetch('/api/ocr/status');
            const status = await res.json();
            if (status.available) {
                statusDot.classList.add('active');
                statusDot.classList.remove('pulse');
            } else {
                engineStatusText.textContent = 'Engine Warning';
                showInfoNotice(status.message);
            }
        } catch (e) {
            engineStatusText.textContent = 'Server Status Offline';
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
        if (files.length > 0) handleFileSelect(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
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
        
        ttsBtn.disabled = true;
        shareBoardBtn.disabled = true;
        copyBtn.disabled = true;
        downloadBtn.disabled = true;
    }

    langChips.forEach(chip => {
        chip.addEventListener('click', () => {
            langChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedLanguage = chip.dataset.lang;
        });
    });

    // Extract Text API
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
                saveToHistory(data);
            } else {
                handleError(data.errorMessage || '텍스트 추출 중 오류가 발생했습니다.');
            }
        } catch (error) {
            handleError('서버 통신 실패: ' + error.message);
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

        ttsBtn.disabled = !data.text;
        shareBoardBtn.disabled = !data.text;
        copyBtn.disabled = !data.text;
        downloadBtn.disabled = !data.text;

        showInfoNotice(`인식 완료! (소요 시간: ${data.processingTimeMs}ms)`);
    }

    function handleError(msg) {
        alert(msg);
        showInfoNotice(`오류: ${msg}`);
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

    // TTS (Text-to-Speech)
    ttsBtn.addEventListener('click', () => {
        const text = resultTextarea.value;
        if (!text) return;

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any previous playback
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = selectedLanguage.includes('kor') ? 'ko-KR' : 'en-US';
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
            
            ttsBtn.innerText = '🔊 재생 중...';
            utterance.onend = () => { ttsBtn.innerText = '🔊 음성 듣기'; };
        } else {
            alert('이 브라우저는 음성 합성(TTS)을 지원하지 않습니다.');
        }
    });

    // Share to Board
    shareBoardBtn.addEventListener('click', () => {
        const text = resultTextarea.value;
        if (!text) return;

        switchView('boardView');
        openPostModal(text);
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        if (!resultTextarea.value) return;
        navigator.clipboard.writeText(resultTextarea.value).then(() => {
            copyBtn.innerText = '📋 복사됨!';
            setTimeout(() => { copyBtn.innerText = '📋 복사'; }, 2000);
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

    // --- ANONYMOUS BULLETIN BOARD ---
    const boardFeed = document.getElementById('boardFeed');
    const postModal = document.getElementById('postModal');
    const openPostModalBtn = document.getElementById('openPostModalBtn');
    const closePostModalBtn = document.getElementById('closePostModalBtn');
    const cancelPostBtn = document.getElementById('cancelPostBtn');
    const postForm = document.getElementById('postForm');
    const postOcrAttached = document.getElementById('postOcrAttached');

    openPostModalBtn.addEventListener('click', () => openPostModal());
    closePostModalBtn.addEventListener('click', closePostModal);
    cancelPostBtn.addEventListener('click', closePostModal);

    function openPostModal(attachedText = '') {
        postModal.classList.remove('hidden');
        if (attachedText) {
            postOcrAttached.value = attachedText;
            document.getElementById('postTitle').value = `[OCR 공유] 이미지 추출 텍스트`;
        } else {
            postOcrAttached.value = '';
        }
    }

    function closePostModal() {
        postModal.classList.add('hidden');
        postForm.reset();
        document.getElementById('postAuthor').value = '익명';
    }

    async function fetchPosts() {
        try {
            const res = await fetch('/api/posts');
            const posts = await res.json();
            renderPosts(posts);
        } catch (e) {
            boardFeed.innerHTML = `<div class="empty-state">게시글을 불러올 수 없습니다.</div>`;
        }
    }

    function renderPosts(posts) {
        if (!posts || posts.length === 0) {
            boardFeed.innerHTML = `<div class="empty-state">등록된 익명 게시글이 없습니다. 첫 번째 글을 작성해보세요!</div>`;
            return;
        }

        boardFeed.innerHTML = posts.map(post => `
            <div class="post-card" data-id="${post.id}">
                <div class="post-meta">
                    <span class="post-author">👤 ${escapeHtml(post.author)}</span>
                    <span class="post-date">${post.createdAt}</span>
                </div>
                <h3 class="post-title">${escapeHtml(post.title)}</h3>
                <div class="post-content">${escapeHtml(post.content)}</div>
                ${post.attachedOcrText ? `<div class="post-attached-ocr">📷 <b>OCR 첨부:</b> ${escapeHtml(post.attachedOcrText)}</div>` : ''}
                <div class="post-footer">
                    <button type="button" class="like-btn" onclick="likePost(${post.id})">
                        ❤️ 좋아요 ${post.likeCount}
                    </button>
                    <button type="button" class="delete-btn" onclick="deletePost(${post.id})">
                        🗑️ 삭제
                    </button>
                </div>
            </div>
        `).join('');
    }

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const author = document.getElementById('postAuthor').value;
        const title = document.getElementById('postTitle').value;
        const content = document.getElementById('postContent').value;
        const attachedOcrText = postOcrAttached.value;

        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, title, content, attachedOcrText })
            });

            if (res.ok) {
                closePostModal();
                fetchPosts();
            } else {
                alert('글 등록에 실패했습니다.');
            }
        } catch (e) {
            alert('서버 오류 발생');
        }
    });

    window.likePost = async function(id) {
        try {
            const res = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
            if (res.ok) fetchPosts();
        } catch (e) {}
    };

    window.deletePost = async function(id) {
        if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
            if (res.ok) fetchPosts();
        } catch (e) {}
    };

    // --- WEB SPEECH API (STT Voice Recognition) & SEARCH ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    setupVoiceSearch('homeMicBtn', 'homeSearchInput', 'homeVoiceStatus');
    setupVoiceSearch('searchMicBtn', 'mainSearchInput', 'searchVoiceStatus');

    function setupVoiceSearch(micBtnId, inputId, statusId) {
        const micBtn = document.getElementById(micBtnId);
        const input = document.getElementById(inputId);
        const status = document.getElementById(statusId);

        if (!micBtn || !input) return;

        if (!SpeechRecognition) {
            micBtn.title = '이 브라우저는 음성 인식을 지원하지 않습니다 (Chrome/Safari 권장)';
            return;
        }

        let recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR'; // Korean recognition default
        recognition.interimResults = false;

        let isListening = false;

        micBtn.addEventListener('click', () => {
            if (isListening) {
                recognition.stop();
            } else {
                try {
                    recognition.start();
                } catch (e) {}
            }
        });

        recognition.onstart = () => {
            isListening = true;
            micBtn.classList.add('recording');
            if (status) status.classList.remove('hidden');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            filterSearch(transcript);
        };

        recognition.onerror = () => {
            stopListening();
        };

        recognition.onend = () => {
            stopListening();
        };

        function stopListening() {
            isListening = false;
            micBtn.classList.remove('recording');
            if (status) status.classList.add('hidden');
        }

        input.addEventListener('input', (e) => filterSearch(e.target.value));
    }

    function filterSearch(query) {
        renderHistory(query);
    }

    // --- OCR HISTORY LOCALSTORAGE ---
    function saveToHistory(data) {
        let history = JSON.parse(localStorage.getItem('ocr_history') || '[]');
        history.unshift({
            id: Date.now(),
            fileName: data.fileName,
            text: data.text,
            time: new Date().toLocaleTimeString(),
            processingTimeMs: data.processingTimeMs
        });
        if (history.length > 20) history.pop();
        localStorage.setItem('ocr_history', JSON.stringify(history));
    }

    function renderHistory(filter = '') {
        const historyGrid = document.getElementById('historyGrid');
        if (!historyGrid) return;

        let history = JSON.parse(localStorage.getItem('ocr_history') || '[]');
        
        if (filter.trim()) {
            const lower = filter.toLowerCase();
            history = history.filter(item => 
                item.fileName.toLowerCase().includes(lower) || 
                item.text.toLowerCase().includes(lower)
            );
        }

        if (history.length === 0) {
            historyGrid.innerHTML = `<div class="empty-state">저장된 OCR 인식 결과가 없습니다.</div>`;
            return;
        }

        historyGrid.innerHTML = history.map(item => `
            <div class="history-card">
                <div class="history-meta">
                    <span>📄 ${escapeHtml(item.fileName)}</span>
                    <span>${item.time} (${item.processingTimeMs}ms)</span>
                </div>
                <div class="history-text">${escapeHtml(item.text)}</div>
            </div>
        `).join('');
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
