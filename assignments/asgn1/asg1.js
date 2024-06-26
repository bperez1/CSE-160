// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    // gl_PointSize = 10.0;
    gl_PointSize = u_Size;
    
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() { 
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size; 
var g_clickedPoints = []; // This will store the list of coordinates

function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
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

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    } 
    // Get the storage location of u_Size
    u_Size   = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
      console.log('Failed to get the storage location of u_Size');
      return;
    }
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI elements
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=5;
let g_selectedType=POINT;

// Set up actions for HTML UI elements
function addActionsForHtmlUI(){
    // Button Events
    document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0];};
    document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0];};
    document.getElementById('clearButton').onclick = clearCanvas;

    document.getElementById('pointButton').onclick = function() { g_selectedType=POINT; };
    document.getElementById('triButton').onclick = function() { g_selectedType=TRIANGLE; };
    document.getElementById('circleButton').onclick = function() { g_selectedType=CIRCLE; };

    document.getElementById('drawingButton').onclick = createDrawing;
    document.getElementById('toggleOverlayButton').onclick = toggleOverlay;
    document.getElementById('toggleCoordsListButton').onclick = toggleCoordsList;

    // Color Slider Events
    document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });

    // Size Slider Events
    document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; });
}

// Clears the shapes and the coordinates list
function clearCanvas() {
    g_shapesList = []; // Clear the shapes array
    g_clickedPoints = []; // Clear the clicked points array
    updateClickedCoordinatesList(); // Update the coordinates list display
    renderAllShapes(); // Re-render the canvas
}

function toggleOverlay() {
    var overlayImage = document.getElementById('overlayImage');
    overlayImage.style.display = overlayImage.style.display === 'block' ? 'none' : 'block';
}

function toggleCoordsList() {
    var coordsList = document.getElementById('coordinatesList');
    coordsList.style.display = coordsList.style.display === 'block' ? 'none' : 'block';
}

function main() {
    // Set up canvas and gl variables
    setupWebGL();

    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    // Set up actions for HTML UI elements
    addActionsForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    //   canvas.onmousemove = click;
    canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) } };


    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes  = [];

function click(ev) {

    // Extract the event click and return it in WebGL coordinates
    let [x,y] = convertCoordinatesEventToGL(ev);
    let displayX = ((x + 1) / 2 * canvas.width).toFixed(2);
    let displayY = ((1 - y) / 2 * canvas.height).toFixed(2);

    let [webglX, webglY] = convertCoordinatesEventToGL2(ev);
    
    // Store the WebGL coordinates in the global array
    g_clickedPoints.push({ x: webglX, y: webglY });

    // Update the display of clicked coordinates
    updateClickedCoordinatesList();

    // Create and store the new point
    let shape;
    shapeParse(shape, [x,y]);
  
    // Draw every shape that is supposed to be on the canvas
    renderAllShapes();  
    updateCoordinateDisplay(displayX, displayY);
}

function shapeParse(shape, [x,y]){
    if(g_selectedType==POINT){
        shape = new Point();
    } else if (g_selectedType==TRIANGLE){
        shape = new Triangle();
    } else{
        shape = new Circle();
    }
    shape.position = [x,y];
    shape.color = g_selectedColor.slice();
    shape.size = g_selectedSize;
    g_shapesList.push(shape);
}

function updateCoordinateDisplay(x, y) {
    document.getElementById('coordinatesDisplay').textContent = `(${x}, ${y})`;
}

function updateClickedCoordinatesList() {
    var listHtml = "Clicked Coordinates:<br>";
    for (var i = 0; i < g_clickedPoints.length; ++i) {
        listHtml += `(${g_clickedPoints[i].x.toFixed(2)}, ${g_clickedPoints[i].y.toFixed(2)})<br>`;
    }
    document.getElementById('coordinatesList').innerHTML = listHtml;
}


// Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function convertCoordinatesEventToGL2(ev) {
    var x = ev.clientX; // x in browser space
    var y = ev.clientY; // y in browser space
    var rect = ev.target.getBoundingClientRect(); // get the canvas position and size

    // Convert to coordinates relative to the canvas
    x = x - rect.left;
    y = y - rect.top;

    // Normalize to [-1, 1], with y inverted
    x = (x / rect.width) * 2 - 1;
    y = 1 - (y / rect.height) * 2;

    return [x, y];
}

// Draw every shape that is supposed to be on the canvas
function renderAllShapes(){

    // Check the time at the start of this function
    var startTime = performance.now();

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw each shape in the list
    var len = g_shapesList.length;
    for(var i = 0; i < len; i++) {
        g_shapesList[i].render();
    }

    // Check the time at the end of the function, and show on the webpage
    var duration = performance.now() - startTime;
    sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID){
    var htmlElm = document.getElementById(htmlID);
    if (!htmlID){
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}


function createHeartShape() {
    const heartTriangles = [];
    // Define the heart using multiple triangles with color
    // Format: [[vertices], [color]]
    let pink = [1.0, 0.75, 0.79, 1.0];
    let purple = [0.63, 0.13, 0.94, 1.0]
    let red = [0.8, 0.0, 0.1, 1.0]

    let triangle1 = [-0.83, 0.23,   -0.63, 0.40,  -0.43, 0.24];
    let triangle2 = [-0.63, 0.40,   -0.44, 0.24,  -0.23, 0.40];
    let triangle3 = [-0.23, 0.40,   -0.44, 0.24,  -0.04, 0.25];
    let triangle4 = [-0.04, 0.25,    0.38, 0.27,   0.19, 0.42];
    let triangle5 = [0.19, 0.42,     0.38, 0.27,   0.58, 0.43];
    let triangle6 = [0.38, 0.27,   0.57, 0.43,  0.79, 0.29];
    let triangle7 = [-0.83, 0.23,   -0.63, 0.08,  -0.43, 0.24];
    let triangle8 = [0.39, 0.27,    0.79, 0.29,     0.59, 0.11];
    let triangle9 = [-0.83, 0.23, -0.62, 0.09, -0.82, -0.06];
    let triangle10 = [0.59, 0.11, 0.78, 0.29, 0.79, -0.03];
    let triangle11 = [-0.82, -0.06, -0.62, 0.09, -0.43, -0.06];
    let triangle12 = [0.39, -0.04, 0.59, 0.11, 0.79, -0.03];
    let triangle13 = [-0.82, -0.06, -0.61, -0.21, -0.43, -0.06];
    let triangle14 = [0.39, -0.04, 0.58, -0.20, 0.78, -0.03];
    let triangle15 = [-0.61, -0.21, -0.43, -0.06, -0.23, -0.21];
    let triangle16 = [0.40, -0.04, 0.19, -0.20, 0.58, -0.20];
    let triangle17 = [-0.61, -0.21, -0.24, -0.21, -0.42, -0.35];
    let triangle18 = [0.19, -0.20, 0.58, -0.20, 0.38, -0.35];
    let triangle19 = [-0.42, -0.35, -0.24, -0.205, -0.01, -0.35];
    let triangle20 = [-0.01, -0.35, 0.19, -0.20, 0.38, -0.35];
    let triangle21 = [-0.42, -0.35, -0.01, -0.35, -0.21, -0.51];
    let triangle22 = [-0.01, -0.35, 0.38, -0.35, 0.18, -0.51];
    let triangle23 = [-0.01, -0.35, -0.21, -0.51, 0.18, -0.51];
    let triangle24 = [-0.01, -0.66, -0.21, -0.51, 0.18, -0.51];
    
    heartTriangles.push([triangle1, purple]);
    heartTriangles.push([triangle2, red]);
    heartTriangles.push([triangle3, purple]);
    heartTriangles.push([triangle4, purple]);
    heartTriangles.push([triangle5, red]);
    heartTriangles.push([triangle6, purple]);
    heartTriangles.push([triangle7, red]);
    heartTriangles.push([triangle8, red]);
    heartTriangles.push([triangle9, purple]);
    heartTriangles.push([triangle10, purple]);
    heartTriangles.push([triangle11, red]);
    heartTriangles.push([triangle12, red]);
    heartTriangles.push([triangle13, purple]);
    heartTriangles.push([triangle14, purple]);
    heartTriangles.push([triangle15, red]);
    heartTriangles.push([triangle16, red]);
    heartTriangles.push([triangle17, purple]);
    heartTriangles.push([triangle18, purple]);
    heartTriangles.push([triangle19, red]);
    heartTriangles.push([triangle20, red]);
    heartTriangles.push([triangle21, purple]);
    heartTriangles.push([triangle22, purple]);
    heartTriangles.push([triangle23, red]);
    heartTriangles.push([triangle24, purple]);

    return heartTriangles;
}


function createDrawing() {
    let heart = createHeartShape();
    let translation = [0, 0];
    let rotationAngle = 0; // In degrees
    let scale = 1;

    // Function to update transformations
    function updateTransformations() {
        const radians = rotationAngle * Math.PI / 180;
        const cosB = Math.cos(radians);
        const sinB = Math.sin(radians);
        const matrix = [
            scale * cosB, scale * sinB, 0,
            -scale * sinB, scale * cosB, 0,
            translation[0], translation[1], 1
        ];
        return matrix;
    }

    // Function to render the heart
    function renderHeart() {
        const matrix = updateTransformations();
        heart.forEach(triangle => {
            drawTriangle2(transformTriangle(triangle[0], matrix), triangle[1]);
        });
    }    

    renderHeart(); // Call to render the heart with transformations
}

function transformTriangle(triangle, matrix) {
    let transformed = [];
    for (let i = 0; i < triangle.length; i += 2) {
        let x = triangle[i], y = triangle[i + 1];
        // Apply the transformation matrix
        let tx = x * matrix[0] + y * matrix[1] + matrix[6];
        let ty = x * matrix[3] + y * matrix[4] + matrix[7];
        transformed.push(tx, ty);
    }
    return transformed;
}
