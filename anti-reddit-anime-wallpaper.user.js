// ==UserScript==
// @name         Anti-Reddit Anime Wallpaper
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Replaces Reddit with cycling anime backgrounds and a productivity reminder
// @author       Your Name
// @match        *://*.reddit.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Array of tasteful anime fan service wallpapers
    const animeImages = [
        'https://i.imgur.com/yQKq2Vf.jpg', // Anime girl with flowers
        'https://i.imgur.com/J8K9mNx.jpg', // School uniform anime girl
        'https://i.imgur.com/8wKqL7P.jpg', // Anime girl in casual outfit
        'https://i.imgur.com/pN4sM2R.jpg', // Anime girl with long hair
        'https://i.imgur.com/vR6tX9Q.jpg', // Anime girl in summer dress
        'https://i.imgur.com/2L8mK5N.jpg', // Anime girl reading
        'https://i.imgur.com/9P3nL4M.jpg', // Anime girl with cat ears
        'https://i.imgur.com/5K7jQ2R.jpg'  // Anime girl in traditional outfit
    ];

    let currentImageIndex = 0;

    document.documentElement.innerHTML = `
        <head>
            <title>Productivity</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: 'Arial', sans-serif;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-attachment: fixed;
                    transition: background-image 1s ease-in-out;
                }
                
                .message-overlay {
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 30px 50px;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                }
                
                .message-overlay h1 {
                    margin: 0;
                    font-size: 3em;
                    font-weight: bold;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
                    letter-spacing: 2px;
                }
                
                @media (max-width: 768px) {
                    .message-overlay h1 {
                        font-size: 2em;
                    }
                    .message-overlay {
                        padding: 20px 30px;
                        margin: 20px;
                    }
                }
            </style>
        </head>
        <body id="anime-body">
            <div class="message-overlay">
                <h1>go back to work</h1>
            </div>
        </body>
    `;

    function changeBackground() {
        const body = document.getElementById('anime-body');
        if (body && animeImages.length > 0) {
            body.style.backgroundImage = `url('${animeImages[currentImageIndex]}')`;
            currentImageIndex = (currentImageIndex + 1) % animeImages.length;
        }
    }

    // Set initial background
    changeBackground();

    // Change background every 5 seconds
    setInterval(changeBackground, 5000);
})();