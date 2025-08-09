// ==UserScript==
// @name         Anti-Reddit Shader
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Replaces Reddit with an animated WebGL shader background and productivity reminder
// @author       Your Name
// @match        *://*.reddit.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Fragment shader source - adapted from the ShaderToy example
    const fragmentShaderSource = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;
        
        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
            
            float time = u_time * 0.5;
            
            // Create flowing pattern
            vec2 p = uv;
            p.x += sin(time * 0.7 + uv.y * 4.0) * 0.1;
            p.y += cos(time * 0.5 + uv.x * 3.0) * 0.1;
            
            // Multiple layers of sine waves
            float pattern = sin(p.x * 8.0 + time) * sin(p.y * 6.0 + time * 1.3);
            pattern += sin(p.x * 12.0 - time * 0.8) * sin(p.y * 10.0 - time * 0.6) * 0.5;
            pattern += sin(length(p) * 15.0 + time * 2.0) * 0.3;
            
            // Color gradient
            vec3 color1 = vec3(0.2, 0.1, 0.5);  // Dark purple
            vec3 color2 = vec3(0.8, 0.3, 0.6);  // Pink
            vec3 color3 = vec3(0.1, 0.4, 0.8);  // Blue
            
            vec3 color = mix(color1, color2, pattern * 0.5 + 0.5);
            color = mix(color, color3, sin(time + length(uv)) * 0.3 + 0.3);
            
            gl_FragColor = vec4(color, 1.0);
        }
    `;

    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }

    function setupWebGL() {
        const canvas = document.getElementById('shader-canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.error('WebGL not supported');
            return null;
        }

        // Create shaders
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        if (!vertexShader || !fragmentShader) {
            return null;
        }

        // Create program
        const program = createProgram(gl, vertexShader, fragmentShader);
        if (!program) {
            return null;
        }

        // Set up geometry (full screen quad)
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1,
        ]), gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const timeLocation = gl.getUniformLocation(program, 'u_time');
        const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

        return {
            gl,
            program,
            positionLocation,
            timeLocation,
            resolutionLocation,
            positionBuffer
        };
    }

    function resizeCanvas() {
        const canvas = document.getElementById('shader-canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function render(webglData) {
        if (!webglData) return;
        
        const { gl, program, positionLocation, timeLocation, resolutionLocation, positionBuffer } = webglData;
        
        resizeCanvas();
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        
        // Set uniforms
        gl.uniform1f(timeLocation, performance.now() * 0.001);
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
        
        // Set up position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(() => render(webglData));
    }

    // Replace page content
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
                    overflow: hidden;
                }
                
                #shader-canvas {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: -1;
                }
                
                .message-overlay {
                    background: rgba(0, 0, 0, 0.9);
                    color: #00ff41;
                    padding: 40px 60px;
                    border-radius: 0;
                    text-align: center;
                    box-shadow: 
                        0 0 20px rgba(0, 255, 65, 0.5),
                        inset 0 0 20px rgba(0, 255, 65, 0.1),
                        0 0 40px rgba(0, 255, 65, 0.3);
                    backdrop-filter: blur(10px);
                    border: 2px solid #00ff41;
                    z-index: 10;
                    position: relative;
                    transform: perspective(1000px) rotateX(5deg);
                    animation: cyberpunkGlow 2s ease-in-out infinite alternate;
                }
                
                .message-overlay::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(45deg, #00ff41, #ff0080, #00ff41);
                    z-index: -1;
                    animation: borderFlow 3s linear infinite;
                }
                
                .message-overlay::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            rgba(0, 255, 65, 0.03) 2px,
                            rgba(0, 255, 65, 0.03) 4px
                        );
                    pointer-events: none;
                    animation: scanlines 0.1s linear infinite;
                }
                
                .message-overlay h1 {
                    margin: 0;
                    font-size: 3.5em;
                    font-weight: 300;
                    font-family: 'Courier New', monospace;
                    text-shadow: 
                        0 0 5px #00ff41,
                        0 0 10px #00ff41,
                        0 0 15px #00ff41,
                        0 0 20px #00ff41,
                        0 0 35px #00ff41,
                        0 0 40px #00ff41;
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    animation: textFlicker 0.5s ease-in-out infinite alternate;
                }
                
                @keyframes cyberpunkGlow {
                    0% { 
                        box-shadow: 
                            0 0 20px rgba(0, 255, 65, 0.5),
                            inset 0 0 20px rgba(0, 255, 65, 0.1),
                            0 0 40px rgba(0, 255, 65, 0.3);
                    }
                    100% { 
                        box-shadow: 
                            0 0 30px rgba(0, 255, 65, 0.8),
                            inset 0 0 30px rgba(0, 255, 65, 0.2),
                            0 0 60px rgba(0, 255, 65, 0.5);
                    }
                }
                
                @keyframes borderFlow {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 100% 100%; }
                }
                
                @keyframes scanlines {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(4px); }
                }
                
                @keyframes textFlicker {
                    0% { 
                        opacity: 1;
                        text-shadow: 
                            0 0 5px #00ff41,
                            0 0 10px #00ff41,
                            0 0 15px #00ff41,
                            0 0 20px #00ff41,
                            0 0 35px #00ff41,
                            0 0 40px #00ff41;
                    }
                    100% { 
                        opacity: 0.8;
                        text-shadow: 
                            0 0 2px #00ff41,
                            0 0 8px #00ff41,
                            0 0 12px #00ff41,
                            0 0 16px #00ff41,
                            0 0 30px #00ff41,
                            0 0 35px #00ff41;
                    }
                }
                
                @media (max-width: 768px) {
                    .message-overlay h1 {
                        font-size: 2.5em;
                        letter-spacing: 2px;
                    }
                    .message-overlay {
                        padding: 30px 40px;
                        margin: 20px;
                        transform: perspective(800px) rotateX(3deg);
                    }
                }
                
                @media (max-width: 480px) {
                    .message-overlay h1 {
                        font-size: 2em;
                        letter-spacing: 1px;
                    }
                    .message-overlay {
                        padding: 25px 35px;
                        margin: 15px;
                    }
                }
            </style>
        </head>
        <body>
            <canvas id="shader-canvas"></canvas>
            <div class="message-overlay">
                <h1>go back to work</h1>
            </div>
        </body>
    `;

    // Initialize WebGL shader
    window.addEventListener('load', () => {
        resizeCanvas();
        const webglData = setupWebGL();
        if (webglData) {
            render(webglData);
        } else {
            // Fallback to simple gradient if WebGL fails
            document.body.style.background = 'linear-gradient(45deg, #2c1810, #8b4513, #4a2c2a)';
            document.body.style.backgroundSize = '400% 400%';
            document.body.style.animation = 'gradientShift 10s ease infinite';
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `;
            document.head.appendChild(style);
        }
    });

    window.addEventListener('resize', resizeCanvas);
})();