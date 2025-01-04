import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url';
import https from 'https';

ffmpeg.setFfmpegPath('C:/msys64/mingw64/bin/ffmpeg.exe'); // Eğer ffmpeg'in yolu doğruysa, problem yaratmaz

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function converterMedia(mediaURL, mediaType) {
    try {
        const validURL = isValidYoutubeUrl(mediaURL);
        if (!validURL) {
            console.error('Invalid YouTube URL.');
            return null;
        }

        const videoId = ytdl.getURLVideoID(mediaURL);
        const downloadDir = path.resolve(__dirname, 'media-downloads');

        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
        }

        const outputPath = path.join(downloadDir, `${videoId}.${mediaType}`);

        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        let stream;
        let outputOptions = {};

        if (mediaType === 'mp4') {
            stream = ytdl(mediaURL, {
                filter: 'audioandvideo',
                requestOptions: {
                    agent,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                }
            });

            outputOptions = {
                codec: 'libx264'
            };
        } else if (mediaType === 'mp3') {
            stream = ytdl(mediaURL, {
                filter: 'audioonly',
                requestOptions: {
                    agent,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Referer': 'https://www.youtube.com/'
                    }
                }
            });

            outputOptions = {
                audioBitrate: 192
            };
        } else {
            throw new Error('Unsupported format type.');
        }

        return new Promise((resolve, reject) => {
            ffmpeg(stream)
                .output(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(err);
                })
                .outputOptions(outputOptions)
                .run();
        });
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

function isValidYoutubeUrl(inputUrl) {
    try {
        const parsedUrl = new URL(inputUrl);
        const allowedHosts = ['youtube.com', 'youtu.be'];

        if (!allowedHosts.some(host => parsedUrl.hostname.includes(host))) {
            return false;
        }

        if (parsedUrl.hostname.includes('youtube.com')) {
            if (parsedUrl.pathname === '/watch' && parsedUrl.searchParams.has('v')) {
                return true;
            }
        }
        if (parsedUrl.hostname === 'youtu.be') {
            if (parsedUrl.pathname.length > 1) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Invalid URL format:', error);
        return false;
    }
}
