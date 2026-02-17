// Donkey Kong Landing Page Logic

document.addEventListener('DOMContentLoaded', function() {
    const gameContainer = document.getElementById('gameContainer');
    const menuItems = document.querySelectorAll('.menu-item');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const menuBtn = document.getElementById('menuBtn');
    let currentSelection = 0;

    // Menu navigation
    function updateMenuSelection() {
        menuItems.forEach((item, index) => {
            if (index === currentSelection) {
                item.classList.add('active');
                // Show Mario icon only for active item
                const marioIcon = item.querySelector('.mario-icon');
                const placeholder = item.querySelector('.mario-placeholder');
                if (marioIcon) marioIcon.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
            } else {
                item.classList.remove('active');
                const marioIcon = item.querySelector('.mario-icon');
                const placeholder = item.querySelector('.mario-placeholder');
                if (marioIcon) marioIcon.style.display = 'none';
                if (placeholder) placeholder.style.display = 'block';
            }
        });
    }

    // Game State
    let gameState = 'MENU'; // MENU, INTRO, PLAYING, WON, LOST
    
    // Mario Object
    const mario = {
        element: document.getElementById('marioGameSprite'),
        x: 10,  // % left
        y: 8,   // % bottom (platform 1 base 5% + girder 3%)
        width: 5, // approx % width (40px/800px)
        speed: 0.8,
        climbSpeed: 0.5,
        isClimbing: false,
        onLadder: false,
        facingRight: true,
        currentPlatform: 1
    };
    
    // Platform Data (Approximate % Keypoints)
    // Adjusted slopes and min/max keypoints
    const platforms = [
        { id: 1, baseBottom: 5,  slope: 0, xMin: 0, xMax: 100 },
        { id: 2, baseBottom: 22, slope: 0, xMin: 15, xMax: 100 },
        { id: 3, baseBottom: 39, slope: 0, xMin: 0, xMax: 85 },
        { id: 4, baseBottom: 56, slope: 0, xMin: 15, xMax: 100 },
        { id: 5, baseBottom: 73, slope: 0, xMin: 0, xMax: 85 },
        { id: 6, baseBottom: 90, slope: 0, xMin: 20, xMax: 80 }
    ];
    
    // Ladders (Approximate Bounds)
    const ladders = [
        { id: 1, bottomP: 1, topP: 2, x: 85, width: 4 }, // x is center %
        { id: 2, bottomP: 2, topP: 3, x: 15, width: 4 },
        { id: 3, bottomP: 3, topP: 4, x: 70, width: 4 },
        { id: 4, bottomP: 4, topP: 5, x: 30, width: 4 },
        { id: 5, bottomP: 5, topP: 6, x: 50, width: 4 }
    ];

    // Input States
    const keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false
    };

    document.addEventListener('keydown', (e) => {
        if (keys.hasOwnProperty(e.code)) {
            keys[e.code] = true;
        }
        // Prevent scrolling with arrows/space
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (keys.hasOwnProperty(e.code)) {
            keys[e.code] = false;
        }
    });
    // I'll rewrite updateMario to use the new helper
    
    // Update Mario Physics/Position
    function updateMario() {
        const el = mario.element;
        const icon = el.querySelector('.mario-game-icon');
        let dx = 0;
        let dy = 0;
        let moving = false;
        
        // 1. Horizontal Movement
        if (keys.ArrowLeft) {
            dx = -mario.speed;
            mario.facingRight = false;
            moving = true;
        } else if (keys.ArrowRight) {
            dx = mario.speed;
            mario.facingRight = true;
            moving = true;
        }
        
        // 2. Vertical Movement (Climbing)
        if (keys.ArrowUp) {
            dy = mario.climbSpeed;
            moving = true;
        } else if (keys.ArrowDown) {
            dy = -mario.climbSpeed;
            moving = true;
        }
        
        // --- Physics & Collision ---
        
        // Check for ladder interaction
        const ladder = getCollidingLadder(mario.x);
        
        if (ladder) {
            // Near a ladder
            if (keys.ArrowUp || keys.ArrowDown) {
                mario.isClimbing = true;
                if (Math.abs(mario.x - ladder.x) < 2) {
                    mario.x = ladder.x; 
                }
            }
        } else {
            mario.isClimbing = false;
        }
        
        if (mario.isClimbing && ladder) {
            // Climbing Logic
            mario.y += dy;
            mario.x = ladder.x; // Lock X
            
            // Constrain climbing between platforms
            const botPlat = platforms.find(p => p.id === ladder.bottomP);
            const topPlat = platforms.find(p => p.id === ladder.topP);
            
            // For limits, we use the "floor" Y of the platforms
            const minY = getPlatformY(botPlat, mario.x);
            const maxY = getPlatformY(topPlat, mario.x);
            
            if (mario.y <= minY) {
                mario.y = minY;
                mario.isClimbing = false;
                mario.currentPlatform = ladder.bottomP;
            } else if (mario.y >= maxY) {
                mario.y = maxY;
                mario.isClimbing = false;
                mario.currentPlatform = ladder.topP;
            } else {
                mario.currentPlatform = null;
            }
            
            // Visuals
            el.classList.add('climbing');
            el.classList.remove('walking');
            if (!moving) icon.style.animationPlayState = 'paused';
            else icon.style.animationPlayState = 'running';
            
        } else {
            // Walking Logic (On Platform)
            let newX = mario.x + dx;
            
            // Get current platform bounds
            const plat = platforms.find(p => p.id === mario.currentPlatform);
            if (plat) {
                // Constrain X to platform
                if (newX < plat.xMin) newX = plat.xMin;
                if (newX > plat.xMax) newX = plat.xMax;
                
                mario.x = newX;
                mario.y = getPlatformY(plat, mario.x);
            }
            
            // Visuals
            el.classList.remove('climbing');
            if (moving) {
                el.classList.add('walking');
                if (mario.facingRight) el.classList.remove('facing-left');
                else el.classList.add('facing-left');
            } else {
                el.classList.remove('walking');
            }
        }
        
        // Update DOM
        el.style.left = mario.x + '%';
        el.style.bottom = mario.y + '%';
    }
    
    // Helper: Get Platform Y at given X
    function getPlatformY(plat, x) {
        // The CSS platforms use rotate() for slope, so the visual slope is subtle (~1deg).
        // slopeFactor converts our slope value to a % offset per unit of x distance from center.
        const slopeFactor = 0.06; // Tuned to match ~1deg CSS rotation
        const offset = (x - 50) * plat.slope * slopeFactor;
        
        // The girder element has height ~25px. In an ~800px tall game board, that's ~3%.
        // Mario should stand ON TOP of the girder, so we add the girder height.
        const girderHeight = 3.0;
        
        return plat.baseBottom + offset + girderHeight;
    }    

    // Helper: Check if Mario is near a ladder
    function getCollidingLadder(x) {
        for (const ladder of ladders) {
            if (Math.abs(x - ladder.x) < ladder.width) {
                return ladder;
            }
        }
        return null;
    }

    // Click handlers for menu items
    menuItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            console.log('Clicked:', item.id);
            currentSelection = index;
            updateMenuSelection();
            handleMenuSelect();
        });
    });

    // Handle menu selection
    function handleMenuSelect() {
        if (!menuItems[currentSelection]) return;
        
        const selectedItem = menuItems[currentSelection];
        const itemId = selectedItem.id;
        console.log('Selection:', itemId); 
        
        switch(itemId) {
            case 'newGame':
                console.log('Starting New Game...');
                try {
                    startGame();
                } catch (e) {
                    console.error('CRITICAL: Error starting game:', e);
                    alert('Error starting game. Check console.');
                }
                break;
            case 'continueGame':
                console.log('Continuing Game...');
                break;
            case 'controls':
                console.log('Showing Controls...');
                showControls();
                break;
        }
    }

    // Start Game Sequence
    function startGame() {
        console.log('Initializing Game Sequence');
        
        // Validation
        const gameScreen = document.getElementById('gameScreen');
        const dk = document.getElementById('dkGameSprite');
        
        if (!gameScreen) {
             console.error('Game Screen #gameScreen not found!');
             return;
        }
        
        if (!dk) {
            console.error('DK Sprite #dkGameSprite not found!');
            return;
        }

        // Set state
        gameState = 'INTRO';
        
        // Flash effect first
        try {
            flashScreen();
        } catch(e) {
            console.warn('Flash effect failed, continuing:', e);
        }
        
        // After flash, switch screens
        setTimeout(() => {
            console.log('Switching to Game Screen');
            const mainContent = document.querySelector('.main-content'); 
            const topBar = document.querySelector('.top-bar');
            
            if (mainContent) mainContent.style.display = 'none';
            if (topBar) topBar.style.display = 'none';
            
            gameScreen.style.display = 'flex';
            
            // Start the climbing sequence
            console.log('Starting Climbing Sequence');
            startClimbingSequence().catch(e => {
                console.error('Climbing sequence failed:', e);
                // Fallback: spawn Mario anyway so game isn't softlocked
                spawnMario();
            });
            
            // Start Game Loop
            requestAnimationFrame(gameLoop);
            
        }, 250); // Halfway through flash
    }

    // DK Climbing Animation Script
    async function startClimbingSequence() {
        const dk = document.getElementById('dkGameSprite');
        const dkImg = dk.querySelector('img');
        
        // Helper to animate movement
        const moveTo = (left, bottom, duration) => {
            return new Promise(resolve => {
                dk.style.transition = `left ${duration}ms linear, bottom ${duration}ms linear`;
                dk.style.left = left;
                dk.style.bottom = bottom;
                
                // Set walking animation
                startSpriteAnim(dkImg);
                
                setTimeout(() => {
                    stopSpriteAnim(dkImg);
                    resolve();
                }, duration);
            });
        };

        // Pause helper
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Reset position
        dk.style.transition = 'none';
        dk.style.left = '50%';
        dk.style.bottom = '5%';
        
        // Sequence
        await wait(1000); // Initial pause
        
        // 1. Walk right to Ladder 1
        // L1 is at Right 15% -> Left 85%
        await moveTo('85%', '5%', 2000);
        
        // 2. Climb up Ladder 1
        // To Platform 2 (Bottom 22%)
        await moveTo('85%', '22%', 1500);
        
        // 3. Walk left to Ladder 2
        // L2 is at Left 15%
        await moveTo('15%', '22%', 3000);
        
        // 4. Climb up Ladder 2
        // To Platform 3 (Bottom 39%)
        await moveTo('15%', '39%', 1500);
        
        // 5. Walk right to Ladder 3
        // L3 is at Right 30% -> Left 70%
        await moveTo('70%', '39%', 2500);
        
        // 6. Climb up Ladder 3
        // To Platform 4 (Bottom 56%)
        await moveTo('70%', '56%', 1500);
        
        // 7. Walk left to Ladder 4
        // L4 is at Left 30%
        await moveTo('30%', '56%', 2000);
        
        // 8. Climb up Ladder 4
        // To Platform 5 (Bottom 73%)
        await moveTo('30%', '73%', 1500);
        
        // 9. Walk center to Ladder 5
        // L5 is at Left 50%
        await moveTo('50%', '73%', 1000);
        
        // 10. Climb up Ladder 5 (Top)
        // To Platform 6 (Bottom 90%)
        await moveTo('50%', '90%', 1500);
        
        // Checkered flag / Done
        console.log('DK Reached the top!');
        stopSpriteAnim(dkImg);
        chestBeat(dkImg);
        
        // SPAWN MARIO
        await wait(1000);
        spawnMario();
    }

    // ===== BARREL SYSTEM =====
    const barrels = []; // Active barrel objects
    let barrelSpawnTimer = 0;
    const BARREL_SPAWN_INTERVAL = 180; // frames (~3 seconds at 60fps)
    const BARREL_SPEED = 0.5; // % per frame horizontal
    const BARREL_FALL_SPEED = 1.0; // % per frame vertical when falling
    const BARREL_IMG = 'Screenshot_2026-02-17_at_11.35.42_AM-removebg-preview.png';
    let score = 0;
    let lives = 3;

    function spawnBarrel() {
        const gameBoard = document.querySelector('.game-board');
        if (!gameBoard) return;

        // Create barrel DOM element
        const barrelEl = document.createElement('div');
        barrelEl.className = 'barrel rolling';
        barrelEl.innerHTML = `<img src="${BARREL_IMG}" alt="barrel">`;
        gameBoard.appendChild(barrelEl);

        // Barrel starts near DK at platform 6
        const barrel = {
            element: barrelEl,
            x: 50,           // DK's position (center)
            y: 90 + 3,       // On top of platform 6 (baseBottom + girderHeight)
            currentPlatform: 6,
            direction: 1,     // 1 = right, -1 = left
            falling: false,
            fallTarget: null, // Target platform when falling
            active: true
        };

        barrels.push(barrel);
        console.log('Barrel spawned! Total:', barrels.length);
    }

    function updateBarrels() {
        for (let i = barrels.length - 1; i >= 0; i--) {
            const b = barrels[i];
            if (!b.active) continue;

            if (b.falling) {
                // Falling between platforms
                b.y -= BARREL_FALL_SPEED;

                if (b.fallTarget !== null) {
                    const targetPlat = platforms.find(p => p.id === b.fallTarget);
                    const targetY = targetPlat.baseBottom + 3; // girder height

                    if (b.y <= targetY) {
                        // Landed on target platform
                        b.y = targetY;
                        b.falling = false;
                        b.currentPlatform = b.fallTarget;
                        b.fallTarget = null;

                        // Reverse direction on each platform (zig-zag pattern)
                        // Even platforms go left, odd go right
                        b.direction = (b.currentPlatform % 2 === 0) ? -1 : 1;

                        b.element.className = 'barrel rolling';
                    }
                } else {
                    // Falling off the bottom - remove
                    if (b.y < -5) {
                        b.active = false;
                        b.element.remove();
                        barrels.splice(i, 1);
                        continue;
                    }
                }
            } else {
                // Rolling on platform
                b.x += BARREL_SPEED * b.direction;

                const plat = platforms.find(p => p.id === b.currentPlatform);
                if (!plat) continue;

                // Check if barrel reached platform edge
                if (b.x >= plat.xMax || b.x <= plat.xMin) {
                    // Find the platform below
                    const belowPlatId = b.currentPlatform - 1;
                    if (belowPlatId >= 1) {
                        b.falling = true;
                        b.fallTarget = belowPlatId;
                        b.element.className = 'barrel falling';
                    } else {
                        // Below platform 1 - remove barrel
                        b.active = false;
                        b.element.remove();
                        barrels.splice(i, 1);
                        continue;
                    }
                }

                b.y = plat.baseBottom + 3; // Stay on platform
            }

            // Update barrel DOM
            b.element.style.left = b.x + '%';
            b.element.style.bottom = b.y + '%';

            // Check collision with Mario
            if (gameState === 'PLAYING' && checkBarrelCollision(b)) {
                handleBarrelHit();
                b.active = false;
                b.element.remove();
                barrels.splice(i, 1);
            }
        }
    }

    function checkBarrelCollision(barrel) {
        // Simple bounding box collision (in % units)
        const marioSize = 4; // approx Mario hitbox %
        const barrelSize = 3.5; // approx barrel hitbox %

        const dx = Math.abs(mario.x - barrel.x);
        const dy = Math.abs(mario.y - barrel.y);

        return dx < (marioSize + barrelSize) / 2 && dy < (marioSize + barrelSize) / 2;
    }

    function handleBarrelHit() {
        lives--;
        console.log('Mario hit! Lives:', lives);

        // Update lives display - remove a life icon
        const lifeIcons = document.querySelectorAll('.mario-life-icon');
        if (lifeIcons.length > 0) {
            lifeIcons[lifeIcons.length - 1].remove();
        }

        if (lives <= 0) {
            gameState = 'LOST';
            alert('GAME OVER! Final Score: ' + score);
            // Reset
            lives = 3;
            score = 0;
            // Reset lives icons
            const livesContainer = document.querySelector('.lives-container');
            if (livesContainer) {
                livesContainer.innerHTML = '';
                for (let i = 0; i < 3; i++) {
                    const icon = document.createElement('div');
                    icon.className = 'mario-life-icon';
                    livesContainer.appendChild(icon);
                }
            }
            // Clear all barrels
            barrels.forEach(b => b.element.remove());
            barrels.length = 0;
            // Respawn mario
            spawnMario();
        } else {
            // Flash Mario and respawn
            const marioEl = mario.element;
            marioEl.style.opacity = '0.3';
            setTimeout(() => {
                marioEl.style.opacity = '1';
                // Reset Mario position
                mario.x = 8;
                mario.currentPlatform = 1;
                const plat = platforms.find(p => p.id === 1);
                mario.y = getPlatformY(plat, mario.x);
                marioEl.style.left = mario.x + '%';
                marioEl.style.bottom = mario.y + '%';
            }, 1000);
        }
    }

    // Main Game Loop
    function gameLoop() {
        if (gameState === 'PLAYING') {
            updateMario();

            // Barrel spawning
            barrelSpawnTimer++;
            if (barrelSpawnTimer >= BARREL_SPAWN_INTERVAL) {
                barrelSpawnTimer = 0;
                spawnBarrel();
            }

            // Update barrels
            updateBarrels();

            // Score increases over time
            score += 1;
            const scoreEl = document.querySelector('.score-container .score-value');
            if (scoreEl) scoreEl.textContent = String(score).padStart(6, '0');
        }
        
        requestAnimationFrame(gameLoop);
    }

    function spawnMario() {
        console.log('Mario Spawning...');
        const marioEl = document.getElementById('marioGameSprite');
        if (marioEl) {
            marioEl.style.display = 'block';
            // Start position: Ensure it's safe and visible
            mario.x = 8;
            mario.currentPlatform = 1;
            // Calculate initial Y based on platform logic to prevent jump
            const plat = platforms.find(p => p.id === 1);
            mario.y = getPlatformY(plat, mario.x);
            
            gameState = 'PLAYING';
            
            // Force initial render
            marioEl.style.left = mario.x + '%';
            marioEl.style.bottom = mario.y + '%';
        }
    }
    
    // Sprite Animation Helpers
    let animInterval;
    function startSpriteAnim(imgElement) {
        if (animInterval) clearInterval(animInterval);
        let frame = 1;
        animInterval = setInterval(() => {
            frame = (frame % 3) + 1;
            imgElement.src = `imgs/${frame}.png`;
        }, 150); // 150ms per frame
    }
    
    function stopSpriteAnim(imgElement) {
        if (animInterval) clearInterval(animInterval);
        imgElement.src = 'imgs/1.png'; // Reset to idle
    }
    
    function chestBeat(imgElement) {
        if (animInterval) clearInterval(animInterval);
        let frame = 1;
        // Faster animation for chest beat
        animInterval = setInterval(() => {
            frame = (frame === 1) ? 2 : 1; // Toggle 1 and 2
            imgElement.src = `imgs/${frame}.png`;
        }, 100);
        
        // Stop after 3 seconds
        setTimeout(() => {
            clearInterval(animInterval);
            imgElement.src = 'imgs/1.png';
        }, 3000);
    }

    // Flash screen effect for new game
    function flashScreen() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 1000;
            animation: flashAnim 0.5s ease-out forwards;
        `;
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 500);
    }

    // Show controls overlay
    function showControls() {
        const overlay = document.createElement('div');
        overlay.id = 'controlsOverlay';
        overlay.innerHTML = `
            <div class="controls-content">
                <h2>CONTROLS</h2>
                <p>↑ ↓ - Navigate Menu</p>
                <p>ENTER - Select</p>
                <p>← → - Move</p>
                <p>SPACE - Jump</p>
                <p class="close-hint">Press ESC to close</p>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100;
        `;
        
        const content = overlay.querySelector('.controls-content');
        content.style.cssText = `
            text-align: center;
            color: white;
            font-family: 'Press Start 2P', cursive;
        `;
        
        const h2 = content.querySelector('h2');
        h2.style.cssText = `
            color: #ff3333;
            margin-bottom: 30px;
            font-size: 24px;
        `;
        
        const paragraphs = content.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.style.cssText = `
                margin: 15px 0;
                font-size: 14px;
            `;
        });
        
        const hint = content.querySelector('.close-hint');
        hint.style.cssText = `
            margin-top: 40px;
            font-size: 10px;
            color: #888;
        `;
        
        document.body.appendChild(overlay);
        
        // Close on ESC or click
        function closeOverlay(e) {
            if (e.key === 'Escape' || e.type === 'click') {
                overlay.remove();
                document.removeEventListener('keydown', closeOverlay);
            }
        }
        
        document.addEventListener('keydown', closeOverlay);
        overlay.addEventListener('click', closeOverlay);
    }

    // Fullscreen functionality
    fullscreenBtn.addEventListener('click', function() {
        if (!document.fullscreenElement) {
            gameContainer.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Update fullscreen icon based on state
    document.addEventListener('fullscreenchange', function() {
        const icon = fullscreenBtn.querySelector('.fullscreen-icon');
        if (document.fullscreenElement) {
            icon.style.transform = 'rotate(180deg)';
        } else {
            icon.style.transform = 'rotate(0deg)';
        }
    });

    // Add flash animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flashAnim {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Initialize
    updateMenuSelection();

    // Focus game container for keyboard input
    gameContainer.setAttribute('tabindex', '0');
    gameContainer.focus();
});
