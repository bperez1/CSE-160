// Vertex shader program
var VSHADER_SOURCE = `
    // Vertex Shader
    precision mediump float;

    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;

    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;

    attribute vec3 a_Color;
    varying vec3 v_Color;

    attribute vec2 a_UV;
    varying vec2 v_UV;

    attribute vec3 a_Normal;
    varying vec3 v_Normal;

    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
        v_Normal = a_Normal;
        v_Color = a_Color;
    }`;

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;

    varying vec3 v_Normal;
    varying vec2 v_UV;
    varying vec3 v_Color;

    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;

    uniform int u_whichTexture;
    uniform bool u_normalVisualization;

    void main() {
        if (u_normalVisualization) {
            gl_FragColor = vec4((v_Normal + 1.0) / 2.0, 1.0); // Normalize and visualize normal
        } else {
            if (u_whichTexture == -3) {
                gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0); // Use normal as debugging color
            } else if (u_whichTexture == -2) {
                gl_FragColor = vec4(v_Color, 1.0); // Use vertex color
            } else if (u_whichTexture == -1) {
                gl_FragColor = vec4(v_UV, 1.0, 1.0); // UV Debugging color
            } else if (u_whichTexture == 0) {
                gl_FragColor = texture2D(u_Sampler0, v_UV); // Use texture from sampler 0
            } else if (u_whichTexture == 1) {
                gl_FragColor = texture2D(u_Sampler1, v_UV); // Use texture from sampler 1
            } else if (u_whichTexture == 2) {
                gl_FragColor = texture2D(u_Sampler2, v_UV); // Use texture from sampler 2
            } else if (u_whichTexture == 3) {
                gl_FragColor = texture2D(u_Sampler3, v_UV); // Use texture from sampler 3
            } else {
                gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0); // Error case
            }
        }
    }`;

// Global Variables
let canvas;
let gl;
let camera;
let a_Position;
let a_Color;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let a_UV;
let a_Normal;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_whichTexture;
let u_normalVisualization;
let controlEnabled = false;
var keyStates = {};
let needsUpdate = true;
let normalVisualization = false;

// Global Variables for Mouse Interaction
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
let g_yGlobalAngle = 0;
let victory = false;

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, "a_UV");
  if (a_UV < 0) {
    console.log("Failed to get the storage location of a_UV");
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (a_Normal < 0) {
    console.log("Failed to get the storage location of a_UV");
    return;
  }

  a_Color = gl.getAttribLocation(gl.program, "a_Color");
  if (a_Color < 0) {
    console.log("Failed to get the storage location of a_Normal");
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  if (!u_ModelMatrix) {
    console.log("Failed to get the storage location of u_ModelMatrix");
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(
    gl.program,
    "u_GlobalRotateMatrix"
  );
  if (!u_GlobalRotateMatrix) {
    console.log("Failed to get the storage location of u_GlobalRotateMatrix");
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  if (!u_ViewMatrix) {
    console.log("Failed to get the storage location of u_ViewMatrix");
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  if (!u_ProjectionMatrix) {
    console.log("Failed to get the storage location of u_ProjectionMatrix");
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");
  if (!u_whichTexture) {
    console.log("Failed to get the storage location of u_whichtexture");
    return false;
  }

  u_normalVisualization = gl.getUniformLocation(
    gl.program,
    "u_normalVisualization"
  );
  if (!u_normalVisualization) {
    console.log("Failed to get the storage location of u_normalVisualization");
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

let g_globalAngle = 90;

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
let g_yJoseAngle = 0;

function addActionsForHtmlUI() {
  document.getElementById("animationUpperLegOffButton").onclick = function () {
    g_upperLegAnimation = false;
  };

  document.getElementById("animationUpperLegOnButton").onclick = function () {
    g_upperLegAnimation = true;
  };

  document.getElementById("animationLowerLegOffButton").onclick = function () {
    g_lowerLegAnimation = false;
  };
  document.getElementById("animationLowerLegOnButton").onclick = function () {
    g_lowerLegAnimation = true;
  };

  document.getElementById("animationFootOffButton").onclick = function () {
    g_footAnimation = false;
  };
  document.getElementById("animationFootOnButton").onclick = function () {
    g_footAnimation = true;
  };

  document.getElementById("animationBaseOffButton").onclick = function () {
    g_baseAnimation = false;
  };
  document.getElementById("animationBaseOnButton").onclick = function () {
    g_baseAnimation = true;
  };

  var angleSlider = document.getElementById("angleSlide");
  angleSlider.addEventListener("input", function () {
    g_globalAngle = parseInt(this.value);
    requestUpdate();
  });

  var yAngleSlider = document.getElementById("yAngleSlide");
  yAngleSlider.addEventListener("input", function () {
    g_yGlobalAngle = parseInt(this.value);
    requestUpdate();
  });

  document
    .getElementById("upperLegSlide")
    .addEventListener("input", function () {
      g_bottomLUpperLeg = this.value;
      requestUpdate();
    });

  document
    .getElementById("lowerLegSlide")
    .addEventListener("input", function () {
      g_bottomLLowerLeg = this.value;
      requestUpdate();
    });

  document.getElementById("footSlide").addEventListener("input", function () {
    g_bottomLFoot = this.value;
    requestUpdate();
  });

  document.getElementById("toggleNormals").onclick = function () {
    normalVisualization = !normalVisualization;
    gl.uniform1i(u_normalVisualization, normalVisualization);
    requestUpdate();
  };
}

function initTextures() {
  const texturePromises = [
    initTexture("lib/textures/starryNight.jpg", 0),
    initTexture("lib/textures/dirt.jpg", 1),
    initTexture("lib/textures/MossyStone.png", 2),
    initTexture("lib/textures/sky.jpg", 3),
  ];

  Promise.all(texturePromises)
    .then(() => {
      console.log("All textures loaded!");
      document.getElementById('canvas-container').style.display = 'flex';
      document.getElementById('loading-bar').style.display = 'none';
      requestAnimationFrame(tick);
    })
    .catch(error => {
      console.error("Error loading textures:", error);
    });
}

function initTexturesSequentially() {
  initTexture("lib/textures/starryNight.jpg", 0)
    .then(() => initTexture("lib/textures/dirt.jpg", 1))
    .then(() => initTexture("lib/textures/MossyStone.png", 2))
    .then(() => initTexture("lib/textures/sky.jpg", 3))
    .then(() => {
      console.log("All textures loaded!");
      document.getElementById('canvas-container').style.display = 'flex';
      document.getElementById('loading-bar').style.display = 'none';
      requestAnimationFrame(tick);
    })
    .catch(error => {
      console.error("Error loading textures:", error);
    });
}

let texturesLoaded = 0;
const totalTextures = 4;

function initTexture(imagePath, textureUnit) {
  return new Promise((resolve, reject) => {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    var image = new Image();
    image.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.uniform1i(gl.getUniformLocation(gl.program, `u_Sampler${textureUnit}`), textureUnit);
      console.log(`Texture ${textureUnit} loaded: ${imagePath}`);
      
      texturesLoaded++;
      updateLoadingProgress();
      resolve();
    };
    image.onerror = function () {
      console.error("Failed to load texture image:", imagePath);
      reject(`Failed to load texture image: ${imagePath}`);
    };
    image.src = imagePath;
  });
}

function updateLoadingProgress() {
    const progress = (texturesLoaded / totalTextures) * 100;
    document.getElementById('loading-bar-progress').style.width = `${progress}%`;
    if (texturesLoaded === totalTextures) { 
        document.getElementById('canvas-container').style.display = 'flex';
        document.getElementById('loading-bar').style.display = 'none';
        requestAnimationFrame(tick);
    }
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {
  updateCameraBasedOnKeys(camera);
  var currentTime = performance.now() / 1000.0;
  g_seconds = currentTime - g_startTime;

  updateAnimationAngles();
  let animation = true;

  if (needsUpdate || animation) {
    renderAllShapes();
    needsUpdate = false;
  }
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  var phaseShift = Math.PI;
  var rotationSpeed = 0.1; // Adjust speed of rotation
  g_yJoseAngle += rotationSpeed * g_seconds;

  if (g_baseAnimation) {
    g_topLUpperLeg = 0 + (5 * (1 + Math.sin(2 * g_seconds))) / 2;
    g_topLLowerLeg = -20 + (20 * (1 + Math.sin(2 * g_seconds))) / 2;
    g_topLFoot = -20 + (20 * (1 + Math.sin(2 * g_seconds))) / 2;

    g_bottomRUpperLeg =
      0 + (20 * (1 + Math.sin(2 * g_seconds + phaseShift))) / 2;
    g_bottomRLowerLeg =
      -20 + (20 * (1 + Math.sin(2 * g_seconds + phaseShift))) / 2;
    g_bottomRFoot = -20 + (20 * (1 + Math.sin(2 * g_seconds + phaseShift))) / 2;

    g_topRUpperLeg = 0 + (5 * (1 + Math.sin(2 * g_seconds + phaseShift))) / 2;
    g_topRLowerLeg =
      -20 + (20 * (1 + Math.sin(2 * g_seconds + phaseShift))) / 2;
    g_topRFoot = -20 + (20 * (1 + Math.sin(2 * g_seconds + phaseShift))) / 2;

    g_bottomLUpperLeg = 0 + (20 * (1 + Math.sin(2 * g_seconds))) / 2;
    g_bottomLLowerLeg = -20 + (20 * (1 + Math.sin(2 * g_seconds))) / 2;
    g_bottomLFoot = -20 + (20 * (1 + Math.sin(2 * g_seconds))) / 2;
  }

  if (g_pokeAnimation) {
    g_tailWiggle = wiggleAngle(g_seconds, 15, 4);

    g_whiskerWiggle = wiggleAngle(g_seconds, 2, 10);

    g_noseWiggle = wiggleAngle(g_seconds, 5, 5);
  }

  if (g_upperLegAnimation) {
    g_bottomLUpperLeg = 0 + (20 * (1 + Math.sin(2 * g_seconds))) / 2;
  }

  if (g_lowerLegAnimation) {
    g_bottomLLowerLeg = -20 + (20 * (1 + Math.sin(g_seconds * 2))) / 2;
  }

  if (g_footAnimation) {
    g_bottomLFoot = -20 + (20 * (1 + Math.sin(g_seconds * 2))) / 2;
  }
}

function wiggleAngle(time, amplitude, frequency) {
  return amplitude * Math.sin(frequency * time);
}

function pokeAnimation() {
  if (g_pokeAnimation) {
    g_pokeAnimation = false;
  } else {
    g_pokeAnimation = true;
  }
}

function requestUpdate() {
  needsUpdate = true;
}

function updateSliderValue() {
  var angleSlider = document.getElementById("angleSlide");
  angleSlider.value = g_globalAngle % 360;
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  camera = new Camera(canvas);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(
    u_ProjectionMatrix,
    false,
    camera.projectionMatrix.elements
  );

  addActionsForHtmlUI();
  // initTextures();
  initTexturesSequentially();
  initEventHandlers(camera);

  gl.clearColor(0.0, 0.5, 0.8, 1.0);

  // requestAnimationFrame(tick);
}

function updateCameraUniforms(camera) {
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(
    u_ProjectionMatrix,
    false,
    camera.projectionMatrix.elements
  );
}

function initEventHandlers(camera) {
  controlEnabled = false;

  canvas.onmousedown = function (event) {
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

    if (event.ctrlKey && event.button === 0) {
      controlEnabled = !controlEnabled;
      if (controlEnabled) {
        canvas.requestPointerLock = canvas.requestPointerLock;
        canvas.requestPointerLock();
      } else {
        document.exitPointerLock = document.exitPointerLock;
        document.exitPointerLock();
        canvas.style.cursor = "auto";
      }
    } else if (event.altKey && event.button === 0) {
      mouseDown = true;
      rotateMode = true;
    } else if (event.button === 0) {
      mouseDown = true;
      rotateMode = false;
    }

    if (event.shiftKey && event.button === 0) {
      pokeAnimation();
    }
  };

  canvas.onmouseup = function (event) {
    mouseDown = false;
    rotateMode = false;
  };

  canvas.onmousemove = function (event) {
    if (!mouseDown) {
      return;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = newX - lastMouseX;
    var deltaY = newY - lastMouseY;

    if (rotateMode && event.altKey) {
      g_globalAngle += -deltaX * 0.4;
      g_yGlobalAngle += deltaY * 0.2;
      updateSliderValue();
    } else if (!event.altKey) {
      camera.panHorizontal(-deltaX * 0.4);
      camera.panVertical(-deltaY * 0.2);
      updateCameraUniforms(camera);
    }

    lastMouseX = newX;
    lastMouseY = newY;
  };

  document.onkeydown = function (e) {
    keyStates[e.key] = true;
  };

  document.onkeyup = function (e) {
    keyStates[e.key] = false;
  };

  document.addEventListener("pointerlockchange", lockChangeAlert, false);

  function lockChangeAlert() {
    if (document.pointerLockElement === canvas) {
      console.log("The pointer lock status is now locked");
      document.addEventListener("mousemove", updatePosition, false);
    } else {
      console.log("The pointer lock status is now unlocked");
      document.removeEventListener("mousemove", updatePosition, false);
    }
  }

  function updatePosition(e) {
    if (!controlEnabled) return;

    let movementX = e.movementX || 0;
    let movementY = e.movementY || 0;

    let sensitivityFactor = 0.3;

    camera.panHorizontal(-movementX * sensitivityFactor);
    updateCameraUniforms(camera);
  }
}

function updateCameraBasedOnKeys(camera) {
  const speed = 0.1;
  const angle = 5 / 50;

  if (keyStates["w"]) {
    camera.moveForward(speed);
  }
  if (keyStates["s"]) {
    camera.moveBackwards(speed);
  }
  if (keyStates["a"]) {
    camera.moveLeft(speed);
  }
  if (keyStates["d"]) {
    camera.moveRight(speed);
  }
  if (keyStates["q"]) {
    camera.panLeft(angle);
  }
  if (keyStates["e"]) {
    camera.panRight(angle);
  }
  if (!controlEnabled) {
    if (keyStates["r"]) {
      camera.moveUp(speed / 15);
    }
    if (keyStates["f"]) {
      camera.moveDown(speed / 15);
    }
  }

  if (controlEnabled) {
    camera.updateVerticalAt(1.5);
  }

  if (
    keyStates["w"] ||
    keyStates["s"] ||
    keyStates["a"] ||
    keyStates["d"] ||
    keyStates["q"] ||
    keyStates["e"] ||
    keyStates["r"] ||
    keyStates["f"]
  ) {
    updateCameraUniforms(camera);
  }
}

function renderAllShapes() {
  // console.log(camera.eye.elements);
  var startTime = performance.now();

  var globalRotMatX = new Matrix4().setRotate(g_globalAngle, 0, 1, 0);
  var globalRotMatY = new Matrix4().setRotate(g_yGlobalAngle, 1, 0, 0);
  var globalRotMat = globalRotMatX.multiply(globalRotMatY);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Render the ground
  var body = new Cube();
  body.setColor( [0.5, 0.5, 0.5, 1.0] ); // Grey
  body.matrix.translate(0, 0, 0.0);
  body.matrix.scale(33, -0.01, 33);
  body.matrix.translate(-0.5, 0, -0.5);
  body.textureNum = 1;
  body.render();

  // Render the sky
  var sky = new Cube();
  sky.color = [1.0, 0.0, 0.0, 1.0];
  sky.textureNum = 1;
  sky.matrix.scale(-70, -70, -70);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.textureNum = 0;
  sky.render();

  // Render the hamster
  drawHamster();

  var exampleCube = new Cube();
  purple = [0.5, 0.0, 0.5, 1.0]; // Blue + Red = Purple
  exampleCube.setColor(purple); // Purple
  exampleCube.textureNum = -2;
  exampleCube.matrix.translate(1, 2, 1);
  exampleCube.render();

  var exampleCube2;
  var exampleCube2Matrix = new Matrix4();
  exCubeColor = purple;
  exampleCube2 = drawCube(exCubeColor);
  exampleCube2.textureNum = -3;
  exampleCube2Matrix.translate(0, 1, 1);
  exampleCube2.matrix = exampleCube2Matrix;
  exampleCube2.render();

  var exampleSphere = new Sphere(1, 24, new Matrix4());
  cyan = [0.0, 0.5, 0.5, 1.0]; // Green + Blue = Cyan
  exampleSphere.setColor(cyan); // Cyan
  exampleSphere.textureNum = 3;
  exampleSphere.matrix.translate(2, 2, -2);
  exampleSphere.render();

  var exampleSphere2;
  var exampleSphere2Matrix = new Matrix4();
  exSphereColor = [0.2, 0.3, 0.4, 1.0]; // Blue + Green = Teal
  exampleSphere2Matrix.translate(0, 3, -2);
  var subdivisions = 24;
  exampleSphere2 = drawSphere(
    1,
    exSphereColor,
    exampleSphere2Matrix,
    subdivisions
  );
  exampleSphere2.textureNum = 1;
  exampleSphere2.render();

  var duration = performance.now() - startTime;
  sendTextToHTML(
    " ms: " +
      Math.floor(duration) +
      " fps: " +
      Math.floor(10000 / duration) / 10,
    "numdot"
  );
  if (Math.floor(10000 / duration) / 10 <= 10) {
    console.log("fps too low!");
  }
}

function drawHamster() {
  var body = drawCube([0.76, 0.64, 0.52, 1.0]);
  var bodyMatrix = new Matrix4();
  bodyMatrix.translate(-1, 1, -2);
  bodyMatrix.scale(0.4, 0.3, 0.3);
  if (victory) {
    bodyMatrix.rotate(g_yJoseAngle, 1, 0, 1); // Apply Y-axis rotation
  }
  body.matrix = bodyMatrix;
  body.matrix.scale(1.7, 1.7, 1.7);
  body.textureNum = -2;
  body.render();

  var head = drawCube([0.76, 0.64, 0.52, 1.0]);
  var headMatrix = new Matrix4(bodyMatrix);
  headMatrix.scale(1 / 0.4, 1 / 0.3, 1 / 0.3);
  headMatrix.translate(0.4, 0.04, 0.05);
  headMatrix.scale(0.1, 0.2, 0.2);
  head.matrix = headMatrix;
  head.textureNum = -2;
  head.render();

  let radius = 0.024;
  let color = [0.1, 0.1, 0.1, 1.0];

  let eye1Matrix = new Matrix4(headMatrix);
  eye1Matrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.2);
  eye1Matrix.translate(0.1, 0.12, 0.05);
  var eye1 = drawSphere(radius, color, eye1Matrix);
  eye1.textureNum = -2;
  eye1.render();

  let eye2Matrix = new Matrix4(headMatrix);
  eye2Matrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.2);
  eye2Matrix.translate(0.1, 0.12, 0.15);
  var eye2 = drawSphere(radius, color, eye2Matrix);
  eye2.textureNum = -2;
  eye2.render();

  var nose = drawTriangularPrism([1.0, 0.75, 0.86, 1.0]);
  var noseMatrix = new Matrix4(headMatrix);
  noseMatrix.rotate(g_noseWiggle / 4, 0, 1, 0);
  noseMatrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.2);
  noseMatrix.translate(0.068, 0.02, 0.1);
  noseMatrix.scale(0.05, 0.05, 0.05);
  noseMatrix.rotate(90, 0, 1, 0);
  noseMatrix.rotate(60, 0, 0, 1);
  nose.matrix = noseMatrix;
  nose.textureNum = -2;
  nose.render();

  var whisker1 = drawCube([0.9, 0.9, 0.9, 1.0]);
  var whisker1Matrix = new Matrix4(noseMatrix);
  whisker1Matrix.rotate(g_whiskerWiggle, 0, 0, 1);
  whisker1Matrix.rotate(-60, 0, 0, 1);
  whisker1Matrix.rotate(-90, 0, 1, 0);
  whisker1Matrix.scale(20, 20, 20);
  whisker1Matrix.translate(0.032, 0.04, -0.05);
  whisker1Matrix.rotate(90, 0, 1, 0);
  whisker1Matrix.rotate(15, 0, 0, 1);
  whisker1Matrix.scale(0.15, 0.01, 0.01);
  whisker1.matrix = whisker1Matrix;
  whisker1.render();

  var whisker2 = drawCube([0.9, 0.9, 0.9, 1.0]);
  var whisker2Matrix = new Matrix4(noseMatrix);
  whisker2Matrix.rotate(g_whiskerWiggle, 0, 0, 1);
  whisker2Matrix.rotate(-60, 0, 0, 1);
  whisker2Matrix.rotate(-90, 0, 1, 0);
  whisker2Matrix.scale(20, 20, 20);
  whisker2Matrix.translate(0.032, -0.002, -0.045);
  whisker2Matrix.rotate(90, 0, 1, 0);
  whisker2Matrix.rotate(-15, 0, 0, 1);
  whisker2Matrix.scale(0.15, 0.01, 0.01);
  whisker2.matrix = whisker2Matrix;
  whisker2.render();

  var whisker3 = drawCube([0.9, 0.9, 0.9, 1.0]);
  var whisker3Matrix = new Matrix4(noseMatrix);
  whisker3Matrix.rotate(g_whiskerWiggle, 0, 0, 1);
  whisker3Matrix.rotate(-60, 0, 0, 1);
  whisker3Matrix.rotate(-90, 0, 1, 0);
  whisker3Matrix.scale(20, 20, 20);
  whisker3Matrix.translate(0.032, 0.02, -0.05);
  whisker3Matrix.rotate(90, 0, 1, 0);
  whisker3Matrix.rotate(0, 0, 0, 1);
  whisker3Matrix.scale(0.15, 0.01, 0.01);
  whisker3.matrix = whisker3Matrix;
  whisker3.render();

  var whisker4 = drawCube([0.9, 0.9, 0.9, 1.0]);
  var whisker4Matrix = new Matrix4(noseMatrix);
  whisker4Matrix.rotate(g_whiskerWiggle, 0, 0, 1);
  whisker4Matrix.rotate(-60, 0, 0, 1);
  whisker4Matrix.rotate(-90, 0, 1, 0);
  whisker4Matrix.scale(20, 20, 20);
  whisker4Matrix.translate(0.032, 0.02, 0.2);
  whisker4Matrix.rotate(90, 0, 1, 0);
  whisker4Matrix.rotate(0, 0, 0, 1);
  whisker4Matrix.scale(0.15, 0.01, 0.01);
  whisker4.matrix = whisker4Matrix;
  whisker4.render();

  var whisker5 = drawCube([0.9, 0.9, 0.9, 1.0]);
  var whisker5Matrix = new Matrix4(noseMatrix);
  whisker5Matrix.rotate(g_whiskerWiggle, 0, 0, 1);
  whisker5Matrix.rotate(-60, 0, 0, 1);
  whisker5Matrix.rotate(-90, 0, 1, 0);
  whisker5Matrix.scale(20, 20, 20);
  whisker5Matrix.translate(0.032, 0.08, 0.193);
  whisker5Matrix.rotate(90, 0, 1, 0);
  whisker5Matrix.rotate(-15, 0, 0, 1);
  whisker5Matrix.scale(0.15, 0.01, 0.01);
  whisker5.matrix = whisker5Matrix;
  whisker5.render();

  var whisker6 = drawCube([0.9, 0.9, 0.9, 1.0]);
  var whisker6Matrix = new Matrix4(noseMatrix);
  whisker6Matrix.rotate(g_whiskerWiggle, 0, 0, 1);
  whisker6Matrix.rotate(-60, 0, 0, 1);
  whisker6Matrix.rotate(-90, 0, 1, 0);
  whisker6Matrix.scale(20, 20, 20);
  whisker6Matrix.translate(0.032, -0.04, 0.193);
  whisker6Matrix.rotate(90, 0, 1, 0);
  whisker6Matrix.rotate(15, 0, 0, 1);
  whisker6Matrix.scale(0.15, 0.01, 0.01);
  whisker6.matrix = whisker6Matrix;
  whisker6.render();

  let earColor = [0.76, 0.64, 0.52, 1.0];
  let earRadius = 0.2;

  let ear1Matrix = new Matrix4(headMatrix);
  ear1Matrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.2);
  ear1Matrix.translate(0.05, 0.21, 0.18);
  ear1Matrix.scale(0.07, 0.1, 0.07);
  var ear1 = drawSphere(earRadius, earColor, ear1Matrix);
  ear1.textureNum = -2;
  ear1.render();

  let ear2Matrix = new Matrix4(headMatrix);
  ear2Matrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.2);
  ear2Matrix.translate(0.05, 0.21, 0.021);
  ear2Matrix.scale(0.07, 0.1, 0.07);
  var ear2 = drawSphere(earRadius, earColor, ear2Matrix);
  ear2.textureNum = -2;
  ear2.render();

  var tail = drawCube([1.0, 0.75, 0.86, 1.0]);
  var tailMatrix = new Matrix4(noseMatrix);
  tailMatrix.rotate(g_tailWiggle, 0, 0, 1);
  tailMatrix.rotate(-60, 0, 0, 1);
  tailMatrix.rotate(-90, 0, 1, 0);
  tailMatrix.scale(20, 20, 20);
  tailMatrix.translate(-0.52, 0.003, -0.01);
  tailMatrix.rotate(90, 1, 0, 0);
  tailMatrix.rotate(15, 0, 1, 0);
  tailMatrix.scale(0.1, 0.025, 0.025);
  tail.matrix = tailMatrix;
  tail.render();

  var tailMatrix = new Matrix4(bodyMatrix);
  tailMatrix.translate(-0.2, 0.1, 0.5);
  tailMatrix.rotate(90, 0, 0, 1);

  var bottomLeftLegParts = bottomLeftLeg(bodyMatrix);
  bottomLeftLegParts.forEach((part) => (part.textureNum = -2));
  bottomLeftLegParts.forEach((part) => part.render());

  var bottomRightLegParts = bottomRightLeg(bodyMatrix);
  bottomRightLegParts.forEach((part) => part.render());

  var topRightLegParts = topRightLeg(bodyMatrix);
  topRightLegParts.forEach((part) => (part.textureNum = -2));
  topRightLegParts.forEach((part) => part.render());

  var topLeftLegParts = topLeftLeg(bodyMatrix);
  topLeftLegParts.forEach((part) => part.render());
}

function bottomLeftLeg(bodyMatrix) {
  var bottomLeftLeg = [];
  var legColor = [0.8, 0.64, 0.46, 1.0];

  var upperLeg = drawCube(legColor);
  var upperLegMatrix = new Matrix4(bodyMatrix);
  upperLegMatrix.rotate(g_bottomLUpperLeg, 0, 0, 1);
  upperLegMatrix.translate(0.05, -0.15, 0.01);
  upperLegMatrix.scale(0.1, 0.2, 0.1);
  upperLeg.matrix = upperLegMatrix;
  bottomLeftLeg.push(upperLeg);

  var lowerLeg = drawCube(legColor);
  var lowerLegMatrix = new Matrix4(upperLegMatrix);
  lowerLegMatrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.1);
  lowerLegMatrix.rotate(g_bottomLLowerLeg, 0, 0, 1);
  lowerLegMatrix.translate(0.01, -0.17, 0.01);
  lowerLegMatrix.scale(0.08, 0.2, 0.08);
  lowerLeg.matrix = lowerLegMatrix;
  bottomLeftLeg.push(lowerLeg);

  var foot = drawCube([1.0, 0.75, 0.86, 1.0]);
  var footMatrix = new Matrix4(lowerLegMatrix);
  footMatrix.scale(1 / 0.08, 1 / 0.2, 1 / 0.08);
  footMatrix.rotate(g_bottomLFoot, 0, 0, 1);
  footMatrix.translate(-0.01, -0.04, -0.02);
  footMatrix.scale(0.14, 0.07, 0.12);
  foot.matrix = footMatrix;
  bottomLeftLeg.push(foot);

  return bottomLeftLeg;
}

function bottomRightLeg(bodyMatrix) {
  var bottomLeftLeg = [];
  var legColor = [0.8, 0.64, 0.46, 1.0];

  var upperLeg = drawCube(legColor);
  var upperLegMatrix = new Matrix4(bodyMatrix);
  upperLegMatrix.rotate(g_bottomRUpperLeg, 0, 0, 1);
  upperLegMatrix.translate(0.05, -0.15, 0.89);
  upperLegMatrix.scale(0.1, 0.2, 0.1);
  upperLeg.matrix = upperLegMatrix;
  bottomLeftLeg.push(upperLeg);

  var lowerLeg = drawCube(legColor);
  var lowerLegMatrix = new Matrix4(upperLegMatrix);
  lowerLegMatrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.1);
  lowerLegMatrix.rotate(g_bottomRLowerLeg, 0, 0, 1);
  lowerLegMatrix.translate(0.01, -0.17, 0.01);
  lowerLegMatrix.scale(0.08, 0.2, 0.08);
  lowerLeg.matrix = lowerLegMatrix;
  bottomLeftLeg.push(lowerLeg);

  var foot = drawCube([1.0, 0.75, 0.86, 1.0]);
  var footMatrix = new Matrix4(lowerLegMatrix);
  footMatrix.scale(1 / 0.08, 1 / 0.2, 1 / 0.08);
  footMatrix.rotate(g_bottomRFoot, 0, 0, 1);
  footMatrix.translate(-0.01, -0.04, -0.02);
  footMatrix.scale(0.14, 0.07, 0.12);
  foot.matrix = footMatrix;
  bottomLeftLeg.push(foot);

  return bottomLeftLeg;
}

function topRightLeg(bodyMatrix) {
  var bottomLeftLeg = [];
  var legColor = [0.8, 0.64, 0.46, 1.0];

  var upperLeg = drawCube(legColor);
  var upperLegMatrix = new Matrix4(bodyMatrix);
  upperLegMatrix.rotate(g_topRUpperLeg, 0, 0, 1);
  upperLegMatrix.translate(0.85, -0.15, 0.89);
  upperLegMatrix.scale(0.1, 0.2, 0.1);
  upperLeg.matrix = upperLegMatrix;
  bottomLeftLeg.push(upperLeg);

  var lowerLeg = drawCube(legColor);
  var lowerLegMatrix = new Matrix4(upperLegMatrix);
  lowerLegMatrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.1);
  lowerLegMatrix.rotate(g_topRLowerLeg, 0, 0, 1);
  lowerLegMatrix.translate(0.01, -0.17, 0.01);
  lowerLegMatrix.scale(0.08, 0.2, 0.08);
  lowerLeg.matrix = lowerLegMatrix;
  bottomLeftLeg.push(lowerLeg);

  var foot = drawCube([1.0, 0.75, 0.86, 1.0]);
  var footMatrix = new Matrix4(lowerLegMatrix);
  footMatrix.scale(1 / 0.08, 1 / 0.2, 1 / 0.08);
  footMatrix.rotate(g_topRFoot, 0, 0, 1);
  footMatrix.translate(-0.01, -0.04, -0.02);
  footMatrix.scale(0.14, 0.07, 0.12);
  foot.matrix = footMatrix;
  bottomLeftLeg.push(foot);

  return bottomLeftLeg;
}

function topLeftLeg(bodyMatrix) {
  var bottomLeftLeg = [];
  var legColor = [0.8, 0.64, 0.46, 1.0];

  var upperLeg = drawCube(legColor);
  var upperLegMatrix = new Matrix4(bodyMatrix);
  upperLegMatrix.rotate(g_topLUpperLeg, 0, 0, 1);
  upperLegMatrix.translate(0.85, -0.15, 0.01);
  upperLegMatrix.scale(0.1, 0.2, 0.1);
  upperLeg.matrix = upperLegMatrix;
  bottomLeftLeg.push(upperLeg);

  var lowerLeg = drawCube(legColor);
  var lowerLegMatrix = new Matrix4(upperLegMatrix);
  lowerLegMatrix.scale(1 / 0.1, 1 / 0.2, 1 / 0.1);
  lowerLegMatrix.rotate(g_topLLowerLeg, 0, 0, 1);
  lowerLegMatrix.translate(0.01, -0.17, 0.01);
  lowerLegMatrix.scale(0.08, 0.2, 0.08);
  lowerLeg.matrix = lowerLegMatrix;
  bottomLeftLeg.push(lowerLeg);

  var foot = drawCube([1.0, 0.75, 0.86, 1.0]);
  var footMatrix = new Matrix4(lowerLegMatrix);
  footMatrix.scale(1 / 0.08, 1 / 0.2, 1 / 0.08);
  footMatrix.rotate(g_topLFoot, 0, 0, 1);
  footMatrix.translate(-0.01, -0.04, -0.02);
  footMatrix.scale(0.14, 0.07, 0.12);
  foot.matrix = footMatrix;
  bottomLeftLeg.push(foot);

  return bottomLeftLeg;
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlID) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function getFrustumPlanes(projectionMatrix, viewMatrix) {
  let m = new Matrix4();
  m.set(projectionMatrix).multiply(viewMatrix);
  let planes = [];

  // Left plane
  planes.push(
    new Vector4(
      m.elements[3] + m.elements[0],
      m.elements[7] + m.elements[4],
      m.elements[11] + m.elements[8],
      m.elements[15] + m.elements[12]
    )
  );

  // Right plane
  planes.push(
    new Vector4(
      m.elements[3] - m.elements[0],
      m.elements[7] - m.elements[4],
      m.elements[11] - m.elements[8],
      m.elements[15] - m.elements[12]
    )
  );

  // Bottom plane
  planes.push(
    new Vector4(
      m.elements[3] + m.elements[1],
      m.elements[7] + m.elements[5],
      m.elements[11] + m.elements[9],
      m.elements[15] + m.elements[13]
    )
  );

  // Top plane
  planes.push(
    new Vector4(
      m.elements[3] - m.elements[1],
      m.elements[7] - m.elements[5],
      m.elements[11] - m.elements[9],
      m.elements[15] - m.elements[13]
    )
  );

  // Near plane
  planes.push(
    new Vector4(
      m.elements[3] + m.elements[2],
      m.elements[7] + m.elements[6],
      m.elements[11] + m.elements[10],
      m.elements[15] + m.elements[14]
    )
  );

  // Far plane
  planes.push(
    new Vector4(
      m.elements[3] - m.elements[2],
      m.elements[7] - m.elements[6],
      m.elements[11] - m.elements[10],
      m.elements[15] - m.elements[14]
    )
  );

  return planes;
}

function isCubeInFrustum(cubeCenter, cubeSize, planes) {
  for (let plane of planes) {
    let distance =
      plane.elements[0] * cubeCenter[0] +
      plane.elements[1] * cubeCenter[1] +
      plane.elements[2] * cubeCenter[2] +
      plane.elements[3];
    if (distance < -cubeSize / 2) {
      return false;
    }
  }
  return true;
}
