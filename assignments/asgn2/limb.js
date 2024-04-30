class Limb {
    constructor(color, scale, translate, rotateAngles) {
        this.color = color;
        this.scale = scale;
        this.translate = translate;
        this.rotateAngles = rotateAngles;
        this.children = [];
        this.matrix = new Matrix4();
        this.calculateMatrix();
    }

    calculateMatrix() {
        this.matrix.setTranslate(...this.translate)
            .scale(...this.scale)
            .rotate(this.rotateAngles[0], 1, 0, 0)  // Rotate around x-axis
            .rotate(this.rotateAngles[1], 0, 1, 0)  // Rotate around y-axis
            .rotate(this.rotateAngles[2], 0, 0, 1); // Rotate around z-axis
        this.children.forEach(child => {
            child.parentMatrix = new Matrix4(this.matrix);
            child.calculateMatrix();
        });
    }

    addChild(child) {
        this.children.push(child);
        child.parentMatrix = this.matrix;
    }

    render() {
        var modelMatrix = new Matrix4(this.parentMatrix).multiply(this.matrix);
        var limb = drawCube(this.color);
        limb.matrix = modelMatrix;
        limb.render();
        this.children.forEach(child => child.render());
    }
}
