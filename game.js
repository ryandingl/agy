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
    currentShopTab: 'upgrades',
    currentSkinCategory: 'paddle',
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
        }
    }
};

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
let balls = [];
let bricks = [];
let powerups = [];
let particles = [];
let lasers = [];

// Audio context & music nodes
let audioCtx = null;
let musicInterval = null;
let musicStep = 0;
let masterGain = null;

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
    SLOW: { label: 'TIME_DILATION', color: '#aa00ff', desc: '球速减慢' }
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
        masterGain.connect(audioCtx.destination);
        
        // Start background music loop
        startBgMusic();
        addLogLine("Audio engine initialized successfully.");
    } catch (e) {
        console.error("Failed to initialize Web Audio API", e);
    }
}

// Procedural background retro-synthwave bass loop
function startBgMusic() {
    if (musicInterval) clearInterval(musicInterval);
    
    const bpm = 115;
    const interval = (60 / bpm) / 2 * 1000; // Eighth notes
    
    // Bass notes sequence (Hz values for E1, G1, A1, B1, D2 etc.)
    const bassline = [
        82.41, 82.41, 82.41, 98.00,  // E2, E2, E2, G2
        110.00, 110.00, 98.00, 73.42, // A2, A2, G2, D2
        82.41, 82.41, 82.41, 123.47, // E2, E2, E2, B2
        110.00, 98.00, 73.42, 65.41   // A2, G2, D2, C2
    ];

    musicInterval = setInterval(() => {
        if (!audioCtx || state.mode === 'MENU' || !state.audioEnabled) return;
        
        const now = audioCtx.currentTime;
        const freq = bassline[musicStep % bassline.length];
        
        // Base synth wave (sawtooth for cyber grit)
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        
        // Apply low pass filter for that classic dark retro vibe
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.Q.setValueAtTime(4, now);
        
        // Subtle envelope
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.4);

        // Hi-hat simulation on even beats
        if (musicStep % 2 === 0) {
            playSynthHat(now);
        }
        
        musicStep++;
    }, interval);
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
            // Deep explosion sound
            const oscE = audioCtx.createOscillator();
            const gainE = audioCtx.createGain();
            oscE.type = 'sawtooth';
            oscE.frequency.setValueAtTime(100, now);
            oscE.frequency.exponentialRampToValueAtTime(30, now + 0.25);
            gainE.gain.setValueAtTime(0.3, now);
            gainE.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            
            // Low-pass filter to make it beefy
            const lp = audioCtx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.setValueAtTime(180, now);
            
            oscE.connect(lp);
            lp.connect(gainE);
            gainE.connect(masterGain);
            oscE.start(now);
            oscE.stop(now + 0.3);
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
    document.getElementById('score-val').innerText = String(Math.floor(state.score)).padStart(6, '0');
    document.getElementById('mult-val').innerText = `x${state.multiplier.toFixed(1)}`;
    document.getElementById('level-val').innerText = String(state.level).padStart(2, '0');
    
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
    for (let i = 0; i < 3; i++) {
        const node = document.createElement('div');
        node.className = `life-node ${i >= state.lives ? 'lost' : ''}`;
        livesContainer.appendChild(node);
    }
    
    // Diagnostic elements
    const activeBall = balls[0];
    const speedText = activeBall ? Math.hypot(activeBall.vx, activeBall.vy).toFixed(1) : '0';
    document.getElementById('diag-speed').innerText = activeBall ? `${speedText} px/f` : 'N/A';
    document.getElementById('diag-shield').innerText = activeMods['SHIELD'] ? 'ACTIVE (100%)' : 'INACTIVE';
    document.getElementById('diag-laser').innerText = activeMods['LASER'] ? `${Math.ceil(activeMods['LASER'] / 10)}%` : '0%';
    
    // Update core temp slightly dynamically based on score & active entities
    const particlesLoad = particles.length;
    const calcTemp = 37 + (state.multiplier * 3) + (particlesLoad * 0.1);
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
    let speed = 6;
    if (activeMods['SLOW'] > 0) {
        speed *= 0.6;
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
            
            // Draw ball
            skin.draw(this, c);
        }
    });
}

function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        const speed = Math.random() * 5 + 1;
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            vx: speed * Math.cos(angle),
            vy: speed * Math.sin(angle),
            size: Math.random() * 4 + 1.5,
            color: color,
            alpha: 1,
            life: 1,
            maxLife: Math.random() * 25 + 15,
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.95; // Friction
                this.vy *= 0.95;
                this.life++;
                this.alpha = 1 - (this.life / this.maxLife);
            },
            draw() {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 5;
                ctx.shadowColor = this.color;
                ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
                ctx.restore();
            }
        });
    }
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

// Generate level layout
function generateBricks() {
    bricks = [];
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
            }
            
            bricks.push({
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
                    this.hp -= damage;
                    if (this.hp <= 0) {
                        this.destroy();
                        return true; // Destroyed
                    } else {
                        // Play normal deflection beep
                        if (this.type === 2) playSound('hit_magenta');
                        if (this.type === 3) playSound('hit_yellow');
                        
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
                    
                    state.score += baseVal * state.multiplier;
                    state.multiplier += 0.1;
                    
                    // Explosion particles matching color
                    spawnParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 12);
                    
                    // Trigger sound
                    if (this.type === 4) {
                        playSound('hit_red');
                        triggerScreenShake(8);
                        // Explode neighboring bricks
                        detonateExplosive(this);
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
            });
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

function dropPowerup(x, y) {
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
    }
    
    renderPowerupListHUD();
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
            const maxVal = k === 'LASER' ? 400 : (k === 'WIDE' ? 500 : 350);
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

// --- CORE PHYSICS LOOP & COLLISIONS ---

function updatePhysics() {
    // 1. Move Paddle
    let targetX = mouseX - paddle.width / 2;
    // Keyboard adjustments
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        targetX = paddle.x - paddle.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        targetX = paddle.x + paddle.speed;
    }
    
    // Clamp to border
    paddle.x = Math.max(0, Math.min(CANVAS_WIDTH - paddle.width, targetX));
    
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
                }
                addLogLine(`SYSTEM ALERT: MOD EXPIRED - ${POWERUP_TYPES[m].label}`);
                modsChanged = true;
            }
        }
    }
    if (modsChanged) renderPowerupListHUD();

    // 3. Move & Update Balls
    for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        b.update();
        
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
                
                // Keep same or slightly speed up ball speed
                const currentSpeed = Math.hypot(b.vx, b.vy);
                const newSpeed = Math.min(12, currentSpeed * 1.02); // slight accel
                
                b.vx = newSpeed * Math.sin(newAngle);
                b.vy = -newSpeed * Math.cos(newAngle);
                
                playSound('bounce');
                triggerScreenShake(3);
                
                // Break combo multiplier slightly or keep it rolling
                state.multiplier = Math.max(state.baseMultiplier || 1.0, state.multiplier - 0.2);
            }
        }
        
        // Check fall off bottom
        if (b.y - b.radius > CANVAS_HEIGHT) {
            // Check if floor shield prevents fall
            if (activeMods['SHIELD']) {
                b.y = CANVAS_HEIGHT - 25;
                b.vy = -Math.abs(b.vy);
                delete activeMods['SHIELD'];
                state.diagnostics.shieldActive = false;
                playSound('bounce');
                triggerScreenShake(12);
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
    
    // Check Level Complete Victory Conditions
    const remainingBricks = bricks.filter(b => b.hp > 0);
    if (remainingBricks.length === 0) {
        handleLevelComplete();
    }
}

// --- STATE ACTIONS ---

function handleLifeLost() {
    state.lives--;
    playSound('lost');
    triggerScreenShake(15);
    addLogLine(`NEURAL PACKET DROP. LIVES REMAINING: ${state.lives}`);
    
    if (state.lives <= 0) {
        gameOver();
    } else {
        resetBalls();
    }
}

function gameOver() {
    state.mode = 'GAMEOVER';
    
    // Clear Endless save state since game is over
    if (state.gameMode === 'ENDLESS') {
        clearEndlessState();
    }
    
    // Save high score
    const finalScoreInt = Math.floor(state.score);
    if (finalScoreInt > state.highScore) {
        state.highScore = finalScoreInt;
        localStorage.setItem('cyberbreak_highscore', state.highScore);
    }
    
    // Save persistent credits
    saveCredits();
    
    // DOM overlay switch
    document.getElementById('final-score').innerText = finalScoreInt;
    document.getElementById('final-level').innerText = state.level;
    document.getElementById('game-over-overlay').classList.remove('hidden');
    addLogLine("CRITICAL_ERR: CONNECTION TERMINATED. LINK LOST.");
}

function handleLevelComplete() {
    state.level++;
    
    // Check if player cleared all levels (Story mode only)
    if (state.gameMode === 'STORY') {
        const totalPredefined = LEVEL_LAYOUTS.length;
        if (state.level > totalPredefined) {
            gameVictory();
            return;
        }
    }
    
    playSound('powerup');
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
        desc: '修复系统，增加 1 次生命值 (上限 3)',
        get price() {
            return 25 + (state.lifePurchases || 0) * 5;
        },
        color: '#0044ff',
        buy() {
            state.lives = Math.min(3, state.lives + 1);
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
    }
];

function openShop(origin = 'GAME') {
    state.mode = 'SHOP';
    state.shopOrigin = origin; // 'GAME' or 'MENU'
    
    // Reset shop tab to upgrades initially
    state.currentShopTab = 'upgrades';
    const tabUpgrades = document.getElementById('shop-tab-upgrades');
    const tabSkins = document.getElementById('shop-tab-skins');
    const skinCats = document.getElementById('skin-cats');
    if (tabUpgrades) tabUpgrades.classList.add('active');
    if (tabSkins) tabSkins.classList.remove('active');
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
            if (item.id === 'LIFE' && state.lives >= 3) {
                canBuy = false;
            }
            
            if (!canBuy) {
                buyBtn.classList.add('disabled');
            }
            
            let btnText = `BUY // ${item.price} CR`;
            if (item.id === 'LIFE' && state.lives >= 3) {
                btnText = 'MAX LIVES';
            }
            
            buyBtn.innerHTML = `
                <span class="btn-slice"></span>
                <span class="btn-text">${btnText}</span>
            `;
            
            buyBtn.addEventListener('click', () => {
                if (Math.floor(state.score) >= item.price) {
                    if (item.id === 'LIFE' && state.lives >= 3) return;
                    
                    state.score -= item.price;
                    item.buy();
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
    } else {
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
                        playSound('powerup');
                        saveCredits();
                        
                        // Apply skin immediately to game elements
                        if (category === 'paddle') {
                            paddle.targetWidth = (activeMods['WIDE'] ? 180 : 120) * (1 + getPaddleSkinBonus());
                        } else if (category === 'ball') {
                            applyBallSkin();
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
    }
}

function switchShopTab(tab) {
    state.currentShopTab = tab;
    
    const tabUpgrades = document.getElementById('shop-tab-upgrades');
    const tabSkins = document.getElementById('shop-tab-skins');
    const skinCats = document.getElementById('skin-cats');
    
    if (tab === 'upgrades') {
        if (tabUpgrades) tabUpgrades.classList.add('active');
        if (tabSkins) tabSkins.classList.remove('active');
        if (skinCats) skinCats.classList.add('hidden');
    } else {
        if (tabUpgrades) tabUpgrades.classList.remove('active');
        if (tabSkins) tabSkins.classList.add('active');
        if (skinCats) skinCats.classList.remove('hidden');
        switchSkinCategory(state.currentSkinCategory || 'paddle');
    }
    
    renderShopItems();
}

function switchSkinCategory(cat) {
    state.currentSkinCategory = cat;
    
    ['paddle', 'ball', 'brick'].forEach(c => {
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
    state.mode = 'VICTORY';
    
    const finalScoreInt = Math.floor(state.score);
    if (finalScoreInt > state.highScore) {
        state.highScore = finalScoreInt;
        localStorage.setItem('cyberbreak_highscore', state.highScore);
    }
    
    // Save persistent credits
    saveCredits();
    
    document.getElementById('victory-score').innerText = finalScoreInt;
    document.getElementById('victory-overlay').classList.remove('hidden');
    addLogLine("SYS_SUCCESS: DATA EXTRACTED. CORP DEFEATED.");
}

function startGame(chosenMode = 'STORY') {
    initAudio();
    state.gameMode = chosenMode;
    state.mode = 'PLAYING';
    
    // Close overlay UI
    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');
    document.getElementById('shop-overlay').classList.add('hidden');
    
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
    
    // Otherwise initialize a fresh game
    loadCredits();
    state.baseMultiplier = 1.0 + (state.multPurchases || 0) * 0.2;
    state.multiplier = state.baseMultiplier;
    state.level = 1;
    state.lives = 3;
    state.shopPendingBalls = 0;
    activeMods = {};
    
    // Update Mode indicator text in DOM
    const modeValNode = document.getElementById('mode-val');
    if (modeValNode) {
        modeValNode.innerText = chosenMode;
        if (chosenMode === 'ENDLESS') {
            modeValNode.className = 'neon-yellow font-orbitron';
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
    
    // Draw neon grid floor background
    drawGridBackground();
    
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
    
    // Draw particles
    particles.forEach(p => p.draw());
    
    // Draw paddle
    paddle.draw();
    
    // Draw balls
    balls.forEach(b => b.draw());
    
    ctx.restore();
}

// Cyberpunk synthwave background grid pattern
function drawGridBackground() {
    ctx.save();
    ctx.strokeStyle = 'rgba(26, 28, 53, 0.4)';
    ctx.lineWidth = 1;
    
    // Draw perspective vertical lines
    const cols = 20;
    for (let i = 0; i <= cols; i++) {
        const xPos = (i / cols) * CANVAS_WIDTH;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, CANVAS_HEIGHT);
        ctx.stroke();
    }
    
    // Draw horizontal lines
    const rows = 15;
    for (let i = 0; i <= rows; i++) {
        const yPos = (i / rows) * CANVAS_HEIGHT;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(CANVAS_WIDTH, yPos);
        ctx.stroke();
    }
    ctx.restore();
}

// --- EVENT HANDLERS & INITIALIZATION ---

function setupInputListeners() {
    // Keyboard inputs
    window.addEventListener('keydown', e => {
        keys[e.key] = true;
        
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
        keys[e.key] = false;
    });
    
    // Mouse movement within Canvas
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        // Scale mouse client coordinates to match logical canvas width
        const clientXInCanvas = e.clientX - rect.left;
        mouseX = (clientXInCanvas / rect.width) * CANVAS_WIDTH;
    });
    
    // Mobile / Touch controls
    const handleTouch = e => {
        if (e.touches.length > 0) {
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
    document.getElementById('start-story-btn').addEventListener('click', () => startGame('STORY'));
    document.getElementById('start-endless-btn').addEventListener('click', () => startGame('ENDLESS'));
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
    document.getElementById('skin-cat-paddle').addEventListener('click', () => switchSkinCategory('paddle'));
    document.getElementById('skin-cat-ball').addEventListener('click', () => switchSkinCategory('ball'));
    document.getElementById('skin-cat-brick').addEventListener('click', () => switchSkinCategory('brick'));
    
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

// Load cached high score
function loadHighScore() {
    const cached = localStorage.getItem('cyberbreak_highscore');
    if (cached) {
        state.highScore = parseInt(cached);
        document.getElementById('high-score-val').innerText = String(state.highScore).padStart(6, '0');
    }
}

// Load persistent score/credits
function loadCredits() {
    const cached = localStorage.getItem('cyberbreak_credits');
    if (cached) {
        state.score = parseFloat(cached) || 0;
    } else {
        state.score = 0;
    }
    
    state.multPurchases = parseInt(localStorage.getItem('cyberbreak_mult_purchases')) || 0;
    state.lifePurchases = parseInt(localStorage.getItem('cyberbreak_life_purchases')) || 0;
    
    try {
        const skinsCached = localStorage.getItem('cyberbreak_skins');
        if (skinsCached) {
            state.skins = JSON.parse(skinsCached);
        } else {
            state.skins = {
                paddle: { owned: [true, false, false, false], active: 0 },
                ball: { owned: [true, false, false, false], active: 0 },
                brick: { owned: [true, false, false, false], active: 0 }
            };
        }
    } catch(e) {
        console.error("Failed to load skins config", e);
        state.skins = {
            paddle: { owned: [true, false, false, false], active: 0 },
            ball: { owned: [true, false, false, false], active: 0 },
            brick: { owned: [true, false, false, false], active: 0 }
        };
    }
}

// Save persistent score/credits
function saveCredits() {
    localStorage.setItem('cyberbreak_credits', state.score.toFixed(2));
    localStorage.setItem('cyberbreak_mult_purchases', state.multPurchases || 0);
    localStorage.setItem('cyberbreak_life_purchases', state.lifePurchases || 0);
    localStorage.setItem('cyberbreak_skins', JSON.stringify(state.skins));
}

// Reset Endless progress, credits, and upgrades
function resetEndlessProgress() {
    if (confirm("CRITICAL WARNING: WIPE ALL GRID NODES, CREDITS & SYSTEM UPGRADES? // 确定执行系统冷启动，重置无尽关卡、积分 and all skins?")) {
        // Clear Endless saved run progress
        clearEndlessState();
        
        // Reset credits (score)
        state.score = 0;
        
        // Reset purchase counters
        state.multPurchases = 0;
        state.lifePurchases = 0;
        
        // Reset skins
        state.skins = {
            paddle: { owned: [true, false, false, false], active: 0 },
            ball: { owned: [true, false, false, false], active: 0 },
            brick: { owned: [true, false, false, false], active: 0 }
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
    
    localStorage.setItem('cyberbreak_endless_save', JSON.stringify(saveData));
    addLogLine("Endless Mode system state saved to memory.");
}

// Clear Endless Mode state
function clearEndlessState() {
    localStorage.removeItem('cyberbreak_endless_save');
}

// Load Endless Mode state
function loadEndlessState() {
    const raw = localStorage.getItem('cyberbreak_endless_save');
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
    return {
        c: bData.c,
        r: bData.r,
        x: bData.x,
        y: bData.y,
        width: bData.width || BRICK_WIDTH,
        height: bData.height || BRICK_HEIGHT,
        type: bData.type,
        hp: bData.hp,
        maxHp: bData.maxHp,
        color: bData.color,
        hit(damage = 1) {
            this.hp -= damage;
            if (this.hp <= 0) {
                this.destroy();
                return true;
            } else {
                if (this.type === 2) playSound('hit_magenta');
                if (this.type === 3) playSound('hit_yellow');
                spawnParticles(this.x + this.width/2, this.y + this.height/2, this.color, 4);
                return false;
            }
        },
        destroy() {
            let baseVal = 1.0;
            if (this.type === 2) baseVal = 2.0;
            if (this.type === 3) baseVal = 4.0;
            if (this.type === 4) baseVal = 2.5;
            
            state.score += baseVal * state.multiplier;
            state.multiplier += 0.1;
            
            spawnParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 12);
            
            if (this.type === 4) {
                playSound('hit_red');
                triggerScreenShake(8);
                detonateExplosive(this);
            } else {
                const hitSnd = this.type === 2 ? 'hit_magenta' : (this.type === 3 ? 'hit_yellow' : 'hit_cyan');
                playSound(hitSnd);
                triggerScreenShake(3);
            }
            
            if (Math.random() < 0.05) {
                dropPowerup(this.x + this.width/2, this.y + this.height);
            }
        },
        draw() {
            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            const alpha = this.hp / this.maxHp;
            ctx.fillStyle = `rgba(${this.hexToRgb(this.color)}, ${alpha * 0.7})`;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y + 2);
            ctx.lineTo(this.x + this.width - 5, this.y + this.height - 2);
            ctx.stroke();
            ctx.restore();
        },
        hexToRgb(hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        }
    };
}

// Game Loop standard requestAnimationFrame
let lastTime = 0;
function gameLoop(timestamp) {
    if (state.mode === 'PLAYING') {
        updatePhysics();
    }
    
    draw();
    updateHUD();
    
    requestAnimationFrame(gameLoop);
}

// Launch application on window load
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    setupInputListeners();
    loadHighScore();
    loadCredits(); // Load persistent credits on startup
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
