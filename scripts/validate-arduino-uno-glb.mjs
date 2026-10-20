import assert from 'node:assert/strict';
import fs from 'node:fs';
import sharp from 'sharp';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const filePath = 'public/models/arduino-uno.glb';
const file = fs.readFileSync(filePath);
assert.equal(file.readUInt32LE(0), 0x46546c67, 'GLB magic number');
assert.equal(file.readUInt32LE(4), 2, 'GLB version');
assert.equal(file.readUInt32LE(8), file.length, 'GLB total length');

const chunks = [];
let offset = 12;
while (offset < file.length) {
  const length = file.readUInt32LE(offset);
  const type = file.readUInt32LE(offset + 4);
  offset += 8;
  chunks.push({ type, data: file.subarray(offset, offset + length) });
  offset += length;
}

const jsonChunk = chunks.find((chunk) => chunk.type === 0x4e4f534a);
const binaryChunk = chunks.find((chunk) => chunk.type === 0x004e4942);
assert(jsonChunk, 'JSON chunk exists');
assert(binaryChunk, 'BIN chunk exists');
const gltf = JSON.parse(jsonChunk.data.toString());
const binary = binaryChunk.data;
assert.equal(gltf.asset.version, '2.0');
assert(gltf.images.length >= 3, 'embedded PBR images exist');
assert(gltf.images.every((image) => image.bufferView !== undefined && image.uri === undefined), 'images are embedded');
assert(gltf.meshes.length > 100, 'separate component meshes exist');
assert(gltf.meshes.some((mesh) => mesh.name.includes('USB Type-B')), 'USB Type-B connector exists');
assert(gltf.meshes.some((mesh) => mesh.name.includes('ATmega328P')), 'ATmega328P package exists');
assert(gltf.meshes.some((mesh) => mesh.name.includes('DC barrel jack')), 'DC power jack exists');
assert(gltf.meshes.every((mesh) => mesh.primitives.every((primitive) => primitive.attributes.POSITION !== undefined)), 'all meshes have positions');
assert(gltf.meshes.some((mesh) => mesh.primitives[0].attributes.TEXCOORD_0 !== undefined), 'UV mapping exists');
assert(gltf.materials.some((material) => material.pbrMetallicRoughness?.metallicRoughnessTexture), 'metallic-roughness texture exists');
assert(gltf.materials.some((material) => material.normalTexture), 'normal texture exists');
assert(gltf.buffers[0].byteLength <= binary.length, 'binary buffer fits BIN chunk');
for (const view of gltf.bufferViews) {
  assert(view.byteOffset + view.byteLength <= binary.length, 'buffer view fits BIN chunk');
}
for (const accessor of gltf.accessors.filter((item) => item.type === 'VEC3' && item.min && item.max)) {
  assert(accessor.min.every(Number.isFinite) && accessor.max.every(Number.isFinite), 'finite model bounds');
}

globalThis.createImageBitmap = async (blob) => {
  const metadata = await sharp(Buffer.from(await blob.arrayBuffer())).metadata();
  return { width: metadata.width, height: metadata.height, close() {} };
};
globalThis.self = globalThis;
const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
const loaded = await new Promise((resolve, reject) => {
  new GLTFLoader().parse(arrayBuffer, '', resolve, reject);
});
let loadedMeshCount = 0;
let boardMesh;
loaded.scene.traverse((object) => {
  if (object.isMesh) {
    loadedMeshCount += 1;
    if (object.name.startsWith('FR-4_PCB')) boardMesh = object;
  }
});
assert(loadedMeshCount > 100, 'Three.js GLTFLoader loads the component scene');
loaded.scene.updateMatrixWorld(true);
const pivotCenter = new THREE.Box3().setFromObject(loaded.scene).getCenter(new THREE.Vector3());
assert(pivotCenter.length() < 0.00001, 'assembly pivot is centered');
assert(boardMesh, 'FR-4 board mesh exists');
const boardSize = new THREE.Box3().setFromObject(boardMesh).getSize(new THREE.Vector3());
assert(Math.abs(boardSize.x - 0.0686) < 0.0001, 'board width is real-world scale');
assert(Math.abs(boardSize.z - 0.0534) < 0.0001, 'board depth is real-world scale');

console.log(`Valid GLB 2.0: ${file.length} bytes`);
console.log(`${gltf.meshes.length} meshes, ${gltf.nodes.length} nodes, ${gltf.materials.length} materials`);
console.log(`Embedded textures: ${gltf.images.map((image) => image.name).join(', ')}`);
console.log(`Three.js GLTFLoader parsed ${loadedMeshCount} meshes and all embedded PNG textures`);
console.log(`Centered pivot; PCB dimensions: ${(boardSize.x * 1000).toFixed(1)} x ${(boardSize.z * 1000).toFixed(1)} mm`);
