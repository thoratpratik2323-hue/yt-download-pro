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
        const response = await fetch('http://localhost:3001/api/info', {
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
            const select = document.getElementById('qualitySelect');
            select.innerHTML = '<option value="">Select Quality</option>';

            // Store data for download
            window.currentVideoTitle = data.title;

            data.formats.forEach(f => {
                const option = document.createElement('option');
                option.value = JSON.stringify({ url: f.url, ext: f.ext });
                option.innerText = `${f.resolution} (${f.ext}) - ${f.filesize}`;
                select.appendChild(option);
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

document.getElementById('downloadBtn').addEventListener('click', () => {
    const selectedFormat = document.getElementById('qualitySelect').value;
    if (!selectedFormat) {
        alert("Please select a quality first!");
        return;
    }

    const { url, ext } = JSON.parse(selectedFormat);
    const title = window.currentVideoTitle || 'video';

    // Create download link to the server proxy
    const downloadUrl = `http://localhost:3001/api/download?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&ext=${encodeURIComponent(ext)}`;

    // Open in new tab or use hidden anchor to force download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${title}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

