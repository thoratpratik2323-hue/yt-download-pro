const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const ytDlp = require('yt-dlp-exec');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fetch video info
app.post('/api/info', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        console.log(`Fetching info for: ${url}`);
        const info = await ytDlp(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
        });

        const formats = info.formats
            .filter(f => (f.vcodec !== 'none' && f.acodec !== 'none') || (f.vcodec === 'none' && f.acodec !== 'none'))
            .map(f => ({
                format_id: f.format_id,
                ext: f.ext,
                type: f.vcodec === 'none' ? 'Audio' : 'Video',
                resolution: f.vcodec === 'none' ? 'Audio only' : (f.resolution || f.format_note || 'N/A'),
                url: f.url,
                filesize: f.filesize ? (f.filesize / (1024 * 1024)).toFixed(2) + ' MB' : 'Size N/A'
            }))
            .reverse();

        res.json({
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration_string,
            uploader: info.uploader,
            formats: formats
        });
    } catch (error) {
        console.error('Error fetching info:', error);
        res.status(500).json({ error: 'Failed to fetch video info. Make sure the link is valid.' });
    }
});

// Proxy download to force "Save As"
app.get('/api/download', async (req, res) => {
    const { url, title, ext } = req.query;
    if (!url) return res.status(400).send('URL is required');

    try {
        console.log(`Starting download proxy for: ${title}`);

        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const safeTitle = title.replace(/[^\w\s]/gi, '').substring(0, 100);
        const fileName = `${safeTitle}.${ext || 'mp4'}`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        response.data.pipe(res);
    } catch (error) {
        console.error('Download proxy error:', error);
        res.status(500).send('Failed to download video.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
