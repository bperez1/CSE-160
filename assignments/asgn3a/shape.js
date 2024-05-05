class Shape {
    constructor(matrix) {
        this.type = "";
        this.matrix = matrix || new Matrix4();
        this.vertexBuffer = null;
        this.colorBuffer = null;
        this.uvBuffer = null;
        this.colors = null; // Will be set by derived classes
        this.vertices = null; // Will be set by derived classes
        this.uv = null; // Will be set by derived classes
        this.textureNum = null; // Will be set by derived classes
    }

    initBuffers() {
        if (!this.vertices || !this.colors) {
            throw new Error("Vertices and colors must be defined before initializing buffers.");
        }
        
        // Initialize vertex buffer
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        // Initialize color buffer
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
    }

    updateColors() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
    }

    render() {
        if (!this.vertexBuffer || !this.colorBuffer) {
            throw new Error("Buffers not initialized");
        }

        // Get attribute and uniform locations
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Bind color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        // Set model matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3); // Assuming 3 components per vertex position
    }

    render2(){
        if (!this.vertexBuffer || !this.colorBuffer) {
            throw new Error("Buffers not initialized");
        }

        // Pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Get attribute and uniform locations
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);


        // Bind buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_UV);


        // Bind color buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        // Set model matrix
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw the cube
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3); // Assuming 3 components per vertex position
    }
}
