function sin(x){
  return Math.sin(x);
}

function cos(x){
  return Math.cos(x);
}

class Sphere extends Shape {
  constructor(radius, subdivisions = 8, matrix) {
    super(matrix);
    this.type = "sphere";
    this.radius = radius;
    this.subdivisions = subdivisions;
    this.normalMatrix = new Matrix4();
    this.textureNum = -2;
    this.colors = [];
    this.normals = []; // Initialize normals array
    this.generateSphere();
    this.initBuffers();
  }

  generateSphere() {
    let vertices = [];
    let indices = [];
    let uv = [];
    let phiSteps = this.subdivisions;
    let thetaSteps = this.subdivisions * 2;
  
    // Generate vertices and normals
    for (let phiIdx = 0; phiIdx <= phiSteps; phiIdx++) {
      let phi = (Math.PI * phiIdx) / phiSteps;
      for (let thetaIdx = 0; thetaIdx <= thetaSteps; thetaIdx++) {
        let theta = (2 * Math.PI * thetaIdx) / thetaSteps;
  
        // Calculate vertex positions using spherical coordinates
        let x = this.radius * sin(phi) * cos(theta);
        let y = this.radius * cos(phi);
        let z = this.radius * sin(phi) * sin(theta);
  
        // Reflect y-coordinate to swap the top and bottom sides
        vertices.push(x, -y, z);
  
        // Invert y-component of the normals
        let nx = x;
        let ny = y;
        let nz = z;
        let length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        // this.normals.push(nx / length, -ny / length, -nz / length);
        this.normals.push(x,-y,z);
  
        // UV coordinates
        uv.push(1 - thetaIdx / thetaSteps, 1 - phiIdx / phiSteps);
  
        // Set default white color
        this.colors.push(1.0, 1.0, 1.0, 1.0);
      }
    }
  
    // Generate indices
    for (let phiIdx = 0; phiIdx < phiSteps; phiIdx++) {
      for (let thetaIdx = 0; thetaIdx < thetaSteps; thetaIdx++) {
        let first = phiIdx * (thetaSteps + 1) + thetaIdx;
        let second = first + thetaSteps + 1;
  
        // Adjust the winding order of the indices
        indices.push(first, first + 1, second);
        indices.push(second, first + 1, second + 1);
      }
    }
  
    this.vertices = new Float32Array(vertices);
    this.colors = new Float32Array(this.colors);
    this.indices = new Uint16Array(indices);
    this.uv = new Float32Array(uv);
    this.normals = new Float32Array(this.normals);
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

    // Normal buffer
    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

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

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

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
