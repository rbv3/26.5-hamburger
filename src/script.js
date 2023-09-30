import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'


/**
 * Loaders
 */
const gltfLoader = new GLTFLoader()
const rgbeLoader = new RGBELoader()
const textureLoader = new THREE.TextureLoader()

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
gui.close()
const global = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Update all materials
 */
const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child.isMesh && child.material.isMeshStandardMaterial)
        {
            child.material.envMapIntensity = global.envMapIntensity
            child.castShadow = true
            child.receiveShadow = true
            if(child.geometry.type == 'PlaneGeometry') {
                child.castShadow = false
            }
        }
    })
}

/**
 * Environment map
 */
// Global intensity
global.envMapIntensity = 1
gui
    .add(global, 'envMapIntensity')
    .min(0)
    .max(10)
    .step(0.001)
    .onChange(updateAllMaterials)

// HDR (RGBE) equirectangular
const environmentMap = textureLoader.load('/environmentMaps/garden.jpeg')
environmentMap.mapping = THREE.EquirectangularReflectionMapping
environmentMap.colorSpace = THREE.SRGBColorSpace

scene.background = environmentMap
scene.environment = environmentMap
/*
    Directional Light
*/
// front light
const frontDirectionalLight = new THREE.DirectionalLight('#ffffff', 0.5)
frontDirectionalLight.position.set(0, 6.5, 2.5)

// Shadows
frontDirectionalLight.castShadow = true
frontDirectionalLight.shadow.camera.far = 20
frontDirectionalLight.shadow.mapSize.set(512, 512)
frontDirectionalLight.shadow.normalBias = 0.027
frontDirectionalLight.shadow.bias = - 0.004

// side light
const sideDirectionalLight = new THREE.DirectionalLight('#ffffff', 0.5)
sideDirectionalLight.position.set(-10, 6.5, 7)

gui.add(frontDirectionalLight, 'intensity', 0, 2, 0.01).name('frontLight Intensity')
gui.add(sideDirectionalLight, 'intensity', 0, 2, 0.01).name('sideLight Intensity')

// Shadows
sideDirectionalLight.castShadow = true
sideDirectionalLight.shadow.camera.far = 20
sideDirectionalLight.shadow.mapSize.set(512, 512)
sideDirectionalLight.shadow.normalBias = 0.027
sideDirectionalLight.shadow.bias = - 0.004

// Helper
// const directionalLightCameraHelper = new THREE.CameraHelper(sideDirectionalLight.shadow.camera)
// scene.add(directionalLightCameraHelper)

// Target
frontDirectionalLight.target.position.set(0, 4, 0)
frontDirectionalLight.target.updateWorldMatrix()
sideDirectionalLight.target.position.set(0, 4, 0)
sideDirectionalLight.target.updateWorldMatrix()

scene.add(frontDirectionalLight, sideDirectionalLight)

/*
    Text
*/

// Fonts
const fontLoader = new FontLoader()

const matcapTexture = textureLoader.load('/textures/matcaps/1.png')

let title = null
let subTitle = null
fontLoader.load(
    '/fonts/helvetiker_regular.typeface.json',
    (font) => {
        const titleTextGeometry = new TextGeometry(
            'Yeah, Bitch! I made this FUCKING HAMBURGER',
            {
                font,
                size: 1,
                height: 0.2,
                curveSegments: 5,
            }
        )
        const subTitleTextGeometry = new TextGeometry(
            'You read it right, I DID IT on Blender',
            {
                font,
                size: 0.5,
                height: 0.2,
                curveSegments: 5,
            }
        )
        const textMaterial = new THREE.MeshMatcapMaterial({
            matcap: matcapTexture
        });
        // textMaterial.wireframe = true
        title = new THREE.Mesh(titleTextGeometry, textMaterial)
        subTitle = new THREE.Mesh(subTitleTextGeometry, textMaterial)
        title.position.y = 11
        subTitle.position.y = 9
        scene.add(title, subTitle)
        
        titleTextGeometry.center()
        subTitleTextGeometry.center()
    }
)
/*
    Wall
*/
const wallColorTexture = textureLoader.load('/textures/concrete/concrete_wall_003_diff_1k.jpg')
const wallNormalTexture = textureLoader.load('/textures/concrete/concrete_wall_003_nor_gl_1k.jpg')
const wallAORoughnessMetalnessTexture = textureLoader.load('/textures/concrete/concrete_wall_003_arm_1k.jpg')

wallColorTexture.rotation = Math.PI/2
wallColorTexture.center = new THREE.Vector2(0.5, 0.5);
wallNormalTexture.rotation = Math.PI/2
wallNormalTexture.center = new THREE.Vector2(0.5, 0.5);
wallAORoughnessMetalnessTexture.rotation = Math.PI/2
wallAORoughnessMetalnessTexture.center = new THREE.Vector2(0.5, 0.5);

wallColorTexture.colorSpace = THREE.SRGBColorSpace

// back wall
const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(8,8),
    new THREE.MeshStandardMaterial({
        map: wallColorTexture,
        // normalMap: wallNormalTexture,
        // aoMap: wallAORoughnessMetalnessTexture,
        // roughnessMap: wallAORoughnessMetalnessTexture,
        // metalnessMap: wallAORoughnessMetalnessTexture
    })
)
wall.position.y = 4
wall.position.z = -4
//side wall
const sideWall = new THREE.Mesh(
    new THREE.PlaneGeometry(8,8),
    new THREE.MeshStandardMaterial({
        map: wallColorTexture,
        normalMap: wallNormalTexture,
        aoMap: wallAORoughnessMetalnessTexture,
        roughnessMap: wallAORoughnessMetalnessTexture,
        metalnessMap: wallAORoughnessMetalnessTexture
    })
)
sideWall.position.y = 4
sideWall.position.z = 0
sideWall.position.x = 4
sideWall.rotation.y = - Math.PI * 0.5

scene.add(wall, sideWall)

/*
    Floor
*/
const floorColorTexture = textureLoader.load('/textures/cobblestone/grassy_cobblestone_diff_1k.jpg')
const floorNormalTexture = textureLoader.load('/textures/cobblestone/grassy_cobblestone_nor_gl_1k.jpg')
const floorAORoughnessMetalnessTexture = textureLoader.load('/textures/cobblestone/grassy_cobblestone_arm_1k.jpg')

floorColorTexture.colorSpace = THREE.SRGBColorSpace

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8,8),
    new THREE.MeshStandardMaterial({
        map: floorColorTexture,
        normalMap: floorNormalTexture,
        aoMap: floorAORoughnessMetalnessTexture,
        roughnessMap: floorAORoughnessMetalnessTexture,
        metalnessMap: floorAORoughnessMetalnessTexture
    })
)
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Models
 */
const hamburgerGroup = new THREE.Group()
gltfLoader.load(
    '/models/hamburger.glb',
    (gltf) =>
    {
        gltf.scene.scale.set(0.4, 0.4, 0.4)
        gltf.scene.position.set(0, 2.5, 0)
        hamburgerGroup.add(gltf.scene)
        scene.add(hamburgerGroup)
        updateAllMaterials()
    }
)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-3, 5, 20)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.y = 3.5
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// tone mapping
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3

gui.add(renderer, 'toneMapping', {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping
})
gui.add(renderer, 'toneMappingExposure', 0.1, 10, 0.1)

// Physically accurate lightning
// useLegacyLights were deprecated and the value was set to false as default
// renderer.useLegacyLights = false

// Shadows
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0
const titleLookAtVector = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
const subtTitleLookAtVector = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime
    // Update controls
    controls.update()

    // Animate Hamburger
    hamburgerGroup.rotation.y += deltaTime

    // Animate text
    if(title && subTitle) {
        titleLookAtVector.x += (camera.position.x - titleLookAtVector.x) * deltaTime * 0.5
        titleLookAtVector.y += (camera.position.y - titleLookAtVector.y) * deltaTime * 0.5
        titleLookAtVector.z += (camera.position.z - titleLookAtVector.z) * deltaTime * 0.5

        subtTitleLookAtVector.x += (camera.position.x - subtTitleLookAtVector.x) * deltaTime * 4
        subtTitleLookAtVector.y += (camera.position.y - subtTitleLookAtVector.y) * deltaTime * 4
        subtTitleLookAtVector.z += (camera.position.z - subtTitleLookAtVector.z) * deltaTime * 4

        title.lookAt(titleLookAtVector)
        subTitle.lookAt(subtTitleLookAtVector)
    }
    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()