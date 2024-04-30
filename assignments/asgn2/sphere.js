// Sphere.js
class Sphere extends Shape {
    constructor(radius, subdivisions, matrix, color) {
        super(matrix);
        this.type = "sphere";
        this.radius = radius;
        this.subdivisions = subdivisions || 32;
        this.color = color; // Expect an array [r, g, b, a]
        this.vertices = [];
        this.colors = [];
        this.indices = [];
        this.generateSphere();
        this.initBuffers();
    }

    generateSphere() {
        let vertices = [];
        let indices = [];
        let phiSteps = this.subdivisions;
        let thetaSteps = this.subdivisions * 2;
        let lightDirection = [-0.5, 0, -1.8]; // Example light direction (normalized)
        let lightIntensity = 0.4; // How much the light affects the color
    
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
    
                // Normalized normal (since the sphere is centered at the origin)
                let nx = x / this.radius;
                let ny = y / this.radius;
                let nz = z / this.radius;
    
                // Dot product with light direction
                let brightness = Math.max(0, nx * lightDirection[0] + ny * lightDirection[1] + nz * lightDirection[2]);
                brightness = (brightness * lightIntensity) + (1 - lightIntensity); // Scale brightness
    
                // Set color with simulated light effect
                this.colors.push(this.color[0] * brightness, this.color[1] * brightness, this.color[2] * brightness, this.color[3]);
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

        // Index buffer
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }

    render() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0); // Ensure the size parameter matches the color components
        gl.enableVertexAttribArray(a_Color);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}

function drawSphere(radius, color, matrix) {
    if (!Array.isArray(color) || color.length !== 4) {
        console.error("Invalid color format. Color must be an array of four elements [R, G, B, A].");
        return;
    }
    let sphere = new Sphere(radius, 8, matrix, color);
    return sphere;
}
