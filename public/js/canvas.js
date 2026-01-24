let scene, camera, renderer, planetGroup, stars;
let currentTheme = 'default';

const themeColors = {
    default: {
        planet: 0x9333ea,
        rings: [0xec4899, 0xa855f7],
        stars: [[0.58, 0.2, 0.92], [0.93, 0.28, 0.6], [1, 1, 1]]
    },
    blue: {
        planet: 0x6487e6,
        rings: [0x4776d9, 0xa0b1ff],
        stars: [[0.4, 0.5, 1], [0.6, 0.7, 1], [1, 1, 1]]
    },
    night: {
        planet: 0x505050,
        rings: [0x383838, 0xb3b3b3],
        stars: [[0.7, 0.7, 0.7], [0.9, 0.9, 0.9], [1, 1, 1]]
    },
    red: {
        planet: 0x974646,
        rings: [0x722929, 0xffa0a0],
        stars: [[1, 0.4, 0.4], [1, 0.6, 0.6], [1, 1, 1]]
    },
    green: {
        planet: 0x89e664,
        rings: [0x62be46, 0xa8ffa0],
        stars: [[0.4, 1, 0.4], [0.6, 1, 0.6], [1, 1, 1]]
    }
};

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

   
    updateThemeFromStorage();

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

        const colors = themeColors[currentTheme].stars;
        const col = Math.random();
        let colorIndex;
        if (col < 0.3) colorIndex = 0;
        else if (col < 0.6) colorIndex = 1;
        else colorIndex = 2;
        
        starColors[i] = colors[colorIndex][0];
        starColors[i + 1] = colors[colorIndex][1];
        starColors[i + 2] = colors[colorIndex][2];
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

    planetGroup = new THREE.Group();

    const planetGeo = new THREE.SphereGeometry(15, 64, 64);
    const planetMat = new THREE.MeshBasicMaterial({
        color: themeColors[currentTheme].planet,
        transparent: true,
        opacity: 0.9
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planet);

    const ringColors = themeColors[currentTheme].rings;
    for (let i = 0; i < 5; i++) {
        const innerRad = 20 + i * 3;
        const outerRad = 23 + i * 3;
        const ringGeo = new THREE.RingGeometry(innerRad, outerRad, 128);
        
        const color = ringColors[i % 2];
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

function updateTheme(themeName) {
    currentTheme = themeName;
    

    if (planetGroup && planetGroup.children[0]) {
        planetGroup.children[0].material.color.setHex(themeColors[themeName].planet);
        

        const ringColors = themeColors[themeName].rings;
        for (let i = 1; i < planetGroup.children.length; i++) {
            const colorIndex = (i - 1) % 2;
            planetGroup.children[i].material.color.setHex(ringColors[colorIndex]);
        }
    }
    

    if (stars) {
        const colors = themeColors[themeName].stars;
        const colorAttr = stars.geometry.attributes.color;
        for (let i = 0; i < colorAttr.count; i++) {
            const rand = Math.random();
            let colorIndex;
            if (rand < 0.3) colorIndex = 0;
            else if (rand < 0.6) colorIndex = 1;
            else colorIndex = 2;
            
            colorAttr.setXYZ(i, colors[colorIndex][0], colors[colorIndex][1], colors[colorIndex][2]);
        }
        colorAttr.needsUpdate = true;
    }
}

function updateThemeFromStorage() {

    const themeName = localStorage.getItem('current-theme-name');
    if (themeName && themeColors[themeName]) {
        currentTheme = themeName;
        console.log('Canvas theme loaded:', themeName);
        return themeName;
    }
    

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        if (savedTheme.includes('6487e6') || savedTheme.includes('blue')) {
            currentTheme = 'blue';
        } else if (savedTheme.includes('818181') || savedTheme.includes('night')) {
            currentTheme = 'night';
        } else if (savedTheme.includes('974646') || savedTheme.includes('red')) {
            currentTheme = 'red';
        } else if (savedTheme.includes('89e664') || savedTheme.includes('green')) {
            currentTheme = 'green';
        } else {
            currentTheme = 'default';
        }
        console.log('Canvas theme loaded from CSS:', currentTheme);
        return currentTheme;
    } else {
        currentTheme = 'default';
        console.log('Canvas theme: default');
        return 'default';
    }
}


window.updateCanvasTheme = updateTheme;

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.0003;
    
    if (planetGroup) {
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