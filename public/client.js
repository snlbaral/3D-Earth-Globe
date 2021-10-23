import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls.js'
import vertexShader from './src/shaders/earth/vertex.glsl.js'
import fragmentShader from './src/shaders/earth/fragment.glsl.js'
import atmosphereVertexShader from './src/shaders/earth/atmosphere/vertex.glsl.js'
import atmosphereFragmentShader from './src/shaders/earth/atmosphere/fragment.glsl.js'
import gsap from '/gsap/index.js'


//canvas
const planetCanvas = document.querySelector('.earth')
const container = document.querySelector('.canvas')

//scene
const scene = new THREE.Scene()

//Camera
const camera = new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1,1000)
camera.position.z = 2.5
scene.add(camera)


const textureLoader = new THREE.TextureLoader()
// const milky = textureLoader.load("./assets/textures/milkyway.jpg")
// scene.background = milky



//Renderer
const renderer = new THREE.WebGLRenderer({
	canvas: planetCanvas,
	antialias: true,
    alpha: true
})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(container.clientWidth, container.clientHeight)

//Window Resize
window.addEventListener("resize", (e)=>{
    renderer.setPixelRatio(e.target.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    camera.aspect = container.clientWidth/container.clientHeight
    camera.updateProjectionMatrix();
})


//Raycaster
const raycaster = new THREE.Raycaster();


//Objects
const earthMap = textureLoader.load('./assets/textures/earth.jpg')
let earthNightMap = null
const earth = new THREE.Mesh(
    new THREE.SphereBufferGeometry(1,24,24),
    new THREE.MeshStandardMaterial({
        roughness: 1,
        metalness: 0,
        map: earthMap,
        bumpMap: textureLoader.load("./assets/textures/earthbump.png"),
        bumpScale: 0.1,
    })
)

const atmosphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(1, 24, 24),
    new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })
)
atmosphere.scale.set(1.1,1.1,1.1)


//Group
const planets = new THREE.Group()
planets.add(atmosphere)

planets.add(earth)
const initRotation = new THREE.Vector3(0.35,-3,0)
planets.rotation.set(initRotation.x, initRotation.y, initRotation.z)
scene.add(planets)

const timeline = gsap.timeline()
const animationTime = 2;
function startEarthAnimation() {
    timeline.from('.earth', {duration: animationTime, scale: 0.3, opacity: 0.3, ease:"back"});
    timeline.from(planets.rotation, {duration: animationTime, y: 45, ease:"back"},`-=${animationTime}`);
}

startEarthAnimation()


gsap.from('.content', {duration: 2, left: "-200vh", delay: 0.5, stagger: 0.6, ease:'back'})



//Shader For Lines
const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        time: {value: 0},
    },
    vertexColors: true
})



/**
* Functions
*/

//Get Position On Sphere According To Latitude & Longitude
function getPositions(lat, long) {
    lat = (90-lat)*Math.PI/180;
    long = (180+long)*Math.PI/180;
    const x = -Math.cos(long)*Math.sin(lat)
    const y = Math.cos(lat)
    const z = Math.sin(long)*Math.sin(lat)
    return {
        x,y,z
    }
}


//Populate Select Field
function populateSelect(places) {
    var options = '<option class="select-none" value="">Select A City</option>'
    places = places.sort((a,b)=>{
        if(a.properties.name.toLowerCase()>b.properties.name.toLowerCase()) {
            return 1
        } else if(a.properties.name.toLowerCase()<b.properties.name.toLowerCase()) {
            return -1
        } else {
            return 0
        }
    })
    places.forEach(pl=>{
        var plName = pl.properties
        options += `<option value="${plName.name}">${plName.name}</option>`
    })
    document.querySelector('.find').innerHTML = options
}


//Create Cureves For Lines Acoording to Position in the Sphere
function createCurves(positionOne, positionTwo) {
    const vec1 = new THREE.Vector3(positionOne.x,positionOne.y,positionOne.z)
    const vec2 = new THREE.Vector3(positionTwo.x,positionTwo.y,positionTwo.z)
    const points = []
    for(var i=0;i<=20;i++) {
        const p = new THREE.Vector3().lerpVectors(vec1, vec2, i/20)
        p.normalize()
        p.multiplyScalar(1 + 0.1*Math.sin(Math.PI*i/20))
        points.push(p)
    }
    const path = new THREE.CatmullRomCurve3(points)
    const geometry = new THREE.TubeBufferGeometry( path, 20, 0.003, 8, false );
    const mesh = new THREE.Mesh( geometry, shaderMaterial );
    planets.add(mesh)
}

let places;
//Create Dots to Correct Places & Execute Curve Function
async function createConnectsAndJoin() {
    var initPlaces = await fetch('./assets/datasets/populated_places_simple.geojson').then(res => res.json())
    places = initPlaces.features

    //populate select field
    populateSelect(places)

    const pointGeometry = new THREE.SphereBufferGeometry(0.02,10,10);
    
    const defaultPos = getPositions(27.7172,85.3240)
    var filter = 0;
    for(var i=0;i<places.length;i++) {
        const pointMaterial = new THREE.MeshBasicMaterial({color:"#ffc107"});
        const mesh = new THREE.Mesh(pointGeometry,pointMaterial)
        const pos1 = getPositions(places[i].properties.latitude, places[i].properties.longitude)
        mesh.position.set(pos1.x,pos1.y,pos1.z)
        mesh.userData = {name: places[i].properties.name, country: places[i].properties.adm0name ,lat: places[i].properties.latitude, long:places[i].properties.longitude}
        planets.add(mesh)
        
        if(i<places.length-1) {
            if(filter<70) {
                const pos2 = getPositions(places[i+1].properties.latitude, places[i+1].properties.longitude)
                createCurves(pos1,pos2)
                filter++
            }
            
        }
    }
}

/**
* Ends Functions
*/


//Init Function
createConnectsAndJoin()



//Light
const ambientLight = new THREE.AmbientLight(0xffffff, 1)
const pointLight = new THREE.PointLight(0xffffff, 1)
pointLight.position.set(5,3,5)
scene.add(ambientLight, pointLight)



//Mouse Move Detections
const mouse = new THREE.Vector2();
//Mouse Move Event Listener
planetCanvas.addEventListener('mousemove',(event)=>{
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
    mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

    var ele = document.querySelector('.place-container')
    const intersects = raycaster.intersectObjects(planets.children);
    for ( let i = 0; i < intersects.length; i ++ ) {
        if(intersects[i].object.geometry.parameters.radius===0.02) {
            planetCanvas.style.cursor = "pointer"
            ele.innerHTML = `<h5>${intersects[i].object.userData.name}</h5>
                            <p class="small">Country: ${intersects[i].object.userData.country}</p>
                            <p class="small">Latitude: ${intersects[i].object.userData.lat}</p>
                            <p class="small">Longitued: ${intersects[i].object.userData.long}</p>`
            ele.style.left = event.clientX+"px"
            ele.style.top = event.clientY+10+"px"
            ele.style.transform = "scale(1)"
        }
    }
    const mouseOver = intersects.find(i=>i.object.geometry.parameters.radius===0.02)
    if(!mouseOver) {
        planetCanvas.style.cursor = "initial"
        planetCanvas.removeAttribute('title')
        ele.style.left = event.clientX+"px"
        ele.style.top = event.clientY+10+"px"
        ele.style.transform = "scale(0)"
    }
})






let customRotation = false;
document.querySelector('#toggle-switch').addEventListener('change',(e)=>{
    timeline.reverse()
    if(!earthNightMap) {
        earthNightMap = textureLoader.load('./assets/textures/earthnight2.jpg')
    }
    setTimeout(()=>{
        if(e.target.checked) {
            earth.material.map = earthNightMap
        } else {
            earth.material.map = earthMap
        }
        planets.rotation.set(initRotation.x,initRotation.y,initRotation.z)
        timeline.restart()
    }, animationTime*1000)
    if(customRotation) {
        gsap.to(planets.rotation, {duration: animationTime, x: customRotation.x, y: customRotation.y, ease:"back", delay: animationTime})
    }
    earth.material.needsUpdate = true
})

document.querySelector('.find').addEventListener('change',(e)=>{
    if(!e.target.value) return false;
    var city = e.target.value.toLowerCase()
    var target = planets.children.find(pl=>{
        if(pl.userData && pl.userData.name) {
            pl.material.color = new THREE.Color("#ffc107")
            return pl.userData.name.toLowerCase()===city
        }
    })
    if(target) {
        target.material.color = new THREE.Color("red")
        target.material.needsUpdate = true
        var c = planets.rotation.y;
        var d = -target.userData.long * (Math.PI / 180)%(2 * Math.PI);
        var e = Math.PI / 2 * -1;
        //planets.rotation.y = c % (2 * Math.PI);
        var rotateX = target.userData.lat * (Math.PI / 180) % Math.PI;
        var rotateY = d+e;
        gsap.to(planets.rotation, {duration: animationTime, x: rotateX, y: rotateY, ease:"back"})
        customRotation = new THREE.Vector2(rotateX, rotateY);
    }
})

document.querySelector('.reset').addEventListener('click',()=>{
    document.querySelector('.select-none').selected = true
    planets.children.forEach(pl=>{
        if(pl.userData && pl.userData.name) {
            pl.material.color = new THREE.Color("#ffc107")
        }
    })
    gsap.to(planets.rotation, {duration: animationTime, x: initRotation.x, y: initRotation.y, z: initRotation.z, ease:"back"})
    customRotation = null
    gsap.to(camera.position, {duration: 2, x: 0, y: 0, z:  2.5, ease:'back'});
})


//Orbit Controls
const control = new OrbitControls(camera, renderer.domElement)
control.maxDistance = 20
control.minDistance = 2;

const clock = new THREE.Clock()
//Run Every Frame
function animate() {
    requestAnimationFrame(animate)   
    raycaster.setFromCamera( mouse, camera );
    shaderMaterial.uniforms.time.value = clock.getElapsedTime()
    //planets.rotation.y = 0.1*clock.getElapsedTime()
    control.update();
    renderer.render(scene, camera)
}
//Init
animate()