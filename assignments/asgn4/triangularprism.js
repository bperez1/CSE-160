class TriangularPrism extends Shape {
    constructor(matrix, color) {
        super(matrix);
        this.normalMatrix = new Matrix4();
        this.type = "triangularPrism";
        this.baseColor = color; // Expect an array [r, g, b, a]
        this.colors = [];
        this.vertices = [];
        this.normals = [];
        this.uv = [];
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
        this.addFace(bottomFrontRight, bottomBack, topBack, topFrontRight, this.modifyColor(1)); // Right face
        this.addFace(bottomBack, bottomFrontLeft, topFrontLeft, topBack, this.modifyColor(1)); // Left face
        this.addTriangle(bottomFrontLeft, bottomFrontRight, bottomBack, this.modifyColor(1)); // Bottom triangle
        this.addTriangle(topFrontLeft, topFrontRight, topBack, this.modifyColor(1)); // Top triangle

        this.vertices = new Float32Array(this.vertices);
        this.colors = new Float32Array(this.colors);
        this.normals = new Float32Array(this.normals);
        this.uv = new Float32Array(this.uv);
    }

    addFace(v1, v2, v3, v4, color) {
        let normal = this.calculateNormal(v1, v2, v3);
        this.addTriangleWithNormal(v1, v2, v3, color, normal);
        this.addTriangleWithNormal(v1, v3, v4, color, normal);
    }

    addTriangle(v1, v2, v3, color) {
        let normal = this.calculateNormal(v1, v2, v3);
        this.addTriangleWithNormal(v1, v2, v3, color, normal);
    }

    addTriangleWithNormal(v1, v2, v3, color, normal) {
        this.vertices.push(...v1, ...v2, ...v3);
        this.normals.push(...normal, ...normal, ...normal);
        this.uv.push(
            0.0, 0.0,
            1.0, 0.0,
            0.5, 1.0
        );
        for (let i = 0; i < 3; i++) {
            this.colors.push(...color);
        }
    }

    calculateNormal(v1, v2, v3) {
        let ux = v2[0] - v1[0], uy = v2[1] - v1[1], uz = v2[2] - v1[2];
        let vx = v3[0] - v1[0], vy = v3[1] - v1[1], vz = v3[2] - v1[2];
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        let length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        return [nx / length, ny / length, nz / length];
    }

    modifyColor(intensity) {
        // Modify the base color by the intensity factor for shading
        return this.baseColor.map(c => c * intensity);
    }

    initBuffers() {
        // Vertex buffer initialization
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        // Color buffer initialization
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

        // Normal buffer initialization
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

        // UV buffer initialization
        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uv, gl.STATIC_DRAW);
    }

    setColor(color) {
        for (let i = 0; i < this.colors.length; i += 4) {
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
        // Pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

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
