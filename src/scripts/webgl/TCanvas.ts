import * as THREE from 'three'
import { gl } from './core/WebGL'
import { controls } from './utils/OrbitControls'
import { BodyOption, rapier } from './Rapier'
import { mouse3d } from './utils/Mouse3D'
import { Assets, loadAssets } from './utils/assetLoader'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

export class TCanvas {
  private isWindowFocus = true

  private assets: Assets = {
    model: { path: 'model/frame.glb' },
    env: { path: 'images/blocky_photo_studio_1k.hdr' },
  }

  private lights = new THREE.Group()

  constructor(private container: HTMLElement) {
    loadAssets(this.assets).then(() => {
      this.init()
      this.addEvent()
      this.createFrame()
      this.createObjects()
      this.createLights()
      gl.requestAnimationFrame(this.anime)
    })
  }

  private init() {
    gl.setup(this.container)
    gl.scene.background = new THREE.Color('#0a0a0a')
    gl.camera.position.set(0, 0, 20)

    gl.setStats(this.container)
    controls.primitive.enablePan = false
    // gl.scene.add(new THREE.AxesHelper())
  }

  private addEvent() {
    window.addEventListener('focus', () => {
      this.isWindowFocus = true
    })
    window.addEventListener('blur', () => {
      this.isWindowFocus = false
    })
  }

  private createLights() {
    gl.scene.add(this.lights)

    const ambientLight = new THREE.AmbientLight('#aaa', 0.2)
    this.lights.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight('#ddd', 0.5)
    directionalLight.position.set(10, 10, 10)
    directionalLight.castShadow = true
    const frustum = 10
    directionalLight.shadow.camera = new THREE.OrthographicCamera(-frustum, frustum, frustum, -frustum, 0.01, 30)
    directionalLight.shadow.mapSize.set(1024, 1024)
    this.lights.add(directionalLight)

    // const helper = new THREE.CameraHelper(directionalLight.shadow.camera)
    // gl.scene.add(helper)
  }

  private createFrame() {
    const model = (this.assets.model.data as GLTF).scene.children[0] as THREE.Mesh
    model.material = new THREE.MeshStandardMaterial({
      envMap: this.assets.env.data as THREE.Texture,
      color: '#dfad23',
      envMapIntensity: 0.1,
      metalness: 1,
      roughness: 0.3,
    })
    model.receiveShadow = true
    gl.scene.add(model)
  }

  private createBoundary() {
    const thickness = 10
    const size = 10
    const edge = size + thickness * 2
    const offset = (size + thickness) / 2
    const boundaryMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1, wireframe: true })

    {
      const geometry = new THREE.BoxGeometry(size, size, size)
      const material = new THREE.MeshStandardMaterial({ color: '#020202', side: THREE.BackSide })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.receiveShadow = true
      gl.scene.add(mesh)
    }

    const debugBoundaries = new THREE.Group()
    debugBoundaries.visible = false
    gl.scene.add(debugBoundaries)
    {
      // top
      const geometry = new THREE.BoxGeometry(edge, thickness, edge)
      const mesh = new THREE.Mesh(geometry, boundaryMaterial)
      mesh.position.y = offset
      debugBoundaries.add(mesh)
      rapier.createBoxBody(mesh)
    }
    {
      // bottom
      const geometry = new THREE.BoxGeometry(edge, thickness, edge)
      const mesh = new THREE.Mesh(geometry, boundaryMaterial)
      mesh.position.y = -offset
      debugBoundaries.add(mesh)
      rapier.createBoxBody(mesh)
    }
    {
      // right
      const geometry = new THREE.BoxGeometry(thickness, edge, edge)
      const mesh = new THREE.Mesh(geometry, boundaryMaterial)
      mesh.position.x = offset
      debugBoundaries.add(mesh)
      rapier.createBoxBody(mesh)
    }
    {
      // left
      const geometry = new THREE.BoxGeometry(thickness, edge, edge)
      const mesh = new THREE.Mesh(geometry, boundaryMaterial)
      mesh.position.x = -offset
      debugBoundaries.add(mesh)
      rapier.createBoxBody(mesh)
    }
    {
      // front
      const geometry = new THREE.BoxGeometry(edge, edge, thickness)
      const mesh = new THREE.Mesh(geometry, boundaryMaterial)
      mesh.position.z = offset
      debugBoundaries.add(mesh)
      rapier.createBoxBody(mesh)
    }
    {
      // back
      const geometry = new THREE.BoxGeometry(edge, edge, thickness)
      const mesh = new THREE.Mesh(geometry, boundaryMaterial)
      mesh.position.z = -offset
      debugBoundaries.add(mesh)
      rapier.createBoxBody(mesh)
    }
  }

  private createCursor() {
    const geometry = new THREE.SphereGeometry(2, 16, 8)
    const material = new THREE.MeshBasicMaterial({ wireframe: true, color: '#888' })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'cursor'
    gl.scene.add(mesh)
    mesh.visible = false
    rapier.createSphereBody(mesh)
  }

  private createObjects() {
    this.createBoundary()
    this.createCursor()

    const rand = () => Math.random() * 6 - 3

    const option: BodyOption = {
      mass: 1,
      restitution: 0.1,
      friction: 0,
    }

    const material = new THREE.MeshStandardMaterial({ color: '#050505' })
    const gold = new THREE.MeshStandardMaterial({
      envMap: this.assets.env.data as THREE.Texture,
      color: '#dfad23',
      envMapIntensity: 0.1,
      metalness: 1,
      roughness: 0.4,
    })

    for (let i = 0; i < 10; i++) {
      {
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        // const material = new THREE.MeshBasicMaterial({ wireframe: true, color: '#f00' })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.position.set(rand(), rand(), rand())
        gl.scene.add(mesh)
        rapier.createBoxBody(mesh, option)
      }
      {
        const geometry = new THREE.SphereGeometry(0.7, 24, 16)
        // const material = new THREE.MeshBasicMaterial({ wireframe: true, color: '#0af' })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.position.set(rand(), rand(), rand())
        gl.scene.add(mesh)
        rapier.createSphereBody(mesh, option)
      }
      {
        const geometry = new THREE.TetrahedronGeometry(1)
        // const material = new THREE.MeshBasicMaterial({ wireframe: true, color: '#0f0' })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.position.set(rand(), rand(), rand())
        gl.scene.add(mesh)
        rapier.createConvexBody(mesh, option)
      }
      {
        const geometry = new THREE.OctahedronGeometry(1)
        // const material = new THREE.MeshBasicMaterial({ wireframe: true, color: '#fa0' })
        const mesh = new THREE.Mesh(geometry, i === 0 ? gold : material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.position.set(rand(), rand(), rand())
        gl.scene.add(mesh)
        rapier.createConvexBody(mesh, option)
      }
      {
        const geometry = new THREE.TorusGeometry(0.7, 0.35, 18, 26)
        // const material = new THREE.MeshBasicMaterial({ wireframe: true, color: '#d08' })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.position.set(rand(), rand(), rand())
        gl.scene.add(mesh)
        rapier.createConvexBody(mesh, option)
      }
    }
  }

  // ----------------------------------
  // animation
  private anime = () => {
    this.isWindowFocus && rapier.update()

    this.lights.quaternion.copy(gl.camera.quaternion)

    const cursor = gl.getMesh('cursor')
    cursor.position.copy(mouse3d.position)
    rapier.syncToBody(cursor)

    controls.update()
    gl.render()
  }

  // ----------------------------------
  // dispose
  dispose() {
    gl.dispose()
  }
}
