const express = require('express');
const axios = require('axios');

const app = express();

app.get('/proxy', async (req, res) => {
    const fileUrl = req.query.url;

    try {
        const response = await axios.get(fileUrl, {
            headers: { Cookie: 'session=your_session_cookie_here' },
            responseType: 'stream',
        });

        res.set(response.headers);
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send('Error fetching video');
    }
});

app.listen(5000, () => console.log('Proxy server running on port 5000'));