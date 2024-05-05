class Circle extends Shape{
    constructor() {
        this.type = "circle";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.size = 5.0;
        this.segments = 10;
    }

    render() {
        var rgba = this.color;
        var size = this.size;

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw
        var d = this.size / 200.0; // delta

        let angleStep = 360 / this.segments;
        for (var angle = 0; angle < 360; angle += angleStep) {
            let centerPt = [0.0, 0.0];

            let angle1 = angle;
            let angle2 = angle + angleStep;
            let vec1 = [Math.cos(angle1 * Math.PI / 180) * d, Math.sin(angle1 * Math.PI / 180) * d];
            let vec2 = [Math.cos(angle2 * Math.PI / 180) * d, Math.sin(angle2 * Math.PI / 180) * d];
            let pt1 = [centerPt[0] + vec1[0], centerPt[1] + vec1[1]];
            let pt2 = [centerPt[0] + vec2[0], centerPt[1] + vec2[1]];

            drawTriangle3D([0.0, 0.0, 0.0, pt1[0], pt1[1], 0.0, pt2[0], pt2[1], 0.0]);
        }
    }
}

function drawCircle(color) {
    var circle = new Circle();
    circle.color = color;
    return circle;
}
