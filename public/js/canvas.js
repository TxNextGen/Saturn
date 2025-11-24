let scene, camera, renderer, planetGroup, stars;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 15, 80);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    const container = document.getElementById('canvas-container');
    if (container) {
        container.appendChild(renderer.domElement);
    }

    // Create starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        const radius = 500 + Math.random() * 500;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        starPos[i] = radius * Math.sin(phi) * Math.cos(theta);
        starPos[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPos[i + 2] = radius * Math.cos(phi);

        const col = Math.random();
        if (col < 0.3) {
            starColors[i] = 0.58; starColors[i + 1] = 0.2; starColors[i + 2] = 0.92;
        } else if (col < 0.6) {
            starColors[i] = 0.93; starColors[i + 1] = 0.28; starColors[i + 2] = 0.6;
        } else {
            starColors[i] = 1; starColors[i + 1] = 1; starColors[i + 2] = 1;
        }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });

    stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Create planet group
    planetGroup = new THREE.Group();

    // Saturn planet
    const planetGeo = new THREE.SphereGeometry(15, 64, 64);
    const planetMat = new THREE.MeshBasicMaterial({
        color: 0x9333ea,
        transparent: true,
        opacity: 0.9
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planet);

    // Create multiple ring layers
    for (let i = 0; i < 5; i++) {
        const innerRad = 20 + i * 3;
        const outerRad = 23 + i * 3;
        const ringGeo = new THREE.RingGeometry(innerRad, outerRad, 128);
        
        const color = i % 2 === 0 ? 0xec4899 : 0xa855f7;
        const ringMat = new THREE.MeshBasicMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4 - i * 0.05
        });
        
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.2;
        planetGroup.add(ring);
    }

    planetGroup.position.set(-50, -25, -60);
    scene.add(planetGroup);

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.0003;
    
    if (planetGroup) {
        // Orbit the planet around the scene
        planetGroup.position.x = Math.cos(time) * 60 - 20;
        planetGroup.position.y = Math.sin(time * 0.7) * 30 - 10;
        planetGroup.position.z = Math.sin(time) * 50 - 40;
        
        planetGroup.rotation.y += 0.001;
    }
    
    if (stars) {
        stars.rotation.y += 0.0001;
        stars.rotation.x += 0.00005;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) * 0.00005;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.00005;
    
    if (camera) {
        camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * -10 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
    }
});

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

const konamiCode = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a", "Enter"
];
let inputSequence = [];

document.addEventListener("keydown", (event) => {
    inputSequence.push(event.key);
    if (inputSequence.length > konamiCode.length) {
        inputSequence.shift();
    }
    if (JSON.stringify(inputSequence) === JSON.stringify(konamiCode)) {
        window.location.href = "/uihuih";
    }
});

init();