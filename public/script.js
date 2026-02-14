document.getElementById('fetchBtn').addEventListener('click', async () => {
    const url = document.getElementById('videoUrl').value;
    const loader = document.getElementById('loader');
    const resultCard = document.getElementById('resultCard');
    const fetchBtn = document.getElementById('fetchBtn');

    if (!url) {
        alert("Please paste a valid YouTube URL!");
        return;
    }

    // Reset UI
    loader.classList.remove('hidden');
    resultCard.classList.add('hidden');
    fetchBtn.disabled = true;

    try {
        const response = await fetch('/api/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (data.error) {
            alert(data.error);
        } else {
            // Update UI with video details
            document.getElementById('thumbImg').src = data.thumbnail;
            document.getElementById('videoTitle').innerText = data.title;
            document.getElementById('uploader').innerText = data.uploader;
            document.getElementById('duration').innerText = data.duration;

            // Populate quality options
            const optionsContainer = document.getElementById('customOptions');
            const selectedOptionText = document.getElementById('selectedOptionText');
            const hiddenInput = document.getElementById('selectedQualityValue');

            optionsContainer.innerHTML = '';
            selectedOptionText.innerText = 'Select Quality';
            hiddenInput.value = '';

            // Store data for download
            window.currentVideoTitle = data.title;

            data.formats.forEach(f => {
                const item = document.createElement('div');
                item.className = 'option-item';
                const typeIcon = f.type === 'Audio' ? 'fas fa-music' : 'fas fa-video';
                const label = `${f.resolution} (${f.ext}) - ${f.filesize}`;

                item.innerHTML = `<i class="${typeIcon}"></i> <span>${label}</span>`;

                item.addEventListener('click', () => {
                    selectedOptionText.innerText = label;
                    hiddenInput.value = JSON.stringify({ url: f.url, ext: f.ext });
                    optionsContainer.classList.add('hidden');
                });

                optionsContainer.appendChild(item);
            });

            resultCard.classList.remove('hidden');
            resultCard.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (err) {
        console.error(err);
        alert("Something went wrong. Make sure the server is running!");
    } finally {
        loader.classList.add('hidden');
        fetchBtn.disabled = false;
    }
});

// Custom Select Toggle
document.getElementById('customSelect').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('customOptions').classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', () => {
    const options = document.getElementById('customOptions');
    if (options) options.classList.add('hidden');
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const selectedFormat = document.getElementById('selectedQualityValue').value;
    if (!selectedFormat) {
        alert("Please select a quality first!");
        return;
    }

    const { url, ext } = JSON.parse(selectedFormat);
    const title = window.currentVideoTitle || 'video';
    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&ext=${encodeURIComponent(ext)}`;

    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const downloadBtn = document.getElementById('downloadBtn');

    // UI Reset
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressStatus.innerText = 'Starting download...';
    downloadBtn.disabled = true;

    const xhr = new XMLHttpRequest();
    xhr.open('GET', downloadUrl, true);
    xhr.responseType = 'blob';

    xhr.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            progressBar.style.width = percentComplete + '%';
            progressStatus.innerText = `Downloading... ${Math.round(percentComplete)}%`;
        } else {
            progressStatus.innerText = 'Downloading...';
        }
    };

    xhr.onload = () => {
        if (xhr.status === 200) {
            const blob = xhr.response;
            const downloadLink = document.createElement('a');
            const fileName = `${title.replace(/[^\w\s]/gi, '')}.${ext}`;

            downloadLink.href = window.URL.createObjectURL(blob);
            downloadLink.download = fileName;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            progressStatus.innerText = 'Download Complete! ✨';
            progressBar.style.width = '100%';

            setTimeout(() => {
                progressContainer.classList.add('hidden');
                downloadBtn.disabled = false;
            }, 3000);
        } else {
            alert('Download failed. Please try again.');
            downloadBtn.disabled = false;
        }
    };

    xhr.onerror = () => {
        alert('Network error. Please make sure the server is running.');
        downloadBtn.disabled = false;
    };

    xhr.send();
});

