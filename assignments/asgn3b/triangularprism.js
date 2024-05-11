class TriangularPrism extends Shape {
    constructor(matrix, color) {
        super(matrix);
        this.type = "triangularPrism";
        this.baseColor = color; // Expect an array [r, g, b, a]
        this.vertices = [];
        this.colors = [];
        this.textureNum = -2;
        this.generatePrism();
        this.initBuffers();
    }

    generatePrism() {
        // Vertices of the triangular base
        let bottomFrontLeft = [0.0, 0.0, 0.0];
        let bottomFrontRight = [1.0, 0.0, 0.0];
        let bottomBack = [0.5, Math.sqrt(0.75), 0.0];

        let topFrontLeft = [0.0, 0.0, 1.0];
        let topFrontRight = [1.0, 0.0, 1.0];
        let topBack = [0.5, Math.sqrt(0.75), 1.0];

        // Define faces and their color intensities
        this.addFace(bottomFrontLeft, bottomFrontRight, topFrontRight, topFrontLeft, this.modifyColor(1)); // Front face normal color
        this.addFace(bottomFrontRight, bottomBack, topBack, topFrontRight, this.modifyColor(0.8)); // Right face darker
        this.addFace(bottomBack, bottomFrontLeft, topFrontLeft, topBack, this.modifyColor(0.8)); // Left face darker
        this.addTriangle(bottomFrontLeft, bottomFrontRight, bottomBack, this.modifyColor(0.9)); // Bottom triangle slightly darker
        this.addTriangle(topFrontLeft, topFrontRight, topBack, this.modifyColor(0.9)); // Top triangle slightly darker

        this.colors = new Float32Array(this.colors);
        this.vertices = new Float32Array(this.vertices);
    }

    addFace(v1, v2, v3, v4, color) {
        // Two triangles to form a rectangle
        this.addTriangle(v1, v2, v3, color);
        this.addTriangle(v1, v3, v4, color);
    }

    addTriangle(v1, v2, v3, color) {
        this.vertices.push(...v1, ...v2, ...v3);
        for (let i = 0; i < 3; i++) {
            this.colors.push(...color);
        }
    }

    modifyColor(intensity) {
        // Modify the base color by the intensity factor for shading
        return this.baseColor.map(c => c * intensity);
    }

    initBuffers() {
        super.initBuffers();
        // Vertex buffer initialization
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        // Color buffer initialization
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
    }

    render() {
        // Pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    }
}

function drawTriangularPrism(color, matrix) {
    if (!Array.isArray(color) || color.length !== 4) {
        console.error("Invalid color format. Color must be an array of four elements [R, G, B, A].");
        return;
    }
    let prism = new TriangularPrism(matrix, color);
    return prism;
}
