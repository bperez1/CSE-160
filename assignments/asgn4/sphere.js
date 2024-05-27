class Sphere extends Shape {
    constructor(radius, subdivisions = 8, matrix) {
        super(matrix);
        this.type = "sphere";
        this.radius = radius;
        this.subdivisions = subdivisions;
        this.textureNum = -2;
        this.colors = []; // Initialize colors array
        this.generateSphere();
        this.initBuffers();
    }

    generateSphere() {
        let vertices = [];
        let indices = [];
        let uv = [];
        let phiSteps = this.subdivisions;
        let thetaSteps = this.subdivisions * 2;

        for (let phiIdx = 0; phiIdx <= phiSteps; phiIdx++) {
            let phi = Math.PI * phiIdx / phiSteps;
            let cosPhi = Math.cos(phi);
            let sinPhi = Math.sin(phi);

            for (let thetaIdx = 0; thetaIdx <= thetaSteps; thetaIdx++) {
                let theta = 2 * Math.PI * thetaIdx / thetaSteps;
                let x = this.radius * sinPhi * Math.cos(theta);
                let y = this.radius * sinPhi * Math.sin(theta);
                let z = this.radius * cosPhi;

                // Vertex position
                vertices.push(x, y, z);

                // UV coordinates (flip vertically to move seam to the bottom)
                let u = (thetaIdx / thetaSteps);
                let v = (phiIdx / phiSteps);
                uv.push(u, v);

                // Set default white color
                this.colors.push(1.0, 1.0, 1.0, 1.0);
            }
        }

        // Indices for each quad as two triangles
        for (let phiIdx = 0; phiIdx < phiSteps; phiIdx++) {
            for (let thetaIdx = 0; thetaIdx < thetaSteps; thetaIdx++) {
                let first = (phiIdx * (thetaSteps + 1)) + thetaIdx;
                let second = first + thetaSteps + 1;

                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        this.vertices = new Float32Array(vertices);
        this.colors = new Float32Array(this.colors);
        this.indices = new Uint16Array(indices);
        this.uv = new Float32Array(uv);
    }

    initBuffers() {
        // Vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

        // Color buffer
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

        // UV buffer
        this.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.uv, gl.STATIC_DRAW);

        // Index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
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
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_UV);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}

function drawSphere(radius, color, matrix, subdivisions = 8) {
    let sphere = new Sphere(radius, subdivisions, matrix);
    sphere.setColor(color);
    return sphere;
}
