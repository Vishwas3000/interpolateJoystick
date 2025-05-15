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
        this.easeProgress = 0;
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
        
        // Use damping parameter to control oscillation
        const dampingFactor = Math.max(0.1, Math.min(1, damping));
        const forceMultiplier = 2 * (1 + (1 - dampingFactor)); // Adjust force based on damping
        
        this.velocityX += dx * frequency * frequency * (1/60) * forceMultiplier;
        this.velocityY += dy * frequency * frequency * (1/60) * forceMultiplier;
        
        this.velocityX *= (1 - dampingFactor);
        this.velocityY *= (1 - dampingFactor);
        
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    easeInOut(targetX, targetY, strength, easeType) {
        // Calculate distance to target
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.1) { // Only move if we're not very close to target
            // Update ease progress
            this.easeProgress = Math.min(1, this.easeProgress + 0.02);
            
            // Calculate ease factor based on type
            let easeFactor;
            switch (easeType) {
                case 'sine':
                    easeFactor = 0.5 - Math.cos(this.easeProgress * Math.PI) / 2;
                    break;
                case 'quad':
                    easeFactor = this.easeProgress < 0.5
                        ? 2 * this.easeProgress * this.easeProgress
                        : 1 - Math.pow(-2 * this.easeProgress + 2, 2) / 2;
                    break;
                case 'cubic':
                    easeFactor = this.easeProgress < 0.5
                        ? 4 * this.easeProgress * this.easeProgress * this.easeProgress
                        : 1 - Math.pow(-2 * this.easeProgress + 2, 3) / 2;
                    break;
                case 'quart':
                    easeFactor = this.easeProgress < 0.5
                        ? 8 * this.easeProgress * this.easeProgress * this.easeProgress * this.easeProgress
                        : 1 - Math.pow(-2 * this.easeProgress + 2, 4) / 2;
                    break;
                case 'quint':
                    easeFactor = this.easeProgress < 0.5
                        ? 16 * this.easeProgress * this.easeProgress * this.easeProgress * this.easeProgress * this.easeProgress
                        : 1 - Math.pow(-2 * this.easeProgress + 2, 5) / 2;
                    break;
            }
            
            // Apply ease factor to movement
            const moveX = dx * easeFactor * strength * 0.1;
            const moveY = dy * easeFactor * strength * 0.1;
            
            this.x += moveX;
            this.y += moveY;
        } else {
            this.easeProgress = 0; // Reset progress when target is reached
        }
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
const graphCanvas = document.getElementById('functionGraph');
const graphCtx = graphCanvas.getContext('2d');

// Graph configuration
let functionChart = null;
const graphData = {
    labels: [],
    datasets: [{
        label: 'Position',
        data: [],
        borderColor: '#4CAF50',
        tension: 0.4,
        fill: false,
        pointRadius: 0
    }]
};

const graphConfig = {
    type: 'line',
    data: graphData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
            mode: 'nearest',
            axis: 'xy',
            intersect: false
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time (t)',
                    font: {
                        weight: 'bold'
                    }
                },
                beginAtZero: true,
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    stepSize: 0.2,
                    callback: value => value.toFixed(1)
                },
                min: 0,
                max: 1
            },
            y: {
                title: {
                    display: true,
                    text: 'Position (p)',
                    font: {
                        weight: 'bold'
                    }
                },
                beginAtZero: true,
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    stepSize: 0.2,
                    callback: value => value.toFixed(1)
                },
                min: 0,
                max: 2 // Increased max to show overshooting
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        weight: 'bold'
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Position: ${context.parsed.y.toFixed(3)}`;
                    }
                }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                    modifierKey: 'shift',
                    limits: {
                        x: {min: 0, max: 1},
                        y: {min: 0, max: 2} // Increased max for zoom limits
                    }
                },
                zoom: {
                    wheel: {
                        enabled: true,
                        modifierKey: 'ctrl'
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'xy',
                    drag: {
                        enabled: true,
                        modifierKey: 'alt'
                    },
                    limits: {
                        x: {min: 0, max: 1},
                        y: {min: 0, max: 2} // Increased max for zoom limits
                    }
                }
            }
        }
    }
};

// Calculate interpolation points
function calculateInterpolationPoints(movementType, factor) {
    const points = [];
    const steps = 100;
    const startPoint = { x: 0, y: 0 };
    const endPoint = { x: 1, y: 1 };
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        let point;
        
        switch (movementType) {
            case 'moveToward':
                point = {
                    x: t,
                    y: Math.min(1, t * factor * 2)
                };
                break;
            case 'lerp':
                const lerpFactor = Math.min(1, factor * 2);
                point = {
                    x: t,
                    y: startPoint.y + (endPoint.y - startPoint.y) * (1 - Math.pow(1 - t, lerpFactor))
                };
                break;
            case 'slerp':
                const slerpFactor = Math.min(1, factor * 2);
                const angle = Math.PI * t * slerpFactor;
                point = {
                    x: t,
                    y: Math.sin(angle) * slerpFactor
                };
                break;
            case 'secondOrder':
                const omega = 2 * Math.PI * factor;
                const damping = movementParams.secondOrder.damping;
                const dampingFactor = Math.max(0.1, Math.min(1, damping));
                
                // Calculate the oscillation with proper damping
                const oscillation = Math.exp(-dampingFactor * omega * t) * Math.cos(omega * t);
                
                // Scale the oscillation based on damping
                const amplitude = 0.5 * (1 + (1 - dampingFactor));
                point = {
                    x: t,
                    y: 1 + (oscillation * amplitude)
                };
                break;
            case 'easeInOut':
                const easeType = movementParams.easeInOut.type;
                let easeFactor;
                switch (easeType) {
                    case 'sine':
                        easeFactor = 0.5 - Math.cos(t * Math.PI) / 2;
                        break;
                    case 'quad':
                        easeFactor = t < 0.5
                            ? 2 * t * t
                            : 1 - Math.pow(-2 * t + 2, 2) / 2;
                        break;
                    case 'cubic':
                        easeFactor = t < 0.5
                            ? 4 * t * t * t
                            : 1 - Math.pow(-2 * t + 2, 3) / 2;
                        break;
                    case 'quart':
                        easeFactor = t < 0.5
                            ? 8 * t * t * t * t
                            : 1 - Math.pow(-2 * t + 2, 4) / 2;
                        break;
                    case 'quint':
                        easeFactor = t < 0.5
                            ? 16 * t * t * t * t * t
                            : 1 - Math.pow(-2 * t + 2, 5) / 2;
                        break;
                }
                point = {
                    x: t,
                    y: easeFactor * factor
                };
                break;
        }
        points.push(point);
    }
    return points;
}

// Update graph with interpolation points
function updateInterpolationGraph(movementType, factor) {
    const points = calculateInterpolationPoints(movementType, factor);
    
    // Update the data
    graphData.labels = points.map(p => p.x);
    graphData.datasets[0].data = points.map(p => p.y);
    
    // Update chart title and styling
    graphData.datasets[0].label = `${movementType.charAt(0).toUpperCase() + movementType.slice(1)} Interpolation`;
    if (movementType === 'secondOrder') {
        graphData.datasets[0].label += ` (Damping: ${movementParams.secondOrder.damping.toFixed(1)})`;
    }
    graphData.datasets[0].borderWidth = 2;
    
    // Reset zoom to default view
    if (functionChart) {
        functionChart.resetZoom();
    }
    
    functionChart.update();
}

// Add zoom controls to the graph container
function addZoomControls() {
    const graphContainer = document.querySelector('.graph-container');
    const controlsDiv = document.createElement('div');
    controlsDiv.style.marginTop = '10px';
    controlsDiv.style.display = 'flex';
    controlsDiv.style.gap = '10px';
    controlsDiv.style.justifyContent = 'center';
    controlsDiv.style.position = 'absolute';
    controlsDiv.style.bottom = '10px';
    controlsDiv.style.left = '50%';
    controlsDiv.style.transform = 'translateX(-50%)';
    controlsDiv.style.zIndex = '1';
    
    const buttons = [
        { text: 'Reset View', action: () => functionChart.resetZoom() },
        { text: 'Zoom In', action: () => functionChart.zoom(1.1) },
        { text: 'Zoom Out', action: () => functionChart.zoom(0.9) }
    ];
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.style.padding = '5px 10px';
        button.style.borderRadius = '4px';
        button.style.border = '1px solid #ccc';
        button.style.background = '#fff';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        button.onclick = btn.action;
        controlsDiv.appendChild(button);
    });
    
    graphContainer.appendChild(controlsDiv);
}

// Initialize the graph
function initGraph() {
    if (functionChart) {
        functionChart.destroy();
    }
    
    // Set canvas size to match container
    const container = document.querySelector('.graph-container');
    const canvas = document.getElementById('functionGraph');
    canvas.width = container.clientWidth - 30; // Account for padding
    canvas.height = container.clientHeight - 60; // Account for padding and controls
    
    functionChart = new Chart(graphCtx, graphConfig);
    updateInterpolationGraph('moveToward', movementParams.moveToward.speed / 10);
    addZoomControls();
}

// Add window resize handler
window.addEventListener('resize', () => {
    if (functionChart) {
        initGraph();
    }
});

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
    secondOrder: { frequency: 2, damping: 0.5 },
    easeInOut: { strength: 2, type: 'sine' }
};

// Calculate movement range based on canvas size
const movementRange = Math.min(canvas.width, canvas.height) * 0.4; // 40% of canvas size

// Parameter control elements
const moveTowardControls = document.getElementById('moveTowardControls');
const lerpControls = document.getElementById('lerpControls');
const slerpControls = document.getElementById('slerpControls');
const secondOrderControls = document.getElementById('secondOrderControls');
const easeInOutControls = document.getElementById('easeInOutControls');

const speedControl = document.getElementById('speedControl');
const factorControl = document.getElementById('factorControl');
const slerpFactorControl = document.getElementById('slerpFactorControl');
const frequencyControl = document.getElementById('frequencyControl');
const dampingControl = document.getElementById('dampingControl');
const easeStrengthControl = document.getElementById('easeStrengthControl');
const easeTypeControl = document.getElementById('easeTypeControl');

// Value display elements
const speedValue = document.getElementById('speedValue');
const factorValue = document.getElementById('factorValue');
const slerpFactorValue = document.getElementById('slerpFactorValue');
const frequencyValue = document.getElementById('frequencyValue');
const dampingValue = document.getElementById('dampingValue');
const easeStrengthValue = document.getElementById('easeStrengthValue');

// Update parameter displays
function updateParameterDisplays() {
    speedValue.textContent = movementParams.moveToward.speed.toFixed(1);
    factorValue.textContent = movementParams.lerp.factor.toFixed(2);
    slerpFactorValue.textContent = movementParams.slerp.factor.toFixed(2);
    frequencyValue.textContent = movementParams.secondOrder.frequency.toFixed(1);
    dampingValue.textContent = movementParams.secondOrder.damping.toFixed(1);
    easeStrengthValue.textContent = movementParams.easeInOut.strength.toFixed(1);
}

// Parameter control event listeners
speedControl.addEventListener('input', (e) => {
    movementParams.moveToward.speed = parseFloat(e.target.value);
    updateParameterDisplays();
    updateInterpolationGraph('moveToward', movementParams.moveToward.speed / 10);
});

factorControl.addEventListener('input', (e) => {
    movementParams.lerp.factor = parseFloat(e.target.value);
    updateParameterDisplays();
    updateInterpolationGraph('lerp', movementParams.lerp.factor);
});

slerpFactorControl.addEventListener('input', (e) => {
    movementParams.slerp.factor = parseFloat(e.target.value);
    updateParameterDisplays();
    updateInterpolationGraph('slerp', movementParams.slerp.factor);
});

frequencyControl.addEventListener('input', (e) => {
    movementParams.secondOrder.frequency = parseFloat(e.target.value);
    updateParameterDisplays();
    updateInterpolationGraph('secondOrder', movementParams.secondOrder.frequency);
});

dampingControl.addEventListener('input', (e) => {
    movementParams.secondOrder.damping = parseFloat(e.target.value);
    updateParameterDisplays();
    updateInterpolationGraph('secondOrder', movementParams.secondOrder.frequency);
});

easeStrengthControl.addEventListener('input', (e) => {
    movementParams.easeInOut.strength = parseFloat(e.target.value);
    updateParameterDisplays();
    updateInterpolationGraph('easeInOut', movementParams.easeInOut.strength);
});

easeTypeControl.addEventListener('change', (e) => {
    movementParams.easeInOut.type = e.target.value;
    updateInterpolationGraph('easeInOut', movementParams.easeInOut.strength);
});

// Movement type change handler
document.getElementById('movementType').addEventListener('change', (e) => {
    const movementType = e.target.value;
    
    // Hide all controls
    moveTowardControls.style.display = 'none';
    lerpControls.style.display = 'none';
    slerpControls.style.display = 'none';
    secondOrderControls.style.display = 'none';
    easeInOutControls.style.display = 'none';
    
    // Show relevant controls
    switch (movementType) {
        case 'moveToward':
            moveTowardControls.style.display = 'block';
            updateInterpolationGraph(movementType, movementParams.moveToward.speed / 10);
            break;
        case 'lerp':
            lerpControls.style.display = 'block';
            updateInterpolationGraph(movementType, movementParams.lerp.factor);
            break;
        case 'slerp':
            slerpControls.style.display = 'block';
            updateInterpolationGraph(movementType, movementParams.slerp.factor);
            break;
        case 'secondOrder':
            secondOrderControls.style.display = 'block';
            updateInterpolationGraph(movementType, movementParams.secondOrder.frequency);
            break;
        case 'easeInOut':
            easeInOutControls.style.display = 'block';
            updateInterpolationGraph(movementType, movementParams.easeInOut.strength);
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
        case 'easeInOut':
            equationText.innerHTML = `
                <p>Ease In/Out:</p>
                <p>newPos = currentPos + (targetPos - currentPos) * strength * easeFactor</p>
                <p>where strength = ${movementParams.easeInOut.strength}</p>
            `;
            parameterValues.innerHTML = `
                <p>Parameters:</p>
                <p>Strength: ${movementParams.easeInOut.strength}</p>
                <p>Type: ${movementParams.easeInOut.type}</p>
            `;
            break;
    }
}

// Remove the real-time graph updates from gameLoop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const movementType = document.getElementById('movementType').value;
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
        case 'easeInOut':
            ball.easeInOut(
                targetX,
                targetY,
                movementParams.easeInOut.strength,
                movementParams.easeInOut.type
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

// Initialize graph
initGraph();

// Reset button event listener
document.getElementById('resetButton').addEventListener('click', () => {
    ball.reset();
    updateInterpolationGraph('moveToward', movementParams.moveToward.speed / 10);
});

// Start the game loop
gameLoop(); 