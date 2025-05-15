class Ball {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.targetX = x;
        this.targetY = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.lastX = x;
        this.lastY = y;
        this.initialX = x;
        this.initialY = y;
    }

    reset() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.targetX = this.initialX;
        this.targetY = this.initialY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.lastX = this.initialX;
        this.lastY = this.initialY;
    }

    moveToward(targetX, targetY, speed) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * speed;
            this.y += (dy / distance) * speed;
        }
    }

    lerp(targetX, targetY, factor) {
        this.x += (targetX - this.x) * factor;
        this.y += (targetY - this.y) * factor;
    }

    slerp(targetX, targetY, factor) {
        // Calculate vectors from current position to target
        const currentVec = {
            x: this.x - this.lastX,
            y: this.y - this.lastY
        };
        const targetVec = {
            x: targetX - this.x,
            y: targetY - this.y
        };

        // Calculate magnitudes
        const currentMag = Math.sqrt(currentVec.x * currentVec.x + currentVec.y * currentVec.y);
        const targetMag = Math.sqrt(targetVec.x * targetVec.x + targetVec.y * targetVec.y);

        // If either vector is too small, use direct movement
        if (currentMag < 0.001 || targetMag < 0.001) {
            this.x += (targetX - this.x) * factor;
            this.y += (targetY - this.y) * factor;
            return;
        }

        // Normalize vectors
        const currentNorm = {
            x: currentVec.x / currentMag,
            y: currentVec.y / currentMag
        };
        const targetNorm = {
            x: targetVec.x / targetMag,
            y: targetVec.y / targetMag
        };

        // Calculate dot product
        const dot = currentNorm.x * targetNorm.x + currentNorm.y * targetNorm.y;
        
        // Clamp dot product to prevent numerical errors
        const clampedDot = Math.max(-1, Math.min(1, dot));
        
        // Calculate angle between vectors
        const theta = Math.acos(clampedDot) * factor;

        // Calculate perpendicular vector for rotation
        const perp = {
            x: currentNorm.y,
            y: -currentNorm.x
        };

        // Calculate new position using SLERP formula
        const sinTheta = Math.sin(theta);
        const sinTheta1 = Math.sin((1 - factor) * theta);
        const sinTheta2 = Math.sin(factor * theta);

        // Store last position before updating
        this.lastX = this.x;
        this.lastY = this.y;

        // Update position
        this.x += (currentNorm.x * sinTheta1 + targetNorm.x * sinTheta2) * targetMag;
        this.y += (currentNorm.y * sinTheta1 + targetNorm.y * sinTheta2) * targetMag;
    }

    secondOrderDynamics(targetX, targetY, frequency, damping) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        
        this.velocityX += dx * frequency * frequency * (1/60);
        this.velocityY += dy * frequency * frequency * (1/60);
        
        this.velocityX *= (1 - damping);
        this.velocityY *= (1 - damping);
        
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        ctx.closePath();
    }
}

class Joystick {
    constructor(container, joystick) {
        this.container = container;
        this.joystick = joystick;
        this.containerRect = container.getBoundingClientRect();
        this.joystickRect = joystick.getBoundingClientRect();
        this.maxDistance = (this.containerRect.width - this.joystickRect.width) / 2;
        this.x = 0;
        this.y = 0;
        this.isDragging = false;
        this.centerX = 0;
        this.centerY = 0;
        this.tolerance = 0.05;
        this.lastX = 0;
        this.lastY = 0;
        this.joystickHalfSize = this.joystickRect.width / 2;

        this.setupEventListeners();
        this.updateContainerRect();
    }

    updateContainerRect() {
        this.containerRect = this.container.getBoundingClientRect();
        this.joystickRect = this.joystick.getBoundingClientRect();
        this.centerX = this.containerRect.left + this.containerRect.width / 2;
        this.centerY = this.containerRect.top + this.containerRect.height / 2;
        this.joystickHalfSize = this.joystickRect.width / 2;
        this.maxDistance = (this.containerRect.width - this.joystickRect.width) / 2;
    }

    setupEventListeners() {
        this.joystick.addEventListener('mousedown', this.startDrag.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.stopDrag.bind(this));
        
        this.joystick.addEventListener('touchstart', this.startDrag.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this));
        document.addEventListener('touchend', this.stopDrag.bind(this));

        window.addEventListener('resize', this.updateContainerRect.bind(this));
    }

    startDrag(e) {
        this.isDragging = true;
        this.updateContainerRect();
        e.preventDefault();
    }

    drag(e) {
        if (!this.isDragging) return;
        e.preventDefault();

        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        // Calculate position relative to container center
        let dx = clientX - this.centerX;
        let dy = clientY - this.centerY;

        // Calculate distance from center
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If distance is greater than maxDistance, normalize to maxDistance
        if (distance > this.maxDistance) {
            dx = (dx / distance) * this.maxDistance;
            dy = (dy / distance) * this.maxDistance;
        }

        // Calculate normalized values (-1 to 1)
        let newX = dx / this.maxDistance;
        let newY = dy / this.maxDistance;

        // Apply dead zone
        if (Math.abs(newX) < this.tolerance) newX = 0;
        if (Math.abs(newY) < this.tolerance) newY = 0;

        // Only update if values have changed significantly
        if (Math.abs(newX - this.lastX) > this.tolerance || 
            Math.abs(newY - this.lastY) > this.tolerance) {
            
            this.x = newX;
            this.y = newY;
            this.lastX = newX;
            this.lastY = newY;

            // Update joystick position to match cursor exactly
            this.joystick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

            // Update display
            document.getElementById('joystickValues').textContent = 
                `X: ${this.x.toFixed(2)}, Y: ${this.y.toFixed(2)}`;
        }
    }

    stopDrag() {
        this.isDragging = false;
        this.x = 0;
        this.y = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.joystick.style.transform = 'translate(-50%, -50%)';
        document.getElementById('joystickValues').textContent = 'X: 0, Y: 0';
    }
}

// Initialize canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Create ball and joystick instances
const ball = new Ball(canvas.width / 2, canvas.height / 2, 20);
const joystick = new Joystick(
    document.querySelector('.joystick-container'),
    document.getElementById('joystick')
);

// Movement parameters
const movementParams = {
    moveToward: { speed: 5 },
    lerp: { factor: 0.1 },
    slerp: { factor: 0.1 },
    secondOrder: { frequency: 2, damping: 0.5 }
};

// Calculate movement range based on canvas size
const movementRange = Math.min(canvas.width, canvas.height) * 0.4; // 40% of canvas size

// Parameter control elements
const moveTowardControls = document.getElementById('moveTowardControls');
const lerpControls = document.getElementById('lerpControls');
const slerpControls = document.getElementById('slerpControls');
const secondOrderControls = document.getElementById('secondOrderControls');

const speedControl = document.getElementById('speedControl');
const factorControl = document.getElementById('factorControl');
const slerpFactorControl = document.getElementById('slerpFactorControl');
const frequencyControl = document.getElementById('frequencyControl');
const dampingControl = document.getElementById('dampingControl');

// Value display elements
const speedValue = document.getElementById('speedValue');
const factorValue = document.getElementById('factorValue');
const slerpFactorValue = document.getElementById('slerpFactorValue');
const frequencyValue = document.getElementById('frequencyValue');
const dampingValue = document.getElementById('dampingValue');

// Update parameter displays
function updateParameterDisplays() {
    speedValue.textContent = movementParams.moveToward.speed.toFixed(1);
    factorValue.textContent = movementParams.lerp.factor.toFixed(2);
    slerpFactorValue.textContent = movementParams.slerp.factor.toFixed(2);
    frequencyValue.textContent = movementParams.secondOrder.frequency.toFixed(1);
    dampingValue.textContent = movementParams.secondOrder.damping.toFixed(1);
}

// Parameter control event listeners
speedControl.addEventListener('input', (e) => {
    movementParams.moveToward.speed = parseFloat(e.target.value);
    updateParameterDisplays();
});

factorControl.addEventListener('input', (e) => {
    movementParams.lerp.factor = parseFloat(e.target.value);
    updateParameterDisplays();
});

slerpFactorControl.addEventListener('input', (e) => {
    movementParams.slerp.factor = parseFloat(e.target.value);
    updateParameterDisplays();
});

frequencyControl.addEventListener('input', (e) => {
    movementParams.secondOrder.frequency = parseFloat(e.target.value);
    updateParameterDisplays();
});

dampingControl.addEventListener('input', (e) => {
    movementParams.secondOrder.damping = parseFloat(e.target.value);
    updateParameterDisplays();
});

// Movement type change handler
document.getElementById('movementType').addEventListener('change', (e) => {
    const movementType = e.target.value;
    
    // Hide all controls
    moveTowardControls.style.display = 'none';
    lerpControls.style.display = 'none';
    slerpControls.style.display = 'none';
    secondOrderControls.style.display = 'none';
    
    // Show relevant controls
    switch (movementType) {
        case 'moveToward':
            moveTowardControls.style.display = 'block';
            break;
        case 'lerp':
            lerpControls.style.display = 'block';
            break;
        case 'slerp':
            slerpControls.style.display = 'block';
            break;
        case 'secondOrder':
            secondOrderControls.style.display = 'block';
            break;
    }
    
    updateEquationDisplay(movementType);
});

// Equation display function
function updateEquationDisplay(movementType) {
    const equationText = document.getElementById('equationText');
    const parameterValues = document.getElementById('parameterValues');
    
    switch (movementType) {
        case 'moveToward':
            equationText.innerHTML = `
                <p>Move Toward:</p>
                <p>newPos = currentPos + (targetPos - currentPos) * speed</p>
                <p>where speed = ${movementParams.moveToward.speed}</p>
            `;
            parameterValues.innerHTML = `
                <p>Parameters:</p>
                <p>Speed: ${movementParams.moveToward.speed}</p>
            `;
            break;
        case 'lerp':
            equationText.innerHTML = `
                <p>Linear Interpolation (Lerp):</p>
                <p>newPos = currentPos + (targetPos - currentPos) * factor</p>
                <p>where factor = ${movementParams.lerp.factor}</p>
            `;
            parameterValues.innerHTML = `
                <p>Parameters:</p>
                <p>Factor: ${movementParams.lerp.factor}</p>
            `;
            break;
        case 'slerp':
            equationText.innerHTML = `
                <p>Spherical Linear Interpolation (SLERP):</p>
                <p>angle = startAngle + (targetAngle - startAngle) * factor</p>
                <p>newPos = currentPos + (cos(angle), sin(angle)) * distance * factor</p>
                <p>where factor = ${movementParams.slerp.factor}</p>
            `;
            parameterValues.innerHTML = `
                <p>Parameters:</p>
                <p>Factor: ${movementParams.slerp.factor}</p>
            `;
            break;
        case 'secondOrder':
            equationText.innerHTML = `
                <p>Second Order Dynamics:</p>
                <p>velocity += (targetPos - currentPos) * frequency² * dt</p>
                <p>velocity *= (1 - damping)</p>
                <p>newPos = currentPos + velocity</p>
            `;
            parameterValues.innerHTML = `
                <p>Parameters:</p>
                <p>Frequency: ${movementParams.secondOrder.frequency}</p>
                <p>Damping: ${movementParams.secondOrder.damping}</p>
            `;
            break;
    }
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const movementType = document.getElementById('movementType').value;

    // Calculate target position with consistent range
    const targetX = canvas.width / 2 + joystick.x * movementRange;
    const targetY = canvas.height / 2 + joystick.y * movementRange;

    switch (movementType) {
        case 'moveToward':
            ball.moveToward(targetX, targetY, movementParams.moveToward.speed);
            break;
        case 'lerp':
            ball.lerp(targetX, targetY, movementParams.lerp.factor);
            break;
        case 'slerp':
            ball.slerp(targetX, targetY, movementParams.slerp.factor);
            break;
        case 'secondOrder':
            ball.secondOrderDynamics(
                targetX,
                targetY,
                movementParams.secondOrder.frequency,
                movementParams.secondOrder.damping
            );
            break;
    }

    ball.draw(ctx);
    requestAnimationFrame(gameLoop);
}

// Initialize parameter displays
updateParameterDisplays();

// Show initial controls
moveTowardControls.style.display = 'block';

// Reset button event listener
document.getElementById('resetButton').addEventListener('click', () => {
    ball.reset();
});

// Start the game loop
gameLoop(); 