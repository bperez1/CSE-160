import * as THREE from "three";
import { OBJLoader } from "OBJLoader";
import { MTLLoader } from "MTLLoader";
import { OrbitControls } from "OrbitControls";
import { DecalGeometry } from "DecalGeometry";

let treeBoundingBox;
function main() {
  // create a canvas element
  const canvas = document.querySelector("#c");
  // create a WebGLRenderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("midnightblue"); // Dark blue for a magical night sky

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
  const multiplier = 1.81;
  const aspectRatio = window.innerWidth / window.innerHeight;
  const flatCamera = new THREE.OrthographicCamera(
    -10 * aspectRatio * multiplier,
    10 * aspectRatio * multiplier,
    10 * multiplier,
    -10 * multiplier,
    1,
    5000 // Increase far clipping plane to ensure the scene is within view
  );
  flatCamera.position.set(0, 10, 10);
  flatCamera.lookAt(new THREE.Vector3(0, 9, 0)); // Adjust to look at origin if needed

  // Add a grid helper to the scene to show the camera's view
  // const gridHelper = new THREE.GridHelper(100, 100);
  // scene.add(gridHelper);

  // // makes sure the helper updates when camera settings change
  // function updateCamera() {
  //     flatCamera.left = -5 * aspectRatio / 2;
  //     flatCamera.right = 5 * aspectRatio / 2;
  //     flatCamera.top = 5 / 2;
  //     flatCamera.bottom = -5 / 2;
  //     flatCamera.updateProjectionMatrix();

  //     cameraHelper.update();
  // }

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
    const loader = new THREE.CubeTextureLoader();
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

    const loader = new THREE.TextureLoader();
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
    const loader = new THREE.TextureLoader();
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
    subLayerMesh.position.y = -7.9; // Position the brown layer 10 units below the green plane
    subLayerMesh.rotation.x = Math.PI * -0.5;
    scene.add(subLayerMesh);
  }

  // create a box geometry with a width, height, and depth of 1
  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  const cubes = []; // just an array we can use to rotate the cubes

  const loadManager = new THREE.LoadingManager();

  // create a texture loader
  const loader = new THREE.TextureLoader(loadManager);
  const flowerMats = [
    new THREE.MeshBasicMaterial({
      map: loadColorTexture("resources/images/flower-1.jpg"),
    }),
    new THREE.MeshBasicMaterial({
      map: loadColorTexture("resources/images/flower-2.jpg"),
    }),
    new THREE.MeshBasicMaterial({
      map: loadColorTexture("resources/images/flower-3.jpg"),
    }),
    new THREE.MeshBasicMaterial({
      map: loadColorTexture("resources/images/flower-4.jpg"),
    }),
    new THREE.MeshBasicMaterial({
      map: loadColorTexture("resources/images/flower-5.jpg"),
    }),
    new THREE.MeshBasicMaterial({
      map: loadColorTexture("resources/images/flower-6.jpg"),
    }),
  ];

  const loadingElem = document.querySelector("#loading");
  const progressBarElem = loadingElem.querySelector(".progressbar");

  // loadManager.onLoad = () => {
  //   loadingElem.style.display = "none";
  //   const cube = new THREE.Mesh(geometry, flowerMats);
  //   cube.position.set(4, 4, 0);
  //   scene.add(cube);
  //   cubes.push(cube); // add to our list of cubes to rotate
  // };

  loadManager.onLoad = () => {
    loadingElem.style.display = "none"; // Hide the loading bar
  };

  loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
    const progress = itemsLoaded / itemsTotal;
    progressBarElem.style.transform = `scaleX(${progress})`; // Update the progress bar
  };

  function createPlasticineMaterials() {
    const loader = new THREE.TextureLoader();
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
    const materials = createPlasticineMaterials(); // Ensure this line is included to define 'materials'
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

    // Add the face decal to the head
    // applyFaceDecal(newAppleHead);

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
    const loader = new THREE.TextureLoader();
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

      // // wireframe cube to show where the decal should be
      // const boxHelper = new THREE.BoxHelper(new THREE.Mesh(decalGeometry, new THREE.MeshBasicMaterial()));
      // boxHelper.update(); // Make sure it updates to fit the decal geometry
      // scene.add(boxHelper);

      // // AxesHelper to see the orientation of the decal
      // const axesHelper = new THREE.AxesHelper(5);
      // axesHelper.position.copy(decalPosition);
      // scene.add(axesHelper);
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

  // const wall = new THREE.TextureLoader();
  // const cylinder = new THREE.CylinderGeometry(1, 2, 5, 5);
  // wall.load("resources/images/wall.jpg", (texture) => {
  //   texture.colorSpace = THREE.SRGBColorSpace;
  //   const material = new THREE.MeshBasicMaterial({
  //     map: texture,
  //   });

  //   const wallMesh = new THREE.Mesh(cylinder, material);
  //   wallMesh.position.x = 10;
  //   wallMesh.position.y = 10;
  //   scene.add(wallMesh);
  //   cubes.push(wallMesh);
  // });

  function loadColorTexture(path) {
    const texture = loader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // render the scene
  renderer.render(scene, camera);

  const objLoader = new OBJLoader(); // Create OBJLoader outside to make it a single instance
  const mtlLoader = new MTLLoader();

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

  // Function to create an oval-shaped bush with a scaled sphere geometry
  function createBush(position) {
    const bushGroup = new THREE.Group();

    const bushGeometry = new THREE.SphereGeometry(1, 32, 32); // Base geometry
    const bushMaterial = new THREE.MeshPhongMaterial({ color: 0x2e8b57 });
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);

    bush.scale.set(2, 1, 1); // Scale to make it oval-shaped
    bush.position.set(0, 1, 0); // Slightly above ground level
    bushGroup.add(bush);

    // Create small triangles for leaves/branches using BufferGeometry
    const triangleGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([0, 0, 0, 0.2, 0.5, 0, 0.4, 0, 0]);
    triangleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );
    triangleGeometry.computeVertexNormals();

    const triangleMaterial = new THREE.MeshPhongMaterial({
      color: 0x144d30, // Darker green
      side: THREE.DoubleSide,
    });

    // Add multiple triangles around the bush
    const numTriangles = 50;
    for (let i = 0; i < numTriangles; i++) {
      const triangleMesh = new THREE.Mesh(triangleGeometry, triangleMaterial);

      // Calculate a random position closer to the surface of the bush
      const angle = Math.random() * Math.PI * 2;
      const distance = 1 + Math.random() * 0.1; // Slightly outside the scaled bush radius
      const height = (Math.random() - 0.5) * 2; // Random height within the bush

      // Scale the radius to make it hug the oval shape more
      const x = distance * Math.cos(angle) * 2; // Scaled oval radius in x
      const y = height + 1; // Centered around the bush's vertical position
      const z = distance * Math.sin(angle); // Scaled oval radius in z

      // Position the triangle closer to the surface
      triangleMesh.position.set(x / 1.35, y, z / 1.005);

      // Randomize rotation
      triangleMesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      bushGroup.add(triangleMesh);
    }

    // Randomly rotate the entire bush around the y-axis to add variety
    bushGroup.rotation.y = Math.random() * Math.PI * 2;

    bushGroup.position.copy(position);
    return bushGroup;
  }

  // Generate random positions for trees and bushes
  function getRandomPosition(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Add trees and bushes to the scene, making sure they are not within the clearing
  for (let i = 0; i < 50; i++) {
    const treePosition = new THREE.Vector3(
      getRandomPosition(-50, 50),
      0,
      getRandomPosition(-50, 50)
    );
    if (!isInClearing(treePosition, clearingCenter, clearingRadius)) {
      scene.add(createTree(treePosition));
    }

    const bushPosition = new THREE.Vector3(
      getRandomPosition(-50, 50),
      0,
      getRandomPosition(-50, 50)
    );
    if (!isInClearing(bushPosition, clearingCenter, clearingRadius)) {
      scene.add(createBush(bushPosition));
    }
  }

  // Function to make a rock with irregular geometry
  function createRock(position) {
    const isBoulder = Math.random() > 0.5; // 50% chance to create a larger rock (boulder)
    const sizeMultiplier = isBoulder ? 2 : 1; // Scale up the size for boulders

    const rockGeometry = new THREE.DodecahedronGeometry(1 * sizeMultiplier, 0); // Dodecahedron for irregular shape
    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);

    rock.scale.set(
      Math.random() * 0.5 + 0.5 * sizeMultiplier, // Random scale for variety
      Math.random() * 0.5 + 0.5 * sizeMultiplier,
      Math.random() * 0.5 + 0.5 * sizeMultiplier
    );
    rock.position.copy(position);
    rock.position.y = 0.5 * sizeMultiplier; // Slightly above ground level

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
      if (
        currentCameraMode === CAMERA_MODES.FREE ||
        currentCameraMode === CAMERA_MODES.ORBIT
      ) {
        freeCamera.aspect = aspect;
        freeCamera.updateProjectionMatrix();

        orbitCamera.aspect = aspect;
        orbitCamera.updateProjectionMatrix();
      }

      if (currentCameraMode === CAMERA_MODES.FLAT) {
        flatCamera.left = (-10 * aspect) / 2;
        flatCamera.right = (10 * aspect) / 2;
        flatCamera.top = 10 / 2;
        flatCamera.bottom = -10 / 2;
        flatCamera.updateProjectionMatrix();
      }
    }
    return needResize;
  }

  // animation loop
  function render(time) {
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

    // console.log(flatCamera.position);

    controls.update(); // Always update controls, it will only have effect if enabled
    cubes.forEach((cube, ndx) => {
      const speed = 0.2 + ndx * 0.1;
      const rot = time * speed;
      cube.rotation.x = rot;
      cube.rotation.y = rot;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
