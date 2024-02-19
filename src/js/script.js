import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {ARButton} from 'three/examples/jsm/webxr/ARButton.js';


let hitTestSource = null;
let hitTestSourceRequested = false;

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.xr.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);
document.body.appendChild(ARButton.createButton(renderer, {requiredFeatures: ['hit-test']})); 

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(1 , 1, 1);
orbit.update(); 

// luz
var ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // cor, intensidade
scene.add(ambientLight);

let mixer;

//armazenar animacoes
const animationMap = new Map();

const Url = new URL('../assets/Otto.glb', import.meta.url);
const assetLoader = new GLTFLoader(); 

const models = {};

assetLoader.load(Url.href, function(gltf) {
    const model = gltf.scene;
    model.scale.set(0.09, 0.09, 0.09);
    //model.position.setComponent(2, -2);
    models['otto'] = model;

    scene.add(model);                                                                                                                           

    //centraliza o modelo
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    mixer = new THREE.AnimationMixer(model);
    const clips = gltf.animations;

    //adiciona todas as animacoes no mapa
    for (const clip of clips) {
        const action = mixer.clipAction(clip);
        animationMap.set(clip.name, action);
    }

    const lArm_A = animationMap.get('lArmMove');
    const rArm_A = animationMap.get('rArmMove');
    lArm_A.play();
    rArm_A.play();

}, undefined, function(error) {
    console.error(error);
});

// Preloada os audio files
const audioLoader = new THREE.AudioLoader();
const audioFiles = {};

const audio0_URL = new URL('../assets/audio/0.mp3', import.meta.url);
    audioLoader.load(audio0_URL.href, function(buffer) {
        audioFiles['audio0'] = buffer;
    });
const audio1_URL = new URL('../assets/audio/1.mp3', import.meta.url);
    audioLoader.load(audio1_URL.href, function(buffer) {
        audioFiles['audio1'] = buffer;
    });
const audio2_URL = new URL('../assets/audio/2.mp3', import.meta.url);
    audioLoader.load(audio2_URL.href, function(buffer) {
        audioFiles['audio2'] = buffer;
    });
const audio3_URL = new URL('../assets/audio/3.mp3', import.meta.url);
    audioLoader.load(audio3_URL.href, function(buffer) {
        audioFiles['audio3'] = buffer;
    });
const audio4_URL = new URL('../assets/audio/4.mp3', import.meta.url);
    audioLoader.load(audio4_URL.href, function(buffer) {
        audioFiles['audio4'] = buffer;
    });
const audio5_URL = new URL('../assets/audio/5.mp3', import.meta.url);
    audioLoader.load(audio5_URL.href, function(buffer) {
        audioFiles['audio5'] = buffer;
    }); 
const audio6_URL = new URL('../assets/audio/6.mp3', import.meta.url);
    audioLoader.load(audio6_URL.href, function(buffer) {
        audioFiles['audio6'] = buffer;
    });
const audio7_URL = new URL('../assets/audio/7.mp3', import.meta.url);
    audioLoader.load(audio7_URL.href, function(buffer) {
        audioFiles['audio7'] = buffer;
    });
const audio8_URL = new URL('../assets/audio/8.mp3', import.meta.url);
    audioLoader.load(audio8_URL.href, function(buffer) {
        audioFiles['audio8'] = buffer;
    });
const audio9_URL = new URL('../assets/audio/9.mp3', import.meta.url);
    audioLoader.load(audio9_URL.href, function(buffer) {
        audioFiles['audio9'] = buffer;
    });
//existe um motivo para nao usar uma funcao para carregar os audios

// funcao para tocar os audios
function playAudio(audioName) {
    const buffer = audioFiles['audio' + audioName];
    if (buffer) {
        const listener = new THREE.AudioListener();
        camera.add(listener);
        const sound = new THREE.Audio(listener);
        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.5);
        sound.play();
    } else {
        console.error(`Audio file '${'audio' + audioName}' not found.`);
    }
}

//audio otto oi
const audioPlayer = document.querySelector('#audio-player');
const playButton = document.querySelector('#play-button');
playButton.addEventListener("click", () => {
    audioPlayer.play();
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2()
let animationBuffer;

renderer.domElement.addEventListener( 'click', onClick, false );

function onClick(event) {
	event.preventDefault();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( scene.children, true );

	if ( intersects.length > 0 ) {
        console.log(intersects[0].object.parent.name);
        animationBuffer = animationMap.get('press_0' + intersects[0].object.parent.name);
        if(animationBuffer) {
            animationBuffer.reset();
            animationBuffer.setLoop(THREE.LoopOnce);
            animationBuffer.play();
            playAudio(intersects[0].object.parent.name);
        }
	}
}

//move otto
let canMove = false;

//reposiciona otto quando a sessao AR e iniciada
renderer.xr.addEventListener('sessionstart', function() {
    //models['otto'].position.set(0, -2, -2);
    canMove = true;
    //muda a escala do modelo
    models['otto'].scale.set(0.05, 0.05, 0.05);
});

//mira
let recticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 'yellow'})
);
recticle.visible = false;
recticle.matrixAutoUpdate = false;
scene.add(recticle);

let controller = renderer.xr.getController(0);
controller.addEventListener('select', onSelect);
scene.add(controller);

//crosshair para o controle
const crosshair = new THREE.Mesh(
    new THREE.CylinderGeometry(0.001, 0.001, 0.001, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
);
scene.add(crosshair);

function onSelect(event) {
    if (recticle.visible) {
        models['otto'].position.setFromMatrixPosition(recticle.matrix);
        canMove = false;
        audioPlayer.play();
    }
    else {
        raycaster.setFromCamera((new THREE.Vector2(controller.position.x, controller.position.y)), camera);
        var intersects = raycaster.intersectObjects( scene.children, true );
        if ( intersects.length > 0 ) {
            console.log(intersects[0].object.parent.name);
            animationBuffer = animationMap.get('press_0' + intersects[0].object.parent.name);
            if(animationBuffer) {
                animationBuffer.reset();
                animationBuffer.setLoop(THREE.LoopOnce);
                animationBuffer.play();
                playAudio(intersects[0].object.parent.name);
            }
        }
    } 
}

const clock = new THREE.Clock();

function animate(timestamp, frame) {
    if(mixer)
        mixer.update(clock.getDelta());

    if(frame){
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        crosshair.position.set(0, 0, -0.1).applyMatrix4(camera.matrixWorld);

        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then(function(referenceSpace) {
                session.requestHitTestSource({space: referenceSpace}).then(function(source) {
                    hitTestSource = source;
                });

            });
            hitTestSourceRequested = true;
            session.addEventListener('end', function() {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });
        }
        if(hitTestSource){
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length && canMove) {
                const hit = hitTestResults[0];
                recticle.visible = true;
                recticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                models['otto'].position.setFromMatrixPosition(recticle.matrix);
            } else {
                recticle.visible = false;
            }
        }
        
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

