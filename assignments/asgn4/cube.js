// Cube.js
class Cube extends Shape {
    constructor(matrix) {
        super(matrix);
        this.textureNum = -2;

        this.type = "cube";
        // Default white color for all faces, override using drawCube function
        this.colors = new Float32Array([
            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 1
            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 2

            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 3
            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 4

            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 5
            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 6

            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 7
            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 8
            
            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 9
            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 10

            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0, // Triangle 11
            1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0,     1.0, 1.0, 1.0, 1.0  // Triangle 12

        ]);
        // Set default vertices for a unit cube centered at the origin
        this.setVertices([
            // Front face
            0.0, 0.0, 0.0,   1.0, 0.0, 0.0,   0.0, 1.0, 0.0,  // Triangle 1
            1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // Triangle 2
            // Top face
            0.0, 1.0, 0.0,   1.0, 1.0, 0.0,   0.0, 1.0, 1.0,
            1.0, 1.0, 0.0,   1.0, 1.0, 1.0,   0.0, 1.0, 1.0,
            // Bottom face
            0.0, 0.0, 0.0,   1.0, 0.0, 0.0,   0.0, 0.0, 1.0,
            1.0, 0.0, 0.0,   1.0, 0.0, 1.0,   0.0, 0.0, 1.0,
            // Left face
            0.0, 0.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 1.0,
            0.0, 0.0, 0.0,   0.0, 0.0, 1.0,   0.0, 1.0, 1.0,
            // Right face
            1.0, 0.0, 0.0,   1.0, 1.0, 0.0,   1.0, 1.0, 1.0,
            1.0, 0.0, 0.0,   1.0, 0.0, 1.0,   1.0, 1.0, 1.0,
            // Back face
            0.0, 0.0, 1.0,   1.0, 0.0, 1.0,   0.0, 1.0, 1.0,
            1.0, 0.0, 1.0,   1.0, 1.0, 1.0,   0.0, 1.0, 1.0
        ]);
        this.uv = new Float32Array([
            // Front face
            0.0, 0.0,   1.0, 0.0,   0.0, 1.0, // Triangle 1
            1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // Triangle 2

            // Top face
            0.0, 0.0,   1.0, 0.0,   0.0, 1.0, // Triangle 3
            1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // Triangle 4

            // Bottom face
            0.0, 1.0,   1.0, 1.0,   0.0, 0.0, // Triangle 5
            1.0, 1.0,   1.0, 0.0,   0.0, 0.0, // Triangle 6

            // Left face
            1.0, 0.0,   1.0, 1.0,   0.0, 1.0, // Triangle 8
            1.0, 0.0,   0.0, 0.0,   0.0, 1.0, // Triangle 7

            // Right face
            0.0, 0.0,   0.0, 1.0,   1.0, 1.0, // Triangle 9
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0, // Triangle 10

            // Back face
            1.0, 0.0,   0.0, 0.0,   1.0, 1.0, // Triangle 11
            0.0, 0.0,   0.0, 1.0,   1.0, 1.0  // Triangle 12
        ]);
        // Define normals for each face of the cube
        this.normals = new Float32Array([
            // Front face normals
            0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,
            // Top face normals
            0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,
            // Bottom face normals
            0.0, -1.0, 0.0,   0.0, -1.0, 0.0,   0.0, -1.0, 0.0,
            0.0, -1.0, 0.0,   0.0, -1.0, 0.0,   0.0, -1.0, 0.0,
            // Left face normals
            -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,
            -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,   -1.0, 0.0, 0.0,
            // Right face normals
            1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,
            1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,
            // Back face normals
            0.0, 0.0, -1.0,   0.0, 0.0, -1.0,   0.0, 0.0, -1.0,
            0.0, 0.0, -1.0,   0.0, 0.0, -1.0,   0.0, 0.0, -1.0
        ]);
        this.initBuffers(); // Initialize buffers right after setting up vertex data
    }
    setVertices(vertices) {
        this.vertices = vertices;
    }

    initBuffers() {
        // Initialize vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        // Initialize color buffer
        this.colorBuffer = gl.createBuffer();
        this.updateColors();

        // Create buffer object for UV
        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uv), gl.STATIC_DRAW);

        // Create buffer object for Normals
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
    }

    setColor(color) {
        for (let i = 0; i < this.colors.length; i += 3) { // 4 components per vertex (RGBA)
            this.colors[i + 0] = color[0]; // R
            this.colors[i + 1] = color[1]; // G
            this.colors[i + 2] = color[2]; // B
            this.colors[i + 3] = color[3]; // A
        }
        this.updateColors(); // Apply the new colors to the buffer
    }

    updateColors() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
    }

    render() {
        super.render2();
    }
}

function drawCube(color, matrix) {
    var cube = new Cube(matrix);
    // console.log(cube.textureNum);
    // Set colors for each face
    for (let i = 0; i < 6; i++) {
        let baseIndex = i * 18; // 6 vertices per face, 3 components per vertex
        let darkFactor = 1 - (0.05 * i); // Darken each subsequent face
        for (let j = 0; j < 6; j++) { // 6 vertices per face
            cube.colors[baseIndex + j * 3 + 0] = color[0] * darkFactor; // R
            cube.colors[baseIndex + j * 3 + 1] = color[1] * darkFactor; // G
            cube.colors[baseIndex + j * 3 + 2] = color[2] * darkFactor; // B
        }
    }
    cube.updateColors(); // Apply the new colors to the buffer
    return cube;
}