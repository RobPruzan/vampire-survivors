'use client';

import { useEffect, useRef, useState } from 'react';

interface Vector2 {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

interface DamageNumber {
  x: number;
  y: number;
  value: number;
  life: number;
  vx: number;
  vy: number;
  scale: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  size: number;
  type: 'basic' | 'fast' | 'tank' | 'boss' | 'swarm' | 'elite' | 'shooter' | 'splitter';
  flashTimer: number;
  hitScale: number;
  rotation: number;
  shootTimer?: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  size: number;
  color: string;
  trail: Vector2[];
  piercing?: number;
  lifetime?: number;
  weaponType?: string;
  angle?: number;
  orbitDistance?: number;
  owner?: 'player' | 'enemy';
}

interface XPOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  magnetized: boolean;
  pulsePhase: number;
}

interface Weapon {
  name: string;
  level: number;
  damage: number;
  cooldown: number;
  lastFired: number;
  projectileCount: number;
  color: string;
  type: 'projectile' | 'orbit' | 'area';
}

interface Player {
  x: number;
  y: number;
  size: number;
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  xpToNext: number;
  flashTimer: number;
  rotation: number;
}

export default function VampireGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'levelup' | 'dead'>('menu');
  const gameStateRef = useRef(gameState);
  const [upgrades, setUpgrades] = useState<string[]>([]);
  const gameRef = useRef<any>(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Only initialize game once
    if (!gameRef.current) {
      const game = {
      player: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: 20,
        hp: 100,
        maxHp: 100,
        xp: 0,
        level: 1,
        xpToNext: 10,
        flashTimer: 0,
        rotation: 0,
      } as Player,
      enemies: [] as Enemy[],
      projectiles: [] as Projectile[],
      particles: [] as Particle[],
      damageNumbers: [] as DamageNumber[],
      xpOrbs: [] as XPOrb[],
      weapons: [
        {
          name: 'Magic Bolt',
          level: 1,
          damage: 10,
          cooldown: 500,
          lastFired: 0,
          projectileCount: 1,
          color: '#00ffff',
          type: 'projectile' as const,
        },
      ] as Weapon[],
      camera: { shake: 0, offsetX: 0, offsetY: 0, x: 0, y: 0 },
      time: 0,
      keys: new Set<string>(),
      mousePos: { x: 0, y: 0 },
      stats: { kills: 0, time: 0 },
    };

    gameRef.current = game;
  }

  const game = gameRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      game.keys.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      game.keys.delete(e.key.toLowerCase());
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      game.mousePos.x = e.clientX - rect.left;
      game.mousePos.y = e.clientY - rect.top;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    const createParticles = (x: number, y: number, count: number, color: string) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        game.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          size: 2 + Math.random() * 4,
          color,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        });
      }
    };

    const createExplosion = (x: number, y: number, size: number, color: string) => {
      const count = Math.floor(size * 2);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 3 + Math.random() * 6;
        game.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          size: 3 + Math.random() * 5,
          color,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
        });
      }
    };

    const addDamageNumber = (x: number, y: number, value: number) => {
      game.damageNumbers.push({
        x,
        y,
        value,
        life: 1,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 2,
        scale: 1,
      });
    };

    const shakeCamera = (amount: number) => {
      game.camera.shake = Math.max(game.camera.shake, amount);
    };

    const getEnemyColor = (type: string) => {
      switch (type) {
        case 'fast': return '#ffff00';
        case 'tank': return '#ff6600';
        case 'boss': return '#ff00ff';
        case 'swarm': return '#00ff00';
        case 'elite': return '#ff0066';
        case 'shooter': return '#0066ff';
        case 'splitter': return '#ff9900';
        default: return '#ff0000';
      }
    };

    const getEnemyXP = (type: string) => {
      switch (type) {
        case 'boss': return 50;
        case 'elite': return 15;
        case 'tank': return 5;
        case 'splitter': return 7;
        case 'shooter': return 4;
        case 'fast': return 2;
        case 'swarm': return 1;
        default: return 3;
      }
    };

    const spawnEnemy = () => {
      const side = Math.floor(Math.random() * 4);
      let x = 0,
        y = 0;

      // Spawn relative to player position for infinite world
      const spawnDistance = 600;
      switch (side) {
        case 0: // top
          x = game.player.x + (Math.random() - 0.5) * canvas.width;
          y = game.player.y - spawnDistance;
          break;
        case 1: // right
          x = game.player.x + spawnDistance;
          y = game.player.y + (Math.random() - 0.5) * canvas.height;
          break;
        case 2: // bottom
          x = game.player.x + (Math.random() - 0.5) * canvas.width;
          y = game.player.y + spawnDistance;
          break;
        case 3: // left
          x = game.player.x - spawnDistance;
          y = game.player.y + (Math.random() - 0.5) * canvas.height;
          break;
      }

      const rand = Math.random();
      let type: 'basic' | 'fast' | 'tank' | 'boss' | 'swarm' | 'elite' | 'shooter' | 'splitter' = 'basic';
      let hp = 30;
      let size = 15;

      if (game.time > 60000 && rand < 0.02) {
        type = 'boss';
        hp = 500;
        size = 40;
      } else if (rand < 0.1) {
        type = 'swarm';
        hp = 8;
        size = 8;
      } else if (rand < 0.2) {
        type = 'fast';
        hp = 15;
        size = 10;
      } else if (rand < 0.35) {
        type = 'tank';
        hp = 60;
        size = 20;
      } else if (rand < 0.45) {
        type = 'shooter';
        hp = 25;
        size = 14;
      } else if (rand < 0.55 && game.time > 30000) {
        type = 'elite';
        hp = 100;
        size = 18;
      } else if (rand < 0.65 && game.time > 20000) {
        type = 'splitter';
        hp = 40;
        size = 16;
      }

      game.enemies.push({
        x,
        y,
        vx: 0,
        vy: 0,
        hp,
        maxHp: hp,
        size,
        type,
        flashTimer: 0,
        hitScale: 1,
        rotation: 0,
        shootTimer: Math.random() * 3000,
      });
    };

    const update = (deltaTime: number) => {
      if (gameStateRef.current !== 'playing') return;

      game.time += deltaTime;

      const dx = (game.keys.has('d') || game.keys.has('arrowright') ? 1 : 0) - (game.keys.has('a') || game.keys.has('arrowleft') ? 1 : 0);
      const dy = (game.keys.has('s') || game.keys.has('arrowdown') ? 1 : 0) - (game.keys.has('w') || game.keys.has('arrowup') ? 1 : 0);

      const speed = 4;
      if (dx !== 0 || dy !== 0) {
        const mag = Math.sqrt(dx * dx + dy * dy);
        game.player.x += (dx / mag) * speed;
        game.player.y += (dy / mag) * speed;
        game.player.rotation = Math.atan2(dy, dx);
      }

      // No boundaries - infinite world!

      if (Math.random() < 0.02 * (1 + game.time / 60000)) {
        spawnEnemy();
      }

      for (const weapon of game.weapons) {
        if (game.time - weapon.lastFired > weapon.cooldown) {
          weapon.lastFired = game.time;

          if (weapon.type === 'projectile' && game.enemies.length > 0) {
            let targets = [...game.enemies]
              .sort((a, b) => {
                const distA = Math.hypot(a.x - game.player.x, a.y - game.player.y);
                const distB = Math.hypot(b.x - game.player.x, b.y - game.player.y);
                return distA - distB;
              })
              .slice(0, weapon.projectileCount);

            for (const target of targets) {
              const angle = Math.atan2(target.y - game.player.y, target.x - game.player.x);
              const speed = weapon.name === 'Fireball' ? 6 : weapon.name === 'Knife' ? 12 : 8;
              game.projectiles.push({
                x: game.player.x,
                y: game.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                damage: weapon.damage,
                size: weapon.name === 'Fireball' ? 10 : 6,
                color: weapon.color,
                trail: [],
                piercing: weapon.name === 'Knife' ? 3 : 0,
                weaponType: weapon.name,
                owner: 'player',
              });
            }
            playSound('shoot');
          } else if (weapon.type === 'orbit') {
            // Orbit weapons create projectiles that circle the player
            const existingOrbiters = game.projectiles.filter(p => p.weaponType === weapon.name);
            if (existingOrbiters.length < weapon.projectileCount) {
              const angle = (Math.PI * 2 * existingOrbiters.length) / weapon.projectileCount;
              game.projectiles.push({
                x: game.player.x,
                y: game.player.y,
                vx: 0,
                vy: 0,
                damage: weapon.damage,
                size: 8,
                color: weapon.color,
                trail: [],
                weaponType: weapon.name,
                angle,
                orbitDistance: 80,
                lifetime: 999999,
                owner: 'player',
              });
            }
          } else if (weapon.type === 'area') {
            // Area weapons damage all nearby enemies
            for (const enemy of game.enemies) {
              const dist = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
              if (dist < 100) {
                enemy.hp -= weapon.damage;
                enemy.flashTimer = 0.1;
                enemy.hitScale = 1.2;
                addDamageNumber(enemy.x, enemy.y - enemy.size, weapon.damage);
                createParticles(enemy.x, enemy.y, 3, weapon.color);
              }
            }
            playSound('hit');
          }
        }
      }

      for (let i = game.projectiles.length - 1; i >= 0; i--) {
        const proj = game.projectiles[i];

        // Handle orbiting projectiles
        if (proj.orbitDistance !== undefined && proj.angle !== undefined) {
          proj.angle += 0.05;
          proj.x = game.player.x + Math.cos(proj.angle) * proj.orbitDistance;
          proj.y = game.player.y + Math.sin(proj.angle) * proj.orbitDistance;
        } else {
          proj.x += proj.vx;
          proj.y += proj.vy;
        }

        proj.trail.push({ x: proj.x, y: proj.y });
        if (proj.trail.length > 5) proj.trail.shift();

        if (proj.lifetime !== undefined) {
          proj.lifetime -= deltaTime;
          if (proj.lifetime <= 0 && proj.orbitDistance === undefined) {
            game.projectiles.splice(i, 1);
            continue;
          }
        }

        // Remove projectiles that are too far from player
        const distFromPlayer = Math.hypot(proj.x - game.player.x, proj.y - game.player.y);
        if (distFromPlayer > 1500 && proj.orbitDistance === undefined) {
          game.projectiles.splice(i, 1);
          continue;
        }

        // Player projectiles hit enemies
        if (proj.owner === 'player') {
          let projectileRemoved = false;
          for (let j = game.enemies.length - 1; j >= 0; j--) {
            const enemy = game.enemies[j];
            const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
            if (dist < enemy.size + proj.size) {
              enemy.hp -= proj.damage;
              enemy.flashTimer = 0.1;
              enemy.hitScale = 1.3;
              addDamageNumber(enemy.x, enemy.y - enemy.size, proj.damage);
              createParticles(proj.x, proj.y, 5, proj.color);
              shakeCamera(2);
              playSound('hit');

              if (enemy.hp <= 0) {
                createExplosion(enemy.x, enemy.y, enemy.size, getEnemyColor(enemy.type));
                shakeCamera(enemy.type === 'boss' ? 20 : enemy.type === 'tank' ? 8 : 4);

                // Splitters spawn smaller enemies
                if (enemy.type === 'splitter') {
                  for (let k = 0; k < 3; k++) {
                    const angle = (Math.PI * 2 * k) / 3;
                    game.enemies.push({
                      x: enemy.x,
                      y: enemy.y,
                      vx: Math.cos(angle) * 2,
                      vy: Math.sin(angle) * 2,
                      hp: 10,
                      maxHp: 10,
                      size: 8,
                      type: 'swarm',
                      flashTimer: 0,
                      hitScale: 1,
                      rotation: 0,
                    });
                  }
                }

                const xpValue = getEnemyXP(enemy.type);
                game.xpOrbs.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 2,
                  vy: (Math.random() - 0.5) * 2,
                  value: xpValue,
                  magnetized: false,
                  pulsePhase: Math.random() * Math.PI * 2,
                });

                game.enemies.splice(j, 1);
                game.stats.kills++;
                playSound('kill');
              }

              // Handle piercing
              if (proj.piercing !== undefined && proj.piercing > 0) {
                proj.piercing--;
              } else if (proj.orbitDistance === undefined) {
                game.projectiles.splice(i, 1);
                projectileRemoved = true;
                break;
              }
            }
          }
        }
        // Enemy projectiles hit player
        else if (proj.owner === 'enemy') {
          const dist = Math.hypot(proj.x - game.player.x, proj.y - game.player.y);
          if (dist < game.player.size + proj.size) {
            game.player.hp -= proj.damage;
            game.player.flashTimer = 0.1;
            createParticles(proj.x, proj.y, 8, '#ff0000');
            shakeCamera(5);
            game.projectiles.splice(i, 1);
            if (game.player.hp <= 0) {
              setGameState('dead');
              playSound('death');
            }
          }
        }
      }

      for (let i = game.enemies.length - 1; i >= 0; i--) {
        const enemy = game.enemies[i];
        const dx = game.player.x - enemy.x;
        const dy = game.player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        let speed = 1.5;
        if (enemy.type === 'fast') speed = 3;
        if (enemy.type === 'tank') speed = 0.8;
        if (enemy.type === 'boss') speed = 1;
        if (enemy.type === 'swarm') speed = 2.5;
        if (enemy.type === 'elite') speed = 2;
        if (enemy.type === 'shooter') speed = 0.5;
        if (enemy.type === 'splitter') speed = 1.2;

        // Shooter keeps distance
        if (enemy.type === 'shooter' && dist < 300) {
          enemy.vx = -(dx / dist) * speed;
          enemy.vy = -(dy / dist) * speed;
        } else {
          enemy.vx = (dx / dist) * speed;
          enemy.vy = (dy / dist) * speed;
        }

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        enemy.rotation = Math.atan2(dy, dx);

        // Shooter fires projectiles
        if (enemy.type === 'shooter' && enemy.shootTimer !== undefined) {
          enemy.shootTimer -= deltaTime;
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = 2000 + Math.random() * 1000;
            const angle = Math.atan2(dy, dx);
            game.projectiles.push({
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(angle) * 5,
              vy: Math.sin(angle) * 5,
              damage: 10,
              size: 5,
              color: '#0066ff',
              trail: [],
              owner: 'enemy',
              lifetime: 3000,
            });
            playSound('shoot');
          }
        }

        enemy.flashTimer = Math.max(0, enemy.flashTimer - deltaTime / 1000);
        enemy.hitScale += (1 - enemy.hitScale) * 0.2;

        const playerDist = Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y);
        if (playerDist < enemy.size + game.player.size) {
          const damage = enemy.type === 'boss' ? 1 : enemy.type === 'elite' ? 0.7 : 0.5;
          game.player.hp -= damage;
          game.player.flashTimer = 0.1;
          if (game.player.hp <= 0) {
            setGameState('dead');
            playSound('death');
          }
        }
      }

      for (let i = game.xpOrbs.length - 1; i >= 0; i--) {
        const orb = game.xpOrbs[i];
        const dx = game.player.x - orb.x;
        const dy = game.player.y - orb.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 150 || orb.magnetized) {
          orb.magnetized = true;
          const speed = 8;
          orb.vx = (dx / dist) * speed;
          orb.vy = (dy / dist) * speed;
        } else {
          orb.vx *= 0.95;
          orb.vy *= 0.95;
        }

        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.pulsePhase += 0.1;

        if (dist < game.player.size + 8) {
          game.player.xp += orb.value;
          game.xpOrbs.splice(i, 1);
          createParticles(orb.x, orb.y, 8, '#00ff00');
          playSound('xp');

          if (game.player.xp >= game.player.xpToNext) {
            game.player.level++;
            game.player.xp -= game.player.xpToNext;
            game.player.xpToNext = Math.floor(game.player.xpToNext * 1.5);
            setGameState('levelup');
            generateUpgrades();
            playSound('levelup');
          }
        }
      }

      for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.rotation += p.rotationSpeed;
        p.life -= deltaTime / 1000;
        if (p.life <= 0) {
          game.particles.splice(i, 1);
        }
      }

      for (let i = game.damageNumbers.length - 1; i >= 0; i--) {
        const dn = game.damageNumbers[i];
        dn.x += dn.vx;
        dn.y += dn.vy;
        dn.vy += 0.1;
        dn.life -= deltaTime / 500;
        dn.scale = Math.min(1.5, dn.scale + 0.05);
        if (dn.life <= 0) {
          game.damageNumbers.splice(i, 1);
        }
      }

      game.camera.shake *= 0.9;
      if (game.camera.shake < 0.1) game.camera.shake = 0;
      game.camera.offsetX = (Math.random() - 0.5) * game.camera.shake;
      game.camera.offsetY = (Math.random() - 0.5) * game.camera.shake;

      // Smooth camera follow
      const lerpSpeed = 0.1;
      game.camera.x += (game.player.x - game.camera.x) * lerpSpeed;
      game.camera.y += (game.player.y - game.camera.y) * lerpSpeed;
    };

    const draw = () => {
      ctx.save();
      
      // Center camera on player
      ctx.translate(canvas.width / 2 - game.camera.x + game.camera.offsetX, canvas.height / 2 - game.camera.y + game.camera.offsetY);

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(game.camera.x - canvas.width, game.camera.y - canvas.height, canvas.width * 3, canvas.height * 3);

      // Infinite grid
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      const gridSize = 50;
      const startX = Math.floor((game.camera.x - canvas.width) / gridSize) * gridSize;
      const endX = Math.ceil((game.camera.x + canvas.width) / gridSize) * gridSize;
      const startY = Math.floor((game.camera.y - canvas.height) / gridSize) * gridSize;
      const endY = Math.ceil((game.camera.y + canvas.height) / gridSize) * gridSize;
      
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }

      for (const proj of game.projectiles) {
        if (proj.trail.length > 1) {
          ctx.strokeStyle = proj.color + '40';
          ctx.lineWidth = proj.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(proj.trail[0].x, proj.trail[0].y);
          for (let i = 1; i < proj.trail.length; i++) {
            ctx.lineTo(proj.trail[i].x, proj.trail[i].y);
          }
          ctx.stroke();
        }

        ctx.fillStyle = proj.color;
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (const enemy of game.enemies) {
        const scale = enemy.hitScale;
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);
        ctx.scale(scale, scale);

        const color = getEnemyColor(enemy.type);

        if (enemy.flashTimer > 0) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = color;
        }

        // Different shapes for different types
        ctx.beginPath();
        if (enemy.type === 'swarm') {
          ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
        } else if (enemy.type === 'shooter') {
          for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4 + Math.PI / 4;
            const x = Math.cos(angle) * enemy.size;
            const y = Math.sin(angle) * enemy.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else if (enemy.type === 'elite') {
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const radius = i % 2 === 0 ? enemy.size : enemy.size * 0.7;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else {
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const x = Math.cos(angle) * enemy.size;
            const y = Math.sin(angle) * enemy.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff40';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Health bar
        if (enemy.size > 10) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 10, enemy.size * 2, 4);
          ctx.fillStyle = '#00ff00';
          const hpWidth = (enemy.hp / enemy.maxHp) * enemy.size * 2;
          ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 10, hpWidth, 4);
        }
      }

      for (const orb of game.xpOrbs) {
        const pulse = 1 + Math.sin(orb.pulsePhase) * 0.2;
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10 * pulse;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, 6 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (const p of game.particles) {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(game.player.x, game.player.y);
      ctx.rotate(game.player.rotation);

      if (game.player.flashTimer > 0) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#00ffff';
      }

      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, game.player.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(game.player.size / 2, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      for (const dn of game.damageNumbers) {
        const alpha = dn.life;
        ctx.font = `bold ${16 * dn.scale}px monospace`;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.strokeText(Math.round(dn.value).toString(), dn.x, dn.y);
        ctx.fillText(Math.round(dn.value).toString(), dn.x, dn.y);
      }

      ctx.restore();

      // UI in screen space
      ctx.save();
      ctx.fillStyle = '#00000080';
      ctx.fillRect(10, 10, 250, 120);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 250, 120);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`Level ${game.player.level}`, 20, 35);
      ctx.fillText(`HP: ${Math.max(0, Math.floor(game.player.hp))}/${game.player.maxHp}`, 20, 55);
      ctx.fillText(`XP: ${Math.floor(game.player.xp)}/${game.player.xpToNext}`, 20, 75);
      ctx.fillText(`Kills: ${game.stats.kills}`, 20, 95);
      ctx.fillText(`Time: ${Math.floor(game.time / 1000)}s`, 20, 115);

      ctx.fillStyle = '#ffffff40';
      ctx.fillRect(20, 125, 230, 10);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(20, 125, 230 * (game.player.xp / game.player.xpToNext), 10);
      ctx.restore();
    };

    let lastTime = performance.now();
    let animationId: number;
    
    const gameLoop = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      update(deltaTime);
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playSound = (type: string) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch (type) {
        case 'shoot':
          oscillator.frequency.value = 400;
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          break;
        case 'hit':
          oscillator.frequency.value = 200;
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          break;
        case 'kill':
          oscillator.frequency.value = 600;
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          break;
        case 'xp':
          oscillator.frequency.value = 800;
          gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          break;
        case 'levelup':
          oscillator.frequency.value = 1000;
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          break;
        case 'death':
          oscillator.frequency.value = 100;
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
          break;
      }

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1);
    };

    const generateUpgrades = () => {
      const possible = [
        'Increase Damage',
        'Fire Rate Up',
        'Extra Projectile',
        'Max HP Up',
        'Heal',
        'New Weapon: Fireball',
        'New Weapon: Knife',
        'New Weapon: Axe',
        'New Weapon: Garlic',
        'Speed Boost',
      ];
      const selected = [];
      for (let i = 0; i < 3; i++) {
        const idx = Math.floor(Math.random() * possible.length);
        selected.push(possible[idx]);
      }
      setUpgrades(selected);
    };

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const startGame = () => {
    setGameState('playing');
  };

  const selectUpgrade = (upgrade: string) => {
    const game = gameRef.current;
    if (!game) return;

    switch (upgrade) {
      case 'Increase Damage':
        game.weapons.forEach((w: Weapon) => (w.damage += 5));
        break;
      case 'Fire Rate Up':
        game.weapons.forEach((w: Weapon) => (w.cooldown *= 0.8));
        break;
      case 'Extra Projectile':
        game.weapons.forEach((w: Weapon) => {
          if (w.type === 'projectile') w.projectileCount += 1;
        });
        break;
      case 'Max HP Up':
        game.player.maxHp += 20;
        game.player.hp += 20;
        break;
      case 'Heal':
        game.player.hp = game.player.maxHp;
        break;
      case 'New Weapon: Fireball':
        if (!game.weapons.find((w: Weapon) => w.name === 'Fireball')) {
          game.weapons.push({
            name: 'Fireball',
            level: 1,
            damage: 25,
            cooldown: 1500,
            lastFired: 0,
            projectileCount: 1,
            color: '#ff6600',
            type: 'projectile',
          });
        }
        break;
      case 'New Weapon: Knife':
        if (!game.weapons.find((w: Weapon) => w.name === 'Knife')) {
          game.weapons.push({
            name: 'Knife',
            level: 1,
            damage: 8,
            cooldown: 300,
            lastFired: 0,
            projectileCount: 2,
            color: '#cccccc',
            type: 'projectile',
          });
        }
        break;
      case 'New Weapon: Axe':
        if (!game.weapons.find((w: Weapon) => w.name === 'Axe')) {
          game.weapons.push({
            name: 'Axe',
            level: 1,
            damage: 15,
            cooldown: 100,
            lastFired: 0,
            projectileCount: 3,
            color: '#996633',
            type: 'orbit',
          });
        }
        break;
      case 'New Weapon: Garlic':
        if (!game.weapons.find((w: Weapon) => w.name === 'Garlic')) {
          game.weapons.push({
            name: 'Garlic',
            level: 1,
            damage: 5,
            cooldown: 500,
            lastFired: 0,
            projectileCount: 1,
            color: '#ffccff',
            type: 'area',
          });
        }
        break;
      case 'Speed Boost':
        break;
    }

    setGameState('playing');
  };

  const restart = () => {
    window.location.reload();
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0a0a0a] relative">
      <canvas ref={canvasRef} className="w-full h-full" />

      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-[#00ffff] mb-4" style={{ textShadow: '0 0 20px #00ffff' }}>
              VAMPIRE SURVIVORS
            </h1>
            <p className="text-xl text-[#ffffff80] mb-8">ULTRA JUICED EDITION</p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-[#00ffff] text-[#0a0a0a] font-bold text-xl hover:bg-[#00dddd] transition-all"
              style={{ boxShadow: '0 0 30px #00ffff' }}
            >
              START GAME
            </button>
            <div className="mt-8 text-[#ffffff60] text-sm">
              <p>WASD or Arrow Keys to move</p>
              <p>Auto-attack nearest enemies</p>
            </div>
          </div>
        </div>
      )}

      {gameState === 'levelup' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a80]">
          <div className="bg-[#1a1a1a] border-4 border-[#00ffff] p-8" style={{ boxShadow: '0 0 50px #00ffff' }}>
            <h2 className="text-3xl font-bold text-[#00ffff] mb-6 text-center">LEVEL UP!</h2>
            <div className="space-y-4">
              {upgrades.map((upgrade, i) => (
                <button
                  key={i}
                  onClick={() => selectUpgrade(upgrade)}
                  className="w-full px-6 py-4 bg-[#2a2a2a] text-white font-bold hover:bg-[#00ffff] hover:text-[#0a0a0a] transition-all border-2 border-[#00ffff80]"
                >
                  {upgrade}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === 'dead' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a80]">
          <div className="bg-[#1a1a1a] border-4 border-[#ff0000] p-8 text-center" style={{ boxShadow: '0 0 50px #ff0000' }}>
            <h2 className="text-5xl font-bold text-[#ff0000] mb-4">GAME OVER</h2>
            <p className="text-xl text-white mb-2">
              Level: {gameRef.current?.player.level || 0}
            </p>
            <p className="text-xl text-white mb-2">
              Kills: {gameRef.current?.stats.kills || 0}
            </p>
            <p className="text-xl text-white mb-6">
              Time: {Math.floor((gameRef.current?.time || 0) / 1000)}s
            </p>
            <button
              onClick={restart}
              className="px-8 py-4 bg-[#ff0000] text-white font-bold text-xl hover:bg-[#dd0000] transition-all"
              style={{ boxShadow: '0 0 30px #ff0000' }}
            >
              RESTART
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
