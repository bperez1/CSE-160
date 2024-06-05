import * as THREE from "three";
import { OBJLoader } from "OBJLoader";
import { MTLLoader } from "MTLLoader";
import { OrbitControls } from "OrbitControls";
import { DecalGeometry } from "DecalGeometry";
import { Water } from "Water";
import { FBXLoader } from "FBXLoader";

let treeBoundingBox;
function main() {
  const loadManager = new THREE.LoadingManager();

  const loadingElem = document.querySelector("#loading");
  const progressBarElem = loadingElem.querySelector(".progressbar");

  loadManager.onStart = function(url, itemsLoaded, itemsTotal) {
    loadingElem.style.display = 'flex';
  };

  loadManager.onLoad = function() {
    loadingElem.style.display = 'none';
  };

  loadManager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const progress = itemsLoaded / itemsTotal;
    progressBarElem.style.transform = `scaleX(${progress})`; // Update the progress bar
  };

  loadManager.onError = function(url) {
    console.error('There was an error loading ' + url);
  };

  // create a canvas element
  const canvas = document.querySelector("#c");
  // create a WebGLRenderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("midnightblue"); // Dark blue for a magical night sky
  // scene.fog = new THREE.Fog("midnightblue", 1, 50); // Add fog with near and far parameters
  scene.fog = new THREE.FogExp2("midnightblue", 0.04); // Add exponential fog with density parameter

  const light = new THREE.DirectionalLight(0x4040ff, 1); // Slightly brighter bluish directional light
  light.position.set(20, 20, 20);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x202020, 0.1); // Very dim ambient light
  scene.add(ambientLight);

  createSkybox();

  // Camera setup
  const fov = 75;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 100;
  const freeCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  freeCamera.position.set(0, 5, 25);
  let controls = new OrbitControls(freeCamera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // Orthographic camera setup
  function createOrUpdateFlatCamera(camera, aspectRatio, multiplier = 2) {
    camera.left = (-10 * aspectRatio * multiplier) / 2;
    camera.right = (10 * aspectRatio * multiplier) / 2;
    camera.top = (10 * multiplier) / 2;
    camera.bottom = (-10 * multiplier) / 2;
    camera.near = 1;
    camera.far = 5000; // Increase far clipping plane to ensure the scene is within view
    camera.updateProjectionMatrix();
    camera.position.set(0, 10, 10);
    camera.lookAt(new THREE.Vector3(0, 8, 0)); // Adjust to look at origin if needed
  }

  const aspectRatio = window.innerWidth / window.innerHeight;
  const flatCamera = new THREE.OrthographicCamera();
  createOrUpdateFlatCamera(flatCamera, aspectRatio);

  const orbitCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  orbitCamera.position.set(0, 5, 25);

  let camera = freeCamera; // Start with the free camera
  scene.add(freeCamera, flatCamera, orbitCamera); // Add all cameras to the scene for good measure

  // Function to create a spotlight that mimics a flashlight
  function createFlashlight(camera) {
    const spotlight = new THREE.SpotLight(0xffffff, 150, 200, Math.PI / 5, 0.5);
    camera.add(spotlight);
    spotlight.position.set(0, 0, 1);
    spotlight.target.position.set(0, 0, -1);
    camera.add(spotlight.target);
    scene.add(camera);
  }

  // Attach flashlights to cameras
  createFlashlight(freeCamera);
  createFlashlight(flatCamera);
  createFlashlight(orbitCamera);

  const CAMERA_MODES = {
    FREE: "FREE",
    FLAT: "FLAT",
    ORBIT: "ORBIT",
  };

  let currentCameraMode = CAMERA_MODES.FREE;
  let keyStates = {};

  function switchCameraMode(mode) {
    if (mode === CAMERA_MODES.FREE) {
      controls.dispose(); // Dispose of old controls to prevent memory leaks
      camera = freeCamera;
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
    } else if (mode === CAMERA_MODES.FLAT) {
      camera = flatCamera;
      controls.dispose();
      const aspectRatio = window.innerWidth / window.innerHeight;
      createOrUpdateFlatCamera(flatCamera, aspectRatio);
    } else if (mode === CAMERA_MODES.ORBIT) {
      controls.dispose();
      camera = orbitCamera;
      controls = new OrbitControls(camera, renderer.domElement);
    }
    currentCameraMode = mode;
    controls.update();
  }

  document.addEventListener("keydown", (event) => {
    keyStates[event.key.toUpperCase()] = true;
    if (event.key === "1") switchCameraMode(CAMERA_MODES.FREE);
    if (event.key === "2") switchCameraMode(CAMERA_MODES.FLAT);
    if (event.key === "3") switchCameraMode(CAMERA_MODES.ORBIT);
  });

  document.addEventListener("keyup", (event) => {
    keyStates[event.key.toUpperCase()] = false;
  });

  function handleCameraMovement() {
    const moveSpeed = 0.1;
    const vector = new THREE.Vector3();

    if (currentCameraMode === CAMERA_MODES.FREE && controls.enabled) {
      if (keyStates["W"]) {
        camera.getWorldDirection(vector);
        camera.position.addScaledVector(vector, moveSpeed);
      }
      if (keyStates["S"]) {
        camera.getWorldDirection(vector);
        camera.position.addScaledVector(vector, -moveSpeed);
      }
      if (keyStates["A"]) {
        vector.setFromMatrixColumn(camera.matrix, 0);
        camera.position.addScaledVector(vector, -moveSpeed);
      }
      if (keyStates["D"]) {
        vector.setFromMatrixColumn(camera.matrix, 0);
        camera.position.addScaledVector(vector, moveSpeed);
      }
      controls.target
        .copy(camera.position)
        .add(camera.getWorldDirection(new THREE.Vector3()));
    }
  }


  function createSkybox() {
    const loader = new THREE.CubeTextureLoader(loadManager);
    const texture = loader.load([
      "resources/images/starryNight.jpg", // positive x
      "resources/images/starryNight.jpg", // negative x
      "resources/images/starryNight.jpg", // positive y
      "resources/images/starryNight.jpg", // negative y
      "resources/images/starryNight.jpg", // positive z
      "resources/images/starryNight.jpg", // negative z
    ]);

    scene.background = texture;
  }

  // checkerboard floor
  {
    const planeSize = 500;

    const loader = new THREE.TextureLoader(loadManager);
    const texture = loader.load("resources/images/checker.png");
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    scene.add(mesh);
  }
  {
    // Load plasticine textures
    const loader = new THREE.TextureLoader(loadManager);
    const plasticineTextureGreen = loader.load(
      "resources/images/plasticineNoise.jpg"
    );
    plasticineTextureGreen.wrapS = plasticineTextureGreen.wrapT =
      THREE.RepeatWrapping;
    plasticineTextureGreen.repeat.set(10, 10);

    const bumpMap = loader.load("resources/images/plasticineBump.jpg");
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(4, 4);

    const plasticineTextureBrown = loader.load(
      "resources/images/plasticineNoise.jpg"
    );
    plasticineTextureBrown.wrapS = plasticineTextureBrown.wrapT =
      THREE.RepeatWrapping;
    plasticineTextureBrown.repeat.set(1, 1);
    plasticineTextureBrown.offset.set(0.5, 0);

    // Modify existing plane to use green plasticine texture
    const planeSize = 500;
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: plasticineTextureGreen,
      side: THREE.DoubleSide,
      color: 0x7cfc00, // Bright green color
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    scene.add(mesh);

    // Add brown plasticine layer beneath the green plane
    const subLayerGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const subLayerMat = new THREE.MeshPhongMaterial({
      map: plasticineTextureBrown,
      side: THREE.DoubleSide,
      color: 0x8b4513, // Saddle brown color
    });
    const subLayerMesh = new THREE.Mesh(subLayerGeo, subLayerMat);
    subLayerMesh.position.y = -7.9;
    subLayerMesh.rotation.x = Math.PI * -0.5;
    scene.add(subLayerMesh);
  }

  function createPlasticineMaterials() {
    const loader = new THREE.TextureLoader(loadManager);
    const plasticineTexture = loader.load(
      "resources/images/plasticineNoise.jpg"
    );
    plasticineTexture.wrapS = plasticineTexture.wrapT = THREE.RepeatWrapping;
    plasticineTexture.repeat.set(2, 2);

    const bumpMap = loader.load("resources/images/plasticineBump.jpg");
    bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(2, 2);

    return {
      head: new THREE.MeshPhongMaterial({
        color: 0xff6347, // Tomato red
        map: plasticineTexture,
        specular: 0x222222,
        shininess: 100,
        bumpMap: bumpMap,
        bumpScale: 1.5,
      }),
      body: new THREE.MeshPhongMaterial({
        color: 0xffd700, // Bright yellow
        map: plasticineTexture,
        specular: 0x222222,
        shininess: 100,
        bumpMap: bumpMap,
        bumpScale: 1.5,
      }),
      gloves: new THREE.MeshPhongMaterial({
        color: 0xffffff, // Bright white
        map: plasticineTexture,
        specular: 0x222222,
        shininess: 100,
        bumpMap: bumpMap,
        bumpScale: 1.5,
      }),
      shoes: new THREE.MeshPhongMaterial({
        color: 0x8b4513, // Saddle brown
        map: plasticineTexture,
        specular: 0x222222,
        shininess: 100,
        bumpMap: bumpMap,
        bumpScale: 1.5,
      }),
      swordHandle: new THREE.MeshPhongMaterial({
        color: 0xff6347, // Red
        map: plasticineTexture,
        specular: 0x222222,
        shininess: 100,
        bumpMap: bumpMap,
        bumpScale: 1.5,
      }),
      swordBlade: new THREE.MeshPhongMaterial({
        color: 0x808080, // Grey
        specular: 0x666666,
        shininess: 150,
        bumpMap: bumpMap,
        bumpScale: 1, // Less pronounced effect on the blade
      }),
    };
  }

  // creates plasticine objects like apple warrior
  function plasticine() {
    const materials = createPlasticineMaterials();
    // Create geometries
    const headGeo = new THREE.SphereGeometry(0.75, 32, 32);
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
    const armGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 32);
    const footGeo = new THREE.BoxGeometry(0.4, 0.25, 0.5);
    const handGeo = new THREE.SphereGeometry(0.2, 32, 32);
    const bladeGeo = new THREE.BoxGeometry(0.05, 1.4, 0.1);
    const handleGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 32);

    // Create meshes
    // Create the new apple head
    const newAppleHead = createAppleHead();
    const body = new THREE.Mesh(bodyGeo, materials.body);
    const leftArm = new THREE.Mesh(armGeo, materials.body);
    const rightArm = new THREE.Mesh(armGeo, materials.body);
    const leftFoot = new THREE.Mesh(footGeo, materials.shoes);
    const rightFoot = new THREE.Mesh(footGeo, materials.shoes);
    const leftHand = new THREE.Mesh(handGeo, materials.gloves);
    const rightHand = new THREE.Mesh(handGeo, materials.gloves);
    const blade = new THREE.Mesh(bladeGeo, materials.swordBlade);
    const handle = new THREE.Mesh(handleGeo, materials.swordHandle);

    // Positioning elements
    newAppleHead.position.set(0, 1.8, 0);
    body.position.set(0, 0.5, 0);
    leftArm.position.set(-0.7, 0.7, 0);
    rightArm.position.set(0.7, 0.7, 0);
    leftFoot.position.set(-0.3, -0.38, 0);
    rightFoot.position.set(0.3, -0.38, 0);
    leftHand.position.set(-0.7, 0, 0);
    rightHand.position.set(0.7, 0, 0);
    blade.position.z = 0.9;
    handle.position.y = -0.8;
    blade.rotation.x = Math.PI / 2; // Rotate the blade to make it vertical
    blade.add(handle);
    leftHand.add(blade);

    // Create a group and add all parts to it
    const appleWarrior = new THREE.Group();
    appleWarrior.add(
      newAppleHead, // Add the new apple head
      body,
      leftArm,
      rightArm,
      leftFoot,
      rightFoot,
      leftHand,
      rightHand
    );
    appleWarrior.position.set(5, 0.5, 0); // Position the warrior in the scene
    scene.add(appleWarrior); // Add the whole warrior to the scene
  }
  plasticine();

  function applyFaceDecal(head) {
    const loader = new THREE.TextureLoader(loadManager);
    loader.load("resources/images/appleface.png", function (texture) {
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

      const decalMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: true,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        wireframe: false,
      });

      const decalPosition = new THREE.Vector3(5.15, 2.4, 0.699999);
      const decalNormal = new THREE.Vector3(0, 0, 1);
      const decalSize = new THREE.Vector3(1.4, 1.4, 0.5);

      const decalGeometry = new DecalGeometry(
        head,
        decalPosition,
        decalNormal,
        decalSize
      );
      const decal = new THREE.Mesh(decalGeometry, decalMaterial);

      scene.add(decal);
      console.log("Decal added: ", decal);
    });
  }

  const patrolBounds = {
    minX: -13,
    maxX: 13,
    minY: 3,
    maxY: 19,
    minZ: -13,
    maxZ: 13,
  };

  function createFirefly() {
    const fireflyGroup = new THREE.Group();

    // Create the body of the firefly (a small sphere)
    const bodyGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const color = new THREE.Color(Math.random(), Math.random(), Math.random()); // Random color
    const bodyMaterial = new THREE.MeshBasicMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

    // Create the wings of the firefly (two small planes)
    const wingGeometry = new THREE.PlaneGeometry(0.2, 0.05);
    const wingMaterial = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);

    leftWing.position.set(0, 0, 0.1);
    leftWing.rotation.y = Math.PI / 2;
    rightWing.position.set(0, 0, -0.1);
    rightWing.rotation.y = Math.PI / 2;

    // Add wings to the body
    fireflyGroup.add(body);
    fireflyGroup.add(leftWing);
    fireflyGroup.add(rightWing);

    // Create the light emitted by the firefly
    const light = new THREE.PointLight(color, 50, 5); // Brighter light, greater distance
    light.position.set(0, 0, 0);
    fireflyGroup.add(light);

    // Initial position
    fireflyGroup.position.set(
      THREE.MathUtils.randFloat(-13, 13),
      THREE.MathUtils.randFloat(3, 19), // Higher lower bound to avoid ground level
      THREE.MathUtils.randFloat(-13, 13)
    );

    // Initial position
    fireflyGroup.position.set(
      THREE.MathUtils.randFloat(patrolBounds.minX, patrolBounds.maxX),
      THREE.MathUtils.randFloat(patrolBounds.minY, patrolBounds.maxY),
      THREE.MathUtils.randFloat(patrolBounds.minZ, patrolBounds.maxZ)
    );

    // Store initial position and random speed for flight path
    fireflyGroup.userData = {
      speedX: Math.random() * 0.005 + 0.0025, // Slower speed
      speedY: Math.random() * 0.005 + 0.0025,
      speedZ: Math.random() * 0.005 + 0.0025,
      range: {
        x: patrolBounds.maxX - patrolBounds.minX,
        y: patrolBounds.maxY - patrolBounds.minY,
        z: patrolBounds.maxZ - patrolBounds.minZ,
      },
      direction: new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize(),
    };

    scene.add(fireflyGroup);

    return fireflyGroup;
  }

  // Array to store all fireflies
  const fireflies = [];

  // Create multiple fireflies
  for (let i = 0; i < 40; i++) {
    fireflies.push(createFirefly());
  }

  function animateFireflies() {
    fireflies.forEach((firefly) => {
      const time = Date.now() * 0.001;

      // Randomly change direction occasionally
      if (Math.random() < 0.01) {
        firefly.userData.direction
          .set(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          )
          .normalize();
      }

      // Calculate movement
      firefly.position.add(
        firefly.userData.direction.clone().multiplyScalar(0.02)
      );

      // Check bounds and adjust direction if necessary
      const pos = firefly.position;
      if (pos.x < patrolBounds.minX || pos.x > patrolBounds.maxX) {
        firefly.userData.direction.x *= -1;
      }
      if (pos.y < patrolBounds.minY || pos.y > patrolBounds.maxY) {
        firefly.userData.direction.y *= -1;
      }
      if (pos.z < patrolBounds.minZ || pos.z > patrolBounds.maxZ) {
        firefly.userData.direction.z *= -1;
      }

      // Make the wings flap
      firefly.children[1].rotation.z = Math.sin(time * 5) * 0.3;
      firefly.children[2].rotation.z = -Math.sin(time * 5) * 0.3;
    });
  }

  // render the scene
  renderer.render(scene, camera);

  const objLoader = new OBJLoader(loadManager);
  const mtlLoader = new MTLLoader(loadManager);

  mtlLoader.load(
    "resources/models/Lowpoly_tree_sample/Lowpoly_tree_sample.mtl",
    (mtl) => {
      mtl.preload(); // Prepare the materials
      objLoader.setMaterials(mtl); // Apply these materials to the OBJLoader

      // Load the OBJ file now that the materials are ready
      objLoader.load(
        "resources/models/Lowpoly_tree_sample/Lowpoly_tree_sample.obj",
        (root) => {
          root.position.set(0, 0.65, 0); // Set position here
          scene.add(root);

          // Compute the box that contains all the stuff from root and below
          const box = new THREE.Box3().setFromObject(root);
          treeBoundingBox = box; // Store the bounding box for the tree
          const boxSize = box.getSize(new THREE.Vector3()).length();
          const boxCenter = box.getCenter(new THREE.Vector3());

          // Update the controls to handle the new size
          controls.maxDistance = boxSize * 10;
          controls.target.copy(boxCenter);
          controls.update();
        }
      );
    }
  );

  // Function to create a tree with a cone for foliage and a cylinder for the trunk
  // Define the clearing radius and position
  const clearingCenter = new THREE.Vector3(0, 0, 0);
  const clearingRadius = 15; // Adjust the radius as needed

  // Function to check if a position is within the clearing radius
  function isInClearing(position, center, radius) {
    return position.distanceTo(center) < radius;
  }

  // Function to create a tree with a cone for foliage and a cylinder for the trunk
  function createTree(position) {
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8); // Trunk geometry
    const foliageGeometry = new THREE.ConeGeometry(4, 10); // Foliage geometry

    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    const foliageMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });

    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);

    foliage.position.y = 5; // Position foliage above the trunk

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(foliage);
    tree.position.copy(position);

    tree.position.y += 2;

    return tree;
  }

  // Create the pond geometry and material
  const waterGeometry = new THREE.CircleGeometry(5, 64);

  const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "resources/images/waterNormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    alpha: 1.0,
    sunDirection: new THREE.Vector3(1, 1, 1).normalize(),
    waterColor: 0x00008b, // Darker blue water color
    waterColor: 0x8a2be2, // Magical blue purple color
    distortionScale: 8.0,
    fog: scene.fog !== undefined,
    reflectivity: 0.1,
  });

  water.rotation.x = -Math.PI / 2; // Rotate the water to be horizontal
  water.position.set(-8, 0.01, 2);
  scene.add(water);

  function createCircularTexture(size = 64) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const context = canvas.getContext("2d");

    // Draw a circle
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.closePath();
    context.fillStyle = "#ffffff";
    context.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function createRandomColoredLight(position) {
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const intensity = 1;
    const distance = 10;
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.copy(position);
    return light;
  }

  function createRandomColoredParticles(position, count = 100) {
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    for (let i = 0; i < count; i++) {
      positions.push(
        position.x + (Math.random() - 0.5) * 10,
        position.y + Math.random() * 2,
        position.z + (Math.random() - 0.5) * 10
      );
      colors.push(Math.random(), Math.random(), Math.random());
    }
    particlesGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    particlesGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    const circularTexture = createCircularTexture(); // Create the circular texture
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.1,
      map: circularTexture, // Use the circular texture
      vertexColors: true,
      transparent: true,
      alphaTest: 0.5, // Optional: Improve performance by discarding pixels with alpha < 0.5
    });
    return new THREE.Points(particlesGeometry, particlesMaterial);
  }

  // Add particles above and around the pond
  const particles = createRandomColoredParticles(
    new THREE.Vector3(-8, 1, 2),
    200
  );
  scene.add(particles);

  // Add random colored lights around the pond
  for (let i = 0; i < 5; i++) {
    const lightPosition = new THREE.Vector3(
      -8 + (Math.random() - 0.5) * 4,
      1.5,
      2 + (Math.random() - 0.5) * 4
    );
    const light = createRandomColoredLight(lightPosition);
    scene.add(light);
  }

  // // Function to create an oval-shaped bush with a scaled sphere geometry
  // function createBush(position) {
  //   const bushGroup = new THREE.Group();

  //   const bushGeometry = new THREE.SphereGeometry(1, 32, 32); // Base geometry
  //   const bushMaterial = new THREE.MeshPhongMaterial({ color: 0x2e8b57 });
  //   const bush = new THREE.Mesh(bushGeometry, bushMaterial);

  //   bush.scale.set(2, 1, 1); // Scale to make it oval-shaped
  //   bush.position.set(0, 1, 0); // Slightly above ground level
  //   bushGroup.add(bush);

  //   // Create small triangles for leaves/branches using BufferGeometry
  //   const triangleGeometry = new THREE.BufferGeometry();
  //   const vertices = new Float32Array([0, 0, 0, 0.2, 0.5, 0, 0.4, 0, 0]);
  //   triangleGeometry.setAttribute(
  //     "position",
  //     new THREE.BufferAttribute(vertices, 3)
  //   );
  //   triangleGeometry.computeVertexNormals();

  //   const triangleMaterial = new THREE.MeshPhongMaterial({
  //     color: 0x144d30, // Darker green
  //     side: THREE.DoubleSide,
  //   });

  //   // Add multiple triangles around the bush
  //   const numTriangles = 50;
  //   for (let i = 0; i < numTriangles; i++) {
  //     const triangleMesh = new THREE.Mesh(triangleGeometry, triangleMaterial);

  //     // Calculate a random position closer to the surface of the bush
  //     const angle = Math.random() * Math.PI * 2;
  //     const distance = 1 + Math.random() * 0.1; // Slightly outside the scaled bush radius
  //     const height = (Math.random() - 0.5) * 2; // Random height within the bush

  //     // Scale the radius to make it hug the oval shape more
  //     const x = distance * Math.cos(angle) * 2; // Scaled oval radius in x
  //     const y = height + 1; // Centered around the bush's vertical position
  //     const z = distance * Math.sin(angle); // Scaled oval radius in z

  //     // Position the triangle closer to the surface
  //     triangleMesh.position.set(x / 1.35, y, z / 1.005);

  //     // Randomize rotation
  //     triangleMesh.rotation.set(
  //       Math.random() * Math.PI,
  //       Math.random() * Math.PI,
  //       Math.random() * Math.PI
  //     );

  //     bushGroup.add(triangleMesh);
  //   }

  //   // Randomly rotate the entire bush around the y-axis to add variety
  //   bushGroup.rotation.y = Math.random() * Math.PI * 2;

  //   bushGroup.position.copy(position);
  //   return bushGroup;
  // }

  function placeBush(position) {
    if (bushModel) {
      const bushClone = bushModel.clone();
      bushClone.position.copy(position);
      bushClone.rotation.y = Math.random() * Math.PI * 2; // Randomly rotate the bush around the y-axis
      scene.add(bushClone);
    }
  }

  function placeBushes() {
    // Add bushes to the scene, making sure they are not within the clearing
    for (let i = 0; i < 29; i++) {
      const bushPosition = new THREE.Vector3(
        getRandomPosition(-50, 50),
        0.6,
        getRandomPosition(-50, 50)
      );
      if (!isInClearing(bushPosition, clearingCenter, clearingRadius)) {
        placeBush(bushPosition);
      }
    }
  }

  const fbxLoader = new FBXLoader(loadManager);
  let bushModel = null;
  let bushModelLoaded = false;

  fbxLoader.load(
    "resources/models/Low Poly Forest Decoration Pack/Bush/FBX Files/Bush1.1/Bush1.1.fbx",
    (object) => {
      console.log("Bush model loaded:", object);
      bushModel = object;
      bushModel.scale.set(0.1 / 5, 0.1 / 5, 0.1 / 5); // Scale down if necessary
      bushModelLoaded = true;
      placeBushes(); // Place bushes after the model is loaded
    },
    undefined,
    (error) => {
      console.error("An error happened while loading the bush model.", error);
    }
  );

  // Generate random positions for trees and bushes
  function getRandomPosition(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Add trees to the scene, making sure they are not within the clearing
  for (let i = 0; i < 60; i++) {
    const treePosition = new THREE.Vector3(
      getRandomPosition(-50, 50),
      0,
      getRandomPosition(-50, 50)
    );
    if (!isInClearing(treePosition, clearingCenter, clearingRadius)) {
      scene.add(createTree(treePosition));
    }
  }

  // Function to make a rock
  function createRock(position) {
    const isBoulder = Math.random() > 0.5; // 50% chance to create a larger rock (boulder)
    const sizeMultiplier = isBoulder ? 2 : 1; // Scale up the size for boulders

    const rockGeometry = new THREE.DodecahedronGeometry(1 * sizeMultiplier, 0); // Dodecahedron
    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);

    rock.scale.set(
      Math.random() * 0.5 + 0.5 * sizeMultiplier, // Random scale for variety
      Math.random() * 0.5 + 0.5 * sizeMultiplier,
      Math.random() * 0.5 + 0.5 * sizeMultiplier
    );
    rock.position.copy(position);
    rock.position.y = 0.5 * sizeMultiplier;

    return rock;
  }

  // Add rocks and boulders to the scene, making sure they are not within the clearing
  for (let i = 0; i < 20; i++) {
    const rockPosition = new THREE.Vector3(
      getRandomPosition(-50, 50),
      0,
      getRandomPosition(-50, 50)
    );
    if (!isInClearing(rockPosition, clearingCenter, clearingRadius)) {
      scene.add(createRock(rockPosition));
    }
  }

  function createApple(position) {
    const appleGroup = new THREE.Group();

    // Create the body of the apple
    const appleGeometry = new THREE.SphereGeometry(1, 32, 32);
    const appleMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red color for the apple
    const appleMesh = new THREE.Mesh(appleGeometry, appleMaterial);
    appleGroup.add(appleMesh);

    // Create the stem of the apple
    const stemGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 32);
    const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown color for the stem
    const stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    stemMesh.position.y = 1.2; // Position stem on top of the apple
    appleGroup.add(stemMesh);

    // Create the leaf of the apple
    const leafGeometry = new THREE.PlaneGeometry(0.5, 0.2);
    const leafMaterial = new THREE.MeshPhongMaterial({
      color: 0x228b22, // Green color for the leaf
      side: THREE.DoubleSide,
    });
    const leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);
    leafMesh.position.y = 1.4; // Position leaf slightly above the stem
    leafMesh.position.x = 0.3; // Offset leaf from the center
    leafMesh.rotation.z = Math.PI / 4; // Rotate leaf to give a natural look
    appleGroup.add(leafMesh);

    appleGroup.position.copy(position);

    return appleGroup;
  }

  function createAppleHead() {
    const materials = createPlasticineMaterials();

    const appleGroup = new THREE.Group();

    // Create the body of the apple
    const appleGeometry = new THREE.SphereGeometry(0.75, 32, 32);
    const appleMaterial = new THREE.MeshPhongMaterial({
      map: materials.head.map, // Use plasticine texture
      color: materials.head.color,
      bumpMap: materials.head.bumpMap,
      bumpScale: materials.head.bumpScale,
      specular: materials.head.specular,
      shininess: materials.head.shininess,
    });
    const appleMesh = new THREE.Mesh(appleGeometry, appleMaterial);
    appleGroup.add(appleMesh);

    // Create the stem of the apple
    const stemGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 32);
    const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown color for the stem
    const stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    stemMesh.position.y = 0.9; // Position stem on top of the apple
    appleGroup.add(stemMesh);

    // Create the leaf of the apple
    const leafGeometry = new THREE.PlaneGeometry(0.5, 0.2);
    const leafMaterial = new THREE.MeshPhongMaterial({
      color: 0x228b22, // Green color for the leaf
      side: THREE.DoubleSide,
    });
    const leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);
    leafMesh.position.y = 1.0; // Position leaf slightly above the stem
    leafMesh.position.x = 0.3; // Offset leaf from the center
    leafMesh.rotation.z = Math.PI / 4; // Rotate leaf to give a natural look
    appleGroup.add(leafMesh);

    // Apply the decal to the apple
    applyFaceDecal(appleMesh);

    return appleGroup;
  }

  // Add an apple to the scene
  const applePosition = new THREE.Vector3(2, 9.5, 3.8);
  scene.add(createApple(applePosition));

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(window.devicePixelRatio);

      const aspect = canvas.clientWidth / canvas.clientHeight;
      if (currentCameraMode === CAMERA_MODES.FLAT) {
        createOrUpdateFlatCamera(flatCamera, aspect);
      } else if (
        currentCameraMode === CAMERA_MODES.FREE ||
        currentCameraMode === CAMERA_MODES.ORBIT
      ) {
        freeCamera.aspect = aspect;
        freeCamera.updateProjectionMatrix();
        orbitCamera.aspect = aspect;
        orbitCamera.updateProjectionMatrix();
      }
    }
    return needResize;
  }

  function animateParticles(particles) {
    const positions = particles.geometry.attributes.position.array;
    const count = positions.length / 3;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += Math.random() * 0.02; // Animate Y position
      if (positions[i * 3 + 1] > 3) {
        // Reset particle position if it goes too high
        positions[i * 3 + 1] = 0;
      }
    }
    particles.geometry.attributes.position.needsUpdate = true;
  }
  
  const mushroomsObjLoader = new OBJLoader(loadManager);
  const mushroomsMtlLoader = new MTLLoader(loadManager);
  
  function loadMushroomsModel(mtlPath, objPath, onLoadCallback) {
    mushroomsMtlLoader.load(mtlPath, (mtl) => {
      mtl.preload();
      mushroomsObjLoader.setMaterials(mtl);
      mushroomsObjLoader.load(objPath, (object) => {
        onLoadCallback(object);
      });
    });
  }

  function placeMushrooms(model, count = 10) {
    const placedPositions = [];
    const pondCenter = new THREE.Vector3(-8, 0, 2);
    const pondRadius = 5;
  
    function getRandomNonOverlappingPosition() {
      let position;
      let overlapping;
      let inPond;
      do {
        position = new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(60),
          0,
          THREE.MathUtils.randFloatSpread(60)
        );
        overlapping = placedPositions.some(p => p.distanceTo(position) < 3); // Check for overlap within a radius of 5
        inPond = position.distanceTo(pondCenter) < pondRadius; // Check if within pond radius
      } while (overlapping || inPond);
      placedPositions.push(position);
      return position;
    }
  
    for (let i = 0; i < count; i++) {
      const mushroom = model.clone();
      const position = getRandomNonOverlappingPosition();
      mushroom.position.set(position.x, 0.4, position.z);
      mushroom.rotation.y = Math.random() * Math.PI * 2; // Randomly rotate the mushroom around the y-axis
      addGlowLight(mushroom);
      scene.add(mushroom);
    }
  }
  

  function addGlowLight(object) {
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const light = new THREE.PointLight(color, 2, 10); // Brighter light with a smaller range
    light.position.set(0, 1, 0); // Position the light above the mushroom
    object.add(light);
  }

  loadMushroomsModel(
    'resources/models/Mushrooms/materials.mtl',
    'resources/models/Mushrooms/model.obj',
    (model) => {
      placeMushrooms(model, 40);
    }
  );


  // animation loop
  function render(time) {
    var startTime = performance.now();
    time *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      freeCamera.aspect = canvas.clientWidth / canvas.clientHeight;
      freeCamera.updateProjectionMatrix();
      orbitCamera.aspect = canvas.clientWidth / canvas.clientHeight;
      orbitCamera.updateProjectionMatrix();
    }

    handleCameraMovement();
    animateFireflies(); // Animate fireflies
    animateParticles(particles); // Animate particles above the pond

    water.material.uniforms["time"].value += 1.0 / 60.0 / 3; // Update water time for animation

    controls.update(); // Always update controls, it will only have effect if enabled

    renderer.render(scene, camera);
    requestAnimationFrame(render);

    var duration = performance.now() - startTime;
    sendTextToHTML(
      " ms: " +
        Math.floor(duration) +
        " fps: " +
        Math.floor(10000 / duration) / 10,
      "numdot"
    );
    if (Math.floor(10000 / duration) / 10 <= 10) {
      console.log("fps too low!");
    }
  }

  function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlID) {
      console.log("Failed to get " + htmlID + " from HTML");
      return;
    }
    htmlElm.innerHTML = text;
  }

  requestAnimationFrame(render);
}

main();
