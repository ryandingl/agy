/**
 * CYBER_BREAK - Cyberpunk Retro Breakout Game Engine
 * Features:
 * - HTML5 Canvas 2D rendering with high-perf glowing neon aesthetics.
 * - Procedural Audio Synthesizer (Web Audio API) for sound effects and a background synth track.
 * - Multi-ball, Laser cannons, Shield barrier, Paddle widening, Speed distortion power-ups.
 * - Particle system for explosion and trail effects.
 * - Screen-shake, CRT scanline adjustments, and dynamic diagnostic panels.
 * - Responsive mouse, touch, and keyboard control.
 */

// --- CONFIGURATION & STATES ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const FIXED_BALL_SPEED = 8.5;

// Game State Object
const state = {
    mode: 'MENU', // MENU, PLAYING, GAMEOVER, VICTORY
    gameMode: 'STORY', // STORY, ENDLESS
    score: 0,
    multiplier: 1.0,
    level: 1,
    lives: 3,
    highScore: 0,
    audioEnabled: true,
    diagnostics: {
        ballSpeed: 'NORMAL',
        shieldActive: false,
        laserCharge: 0,
        coreTemp: 37,
    },
    screenShake: 0,
    flashVignette: { color: '#ff0055', alpha: 0 },
    glitchedInLevel: false,
    consecutiveLevelsNoDeath: 0,
    inputMode: 'keyboard',
    currentShopTab: 'upgrades',
    currentSkinCategory: 'paddle',
    currentUser: null,
    coolerPurchases: 0,
    currentRadioTrack: 0,
    contracts: [],
    paddleBouncesInLevel: 0,
    botScore: 0,
    botTime: 0,
    matchScore: 0,
    vsScore: 0,
    skins: {
        paddle: {
            owned: [true, false, false, false],
            active: 0
        },
        ball: {
            owned: [true, false, false, false],
            active: 0
        },
        brick: {
            owned: [true, false, false, false],
            active: 0
        },
        theme: {
            owned: [true, false, false, false],
            active: 0
        }
    }
};

// Safe Memory fallback for Private Browsing / Restricted Storage environments
const memoryStore = {};
const safeLocalStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return memoryStore[key] || null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            memoryStore[key] = String(value);
        }
    },
    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            delete memoryStore[key];
        }
    }
};

// User Storage Keys Helper & Wrapper
function getUserKey(key) {
    if (key === 'cyberbreak_highscore' || key === 'cyberbreak_leaderboard' || key === 'cyberbreak_registered_users' || key === 'cyberbreak_last_user') {
        return key;
    }
    if (state.currentUser) {
        return `${key}_${state.currentUser}`;
    }
    return key;
}

const storage = {
    get(key) {
        return safeLocalStorage.getItem(getUserKey(key));
    },
    set(key, value) {
        safeLocalStorage.setItem(getUserKey(key), value);
    },
    remove(key) {
        safeLocalStorage.removeItem(getUserKey(key));
    }
};

// --- VS BATTLE ECONOMY & SCORE FUNCTIONS ---
function loadVsScore() {
    const cached = storage.get('cyberbreak_vs_score');
    if (cached) {
        state.vsScore = parseInt(cached) || 0;
    } else {
        state.vsScore = 0;
    }
}

function saveVsScore() {
    storage.set('cyberbreak_vs_score', state.vsScore || 0);
}

function increaseScore(amount) {
    if (state.gameMode === 'SCORE_BATTLE' || state.gameMode === 'PONG_BATTLE') {
        state.matchScore = (state.matchScore || 0) + amount;
    } else {
        state.score = (state.score || 0) + amount;
    }
}

// Skins Configuration
const SKINS_CONFIG = {
    paddle: [
        {
            name: "DEFAULT_STEEL // 默认钢板",
            price: 0,
            bonus: 0.0,
            desc: "标准警示斜纹金属板，无尺寸加成",
            color: "#0044ff",
            draw(p, c = ctx) {
                c.save();
                c.shadowBlur = 15;
                c.shadowColor = p.color || this.color;
                c.fillStyle = p.color || this.color;
                
                // Paddle body shape path
                c.beginPath();
                c.moveTo(p.x, p.y + p.height);
                c.lineTo(p.x + 8, p.y);
                c.lineTo(p.x + p.width - 8, p.y);
                c.lineTo(p.x + p.width, p.y + p.height);
                c.closePath();
                c.fill();
                c.clip(); // Clip caution lines inside paddle
                
                // Tech Caution stripe warning textures
                c.strokeStyle = 'rgba(255, 255, 255, 0.18)';
                c.lineWidth = 4;
                c.beginPath();
                for (let offset = -p.height; offset < p.width + p.height; offset += 14) {
                    c.moveTo(p.x + offset, p.y);
                    c.lineTo(p.x + offset + p.height, p.y + p.height);
                }
                c.stroke();
                
                c.restore();
            }
        },
        {
            name: "NEON_GLOW_V1 // 霓虹极光",
            price: 200,
            bonus: 0.05,
            desc: "极光绿高频偏振镀层，双折折线纹路，长度增加 5%",
            color: "#00ffcc",
            draw(p, c = ctx) {
                c.save();
                c.shadowBlur = 18;
                c.shadowColor = this.color;
                c.fillStyle = '#051210';
                c.strokeStyle = this.color;
                c.lineWidth = 2.2;
                
                c.beginPath();
                c.moveTo(p.x, p.y + p.height);
                c.lineTo(p.x + 8, p.y);
                c.lineTo(p.x + p.width - 8, p.y);
                c.lineTo(p.x + p.width, p.y + p.height);
                c.closePath();
                c.fill();
                c.stroke();
                c.clip();
                
                // Cyber Chevron folding line texture
                c.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                c.lineWidth = 1;
                c.beginPath();
                // Left chevron
                c.moveTo(p.x + 15, p.y + p.height - 2);
                c.lineTo(p.x + 25, p.y + 4);
                c.lineTo(p.x + 38, p.y + 4);
                // Right chevron
                c.moveTo(p.x + p.width - 15, p.y + p.height - 2);
                c.lineTo(p.x + p.width - 25, p.y + 4);
                c.lineTo(p.x + p.width - 38, p.y + 4);
                // Center circuit connection
                c.moveTo(p.x + p.width/2 - 12, p.y + p.height/2);
                c.lineTo(p.x + p.width/2 + 12, p.y + p.height/2);
                c.stroke();
                
                // Micro terminals
                c.fillStyle = '#ffffff';
                c.fillRect(p.x + 38, p.y + 3, 2.5, 2.5);
                c.fillRect(p.x + p.width - 40.5, p.y + 3, 2.5, 2.5);
                
                c.restore();
            }
        },
        {
            name: "PLASMA_STRIKE // 等离子战盾",
            price: 300,
            bonus: 0.10,
            desc: "等离子护盾发生器，蜂窝装甲花纹，长度增加 10%",
            color: "#ff00ff",
            draw(p, c = ctx) {
                c.save();
                c.shadowBlur = 22;
                c.shadowColor = this.color;
                c.fillStyle = 'rgba(25, 10, 35, 0.9)';
                c.strokeStyle = this.color;
                c.lineWidth = 2.5;
                
                c.beginPath();
                c.moveTo(p.x, p.y + p.height);
                c.lineTo(p.x + 10, p.y);
                c.lineTo(p.x + p.width - 10, p.y);
                c.lineTo(p.x + p.width, p.y + p.height);
                c.closePath();
                c.fill();
                c.stroke();
                c.clip();
                
                // Honeycomb grid texture overlays
                c.strokeStyle = 'rgba(255, 0, 255, 0.22)';
                c.lineWidth = 0.8;
                const size = 5;
                const h = size * Math.sqrt(3);
                for (let y = p.y - h; y < p.y + p.height + h; y += h) {
                    c.beginPath();
                    for (let x = p.x - size; x < p.x + p.width + size; x += size * 3) {
                        c.moveTo(x, y);
                        c.lineTo(x + size, y);
                        c.lineTo(x + size * 1.5, y + h / 2);
                        c.lineTo(x + size, y + h);
                        c.lineTo(x, y + h);
                        c.lineTo(x - size * 0.5, y + h / 2);
                        c.closePath();
                    }
                    c.stroke();
                }
                
                // Energized pulsing central conduit
                const pulse = Math.sin(Date.now() / 80) * 0.4 + 0.6;
                c.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
                c.lineWidth = 2;
                c.shadowColor = '#ffffff';
                c.beginPath();
                c.moveTo(p.x + 20, p.y + p.height/2);
                c.lineTo(p.x + p.width - 20, p.y + p.height/2);
                c.stroke();
                
                c.restore();
            }
        },
        {
            name: "QUANTUM_INFINITY // 量子无极",
            price: 500,
            bonus: 0.175,
            desc: "终极量子网格稳定器，黄金机械分段与量子旋转环，长度增加 17.5%",
            color: "#ffb700",
            draw(p, c = ctx) {
                c.save();
                c.shadowBlur = 25;
                c.shadowColor = this.color;
                c.fillStyle = '#0a0912';
                c.strokeStyle = this.color;
                c.lineWidth = 2.5;
                
                c.beginPath();
                c.moveTo(p.x, p.y + p.height);
                c.lineTo(p.x + 12, p.y);
                c.lineTo(p.x + p.width - 12, p.y);
                c.lineTo(p.x + p.width, p.y + p.height);
                c.closePath();
                c.fill();
                c.stroke();
                c.clip();
                
                // Golden warning micro-grid patterns
                c.strokeStyle = 'rgba(255, 183, 0, 0.28)';
                c.lineWidth = 1;
                c.beginPath();
                for (let offset = 20; offset < p.width - 20; offset += 16) {
                    c.moveTo(p.x + offset, p.y + 1);
                    c.lineTo(p.x + offset + 4, p.y + p.height - 1);
                }
                c.stroke();
                
                // Central vortex loop (Rotating rings detail)
                const rotation = (Date.now() / 150) % (Math.PI * 2);
                c.strokeStyle = '#ffffff';
                c.lineWidth = 1.5;
                c.beginPath();
                c.arc(p.x + p.width/2, p.y + p.height/2, 5, rotation, rotation + Math.PI * 1.5);
                c.stroke();
                
                // Quantum golden segments
                c.fillStyle = this.color;
                const colW = (p.width - 60) / 4;
                const pulseHeight = Math.sin(Date.now() / 150) * 1.5;
                for (let i = 0; i < 4; i++) {
                    const leftX = p.x + 30 + i * colW;
                    // Leave space for the center core
                    if (leftX + colW/2 > p.x + p.width/2 - 10 && leftX + colW/2 < p.x + p.width/2 + 10) continue;
                    c.fillRect(leftX + 2, p.y + 3 + pulseHeight, colW - 4, p.height - 6);
                }
                
                // Terminal endpoints glow
                c.fillStyle = '#ffffff';
                c.shadowColor = '#ffffff';
                c.shadowBlur = 10;
                c.beginPath();
                c.arc(p.x + 4, p.y + p.height/2, 3, 0, Math.PI * 2);
                c.arc(p.x + p.width - 4, p.y + p.height/2, 3, 0, Math.PI * 2);
                c.fill();
                
                c.restore();
            }
        }
    ],
    ball: [
        {
            name: "CYBER_SPHERE // 默认核心",
            price: 0,
            bonus: 0.0,
            desc: "标准量子小球，中心水流漩涡纹",
            color: "#00f0ff",
            trailColor: "rgba(0, 240, 255, ",
            draw(b, c = ctx) {
                c.save();
                c.shadowBlur = 12;
                c.shadowColor = b.color || this.color;
                c.fillStyle = b.color || this.color;
                
                // Sphere boundary
                c.beginPath();
                c.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                c.fill();
                
                // Swirl lines
                c.strokeStyle = '#050515';
                c.lineWidth = 1.2;
                c.beginPath();
                const rot = (Date.now() / 250) % (Math.PI * 2);
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
                    c.moveTo(b.x, b.y);
                    const c1x = b.x + (b.radius * 0.45) * Math.cos(a + rot);
                    const c1y = b.y + (b.radius * 0.45) * Math.sin(a + rot);
                    const c2x = b.x + (b.radius * 0.8) * Math.cos(a + rot + 0.8);
                    const c2y = b.y + (b.radius * 0.8) * Math.sin(a + rot + 0.8);
                    c.bezierCurveTo(c1x, c1y, c2x, c2y, b.x + b.radius * Math.cos(a + rot + 1.2), b.y + b.radius * Math.sin(a + rot + 1.2));
                }
                c.stroke();
                
                c.restore();
            }
        },
        {
            name: "PHANTOM_CORE // 幻影之核",
            price: 100,
            bonus: 0.025,
            desc: "高频幽灵粒子，深邃星漩，尺寸增加 2.5%",
            color: "#aa00ff",
            trailColor: "rgba(170, 0, 255, ",
            draw(b, c = ctx) {
                c.save();
                c.shadowBlur = 15;
                c.shadowColor = this.color;
                c.fillStyle = '#0e031c';
                c.strokeStyle = this.color;
                c.lineWidth = 1.5;
                
                c.beginPath();
                c.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                c.fill();
                c.stroke();
                
                // Arch spiral vortex swirl
                const rot = -(Date.now() / 160) % (Math.PI * 2);
                c.strokeStyle = '#ffffff';
                c.lineWidth = 1.0;
                c.beginPath();
                for (let theta = 0; theta < Math.PI * 3.5; theta += 0.1) {
                    const r = (theta / (Math.PI * 3.5)) * b.radius * 0.85;
                    const px = b.x + r * Math.cos(theta + rot);
                    const py = b.y + r * Math.sin(theta + rot);
                    if (theta === 0) c.moveTo(px, py);
                    else c.lineTo(px, py);
                }
                c.stroke();
                
                // Swirl center star glow
                c.fillStyle = '#ffffff';
                c.beginPath();
                c.arc(b.x, b.y, b.radius * 0.25, 0, Math.PI * 2);
                c.fill();
                
                c.restore();
            }
        },
        {
            name: "NEUTRON_PULSE // 中子脉冲",
            price: 200,
            bonus: 0.06,
            desc: "中子爆缩力场，双旋臂电磁漩涡，尺寸增加 6%",
            color: "#ff0055",
            trailColor: "rgba(255, 0, 85, ",
            draw(b, c = ctx) {
                c.save();
                c.shadowBlur = 18;
                c.shadowColor = this.color;
                
                const pulse = Math.sin(Date.now() / 80) * 1.5 + 1.5;
                c.fillStyle = `rgba(255, 0, 85, 0.25)`;
                c.beginPath();
                c.arc(b.x, b.y, b.radius + pulse, 0, Math.PI * 2);
                c.fill();
                
                c.fillStyle = this.color;
                c.beginPath();
                c.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                c.fill();
                
                // Dual electric spiral arm swirl
                c.strokeStyle = '#ffffff';
                c.lineWidth = 1.2;
                const rot = (Date.now() / 100) % (Math.PI * 2);
                for (let arm = 0; arm < 2; arm++) {
                    const startAngle = rot + arm * Math.PI;
                    c.beginPath();
                    for (let theta = 0; theta < Math.PI * 4; theta += 0.15) {
                        const r = (theta / (Math.PI * 4)) * b.radius * 0.88;
                        const px = b.x + r * Math.cos(startAngle + theta * 0.7);
                        const py = b.y + r * Math.sin(startAngle + theta * 0.7);
                        if (theta === 0) c.moveTo(px, py);
                        else c.lineTo(px, py);
                    }
                    c.stroke();
                }
                
                // Core pulse core dot
                c.fillStyle = '#ffffff';
                c.beginPath();
                c.arc(b.x, b.y, 2, 0, Math.PI * 2);
                c.fill();
                
                c.restore();
            }
        },
        {
            name: "SUPERNOVA // 超新星爆破",
            price: 300,
            bonus: 0.10,
            desc: "恒星重力坍缩，黑洞引力吸积漩涡，尺寸增加 10%",
            color: "#ffb700",
            trailColor: "rgba(255, 183, 0, ",
            draw(b, c = ctx) {
                c.save();
                c.shadowBlur = 22;
                c.shadowColor = this.color;
                
                // Corona arcs rotation
                const rot = (Date.now() / 300) % (Math.PI * 2);
                c.strokeStyle = this.color;
                c.lineWidth = 2.2;
                c.beginPath();
                c.arc(b.x, b.y, b.radius + 2.5, rot, rot + Math.PI * 0.75);
                c.stroke();
                c.beginPath();
                c.arc(b.x, b.y, b.radius + 2.5, rot + Math.PI, rot + Math.PI * 1.75);
                c.stroke();
                
                // Solar core gradient
                const grad = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, '#ffea00');
                grad.addColorStop(1, '#ff5500');
                c.fillStyle = grad;
                c.beginPath();
                c.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                c.fill();
                
                // Gravitational black swirl (triple spirals)
                c.strokeStyle = 'rgba(12, 6, 0, 0.9)';
                c.lineWidth = 1.5;
                const swirlRot = -(Date.now() / 90) % (Math.PI * 2);
                for (let arm = 0; arm < 3; arm++) {
                    const startAngle = swirlRot + arm * (Math.PI * 2 / 3);
                    c.beginPath();
                    for (let theta = 0; theta < Math.PI * 3.2; theta += 0.2) {
                        const r = (theta / (Math.PI * 3.2)) * b.radius * 0.82;
                        const px = b.x + r * Math.cos(startAngle + theta * 0.85);
                        const py = b.y + r * Math.sin(startAngle + theta * 0.85);
                        if (theta === 0) c.moveTo(px, py);
                        else c.lineTo(px, py);
                    }
                    c.stroke();
                }
                
                c.restore();
            }
        }
    ],
    brick: [
        {
            name: "STANDARD_GRID // 标准矩阵",
            price: 0,
            bonus: 0.0,
            desc: "基础数字防御网，横向科技切槽与中心校准条",
            draw(br, c = ctx) {
                c.save();
                c.shadowBlur = 8;
                c.shadowColor = br.color;
                const alpha = br.hp / br.maxHp;
                c.fillStyle = `rgba(${br.hexToRgb(br.color)}, ${alpha * 0.65})`;
                c.strokeStyle = br.color;
                c.lineWidth = 1.5;
                c.fillRect(br.x, br.y, br.width, br.height);
                c.strokeRect(br.x, br.y, br.width, br.height);
                
                // Horizontal panel grooves
                c.strokeStyle = 'rgba(255, 255, 255, 0.18)';
                c.lineWidth = 0.8;
                c.beginPath();
                c.moveTo(br.x + 4, br.y + 4);
                c.lineTo(br.x + br.width - 4, br.y + 4);
                c.moveTo(br.x + 4, br.y + br.height - 4);
                c.lineTo(br.x + br.width - 4, br.y + br.height - 4);
                c.stroke();
                
                // Center block calibration mark
                c.fillStyle = 'rgba(255, 255, 255, 0.28)';
                c.fillRect(br.x + br.width/2 - 5, br.y + br.height/2 - 2, 10, 4);
                
                c.restore();
            }
        },
        {
            name: "CIRCUIT_MATRIX // 电路母版",
            price: 100,
            bonus: 0.05,
            desc: "密集印制集成电路，道具掉落率提升 5%",
            draw(br, c = ctx) {
                c.save();
                c.shadowBlur = 10;
                c.shadowColor = br.color;
                const alpha = br.hp / br.maxHp;
                c.fillStyle = `rgba(${br.hexToRgb(br.color)}, ${alpha * 0.48})`;
                c.strokeStyle = br.color;
                c.lineWidth = 1.5;
                c.fillRect(br.x, br.y, br.width, br.height);
                c.strokeRect(br.x, br.y, br.width, br.height);
                
                // Integrated circuitry traces
                c.strokeStyle = 'rgba(255, 255, 255, 0.42)';
                c.lineWidth = 0.8;
                c.beginPath();
                // Trace 1
                c.moveTo(br.x + 6, br.y + 4);
                c.lineTo(br.x + 18, br.y + 4);
                c.lineTo(br.x + 24, br.y + 10);
                c.lineTo(br.x + br.width - 16, br.y + 10);
                c.lineTo(br.x + br.width - 11, br.y + 5);
                // Trace 2
                c.moveTo(br.x + 6, br.y + br.height - 4);
                c.lineTo(br.x + br.width - 25, br.y + br.height - 4);
                c.lineTo(br.x + br.width - 19, br.y + br.height/2 + 2);
                c.lineTo(br.x + br.width - 8, br.y + br.height/2 + 2);
                c.stroke();
                
                // Transistor node dots
                c.fillStyle = '#ffffff';
                c.beginPath();
                c.arc(br.x + 6, br.y + 4, 1.8, 0, Math.PI * 2);
                c.arc(br.x + br.width - 11, br.y + 5, 1.8, 0, Math.PI * 2);
                c.arc(br.x + br.width - 8, br.y + br.height/2 + 2, 1.8, 0, Math.PI * 2);
                c.arc(br.x + 6, br.y + br.height - 4, 1.8, 0, Math.PI * 2);
                c.fill();
                
                c.restore();
            }
        },
        {
            name: "GLITCH_CYPHER // 故障暗号",
            price: 200,
            bonus: 0.10,
            desc: "防辐射冷却栅格及溢出代码，道具掉落率提升 10%",
            draw(br, c = ctx) {
                c.save();
                c.shadowBlur = 12;
                c.shadowColor = br.color;
                const alpha = br.hp / br.maxHp;
                c.fillStyle = `rgba(${br.hexToRgb(br.color)}, ${alpha * 0.42})`;
                c.strokeStyle = br.color;
                c.lineWidth = 2;
                c.fillRect(br.x, br.y, br.width, br.height);
                c.strokeRect(br.x, br.y, br.width, br.height);
                
                // Dash tech inner frame
                c.strokeStyle = 'rgba(255, 255, 255, 0.22)';
                c.lineWidth = 1;
                c.setLineDash([4, 3]);
                c.strokeRect(br.x + 4, br.y + 3, br.width - 8, br.height - 6);
                c.setLineDash([]);
                
                // Diagonal cooling slots
                c.strokeStyle = `rgba(${br.hexToRgb(br.color)}, 0.35)`;
                c.lineWidth = 1.2;
                c.beginPath();
                for (let ox = 8; ox < br.width - 15; ox += 8) {
                    c.moveTo(br.x + ox, br.y + 5);
                    c.lineTo(br.x + ox + 6, br.y + br.height - 5);
                }
                c.stroke();
                
                // Cypher text
                c.fillStyle = 'rgba(255, 255, 255, 0.45)';
                c.font = '8px "Share Tech Mono"';
                const sec = Math.floor(Date.now() / 350) % 3;
                const msg = sec === 0 ? "A9" : (sec === 1 ? "FX" : "5C");
                c.fillText(msg, br.x + br.width - 17, br.y + br.height/2 + 3);
                
                // Cyber noise glitch generator
                if (Math.random() < 0.22) {
                    c.fillStyle = '#ffffff';
                    c.fillRect(br.x + Math.random() * (br.width - 12), br.y + Math.random() * (br.height - 2), 12, 1.5);
                }
                c.restore();
            }
        },
        {
            name: "AETHER_CORE // 以太核心",
            price: 300,
            bonus: 0.15,
            desc: "结晶结界与以太符文核心，道具掉落率提升 15%",
            draw(br, c = ctx) {
                c.save();
                c.shadowBlur = 15;
                c.shadowColor = br.color;
                
                c.fillStyle = '#060714';
                c.fillRect(br.x, br.y, br.width, br.height);
                
                c.strokeStyle = br.color;
                c.lineWidth = 2.5;
                c.strokeRect(br.x, br.y, br.width, br.height);
                
                // Crystal hexagon textures
                c.strokeStyle = `rgba(${br.hexToRgb(br.color)}, 0.25)`;
                c.lineWidth = 0.8;
                c.beginPath();
                for (let ox = br.x + 8; ox < br.x + br.width - 8; ox += 10) {
                    c.moveTo(ox, br.y + 4);
                    c.lineTo(ox + 3, br.y + 2);
                    c.lineTo(ox + 7, br.y + 2);
                    c.lineTo(ox + 10, br.y + 4);
                    c.lineTo(ox + 7, br.y + 6);
                    c.lineTo(ox + 3, br.y + 6);
                    c.closePath();
                    
                    c.moveTo(ox, br.y + br.height - 4);
                    c.lineTo(ox + 3, br.y + br.height - 6);
                    c.lineTo(ox + 7, br.y + br.height - 6);
                    c.lineTo(ox + 10, br.y + br.height - 4);
                    c.lineTo(ox + 7, br.y + br.height - 2);
                    c.lineTo(ox + 3, br.y + br.height - 2);
                    c.closePath();
                }
                c.stroke();
                
                // Glowing crystal nucleus
                const grad = c.createRadialGradient(br.x + br.width/2, br.y + br.height/2, 1, br.x + br.width/2, br.y + br.height/2, 11);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, br.color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                c.fillStyle = grad;
                c.beginPath();
                c.arc(br.x + br.width/2, br.y + br.height/2, 9, 0, Math.PI * 2);
                c.fill();
                
                // Core orbital ring detail
                c.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                c.lineWidth = 1;
                c.beginPath();
                c.arc(br.x + br.width/2, br.y + br.height/2, 11, 0, Math.PI * 2);
                c.stroke();
                
                // Corner tech brackets
                c.strokeStyle = '#ffffff';
                c.lineWidth = 1;
                c.beginPath();
                c.moveTo(br.x + 5, br.y + 1); c.lineTo(br.x + 1, br.y + 1); c.lineTo(br.x + 1, br.y + 5);
                c.moveTo(br.x + br.width - 5, br.y + 1); c.lineTo(br.x + br.width - 1, br.y + 1); c.lineTo(br.x + br.width - 1, br.y + 5);
                c.moveTo(br.x + 5, br.y + br.height - 1); c.lineTo(br.x + 1, br.y + br.height - 1); c.lineTo(br.x + 1, br.y + br.height - 5);
                c.moveTo(br.x + br.width - 5, br.y + br.height - 1); c.lineTo(br.x + br.width - 1, br.y + br.height - 1); c.lineTo(br.x + br.width - 1, br.y + br.height - 5);
                c.stroke();
                
                c.restore();
            }
        }
    ],
    theme: [
        {
            name: "STANDARD_GRID // 标准矩阵",
            price: 0,
            bonus: 0,
            desc: "标准视窗，经典赛博平铺网格底板",
            draw(c) {
                c.save();
                c.strokeStyle = 'rgba(26, 28, 53, 0.4)';
                c.lineWidth = 1;
                
                // Draw vertical lines
                const cols = 20;
                for (let i = 0; i <= cols; i++) {
                    const xPos = (i / cols) * CANVAS_WIDTH;
                    c.beginPath();
                    c.moveTo(xPos, 0);
                    c.lineTo(xPos, CANVAS_HEIGHT);
                    c.stroke();
                }
                
                // Draw horizontal lines
                const rows = 15;
                for (let i = 0; i <= rows; i++) {
                    const yPos = (i / rows) * CANVAS_HEIGHT;
                    c.beginPath();
                    c.moveTo(0, yPos);
                    c.lineTo(CANVAS_WIDTH, yPos);
                    c.stroke();
                }
                c.restore();
            }
        },
        {
            name: "SYNTH_WAVE // 霓虹正弦波",
            price: 300,
            bonus: 0.15,
            desc: "复古80s霓虹红日与透视地平线。加成：击碎方块后倍率每次额外增加 0.15，且挡板连击衰减减缓 30%",
            draw(c) {
                c.save();
                
                // Dark retro background gradient
                const bgGrad = c.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
                bgGrad.addColorStop(0, '#04020a');
                bgGrad.addColorStop(0.5, '#0e051d');
                bgGrad.addColorStop(1, '#020005');
                c.fillStyle = bgGrad;
                c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

                // Stars in upper sky
                c.save();
                for (let i = 0; i < 25; i++) {
                    const x = (Math.sin(i * 456.789) * 0.5 + 0.5) * CANVAS_WIDTH;
                    const y = (Math.cos(i * 987.654) * 0.5 + 0.5) * 300;
                    const twinkle = Math.sin(Date.now() / 500 + i) * 0.4 + 0.6;
                    c.fillStyle = `rgba(255, 0, 170, ${twinkle * 0.5})`;
                    c.beginPath();
                    c.arc(x, y, i % 3 === 0 ? 1.5 : 1, 0, Math.PI * 2);
                    c.fill();
                }
                c.restore();

                // Draw retro neon sun
                const sunX = CANVAS_WIDTH / 2;
                const sunY = 170;
                const sunPulse = 1 + Math.sin(Date.now() / 1200) * 0.03;
                const sunRadius = 75 * sunPulse;
                
                c.save();
                c.shadowBlur = 30;
                c.shadowColor = '#ff00aa';
                const grad = c.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
                grad.addColorStop(0, '#ff0066');
                grad.addColorStop(0.5, '#ff00aa');
                grad.addColorStop(1, '#ffdd00');
                c.fillStyle = grad;
                c.beginPath();
                c.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
                c.fill();
                c.restore();
                
                // Sun horizontal line cuts
                c.fillStyle = '#0e051d';
                for (let y = sunY - 40; y < sunY + sunRadius + 10; y += 12) {
                    const barHeight = (y - (sunY - 40)) / 9 + 1;
                    c.fillRect(sunX - sunRadius - 10, y, (sunRadius + 10) * 2, barHeight);
                }
                
                const gridY = 320;
                const vanishingX = CANVAS_WIDTH / 2;

                // Cyberpunk Mountain Silhouettes
                c.save();
                // Far mountain range
                c.fillStyle = '#05020c';
                c.strokeStyle = 'rgba(255, 0, 170, 0.3)';
                c.lineWidth = 1.5;
                c.beginPath();
                c.moveTo(0, gridY);
                c.lineTo(120, gridY - 70);
                c.lineTo(240, gridY - 30);
                c.lineTo(380, gridY - 90);
                c.lineTo(520, gridY - 40);
                c.lineTo(680, gridY - 110);
                c.lineTo(800, gridY);
                c.fill();
                c.stroke();
                
                // Near mountain range
                c.fillStyle = '#0a0316';
                c.strokeStyle = 'rgba(0, 255, 255, 0.45)';
                c.lineWidth = 1.5;
                c.shadowBlur = 10;
                c.shadowColor = '#00ffff';
                c.beginPath();
                c.moveTo(0, gridY);
                c.lineTo(80, gridY - 40);
                c.lineTo(200, gridY - 15);
                c.lineTo(320, gridY - 50);
                c.lineTo(480, gridY - 20);
                c.lineTo(600, gridY - 60);
                c.lineTo(720, gridY - 30);
                c.lineTo(800, gridY);
                c.fill();
                c.stroke();
                c.restore();

                // Horizon glow
                const horizGlow = c.createLinearGradient(0, gridY - 15, 0, gridY + 15);
                horizGlow.addColorStop(0, 'rgba(0, 255, 255, 0)');
                horizGlow.addColorStop(0.5, 'rgba(0, 255, 255, 0.4)');
                horizGlow.addColorStop(1, 'rgba(0, 255, 255, 0)');
                c.fillStyle = horizGlow;
                c.fillRect(0, gridY - 15, CANVAS_WIDTH, 30);

                // Perspective vertical grid lines (glowing)
                c.save();
                c.strokeStyle = 'rgba(0, 255, 255, 0.25)';
                c.lineWidth = 1.5;
                const numLines = 18;
                for (let i = 0; i <= numLines; i++) {
                    const targetX = (i / numLines) * CANVAS_WIDTH;
                    c.beginPath();
                    c.moveTo(vanishingX, gridY);
                    c.lineTo(targetX, CANVAS_HEIGHT);
                    c.stroke();
                }
                c.restore();
                
                // Perspective horizontal lines (moving)
                c.save();
                c.strokeStyle = 'rgba(255, 0, 170, 0.45)';
                c.shadowBlur = 8;
                c.shadowColor = '#ff00aa';
                c.lineWidth = 1.5;
                const time = (Date.now() / 25) % 100;
                for (let i = 0; i < 9; i++) {
                    const ratio = ((i * 30 + time) / 300);
                    const y = gridY + (CANVAS_HEIGHT - gridY) * Math.pow(ratio, 2.3);
                    if (y > gridY && y < CANVAS_HEIGHT) {
                        c.beginPath();
                        c.moveTo(0, y);
                        c.lineTo(CANVAS_WIDTH, y);
                        c.stroke();
                    }
                }
                c.restore();
                
                c.restore();
            }
        },
        {
            name: "MATRIX_RAIN // 数码瀑布雨",
            price: 500,
            bonus: 0.25,
            desc: "黑客帝国数码雨流注。加成：过关积分结算奖励提升 25%，且吃掉道具时额外奖 10 CR",
            draw(c) {
                c.save();
                
                // Background dark shade
                c.fillStyle = 'rgba(1, 3, 2, 0.5)';
                c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                
                const time = Date.now();
                
                // Draw 3 layers of digital rain for 3D depth
                const layers = [
                    { size: 7, cols: 50, speedMult: 0.08, opacity: 0.15, length: 10, color: 'rgba(0, 120, 20, ' },
                    { size: 10, cols: 40, speedMult: 0.15, opacity: 0.35, length: 15, color: 'rgba(0, 200, 40, ' },
                    { size: 15, cols: 25, speedMult: 0.25, opacity: 0.7, length: 18, color: 'rgba(10, 255, 80, ' }
                ];
                
                layers.forEach((layer) => {
                    c.font = `bold ${layer.size}px "Share Tech Mono", monospace`;
                    const charWidth = CANVAS_WIDTH / layer.cols;
                    
                    for (let i = 0; i < layer.cols; i++) {
                        // Unique pseudo-random variables based on column index
                        const colSeed = Math.sin(i * 45.67) * 987.65;
                        const speed = layer.speedMult * (1.0 + Math.abs(colSeed % 0.5));
                        const yOffset = (time * speed) % (CANVAS_HEIGHT + 300) - 150;
                        
                        // Lead glow
                        if (layer.size === 15) {
                            c.shadowBlur = 10;
                            c.shadowColor = '#0f8';
                        } else {
                            c.shadowBlur = 0;
                        }
                        
                        for (let charIdx = 0; charIdx < layer.length; charIdx++) {
                            const charY = yOffset - charIdx * (layer.size + 3);
                            if (charY > -20 && charY < CANVAS_HEIGHT + 20) {
                                const alpha = ((layer.length - charIdx) / layer.length) * layer.opacity;
                                c.fillStyle = `${layer.color}${alpha})`;
                                
                                // Randomly select binary digit or Matrix-like characters
                                const randChar = (Math.abs(Math.sin(i * 12 + charIdx * 34 + Math.floor(time / 100))) < 0.5) ? '0' : '1';
                                c.fillText(randChar, i * charWidth + (charWidth - layer.size) / 2, charY);
                                
                                // The leading head character is white/bright cyan
                                if (charIdx === 0) {
                                    c.fillStyle = 'rgba(230, 255, 240, 0.9)';
                                    c.fillText(randChar, i * charWidth + (charWidth - layer.size) / 2, charY);
                                }
                            }
                        }
                    }
                });
                
                c.restore();
            }
        },
        {
            name: "NEBULA_VOID // 虚空深空星云",
            price: 800,
            bonus: 0,
            desc: "炫彩太空星云迷雾与微光闪烁星空。加成：系统生命上限提高至 4，过关自动复原 1 点生命，初始满血",
            draw(c) {
                c.save();
                
                // Base deep void space color
                c.fillStyle = '#020108';
                c.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                
                const t = Date.now() / 1000;
                
                // Draw starfield (dense twinkling stars)
                c.save();
                for (let i = 0; i < 45; i++) {
                    const sx = Math.abs(Math.sin(i * 382.91) * CANVAS_WIDTH);
                    const sy = Math.abs(Math.cos(i * 821.56) * CANVAS_HEIGHT);
                    const size = (i % 5 === 0) ? 2 : 1;
                    const twinkle = Math.sin(t * 1.5 + i) * 0.4 + 0.6;
                    
                    // Star color variation
                    let starColor = `rgba(255, 255, 255, ${twinkle * 0.65})`;
                    if (i % 7 === 0) starColor = `rgba(130, 200, 255, ${twinkle * 0.8})`; // blue star
                    else if (i % 11 === 0) starColor = `rgba(255, 180, 180, ${twinkle * 0.7})`; // red star
                    
                    c.fillStyle = starColor;
                    c.fillRect(sx, sy, size, size);
                }
                c.restore();

                // Warp stars erupting from the black hole center outwards (3D travel effect)
                c.save();
                const bhX_pos = CANVAS_WIDTH / 2;
                const bhY_pos = 240;
                for (let i = 0; i < 20; i++) {
                    const angle = (i * 123.45) % (Math.PI * 2);
                    const speed = 0.4 + (i * 0.17) % 1.2;
                    const travelTime = (t * 60 * speed) % 500;
                    
                    const r = 12 + travelTime;
                    const sx = bhX_pos + Math.cos(angle) * r;
                    const sy = bhY_pos + Math.sin(angle) * r;
                    
                    const tailLength = Math.min(25, r * 0.18);
                    const tx = bhX_pos + Math.cos(angle) * (r - tailLength);
                    const ty = bhY_pos + Math.sin(angle) * (r - tailLength);
                    
                    const starAlpha = Math.min(1.0, (500 - travelTime) / 200) * 0.7;
                    const starGrad = c.createLinearGradient(tx, ty, sx, sy);
                    starGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
                    starGrad.addColorStop(0.5, `rgba(180, 0, 255, ${starAlpha * 0.5})`);
                    starGrad.addColorStop(1, `rgba(255, 255, 255, ${starAlpha})`);
                    
                    c.strokeStyle = starGrad;
                    c.lineWidth = 1.2;
                    c.beginPath();
                    c.moveTo(tx, ty);
                    c.lineTo(sx, sy);
                    c.stroke();
                }
                c.restore();

                // Multi-layered rotating nebula gas clouds with screen blending
                c.save();
                c.globalCompositeOperation = 'screen';
                
                // Magenta cloud
                const mX = CANVAS_WIDTH / 2 + Math.cos(t * 0.08) * 80;
                const mY = 220 + Math.sin(t * 0.1) * 60;
                const mGrad = c.createRadialGradient(mX, mY, 10, mX, mY, 260);
                mGrad.addColorStop(0, 'rgba(255, 0, 180, 0.16)');
                mGrad.addColorStop(0.4, 'rgba(200, 0, 255, 0.06)');
                mGrad.addColorStop(0.8, 'rgba(100, 0, 180, 0.01)');
                mGrad.addColorStop(1, 'rgba(0,0,0,0)');
                c.fillStyle = mGrad;
                c.beginPath();
                c.arc(mX, mY, 260, 0, Math.PI * 2);
                c.fill();
                
                // Cyan/Blue cloud
                const cX = CANVAS_WIDTH / 2 + Math.sin(t * 0.07) * 100;
                const cY = 280 + Math.cos(t * 0.09) * 50;
                const cGrad = c.createRadialGradient(cX, cY, 15, cX, cY, 230);
                cGrad.addColorStop(0, 'rgba(0, 190, 255, 0.14)');
                cGrad.addColorStop(0.5, 'rgba(0, 100, 255, 0.05)');
                cGrad.addColorStop(0.8, 'rgba(0, 50, 150, 0.01)');
                cGrad.addColorStop(1, 'rgba(0,0,0,0)');
                c.fillStyle = cGrad;
                c.beginPath();
                c.arc(cX, cY, 230, 0, Math.PI * 2);
                c.fill();
                
                // Golden/Violet center core cloud
                const vX = CANVAS_WIDTH / 2 + Math.cos(t * 0.13) * 40;
                const vY = 240 + Math.sin(t * 0.11) * 30;
                const vGrad = c.createRadialGradient(vX, vY, 5, vX, vY, 150);
                vGrad.addColorStop(0, 'rgba(255, 120, 0, 0.12)');
                vGrad.addColorStop(0.4, 'rgba(120, 0, 255, 0.05)');
                vGrad.addColorStop(1, 'rgba(0,0,0,0)');
                c.fillStyle = vGrad;
                c.beginPath();
                c.arc(vX, vY, 150, 0, Math.PI * 2);
                c.fill();
                
                c.restore();

                // Draw central black hole anomaly
                c.save();
                const bhX = CANVAS_WIDTH / 2;
                const bhY = 240;
                
                // Accretion disk glow
                const diskRadius = 45 + Math.sin(t * 2) * 2;
                c.shadowBlur = 25;
                c.shadowColor = '#a0f';
                const diskGrad = c.createRadialGradient(bhX, bhY, 12, bhX, bhY, diskRadius);
                diskGrad.addColorStop(0, 'rgba(0,0,0,1)');
                diskGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
                diskGrad.addColorStop(0.4, 'rgba(180, 0, 255, 0.4)');
                diskGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.15)');
                diskGrad.addColorStop(1, 'rgba(0,0,0,0)');
                
                c.fillStyle = diskGrad;
                c.beginPath();
                c.arc(bhX, bhY, diskRadius, 0, Math.PI * 2);
                c.fill();
                
                // Rotating accretion/gravitational lensing rings (overlapping multidirectional)
                c.save();
                c.shadowBlur = 15;
                
                // Ring 1 (cyan, glowing, rotating)
                c.strokeStyle = 'rgba(0, 240, 255, 0.45)';
                c.shadowColor = '#00ffff';
                c.lineWidth = 1.5;
                c.beginPath();
                c.ellipse(bhX, bhY, 32 + Math.sin(t * 1.5) * 2, 8 + Math.cos(t * 1.5) * 1, t * 0.8, 0, Math.PI * 2);
                c.stroke();
                
                // Ring 2 (counter-rotating, magenta)
                c.strokeStyle = 'rgba(255, 0, 180, 0.4)';
                c.shadowColor = '#ff00b7';
                c.beginPath();
                c.ellipse(bhX, bhY, 48 + Math.cos(t * 2.2) * 3, 12 + Math.sin(t * 2.2) * 2, -t * 0.5, 0, Math.PI * 2);
                c.stroke();
                
                // Ring 3 (outer faint tilt white ring)
                c.strokeStyle = 'rgba(255, 255, 255, 0.18)';
                c.shadowBlur = 0;
                c.beginPath();
                c.ellipse(bhX, bhY, 68, 16, t * 0.3, 0, Math.PI * 2);
                c.stroke();
                c.restore();
                
                // Rotating core singularity lines
                c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                c.lineWidth = 1.5;
                c.beginPath();
                c.ellipse(bhX, bhY, 24, 6, t * 1.2, 0, Math.PI * 2);
                c.stroke();
                
                // Dark singularity center
                c.fillStyle = '#000000';
                c.shadowBlur = 0;
                c.beginPath();
                c.arc(bhX, bhY, 12, 0, Math.PI * 2);
                c.fill();
                
                c.restore();

                // Shooting star animation
                c.save();
                const shootInterval = 3000; // ms
                const shootSeed = Math.floor(t * 1000 / shootInterval);
                const shootProgress = ((t * 1000) % shootInterval) / shootInterval;
                if (shootProgress < 0.25) {
                    const startX = (Math.sin(shootSeed * 99) * 0.5 + 0.5) * CANVAS_WIDTH;
                    const startY = (Math.cos(shootSeed * 55) * 0.3 + 0.3) * 200;
                    const length = 120;
                    const dx = 160;
                    const dy = 50;
                    
                    const progress = shootProgress / 0.25; // 0 to 1
                    const curX = startX + dx * progress;
                    const curY = startY + dy * progress;
                    
                    const tailGrad = c.createLinearGradient(curX - dx * 0.4, curY - dy * 0.4, curX, curY);
                    tailGrad.addColorStop(0, 'rgba(255,255,255,0)');
                    tailGrad.addColorStop(1, 'rgba(0, 240, 255, 0.7)');
                    
                    c.strokeStyle = tailGrad;
                    c.lineWidth = 1.5;
                    c.beginPath();
                    c.moveTo(curX - dx * 0.4, curY - dy * 0.4);
                    c.lineTo(curX, curY);
                    c.stroke();
                }
                c.restore();
                
                c.restore();
            }
        }
    ]
};

// Active Skin Spec Retrievers
function getPaddleSkinBonus() {
    if (!state.skins || !state.skins.paddle) return 0;
    const active = state.skins.paddle.active;
    const config = SKINS_CONFIG.paddle[active];
    return config ? config.bonus : 0;
}

function getBallSkinBonus() {
    if (!state.skins || !state.skins.ball) return 0;
    const active = state.skins.ball.active;
    const config = SKINS_CONFIG.ball[active];
    return config ? config.bonus : 0;
}

function getBrickSkinBonus() {
    if (!state.skins || !state.skins.brick) return 0;
    const active = state.skins.brick.active;
    const config = SKINS_CONFIG.brick[active];
    return config ? config.bonus : 0;
}

function applyBallSkin() {
    const radius = 7 * (1 + getBallSkinBonus());
    const active = state.skins.ball.active;
    const skin = SKINS_CONFIG.ball[active];
    const color = skin ? skin.color : '#00f0ff';
    
    balls.forEach(b => {
        b.radius = radius;
        b.color = color;
    });
}

// Canvas and Context
let canvas, ctx;

// Input tracking
const keys = {};
let mouseX = CANVAS_WIDTH / 2;

// Entities
let paddle;
let ghostPaddle = { x: CANVAS_WIDTH / 2, width: 120 };
let aiPaddle = { x: CANVAS_WIDTH / 2, width: 120, height: 14, speed: 6.5 };
let balls = [];
let bricks = [];
let powerups = [];
let particles = [];
let shockwaves = [];
let lasers = [];

// Audio context & music nodes
let audioCtx = null;
let musicTimeout = null;
let musicStep = 0;
let masterGain = null;
let analyser = null;

// Bricks settings
const BRICK_COLS = 10;
const BRICK_ROWS = 7;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 8;
const BRICK_OFFSET_TOP = 40;
const BRICK_OFFSET_LEFT = 15;

// Power-up Types
const POWERUP_TYPES = {
    LASER: { label: 'LASER_MOD', color: '#ff0055', desc: '激光发射器 (空格发射)' },
    MULTIBALL: { label: 'SPLIT_CORE', color: '#ffb700', desc: '分裂多球' },
    WIDE: { label: 'WIDE_LINK', color: '#0044ff', desc: '加宽挡板' },
    SHIELD: { label: 'NET_SHIELD', color: '#05ff50', desc: '底部防护盾' },
    SLOW: { label: 'TIME_DILATION', color: '#aa00ff', desc: '球速减慢' },
    GLITCH_FIELD: { label: 'GLITCH_FIELD', color: '#00ffff', desc: '干扰场 (随机损伤砖块)' },
    GRAVITY_WELL: { label: 'GRAVITY_WELL', color: '#b700ff', desc: '重力井 (弱引力辅助)' },
    MIRROR_WALL: { label: 'MIRROR_WALL', color: '#00e5ff', desc: '镜像壁 (保护底部死角)' }
};

// Active power-up durations
let activeMods = {};

// Level Layout Definitions
// 1: Cyan, 2: Magenta, 3: Yellow (armored), 4: Red (explosive)
const LEVEL_LAYOUTS = [
    // Level 1: Cyber Grid
    [
        [1,1,1,1,1,1,1,1,1,1],
        [1,2,2,1,1,1,1,2,2,1],
        [1,2,2,2,2,2,2,2,2,1],
        [1,1,1,2,2,2,2,1,1,1],
        [1,1,1,1,1,1,1,1,1,1]
    ],
    // Level 2: Processor Chip
    [
        [3,3,3,3,3,3,3,3,3,3],
        [3,1,1,1,1,1,1,1,1,3],
        [3,1,2,2,2,2,2,2,1,3],
        [3,1,2,4,1,1,4,2,1,3],
        [3,1,2,2,2,2,2,2,1,3],
        [3,3,3,3,3,3,3,3,3,3]
    ],
    // Level 3: Firewall (Heavy Security)
    [
        [3,1,3,1,3,3,1,3,1,3],
        [2,2,2,2,2,2,2,2,2,2],
        [1,1,1,1,1,1,1,1,1,1],
        [3,3,3,3,3,3,3,3,3,3],
        [2,2,2,4,2,2,4,2,2,2],
        [1,1,1,1,1,1,1,1,1,1]
    ],
    // Level 4: The Core Mainframe
    [
        [2,4,2,2,4,4,2,2,4,2],
        [3,3,1,1,1,1,1,1,3,3],
        [3,2,2,1,1,1,1,2,2,3],
        [3,2,2,2,2,2,2,2,2,3],
        [3,3,1,3,3,3,3,1,3,3],
        [1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,4,4,1,1,1,1]
    ]
];

// --- SOUND EFFECTS (WEB AUDIO API) ---

function initAudio() {
    if (audioCtx) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(state.audioEnabled ? 0.35 : 0, audioCtx.currentTime);
        
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        
        masterGain.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        // Start background music loop
        startBgMusic();
        addLogLine("Audio engine initialized successfully.");
    } catch (e) {
        console.error("Failed to initialize Web Audio API", e);
    }
}

// Procedural background retro-synthwave bass & drum loop with tempo modulation
const RADIO_TRACKS = [
    {
        name: 'NEON_PULSE',
        bpm: 115,
        bass: [82.41, 82.41, 82.41, 98.00, 110.00, 110.00, 98.00, 73.42, 82.41, 82.41, 82.41, 123.47, 110.00, 98.00, 73.42, 65.41],
        melody: [329.63, 0, 392.00, 523.25, 493.88, 0, 392.00, 329.63, 440.00, 0, 440.00, 587.33, 523.25, 493.88, 392.00, 293.66, 329.63, 329.63, 0, 392.00, 493.88, 523.25, 0, 587.33, 440.00, 0, 392.00, 329.63, 293.66, 0, 329.63, 0]
    },
    {
        name: 'GATEWAY_BYPASS',
        bpm: 135,
        bass: [110.00, 110.00, 98.00, 98.00, 87.31, 87.31, 82.41, 82.41, 110.00, 110.00, 123.47, 123.47, 130.81, 130.81, 146.83, 82.41],
        melody: [440.00, 523.25, 659.25, 587.33, 523.25, 493.88, 440.00, 329.63, 440.00, 523.25, 659.25, 587.33, 523.25, 587.33, 659.25, 0, 392.00, 493.88, 587.33, 523.25, 493.88, 392.00, 329.63, 293.66, 440.00, 440.00, 0, 523.25, 493.88, 0, 440.00, 0]
    },
    {
        name: 'DEPOLARIZED',
        bpm: 95,
        bass: [65.41, 65.41, 65.41, 65.41, 87.31, 87.31, 98.00, 98.00, 65.41, 65.41, 65.41, 65.41, 87.31, 98.00, 130.81, 65.41],
        melody: [392.00, 392.00, 440.00, 493.88, 392.00, 329.63, 349.23, 392.00, 392.00, 0, 440.00, 493.88, 523.25, 493.88, 440.00, 392.00, 440.00, 440.00, 0, 392.00, 329.63, 0, 349.23, 0, 293.66, 0, 329.63, 392.00, 261.63, 0, 293.66, 0]
    }
];

function startBgMusic() {
    if (musicTimeout) clearTimeout(musicTimeout);
    
    const track = RADIO_TRACKS[state.currentRadioTrack || 0];
    const bassline = track.bass;
    const leadMelody = track.melody;
    
    function playStep() {
        if (!audioCtx) return;
        
        let currentBpm = track.bpm;
        let pitchMultiplier = 1.0;
        
        if (state.mode === 'PLAYING') {
            if (state.lives === 1) {
                currentBpm = track.bpm + 30; // Panic speed!
                pitchMultiplier = 1.25; // Shift pitch higher
            } else if (state.multiplier >= 4.0) {
                currentBpm = track.bpm + 17; // High adrenaline score speed
                pitchMultiplier = 1.15;
            }
        }
        
        const stepDuration = (60 / currentBpm) / 2; // eighth notes (in seconds)
        
        if (state.mode !== 'MENU' && state.audioEnabled) {
            const now = audioCtx.currentTime;
            const baseFreq = bassline[musicStep % bassline.length];
            const freq = baseFreq * pitchMultiplier;
            
            // 1. Bass Synth
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            const cutOff = (state.lives === 1 || state.multiplier >= 4) ? 450 : 300;
            filter.frequency.setValueAtTime(cutOff, now);
            filter.Q.setValueAtTime(4, now);
            
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.95);
            
            osc.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(masterGain);
            
            osc.start(now);
            osc.stop(now + stepDuration);
            
            // 1a. Synthesize Lead Pluck Melody with Echo Delay
            const leadFreq = leadMelody[musicStep % leadMelody.length];
            if (leadFreq > 0) {
                // Main Pluck
                const lOsc = audioCtx.createOscillator();
                const lGain = audioCtx.createGain();
                lOsc.type = 'triangle';
                lOsc.frequency.setValueAtTime(leadFreq * pitchMultiplier, now);
                lGain.gain.setValueAtTime(0.04, now);
                lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                lOsc.connect(lGain);
                lGain.connect(masterGain);
                lOsc.start(now);
                lOsc.stop(now + 0.16);
                
                // Echo Pluck (scheduled stepDuration / 2 later)
                const delayTime = now + stepDuration / 2;
                const eOsc = audioCtx.createOscillator();
                const eGain = audioCtx.createGain();
                eOsc.type = 'triangle';
                eOsc.frequency.setValueAtTime(leadFreq * pitchMultiplier, delayTime);
                eGain.gain.setValueAtTime(0.015, delayTime);
                eGain.gain.exponentialRampToValueAtTime(0.001, delayTime + 0.12);
                eOsc.connect(eGain);
                eGain.connect(masterGain);
                eOsc.start(delayTime);
                eOsc.stop(delayTime + 0.13);
            }
            
            // 2. Synthesize Drum beat (4/4 Kick and Snare)
            const beatStep = musicStep % 8;
            if (beatStep === 0 || beatStep === 4) {
                triggerKickSynth(now);
            } else if (beatStep === 2 || beatStep === 6) {
                triggerSnareSynth(now);
            }
            
            // 3. Hi-hat on offbeats or alternate beats
            if (musicStep % 2 === 0) {
                playSynthHat(now);
            }
            
            musicStep++;
        }
        
        musicTimeout = setTimeout(playStep, stepDuration * 1000);
    }
    
    playStep();
}

function triggerKickSynth(time) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(masterGain);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
    
    gainNode.gain.setValueAtTime(0.35, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    
    osc.start(time);
    osc.stop(time + 0.12);
}

function triggerSnareSynth(time) {
    if (!audioCtx) return;
    
    // Snare noise generator
    const bufferSize = audioCtx.sampleRate * 0.10;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, time);
    filter.Q.setValueAtTime(2, time);
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.20, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.10);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);
    
    noise.start(time);
    noise.stop(time + 0.10);
}

function playSynthHat(time) {
    if (!audioCtx) return;
    
    // White noise source
    const bufferSize = audioCtx.sampleRate * 0.04;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.015, time);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterGain);
    
    noise.start(time);
    noise.stop(time + 0.05);
}

// Sound effects
function playSound(type) {
    if (!audioCtx || !state.audioEnabled) return;
    
    const now = audioCtx.currentTime;
    
    switch(type) {
        case 'bounce':
            // High frequency retro chirp
            const oscB = audioCtx.createOscillator();
            const gainB = audioCtx.createGain();
            oscB.type = 'sine';
            oscB.frequency.setValueAtTime(450, now);
            oscB.frequency.exponentialRampToValueAtTime(150, now + 0.08);
            gainB.gain.setValueAtTime(0.12, now);
            gainB.gain.linearRampToValueAtTime(0.01, now + 0.08);
            oscB.connect(gainB);
            gainB.connect(masterGain);
            oscB.start(now);
            oscB.stop(now + 0.09);
            break;
            
        case 'hit_cyan':
            // High sharp tick
            playHitTone(600, 0.08, 'triangle');
            break;
            
        case 'hit_magenta':
            // Slightly deeper resonant metallic hit
            playHitTone(350, 0.12, 'sawtooth');
            break;
            
        case 'hit_yellow':
            // Metallic shield deflection
            playHitTone(900, 0.15, 'square', 0.2);
            break;
            
        case 'hit_red':
            // 1. Deep sub-bass rumble
            const oscE = audioCtx.createOscillator();
            const gainE = audioCtx.createGain();
            oscE.type = 'sawtooth';
            oscE.frequency.setValueAtTime(100, now);
            oscE.frequency.linearRampToValueAtTime(10, now + 0.4);
            gainE.gain.setValueAtTime(0.3, now);
            gainE.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            
            const lp = audioCtx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.setValueAtTime(120, now);
            
            oscE.connect(lp);
            lp.connect(gainE);
            gainE.connect(masterGain);
            oscE.start(now);
            oscE.stop(now + 0.45);

            // 2. High-energy white noise blast
            const bufSize = audioCtx.sampleRate * 0.35;
            const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
            const bufData = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                bufData[i] = Math.random() * 2 - 1;
            }
            const noiseSource = audioCtx.createBufferSource();
            noiseSource.buffer = buf;
            
            const bpFilter = audioCtx.createBiquadFilter();
            bpFilter.type = 'lowpass';
            bpFilter.frequency.setValueAtTime(300, now);
            bpFilter.frequency.exponentialRampToValueAtTime(50, now + 0.3);
            
            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.25, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
            
            noiseSource.connect(bpFilter);
            bpFilter.connect(noiseGain);
            noiseGain.connect(masterGain);
            
            noiseSource.start(now);
            noiseSource.stop(now + 0.35);
            break;
            
        case 'laser':
            const oscL = audioCtx.createOscillator();
            const gainL = audioCtx.createGain();
            oscL.type = 'sawtooth';
            oscL.frequency.setValueAtTime(880, now);
            oscL.frequency.exponentialRampToValueAtTime(220, now + 0.15);
            gainL.gain.setValueAtTime(0.15, now);
            gainL.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
            oscL.connect(gainL);
            gainL.connect(masterGain);
            oscL.start(now);
            oscL.stop(now + 0.18);
            break;
            
        case 'powerup':
            // Ascending major synth chord
            const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
            notes.forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                gain.gain.setValueAtTime(0.08, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.2);
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.25);
            });
            break;
            
        case 'lost':
            // Depressing downward sweep
            const oscLost = audioCtx.createOscillator();
            const gainLost = audioCtx.createGain();
            oscLost.type = 'sawtooth';
            oscLost.frequency.setValueAtTime(300, now);
            oscLost.frequency.linearRampToValueAtTime(70, now + 0.6);
            gainLost.gain.setValueAtTime(0.2, now);
            gainLost.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            oscLost.connect(gainLost);
            gainLost.connect(masterGain);
            oscLost.start(now);
            oscLost.stop(now + 0.62);
            break;

        case 'victory':
            // Triumphant ascending arpeggio (C major triad up)
            const vNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; // C5, E5, G5, C6, E6, G6, C7
            vNotes.forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'triangle';
                o.frequency.setValueAtTime(f, now + i * 0.06);
                g.gain.setValueAtTime(0.08, now + i * 0.06);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
                o.connect(g);
                g.connect(masterGain);
                o.start(now + i * 0.06);
                o.stop(now + i * 0.06 + 0.18);
            });
            break;

        case 'gameover':
            // Glitchy downward descending sweep chord
            const gNotes = [987.77, 783.99, 659.25, 493.88, 392.00, 329.63, 246.94]; // B5, G5, E5, B4, G4, E4, B3
            gNotes.forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(f, now + i * 0.1);
                o.frequency.linearRampToValueAtTime(f * 0.7, now + i * 0.1 + 0.2); // downward bend
                g.gain.setValueAtTime(0.1, now + i * 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
                o.connect(g);
                g.connect(masterGain);
                o.start(now + i * 0.1);
                o.stop(now + i * 0.1 + 0.26);
            });
            break;
    }
}

function playHitTone(baseFreq, duration, waveType = 'sine', filterVal = null) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = waveType;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq / 2, now + duration);
    
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    if (filterVal) {
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterVal * 3000, now);
        osc.connect(filter);
        filter.connect(gainNode);
    } else {
        osc.connect(gainNode);
    }
    
    gainNode.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
}

// --- UTILS & CORE SYSTEMS ---

// UI Logger console helper
function addLogLine(text) {
    const logOutput = document.getElementById('log-output');
    if (!logOutput) return;
    
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const newLine = document.createElement('div');
    newLine.className = 'log-line';
    newLine.innerHTML = `<span class="neon-cyan">[${time}]</span> ${text}`;
    logOutput.appendChild(newLine);
    
    // Auto-scroll and prune logs
    logOutput.scrollTop = logOutput.scrollHeight;
    while (logOutput.childNodes.length > 9) {
        logOutput.removeChild(logOutput.firstChild);
    }
}

function triggerScreenShake(amount) {
    state.screenShake = amount;
}

// Update DOM elements for stats
function updateHUD() {
    state.multiplier = Math.min(9.9, state.multiplier);
    document.getElementById('score-val').innerText = String(Math.floor(state.score)).padStart(6, '0');
    document.getElementById('mult-val').innerText = `x${state.multiplier.toFixed(1)}`;
    document.getElementById('level-val').innerText = String(state.level).padStart(2, '0');
    
    // Toggle VS Bot HUD rows
    const vsBotRows = document.querySelectorAll('.vs-bot-only');
    if (state.gameMode === 'SCORE_BATTLE' || state.gameMode === 'PONG_BATTLE') {
        vsBotRows.forEach(el => el.classList.remove('hidden'));
        const botScoreNode = document.getElementById('bot-score-val');
        if (botScoreNode) botScoreNode.innerText = String(Math.floor(state.botScore)).padStart(6, '0');
    } else {
        vsBotRows.forEach(el => el.classList.add('hidden'));
    }
    
    if (state.multiplier >= 5.0) {
        unlockAchievement('NEURAL_OVERDRIVE');
    }
    
    // Toggle Save & Exit panel visibility based on active gameplay state
    const saveExitBox = document.getElementById('save-exit-box');
    if (saveExitBox) {
        if (state.mode === 'PLAYING') {
            saveExitBox.classList.remove('hidden');
        } else {
            saveExitBox.classList.add('hidden');
        }
    }
    
    // Lives display nodes
    const livesContainer = document.getElementById('lives-container');
    livesContainer.innerHTML = '';
    const maxLives = (state.skins && state.skins.theme && state.skins.theme.active === 3) ? 4 : 3;
    for (let i = 0; i < maxLives; i++) {
        const node = document.createElement('div');
        node.className = `life-node ${i >= state.lives ? 'lost' : ''}`;
        livesContainer.appendChild(node);
    }
    
    // Diagnostic elements
    const activeBall = balls[0];
    const speedText = activeBall ? Math.hypot(activeBall.vx, activeBall.vy).toFixed(1) : '0';
    document.getElementById('diag-speed').innerText = activeBall ? `${speedText} px/f` : 'N/A';
    document.getElementById('diag-shield').innerText = activeMods['SHIELD'] ? 'NET_SHIELD' : (activeMods['MIRROR_WALL'] > 0 ? 'MIRROR_WALL' : 'INACTIVE');
    document.getElementById('diag-laser').innerText = activeMods['LASER'] ? `${Math.ceil(activeMods['LASER'] / 10)}%` : '0%';
    
    // Update core temp slightly dynamically based on score & active entities (boost when boss is active)
    const particlesLoad = particles.length;
    let calcTemp = 37 + (state.multiplier * 3) + (particlesLoad * 0.1) + (state.bossActive ? 25 : 0);
    calcTemp = Math.max(10, calcTemp - (state.coolerPurchases || 0) * 15);
    state.diagnostics.coreTemp = calcTemp;
    
    const tempNode = document.getElementById('diag-temp');
    tempNode.innerText = `${calcTemp.toFixed(1)}°C`;
    if (calcTemp > 50) {
        tempNode.className = 'neon-magenta';
    } else if (calcTemp > 42) {
        tempNode.className = 'neon-yellow';
    } else {
        tempNode.className = 'neon-green';
    }
}

// --- ENTITY FACTORIES & BUILDERS ---

function initEntities() {
    const pBonus = getPaddleSkinBonus();
    paddle = {
        x: CANVAS_WIDTH / 2 - 60 * (1 + pBonus),
        y: CANVAS_HEIGHT - 35,
        width: 120 * (1 + pBonus),
        height: 14,
        targetWidth: 120 * (1 + pBonus),
        speed: 10,
        color: '#0044ff',
        draw(c = ctx) {
            const active = state.skins ? state.skins.paddle.active : 0;
            const skin = SKINS_CONFIG.paddle[active] || SKINS_CONFIG.paddle[0];
            
            // Draw chromatic aberration copies if screen shake is active
            if (state.screenShake > 0 && c === ctx) {
                const offset = state.screenShake * 0.4;
                c.save();
                c.translate(-offset, 0);
                c.globalCompositeOperation = 'screen';
                skin.draw(this, c);
                c.restore();
                
                c.save();
                c.translate(offset, 0);
                c.globalCompositeOperation = 'screen';
                skin.draw(this, c);
                c.restore();
            }
            
            skin.draw(this, c);
            
            // Draw laser cannons if laser mod is active
            if (activeMods['LASER'] && c === ctx) {
                c.save();
                c.fillStyle = '#ff0055';
                c.shadowBlur = 15;
                c.shadowColor = '#ff0055';
                c.fillRect(this.x - 4, this.y - 6, 6, 12);
                c.fillRect(this.x + this.width - 2, this.y - 6, 6, 12);
                c.restore();
            }
        }
    };
    
    // Spawn initial ball
    resetBalls();
}

function resetBalls() {
    balls = [];
    powerups = [];
    lasers = [];
    
    spawnBall(CANVAS_WIDTH / 2, paddle.y - 12, true);
    
    if (state.shopPendingBalls > 0) {
        for (let i = 0; i < state.shopPendingBalls; i++) {
            spawnBall(CANVAS_WIDTH / 2, paddle.y - 12, false);
        }
        state.shopPendingBalls = 0;
    }
}

function spawnBall(x, y, attachToPaddle = false) {
    if (balls.length >= 10) return;
    const angle = (Math.random() * 60 - 30) * Math.PI / 180; // random tilt
    let speed = FIXED_BALL_SPEED;
    if (activeMods['SLOW'] > 0) {
        speed = FIXED_BALL_SPEED * 0.6;
    }
    balls.push({
        x: x,
        y: y,
        vx: speed * Math.sin(angle),
        vy: -speed * Math.cos(angle),
        radius: 7 * (1 + getBallSkinBonus()),
        color: (SKINS_CONFIG.ball[state.skins ? state.skins.ball.active : 0] || SKINS_CONFIG.ball[0]).color,
        attached: attachToPaddle,
        trail: [],
        update() {
            if (this.attached) {
                this.x = paddle.x + paddle.width / 2;
                this.y = paddle.y - this.radius - 2;
                return;
            }
            
            // Update trail
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 8) this.trail.shift();
            
            // Apply gravity well effect if active
            if (activeMods['GRAVITY_WELL'] > 0 && !this.attached) {
                if (this.y > CANVAS_HEIGHT * 0.70) {
                    const paddleCenterX = paddle.x + paddle.width / 2;
                    const dx = paddleCenterX - this.x;
                    const pullStrength = 0.08;
                    this.vx += Math.sign(dx) * pullStrength;
                    const maxVx = 8;
                    this.vx = Math.min(maxVx, Math.max(-maxVx, this.vx));
                }
            }
            
            // Perform movement
            this.x += this.vx;
            this.y += this.vy;
            
            // Collide walls
            if (this.x - this.radius < 0) {
                this.x = this.radius;
                this.vx = -this.vx;
                playSound('bounce');
                triggerScreenShake(2);
            }
            if (this.x + this.radius > CANVAS_WIDTH) {
                this.x = CANVAS_WIDTH - this.radius;
                this.vx = -this.vx;
                playSound('bounce');
                triggerScreenShake(2);
            }
            if (this.y - this.radius < 0) {
                this.y = this.radius;
                this.vy = -this.vy;
                playSound('bounce');
                triggerScreenShake(2);
            }
            
            // Collide mirror walls if active
            if (activeMods['MIRROR_WALL'] > 0) {
                if ((this.x < 120 || this.x > CANVAS_WIDTH - 120) && this.y + this.radius >= CANVAS_HEIGHT - 20) {
                    this.y = CANVAS_HEIGHT - 20 - this.radius;
                    this.vy = -Math.abs(this.vy);
                    playSound('bounce');
                    triggerScreenShake(4);
                }
            }
            
            // Normalize speed to fixed speed (or slow speed during Time Dilation)
            let targetSpeed = FIXED_BALL_SPEED;
            if (activeMods['SLOW'] > 0) {
                targetSpeed = FIXED_BALL_SPEED * 0.6;
            }
            const currentSpeed = Math.hypot(this.vx, this.vy);
            if (currentSpeed > 0) {
                this.vx = (this.vx / currentSpeed) * targetSpeed;
                this.vy = (this.vy / currentSpeed) * targetSpeed;
            }
        },
        draw(c = ctx) {
            const active = state.skins ? state.skins.ball.active : 0;
            const skin = SKINS_CONFIG.ball[active] || SKINS_CONFIG.ball[0];
            
            // Draw trail
            c.save();
            this.trail.forEach((pt, idx) => {
                const alpha = (idx + 1) / this.trail.length * 0.3;
                c.fillStyle = `${skin.trailColor}${alpha})`;
                c.beginPath();
                c.arc(pt.x, pt.y, this.radius * (idx / this.trail.length), 0, Math.PI * 2);
                c.fill();
            });
            c.restore();
            
            // Draw chromatic aberration copies if screen shake is active
            if (state.screenShake > 0 && c === ctx) {
                const offset = state.screenShake * 0.4;
                c.save();
                c.translate(-offset, 0);
                c.globalCompositeOperation = 'screen';
                skin.draw(this, c);
                c.restore();
                
                c.save();
                c.translate(offset, 0);
                c.globalCompositeOperation = 'screen';
                skin.draw(this, c);
                c.restore();
            }
            
            // Draw ball
            skin.draw(this, c);
        }
    });
}

function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        const speed = Math.random() * 6 + 1.5;
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            vx: speed * Math.cos(angle),
            vy: speed * Math.sin(angle),
            size: Math.random() * 2 + 1.5,
            color: color,
            alpha: 1,
            life: 1,
            maxLife: Math.random() * 25 + 15,
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.94; // friction
                this.vy *= 0.94;
                this.life++;
                this.alpha = 1 - (this.life / this.maxLife);
            },
            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.strokeStyle = this.color;
                ctx.shadowBlur = 8;
                ctx.shadowColor = this.color;
                ctx.lineWidth = this.size;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.vx * 1.5, this.y - this.vy * 1.5);
                ctx.stroke();
                ctx.restore();
            }
        });
    }
}

function spawnShockwave(x, y, color) {
    shockwaves.push({
        x: x,
        y: y,
        color: color,
        radius: 5,
        maxRadius: 80 + Math.random() * 40,
        lineWidth: 3,
        life: 0,
        maxLife: 25,
        update() {
            this.radius += (this.maxRadius - this.radius) * 0.12;
            this.lineWidth = 3 * (1 - this.life / this.maxLife);
            this.life++;
        },
        draw() {
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.lineWidth = this.lineWidth;
            ctx.globalAlpha = 1 - (this.life / this.maxLife);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    });
}

// Create random symmetric grid layout for Endless mode
function createRandomSymmetricLayout(rows, cols) {
    const layout = [];
    let brickCount = 0;
    
    for (let r = 0; r < rows; r++) {
        const row = new Array(cols).fill(0);
        layout.push(row);
    }
    
    // Higher levels increase armored/explosive brick chances
    const hpFactor = Math.min(0.4, (state.level - 1) * 0.05); // increases up to 40%
    const emptyChance = Math.max(0.15, 0.4 - (state.level * 0.02)); // denser grids at higher levels
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols / 2; c++) {
            if (Math.random() < emptyChance) {
                layout[r][c] = 0;
                layout[r][cols - 1 - c] = 0;
                continue;
            }
            
            const roll = Math.random();
            let type = 1;
            
            if (roll < 0.55 - hpFactor * 0.5) {
                type = 1; // Cyan
            } else if (roll < 0.82 - hpFactor * 0.2) {
                type = 2; // Magenta
            } else if (roll < 0.88 + hpFactor * 0.05) {
                type = 4; // Explosive Red
            } else {
                type = 3; // Armored Yellow
            }
            
            layout[r][c] = type;
            layout[r][cols - 1 - c] = type;
            brickCount++;
        }
    }
    
    // If completely empty, place at least a solid row
    if (brickCount === 0) {
        for (let c = 0; c < cols; c++) {
            layout[0][c] = 1;
        }
    }
    
    return layout;
}

// Factory to create Brick objects with all operations attached
function constructBrick(c, r, brickType, hp, maxHp, color, x = null, y = null, width = null, height = null) {
    const finalX = x !== null ? x : c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
    const finalY = y !== null ? y : r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
    const finalWidth = width !== null ? width : BRICK_WIDTH;
    const finalHeight = height !== null ? height : BRICK_HEIGHT;
    
    return {
        c: c,
        r: r,
        x: finalX,
        y: finalY,
        width: finalWidth,
        height: finalHeight,
        type: brickType,
        hp: hp,
        maxHp: maxHp,
        color: color,
        hit(damage = 1) {
            if (this.type === 5) {
                playSound('hit_yellow'); // Metal hit clang
                spawnParticles(this.x + this.width/2, this.y + this.height/2, '#00ffff', 4);
                return false; // Indestructible
            }
            this.hp -= damage;
            if (this.hp <= 0) {
                this.destroy();
                return true; // Destroyed
            } else {
                // Play normal deflection beep
                if (this.type === 2) playSound('hit_magenta');
                if (this.type === 3) playSound('hit_yellow');
                if (this.type === 6) {
                    playSound('hit_magenta');
                    this.color = '#ffaa44'; // turn lighter when damaged
                }
                
                // Spawn light particle dust
                spawnParticles(this.x + this.width/2, this.y + this.height/2, this.color, 4);
                return false;
            }
        },
        destroy() {
            // Update score & multipliers
            let baseVal = 1.0;
            if (this.type === 2) baseVal = 2.0;
            if (this.type === 3) baseVal = 4.0;
            if (this.type === 4) baseVal = 2.5;
            if (this.type === 6) baseVal = 5.0; // Higher reward for core
            
            increaseScore(baseVal * state.multiplier);
            const isSynthWave = (state.skins && state.skins.theme && state.skins.theme.active === 1);
            state.multiplier += isSynthWave ? 0.15 : 0.1;
            
            // Explosion particles matching color
            spawnParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 12);
            spawnShockwave(this.x + this.width / 2, this.y + this.height / 2, this.color);
            
            // Trigger sound
            if (this.type === 4) {
                playSound('hit_red');
                triggerScreenShake(8);
                detonateExplosive(this);
            } else if (this.type === 6) {
                playSound('hit_red');
                triggerScreenShake(12);
                detonateExplosiveVolatile(this);
            } else {
                const hitSnd = this.type === 2 ? 'hit_magenta' : (this.type === 3 ? 'hit_yellow' : 'hit_cyan');
                playSound(hitSnd);
                triggerScreenShake(3);
            }
            
            // Power-up chance (5% rate + brick skin bonus)
            if (Math.random() < 0.05 + getBrickSkinBonus()) {
                dropPowerup(this.x + this.width/2, this.y + this.height);
            }
        },
        draw(c = ctx) {
            if (this.type === 5) {
                c.save();
                c.shadowBlur = 12;
                c.shadowColor = '#00ffff';
                c.fillStyle = '#1e2430'; // dark metallic grey
                c.strokeStyle = '#00ffff'; // glowing cyan borders
                c.lineWidth = 2.0;
                c.fillRect(this.x, this.y, this.width, this.height);
                c.strokeRect(this.x, this.y, this.width, this.height);
                
                // Shield diagonal metallic lines
                c.strokeStyle = 'rgba(0, 255, 255, 0.25)';
                c.lineWidth = 1.5;
                c.beginPath();
                c.moveTo(this.x + 8, this.y + 2);
                c.lineTo(this.x + 2, this.y + 8);
                c.moveTo(this.x + this.width - 8, this.y + this.height - 2);
                c.lineTo(this.x + this.width - 2, this.y + this.height - 8);
                c.stroke();
                
                // Shield icon symbol inside
                c.fillStyle = '#00ffff';
                c.beginPath();
                const cx = this.x + this.width / 2;
                const cy = this.y + this.height / 2;
                c.moveTo(cx - 6, cy - 5);
                c.lineTo(cx + 6, cy - 5);
                c.lineTo(cx + 4, cy + 2);
                c.quadraticCurveTo(cx, cy + 6, cx, cy + 8);
                c.quadraticCurveTo(cx, cy + 6, cx - 4, cy + 2);
                c.closePath();
                c.fill();
                c.restore();
                return;
            }
            
            if (this.type === 6) {
                c.save();
                c.shadowBlur = 15;
                c.shadowColor = '#ff6a00';
                const alpha = this.hp / this.maxHp;
                c.fillStyle = `rgba(255, 106, 0, ${alpha * 0.4 + 0.3})`;
                c.strokeStyle = '#ff6a00';
                c.lineWidth = 2.0;
                c.fillRect(this.x, this.y, this.width, this.height);
                c.strokeRect(this.x, this.y, this.width, this.height);
                
                // Draw pulsing core ring inside
                const pulse = 1.0 + Math.sin(Date.now() / 80) * 0.15;
                c.strokeStyle = '#ffffff';
                c.shadowColor = '#ffffff';
                c.lineWidth = 1;
                c.beginPath();
                c.arc(this.x + this.width/2, this.y + this.height/2, 6 * pulse, 0, Math.PI * 2);
                c.stroke();
                
                // Hazard warning stripes
                c.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(this.x + 3, this.y + 3);
                c.lineTo(this.x + 10, this.y + 10);
                c.moveTo(this.x + this.width - 3, this.y + 3);
                c.lineTo(this.x + this.width - 10, this.y + this.height - 2);
                c.stroke();
                c.restore();
                return;
            }
            
            const active = (state.skins && state.skins.brick) ? state.skins.brick.active : 0;
            const skin = SKINS_CONFIG.brick[active] || SKINS_CONFIG.brick[0];
            skin.draw(this, c);
        },
        hexToRgb(hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        }
    };
}

// Generate level layout
function generateBricks() {
    bricks = [];
    state.paddleBouncesInLevel = 0;
    
    if (state.gameMode === 'PONG_BATTLE') {
        state.bossActive = false;
        state.boss = null;
        return;
    }
    
    if (state.level % 5 === 0) {
        state.bossActive = true;
        
        const bossType = Math.floor((state.level / 5 - 1) % 3);
        let bossName = 'ENTERPRISE_FIREWALL // 企业网关防火墙';
        let bossColor = '#ff0055';
        if (bossType === 1) {
            bossName = 'SECTOR_OVERLORD // 扇区领主核心';
            bossColor = '#00d2ff';
        } else if (bossType === 2) {
            bossName = 'AI_SINGULARITY // 奇点意识核心';
            bossColor = '#05ff50';
        }
        
        state.flashVignette = { color: bossColor, alpha: 0.75 };
        state.boss = {
            type: bossType,
            name: bossName,
            color: bossColor,
            x: CANVAS_WIDTH / 2 - 80,
            y: 80,
            width: 160,
            height: 60,
            vx: 1.2 + bossType * 0.3,
            hp: 30 + state.level * 6,
            maxHp: 30 + state.level * 6,
            shieldHp: 3 + bossType,
            maxShieldHp: 3 + bossType,
            fireTimer: 120,
            bullets: []
        };
        
        // Spawn defensive shield blocks and volatile core blocks in front of the boss
        for (let c = 1; c < 9; c++) {
            const brickType = (c % 2 === 0) ? 5 : 6;
            let maxHp = (brickType === 5) ? 99999 : 2;
            let color = (brickType === 5) ? (bossType === 1 ? '#00bcff' : (bossType === 2 ? '#00ff44' : '#78909c')) : '#ff6a00';
            
            const newBrick = {
                c: c,
                r: 3,
                x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
                y: 3 * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP + 80,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                type: brickType,
                hp: maxHp,
                maxHp: maxHp,
                color: color,
                hit(damage = 1) {
                    if (this.type === 5) {
                        playSound('hit_yellow');
                        spawnParticles(this.x + this.width/2, this.y + this.height/2, '#00ffff', 4);
                        return false;
                    }
                    this.hp -= damage;
                    if (this.hp <= 0) {
                        this.destroy();
                        return true;
                    } else {
                        playSound('hit_magenta');
                        spawnParticles(this.x + this.width/2, this.y + this.height/2, this.color, 4);
                        return false;
                    }
                },
                destroy() {
                    increaseScore(5.0 * state.multiplier);
                    state.multiplier += 0.15;
                    spawnParticles(this.x + this.width/2, this.y + this.height/2, this.color, 12);
                    spawnShockwave(this.x + this.width/2, this.y + this.height/2, this.color);
                    if (this.type === 6) {
                        playSound('hit_red');
                        triggerScreenShake(12);
                        detonateExplosiveVolatile(this);
                    } else {
                        playSound('hit_cyan');
                        triggerScreenShake(3);
                    }
                },
                draw(c = ctx) {
                    if (this.type === 5) {
                        c.save();
                        c.shadowBlur = 12;
                        c.shadowColor = '#00ffff';
                        c.fillStyle = '#1e2430';
                        c.strokeStyle = '#00ffff';
                        c.lineWidth = 2.0;
                        c.fillRect(this.x, this.y, this.width, this.height);
                        c.strokeRect(this.x, this.y, this.width, this.height);
                        
                        c.strokeStyle = 'rgba(0, 255, 255, 0.25)';
                        c.lineWidth = 1.5;
                        c.beginPath();
                        c.moveTo(this.x + 8, this.y + 2);
                        c.lineTo(this.x + 2, this.y + 8);
                        c.moveTo(this.x + this.width - 8, this.y + this.height - 2);
                        c.lineTo(this.x + this.width - 2, this.y + this.height - 8);
                        c.stroke();
                        c.restore();
                        return;
                    }
                    if (this.type === 6) {
                        c.save();
                        c.shadowBlur = 15;
                        c.shadowColor = '#ff6a00';
                        const alpha = this.hp / this.maxHp;
                        c.fillStyle = `rgba(255, 106, 0, ${alpha * 0.4 + 0.3})`;
                        c.strokeStyle = '#ff6a00';
                        c.lineWidth = 2.0;
                        c.fillRect(this.x, this.y, this.width, this.height);
                        c.strokeRect(this.x, this.y, this.width, this.height);
                        
                        const pulse = 1.0 + Math.sin(Date.now() / 80) * 0.15;
                        c.strokeStyle = '#ffffff';
                        c.lineWidth = 1;
                        c.beginPath();
                        c.arc(this.x + this.width/2, this.y + this.height/2, 6 * pulse, 0, Math.PI * 2);
                        c.stroke();
                        c.restore();
                        return;
                    }
                },
                hexToRgb(hex) {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `${r}, ${g}, ${b}`;
                }
            };
            if (brickType === 5) {
                newBrick.vx = (c % 2 === 0 ? 1 : -1) * 0.8;
            }
            bricks.push(newBrick);
        }
        return;
    }
    
    state.bossActive = false;
    state.boss = null;
    
    let layout;
    if (state.gameMode === 'ENDLESS') {
        const rows = Math.min(7, 4 + Math.floor((state.level - 1) / 3)); // 4 to 7 rows
        layout = createRandomSymmetricLayout(rows, BRICK_COLS);
    } else {
        // Story Mode layout
        const layoutIdx = (state.level - 1) % LEVEL_LAYOUTS.length;
        layout = LEVEL_LAYOUTS[layoutIdx];
    }
    
    for (let r = 0; r < layout.length; r++) {
        for (let c = 0; c < layout[r].length; c++) {
            const brickType = layout[r][c];
            if (brickType === 0) continue;
            
            let maxHp = 1;
            let color = '#00f0ff';
            if (brickType === 2) {
                maxHp = 2;
                color = '#ff0055';
            } else if (brickType === 3) {
                maxHp = 3;
                color = '#ffb700'; // Armored
            } else if (brickType === 4) {
                maxHp = 1;
                color = '#ff3333'; // Explosive
            } else if (brickType === 5) {
                maxHp = 99999; // Indestructible
                color = '#78909c'; // Steel metallic grey
            } else if (brickType === 6) {
                maxHp = 2;
                color = '#ff6a00'; // Volatile Core orange
            }
            
            const newBrick = {
                c: c,
                r: r,
                x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
                y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                type: brickType,
                hp: maxHp,
                maxHp: maxHp,
                color: color,
                hit(damage = 1) {
                    if (this.type === 5) {
                        playSound('hit_yellow'); // Metal hit clang
                        spawnParticles(this.x + this.width/2, this.y + this.height/2, '#00ffff', 4);
                        return false; // Indestructible
                    }
                    this.hp -= damage;
                    if (this.hp <= 0) {
                        this.destroy();
                        return true; // Destroyed
                    } else {
                        // Play normal deflection beep
                        if (this.type === 2) playSound('hit_magenta');
                        if (this.type === 3) playSound('hit_yellow');
                        if (this.type === 6) {
                            playSound('hit_magenta');
                            this.color = '#ffaa44'; // turn lighter when damaged
                        }
                        
                        // Spawn light particle dust
                        spawnParticles(this.x + this.width/2, this.y + this.height/2, this.color, 4);
                        return false;
                    }
                },
                destroy() {
                    // Update score & multipliers
                    let baseVal = 1.0;
                    if (this.type === 2) baseVal = 2.0;
                    if (this.type === 3) baseVal = 4.0;
                    if (this.type === 4) baseVal = 2.5;
                    if (this.type === 6) baseVal = 5.0; // Higher reward for core
                    
                    increaseScore(baseVal * state.multiplier);
                    const isSynthWave = (state.skins && state.skins.theme && state.skins.theme.active === 1);
                    state.multiplier += isSynthWave ? 0.15 : 0.1;
                    
                    // Explosion particles matching color
                    spawnParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 12);
                    spawnShockwave(this.x + this.width / 2, this.y + this.height / 2, this.color);
                    
                    // Trigger sound
                    if (this.type === 4) {
                        playSound('hit_red');
                        triggerScreenShake(8);
                        detonateExplosive(this);
                    } else if (this.type === 6) {
                        playSound('hit_red');
                        triggerScreenShake(12);
                        detonateExplosiveVolatile(this);
                    } else {
                        const hitSnd = this.type === 2 ? 'hit_magenta' : (this.type === 3 ? 'hit_yellow' : 'hit_cyan');
                        playSound(hitSnd);
                        triggerScreenShake(3);
                    }
                    
                    // Power-up chance (5% rate + brick skin bonus)
                    if (Math.random() < 0.05 + getBrickSkinBonus()) {
                        dropPowerup(this.x + this.width/2, this.y + this.height);
                    }
                },
                draw(c = ctx) {
                    if (this.type === 5) {
                        c.save();
                        c.shadowBlur = 12;
                        c.shadowColor = '#00ffff';
                        c.fillStyle = '#1e2430'; // dark metallic grey
                        c.strokeStyle = '#00ffff'; // glowing cyan borders
                        c.lineWidth = 2.0;
                        c.fillRect(this.x, this.y, this.width, this.height);
                        c.strokeRect(this.x, this.y, this.width, this.height);
                        
                        // Shield diagonal metallic lines
                        c.strokeStyle = 'rgba(0, 255, 255, 0.25)';
                        c.lineWidth = 1.5;
                        c.beginPath();
                        c.moveTo(this.x + 8, this.y + 2);
                        c.lineTo(this.x + 2, this.y + 8);
                        c.moveTo(this.x + this.width - 8, this.y + this.height - 2);
                        c.lineTo(this.x + this.width - 2, this.y + this.height - 8);
                        c.stroke();
                        
                        // Shield icon symbol inside
                        c.fillStyle = '#00ffff';
                        c.beginPath();
                        const cx = this.x + this.width / 2;
                        const cy = this.y + this.height / 2;
                        c.moveTo(cx - 6, cy - 5);
                        c.lineTo(cx + 6, cy - 5);
                        c.lineTo(cx + 4, cy + 2);
                        c.quadraticCurveTo(cx, cy + 6, cx, cy + 8);
                        c.quadraticCurveTo(cx, cy + 6, cx - 4, cy + 2);
                        c.closePath();
                        c.fill();
                        c.restore();
                        return;
                    }
                    
                    if (this.type === 6) {
                        c.save();
                        c.shadowBlur = 15;
                        c.shadowColor = '#ff6a00';
                        const alpha = this.hp / this.maxHp;
                        c.fillStyle = `rgba(255, 106, 0, ${alpha * 0.4 + 0.3})`;
                        c.strokeStyle = '#ff6a00';
                        c.lineWidth = 2.0;
                        c.fillRect(this.x, this.y, this.width, this.height);
                        c.strokeRect(this.x, this.y, this.width, this.height);
                        
                        // Draw pulsing core ring inside
                        const pulse = 1.0 + Math.sin(Date.now() / 80) * 0.15;
                        c.strokeStyle = '#ffffff';
                        c.shadowColor = '#ffffff';
                        c.lineWidth = 1;
                        c.beginPath();
                        c.arc(this.x + this.width/2, this.y + this.height/2, 6 * pulse, 0, Math.PI * 2);
                        c.stroke();
                        
                        // Hazard warning stripes
                        c.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                        c.lineWidth = 2;
                        c.beginPath();
                        c.moveTo(this.x + 3, this.y + 3);
                        c.lineTo(this.x + 10, this.y + 10);
                        c.moveTo(this.x + this.width - 3, this.y + 3);
                        c.lineTo(this.x + this.width - 10, this.y + 10);
                        c.stroke();
                        c.restore();
                        return;
                    }
                    
                    const active = state.skins ? state.skins.brick.active : 0;
                    const skin = SKINS_CONFIG.brick[active] || SKINS_CONFIG.brick[0];
                    skin.draw(this, c);
                },
                hexToRgb(hex) {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `${r}, ${g}, ${b}`;
                }
            };
            
            if (brickType === 5) {
                newBrick.vx = (c % 2 === 0 ? 1 : -1) * 0.8;
            }
            
            bricks.push(newBrick);
        }
    }
}

// Chain explosion logic for Red Bricks
function detonateExplosive(sourceBrick) {
    const radius = 100; // Pixels
    const centerX = sourceBrick.x + sourceBrick.width/2;
    const centerY = sourceBrick.y + sourceBrick.height/2;
    
    // We filter bricks within radius, handling destruction safely
    bricks.forEach(b => {
        if (b === sourceBrick || b.hp <= 0) return;
        const bCenterX = b.x + b.width/2;
        const bCenterY = b.y + b.height/2;
        const dist = Math.hypot(centerX - bCenterX, centerY - bCenterY);
        
        if (dist <= radius) {
            // Apply damage or instant kill. Let's apply high damage (2 hp)
            setTimeout(() => {
                b.hit(2);
            }, 80 + dist * 0.5); // Stagger explosions slightly for a cool domino effect
        }
    });
}

function detonateExplosiveVolatile(sourceBrick) {
    const radius = 150; // Pixels
    const centerX = sourceBrick.x + sourceBrick.width/2;
    const centerY = sourceBrick.y + sourceBrick.height/2;
    
    // Create extra glowing particles ring
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
        const speed = 5 + Math.random() * 3;
        particles.push({
            x: centerX,
            y: centerY,
            vx: speed * Math.cos(angle),
            vy: speed * Math.sin(angle),
            size: Math.random() * 2 + 2,
            color: '#ff6a00',
            life: 0,
            maxLife: 40 + Math.random() * 20,
            draw() {
                ctx.save();
                ctx.globalAlpha = 1 - (this.life / this.maxLife);
                ctx.shadowBlur = 12;
                ctx.shadowColor = this.color;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.size;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.vx * 1.8, this.y - this.vy * 1.8);
                ctx.stroke();
                ctx.restore();
            },
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.94; // friction
                this.vy *= 0.94;
                this.life++;
            }
        });
    }
    
    // Damage surrounding bricks
    bricks.forEach(b => {
        if (b === sourceBrick || b.hp <= 0 || b.type === 5) return; // ignore indestructible
        const bCenterX = b.x + b.width/2;
        const bCenterY = b.y + b.height/2;
        const dist = Math.hypot(centerX - bCenterX, centerY - bCenterY);
        
        if (dist <= radius) {
            setTimeout(() => {
                b.hit(3); // Inflicts 3 HP damage (usually kills cyan/magenta instantly)
            }, 60 + dist * 0.4);
        }
    });
}

function dropPowerup(x, y) {
    if (state.powerupsLastSecondTimestamp === undefined) {
        state.powerupsLastSecondTimestamp = Date.now();
        state.powerupsDroppedThisSecond = 0;
    }
    
    const now = Date.now();
    if (now - state.powerupsLastSecondTimestamp >= 1000) {
        state.powerupsDroppedThisSecond = 0;
        state.powerupsLastSecondTimestamp = now;
    }
    
    const MAX_POWERUPS_PER_SECOND = 2; // Limit: Max 2 power-up blocks per second
    if (state.powerupsDroppedThisSecond >= MAX_POWERUPS_PER_SECOND) {
        return; // Exceeded limit, skip drop
    }
    
    state.powerupsDroppedThisSecond++;
    
    const keysArr = Object.keys(POWERUP_TYPES);
    const chosenType = keysArr[Math.floor(Math.random() * keysArr.length)];
    const pConf = POWERUP_TYPES[chosenType];
    
    powerups.push({
        x: x - 25,
        y: y,
        type: chosenType,
        width: 50,
        height: 15,
        speed: 2.2,
        color: pConf.color,
        label: pConf.label,
        desc: pConf.desc,
        update() {
            this.y += this.speed;
        },
        draw() {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fillStyle = '#090a15';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            
            // Angled capsule shape
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y);
            ctx.lineTo(this.x + this.width - 5, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Label text inside
            ctx.fillStyle = this.color;
            ctx.font = '8px "Orbitron"';
            ctx.textAlign = 'center';
            ctx.fillText(this.label, this.x + this.width/2, this.y + this.height - 4);
            ctx.restore();
        }
    });
}

function applyPowerup(pType, pConf) {
    playSound('powerup');
    addLogLine(`MOD LOADED: ${pConf.label} - ${pConf.desc}`);
    
    // Matrix rain credit boost: +10 CR
    if (state.skins && state.skins.theme && state.skins.theme.active === 2) {
        increaseScore(10);
        addLogLine("THEME_BONUS: MATRIX_RAIN DATA HARVEST (+10 CR)");
        saveCredits();
        updateHUD();
    }
    
    switch(pType) {
        case 'WIDE':
            paddle.targetWidth = 180 * (1 + getPaddleSkinBonus());
            paddle.color = '#0044ff';
            activeMods['WIDE'] = 500; // Duration in frames
            break;
            
        case 'MULTIBALL':
            // Duplicate all active balls
            const currentCount = balls.length;
            for (let i = 0; i < currentCount; i++) {
                const b = balls[i];
                spawnBall(b.x, b.y);
                spawnBall(b.x, b.y);
            }
            break;
            
        case 'SHIELD':
            activeMods['SHIELD'] = 1; // Handled as boolean flag mostly
            state.diagnostics.shieldActive = true;
            break;
            
        case 'LASER':
            activeMods['LASER'] = 400; // Frames of laser capability
            break;
            
        case 'SLOW':
            // Cut speed of all balls down temporarily
            balls.forEach(b => {
                b.vx *= 0.6;
                b.vy *= 0.6;
            });
            activeMods['SLOW'] = 350;
            break;

        case 'GLITCH_FIELD':
            // Inflict random damage to active bricks
            let activeBricks = bricks.filter(b => b.hp > 0);
            let glitchCount = Math.min(activeBricks.length, Math.floor(Math.random() * 3) + 4); // 4-6
            for (let i = 0; i < glitchCount; i++) {
                let idx = Math.floor(Math.random() * activeBricks.length);
                let b = activeBricks.splice(idx, 1)[0];
                if (b) {
                    b.hit(Math.floor(Math.random() * 2) + 1); // 1-2 damage
                    spawnParticles(b.x + b.width/2, b.y + b.height/2, '#00ffff', 10);
                }
            }
            triggerScreenShake(15);
            playSound('hit_red'); // Play loud explosion
            triggerGlitchAlert("GLITCH FIELD DETECTED // 故障干扰已加载");
            break;
            
        case 'GRAVITY_WELL':
            activeMods['GRAVITY_WELL'] = 450; // frames
            break;
            
        case 'MIRROR_WALL':
            activeMods['MIRROR_WALL'] = 500; // frames
            break;
    }
    
    renderPowerupListHUD();
}

function triggerGlitchAlert(text) {
    const alertBox = document.getElementById('game-alert');
    if (!alertBox) return;
    alertBox.innerText = text;
    alertBox.classList.remove('hidden');
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 1500);
}

function fireLasers() {
    if (!activeMods['LASER']) return;
    playSound('laser');
    
    // Fire twin beams from edge of paddle
    lasers.push({
        x: paddle.x,
        y: paddle.y - 10,
        vx: 0,
        vy: -9,
        width: 3,
        height: 12,
        color: '#ff0055'
    });
    lasers.push({
        x: paddle.x + paddle.width,
        y: paddle.y - 10,
        vx: 0,
        vy: -9,
        width: 3,
        height: 12,
        color: '#ff0055'
    });
    
    // Reduce duration slightly for each shot to make it feel responsive
    activeMods['LASER'] = Math.max(0, activeMods['LASER'] - 20);
}

// Draw HTML sidebar power-up meters
function renderPowerupListHUD() {
    const list = document.getElementById('powerup-list');
    if (!list) return;
    list.innerHTML = '';
    
    const activeKeys = Object.keys(activeMods).filter(k => activeMods[k] > 0);
    
    if (activeKeys.length === 0) {
        list.innerHTML = '<div class="no-mods">NO ACTIVE MODS</div>';
        return;
    }
    
    activeKeys.forEach(k => {
        const item = document.createElement('div');
        item.className = 'powerup-item';
        
        const conf = POWERUP_TYPES[k];
        const val = activeMods[k];
        
        let pct = 100;
        if (k !== 'SHIELD') {
            let maxVal = 350;
            if (k === 'LASER') maxVal = 400;
            else if (k === 'WIDE') maxVal = 500;
            else if (k === 'GRAVITY_WELL') maxVal = 450;
            else if (k === 'MIRROR_WALL') maxVal = 500;
            pct = (val / maxVal) * 100;
        }
        
        item.innerHTML = `
            <div class="powerup-name-row" style="color: ${conf.color}">
                <span>${conf.label}</span>
                <span>${k === 'SHIELD' ? 'READY' : Math.round(pct) + '%'}</span>
            </div>
            <div class="powerup-bar-bg">
                <div class="powerup-bar-fill" style="width: ${pct}%; background-color: ${conf.color}"></div>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateSpecialBricks() {
    bricks.forEach(b => {
        if (b.type === 5 && b.hp > 0) {
            b.x += b.vx;
            // Bounce off boundaries of screen
            if (b.x <= 15) {
                b.x = 15;
                b.vx = -b.vx;
            } else if (b.x + b.width >= CANVAS_WIDTH - 15) {
                b.x = CANVAS_WIDTH - 15 - b.width;
                b.vx = -b.vx;
            }
        }
    });
}

function updateBoss() {
    if (!state.bossActive || !state.boss) return;
    const boss = state.boss;
    
    // Move boss horizontally
    boss.x += boss.vx;
    if (boss.x <= 20) {
        boss.x = 20;
        boss.vx = -boss.vx;
    } else if (boss.x + boss.width >= CANVAS_WIDTH - 20) {
        boss.x = CANVAS_WIDTH - 20 - boss.width;
        boss.vx = -boss.vx;
    }
    
    // Bullet shoot reload timer
    boss.fireTimer--;
    if (boss.fireTimer <= 0) {
        playSound('laser');
        
        // Spawn bullet based on Boss Type
        if (boss.type === 1) {
            // Type 1: Sector Overlord - targeted tracking bullet
            const dx = (paddle.x + paddle.width / 2) - (boss.x + boss.width / 2);
            const dy = paddle.y - (boss.y + boss.height);
            const dist = Math.hypot(dx, dy);
            const bulletSpeed = 4.2;
            const vx = dist > 0 ? (dx / dist) * bulletSpeed : 0;
            const vy = dist > 0 ? (dy / dist) * bulletSpeed : bulletSpeed;
            
            boss.bullets.push({
                type: 1,
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height,
                vx: vx,
                vy: vy,
                radius: 6,
                color: '#00d2ff'
            });
            boss.fireTimer = 110 + Math.random() * 60; // shoots slightly faster
        } else if (boss.type === 2) {
            // Type 2: AI Singularity - splitting bullet
            boss.bullets.push({
                type: 2,
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height,
                vx: 0,
                vy: 2.8,
                radius: 7,
                color: '#05ff50',
                splitTimer: 80 // splits after descending 80 ticks
            });
            boss.fireTimer = 150 + Math.random() * 80;
        } else {
            // Type 0: Enterprise Firewall - simple descending bullet
            boss.bullets.push({
                type: 0,
                x: boss.x + boss.width / 2,
                y: boss.y + boss.height,
                vx: 0,
                vy: 3.5,
                radius: 6,
                color: '#ff3333'
            });
            boss.fireTimer = 140 + Math.random() * 80;
        }
    }
    
    // Update bullets
    for (let i = boss.bullets.length - 1; i >= 0; i--) {
        const bullet = boss.bullets[i];
        
        // Handle horizontal movement for tracking projectiles
        if (bullet.vx !== undefined) {
            bullet.x += bullet.vx;
        }
        bullet.y += bullet.vy;
        
        // Handle Type 2 bullet splitting
        if (bullet.type === 2) {
            bullet.splitTimer--;
            if (bullet.splitTimer <= 0) {
                // Split bullet into 3 children
                boss.bullets.splice(i, 1);
                playSound('bounce');
                
                boss.bullets.push({
                    type: 3,
                    x: bullet.x,
                    y: bullet.y,
                    vx: -1.4,
                    vy: 3.0,
                    radius: 5,
                    color: '#05ff50'
                });
                boss.bullets.push({
                    type: 3,
                    x: bullet.x,
                    y: bullet.y,
                    vx: 0,
                    vy: 3.5,
                    radius: 5,
                    color: '#05ff50'
                });
                boss.bullets.push({
                    type: 3,
                    x: bullet.x,
                    y: bullet.y,
                    vx: 1.4,
                    vy: 3.0,
                    radius: 5,
                    color: '#05ff50'
                });
                continue;
            }
        }
        
        // Remove offscreen
        if (bullet.y > CANVAS_HEIGHT || bullet.x < 0 || bullet.x > CANVAS_WIDTH) {
            boss.bullets.splice(i, 1);
            continue;
        }
        
        // Check collision against paddle
        if (bullet.y + bullet.radius >= paddle.y &&
            bullet.y - bullet.radius <= paddle.y + paddle.height &&
            bullet.x + bullet.radius >= paddle.x &&
            bullet.x - bullet.radius <= paddle.x + paddle.width) {
            
            state.glitchedInLevel = true;
            
            // Custom hit effects based on bullet color/type
            if (bullet.color === '#00d2ff') {
                // Sector Overlord targeted bullet: drains credits & flash vignette
                state.score = Math.max(0, state.score - 80);
                state.flashVignette = { color: '#00d2ff', alpha: 0.8 };
                playSound('lost');
                triggerScreenShake(10);
                triggerGlitchAlert("CREDIT DRAINED // 核心积分遭网关窃取 -80 CR");
            } else if (bullet.color === '#05ff50') {
                // AI Singularity splitting bullet: multiplier decay & overheat vignette
                state.multiplier = Math.max(1.0, state.multiplier - 0.8);
                state.flashVignette = { color: '#05ff50', alpha: 0.8 };
                playSound('lost');
                triggerScreenShake(12);
                triggerGlitchAlert("SYS_OVERHEAT // 核心处理器温度过载");
            } else {
                // Enterprise Firewall normal bullet: glitch shrink paddle size
                activeMods['GLITCH_SHRINK'] = 180;
                paddle.targetWidth = 60;
                state.multiplier = Math.max(1.0, state.multiplier - 0.5);
                playSound('lost');
                triggerScreenShake(12);
                triggerGlitchAlert("SYSTEM CORRUPTED // 挡板线宽系统被篡改");
            }
            
            boss.bullets.splice(i, 1);
        }
    }
}

// --- CORE PHYSICS LOOP & COLLISIONS ---

function updatePhysics() {
    // Decay flash vignette
    if (state.flashVignette && state.flashVignette.alpha > 0) {
        state.flashVignette.alpha -= 0.025;
    }
    
    state.multiplier = Math.min(9.9, state.multiplier);
    
    // Update moving special bricks
    updateSpecialBricks();
    
    // Update active boss movements
    updateBoss();
    
    // 1. Move Paddle
    let targetX = paddle.x;
    if (state.inputMode === 'mouse') {
        targetX = mouseX - paddle.width / 2;
    } else {
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            targetX = paddle.x - paddle.speed;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            targetX = paddle.x + paddle.speed;
        }
    }
    
    // Clamp to border
    paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, targetX));
    
    // Ghost Paddle auto tracking ball with interpolation lag
    if (balls.length > 0) {
        const leadBall = balls[0];
        const targetGhostX = leadBall.x - ghostPaddle.width / 2;
        ghostPaddle.width = paddle.width;
        ghostPaddle.x += (targetGhostX - ghostPaddle.x) * 0.045;
        ghostPaddle.x = Math.max(0, Math.min(CANVAS_WIDTH - ghostPaddle.width, ghostPaddle.x));
    }
    
    // Smooth AI Paddle movement in Pong Battle
    if (state.gameMode === 'PONG_BATTLE') {
        if (balls.length > 0) {
            const leadBall = balls[0];
            const targetAiX = leadBall.x - aiPaddle.width / 2;
            const diffX = targetAiX - aiPaddle.x;
            const step = Math.min(aiPaddle.speed, Math.abs(diffX));
            aiPaddle.x += Math.sign(diffX) * step;
            aiPaddle.x = Math.max(0, Math.min(CANVAS_WIDTH - aiPaddle.width, aiPaddle.x));
            aiPaddle.width = paddle.width; // match width
        }
    }
    
    // AI Score and time updates in Score Battle
    if (state.gameMode === 'SCORE_BATTLE') {
        state.botTime += 1 / 60;
        state.playerTime += 1 / 60;
        if (Math.random() < 0.015) {
            state.botScore += Math.floor((state.level * 15) * (1 + Math.random() * 0.5));
        }
        if (Math.random() < 0.1) {
            state.botScore += 1;
        }
    }
    
    // Paddle size animation transition
    if (paddle.width !== paddle.targetWidth) {
        const diff = paddle.targetWidth - paddle.width;
        paddle.width += diff * 0.1;
        if (Math.abs(diff) < 1) paddle.width = paddle.targetWidth;
    }
    
    // 2. Manage Mod expirations
    let modsChanged = false;
    for (let m in activeMods) {
        if (m === 'SHIELD') continue; // Only disappears on bounce
        if (activeMods[m] > 0) {
            activeMods[m]--;
            if (activeMods[m] <= 0) {
                // Mod expired
                if (m === 'WIDE') {
                    paddle.targetWidth = 120 * (1 + getPaddleSkinBonus());
                    paddle.color = '#0044ff';
                } else if (m === 'GLITCH_SHRINK') {
                    paddle.targetWidth = (activeMods['WIDE'] ? 180 : 120) * (1 + getPaddleSkinBonus());
                }
                const label = POWERUP_TYPES[m] ? `MOD EXPIRED - ${POWERUP_TYPES[m].label}` : `STATUS RESTORED - ${m}`;
                addLogLine(`SYSTEM ALERT: ${label}`);
                modsChanged = true;
            }
        }
    }
    if (modsChanged) renderPowerupListHUD();

    // 3. Move & Update Balls
    for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        b.update();
        
        // Check bounce off AI paddle (Pong Battle only)
        if (state.gameMode === 'PONG_BATTLE' &&
            b.y - b.radius <= aiPaddle.y + aiPaddle.height &&
            b.y - b.radius >= aiPaddle.y - 5 &&
            b.x + b.radius >= aiPaddle.x &&
            b.x - b.radius <= aiPaddle.x + aiPaddle.width &&
            b.vy < 0) {
            
            b.y = aiPaddle.y + aiPaddle.height + b.radius;
            const hitPoint = b.x - (aiPaddle.x + aiPaddle.width/2);
            const normalizedHit = hitPoint / (aiPaddle.width / 2);
            const maxAngle = 65 * Math.PI / 180;
            const newAngle = normalizedHit * maxAngle;
            
            const speed = FIXED_BALL_SPEED;
            b.vx = speed * Math.sin(newAngle);
            b.vy = speed * Math.cos(newAngle);
            
            playSound('bounce');
            triggerScreenShake(3);
            spawnShockwave(b.x, aiPaddle.y + aiPaddle.height, '#ff0055');
        }
        
        // Check fall off top (Pong Battle only)
        if (state.gameMode === 'PONG_BATTLE' && b.y + b.radius < 0) {
            balls.splice(i, 1);
            increaseScore(1);
            state.botLives--;
            updateHUD();
            
            if (state.botLives <= 0) {
                triggerBattleComplete(true, "AI CORE LIFE DEPLETED // AI核心生命被彻底消耗");
                return;
            } else {
                playSound('powerup');
                triggerScreenShake(12);
                spawnBall(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, false);
            }
            continue;
        }
        
        // Check bounce off paddle
        if (b.y + b.radius >= paddle.y && 
            b.y - b.radius <= paddle.y + paddle.height &&
            b.x + b.radius >= paddle.x && 
            b.x - b.radius <= paddle.x + paddle.width) {
            
            // Check if falling down
            if (b.vy > 0) {
                // Resolution: place above paddle
                b.y = paddle.y - b.radius;
                
                // Tilt angle logic based on where ball hits paddle
                const hitPoint = b.x - (paddle.x + paddle.width/2);
                const normalizedHit = hitPoint / (paddle.width / 2); // -1 to 1
                const maxAngle = 65 * Math.PI / 180;
                const newAngle = normalizedHit * maxAngle;
                
                // Set bounce speed to fixed speed (or slow speed during Time Dilation)
                let speed = FIXED_BALL_SPEED;
                if (activeMods['SLOW'] > 0) {
                    speed = FIXED_BALL_SPEED * 0.6;
                }
                
                b.vx = speed * Math.sin(newAngle);
                b.vy = -speed * Math.cos(newAngle);
                
                playSound('bounce');
                triggerScreenShake(3);
                spawnShockwave(b.x, paddle.y, '#00ffff');
                
                // Break combo multiplier slightly or keep it rolling
                const isSynthWave = (state.skins && state.skins.theme && state.skins.theme.active === 1);
                const decay = isSynthWave ? 0.14 : 0.2;
                state.multiplier = Math.max(state.baseMultiplier || 1.0, state.multiplier - decay);
                
                // Increment paddle bounce tracking inside this level
                state.paddleBouncesInLevel = (state.paddleBouncesInLevel || 0) + 1;
                updateContractProgress('PADDLE_AIM', state.paddleBouncesInLevel);
            }
        }
        
        // Check fall off bottom
        if (b.y - b.radius > CANVAS_HEIGHT) {
            if (state.gameMode === 'PONG_BATTLE') {
                balls.splice(i, 1);
                state.botScore++;
                state.lives--;
                updateHUD();
                
                if (state.lives <= 0) {
                    triggerBattleComplete(false, "YOUR CORE LIFE DEPLETED // 您的核心生命耗尽");
                    return;
                } else {
                    playSound('lost');
                    triggerScreenShake(12);
                    spawnBall(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, false);
                }
                continue;
            }
            
            // Check if floor shield prevents fall
            if (activeMods['SHIELD']) {
                b.y = CANVAS_HEIGHT - 25;
                b.vy = -Math.abs(b.vy);
                delete activeMods['SHIELD'];
                state.diagnostics.shieldActive = false;
                playSound('bounce');
                triggerScreenShake(12);
                spawnShockwave(b.x, CANVAS_HEIGHT - 12, '#05ff50');
                addLogLine("SHIELD ABSORPTION TRIGGERED. MOD DEPLETED.");
                renderPowerupListHUD();
            } else {
                // Remove this ball
                balls.splice(i, 1);
                
                // If last ball lost, lose a life
                if (balls.length === 0) {
                    handleLifeLost();
                }
            }
        }
    }
    
    // 4a. Ball-Boss Collisions
    if (state.bossActive && state.boss) {
        const boss = state.boss;
        balls.forEach(b => {
            if (b.attached) return;
            
            // Check AABB vs Circle
            const closestX = Math.max(boss.x, Math.min(b.x, boss.x + boss.width));
            const closestY = Math.max(boss.y, Math.min(b.y, boss.y + boss.height));
            
            const distanceX = b.x - closestX;
            const distanceY = b.y - closestY;
            const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
            
            if (distanceSquared < (b.radius * b.radius)) {
                // Collision detected!
                const overlapX = b.radius - Math.abs(distanceX);
                const overlapY = b.radius - Math.abs(distanceY);
                
                if (closestX === boss.x || closestX === boss.x + boss.width) {
                    b.vx = -b.vx;
                    b.x += b.vx > 0 ? overlapX : -overlapX;
                } else {
                    b.vy = -b.vy;
                    b.y += b.vy > 0 ? overlapY : -overlapY;
                }
                
                // Damage boss
                if (boss.shieldHp > 0) {
                    boss.shieldHp--;
                    playSound('hit_yellow');
                    triggerScreenShake(6);
                    spawnParticles(closestX, closestY, '#00ffff', 8);
                    addLogLine("BOSS SHIELD DEFLECTED. SHIELDS: " + boss.shieldHp);
                } else {
                    boss.hp--;
                    playSound('hit_red');
                    triggerScreenShake(10);
                    spawnParticles(closestX, closestY, '#ff0055', 12);
                    addLogLine("BOSS FIREWALL DAMAGE. HP: " + boss.hp);
                    
                    if (boss.hp <= 0) {
                        triggerScreenShake(30);
                        playSound('lost');
                        spawnParticles(boss.x + boss.width/2, boss.y + boss.height/2, '#ff0055', 40);
                        spawnParticles(boss.x + boss.width/2, boss.y + boss.height/2, '#00ffff', 40);
                        state.bossActive = false;
                        state.boss = null;
                        unlockAchievement('GATEWAY_CRASHER');
                        handleLevelComplete();
                    }
                }
            }
        });
    }
    
    // 4. Ball-Brick Collisions
    balls.forEach(b => {
        if (b.attached) return;
        
        bricks.forEach(brick => {
            if (brick.hp <= 0) return;
            
            // Check AABB vs Circle
            const closestX = Math.max(brick.x, Math.min(b.x, brick.x + brick.width));
            const closestY = Math.max(brick.y, Math.min(b.y, brick.y + brick.height));
            
            const distanceX = b.x - closestX;
            const distanceY = b.y - closestY;
            const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
            
            if (distanceSquared < (b.radius * b.radius)) {
                // Collision detected!
                const destroyed = brick.hit();
                
                // Simple bounce reaction logic: determine which side was hit
                const overlapX = b.radius - Math.abs(distanceX);
                const overlapY = b.radius - Math.abs(distanceY);
                
                if (closestX === brick.x || closestX === brick.x + brick.width) {
                    // Left or right side hit
                    b.vx = -b.vx;
                    // Resolve overlap
                    b.x += b.vx > 0 ? overlapX : -overlapX;
                } else {
                    // Top or bottom side hit
                    b.vy = -b.vy;
                    // Resolve overlap
                    b.y += b.vy > 0 ? overlapY : -overlapY;
                }
            }
        });
    });
    
    // 5. Lasers movement & collision
    for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.y += l.vy;
        
        // Remove offscreen lasers
        if (l.y < 0) {
            lasers.splice(i, 1);
            continue;
        }
        
        // Check brick collision
        let laserHit = false;
        for (let j = 0; j < bricks.length; j++) {
            const b = bricks[j];
            if (b.hp <= 0) continue;
            
            if (l.x >= b.x && l.x <= b.x + b.width &&
                l.y >= b.y && l.y <= b.y + b.height) {
                
                b.hit(1); // Laser deal 1 damage
                laserHit = true;
                break;
            }
        }
        
        // Check boss collision
        if (state.bossActive && state.boss && !laserHit) {
            const boss = state.boss;
            if (l.x >= boss.x && l.x <= boss.x + boss.width &&
                l.y >= boss.y && l.y <= boss.y + boss.height) {
                
                laserHit = true;
                if (boss.shieldHp > 0) {
                    boss.shieldHp--;
                    playSound('hit_yellow');
                    spawnParticles(l.x, l.y, '#00ffff', 6);
                } else {
                    boss.hp--;
                    playSound('hit_red');
                    spawnParticles(l.x, l.y, '#ff0055', 8);
                    
                    if (boss.hp <= 0) {
                        triggerScreenShake(30);
                        playSound('lost');
                        spawnParticles(boss.x + boss.width/2, boss.y + boss.height/2, '#ff0055', 40);
                        spawnParticles(boss.x + boss.width/2, boss.y + boss.height/2, '#00ffff', 40);
                        state.bossActive = false;
                        state.boss = null;
                        unlockAchievement('GATEWAY_CRASHER');
                        handleLevelComplete();
                    }
                }
            }
        }
        
        if (laserHit) {
            lasers.splice(i, 1);
        }
    }
    
    // 6. Powerups movement & catch
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.update();
        
        // Caught by paddle?
        if (p.y + p.height >= paddle.y && 
            p.y <= paddle.y + paddle.height &&
            p.x + p.width >= paddle.x && 
            p.x <= paddle.x + paddle.width) {
            
            applyPowerup(p.type, POWERUP_TYPES[p.type]);
            powerups.splice(i, 1);
        }
        // Offscreen fall
        else if (p.y > CANVAS_HEIGHT) {
            powerups.splice(i, 1);
        }
    }
    
    // 7. Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life >= p.maxLife) {
            particles.splice(i, 1);
        }
    }
    
    // 7a. Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.update();
        if (sw.life >= sw.maxLife) {
            shockwaves.splice(i, 1);
        }
    }
    const remainingBricks = bricks.filter(b => b.hp > 0 && b.type !== 5);
    if (remainingBricks.length === 0) {
        handleLevelComplete();
    }
}

// --- STATE ACTIONS ---

function handleLifeLost() {
    state.lives--;
    state.consecutiveLevelsNoDeath = 0;
    playSound('lost');
    triggerScreenShake(15);
    state.flashVignette = { color: '#ff0055', alpha: 0.65 };
    addLogLine(`NEURAL PACKET DROP. LIVES REMAINING: ${state.lives}`);
    
    if (state.lives <= 0) {
        gameOver();
    } else {
        resetBalls();
    }
}

function gameOver() {
    playSound('gameover');
    state.mode = 'GAMEOVER';
    
    // Clear Endless save state since game is over
    if (state.gameMode === 'ENDLESS') {
        clearEndlessState();
    }
    
    // Save high score
    const finalScoreInt = Math.floor(state.score);
    if (finalScoreInt > state.highScore) {
        state.highScore = finalScoreInt;
        storage.set('cyberbreak_highscore', state.highScore);
    }
    
    // Save persistent credits
    saveCredits();
    
    // DOM overlay switch
    document.getElementById('final-score').innerText = finalScoreInt;
    document.getElementById('final-level').innerText = state.level;
    document.getElementById('game-over-overlay').classList.remove('hidden');
    addLogLine("CRITICAL_ERR: CONNECTION TERMINATED. LINK LOST.");
    
    setTimeout(() => {
        checkAndAddLeaderboard(finalScoreInt);
    }, 500);
}

function handleLevelComplete() {
    // Check level achievements
    if (state.glitchedInLevel) {
        unlockAchievement('GLITCH_SURVIVOR');
    }
    state.glitchedInLevel = false;
    
    state.consecutiveLevelsNoDeath++;
    if (state.consecutiveLevelsNoDeath >= 3) {
        unlockAchievement('IMMORTAL_RUNNER');
    }

    // Stage Clear Bonus
    let stageClearBonus = 50 * state.level * state.multiplier;
    const isMatrixRain = (state.skins && state.skins.theme && state.skins.theme.active === 2);
    if (isMatrixRain) {
        stageClearBonus *= 1.25;
    }
    state.score += stageClearBonus;
    addLogLine(`STAGE CLEAR BONUS: +${Math.round(stageClearBonus)} CR ${isMatrixRain ? '(MATRIX_RAIN +25%)' : ''}`);
    
    if (state.gameMode === 'SCORE_BATTLE') {
        const playerWon = (state.score > state.botScore) || 
                          (state.score === state.botScore && state.playerTime <= state.botTime);
        const reason = playerWon ? 
            "PLAYER SCORE EXCEEDED BOT // 玩家积分超越AI对手" : 
            "BOT SCORE EXCEEDED PLAYER // AI对手积分超越玩家";
        triggerBattleComplete(playerWon, reason);
        return;
    }
    
    // Check Daily Contracts
    if (state.diagnostics.coreTemp < 45) {
        updateContractProgress('CPU_COOL', 1);
    }
    if (stageClearBonus >= 150) {
        updateContractProgress('SCORE_RUN', 1);
    }

    state.level++;
    
    if (state.gameMode === 'ENDLESS') {
        const storedMax = parseInt(storage.get('cyberbreak_endless_maxlevel')) || 1;
        if (state.level > storedMax) {
            state.endlessMaxLevel = state.level;
            storage.set('cyberbreak_endless_maxlevel', state.level);
        }
    }
    
    // Check if player cleared all levels (Story mode only)
    if (state.gameMode === 'STORY') {
        const totalPredefined = LEVEL_LAYOUTS.length;
        if (state.level > totalPredefined) {
            gameVictory();
            return;
        }
    }
    
    playSound('powerup');
    state.flashVignette = { color: '#00ffff', alpha: 0.45 };
    addLogLine(`FIREWALL BYPASSED. LINKING LAYER ${state.level}...`);
    
    // Generate bricks and reset balls for the next level immediately, so they are ready and saved
    generateBricks();
    resetBalls();
    
    // Auto-save Endless state before shop
    if (state.gameMode === 'ENDLESS') {
        saveEndlessState();
    }
    
    // Save credits
    saveCredits();
    
    // Open shop terminal
    openShop('GAME');
}

const SHOP_ITEMS = [
    {
        id: 'SHIELD',
        name: 'NET_SHIELD // 防护盾',
        desc: '激活底层防护盾，可阻挡一次落球',
        price: 15,
        color: '#05ff50',
        buy() {
            activeMods['SHIELD'] = 1;
            state.diagnostics.shieldActive = true;
        }
    },
    {
        id: 'LASER',
        name: 'LASER_MOD // 激光枪',
        desc: '装备激光发射器，空格键发射 (400帧)',
        price: 25,
        color: '#ff0055',
        buy() {
            activeMods['LASER'] = (activeMods['LASER'] || 0) + 400;
        }
    },
    {
        id: 'MULTIBALL',
        name: 'SPLIT_CORE // 多核球',
        desc: '下一关开始时额外增加 2 个核心小球',
        price: 20,
        color: '#ffb700',
        buy() {
            state.shopPendingBalls = (state.shopPendingBalls || 0) + 2;
        }
    },
    {
        id: 'WIDE',
        name: 'WIDE_LINK // 挡板加宽',
        desc: '增加挡板宽度，持续时间 500 帧',
        price: 15,
        color: '#0044ff',
        buy() {
            activeMods['WIDE'] = (activeMods['WIDE'] || 0) + 500;
            paddle.targetWidth = 180 * (1 + getPaddleSkinBonus());
            paddle.color = '#0044ff';
        }
    },
    {
        id: 'SLOW',
        name: 'TIME_DILATION // 时间延缓',
        desc: '下一关开始时减慢核心球速度 (350帧)',
        price: 10,
        color: '#aa00ff',
        buy() {
            activeMods['SLOW'] = (activeMods['SLOW'] || 0) + 350;
        }
    },
    {
        id: 'LIFE',
        name: 'SYS_LIFE // 系统生命',
        get desc() {
            const maxLives = (state.skins && state.skins.theme && state.skins.theme.active === 3) ? 4 : 3;
            return `修复系统，增加 1 次生命值 (上限 ${maxLives})`;
        },
        get price() {
            return 25 + (state.lifePurchases || 0) * 5;
        },
        color: '#0044ff',
        buy() {
            const maxLives = (state.skins && state.skins.theme && state.skins.theme.active === 3) ? 4 : 3;
            state.lives = Math.min(maxLives, state.lives + 1);
            state.lifePurchases = (state.lifePurchases || 0) + 1;
        }
    },
    {
        id: 'MULT',
        name: 'SYS_MULT // 初始倍率',
        desc: '初始得分倍率永久增加 0.2',
        get price() {
            return 30 + (state.multPurchases || 0) * 10;
        },
        color: '#ffb700',
        buy() {
            state.multPurchases = (state.multPurchases || 0) + 1;
            state.baseMultiplier = 1.0 + state.multPurchases * 0.2;
            state.multiplier = Math.max(state.multiplier, state.baseMultiplier);
        }
    },
    {
        id: 'COOLER',
        name: 'CRYO_COOLER // 液氮冷却器',
        get desc() {
            return `降低处理器最高温度 15°C (已购 ${state.coolerPurchases || 0} 次)`;
        },
        price: 12,
        color: '#00d2ff',
        buy() {
            state.coolerPurchases = (state.coolerPurchases || 0) + 1;
            saveCredits();
        }
    }
];

function openShop(origin = 'GAME') {
    state.mode = 'SHOP';
    state.shopOrigin = origin; // 'GAME' or 'MENU'
    
    // Reset shop tab to upgrades initially
    state.currentShopTab = 'upgrades';
    const tabUpgrades = document.getElementById('shop-tab-upgrades');
    const tabSkins = document.getElementById('shop-tab-skins');
    const tabAch = document.getElementById('shop-tab-achievements');
    const skinCats = document.getElementById('skin-cats');
    if (tabUpgrades) tabUpgrades.classList.add('active');
    if (tabSkins) tabSkins.classList.remove('active');
    if (tabAch) tabAch.classList.remove('active');
    if (skinCats) skinCats.classList.add('hidden');
    
    // Update credits display
    document.getElementById('shop-credits-val').innerText = Math.floor(state.score);
    
    // Adjust shop close button text
    const nextBtn = document.getElementById('next-level-btn');
    if (nextBtn) {
        const btnText = nextBtn.querySelector('.btn-text');
        if (origin === 'MENU') {
            btnText.innerText = 'RETURN TO MAIN MENU // 返回主界面';
        } else {
            btnText.innerText = 'INITIALIZE NEXT LEVEL // 进入下一关';
        }
    }
    
    // Render shop items
    renderShopItems();
    
    // Show overlay
    document.getElementById('shop-overlay').classList.remove('hidden');
}

function renderShopItems() {
    const container = document.querySelector('.shop-items-container');
    container.innerHTML = '';
    
    if (state.currentShopTab === 'upgrades') {
        SHOP_ITEMS.forEach(item => {
            const card = document.createElement('div');
            card.className = 'shop-item-card';
            
            const title = document.createElement('div');
            title.className = 'shop-item-title';
            title.style.color = item.color;
            title.innerText = item.name;
            
            const desc = document.createElement('div');
            desc.className = 'shop-item-desc';
            desc.innerText = item.desc;
            
            const buyBtn = document.createElement('button');
            buyBtn.className = 'cyber-btn cyan-theme shop-item-buy-btn';
            
            // Check if affordable and if conditions met
            let canBuy = Math.floor(state.score) >= item.price;
            const maxLives = (state.skins && state.skins.theme && state.skins.theme.active === 3) ? 4 : 3;
            if (item.id === 'LIFE' && state.lives >= maxLives) {
                canBuy = false;
            }
            
            if (!canBuy) {
                buyBtn.classList.add('disabled');
            }
            
            let btnText = `BUY // ${item.price} CR`;
            if (item.id === 'LIFE' && state.lives >= maxLives) {
                btnText = 'MAX LIVES';
            }
            
            buyBtn.innerHTML = `
                <span class="btn-slice"></span>
                <span class="btn-text">${btnText}</span>
            `;
            
            buyBtn.addEventListener('click', () => {
                if (Math.floor(state.score) >= item.price) {
                    if (item.id === 'LIFE' && state.lives >= maxLives) return;
                    
                    state.score -= item.price;
                    item.buy();
                    unlockAchievement('BLACK_MARKET_PATRON');
                    playSound('powerup');
                    
                    // Save credits immediately after purchase
                    saveCredits();
                    
                    // Update diagnostic lists or HUD
                    updateHUD();
                    renderPowerupListHUD();
                    
                    // Update shop displays
                    document.getElementById('shop-credits-val').innerText = Math.floor(state.score);
                    renderShopItems();
                    
                    addLogLine(`SHOP: PURCHASED ${item.id}`);
                }
            });
            
            card.appendChild(title);
            card.appendChild(desc);
            card.appendChild(buyBtn);
            container.appendChild(card);
        });
    } else if (state.currentShopTab === 'skins') {
        const category = state.currentSkinCategory;
        const skins = SKINS_CONFIG[category];
        
        skins.forEach((skin, index) => {
            const card = document.createElement('div');
            card.className = 'shop-item-card skin-item-card';
            const isActive = state.skins[category].active === index;
            const isOwned = state.skins[category].owned[index];
            
            if (isActive) {
                card.classList.add('equipped-card');
            }
            
            const title = document.createElement('div');
            title.className = 'shop-item-title';
            title.style.color = skin.color || '#ffb700';
            title.innerText = skin.name;
            
            const canvas = document.createElement('canvas');
            canvas.className = 'skin-preview-canvas';
            canvas.width = 110;
            canvas.height = 45;
            
            const desc = document.createElement('div');
            desc.className = 'shop-item-desc';
            desc.innerText = skin.desc;
            
            const buyBtn = document.createElement('button');
            buyBtn.className = 'cyber-btn cyan-theme shop-item-buy-btn';
            
            if (isActive) {
                buyBtn.innerHTML = `
                    <span class="btn-slice"></span>
                    <span class="btn-text">EQUIPPED // 使用中</span>
                `;
                buyBtn.classList.add('disabled');
            } else if (isOwned) {
                buyBtn.innerHTML = `
                    <span class="btn-slice"></span>
                    <span class="btn-text">EQUIP // 装配</span>
                `;
                buyBtn.addEventListener('click', () => {
                    state.skins[category].active = index;
                    playSound('powerup');
                    saveCredits();
                    
                    // Apply skin immediately to game elements
                    if (category === 'paddle') {
                        paddle.targetWidth = (activeMods['WIDE'] ? 180 : 120) * (1 + getPaddleSkinBonus());
                    } else if (category === 'ball') {
                        applyBallSkin();
                    } else if (category === 'theme') {
                        const maxLives = (state.skins && state.skins.theme && state.skins.theme.active === 3) ? 4 : 3;
                        state.lives = Math.min(maxLives, state.lives);
                        updateHUD();
                    }
                    
                    renderShopItems();
                    addLogLine(`SKIN: EQUIPPED ${category.toUpperCase()} SKIN - ${skin.name}`);
                });
            } else {
                const canBuy = Math.floor(state.score) >= skin.price;
                if (!canBuy) {
                    buyBtn.classList.add('disabled');
                }
                
                buyBtn.innerHTML = `
                    <span class="btn-slice"></span>
                    <span class="btn-text">BUY // ${skin.price} CR</span>
                `;
                buyBtn.addEventListener('click', () => {
                    if (Math.floor(state.score) >= skin.price) {
                        state.score -= skin.price;
                        state.skins[category].owned[index] = true;
                        state.skins[category].active = index;
                        unlockAchievement('BLACK_MARKET_PATRON');
                        playSound('powerup');
                        saveCredits();
                        
                        // Apply skin immediately to game elements
                        if (category === 'paddle') {
                            paddle.targetWidth = (activeMods['WIDE'] ? 180 : 120) * (1 + getPaddleSkinBonus());
                        } else if (category === 'ball') {
                            applyBallSkin();
                        } else if (category === 'theme') {
                            const maxLives = (state.skins && state.skins.theme && state.skins.theme.active === 3) ? 4 : 3;
                            state.lives = Math.min(maxLives, state.lives);
                            updateHUD();
                        }
                        
                        // Update credits display
                        document.getElementById('shop-credits-val').innerText = Math.floor(state.score);
                        renderShopItems();
                        addLogLine(`SKIN: BOUGHT & EQUIPPED ${category.toUpperCase()} SKIN - ${skin.name}`);
                    }
                });
            }
            
            card.appendChild(title);
            card.appendChild(canvas);
            card.appendChild(desc);
            card.appendChild(buyBtn);
            container.appendChild(card);
            
            // Draw visual preview on the canvas
            drawSkinPreview(canvas, category, skin, index);
        });
    } else if (state.currentShopTab === 'achievements') {
        renderAchievementsList(container);
    }
}

function switchShopTab(tab) {
    state.currentShopTab = tab;
    
    const tabUpgrades = document.getElementById('shop-tab-upgrades');
    const tabSkins = document.getElementById('shop-tab-skins');
    const tabAch = document.getElementById('shop-tab-achievements');
    const skinCats = document.getElementById('skin-cats');
    
    if (tabUpgrades) tabUpgrades.classList.remove('active');
    if (tabSkins) tabSkins.classList.remove('active');
    if (tabAch) tabAch.classList.remove('active');
    if (skinCats) skinCats.classList.add('hidden');
    
    if (tab === 'upgrades') {
        if (tabUpgrades) tabUpgrades.classList.add('active');
    } else if (tab === 'skins') {
        if (tabSkins) tabSkins.classList.add('active');
        if (skinCats) skinCats.classList.remove('hidden');
        switchSkinCategory(state.currentSkinCategory || 'paddle');
    } else if (tab === 'achievements') {
        if (tabAch) tabAch.classList.add('active');
    }
    
    renderShopItems();
}

function switchSkinCategory(cat) {
    state.currentSkinCategory = cat;
    
    ['paddle', 'ball', 'brick', 'theme'].forEach(c => {
        const btn = document.getElementById(`skin-cat-${c}`);
        if (btn) {
            if (c === cat) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
    
    renderShopItems();
}

function drawSkinPreview(canvas, category, skin, index) {
    const pCtx = canvas.getContext('2d');
    pCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    pCtx.fillStyle = '#05050a';
    pCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    pCtx.strokeStyle = 'rgba(26, 28, 53, 0.4)';
    pCtx.lineWidth = 0.5;
    pCtx.beginPath();
    for (let x = 10; x < canvas.width; x += 15) {
        pCtx.moveTo(x, 0);
        pCtx.lineTo(x, canvas.height);
    }
    for (let y = 10; y < canvas.height; y += 15) {
        pCtx.moveTo(0, y);
        pCtx.lineTo(canvas.width, y);
    }
    pCtx.stroke();
    
    if (category === 'paddle') {
        const padWidth = 65;
        const padHeight = 8;
        const mockP = {
            x: (canvas.width - padWidth) / 2,
            y: (canvas.height - padHeight) / 2,
            width: padWidth,
            height: padHeight,
            color: skin.color || '#0044ff'
        };
        skin.draw(mockP, pCtx);
    } else if (category === 'ball') {
        const radius = 6;
        const mockB = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: radius,
            color: skin.color || '#00f0ff',
            trail: [
                { x: canvas.width / 2 - 25, y: canvas.height / 2 },
                { x: canvas.width / 2 - 20, y: canvas.height / 2 },
                { x: canvas.width / 2 - 15, y: canvas.height / 2 },
                { x: canvas.width / 2 - 10, y: canvas.height / 2 },
                { x: canvas.width / 2 - 5, y: canvas.height / 2 }
            ]
        };
        pCtx.save();
        mockB.trail.forEach((pt, idx) => {
            const alpha = (idx + 1) / mockB.trail.length * 0.3;
            pCtx.fillStyle = `${skin.trailColor}${alpha})`;
            pCtx.beginPath();
            pCtx.arc(pt.x, pt.y, mockB.radius * (idx / mockB.trail.length), 0, Math.PI * 2);
            pCtx.fill();
        });
        pCtx.restore();
        
        skin.draw(mockB, pCtx);
    } else if (category === 'brick') {
        const brWidth = 50;
        const brHeight = 15;
        const mockBr = {
            x: (canvas.width - brWidth) / 2,
            y: (canvas.height - brHeight) / 2,
            width: brWidth,
            height: brHeight,
            hp: 3,
            maxHp: 3,
            color: skin.price === 100 ? '#00ffcc' : (skin.price === 200 ? '#ff00ff' : (skin.price === 300 ? '#ffb700' : '#00f0ff')),
            hexToRgb(hex) {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `${r}, ${g}, ${b}`;
            }
        };
        skin.draw(mockBr, pCtx);
    } else if (category === 'theme') {
        pCtx.save();
        const sx = canvas.width / CANVAS_WIDTH;
        const sy = canvas.height / CANVAS_HEIGHT;
        pCtx.scale(sx, sy);
        skin.draw(pCtx);
        pCtx.restore();
    }
}

function handleShopNext() {
    if (state.shopOrigin === 'MENU') {
        // Return to main menu
        document.getElementById('shop-overlay').classList.add('hidden');
        document.getElementById('menu-overlay').classList.remove('hidden');
        state.mode = 'MENU';
    } else {
        // Go to next level
        startNextLevel();
    }
}

function startNextLevel() {
    // Hide shop overlay
    document.getElementById('shop-overlay').classList.add('hidden');
    
    // Theme 3 heal bonus
    if (state.skins && state.skins.theme && state.skins.theme.active === 3) {
        const maxLives = 4;
        if (state.lives < maxLives) {
            state.lives++;
            addLogLine("THEME_BONUS: SYSTEM AUTO-REPAIR (+1 LIFE)");
            updateHUD();
        }
    }
    
    // Flash game alert level up
    const alertBox = document.getElementById('game-alert');
    alertBox.innerText = `STAGE_BYPASSED // LOAD_${String(state.level).padStart(2, '0')}`;
    alertBox.classList.remove('hidden');
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 1500);
    
    // Resume playing state
    state.mode = 'PLAYING';
    
    // Auto-save at the start of new level (Endless mode only)
    if (state.gameMode === 'ENDLESS') {
        saveEndlessState();
    }
}

function gameVictory() {
    playSound('victory');
    state.mode = 'VICTORY';
    
    const finalScoreInt = Math.floor(state.score);
    if (finalScoreInt > state.highScore) {
        state.highScore = finalScoreInt;
        storage.set('cyberbreak_highscore', state.highScore);
    }
    
    // Save persistent credits
    saveCredits();
    
    const overlay = document.getElementById('victory-overlay');
    overlay.classList.remove('hidden');
    
    const titleNode = overlay.querySelector('.glitch-title-large');
    if (titleNode) {
        titleNode.innerText = "SYSTEM_OVERFLOW";
        titleNode.setAttribute('data-text', "SYSTEM_OVERFLOW");
    }
    const subtitleNode = overlay.querySelector('.subtitle');
    if (subtitleNode) {
        subtitleNode.innerText = "DATABASE BREACHED // 核心数据库破解成功";
    }
    const summaryNode = overlay.querySelector('.stats-summary');
    if (summaryNode) {
        summaryNode.innerHTML = `
            <p>FINAL SCORE: <span class="neon-cyan">${finalScoreInt}</span></p>
            <p>CORP DEFEATED!</p>
        `;
    }
    const retryBtn = document.getElementById('win-retry-btn');
    if (retryBtn) retryBtn.querySelector('.btn-text').innerText = "RE-ENTER GRID() // 重入网格";
    
    addLogLine("SYS_SUCCESS: DATA EXTRACTED. CORP DEFEATED.");
    
    setTimeout(() => {
        checkAndAddLeaderboard(finalScoreInt);
    }, 500);
}

function triggerBattleComplete(playerWon, reason) {
    state.mode = 'MENU';
    playSound(playerWon ? 'victory' : 'lost');
    
    // Give credits reward
    const reward = playerWon ? 80 : 20;
    state.vsScore = (state.vsScore || 0) + reward;
    saveVsScore();
    
    // Reset highscore in UI
    loadHighScore();
    
    const overlay = document.getElementById('victory-overlay');
    overlay.classList.remove('hidden');
    
    const titleNode = overlay.querySelector('.glitch-title-large');
    if (titleNode) {
        titleNode.innerText = playerWon ? "BATTLE_VICTORY" : "BATTLE_DEFEAT";
        titleNode.setAttribute('data-text', playerWon ? "BATTLE_VICTORY" : "BATTLE_DEFEAT");
    }
    
    const subtitleNode = overlay.querySelector('.subtitle');
    if (subtitleNode) {
        subtitleNode.innerText = playerWon ? `AI BYPASSED // 成功击败AI核心 (+${reward} VS_CR)` : `DEFEAT BY AI // 被AI核心击败 (+${reward} VS_CR)`;
    }
    
    const summaryNode = overlay.querySelector('.stats-summary');
    if (summaryNode) {
        if (state.gameMode === 'SCORE_BATTLE') {
            summaryNode.innerHTML = `
                <p>PLAYER SCORE: <span class="neon-cyan">${Math.floor(state.matchScore || 0)}</span> (TIME: ${state.playerTime.toFixed(1)}s)</p>
                <p>BOT SCORE: <span class="neon-yellow">${Math.floor(state.botScore)}</span> (TIME: ${state.botTime.toFixed(1)}s)</p>
                <p>VS_CREDITS // 对战积分: <span class="neon-green">${state.vsScore} CR</span> (+${reward} CR)</p>
                <p>REASON: ${reason}</p>
            `;
        } else {
            summaryNode.innerHTML = `
                <p>PLAYER PONG SCORE: <span class="neon-cyan">${state.matchScore || 0}</span></p>
                <p>BOT PONG SCORE: <span class="neon-yellow">${state.botScore}</span></p>
                <p>VS_CREDITS // 对战积分: <span class="neon-green">${state.vsScore} CR</span> (+${reward} CR)</p>
                <p>REASON: ${reason}</p>
            `;
        }
    }
    
    const retryBtn = document.getElementById('win-retry-btn');
    if (retryBtn) retryBtn.querySelector('.btn-text').innerText = "RE-ENTER DUEL() // 重新对决";
    
    addLogLine(`BATTLE COMPLETE. RESULT: ${playerWon ? 'VICTORY' : 'DEFEAT'}.`);
}

function startGame(chosenMode = 'STORY', startLevel = 1) {
    initAudio();
    state.gameMode = chosenMode;
    state.mode = 'PLAYING';
    state.consecutiveLevelsNoDeath = 0;
    state.glitchedInLevel = false;
    
    // Close overlay UI
    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');
    document.getElementById('shop-overlay').classList.add('hidden');
    const vsBotOverlay = document.getElementById('vs-bot-overlay');
    if (vsBotOverlay) vsBotOverlay.classList.add('hidden');
    
    // Reset active powerup list in UI
    const list = document.getElementById('powerup-list');
    if (list) list.innerHTML = '<div class="no-mods">NO ACTIVE MODS</div>';
    
    if (chosenMode === 'ENDLESS') {
        // Try loading saved Endless state
        const loaded = loadEndlessState();
        if (loaded) {
            // Update HUD immediately
            updateHUD();
            return;
        }
    }
    
    if (chosenMode === 'SCORE_BATTLE') {
        loadCredits();
        state.botScore = 0;
        state.botTime = 0;
        state.playerTime = 0;
        state.baseMultiplier = 1.0 + (state.multPurchases || 0) * 0.2;
        state.multiplier = state.baseMultiplier;
        state.level = 1;
        state.lives = 3;
        state.shopPendingBalls = 0;
        activeMods = {};
    } else if (chosenMode === 'PONG_BATTLE') {
        state.botScore = 0;
        state.botLives = 3;
        state.score = 0;
        state.level = 1;
        state.lives = 3;
        state.playerTime = 0;
        state.botTime = 0;
        state.multiplier = 1.0;
        state.shopPendingBalls = 0;
        activeMods = {};
    } else {
        // Otherwise initialize a fresh game
        loadCredits();
        state.baseMultiplier = 1.0 + (state.multPurchases || 0) * 0.2;
        state.multiplier = state.baseMultiplier;
        state.level = startLevel;
        const maxLives = (state.skins && state.skins.theme && state.skins.theme.active === 3) ? 4 : 3;
        state.lives = maxLives;
        state.shopPendingBalls = 0;
        activeMods = {};
    }
    
    // Update Mode indicator text in DOM
    const modeValNode = document.getElementById('mode-val');
    if (modeValNode) {
        modeValNode.innerText = chosenMode;
        if (chosenMode === 'ENDLESS') {
            modeValNode.className = 'neon-yellow font-orbitron';
        } else if (chosenMode === 'SCORE_BATTLE' || chosenMode === 'PONG_BATTLE') {
            modeValNode.className = 'neon-cyan font-orbitron';
        } else {
            modeValNode.className = 'neon-magenta font-orbitron';
        }
    }
    
    addLogLine(`Establishing direct cerebral overlay grid link [${chosenMode}]...`);
    addLogLine("LINK STABLE. GRID ACTIVE.");
    
    generateBricks();
    resetBalls();
}

// --- RENDER & CANVAS DRAWING ---

function draw() {
    // Handle Screen Shake transformations
    ctx.save();
    if (state.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * state.screenShake;
        const shakeY = (Math.random() - 0.5) * state.screenShake;
        ctx.translate(shakeX, shakeY);
        state.screenShake *= 0.88; // decay
        if (state.screenShake < 0.2) state.screenShake = 0;
    }
    
    // Clear & background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw active background theme
    drawThemeBackground();
    
    // Draw brick nodes
    bricks.forEach(b => {
        if (b.hp > 0) b.draw();
    });
    
    // Draw falling powerups
    powerups.forEach(p => p.draw());
    
    // Draw laser lines
    lasers.forEach(l => {
        ctx.save();
        ctx.fillStyle = l.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = l.color;
        ctx.fillRect(l.x - l.width/2, l.y, l.width, l.height);
        ctx.restore();
    });
    
    // Draw bottom shield if active
    if (activeMods['SHIELD']) {
        ctx.save();
        ctx.strokeStyle = '#05ff50';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#05ff50';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT - 12);
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 12);
        ctx.stroke();
        ctx.restore();
    }
    
    // Draw bottom side stabilizers (MIRROR_WALL) if active
    if (activeMods['MIRROR_WALL'] > 0) {
        ctx.save();
        ctx.strokeStyle = '#00e5ff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00e5ff';
        ctx.lineWidth = 4;
        // Left corner stabilizer
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT - 20);
        ctx.lineTo(120, CANVAS_HEIGHT - 20);
        ctx.stroke();
        // Right corner stabilizer
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH - 120, CANVAS_HEIGHT - 20);
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 20);
        ctx.stroke();
        // Vertical side highlights for aesthetics
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT - 120);
        ctx.lineTo(0, CANVAS_HEIGHT - 20);
        ctx.moveTo(CANVAS_WIDTH, CANVAS_HEIGHT - 120);
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 20);
        ctx.stroke();
        ctx.restore();
    }
    
    // Draw gravity well field if active
    if (activeMods['GRAVITY_WELL'] > 0) {
        ctx.save();
        ctx.globalAlpha = 0.05 + Math.sin(Date.now() / 200) * 0.02;
        ctx.fillStyle = '#b700ff';
        ctx.fillRect(0, CANVAS_HEIGHT * 0.70, CANVAS_WIDTH, CANVAS_HEIGHT * 0.30);
        
        // Draw subtle horizontal lines showing gravity flow
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#b700ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const flowY = CANVAS_HEIGHT * 0.70 + (Date.now() / 15) % (CANVAS_HEIGHT * 0.30);
        ctx.moveTo(0, flowY);
        ctx.lineTo(CANVAS_WIDTH, flowY);
        ctx.stroke();
        ctx.restore();
    }
    
    // Draw active boss and boss health bar if active
    if (state.bossActive && state.boss) {
        const boss = state.boss;
        ctx.save();
        
        function drawBossCore(c, offsetX = 0) {
            c.save();
            c.translate(offsetX, 0);
            c.shadowBlur = 20;
            c.shadowColor = boss.color || '#ff0055';
            c.fillStyle = '#0d0e1c'; // dark core body
            c.strokeStyle = boss.color || '#ff0055';
            c.lineWidth = 3;
            
            if (boss.type === 1) {
                // Type 1: Sector Overlord Circle
                const cx = boss.x + boss.width / 2;
                const cy = boss.y + boss.height / 2;
                const r = Math.min(boss.width, boss.height) / 2 + 10;
                
                c.beginPath();
                c.arc(cx, cy, r, 0, Math.PI * 2);
                c.fill();
                c.stroke();
                
                // Segmented rotating outer shield ring
                c.strokeStyle = 'rgba(0, 210, 255, 0.6)';
                c.lineWidth = 2.5;
                c.setLineDash([15, 20]);
                c.beginPath();
                c.arc(cx, cy, r + 15, Date.now() / 600, Date.now() / 600 + Math.PI * 2);
                c.stroke();
                c.setLineDash([]);
                
                // Pulsing cyan core
                const pulse = 1.0 + Math.sin(Date.now() / 100) * 0.2;
                c.fillStyle = '#00d2ff';
                c.shadowColor = '#00d2ff';
                c.beginPath();
                c.arc(cx, cy, 12 * pulse, 0, Math.PI * 2);
                c.fill();
            } else if (boss.type === 2) {
                // Type 2: AI Singularity sharp diamond / triangle
                const cx = boss.x + boss.width / 2;
                const cy = boss.y + boss.height / 2;
                
                c.beginPath();
                c.moveTo(cx, boss.y);
                c.lineTo(boss.x + boss.width - 20, cy);
                c.lineTo(cx, boss.y + boss.height);
                c.lineTo(boss.x + 20, cy);
                c.closePath();
                c.fill();
                c.stroke();
                
                // Glitchy lines
                if (Math.random() < 0.25) {
                    c.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    c.lineWidth = 1;
                    c.strokeRect(boss.x + Math.random() * 20, boss.y + Math.random() * 20, boss.width - 40, boss.height - 20);
                }
                
                // Pulsing green core
                const pulse = 1.0 + Math.sin(Date.now() / 80) * 0.3;
                c.fillStyle = '#05ff50';
                c.shadowColor = '#05ff50';
                c.beginPath();
                c.arc(cx, cy, 10 * pulse, 0, Math.PI * 2);
                c.fill();
            } else {
                // Type 0: Enterprise Firewall (Hexagon)
                c.beginPath();
                c.moveTo(boss.x, boss.y + 15);
                c.lineTo(boss.x + 30, boss.y);
                c.lineTo(boss.x + boss.width - 30, boss.y);
                c.lineTo(boss.x + boss.width, boss.y + 15);
                c.lineTo(boss.x + boss.width - 15, boss.y + boss.height);
                c.lineTo(boss.x + 15, boss.y + boss.height);
                c.closePath();
                c.fill();
                c.stroke();
                
                // Tech details inside boss core
                c.strokeStyle = 'rgba(255, 0, 85, 0.4)';
                c.lineWidth = 1;
                c.beginPath();
                c.moveTo(boss.x + 20, boss.y + boss.height/2);
                c.lineTo(boss.x + boss.width - 20, boss.y + boss.height/2);
                c.stroke();
                
                // Pulsing power core
                const pulse = 1.0 + Math.sin(Date.now() / 100) * 0.2;
                c.fillStyle = '#ff0055';
                c.shadowColor = '#ff0055';
                c.beginPath();
                c.arc(boss.x + boss.width / 2, boss.y + boss.height / 2, 10 * pulse, 0, Math.PI * 2);
                c.fill();
            }
            c.restore();
        }
        
        if (state.screenShake > 0) {
            const offset = state.screenShake * 0.4;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            drawBossCore(ctx, -offset);
            drawBossCore(ctx, offset);
            ctx.restore();
        }
        drawBossCore(ctx, 0);
        
        // 2. Draw Shield Halo if active
        if (boss.shieldHp > 0) {
            ctx.strokeStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 12]);
            ctx.beginPath();
            ctx.arc(boss.x + boss.width / 2, boss.y + boss.height / 2, boss.width / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 3. Draw Boss Health Bar at top center
        const barW = 300;
        const barH = 10;
        const barX = CANVAS_WIDTH / 2 - barW / 2;
        const barY = 20;
        
        // BG bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeRect(barX, barY, barW, barH);
        
        // HP Fill
        const hpPct = Math.max(0, boss.hp / boss.maxHp);
        ctx.fillStyle = boss.color || '#ff0055';
        ctx.shadowColor = boss.color || '#ff0055';
        ctx.shadowBlur = 10;
        ctx.fillRect(barX + 2, barY + 2, (barW - 4) * hpPct, barH - 4);
        
        // Text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "Orbitron"';
        ctx.textAlign = 'center';
        ctx.fillText(`${boss.name || 'SECURE_GATEWAY_INTEGRITY'} // 安全度 ${Math.round(hpPct * 100)}%`, CANVAS_WIDTH / 2, barY - 6);
        
        // 4. Draw Boss Bullets
        boss.bullets.forEach(bullet => {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = bullet.color;
            ctx.fillStyle = bullet.color;
            ctx.beginPath();
            ctx.moveTo(bullet.x, bullet.y - bullet.radius);
            ctx.lineTo(bullet.x + bullet.radius, bullet.y + bullet.radius);
            ctx.lineTo(bullet.x - bullet.radius, bullet.y + bullet.radius);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    // Draw shockwaves
    shockwaves.forEach(sw => sw.draw());
    
    // Draw particles
    particles.forEach(p => p.draw());
    
    // Draw paddle
    paddle.draw();
    
    // Draw top AI paddle in Pong Battle mode
    if (state.gameMode === 'PONG_BATTLE') {
        ctx.save();
        ctx.fillStyle = '#ff0055';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0055';
        ctx.fillRect(aiPaddle.x, aiPaddle.y, aiPaddle.width, aiPaddle.height);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(aiPaddle.x + 2, aiPaddle.y + 2, aiPaddle.width - 4, aiPaddle.height - 4);
        
        ctx.fillStyle = '#ff0055';
        ctx.font = '8px "Share Tech Mono", monospace';
        ctx.fillText("AI_OPPONENT", aiPaddle.x + aiPaddle.width/2 - 26, aiPaddle.y - 6);
        ctx.restore();
    }
    
    // Draw balls
    balls.forEach(b => b.draw());
    
    // Draw horizontal static glitch lines during screen shake
    if (state.screenShake > 0) {
        if (Math.random() < 0.4) {
            const numSlices = Math.floor(Math.random() * 2) + 1;
            for (let s = 0; s < numSlices; s++) {
                const sliceY = Math.random() * CANVAS_HEIGHT;
                const sliceH = Math.random() * 20 + 5;
                const offsetShift = (Math.random() - 0.5) * state.screenShake * 1.5;
                
                ctx.save();
                ctx.globalAlpha = 0.25;
                ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
                ctx.fillRect(offsetShift, sliceY, CANVAS_WIDTH, sliceH);
                ctx.fillStyle = 'rgba(255, 0, 85, 0.3)';
                ctx.fillRect(-offsetShift, sliceY + (Math.random() * 4 - 2), CANVAS_WIDTH, sliceH);
                ctx.restore();
            }
        }
        
        if (Math.random() < 0.15) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1;
            const vectorY = Math.random() * CANVAS_HEIGHT;
            ctx.beginPath();
            ctx.moveTo(0, vectorY);
            ctx.lineTo(CANVAS_WIDTH, vectorY);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Draw Ghost Paddle outline
    if (state.mode === 'PLAYING') {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.16)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ghostPaddle.x, paddle.y, ghostPaddle.width, paddle.height);
        
        // Label above ghost
        ctx.fillStyle = 'rgba(0, 255, 255, 0.25)';
        ctx.font = '8px "Share Tech Mono", monospace';
        ctx.fillText("GHOST_PARTNER", ghostPaddle.x + ghostPaddle.width/2 - 28, paddle.y - 6);
        ctx.restore();
    }

    // Draw fullscreen radial gradient flash vignette overlay
    if (state.flashVignette && state.flashVignette.alpha > 0) {
        ctx.save();
        const vGrad = ctx.createRadialGradient(
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50, 
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.8
        );
        vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        const hex = state.flashVignette.color;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        vGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${state.flashVignette.alpha})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
    }
    
    ctx.restore();

    // Core Temperature CRT horizontal offset glitch (post-processing) - Safari WebKit compatible
    if (state.diagnostics.coreTemp > 50 && Math.random() < 0.12) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        const sliceCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < sliceCount; i++) {
            const sy = Math.random() * CANVAS_HEIGHT;
            const sh = Math.random() * 20 + 5;
            const offsetShift = (Math.random() - 0.5) * 15;
            
            ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.fillRect(offsetShift, sy, CANVAS_WIDTH, sh);
            ctx.fillStyle = 'rgba(255, 0, 85, 0.3)';
            ctx.fillRect(-offsetShift, sy + (Math.random() * 4 - 2), CANVAS_WIDTH, sh);
        }
        ctx.restore();
    }
}

// Draw active background theme
function drawThemeBackground() {
    const active = state.skins ? state.skins.theme.active : 0;
    const theme = SKINS_CONFIG.theme[active] || SKINS_CONFIG.theme[0];
    theme.draw(ctx);
}

// --- EVENT HANDLERS & INITIALIZATION ---

// --- ACCOUNT SYSTEM LOGICS ---
function initAccountSystem() {
    const lastUser = safeLocalStorage.getItem('cyberbreak_last_user');
    if (lastUser) {
        state.currentUser = lastUser;
        document.getElementById('current-user-val').innerText = lastUser.toUpperCase();
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('menu-overlay').classList.remove('hidden');
        
        // Load data for this user
        loadHighScore();
        loadCredits();
        loadVsScore();
        initDailyContracts();
    } else {
        // Force login screen
        document.getElementById('menu-overlay').classList.add('hidden');
        document.getElementById('auth-overlay').classList.remove('hidden');
    }
}

function handleLogin() {
    const userField = document.getElementById('auth-username');
    const passField = document.getElementById('auth-password');
    const errorNode = document.getElementById('auth-error-msg');
    
    const username = userField.value.trim().toLowerCase();
    const password = passField.value.trim();
    
    if (!username || !password) {
        errorNode.innerText = "EMPTY_FIELDS // 请输入用户名和密码";
        errorNode.classList.remove('hidden');
        playSound('lost');
        return;
    }
    
    const savedUsers = JSON.parse(safeLocalStorage.getItem('cyberbreak_registered_users')) || {};
    if (savedUsers[username] && savedUsers[username] === password) {
        // Success
        state.currentUser = username;
        safeLocalStorage.setItem('cyberbreak_last_user', username);
        document.getElementById('current-user-val').innerText = username.toUpperCase();
        document.getElementById('auth-overlay').classList.add('hidden');
        document.getElementById('menu-overlay').classList.remove('hidden');
        errorNode.classList.add('hidden');
        
        userField.value = '';
        passField.value = '';
        
        // Reload all data for this specific user
        loadHighScore();
        loadCredits();
        loadVsScore();
        initDailyContracts();
        
        playSound('powerup');
        addLogLine(`Operator ${username.toUpperCase()} linked successfully.`);
    } else {
        errorNode.innerText = "AUTH_FAILED // 用户名或密码错误";
        errorNode.classList.remove('hidden');
        playSound('lost');
    }
}

function handleRegister() {
    const userField = document.getElementById('auth-username');
    const passField = document.getElementById('auth-password');
    const errorNode = document.getElementById('auth-error-msg');
    
    const username = userField.value.trim().toLowerCase();
    const password = passField.value.trim();
    
    if (!username || !password) {
        errorNode.innerText = "EMPTY_FIELDS // 请输入用户名和密码";
        errorNode.classList.remove('hidden');
        playSound('lost');
        return;
    }
    
    if (username.length < 3 || username.length > 10) {
        errorNode.innerText = "INVALID_LENGTH // 用户名长度须在 3-10 个字符之间";
        errorNode.classList.remove('hidden');
        playSound('lost');
        return;
    }
    
    const savedUsers = JSON.parse(safeLocalStorage.getItem('cyberbreak_registered_users')) || {};
    if (savedUsers[username]) {
        errorNode.innerText = "USER_EXISTS // 该用户名已被注册";
        errorNode.classList.remove('hidden');
        playSound('lost');
        return;
    }
    
    // Register
    savedUsers[username] = password;
    safeLocalStorage.setItem('cyberbreak_registered_users', JSON.stringify(savedUsers));
    
    // Auto-login after registration
    state.currentUser = username;
    safeLocalStorage.setItem('cyberbreak_last_user', username);
    document.getElementById('current-user-val').innerText = username.toUpperCase();
    document.getElementById('auth-overlay').classList.add('hidden');
    document.getElementById('menu-overlay').classList.remove('hidden');
    errorNode.classList.add('hidden');
    
    userField.value = '';
    passField.value = '';
    
    // Reset/Clear fresh profiles in state and save
    state.score = 0;
    state.highScore = 0;
    state.vsScore = 0;
    state.endlessMaxLevel = 1;
    state.multPurchases = 0;
    state.lifePurchases = 0;
    state.coolerPurchases = 0;
    state.skins = {
        paddle: { owned: [true, false, false, false], active: 0 },
        ball: { owned: [true, false, false, false], active: 0 },
        brick: { owned: [true, false, false, false], active: 0 },
        theme: { owned: [true, false, false, false], active: 0 }
    };
    
    saveCredits();
    storage.remove('cyberbreak_endless_save');
    storage.remove('cyberbreak_endless_maxlevel');
    storage.remove('cyberbreak_achievements');
    
    // Re-init default achievements map for this user
    initAchievements();
    
    // Reload UI states
    loadHighScore();
    loadCredits();
    loadVsScore();
    initDailyContracts();
    
    playSound('powerup');
    addLogLine(`New Operator registered & loaded: ${username.toUpperCase()}`);
}

function handleLogout() {
    // Save state before logout
    saveCredits();
    saveVsScore();
    if (state.gameMode === 'ENDLESS' && state.mode === 'PLAYING') {
        saveEndlessState();
    }
    
    state.currentUser = null;
    safeLocalStorage.removeItem('cyberbreak_last_user');
    document.getElementById('current-user-val').innerText = 'UNAUTHORIZED';
    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('auth-overlay').classList.remove('hidden');
    
    // Stop any active game context and go back to menu
    state.mode = 'MENU';
    playSound('lost');
    addLogLine(`Operator unlinked. Neural gateway closed.`);
}

function openLevelSelect() {
    const grid = document.querySelector('#level-select-overlay .level-select-grid');
    if (grid) {
        grid.innerHTML = '';
        
        // Dynamically build buttons from Level 1 up to state.endlessMaxLevel
        const maxLevel = state.endlessMaxLevel || 1;
        
        for (let lvl = 1; lvl <= maxLevel; lvl++) {
            const isBoss = (lvl % 5 === 0);
            const btn = document.createElement('button');
            btn.className = `stage-node-btn ${isBoss ? 'boss-node' : ''}`;
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'stage-node-title';
            
            let bossIndicator = '';
            if (isBoss) {
                const bossType = Math.floor((lvl / 5 - 1) % 3);
                bossIndicator = bossType === 1 ? ' [🔵 Boss]' : (bossType === 2 ? ' [🟢 Boss]' : ' [🔴 Boss]');
            }
            titleSpan.innerText = `NODE ${String(lvl).padStart(2, '0')}${bossIndicator}`;
            
            const descSpan = document.createElement('span');
            descSpan.className = 'stage-node-desc';
            if (isBoss) {
                const bossType = Math.floor((lvl / 5 - 1) % 3);
                let bossName = 'ENTERPRISE_FIREWALL // 企业网关防火墙';
                if (bossType === 1) bossName = 'SECTOR_OVERLORD // 扇区领主核心';
                if (bossType === 2) bossName = 'AI_SINGULARITY // 奇点意识核心';
                descSpan.innerText = `ALERT: ${bossName}`;
            } else {
                descSpan.innerText = `DATA_GRID // 无尽数据链路节点 ${lvl}`;
            }
            
            btn.appendChild(titleSpan);
            btn.appendChild(descSpan);
            
            btn.addEventListener('click', () => {
                state.level = lvl;
                document.getElementById('level-select-overlay').classList.add('hidden');
                
                // Clear any existing saved session so it doesn't conflict
                clearEndlessState();
                
                startGame('ENDLESS', lvl);
            });
            
            grid.appendChild(btn);
        }
    }
    
    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('level-select-overlay').classList.remove('hidden');
}

function setupInputListeners() {
    // Keyboard inputs
    window.addEventListener('keydown', e => {
        // Backtick toggles terminal input shell
        if (e.key === '`') {
            e.preventDefault();
            const termOverlay = document.getElementById('terminal-overlay');
            const termInput = document.getElementById('terminal-input');
            if (termOverlay && termInput) {
                const isHidden = termOverlay.classList.toggle('hidden');
                if (!isHidden) {
                    termInput.focus();
                    termInput.value = '';
                } else {
                    termInput.blur();
                }
            }
            return;
        }
        
        if (e.target.tagName === 'INPUT') {
            if (e.key === 'Enter') {
                if (e.target.id === 'terminal-input') {
                    executeTerminalCommand(e.target.value);
                    e.target.value = '';
                    document.getElementById('terminal-overlay').classList.add('hidden');
                } else {
                    handleLogin();
                }
            }
            return;
        }
        
        keys[e.key] = true;
        
        if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
            state.inputMode = 'keyboard';
        }
        
        // Launch ball stuck to paddle
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            
            if (state.mode === 'PLAYING') {
                balls.forEach(b => {
                    if (b.attached) {
                        b.attached = false;
                        addLogLine("Ball node launched into system stack.");
                    }
                });
                
                // Shoot lasers if active
                if (activeMods['LASER']) {
                    fireLasers();
                }
            }
        }
    });
    
    window.addEventListener('keyup', e => {
        if (e.target.tagName === 'INPUT') {
            return;
        }
        keys[e.key] = false;
    });
    
    // Mouse movement within Canvas
    canvas.addEventListener('mousemove', e => {
        state.inputMode = 'mouse';
        const rect = canvas.getBoundingClientRect();
        // Scale mouse client coordinates to match logical canvas width
        const clientXInCanvas = e.clientX - rect.left;
        mouseX = (clientXInCanvas / rect.width) * CANVAS_WIDTH;
    });
    
    // Mobile / Touch controls
    const handleTouch = e => {
        if (e.touches.length > 0) {
            state.inputMode = 'mouse';
            const rect = canvas.getBoundingClientRect();
            const touchXInCanvas = e.touches[0].clientX - rect.left;
            mouseX = (touchXInCanvas / rect.width) * CANVAS_WIDTH;
            
            // Launch balls or fire lasers on touch down
            if (state.mode === 'PLAYING') {
                balls.forEach(b => {
                    if (b.attached) b.attached = false;
                });
                if (activeMods['LASER']) {
                    fireLasers();
                }
            }
        }
    };
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        handleTouch(e);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        handleTouch(e);
    }, { passive: false });
    
    // Click on canvas launches ball as well
    canvas.addEventListener('click', () => {
        if (state.mode === 'PLAYING') {
            balls.forEach(b => {
                if (b.attached) b.attached = false;
            });
        }
    });
    
    // Wire up buttons
    document.getElementById('auth-login-btn').addEventListener('click', handleLogin);
    document.getElementById('auth-register-btn').addEventListener('click', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    document.getElementById('radio-prev-btn').addEventListener('click', () => {
        initAudio();
        state.currentRadioTrack = (state.currentRadioTrack - 1 + RADIO_TRACKS.length) % RADIO_TRACKS.length;
        document.getElementById('radio-track-title').innerText = RADIO_TRACKS[state.currentRadioTrack].name;
        startBgMusic();
        addLogLine(`RADIO: track set to ${RADIO_TRACKS[state.currentRadioTrack].name}`);
    });
    
    document.getElementById('radio-next-btn').addEventListener('click', () => {
        initAudio();
        state.currentRadioTrack = (state.currentRadioTrack + 1) % RADIO_TRACKS.length;
        document.getElementById('radio-track-title').innerText = RADIO_TRACKS[state.currentRadioTrack].name;
        startBgMusic();
        addLogLine(`RADIO: track set to ${RADIO_TRACKS[state.currentRadioTrack].name}`);
    });
    
    document.getElementById('start-story-btn').addEventListener('click', () => startGame('STORY'));
    document.getElementById('start-endless-btn').addEventListener('click', () => startGame('ENDLESS'));
    document.getElementById('menu-select-btn').addEventListener('click', () => openLevelSelect());
    document.getElementById('level-select-back-btn').addEventListener('click', () => {
        document.getElementById('level-select-overlay').classList.add('hidden');
        document.getElementById('menu-overlay').classList.remove('hidden');
    });
    
    document.getElementById('menu-vs-bot-btn').addEventListener('click', () => {
        document.getElementById('menu-overlay').classList.add('hidden');
        document.getElementById('vs-bot-overlay').classList.remove('hidden');
    });
    document.getElementById('vs-score-btn').addEventListener('click', () => {
        startGame('SCORE_BATTLE');
    });
    document.getElementById('vs-pong-btn').addEventListener('click', () => {
        startGame('PONG_BATTLE');
    });
    document.getElementById('vs-bot-back-btn').addEventListener('click', () => {
        document.getElementById('vs-bot-overlay').classList.add('hidden');
        document.getElementById('menu-overlay').classList.remove('hidden');
    });
    document.getElementById('retry-btn').addEventListener('click', () => startGame(state.gameMode));
    document.getElementById('win-retry-btn').addEventListener('click', () => startGame(state.gameMode));
    document.getElementById('next-level-btn').addEventListener('click', () => handleShopNext());
    document.getElementById('menu-shop-btn').addEventListener('click', () => {
        document.getElementById('menu-overlay').classList.add('hidden');
        openShop('MENU');
    });
    document.getElementById('reset-endless-btn').addEventListener('click', () => {
        resetEndlessProgress();
    });
    document.getElementById('save-exit-btn').addEventListener('click', () => {
        exitGameWithSave();
    });
    
    // Wire up shop tabs
    document.getElementById('shop-tab-upgrades').addEventListener('click', () => switchShopTab('upgrades'));
    document.getElementById('shop-tab-skins').addEventListener('click', () => switchShopTab('skins'));
    const tabAch = document.getElementById('shop-tab-achievements');
    if (tabAch) tabAch.addEventListener('click', () => switchShopTab('achievements'));
    document.getElementById('skin-cat-paddle').addEventListener('click', () => switchSkinCategory('paddle'));
    document.getElementById('skin-cat-ball').addEventListener('click', () => switchSkinCategory('ball'));
    document.getElementById('skin-cat-brick').addEventListener('click', () => switchSkinCategory('brick'));
    document.getElementById('skin-cat-theme').addEventListener('click', () => switchSkinCategory('theme'));
    
    // Audio Toggle Action
    const audioBtn = document.getElementById('audio-toggle');
    audioBtn.addEventListener('click', () => {
        state.audioEnabled = !state.audioEnabled;
        audioBtn.querySelector('.btn-text').innerText = `AUDIO: ${state.audioEnabled ? 'ON' : 'OFF'}`;
        
        if (masterGain) {
            masterGain.gain.setValueAtTime(state.audioEnabled ? 0.35 : 0, audioCtx.currentTime);
        }
        if (state.audioEnabled && !audioCtx) {
            initAudio();
        }
    });
}

// Achievements System Configurations & Helpers
const ACHIEVEMENTS_CONFIG = [
    {
        id: 'NEURAL_OVERDRIVE',
        name: 'NEURAL_OVERDRIVE // 神经超载',
        desc: '在任意单局中使分数乘数达到 x5.0 或更高。',
        color: '#ff0055'
    },
    {
        id: 'GATEWAY_CRASHER',
        name: 'GATEWAY_CRASHER // 网关粉碎者',
        desc: '在故事或无尽模式中成功击毁企业安全防火墙 Boss 核心。',
        color: '#00ffff'
    },
    {
        id: 'BLACK_MARKET_PATRON',
        name: 'BLACK_MARKET_PATRON // 黑市顾客',
        desc: '在黑市商店中购买任意道具升级或外观皮肤。',
        color: '#ffb700'
    },
    {
        id: 'GLITCH_SURVIVOR',
        name: 'GLITCH_SURVIVOR // 故障幸存者',
        desc: '在被 Boss 的缩短病毒感染后顺利通关该层防火墙。',
        color: '#05ff50'
    },
    {
        id: 'IMMORTAL_RUNNER',
        name: 'IMMORTAL_RUNNER // 永生跑者',
        desc: '在不损失任何生命值的情况下，连续通过 3 个关卡。',
        color: '#b700ff'
    }
];

function initAchievements() {
    if (!storage.get('cyberbreak_achievements')) {
        const initial = {
            NEURAL_OVERDRIVE: false,
            GATEWAY_CRASHER: false,
            BLACK_MARKET_PATRON: false,
            GLITCH_SURVIVOR: false,
            IMMORTAL_RUNNER: false
        };
        storage.set('cyberbreak_achievements', JSON.stringify(initial));
    }
}

function unlockAchievement(id) {
    try {
        initAchievements();
        const data = JSON.parse(storage.get('cyberbreak_achievements')) || {};
        if (data[id] === false) {
            data[id] = true;
            storage.set('cyberbreak_achievements', JSON.stringify(data));
            
            const ach = ACHIEVEMENTS_CONFIG.find(a => a.id === id);
            const achName = ach ? ach.name.split(' // ')[1] : id;
            triggerGlitchAlert(`ACHIEVEMENT_UNLOCKED // 获得系统成就: [${achName}]`);
            playSound('powerup');
            addLogLine(`SYS_SUCCESS: ACHIEVEMENT UNLOCKED -> [${achName}]`);
        }
    } catch (e) {
        console.error("Failed to unlock achievement", e);
    }
}

function isAchievementUnlocked(id) {
    try {
        initAchievements();
        const data = JSON.parse(storage.get('cyberbreak_achievements')) || {};
        return !!data[id];
    } catch (e) {
        return false;
    }
}

function renderAchievementsList(container) {
    ACHIEVEMENTS_CONFIG.forEach(ach => {
        const card = document.createElement('div');
        card.className = 'shop-item-card achievement-card';
        
        const unlocked = isAchievementUnlocked(ach.id);
        if (unlocked) {
            card.classList.add('unlocked-achievement');
        } else {
            card.classList.add('locked-achievement');
        }
        
        const title = document.createElement('div');
        title.className = 'shop-item-title';
        title.style.color = unlocked ? ach.color : '#4a5468';
        title.innerText = ach.name;
        
        const desc = document.createElement('div');
        desc.className = 'shop-item-desc';
        desc.innerText = ach.desc;
        
        const statusBadge = document.createElement('div');
        statusBadge.className = 'achievement-status';
        if (unlocked) {
            statusBadge.innerHTML = `<span class="neon-green">UNLOCKED // 已解锁</span>`;
            card.style.borderColor = ach.color;
            card.style.boxShadow = `0 0 10px ${ach.color}33`;
        } else {
            statusBadge.innerHTML = `<span class="neon-magenta">LOCKED // 未解锁</span>`;
        }
        
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(statusBadge);
        container.appendChild(card);
    });
}

// --- CYBER CONTRACTS SYSTEM ---
const DAILY_CONTRACTS_CONFIG = [
    {
        id: 'CPU_COOL',
        name: 'CPU_COOL // 热阻平抑',
        desc: '以核心温度低于 45°C 的状态通关一次数据网关节点',
        target: 1,
        credits: 40
    },
    {
        id: 'SCORE_RUN',
        name: 'SCORE_RUN // 数据跃迁',
        desc: '单关结算的数据解密积分加成达到 150 CR 或以上',
        target: 1,
        credits: 50
    },
    {
        id: 'PADDLE_AIM',
        name: 'PADDLE_AIM // 完美弹射',
        desc: '在任意单一关卡中，利用挡板折射小球达 15 次',
        target: 15,
        credits: 60
    }
];

function initDailyContracts() {
    const saved = storage.get('cyberbreak_daily_contracts');
    if (saved) {
        try {
            state.contracts = JSON.parse(saved);
            if (state.contracts.length === DAILY_CONTRACTS_CONFIG.length) {
                renderContractsHUD();
                return;
            }
        } catch (e) {
            console.error("Failed to parse daily contracts", e);
        }
    }
    
    state.contracts = DAILY_CONTRACTS_CONFIG.map(c => ({
        id: c.id,
        name: c.name,
        desc: c.desc,
        progress: 0,
        target: c.target,
        completed: false,
        credits: c.credits
    }));
    saveDailyContracts();
    renderContractsHUD();
}

function saveDailyContracts() {
    storage.set('cyberbreak_daily_contracts', JSON.stringify(state.contracts));
}

function renderContractsHUD() {
    const listNode = document.getElementById('contracts-list');
    if (!listNode) return;
    listNode.innerHTML = '';
    
    state.contracts.forEach(c => {
        const item = document.createElement('li');
        item.style.paddingBottom = '4px';
        item.style.borderBottom = '1px dashed rgba(0, 255, 255, 0.15)';
        
        const nameDiv = document.createElement('div');
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = c.completed ? '#05ff50' : 'var(--neon-cyan)';
        nameDiv.innerText = `${c.name} ${c.completed ? ' [OK]' : ''}`;
        
        const descDiv = document.createElement('div');
        descDiv.style.fontSize = '9px';
        descDiv.style.color = 'rgba(255, 255, 255, 0.5)';
        descDiv.innerText = `${c.desc} (${c.progress}/${c.target}) [+${c.credits} CR]`;
        
        item.appendChild(nameDiv);
        item.appendChild(descDiv);
        listNode.appendChild(item);
    });
}

function updateContractProgress(id, value) {
    if (!state.contracts || state.contracts.length === 0) return;
    const contract = state.contracts.find(c => c.id === id);
    if (!contract || contract.completed) return;
    
    if (id === 'PADDLE_AIM') {
        contract.progress = Math.min(contract.target, value);
    } else {
        contract.progress = Math.min(contract.target, contract.progress + value);
    }
    
    if (contract.progress >= contract.target) {
        contract.completed = true;
        state.score += contract.credits;
        saveCredits();
        
        triggerGlitchAlert(`CONTRACT_COMPLETE // 契约达成: [${contract.name.split(' // ')[1]}] +${contract.credits} CR`);
        playSound('powerup');
        addLogLine(`SYS_SUCCESS: Contract completed -> ${contract.id}. Reward credited.`);
    }
    saveDailyContracts();
    renderContractsHUD();
}

// Leaderboard default data & helpers
const DEFAULT_LEADERBOARD = [
    { name: "CORP_SEC", score: 50000 },
    { name: "NET_RUNNER", score: 30000 },
    { name: "GLITCH_KID", score: 15000 },
    { name: "NEO_GUEST", score: 8000 },
    { name: "CYBER_PUNK", score: 3000 }
];

function loadLeaderboard() {
    let board = [];
    try {
        const cached = safeLocalStorage.getItem('cyberbreak_leaderboard');
        if (cached) {
            board = JSON.parse(cached);
        } else {
            board = DEFAULT_LEADERBOARD;
            safeLocalStorage.setItem('cyberbreak_leaderboard', JSON.stringify(board));
        }
    } catch (e) {
        board = DEFAULT_LEADERBOARD;
    }
    
    // Sort just in case
    board.sort((a, b) => b.score - a.score);
    
    // Render to list in menu
    const list = document.getElementById('leaderboard-list');
    if (list) {
        list.innerHTML = '';
        board.forEach((entry, idx) => {
            const li = document.createElement('li');
            const rank = String(idx + 1).padStart(2, '0');
            li.innerHTML = `
                <span>${rank}. ${entry.name}</span>
                <span class="score-num">${String(Math.floor(entry.score)).padStart(6, '0')}</span>
            `;
            list.appendChild(li);
        });
    }
}

function checkAndAddLeaderboard(scoreVal) {
    let board = [];
    try {
        const cached = safeLocalStorage.getItem('cyberbreak_leaderboard');
        if (cached) {
            board = JSON.parse(cached);
        } else {
            board = DEFAULT_LEADERBOARD;
        }
    } catch (e) {
        board = DEFAULT_LEADERBOARD;
    }
    
    board.sort((a, b) => b.score - a.score);
    const scoreInt = Math.floor(scoreVal);
    
    // Check if score qualifies
    const qualifies = board.length < 5 || scoreInt > board[board.length - 1].score;
    
    if (qualifies) {
        let rawName = prompt("ENTER NEURAL DECK SIGNATURE // 输入网络签名 (3个英文字符):", "RUN");
        if (rawName === null) return; // User cancelled
        
        let cleanName = rawName.trim().toUpperCase().slice(0, 8);
        if (!cleanName) cleanName = "PLAYER";
        
        board.push({ name: cleanName, score: scoreInt });
        board.sort((a, b) => b.score - a.score);
        
        // Keep top 5
        board = board.slice(0, 5);
        safeLocalStorage.setItem('cyberbreak_leaderboard', JSON.stringify(board));
        loadLeaderboard();
        addLogLine("Leaderboard record synced: " + cleanName + " - " + scoreInt);
    }
}

// Load cached high score
function loadHighScore() {
    const cached = storage.get('cyberbreak_highscore');
    if (cached) {
        state.highScore = parseInt(cached);
        document.getElementById('high-score-val').innerText = String(state.highScore).padStart(6, '0');
    }
    state.endlessMaxLevel = parseInt(storage.get('cyberbreak_endless_maxlevel')) || 1;
    loadLeaderboard();
}

// Load persistent score/credits
function loadCredits() {
    const cached = storage.get('cyberbreak_credits');
    if (cached) {
        state.score = parseFloat(cached) || 0;
    } else {
        state.score = 0;
    }
    
    state.multPurchases = parseInt(storage.get('cyberbreak_mult_purchases')) || 0;
    state.lifePurchases = parseInt(storage.get('cyberbreak_life_purchases')) || 0;
    state.coolerPurchases = parseInt(storage.get('cyberbreak_cooler_purchases')) || 0;
    
    try {
        const skinsCached = storage.get('cyberbreak_skins');
        if (skinsCached) {
            state.skins = JSON.parse(skinsCached);
            const categories = ['paddle', 'ball', 'brick', 'theme'];
            categories.forEach(cat => {
                if (!state.skins[cat]) {
                    state.skins[cat] = { owned: [true, false, false, false], active: 0 };
                }
            });
        } else {
            state.skins = {
                paddle: { owned: [true, false, false, false], active: 0 },
                ball: { owned: [true, false, false, false], active: 0 },
                brick: { owned: [true, false, false, false], active: 0 },
                theme: { owned: [true, false, false, false], active: 0 }
            };
        }
    } catch(e) {
        console.error("Failed to load skins config", e);
        state.skins = {
            paddle: { owned: [true, false, false, false], active: 0 },
            ball: { owned: [true, false, false, false], active: 0 },
            brick: { owned: [true, false, false, false], active: 0 },
            theme: { owned: [true, false, false, false], active: 0 }
        };
    }
}

// Save persistent score/credits
function saveCredits() {
    storage.set('cyberbreak_credits', state.score.toFixed(2));
    storage.set('cyberbreak_mult_purchases', state.multPurchases || 0);
    storage.set('cyberbreak_life_purchases', state.lifePurchases || 0);
    storage.set('cyberbreak_cooler_purchases', state.coolerPurchases || 0);
    storage.set('cyberbreak_skins', JSON.stringify(state.skins));
}

// Reset Endless progress, credits, and upgrades
function resetEndlessProgress() {
    if (confirm("CRITICAL WARNING: WIPE ALL GRID NODES, CREDITS & SYSTEM UPGRADES? // 确定执行系统冷启动，重置无尽关卡、积分 and all skins?")) {
        // Clear Endless saved run progress
        clearEndlessState();
        
        // Clear endless max level jump node progress
        storage.remove('cyberbreak_endless_maxlevel');
        state.endlessMaxLevel = 1;
        
        // Reset credits (score)
        state.score = 0;
        
        // Reset purchase counters
        state.multPurchases = 0;
        state.lifePurchases = 0;
        state.coolerPurchases = 0;
        
        // Reset skins
        state.skins = {
            paddle: { owned: [true, false, false, false], active: 0 },
            ball: { owned: [true, false, false, false], active: 0 },
            brick: { owned: [true, false, false, false], active: 0 },
            theme: { owned: [true, false, false, false], active: 0 }
        };
        
        // Save reset variables to local storage
        saveCredits();
        
        // Reset multipliers to baseline
        state.baseMultiplier = 1.0;
        state.multiplier = 1.0;
        
        // Reset active mods
        activeMods = {};
        
        // Reset UI HUD
        updateHUD();
        renderPowerupListHUD();
        
        // Refresh high score display
        loadHighScore();
        
        // Trigger sound
        playSound('lost');
        
        // Log console message
        addLogLine("SYSTEM HARD RESET: Endless nodes wiped.");
        addLogLine("Credits and upgrades initialized to factory default.");
        
        alert("SYSTEM RESET COMPLETED. // 系统重置完成。");
    }
}

// Exit Endless Mode or story mode with saving progress
function exitGameWithSave() {
    if (state.gameMode === 'ENDLESS') {
        saveEndlessState();
    }
    saveCredits();
    
    // Resume menu state
    state.mode = 'MENU';
    
    // Close gameplay screens, show menu
    document.getElementById('menu-overlay').classList.remove('hidden');
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');
    document.getElementById('shop-overlay').classList.add('hidden');
    
    addLogLine("Cerebral link paused. Neural stack saved.");
}

// Save Endless Mode state
function saveEndlessState() {
    if (state.gameMode !== 'ENDLESS' || state.mode !== 'PLAYING') return;
    
    const brickStates = bricks.map(b => ({
        c: b.c,
        r: b.r,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        type: b.type,
        hp: b.hp,
        maxHp: b.maxHp,
        color: b.color
    }));
    
    const saveData = {
        level: state.level,
        score: state.score,
        lives: state.lives,
        multiplier: state.multiplier,
        baseMultiplier: state.baseMultiplier || 1.0,
        activeMods: activeMods,
        shopPendingBalls: state.shopPendingBalls || 0,
        bricks: brickStates
    };
    
    storage.set('cyberbreak_endless_save', JSON.stringify(saveData));
    addLogLine("Endless Mode system state saved to memory.");
}

// Clear Endless Mode state
function clearEndlessState() {
    storage.remove('cyberbreak_endless_save');
}

// Load Endless Mode state
function loadEndlessState() {
    const raw = storage.get('cyberbreak_endless_save');
    if (!raw) return false;
    
    try {
        const saveData = JSON.parse(raw);
        state.level = saveData.level;
        state.score = saveData.score;
        state.lives = saveData.lives;
        state.multiplier = saveData.multiplier;
        state.baseMultiplier = saveData.baseMultiplier || 1.0;
        activeMods = saveData.activeMods || {};
        state.shopPendingBalls = saveData.shopPendingBalls || 0;
        
        // Rebuild bricks
        bricks = (saveData.bricks || []).map(bData => createBrickObject(bData));
        
        // Rebuild paddle configuration
        paddle.targetWidth = (activeMods['WIDE'] ? 180 : 120) * (1 + getPaddleSkinBonus());
        paddle.width = paddle.targetWidth;
        paddle.color = '#0044ff';
        
        // Reset ball physics array (also spawns balls based on saved pending balls/state)
        resetBalls();
        
        // Refresh sidebar
        renderPowerupListHUD();
        
        addLogLine(`Endless Mode connection restored. Layer ${state.level} active.`);
        return true;
    } catch(e) {
        console.error("Failed to load Endless save state", e);
        return false;
    }
}

// Factory to recreate Brick objects with all operations attached
function createBrickObject(bData) {
    return constructBrick(bData.c, bData.r, bData.type, bData.hp, bData.maxHp, bData.color, bData.x, bData.y, bData.width, bData.height);
}

// --- HACKER SHELL CMD INTERPRETER ---
function executeTerminalCommand(cmdStr) {
    const parts = cmdStr.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    
    addLogLine(`> ${cmdStr}`);
    
    switch (command) {
        case '/give_credits': {
            const val = parseFloat(parts[1]) || 100;
            increaseScore(val);
            if (state.gameMode !== 'SCORE_BATTLE' && state.gameMode !== 'PONG_BATTLE') {
                saveCredits();
            }
            triggerGlitchAlert(`INJECT_CREDITS // 注入积分: +${val} CR`);
            playSound('powerup');
            addLogLine(`SYS_ALERT: Credits override applied. Current: ${state.score} CR.`);
            break;
        }
        case '/slow_motion': {
            activeMods['SLOW'] = 400;
            triggerGlitchAlert("TIME_DILATION_INJECTED // 强制注入时间流速减缓");
            playSound('powerup');
            addLogLine("SYS_ALERT: Time dilation injector activated (400 frames).");
            break;
        }
        case '/inject_shield': {
            activeMods['SHIELD'] = 1;
            state.diagnostics.shieldActive = true;
            triggerGlitchAlert("NET_SHIELD_INJECTED // 强制注入安全网盾");
            playSound('powerup');
            addLogLine("SYS_ALERT: NET_SHIELD forced into kernel runtime.");
            break;
        }
        case '/unlock_all': {
            state.skins.paddle.owned = [true, true, true, true];
            state.skins.ball.owned = [true, true, true, true];
            state.skins.brick.owned = [true, true, true, true];
            state.skins.theme.owned = [true, true, true, true];
            saveCredits();
            
            // Unlock all achievements
            ACHIEVEMENTS_CONFIG.forEach(ach => {
                unlockAchievement(ach.id);
            });
            
            triggerGlitchAlert("SYS_UNLOCKED // 所有成就与皮肤已解锁");
            playSound('powerup');
            addLogLine("SYS_ALERT: Fully unlocked skins database & achievements.");
            break;
        }
        case '/bypass_level': {
            triggerGlitchAlert("BYPASS_LEVEL // 绕过当前关卡安全协议");
            playSound('powerup');
            addLogLine("SYS_ALERT: Initiated level override. Safety filters bypassed.");
            handleLevelComplete();
            break;
        }
        default:
            triggerGlitchAlert("CMD_ERR // 无效的代码指令");
            playSound('lost');
            addLogLine(`SYS_ERR: Command '${command}' unrecognized by shell kernel.`);
            break;
    }
}

let visualizerCanvas, visualizerCtx;
function drawAudioVisualizer() {
    if (!visualizerCanvas) {
        visualizerCanvas = document.getElementById('visualizer-canvas');
        if (visualizerCanvas) visualizerCtx = visualizerCanvas.getContext('2d');
    }
    if (!visualizerCanvas || !visualizerCtx) return;
    
    const w = visualizerCanvas.width;
    const h = visualizerCanvas.height;
    
    // Clear visualizer background
    visualizerCtx.fillStyle = 'rgba(5, 5, 10, 0.45)';
    visualizerCtx.fillRect(0, 0, w, h);
    
    if (analyser && audioCtx && state.audioEnabled) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        const barWidth = (w / bufferLength) * 1.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * h * 0.95;
            
            // Neon cyan gradient
            const grad = visualizerCtx.createLinearGradient(0, h, 0, h - barHeight);
            grad.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
            grad.addColorStop(1, 'rgba(0, 255, 255, 0.8)');
            
            visualizerCtx.fillStyle = grad;
            visualizerCtx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
            
            // Top point glow
            if (barHeight > 3) {
                visualizerCtx.fillStyle = '#00ffff';
                visualizerCtx.fillRect(x, h - barHeight - 1, barWidth - 1, 1);
            }
            
            x += barWidth;
        }
    } else {
        // Flatline idle line
        visualizerCtx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        visualizerCtx.beginPath();
        visualizerCtx.moveTo(0, h / 2);
        visualizerCtx.lineTo(w, h / 2);
        visualizerCtx.stroke();
    }
}

// Game Loop standard requestAnimationFrame
let lastTime = 0;
function gameLoop(timestamp) {
    if (state.mode === 'PLAYING') {
        updatePhysics();
    }
    
    draw();
    updateHUD();
    drawAudioVisualizer();
    
    requestAnimationFrame(gameLoop);
}

// Launch application on window load
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    setupInputListeners();
    initAccountSystem();
    initEntities();
    
    // Save credits on page exit if playing
    window.addEventListener('beforeunload', () => {
        if (state.gameMode === 'ENDLESS' && state.mode === 'PLAYING') {
            saveEndlessState();
        }
        saveCredits();
    });
    
    // Start game rendering loop
    requestAnimationFrame(gameLoop);
});
