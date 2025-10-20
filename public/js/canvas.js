
        let scene, camera, renderer, particles;

        function init() {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 50;

            renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            document.getElementById('canvas-container').appendChild(renderer.domElement);

          
            const geometry = new THREE.BufferGeometry();
            const particleCount = 1000;
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount * 3; i += 3) {
                positions[i] = (Math.random() - 0.5) * 200;
                positions[i + 1] = (Math.random() - 0.5) * 200;
                positions[i + 2] = (Math.random() - 0.5) * 200;

              
                const colorChoice = Math.random();
                if (colorChoice < 0.5) {
                    colors[i] = 0.58;     
                    colors[i + 1] = 0.2;  
                    colors[i + 2] = 0.92; 
                } else {
                    colors[i] = 0.93;     
                    colors[i + 1] = 0.28; 
                    colors[i + 2] = 0.6;  
                }
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size: 2,
                vertexColors: true,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });

            particles = new THREE.Points(geometry, material);
            scene.add(particles);

            animate();
        }

        function animate() {
            requestAnimationFrame(animate);

            particles.rotation.x += 0.0002;
            particles.rotation.y += 0.0003;

            const positions = particles.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
            }
            particles.geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
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

  
        document.addEventListener('mousemove', (e) => {
            const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
            const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
            
            if (particles) {
                particles.rotation.x = moveY * 0.05;
                particles.rotation.y = moveX * 0.05;
            }
        });

        init();