// asg0.js
function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('cnv1');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG
    var ctx = canvas.getContext('2d');

    // Draw a black rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a black color
    ctx.fillRect(0, 0, parseInt(canvas.width), parseInt(canvas.height)); // Fill a rectangle with the color

    // // draw red line
    // let x = document.getElementById("V1x").value *20;
    // let y = document.getElementById("V1y").value *20
    // let z = 0;

    // let vCoords = [x,y,z];
    // console.log("Vcoords:  x: " + vCoords[0] + " y: " + vCoords[1] + " z: " + vCoords[2]);
    // let v1 = new Vector3(vCoords);

    // console.log("elements of v1: " + v1.elements);

    // let color = "red";
    // console.log(color);
    
    // drawVector(v1, color);
}

function drawVector(v, color){
    // Retrieve <canvas> element
    var canvas = document.getElementById('cnv1');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG
    var ctx = canvas.getContext('2d');

    let center = findMidpoint();
    // console.log("Vector from center of: " + "(" + center[0] + ", " + center[1] + ")");

    let x = v.elements[0] + center[0];
    let y = canvas.height - (v.elements[1] + center[1]);
    // console.log("To: " + "(" + x + ", " + y + ")");

    ctx.beginPath();
    ctx.moveTo(center[0], center[1]);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function findMidpoint(){
    // Retrieve <canvas> element
    var canvas = document.getElementById('cnv1');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // calculate the center of the canvas
    let a = [0, 0];
    let b = [parseInt(canvas.height), parseInt(canvas.width)];

    let midpoint = [((a[0] + b[0])/2),(a[1] + b[1])/2];
    return midpoint;
}

// Called when Draw button is pressed
function handleDrawEvent(){
    console.log("\n");

    // Retrieve <canvas> element
    var canvas = document.getElementById('cnv1');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG
    var ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a black rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a black color
    ctx.fillRect(0, 0, parseInt(canvas.width), parseInt(canvas.height)); // Fill a rectangle with the color

    // Get vector1 values
    let xV1 = document.getElementById("V1x").value *20;
    let yV1 = document.getElementById("V1y").value *20;
    let v1Coords = [xV1,yV1,0];

    // Get vector2 values
    let xV2 = document.getElementById("V2x").value *20;
    let yV2 = document.getElementById("V2y").value *20;
    let v2Coords = [xV2,yV2,0];

    // Create vector1
    let v1 = new Vector3(v1Coords);
    // Create vector2
    let v2 = new Vector3(v2Coords);

    // Set color for vector1
    let colorV1 = "red";
    // Set color for vector1
    let colorV2 = "blue";
    
    // Draw the vectors
    drawVector(v1, colorV1);
    drawVector(v2, colorV2);
}

// Called when Draw button is pressed
function handleDrawOperationEvent(){
    // Retrieve <canvas> element
    var canvas = document.getElementById('cnv1');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element');
        return;
    }

    // Get the rendering context for 2DCG
    var ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a black rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set a black color
    ctx.fillRect(0, 0, parseInt(canvas.width), parseInt(canvas.height)); // Fill a rectangle with the color

    // Get scalar value
    let scalar = document.getElementById("Scalar").value;

    // Get vector1 values
    let xV1 = document.getElementById("V1x").value *20;
    let yV1 = document.getElementById("V1y").value *20;
    let v1Coords = [xV1,yV1,0];

    // Get vector2 values
    let xV2 = document.getElementById("V2x").value *20;
    let yV2 = document.getElementById("V2y").value *20;
    let v2Coords = [xV2,yV2,0];

    // Create vector1
    let v1 = new Vector3(v1Coords);
    // Create vector2
    let v2 = new Vector3(v2Coords);

    // Set color for vector1
    let colorV1 = "red";
    // Set color for vector1
    let colorV2 = "blue";
    
    // Draw vectors 1 and 2
    drawVector(v1, colorV1);
    drawVector(v2, colorV2);

    // Executing the operation:
    let colorV3 = "Green";
    let colorV4 = "Green";

    let v3 = new Vector3();
    let v4 = new Vector3();
    v3.set(v1);
    v4.set(v2);

    let op = document.getElementById("operation-select").value;

    if(op == "Add"){
        v3.add(v4);
        drawVector(v3, colorV3);
    }
    else if(op == "Sub"){
        v3.sub(v4);
        drawVector(v3, colorV3);
    }
    else if(op == "Mul"){
        v3.mul(scalar);
        v4.mul(scalar);

        drawVector(v3, colorV3);
        drawVector(v4, colorV4);
    }
    else if(op == "Div"){
        v3.div(scalar);
        v4.div(scalar);

        drawVector(v3, colorV3);
        drawVector(v4, colorV4);
    }
    else if(op == "Magnitude"){
        m1 = v1.magnitude();
        m2 = v2.magnitude();

        console.log("Magnitude v1: " + m1);
        console.log("Magnitude v2: " + m2);
    }
    else if(op == "Normalize"){
        v3.normalize();
        v4.normalize();

        drawVector(v3, colorV3);
        drawVector(v4, colorV4);
    }
    else if(op == "Angle Between"){
        let angle = angleBetween(v1, v2);
        
        console.log("Angle: " + angle);
    }
    else if(op == "Area"){
        let area = areaTriangle(v1, v2);
        console.log("Area of triangle: " + area);
    }
}

function angleBetween(v1, v2){
    let numerator = Vector3.dot(v1, v2);
    let denominator = v1.magnitude() * v2.magnitude();

    let cosineOfAngle = Math.min(Math.max(numerator / denominator, -1), 1); // I was having issues and wanted to make sure it worked fine, so maybe not necessary but I did it anyway
    let angleInRadians = Math.acos(cosineOfAngle); // cuz acos pumps out radians not degrees (I also spent a while figuring this out)

    let angleInDegrees = angleInRadians * (180 / Math.PI);

    return angleInDegrees;
}

function areaTriangle(v1, v2){
    let cross = Vector3.cross(v1, v2);

    let parallelogramArea = Math.abs(cross.elements[2]) / 400; // divide by 400 to undo the 20* scaling

    let areaTriangle = parallelogramArea / 2;
    return areaTriangle;
}