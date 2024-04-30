// Vertex shader program
var VSHADER_SOURCE = `
    // Vertex Shader
    attribute vec4 a_Position;
    attribute vec3 a_Color;
    varying vec3 v_Color;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;

    void main() {
        gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_Color = a_Color;
    }`

// Fragment shader program
var FSHADER_SOURCE = `
    // Fragment Shader
    precision mediump float;
    varying vec3 v_Color;

    void main() {
        gl_FragColor = vec4(v_Color, 1.0);
    }`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_Color;
// let u_Size; 
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let needsUpdate = true; 

// Global Variables for Mouse Interaction
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
let g_yGlobalAngle = 0; 


function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize the GL context
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}


// Globals related to UI elements
let g_globalAngle=90;

let g_topLUpperLeg = 0;
let g_topLLowerLeg = 0;
let g_topLFoot = 0;

let g_topRUpperLeg = 0;
let g_topRLowerLeg = 0;
let g_topRFoot = 0;

let g_bottomLUpperLeg = 0;
let g_bottomLLowerLeg = 0;
let g_bottomLFoot = 0;

let g_bottomRUpperLeg = 0;
let g_bottomRLowerLeg = 0;
let g_bottomRFoot = 0;

let g_tailWiggle = 0;
let g_whiskerWiggle = 0;
let g_noseWiggle = 0;

let g_upperLegAnimation = false;
let g_lowerLegAnimation = false;
let g_footAnimation = false;
let g_baseAnimation = false;
let g_pokeAnimation = false;

// Set up actions for HTML UI elements
function addActionsForHtmlUI(){
    // Button Events
    document.getElementById('animationUpperLegOffButton').onclick = function() {g_upperLegAnimation = false;};
    document.getElementById('animationUpperLegOnButton').onclick = function() {g_upperLegAnimation = true;};

    document.getElementById('animationLowerLegOffButton').onclick = function() {g_lowerLegAnimation = false;};
    document.getElementById('animationLowerLegOnButton').onclick = function() {g_lowerLegAnimation = true;};

    document.getElementById('animationFootOffButton').onclick = function() {g_footAnimation = false;};
    document.getElementById('animationFootOnButton').onclick = function() {g_footAnimation = true;};

    document.getElementById('animationBaseOffButton').onclick = function() {g_baseAnimation = false;};
    document.getElementById('animationBaseOnButton').onclick = function() {g_baseAnimation = true;};

    // Slider Events
    // Slider for camera rotation
    var angleSlider = document.getElementById('angleSlide');
    angleSlider.addEventListener('input', function() {
        g_globalAngle = parseInt(this.value); // Update global angle
        requestUpdate(); // Re-render the scene with new angle
    });

    var yAngleSlider = document.getElementById('yAngleSlide');
    yAngleSlider.addEventListener('input', function() {
        g_yGlobalAngle = parseInt(this.value);
        requestUpdate();
    });

    document.getElementById('upperLegSlide').addEventListener('input', function() {
        g_bottomLUpperLeg = this.value;
        requestUpdate(); // Mark scene to be updated
    });

    document.getElementById('lowerLegSlide').addEventListener('input', function() {
        g_bottomLLowerLeg = this.value;
        requestUpdate(); // Mark scene to be updated
    });

    document.getElementById('footSlide').addEventListener('input', function() {
        g_bottomLFoot = this.value;
        requestUpdate(); // Mark scene to be updated
    });
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
    var currentTime = performance.now() / 1000.0;
    g_seconds = currentTime - g_startTime;

    updateAnimationAngles();
    renderAllShapes();

    if (needsUpdate) {
        renderAllShapes();  
        needsUpdate = false; // Reset update flag
    }

    requestAnimationFrame(tick);
}

function updateAnimationAngles(){
    var phaseShift = Math.PI; // 180 degrees phase shift in radians
    if (g_baseAnimation) {
        // Top Left and Bottom Right Legs (move in phase)
        g_topLUpperLeg = 0 + 5 * (1 + Math.sin(2 * g_seconds)) / 2;
        g_topLLowerLeg = -20 + 20 * (1 + Math.sin(2 * g_seconds)) / 2;
        g_topLFoot = -20 + 20 * (1 + Math.sin(2 * g_seconds)) / 2;

        g_bottomRUpperLeg = 0 + 20 * (1 + Math.sin(2 * g_seconds + phaseShift)) / 2;
        g_bottomRLowerLeg = -20 + 20 * (1 + Math.sin(2 * g_seconds + phaseShift)) / 2;
        g_bottomRFoot = -20 + 20 * (1 + Math.sin(2 * g_seconds + phaseShift)) / 2;

        // Top Right and Bottom Left Legs (move opposite to the first pair)
        g_topRUpperLeg = 0 + 5 * (1 + Math.sin(2 * g_seconds + phaseShift)) / 2;
        g_topRLowerLeg = -20 + 20 * (1 + Math.sin(2 * g_seconds + phaseShift)) / 2;
        g_topRFoot = -20 + 20 * (1 + Math.sin(2 * g_seconds + phaseShift)) / 2;

        g_bottomLUpperLeg = 0 + 20 * (1 + Math.sin(2 * g_seconds)) / 2;
        g_bottomLLowerLeg = -20 + 20 * (1 + Math.sin(2 * g_seconds)) / 2;
        g_bottomLFoot = -20 + 20 * (1 + Math.sin(2 * g_seconds)) / 2;
    }

    if(g_pokeAnimation){
        g_tailWiggle = wiggleAngle(g_seconds, 15, 4); // 15 degrees amplitude, 4 radians/sec frequency

        g_whiskerWiggle = wiggleAngle(g_seconds, 2, 10); // Smaller amplitude and higher frequency
        
        g_noseWiggle = wiggleAngle(g_seconds, 5, 5); // 5 degrees amplitude, 5 radians/sec frequency
    }

    if(g_upperLegAnimation){
        g_bottomLUpperLeg = 0 + 20 * (1 + Math.sin(2*g_seconds)) / 2;
    }

    if(g_lowerLegAnimation){
        g_bottomLLowerLeg = -20 + 20 * (1 + Math.sin(g_seconds*2)) / 2;
    }

    if(g_footAnimation){
        g_bottomLFoot = -20 + 20 * (1 + Math.sin(g_seconds*2)) / 2;
    }
    
}

function wiggleAngle(time, amplitude, frequency) {
    return amplitude * Math.sin(frequency * time);
}

function pokeAnimation(){
    if(g_pokeAnimation){
        g_pokeAnimation = false;
    }
    else{
        g_pokeAnimation = true;
    }
}

// Function to mark the scene as needing an update
function requestUpdate() {
    needsUpdate = true;
}

function updateSliderValue() {
    var angleSlider = document.getElementById('angleSlide');
    angleSlider.value = g_globalAngle % 360;
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    // Initialize mouse event handlers
    canvas.onmousedown = function(event) {
        mouseDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

        var shiftPressed = event.shiftKey; // Check if Shift key is pressed
        if (shiftPressed && event.button === 0) { // Check if left mouse button is clicked
            mouseDown = true;
            lastMouseX = event.clientX;
            lastMouseY = event.clientY;
            pokeAnimation(); // Trigger the animation
        }
    };

    canvas.onmouseup = function(event) {
        mouseDown = false;
    };

    canvas.onmousemove = function(event) {
        if (!mouseDown) {
            return;
        }
        var newX = event.clientX;
        var newY = event.clientY;
    
        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;
    
        g_globalAngle += -deltaX * 0.4;  // Adjust rotation sensitivity if necessary
        g_yGlobalAngle += deltaY * 0.2; // Adjust Y rotation based on mouse vertical movement
    
        updateSliderValue(); // Update both sliders
        lastMouseX = newX;
        lastMouseY = newY;
        requestUpdate();
    };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.5, 0.8, 1.0); // Ocean blue color

    requestAnimationFrame(tick);
}

// Draw every shape that is supposed to be on the canvas
function renderAllShapes(){

    // Check the time at the start of this function
    var startTime = performance.now();

    // Pass the matrix to u_ModelMatrix attribute
    var globalRotMatX = new Matrix4().setRotate(g_globalAngle, 0, 1, 0);
    var globalRotMatY = new Matrix4().setRotate(g_yGlobalAngle, 1, 0, 0);
    var globalRotMat = globalRotMatX.multiply(globalRotMatY);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawHamster();

    // Check the time at the end of the function, and show on the webpage
    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
    if(Math.floor(10000/duration)/10 <= 10){
        console.log("fps too low!");
    }
    // console.log("Rendered in " + Math.floor(duration) + " milliseconds. (" + Math.floor(10000/duration)/10 + " fps)");
}

function drawHamster() {
    // Main body
    var body = drawCube([0.76, 0.64, 0.52, 1.0]); // Brown color
    var bodyMatrix = new Matrix4();
    bodyMatrix.translate(0, -0.2, 0); // Centered on the canvas slightly lower
    bodyMatrix.scale(0.4, 0.3, 0.3); // Smaller body
    body.matrix = bodyMatrix;
    body.matrix.scale(1.7,1.7,1.7);
    body.render();
 
    // Head - attached to the body
    var head = drawCube([0.76, 0.64, 0.52, 1.0]); // Slightly lighter brown for the head
    var headMatrix = new Matrix4(bodyMatrix); // Start with the body's matrix

    // Neutralize the scaling effect from the body
    headMatrix.scale(1 / 0.4, 1 / 0.3, 1 / 0.3); // Reset scale to neutral based on the body's scale

    // Now apply head-specific transformations
    headMatrix.translate(0.4, 0.04, 0.05); // Position relative to the body, adjust these values as needed
    headMatrix.scale(0.1, 0.2, 0.2); // Apply the desired scale for the head

    // Set the matrix to the head object and render it
    head.matrix = headMatrix;
    head.render();


    let radius = 0.024;
    let color = [0.1, 0.1, 0.1, 1.0]; // Black color, fully opaque
    
    // Eye 1 - attached to the head
    let eye1Matrix = new Matrix4(headMatrix); // Start with the head's matrix
    eye1Matrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.2); // Neutralize head scaling
    eye1Matrix.translate(0.1, 0.12, 0.05); // Position relative to the head
    var eye1 = drawSphere(radius, color, eye1Matrix);
    eye1.render();
    
    // Eye 2 - attached to the head
    let eye2Matrix = new Matrix4(headMatrix); // Start with the head's matrix
    eye2Matrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.2); // Neutralize head scaling
    eye2Matrix.translate(0.1, 0.12, 0.15); // Position relative to the head
    var eye2 = drawSphere(radius, color, eye2Matrix);
    eye2.render();
    
    // Nose - attached to the head
    var nose = drawTriangularPrism([1.0, 0.75, 0.86, 1.0]); // Color for the nose
    var noseMatrix = new Matrix4(headMatrix); // Start with the head's matrix
    noseMatrix.rotate(g_noseWiggle/4, 0, 1, 0); // Wiggle the nose
    noseMatrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.2); // Neutralize head scaling
    noseMatrix.translate(0.068, 0.02, 0.1); // Position relative to the head
    noseMatrix.scale(0.05, 0.05, 0.05); // Scale the nose
    noseMatrix.rotate(90, 0, 1, 0); // Rotate the nose
    noseMatrix.rotate(60, 0, 0, 1); 
    nose.matrix = noseMatrix;
    nose.render();

    // Whiskers - attached to the nose:
    // Whisker 1 - attached to the nose
    var whisker1 = drawCube([0.9, 0.9, 0.9, 1.0]); // Light gray color for the whiskers
    var whisker1Matrix = new Matrix4(noseMatrix); // Start with the nose's matrix
    whisker1Matrix.rotate(g_whiskerWiggle, 0, 0, 1); // Wiggle the whisker
    whisker1Matrix.rotate(-60, 0, 0, 1); // Undo nose's last rotation
    whisker1Matrix.rotate(-90, 0, 1, 0); // Undo nose's first rotation
    whisker1Matrix.scale(20, 20, 20); // Undo nose's scaling

    whisker1Matrix.translate(0.032, 0.04, -0.05); // Positioning the whisker
    whisker1Matrix.rotate(90, 0, 1, 0); // Rotating to make the whisker horizontal
    whisker1Matrix.rotate(15, 0, 0, 1); // Tilting the whisker away from the face
    whisker1Matrix.scale(0.15, 0.01, 0.01); // Scaling to whisker dimensions
    whisker1.matrix = whisker1Matrix;
    whisker1.render();

    // Whisker 2 - attached to the nose
    var whisker2 = drawCube([0.9, 0.9, 0.9, 1.0]); // Light gray color for the whiskers
    var whisker2Matrix = new Matrix4(noseMatrix); // Start with the nose's matrix
    whisker2Matrix.rotate(g_whiskerWiggle, 0, 0, 1); // Wiggle the whisker

    whisker2Matrix.rotate(-60, 0, 0, 1); // Undo nose's last rotation
    whisker2Matrix.rotate(-90, 0, 1, 0); // Undo nose's first rotation
    whisker2Matrix.scale(20, 20, 20); // Undo nose's scaling

    whisker2Matrix.translate(0.032, -0.002, -0.045); // Positioning the whisker
    whisker2Matrix.rotate(90, 0, 1, 0); // Rotating to make the whisker horizontal
    whisker2Matrix.rotate(-15, 0, 0, 1); // Tilting the whisker away from the face
    whisker2Matrix.scale(0.15, 0.01, 0.01); // Scaling to whisker dimensions
    whisker2.matrix = whisker2Matrix;
    whisker2.render();

    // Whisker 3 - attached to the nose
    var whisker3 = drawCube([0.9, 0.9, 0.9, 1.0]); // Light gray color for the whiskers
    var whisker3Matrix = new Matrix4(noseMatrix); // Start with the nose's matrix
    whisker3Matrix.rotate(g_whiskerWiggle, 0, 0, 1); // Wiggle the whisker

    whisker3Matrix.rotate(-60, 0, 0, 1); // Undo nose's last rotation
    whisker3Matrix.rotate(-90, 0, 1, 0); // Undo nose's first rotation
    whisker3Matrix.scale(20, 20, 20); // Undo nose's scaling

    whisker3Matrix.translate(0.032, 0.02, -0.05); // Positioning the whisker
    whisker3Matrix.rotate(90, 0, 1, 0); // Rotating to make the whisker horizontal
    whisker3Matrix.rotate(0, 0, 0, 1); // Tilting the whisker away from the face
    whisker3Matrix.scale(0.15, 0.01, 0.01); // Scaling to whisker dimensions
    whisker3.matrix = whisker3Matrix;
    whisker3.render();

    // Whisker 4 - attached to the nose
    var whisker4 = drawCube([0.9, 0.9, 0.9, 1.0]); // Light gray color for the whiskers
    var whisker4Matrix = new Matrix4(noseMatrix); // Start with the nose's matrix
    whisker4Matrix.rotate(g_whiskerWiggle, 0, 0, 1); // Wiggle the whisker

    whisker4Matrix.rotate(-60, 0, 0, 1); // Undo nose's last rotation
    whisker4Matrix.rotate(-90, 0, 1, 0); // Undo nose's first rotation
    whisker4Matrix.scale(20, 20, 20); // Undo nose's scaling

    whisker4Matrix.translate(0.032, 0.02, 0.2); // Positioning the whisker
    whisker4Matrix.rotate(90, 0, 1, 0); // Rotating to make the whisker horizontal
    whisker4Matrix.rotate(0, 0, 0, 1); // Tilting the whisker away from the face
    whisker4Matrix.scale(0.15, 0.01, 0.01); // Scaling to whisker dimensions
    whisker4.matrix = whisker4Matrix;
    whisker4.render();

    // Whisker 5 - attached to the nose
    var whisker5 = drawCube([0.9, 0.9, 0.9, 1.0]); // Light gray color for the whiskers
    var whisker5Matrix = new Matrix4(noseMatrix); // Start with the nose's matrix
    whisker5Matrix.rotate(g_whiskerWiggle, 0, 0, 1); // Wiggle the whisker

    whisker5Matrix.rotate(-60, 0, 0, 1); // Undo nose's last rotation
    whisker5Matrix.rotate(-90, 0, 1, 0); // Undo nose's first rotation
    whisker5Matrix.scale(20, 20, 20); // Undo nose's scaling

    whisker5Matrix.translate(0.032, 0.08, 0.193); // Positioning the whisker
    whisker5Matrix.rotate(90, 0, 1, 0); // Rotating to make the whisker horizontal
    whisker5Matrix.rotate(-15, 0, 0, 1); // Tilting the whisker away from the face
    whisker5Matrix.scale(0.15, 0.01, 0.01); // Scaling to whisker dimensions
    whisker5.matrix = whisker5Matrix;
    whisker5.render();

    // Whisker 6 - attached to the nose
    var whisker6 = drawCube([0.9, 0.9, 0.9, 1.0]); // Light gray color for the whiskers
    var whisker6Matrix = new Matrix4(noseMatrix); // Start with the nose's matrix
    whisker6Matrix.rotate(g_whiskerWiggle, 0, 0, 1); // Wiggle the whisker

    whisker6Matrix.rotate(-60, 0, 0, 1); // Undo nose's last rotation
    whisker6Matrix.rotate(-90, 0, 1, 0); // Undo nose's first rotation
    whisker6Matrix.scale(20, 20, 20); // Undo nose's scaling

    whisker6Matrix.translate(0.032, -0.04, 0.193); // Positioning the whisker
    whisker6Matrix.rotate(90, 0, 1, 0); // Rotating to make the whisker horizontal
    whisker6Matrix.rotate(15, 0, 0, 1); // Tilting the whisker away from the face
    whisker6Matrix.scale(0.15, 0.01, 0.01); // Scaling to whisker dimensions
    whisker6.matrix = whisker6Matrix;
    whisker6.render();

    // Define ear properties
    let earColor = [0.76, 0.64, 0.52, 1.0]; // Same as the head for consistency
    let earRadius = 0.2; // Slightly larger than the eye

    // Ear 1 - Left Ear
    let ear1Matrix = new Matrix4(headMatrix); // Start with the head's matrix
    ear1Matrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.2); // Neutralize head scaling
    ear1Matrix.translate(0.05, 0.21, 0.18); // Adjust position relative to the head
    ear1Matrix.scale(0.07, 0.1, 0.07); // Elliptical shape, more elongated in Y
    var ear1 = drawSphere(earRadius, earColor, ear1Matrix);
    ear1.render();

    // Ear 2 - Right Ear
    let ear2Matrix = new Matrix4(headMatrix); // Start with the head's matrix
    ear2Matrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.2); // Neutralize head scaling
    ear2Matrix.translate(0.05, 0.21, 0.021); // Adjust position relative to the head
    ear2Matrix.scale(0.07, 0.1, 0.07); // Elliptical shape, more elongated in Y
    var ear2 = drawSphere(earRadius, earColor, ear2Matrix);
    ear2.render();

    // Tail properties
    var tail = drawCube([1.0, 0.75, 0.86, 1.0]); // Light gray color for the whiskers
    var tailMatrix = new Matrix4(noseMatrix); // Start with the nose's matrix
    tailMatrix.rotate(g_tailWiggle, 0, 0, 1); // Wiggle the whisker

    tailMatrix.rotate(-60, 0, 0, 1); // Undo nose's last rotation
    tailMatrix.rotate(-90, 0, 1, 0); // Undo nose's first rotation
    tailMatrix.scale(20, 20, 20); // Undo nose's scaling

    tailMatrix.translate(-0.52, 0.003, -0.01); // Positioning the whisker
    tailMatrix.rotate(90, 1, 0, 0); // Rotating to make the whisker horizontal
    tailMatrix.rotate(15, 0, 1, 0); // Tilting the whisker away from the face
    tailMatrix.scale(0.1, 0.025, 0.025); // Scaling to whisker dimensions
    tail.matrix = tailMatrix;
    tail.render();


    // Starting point for the tail (relative to the body)
    var tailMatrix = new Matrix4(bodyMatrix);
    tailMatrix.translate(-0.2, 0.1, 0.5); // Start at the back of the body
    tailMatrix.rotate(90, 0, 0, 1); // Rotate to make it stick out to the side
    

    // bottom left leg - attached to the body:
    // Made up of 3 parts: upper leg, lower leg, and foot
    var bottomLeftLegParts = bottomLeftLeg(bodyMatrix);
    bottomLeftLegParts.forEach(part => part.render());


    // bottom right leg - attached to the body:
    // Made up of 3 parts: upper leg, lower leg, and foot
    var bottomRightLegParts = bottomRightLeg(bodyMatrix);
    bottomRightLegParts.forEach(part => part.render());

    // top left leg - attached to the body:
    // Made up of 3 parts: upper leg, lower leg, and foot
    var topRightLegParts = topRightLeg(bodyMatrix);
    topRightLegParts.forEach(part => part.render());

    // top right leg -  attached to the body:
    // Made up of 3 parts: upper leg, lower leg, and foot
    var topLeftLegParts = topLeftLeg(bodyMatrix);
    topLeftLegParts.forEach(part => part.render());


}

function bottomLeftLeg(bodyMatrix) {
    // Bottom left leg - attached to the body:
    // Made up of 3 parts: upper leg, lower leg, and foot
    // Each part is a cube with different scales and rotations

    var bottomLeftLeg = [];

    var legColor = [0.8, 0.64, 0.46, 1.0]; // Color for the leg parts

    // Upper Leg
    var upperLeg = drawCube(legColor);
    var upperLegMatrix = new Matrix4(bodyMatrix); // Start with the body's matrix
    upperLegMatrix.rotate(g_bottomLUpperLeg, 0, 0, 1); // Rotate the upper leg
    upperLegMatrix.translate(0.05, -0.15, 0.01); // Position relative to the body
    upperLegMatrix.scale(0.1, 0.2, 0.1); // Scaling to the upper leg dimensions
    upperLeg.matrix = upperLegMatrix;
    bottomLeftLeg.push(upperLeg);

    // Lower Leg
    var lowerLeg = drawCube(legColor);
    var lowerLegMatrix = new Matrix4(upperLegMatrix); // Start with the upper leg's matrix

    // Neutralizing the scaling done to the upper leg
    lowerLegMatrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.1);

    // Applying lower leg specific transformations
    lowerLegMatrix.rotate(g_bottomLLowerLeg, 0, 0, 1); // Rotate the lower leg
    lowerLegMatrix.translate(0.01, -0.17, 0.01); 
    lowerLegMatrix.scale(0.08, 0.2, 0.08); 

    lowerLeg.matrix = lowerLegMatrix;
    bottomLeftLeg.push(lowerLeg);

    // Foot
    var foot = drawCube([1.0, 0.75, 0.86, 1.0]);
    var footMatrix = new Matrix4(lowerLegMatrix); // Start with the lower leg's matrix

    // Neutralizing the scaling done to the lower leg
    footMatrix.scale(1 / 0.08, 1 / 0.2, 1 / 0.08); // Neutralize the scaling of the lower leg

    // Applying foot specific transformations
    footMatrix.rotate(g_bottomLFoot, 0, 0, 1); // Rotate the lower leg
    footMatrix.translate(-0.01, -0.04, -0.02);
    footMatrix.scale(0.14, 0.07, 0.12); 

    foot.matrix = footMatrix;
    bottomLeftLeg.push(foot);

    return bottomLeftLeg;
}

function bottomRightLeg(bodyMatrix) {
    // Bottom right leg - attached to the body:
    // Made up of 3 parts: upper leg, lower leg, and foot
    // Each part is a cube with different scales and rotations

    var bottomLeftLeg = [];

    var legColor = [0.8, 0.64, 0.46, 1.0]; // Color for the leg parts

    // Upper Leg
    var upperLeg = drawCube(legColor);
    var upperLegMatrix = new Matrix4(bodyMatrix); // Start with the body's matrix
    upperLegMatrix.rotate(g_bottomRUpperLeg, 0, 0, 1); // Rotate the upper leg
    upperLegMatrix.translate(0.05, -0.15, 0.89); // Position relative to the body
    upperLegMatrix.scale(0.1, 0.2, 0.1); // Scaling to the upper leg dimensions
    upperLeg.matrix = upperLegMatrix;
    bottomLeftLeg.push(upperLeg);

    // Lower Leg
    var lowerLeg = drawCube(legColor);
    var lowerLegMatrix = new Matrix4(upperLegMatrix); // Start with the upper leg's matrix

    // Neutralizing the scaling done to the upper leg
    lowerLegMatrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.1);

    // Applying lower leg specific transformations
    lowerLegMatrix.rotate(g_bottomRLowerLeg, 0, 0, 1); // Rotate the lower leg
    lowerLegMatrix.translate(0.01, -0.17, 0.01); 
    lowerLegMatrix.scale(0.08, 0.2, 0.08); 

    lowerLeg.matrix = lowerLegMatrix;
    bottomLeftLeg.push(lowerLeg);

    // Foot
    var foot = drawCube([1.0, 0.75, 0.86, 1.0]);
    var footMatrix = new Matrix4(lowerLegMatrix); // Start with the lower leg's matrix

    // Neutralizing the scaling done to the lower leg
    footMatrix.scale(1 / 0.08, 1 / 0.2, 1 / 0.08); // Neutralize the scaling of the lower leg

    // Applying foot specific transformations
    footMatrix.rotate(g_bottomRFoot, 0, 0, 1); // Rotate the lower leg
    footMatrix.translate(-0.01, -0.04, -0.02);
    footMatrix.scale(0.14, 0.07, 0.12); 

    foot.matrix = footMatrix;
    bottomLeftLeg.push(foot);

    return bottomLeftLeg;
}

function topRightLeg(bodyMatrix) {
    // Top right leg - attached to the body:
    // Made up of 3 parts: upper leg, lower leg, and foot
    // Each part is a cube with different scales and rotations

    var bottomLeftLeg = [];

    var legColor = [0.8, 0.64, 0.46, 1.0]; // Color for the leg parts

    // Upper Leg
    var upperLeg = drawCube(legColor);
    var upperLegMatrix = new Matrix4(bodyMatrix); // Start with the body's matrix
    upperLegMatrix.rotate(g_topRUpperLeg, 0, 0, 1); // Rotate the upper leg
    upperLegMatrix.translate(0.85, -0.15, 0.89); // Position relative to the body
    upperLegMatrix.scale(0.1, 0.2, 0.1); // Scaling to the upper leg dimensions
    upperLeg.matrix = upperLegMatrix;
    bottomLeftLeg.push(upperLeg);

    // Lower Leg
    var lowerLeg = drawCube(legColor);
    var lowerLegMatrix = new Matrix4(upperLegMatrix); // Start with the upper leg's matrix

    // Neutralizing the scaling done to the upper leg
    lowerLegMatrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.1);

    // Applying lower leg specific transformations
    lowerLegMatrix.rotate(g_topRLowerLeg, 0, 0, 1); // Rotate the lower leg
    lowerLegMatrix.translate(0.01, -0.17, 0.01); 
    lowerLegMatrix.scale(0.08, 0.2, 0.08); 

    lowerLeg.matrix = lowerLegMatrix;
    bottomLeftLeg.push(lowerLeg);

    // Foot
    var foot = drawCube([1.0, 0.75, 0.86, 1.0]);
    var footMatrix = new Matrix4(lowerLegMatrix); // Start with the lower leg's matrix

    // Neutralizing the scaling done to the lower leg
    footMatrix.scale(1 / 0.08, 1 / 0.2, 1 / 0.08); // Neutralize the scaling of the lower leg

    // Applying foot specific transformations
    footMatrix.rotate(g_topRFoot, 0, 0, 1); // Rotate the lower leg
    footMatrix.translate(-0.01, -0.04, -0.02);
    footMatrix.scale(0.14, 0.07, 0.12); 

    foot.matrix = footMatrix;
    bottomLeftLeg.push(foot);

    return bottomLeftLeg;
}

function topLeftLeg(bodyMatrix) {
    // top left leg - attached to the body:
    // Made up of 3 parts: upper leg, lower leg, and foot
    // Each part is a cube with different scales and rotations

    var bottomLeftLeg = [];

    var legColor = [0.8, 0.64, 0.46, 1.0]; // Color for the leg parts

    // Upper Leg
    var upperLeg = drawCube(legColor);
    var upperLegMatrix = new Matrix4(bodyMatrix); // Start with the body's matrix
    upperLegMatrix.rotate(g_topLUpperLeg, 0, 0, 1); // Rotate the upper leg
    upperLegMatrix.translate(0.85, -0.15, 0.01); // Position relative to the body
    upperLegMatrix.scale(0.1, 0.2, 0.1); // Scaling to the upper leg dimensions
    upperLeg.matrix = upperLegMatrix;
    bottomLeftLeg.push(upperLeg);

    // Lower Leg
    var lowerLeg = drawCube(legColor);
    var lowerLegMatrix = new Matrix4(upperLegMatrix); // Start with the upper leg's matrix

    // Neutralizing the scaling done to the upper leg
    lowerLegMatrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.1);

    // Applying lower leg specific transformations
    lowerLegMatrix.rotate(g_topLLowerLeg, 0, 0, 1); // Rotate the lower leg
    lowerLegMatrix.translate(0.01, -0.17, 0.01); 
    lowerLegMatrix.scale(0.08, 0.2, 0.08); 

    lowerLeg.matrix = lowerLegMatrix;
    bottomLeftLeg.push(lowerLeg);

    // Foot
    var foot = drawCube([1.0, 0.75, 0.86, 1.0]);
    var footMatrix = new Matrix4(lowerLegMatrix); // Start with the lower leg's matrix

    // Neutralizing the scaling done to the lower leg
    footMatrix.scale(1 / 0.08, 1 / 0.2, 1 / 0.08); // Neutralize the scaling of the lower leg

    // Applying foot specific transformations
    footMatrix.rotate(g_topLFoot, 0, 0, 1); // Rotate the lower leg
    footMatrix.translate(-0.01, -0.04, -0.02);
    footMatrix.scale(0.14, 0.07, 0.12); 

    foot.matrix = footMatrix;
    bottomLeftLeg.push(foot);

    return bottomLeftLeg;
}

function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if (!htmlID){
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}
