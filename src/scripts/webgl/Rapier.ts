import RAPIER from '@dimforge/rapier3d'
import { gl } from './core/WebGL'

type BoxMesh = THREE.Mesh<THREE.BoxGeometry, THREE.Material>
type SphereMesh = THREE.Mesh<THREE.SphereGeometry | THREE.IcosahedronGeometry, THREE.Material>
export type BodyOption = {
  mass?: number
  restitution?: number
  friction?: number
}

class Rapier {
  private world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 })
  private rigidBodyMap = new WeakMap<THREE.Mesh, RAPIER.RigidBody>()
  private dynamicMeshes: THREE.Mesh[] = []

  constructor() {}

  private createRigidBody(mesh: THREE.Mesh, shape: RAPIER.ColliderDesc, mass?: number) {
    const isDynamic = mass && 0 < mass
    const p = mesh.position
    const q = mesh.quaternion

    const rigidBodyDesc = isDynamic ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed()
    rigidBodyDesc.setTranslation(p.x, p.y, p.z)
    rigidBodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })

    const body = this.world.createRigidBody(rigidBodyDesc)
    body.setLinearDamping(0.5)
    body.setAngularDamping(0.8)
    // body.enableCcd(true)
    body.setGravityScale(0.2, true)

    this.world.createCollider(shape, body)

    this.rigidBodyMap.set(mesh, body)

    if (isDynamic) {
      this.dynamicMeshes.push(mesh)
    }
    return body
  }

  createBoxBody(mesh: BoxMesh, option?: BodyOption) {
    const { width, height, depth } = mesh.geometry.parameters
    const shape = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
    shape.setMass(option?.mass ?? 0)
    shape.setRestitution(option?.restitution ?? 0)
    shape.setFriction(option?.friction ?? 1)
    this.createRigidBody(mesh, shape, option?.mass)
  }

  createSphereBody(mesh: SphereMesh, option?: BodyOption) {
    const radius = mesh.geometry.parameters.radius
    const shape = RAPIER.ColliderDesc.ball(radius)
    shape.setMass(option?.mass ?? 0)
    shape.setRestitution(option?.restitution ?? 0)
    shape.setFriction(option?.friction ?? 1)
    this.createRigidBody(mesh, shape, option?.mass)
  }

  createConvexBody(mesh: THREE.Mesh, option?: BodyOption) {
    const positions = mesh.geometry.getAttribute('position') as THREE.Float32BufferAttribute
    const shape = RAPIER.ColliderDesc.convexHull(positions.array as Float32Array)
    if (shape) {
      shape.setMass(option?.mass ?? 0)
      shape.setRestitution(option?.restitution ?? 0)
      shape.setFriction(option?.friction ?? 1)
      this.createRigidBody(mesh, shape, option?.mass)
    }
  }

  getPosition(mesh: THREE.Mesh) {
    return this.rigidBodyMap.get(mesh)?.translation()
  }

  getRotation(mesh: THREE.Mesh) {
    return this.rigidBodyMap.get(mesh)?.rotation()
  }

  syncToMesh(mesh: THREE.Mesh) {
    const p = this.getPosition(mesh)
    const q = this.getRotation(mesh)
    p && mesh.position.set(p.x, p.y, p.z)
    q && mesh.quaternion.set(q.x, q.y, q.z, q.w)
  }

  syncToBody(mesh: THREE.Mesh) {
    const body = this.rigidBodyMap.get(mesh)
    body?.setTranslation({ ...mesh.position }, true)
  }

  update(updateDynamicMesh = true) {
    this.world.timestep = gl.time.delta
    this.world.step()

    if (updateDynamicMesh) {
      this.dynamicMeshes.forEach((mesh) => this.syncToMesh(mesh))
    }
  }
}

export const rapier = new Rapier()
