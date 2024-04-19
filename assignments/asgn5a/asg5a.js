import * as THREE from 'three';
import { OBJLoader } from 'OBJLoader';
import { MTLLoader } from 'MTLLoader';
import { OrbitControls } from 'OrbitControls';
import { DecalGeometry } from 'DecalGeometry';

function main() {
    // create a canvas element
	const canvas = document.querySelector( '#c' );
    // create a WebGLRenderer
	const renderer = new THREE.WebGLRenderer( { antialias: true, canvas } );

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('skyblue');
    
    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(20, 20, 20);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

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
    let aspectRatio = window.innerWidth/2 / window.innerHeight/2 *100;
    const flatCamera = new THREE.OrthographicCamera(
        -10 * aspectRatio / 2, 10 * aspectRatio / 2, 10 / 2, -10 / 2, 1, 100
    );
    flatCamera.position.set(0, 10, 25);
    flatCamera.lookAt(new THREE.Vector3(0, 8, 0));
    flatCamera.zoom = 26;

    // // Add Camera Helper
    // const cameraHelper = new THREE.CameraHelper(flatCamera);
    // scene.add(cameraHelper);

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
        const spotlight = new THREE.SpotLight(0xffffff, 100, 100, Math.PI / 6, 0.5);
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
        FREE: 'FREE',
        FLAT: 'FLAT',
        ORBIT: 'ORBIT'
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

    document.addEventListener('keydown', (event) => {
        keyStates[event.key.toUpperCase()] = true;
        if (event.key === '1') switchCameraMode(CAMERA_MODES.FREE);
        if (event.key === '2') switchCameraMode(CAMERA_MODES.FLAT);
        if (event.key === '3') switchCameraMode(CAMERA_MODES.ORBIT);
    });

    document.addEventListener('keyup', (event) => {
        keyStates[event.key.toUpperCase()] = false;
    });

    function handleCameraMovement() {
        const moveSpeed = 0.1;
        const vector = new THREE.Vector3();

        if (currentCameraMode === CAMERA_MODES.FREE && controls.enabled) {
            if (keyStates['W']) {
                camera.getWorldDirection(vector);
                camera.position.addScaledVector(vector, moveSpeed);
            }
            if (keyStates['S']) {
                camera.getWorldDirection(vector);
                camera.position.addScaledVector(vector, -moveSpeed);
            }
            if (keyStates['A']) {
                vector.setFromMatrixColumn(camera.matrix, 0);
                camera.position.addScaledVector(vector, -moveSpeed);
            }
            if (keyStates['D']) {
                vector.setFromMatrixColumn(camera.matrix, 0);
                camera.position.addScaledVector(vector, moveSpeed);
            }
            controls.target.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));
        }
    }

    // checkerboard floor
    {
		const planeSize = 500;

		const loader = new THREE.TextureLoader();
		const texture = loader.load( 'resources/images/checker.png' );
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.magFilter = THREE.NearestFilter;
		const repeats = planeSize / 2;
		texture.repeat.set( repeats, repeats );

		const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
		const planeMat = new THREE.MeshPhongMaterial( {
			map: texture,
			side: THREE.DoubleSide,
		} );
		const mesh = new THREE.Mesh( planeGeo, planeMat );
		mesh.rotation.x = Math.PI * - .5;
		scene.add( mesh );

	}
    {
        // Load plasticine textures
        const loader = new THREE.TextureLoader();
        const plasticineTextureGreen = loader.load('resources/images/plasticineNoise.jpg');
        plasticineTextureGreen.wrapS = plasticineTextureGreen.wrapT = THREE.RepeatWrapping;
        plasticineTextureGreen.repeat.set(10, 10);
    
        const bumpMap = loader.load('resources/images/plasticineBump.jpg');
        bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        bumpMap.repeat.set(4, 4);
        
        const plasticineTextureBrown = loader.load('resources/images/plasticineNoise.jpg');
        plasticineTextureBrown.wrapS = plasticineTextureBrown.wrapT = THREE.RepeatWrapping;
        plasticineTextureBrown.repeat.set(1, 1);
        plasticineTextureBrown.offset.set(0.5, 0);

        // Modify existing plane to use green plasticine texture
        const planeSize = 500;
        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
            map: plasticineTextureGreen,
            side: THREE.DoubleSide,
            color: 0x7CFC00 // Bright green color
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.rotation.x = Math.PI * -0.5;
        scene.add(mesh);

        // Add brown plasticine layer beneath the green plane
        const subLayerGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const subLayerMat = new THREE.MeshPhongMaterial({
            map: plasticineTextureBrown,
            side: THREE.DoubleSide,
            color: 0x8B4513  // Saddle brown color
        });
        const subLayerMesh = new THREE.Mesh(subLayerGeo, subLayerMat);
        subLayerMesh.position.y = -7.9;  // Position the brown layer 10 units below the green plane
        subLayerMesh.rotation.x = Math.PI * -0.5;
        scene.add(subLayerMesh);
    }


    // create a box geometry with a width, height, and depth of 1
	const boxWidth = 1;
	const boxHeight = 1;
	const boxDepth = 1;
	const geometry = new THREE.BoxGeometry( boxWidth, boxHeight, boxDepth );

    const cubes = []; // just an array we can use to rotate the cubes

    const loadManager = new THREE.LoadingManager();

    // create a texture loader
    const loader = new THREE.TextureLoader(loadManager);
    const flowerMats = [
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-1.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-2.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-3.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-4.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-5.jpg')}),
        new THREE.MeshBasicMaterial({map: loadColorTexture('resources/images/flower-6.jpg')}),
    ];

    const loadingElem = document.querySelector('#loading');
    const progressBarElem = loadingElem.querySelector('.progressbar');

    loadManager.onLoad = () => {
        loadingElem.style.display = 'none';
        const cube = new THREE.Mesh(geometry, flowerMats);
        cube.position.set(4, 4, 0);
        scene.add(cube);
        cubes.push(cube);  // add to our list of cubes to rotate
    };

    loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal;
        progressBarElem.style.transform = `scaleX(${progress})`;
    };

    function createPlasticineMaterials() {
        const loader = new THREE.TextureLoader();
        const plasticineTexture = loader.load('resources/images/plasticineNoise.jpg');
        plasticineTexture.wrapS = plasticineTexture.wrapT = THREE.RepeatWrapping;
        plasticineTexture.repeat.set(4, 4);
    
        const bumpMap = loader.load('resources/images/plasticineBump.jpg');
        bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
        bumpMap.repeat.set(4, 4);
    
        return {
            head: new THREE.MeshPhongMaterial({
                color: 0xff6347, // Tomato red
                map: plasticineTexture,
                specular: 0x222222,
                shininess: 100,
                bumpMap: bumpMap,
                bumpScale: 1.5
            }),
            body: new THREE.MeshPhongMaterial({
                color: 0xffd700, // Bright yellow
                map: plasticineTexture,
                specular: 0x222222,
                shininess: 100,
                bumpMap: bumpMap,
                bumpScale: 1.5
            }),
            gloves: new THREE.MeshPhongMaterial({
                color: 0xffffff, // Bright white
                map: plasticineTexture,
                specular: 0x222222,
                shininess: 100,
                bumpMap: bumpMap,
                bumpScale: 1.5
            }),
            shoes: new THREE.MeshPhongMaterial({
                color: 0x8b4513, // Saddle brown
                map: plasticineTexture,
                specular: 0x222222,
                shininess: 100,
                bumpMap: bumpMap,
                bumpScale: 1.5
            }),
            swordHandle: new THREE.MeshPhongMaterial({
                color: 0xff6347, // Red
                map: plasticineTexture,
                specular: 0x222222,
                shininess: 100,
                bumpMap: bumpMap,
                bumpScale: 1.5
            }),
            swordBlade: new THREE.MeshPhongMaterial({
                color: 0x808080, // Grey
                specular: 0x666666,
                shininess: 150,
                bumpMap: bumpMap,
                bumpScale: 1  // Less pronounced effect on the blade
            })
        };
    }    

    // creates plasticine objects like apple warrior
    function plasticine() {
        const materials = createPlasticineMaterials();  // Ensure this line is included to define 'materials'
        // Create geometries
        const headGeo = new THREE.SphereGeometry(0.75, 32, 32);
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32);
        const armGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 32);
        const footGeo = new THREE.BoxGeometry(0.4, 0.25, 0.5);
        const handGeo = new THREE.SphereGeometry(0.2, 32, 32);
        const bladeGeo = new THREE.BoxGeometry(0.05, 1.4, 0.1);
        const handleGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 32);
    
        // Create meshes
        const head = new THREE.Mesh(headGeo, materials.head);
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
        head.position.set(0, 1.8, 0);
        body.position.set(0, 0.5, 0);
        leftArm.position.set(-0.7, 0.7, 0);
        rightArm.position.set(0.7, 0.7, 0);
        leftFoot.position.set(-0.3, -0.38, 0);
        rightFoot.position.set(0.3, -0.38, 0);
        leftHand.position.set(-0.7, 0, 0);
        rightHand.position.set(0.7, 0, 0);
        blade.position.z = 0.9;
        handle.position.y = -0.8;
        blade.rotation.x = Math.PI/2; // Rotate the blade to make it vertical
        blade.add(handle);
        leftHand.add(blade);
    
        // Add the face decal to the head
        applyFaceDecal(head);
    
        // Create a group and add all parts to it
        const appleWarrior = new THREE.Group();
        appleWarrior.add(head, body, leftArm, rightArm, leftFoot, rightFoot, leftHand, rightHand);
        appleWarrior.position.set(5, 0.5, 0); // Adjust position as needed
        scene.add(appleWarrior); // Add the whole warrior to the scene
    }    
    plasticine();

    function applyFaceDecal(head) {
        const loader = new THREE.TextureLoader();
        loader.load('resources/images/appleface.png', function(texture) {
            texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    
            const decalMaterial = new THREE.MeshPhongMaterial({
                map: texture,
                transparent: true,
                depthTest: true ,
                depthWrite: true,
                polygonOffset: true,
                polygonOffsetFactor: -4,
                wireframe: false
            });
    
            const decalPosition = new THREE.Vector3(5.15, 2.4, 0.699999);
            const decalNormal = new THREE.Vector3(0, 0, 1);
            const decalSize = new THREE.Vector3(1.4, 1.4, 0.5);
    
            const decalGeometry = new DecalGeometry(head, decalPosition, decalNormal, decalSize);
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
    

    const wall = new THREE.TextureLoader();
	const cylinder = new THREE.CylinderGeometry( 1, 2, 5, 5 );
    wall.load('resources/images/wall.jpg', (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({
            map: texture
        });
    
        const wallMesh = new THREE.Mesh(cylinder, material);
        wallMesh.position.x = 10;
        wallMesh.position.y = 10;
        scene.add(wallMesh);
        cubes.push(wallMesh);
    });

    function loadColorTexture( path ) {
        const texture = loader.load( path );
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    // render the scene
	renderer.render( scene, camera );

    const objLoader = new OBJLoader();  // Create OBJLoader outside to make it a single instance
    const mtlLoader = new MTLLoader();

    mtlLoader.load('resources/models/Lowpoly_tree_sample/Lowpoly_tree_sample.mtl', (mtl) => {
        mtl.preload();  // Prepare the materials
        objLoader.setMaterials(mtl);  // Apply these materials to the OBJLoader

        // Load the OBJ file now that the materials are ready
        objLoader.load('resources/models/Lowpoly_tree_sample/Lowpoly_tree_sample.obj', (root) => {
            root.position.set(0, 0.65, 0);  // Set position here
            scene.add(root);

            // Compute the box that contains all the stuff from root and below
            const box = new THREE.Box3().setFromObject(root);
            const boxSize = box.getSize(new THREE.Vector3()).length();
            const boxCenter = box.getCenter(new THREE.Vector3());

            // Update the controls to handle the new size
            controls.maxDistance = boxSize * 10;
            controls.target.copy(boxCenter);
            controls.update();
        });
    });

    // resize the canvas when the window is resized
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
            renderer.setPixelRatio(window.devicePixelRatio);

            if (currentCameraMode === CAMERA_MODES.FREE || currentCameraMode === CAMERA_MODES.ORBIT) {
                freeCamera.aspect = canvas.clientWidth / canvas.clientHeight;
                freeCamera.updateProjectionMatrix();
                
                orbitCamera.aspect = canvas.clientWidth / canvas.clientHeight;
                orbitCamera.updateProjectionMatrix();
            }

            if (currentCameraMode === CAMERA_MODES.FLAT) {
                flatCamera.left = -width / 2;
                flatCamera.right = width / 2;
                flatCamera.top = height / 2;
                flatCamera.bottom = -height / 2;
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
        
        controls.update();  // Always update controls, it will only have effect if enabled
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