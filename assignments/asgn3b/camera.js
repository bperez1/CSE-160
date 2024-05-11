class Camera {
    constructor(canvas) {
        this.fov = 60;
        this.aspect = canvas.width / canvas.height;
        this.near = 0.1;
        this.far = 50;
        this.eye = new Vector3([14, 1.5, 11.6]);  // Initial eye position
        this.at = new Vector3([13.42, 1.5, 14.7]); // Initial at position
        this.up = new Vector3([0, 1, 0]);    // Standard up vector

        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();

        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }

    updateProjectionMatrix() {
        this.projectionMatrix.setPerspective(
            this.fov, this.aspect, this.near, this.far
        );
    }

    moveForward(speed) {
        let forward = new Vector3(this.at.elements).sub(this.eye).normalize();
        forward.mul(speed);
        this.eye = this.eye.add(forward);
        this.at = this.at.add(forward);
        this.updateViewMatrix();
    }

    moveBackwards(speed) {
        let backward = new Vector3(this.eye.elements).sub(this.at).normalize();
        backward.mul(speed);
        this.eye = this.eye.add(backward);
        this.at = this.at.add(backward);
        this.updateViewMatrix();
    }

    moveLeft(speed) {
        let forward = new Vector3(this.at.elements).sub(this.eye).normalize();
        let left = Vector3.cross(this.up, forward).normalize();
        left.mul(speed);
        this.eye = this.eye.add(left);
        this.at = this.at.add(left);
        this.updateViewMatrix();
    }

    moveRight(speed) {
        let forward = new Vector3(this.at.elements).sub(this.eye).normalize();
        let right = Vector3.cross(forward, this.up).normalize();
        right.mul(speed);
        this.eye = this.eye.add(right);
        this.at = this.at.add(right);
        this.updateViewMatrix();
    }

    moveUp(speed) {
        let up = new Vector3(this.up.elements).normalize();
        up.mul(speed);
        this.eye = this.eye.add(up);
        this.at = this.at.add(up);
        this.updateViewMatrix();
    }

    moveDown(speed) {
        let down = new Vector3(this.up.elements).normalize();
        down.mul(-speed);
        this.eye = this.eye.add(down);
        this.at = this.at.add(down);
        this.updateViewMatrix();
    }

    panLeft(angle) {
        angle = angle*15
        let rotationMatrix = new Matrix4().setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let forward = new Vector3(this.at.elements).sub(this.eye);
        
        // Manually applying the matrix to the forward vector
        let x = forward.elements[0], y = forward.elements[1], z = forward.elements[2];
        let e = rotationMatrix.elements;
        forward.elements[0] = e[0] * x + e[4] * y + e[8]  * z;
        forward.elements[1] = e[1] * x + e[5] * y + e[9]  * z;
        forward.elements[2] = e[2] * x + e[6] * y + e[10] * z;

        this.at = new Vector3(this.eye.elements).add(forward);
        this.updateViewMatrix();
    }

    panRight(angle) {
        this.panLeft(-angle); // Utilizing panLeft with a negative angle
    }

    
    panHorizontal(angle) {
        let horizontalAxis = new Vector3([0, 1, 0]); // Y-axis for left/right
        this.rotateView(angle, horizontalAxis.elements);
    }

    panVertical(angle) {
        let verticalAxis = Vector3.cross(new Vector3(this.at.elements).sub(this.eye), this.up).normalize(); // Cross product for perpendicular axis
        this.rotateView(angle, verticalAxis.elements);
    }

    rotateView(angle, axis) {
        let rotationMatrix = new Matrix4().setRotate(angle, ...axis);
        let direction = new Vector3(this.at.elements).sub(this.eye);
        
        direction = rotationMatrix.multiplyVector3(direction);
        this.at = new Vector3(this.eye.elements).add(direction);
        
        this.updateViewMatrix();
    }

    updateVerticalAt(verticalPosition) {
        // This method updates the 'y' component of the 'at' vector.
        this.at.elements[1] = verticalPosition;
        this.updateViewMatrix();  // Update the view matrix after modifying the 'at' vector
    }

    getWorldDirection() {
        // Calculate the direction vector
        let direction = new Vector3(this.at.elements).sub(this.eye).normalize();
        return direction;
    }
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}   


