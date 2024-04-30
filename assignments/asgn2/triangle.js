class Triangle extends Shape{
    constructor() {
        this.type = "triangle";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.vertices = [
            0.0, 0.0, 0.0,        // Vertex 1 at position
            1.0, 0.0, 0.0,        // Vertex 2 at position + 1 on the x-axis
            0.0, 1.0, 0.0         // Vertex 3 at position + 1 on the y-axis
        ];
    }

    render() {
        var rgba = this.color;

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw
        drawTriangle3D(this.vertices);
    }
}

function drawTriangle3D(vertices) {
    var n = 3; // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}

drawTriangle3D_2 = function(vertices, color) {
    var triangle = new Triangle();
    triangle.color = color || triangle.color; // If no color is given, use the default color
    triangle.vertices = vertices;
    triangle.render();
}

function drawTriangle(color) {
    var triangle = new Triangle();
    triangle.color = color;
    return triangle;
}
