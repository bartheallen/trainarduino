import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'public', 'models', 'arduino-uno.glb');
const width = 0.0686;
const depth = 0.0534;
const thickness = 0.0016;
const halfWidth = width / 2;
const halfDepth = depth / 2;
const parts = [];
const textures = [];
const descriptors = [];

const boardTextureSvg = (() => {
  const imageWidth = 2048;
  const imageHeight = 1600;
  const px = (x) => ((x + halfWidth) / width) * imageWidth;
  const py = (z) => ((halfDepth - z) / depth) * imageHeight;
  const pathFrom = (points) => points.map(([x, z], index) => `${index ? 'L' : 'M'} ${px(x).toFixed(1)} ${py(z).toFixed(1)}`).join(' ');
  const traces = [
    [[-0.007, 0.002], [-0.016, 0.002], [-0.019, 0.005], [-0.023, 0.005]],
    [[0.007, 0.002], [0.015, 0.002], [0.018, 0.005], [0.023, 0.005]],
    [[0.004, -0.002], [0.013, -0.002], [0.016, -0.005], [0.023, -0.005]],
    [[-0.005, -0.003], [-0.014, -0.003], [-0.017, -0.007], [-0.023, -0.007]],
    [[0.006, 0.005], [0.012, 0.009], [0.019, 0.009], [0.023, 0.013]],
    [[-0.006, -0.005], [-0.012, -0.01], [-0.019, -0.01], [-0.024, -0.015]],
    [[0.008, -0.004], [0.014, -0.008], [0.021, -0.008], [0.026, -0.014]],
    [[-0.002, 0.006], [-0.008, 0.012], [-0.015, 0.012], [-0.021, 0.018]],
    [[0.002, -0.007], [0.007, -0.012], [0.013, -0.012], [0.02, -0.019]],
    [[-0.011, 0.002], [-0.019, 0.002], [-0.025, -0.004]],
  ];
  const traceMarkup = traces.map((trace) => `<path d="${pathFrom(trace)}"/>`).join('');
  const silkText = (x, z, size, text, anchor = 'middle') => `<text x="${px(x)}" y="${py(z)}" text-anchor="${anchor}" font-family="Arial, sans-serif" font-size="${size}" font-weight="600" letter-spacing="1.5">${text}</text>`;
  const pads = [];
  for (let index = 0; index < 14; index += 1) {
    const x = -0.002 + index * 0.00254;
    pads.push(`<circle cx="${px(x)}" cy="${py(0.023)}" r="17"/>`);
  }
  for (let index = 0; index < 8; index += 1) {
    const x = -0.031 + index * 0.00254;
    pads.push(`<circle cx="${px(x)}" cy="${py(-0.023)}" r="17"/>`);
  }
  for (let index = 0; index < 6; index += 1) {
    const x = 0.017 + index * 0.00254;
    pads.push(`<circle cx="${px(x)}" cy="${py(-0.023)}" r="17"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}" viewBox="0 0 ${imageWidth} ${imageHeight}">
    <defs><linearGradient id="mask" x2="0.8" y2="1"><stop stop-color="#0d6388"/><stop offset="0.52" stop-color="#075578"/><stop offset="1" stop-color="#064566"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#mask)"/>
    <g fill="none" stroke="#b77b47" stroke-opacity=".42" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${traceMarkup}</g>
    <g fill="#c28a55" fill-opacity=".82">${pads.join('')}</g>
    <g fill="#e0e8e9" opacity=".88">
      ${silkText(-0.002, 0.014, 47, 'ARDUINO')}
      ${silkText(-0.002, 0.010, 27, 'UNO  R3')}
      ${silkText(0.001, -0.015, 26, 'ATMEGA328P', 'start')}
      ${silkText(-0.021, 0.017, 25, 'POWER')}
      ${silkText(0.021, -0.017, 25, 'ANALOG IN')}
      ${silkText(0.014, 0.017, 25, 'DIGITAL PWM')}
      ${silkText(-0.025, -0.019, 22, 'RESET')}
      ${silkText(-0.008, 0.008, 19, '16.000 MHz')}
      ${silkText(0.02, 0.004, 20, 'ON')}
      ${silkText(0.02, 0.001, 20, 'L')}
      ${silkText(0.02, -0.002, 20, 'TX RX')}
    </g>
    <g fill="none" stroke="#e0e8e9" stroke-opacity=".75" stroke-width="4">
      <path d="M ${px(-0.030)} ${py(0.022)} H ${px(-0.010)}"/>
      <path d="M ${px(0.017)} ${py(-0.022)} H ${px(0.030)}"/>
      <circle cx="${px(0.020)}" cy="${py(0.006)}" r="22"/>
    </g>
  </svg>`;
})();

async function addTexture(name, buffer, colorSpace = 'srgb') {
  const texture = { name, buffer, colorSpace };
  textures.push(texture);
  return textures.length - 1;
}

const boardColorTexture = await addTexture('Solder mask, copper routes and silk screen', await sharp(Buffer.from(boardTextureSvg)).png({ compressionLevel: 9 }).toBuffer());
const boardMetalRoughSvg = boardTextureSvg
  .replace(/<defs>[\s\S]*?<\/defs>/, '')
  .replace(/<rect width="100%" height="100%" fill="[^"]+"\/>/, '<rect width="100%" height="100%" fill="rgb(0,178,5)"/>')
  .replace(/<g fill="none" stroke="#b77b47" stroke-opacity=".42" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">[\s\S]*?<\/g>/, '<g fill="none" stroke="rgb(0,48,175)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">' + boardTextureSvg.match(/<g fill="none" stroke="#b77b47"[\s\S]*?<\/g>/)[0].replace(/^.*?>/, '').replace(/<\/g>$/, '') + '</g>')
  .replace(/<g fill="#c28a55" fill-opacity=".82">[\s\S]*?<\/g>/, '<g fill="rgb(0,48,175)">' + boardTextureSvg.match(/<g fill="#c28a55"[\s\S]*?<\/g>/)[0].replace(/^.*?>/, '').replace(/<\/g>$/, '') + '</g>')
  .replace(/<g fill="#e0e8e9"[\s\S]*?<\/g>/, '')
  .replace(/<g fill="none" stroke="#e0e8e9"[\s\S]*?<\/g>/, '');
const boardMetalRoughTexture = await addTexture('Copper and solder-mask roughness-metalness', await sharp(Buffer.from(boardMetalRoughSvg)).png({ compressionLevel: 9 }).toBuffer(), 'linear');
const flatNormalTexture = await addTexture('PCB micro-normal', await sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 128, g: 128, b: 255, alpha: 1 } } }).png().toBuffer(), 'linear');

const materials = [];
function addMaterial(name, color, metallic = 0, roughness = 0.5, options = {}) {
  const descriptor = { name, color, metallic, roughness, ...options };
  materials.push(descriptor);
  return descriptor;
}
const pcbMaterial = addMaterial('Blue FR-4 solder mask', '#ffffff', 0.18, 0.52, { baseTexture: boardColorTexture, metallicRoughnessTexture: boardMetalRoughTexture, normalTexture: flatNormalTexture });
const copperMaterial = addMaterial('Exposed copper, HASL and contacts', '#c98a4d', 0.92, 0.24);
const solderMaterial = addMaterial('Tin-lead solder', '#bfc7ca', 0.82, 0.2);
const nickelMaterial = addMaterial('Nickel-plated steel', '#c9d0d3', 0.88, 0.22);
const stainlessMaterial = addMaterial('Brushed connector stainless steel', '#b9c1c4', 0.94, 0.28);
const goldMaterial = addMaterial('Gold-plated contacts', '#d2aa62', 0.9, 0.2);
const blackPlastic = addMaterial('Matte black engineering polymer', '#171a1d', 0.04, 0.62);
const chipMaterial = addMaterial('ATmega molded package', '#16191c', 0.08, 0.72);
const ceramicMaterial = addMaterial('Capacitor ceramic', '#d6d0bd', 0.02, 0.32);
const capacitorSleeve = addMaterial('Electrolytic capacitor sleeve', '#26313a', 0.04, 0.49);
const redLens = addMaterial('Red indicator lens', '#b84635', 0.08, 0.24, { alphaMode: 'BLEND', alpha: 0.82, emissive: '#210602', emissiveStrength: 0.18 });
const greenLens = addMaterial('Green power lens', '#89ad74', 0.08, 0.24, { alphaMode: 'BLEND', alpha: 0.78, emissive: '#101b08', emissiveStrength: 0.12 });
const labelMaterial = addMaterial('Package engraving', '#ffffff', 0.02, 0.86, { alphaMode: 'BLEND' });
const darkPort = addMaterial('Connector port interior', '#080b0d', 0.08, 0.68);
const resistorBody = addMaterial('SMD resistor ceramic', '#292c2e', 0.06, 0.55);

const scene = new THREE.Group();
scene.name = 'Arduino Uno R3';
function addMesh(name, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  scene.add(mesh);
  parts.push(mesh);
  return mesh;
}
function roundedBox(name, size, position, material, radius = Math.min(...size) * 0.12, rotation = [0, 0, 0]) {
  const geometry = new RoundedBoxGeometry(...size, 3, Math.min(radius, Math.min(...size) * 0.48));
  return addMesh(name, geometry, material, position, rotation);
}
function cylinder(name, radiusTop, radiusBottom, height, position, material, rotation = [0, 0, 0], segments = 24) {
  return addMesh(name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, position, rotation);
}
function sphere(name, radius, position, material, scale = [1, 1, 1]) {
  return addMesh(name, new THREE.SphereGeometry(radius, 16, 12), material, position, [0, 0, 0], scale);
}
function annulus(name, innerRadius, outerRadius, position, material, underside = false) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 32);
  geometry.rotateX(underside ? Math.PI / 2 : -Math.PI / 2);
  return addMesh(name, geometry, material, position);
}

function makeBoardShape() {
  const radius = 0.0024;
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + radius, -halfDepth);
  shape.lineTo(halfWidth - radius, -halfDepth);
  shape.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + radius);
  shape.lineTo(halfWidth, halfDepth - radius);
  shape.quadraticCurveTo(halfWidth, halfDepth, halfWidth - radius, halfDepth);
  shape.lineTo(-halfWidth + radius, halfDepth);
  shape.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - radius);
  shape.lineTo(-halfWidth, -halfDepth + radius);
  shape.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + radius, -halfDepth);

  for (const [x, z] of [[-0.03175, -0.0235], [-0.03175, 0.0235], [0.03175, -0.0235], [0.03175, 0.0235]]) {
    const hole = new THREE.Path();
    hole.absarc(x, z, 0.00165, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}

const boardGeometry = new THREE.ExtrudeGeometry(makeBoardShape(), { depth: thickness, bevelEnabled: false, curveSegments: 10, steps: 1 });
boardGeometry.rotateX(-Math.PI / 2);
const boardPositions = boardGeometry.getAttribute('position');
const boardUvs = new Float32Array(boardPositions.count * 2);
for (let index = 0; index < boardPositions.count; index += 1) {
  boardUvs[index * 2] = (boardPositions.getX(index) + halfWidth) / width;
  boardUvs[index * 2 + 1] = (halfDepth - boardPositions.getZ(index)) / depth;
}
boardGeometry.setAttribute('uv', new THREE.BufferAttribute(boardUvs, 2));
addMesh('FR-4 PCB 68.6 x 53.4 mm, 1.6 mm', boardGeometry, pcbMaterial, [0, -thickness / 2, 0]);

const boardSvg = (svgX, svgY, svgWidth, svgHeight, contents) => `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">${contents}</svg>`;
const chipSvgData = await sharp(Buffer.from(boardSvg(0, 0, 1024, 420, `<g fill="#aeb1b3" text-anchor="middle" font-family="Arial,sans-serif"><text x="512" y="125" font-size="52" font-weight="700">ATMEL</text><text x="512" y="230" font-size="62" font-weight="700">ATMEGA328P-PU</text><text x="512" y="320" font-size="38">2419  •  16 MHz</text></g>`))).png().toBuffer();

const cpuCenter = [0.0052, 0.00205, 0.0022];
roundedBox('ATmega328P-PU DIP-28 molded package', [0.0184, 0.0028, 0.0076], cpuCenter, chipMaterial, 0.00055);
const chipTop = new THREE.PlaneGeometry(0.0158, 0.0058);
chipTop.rotateX(-Math.PI / 2);
const chipUv = chipTop.getAttribute('uv');
for (let i = 0; i < chipUv.count; i += 1) {
  chipUv.setY(i, 1 - chipUv.getY(i));
}
labelMaterial.baseTexture = await addTexture('ATmega package laser marking', chipSvgData);
addMesh('ATmega328P laser-etched top marking', chipTop, labelMaterial, [cpuCenter[0], cpuCenter[1] + 0.00141, cpuCenter[2]]);

const dipPinPositions = [];
for (let index = 0; index < 14; index += 1) {
  const x = cpuCenter[0] - 0.008255 + index * 0.00127;
  for (const side of [-1, 1]) {
    const z = cpuCenter[2] + side * 0.00415;
    dipPinPositions.push([x, z]);
    roundedBox(`ATmega DIP lead ${index + 1} ${side < 0 ? 'A' : 'B'}`, [0.00048, 0.00028, 0.00135], [x, 0.00073, z], solderMaterial, 0.00006);
    cylinder(`ATmega through-hole solder joint ${index + 1} ${side < 0 ? 'A' : 'B'}`, 0.00067, 0.00067, 0.00022, [x, 0.00088, z], solderMaterial, [0, 0, 0], 16);
  }
}

const usbCenter = [-0.0395, 0.0065, 0.008];
roundedBox('USB Type-B nickel shell', [0.012, 0.0108, 0.0128], usbCenter, stainlessMaterial, 0.0012);
roundedBox('USB Type-B socket aperture', [0.00055, 0.0071, 0.0092], [-0.04555, 0.0064, usbCenter[2]], darkPort, 0.0011);
roundedBox('USB Type-B internal insulator', [0.0006, 0.0021, 0.0065], [-0.0459, 0.0054, usbCenter[2]], blackPlastic, 0.0003);
for (let index = 0; index < 4; index += 1) {
  roundedBox(`USB Type-B gold contact ${index + 1}`, [0.0019, 0.00028, 0.00072], [-0.0449 + index * 0.00003, 0.0061, usbCenter[2] - 0.0027 + index * 0.0018], goldMaterial, 0.00008);
}
roundedBox('USB shell seam', [0.00022, 0.00025, 0.011], [-0.0352, 0.0065, usbCenter[2]], nickelMaterial, 0.00008);

const jackCenter = [-0.024, 0.0058, -0.010];
roundedBox('DC barrel jack black housing', [0.0118, 0.011, 0.013], jackCenter, blackPlastic, 0.0014);
cylinder('DC jack metal bezel', 0.00405, 0.00405, 0.0011, [-0.03015, 0.0063, jackCenter[2]], nickelMaterial, [0, 0, Math.PI / 2], 32);
cylinder('DC jack recessed barrel opening', 0.0029, 0.0029, 0.0007, [-0.03085, 0.0063, jackCenter[2]], darkPort, [0, 0, Math.PI / 2], 32);
cylinder('DC jack center contact', 0.00062, 0.00062, 0.0028, [-0.0291, 0.0063, jackCenter[2]], goldMaterial, [0, 0, Math.PI / 2], 16);

function addHeader(name, pins, housingZ) {
  const xs = pins.map((pin) => pin[0]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  roundedBox(`${name} black socket housing`, [maxX - minX + 0.0022, 0.0024, 0.0028], [(minX + maxX) / 2, 0.00175, housingZ], blackPlastic, 0.0003);
  pins.forEach(([x, z], index) => {
    cylinder(`${name} female contact sleeve ${index + 1}`, 0.00053, 0.00053, 0.0014, [x, 0.00265, z], nickelMaterial, [0, 0, 0], 12);
    roundedBox(`${name} solder tail ${index + 1}`, [0.00055, 0.003, 0.00055], [x, -0.00045, z], goldMaterial, 0.00009);
    cylinder(`${name} plated through-hole pad ${index + 1}`, 0.00093, 0.00093, 0.00018, [x, 0.00084, z], copperMaterial, [0, 0, 0], 16);
    sphere(`${name} solder meniscus ${index + 1}`, 0.00055, [x, -0.00105, z], solderMaterial, [1, 0.56, 1]);
  });
}
const digitalPins = Array.from({ length: 14 }, (_, index) => [-0.002 + index * 0.00254, 0.023]);
const powerPins = Array.from({ length: 8 }, (_, index) => [-0.031 + index * 0.00254, -0.023]);
const analogPins = Array.from({ length: 6 }, (_, index) => [0.017 + index * 0.00254, -0.023]);
addHeader('Digital 0-13 header', digitalPins, 0.023);
addHeader('Power and ICSP header', powerPins, -0.023);
addHeader('Analog A0-A5 header', analogPins, -0.023);

const icspPositions = [];
for (let row = 0; row < 2; row += 1) {
  for (let column = 0; column < 3; column += 1) {
    icspPositions.push([0.015 + column * 0.00254, -0.006 + row * 0.00254]);
  }
}
roundedBox('ICSP 2x3 socket header', [0.0078, 0.0022, 0.0053], [0.01754, 0.0016, -0.00473], blackPlastic, 0.00035);
icspPositions.forEach(([x, z], index) => {
  cylinder(`ICSP contact ${index + 1}`, 0.00052, 0.00052, 0.001, [x, 0.0027, z], goldMaterial, [0, 0, 0], 12);
  cylinder(`ICSP solder joint ${index + 1}`, 0.00078, 0.00078, 0.00018, [x, 0.00084, z], solderMaterial, [0, 0, 0], 16);
});

function addElectrolytic(name, x, z, radius, bodyHeight) {
  cylinder(`${name} aluminum can`, radius, radius * 0.97, bodyHeight, [x, thickness / 2 + bodyHeight / 2, z], nickelMaterial, [0, 0, 0], 32);
  cylinder(`${name} dark sleeve`, radius * 0.965, radius * 0.965, bodyHeight * 0.78, [x, thickness / 2 + bodyHeight * 0.48, z], capacitorSleeve, [0, 0, 0], 32);
  cylinder(`${name} stamped top`, radius * 0.89, radius * 0.89, 0.00025, [x, thickness / 2 + bodyHeight + 0.00012, z], nickelMaterial, [0, 0, 0], 32);
  roundedBox(`${name} top vent score`, [radius * 1.15, 0.0001, 0.00018], [x, thickness / 2 + bodyHeight + 0.00026, z], blackPlastic, 0.00004);
  for (const side of [-1, 1]) {
    const leadX = x + side * radius * 0.42;
    roundedBox(`${name} radial lead ${side}`, [0.00045, 0.0035, 0.00045], [leadX, 0, z], solderMaterial, 0.00007);
    cylinder(`${name} solder fillet ${side}`, 0.00072, 0.00072, 0.00018, [leadX, 0.00084, z], solderMaterial, [0, 0, 0], 16);
  }
}
addElectrolytic('100 uF input capacitor', -0.019, 0.004, 0.0033, 0.0078);
addElectrolytic('47 uF regulator capacitor', -0.017, -0.008, 0.0027, 0.0063);
addElectrolytic('10 uF logic capacitor', 0.014, 0.009, 0.0021, 0.0051);

roundedBox('16 MHz crystal metal can', [0.0052, 0.0015, 0.0034], [-0.0083, 0.0018, 0.0077], nickelMaterial, 0.00055);
roundedBox('Crystal ground tab', [0.0011, 0.00025, 0.0035], [-0.0083, 0.001, 0.0077], solderMaterial, 0.0001);

function addSmd(name, x, z, bodySize, bodyMaterial = resistorBody, rotation = 0) {
  roundedBox(`${name} ceramic body`, [bodySize[0], bodySize[2], bodySize[1]], [x, thickness / 2 + bodySize[2] / 2, z], bodyMaterial, Math.min(bodySize[1], bodySize[2]) * 0.22, [0, rotation, 0]);
  for (const side of [-1, 1]) {
    roundedBox(`${name} nickel termination ${side}`, [bodySize[0] * 0.18, bodySize[2] * 0.75, bodySize[1] * 1.04], [x + side * bodySize[0] * 0.42, thickness / 2 + bodySize[2] / 2, z], nickelMaterial, bodySize[2] * 0.12, [0, rotation, 0]);
  }
}
addSmd('Reset pull-up 10k', -0.025, 0.001, [0.0032, 0.0016, 0.00065]);
addSmd('USB series resistor', -0.015, 0.014, [0.0032, 0.0016, 0.00065]);
addSmd('Power filter capacitor', -0.008, 0.013, [0.0032, 0.0016, 0.0008], ceramicMaterial);
addSmd('Voltage regulator', -0.015, -0.017, [0.0048, 0.0032, 0.0014], blackPlastic);
addSmd('USB protection IC', -0.009, -0.013, [0.0042, 0.003, 0.0011], chipMaterial);
addSmd('LED current resistor', 0.017, 0.014, [0.0032, 0.0016, 0.00065]);
addSmd('RX current resistor', 0.022, 0.014, [0.0032, 0.0016, 0.00065]);
addSmd('TX current resistor', 0.027, 0.014, [0.0032, 0.0016, 0.00065]);

function addIndicator(name, x, z, material) {
  const leadOffset = 0.0012;
  cylinder(`${name} LED lens body`, 0.00105, 0.00115, 0.0022, [x, 0.0021, z], material, [0, 0, 0], 20);
  sphere(`${name} domed lens`, 0.00104, [x, 0.00325, z], material, [1, 0.56, 1]);
  for (const side of [-1, 1]) {
    const leadX = x + side * leadOffset;
    roundedBox(`${name} lead ${side}`, [0.0004, 0.0025, 0.0004], [leadX, -0.00015, z], solderMaterial, 0.00005);
    cylinder(`${name} solder joint ${side}`, 0.00065, 0.00065, 0.00018, [leadX, 0.00084, z], solderMaterial, [0, 0, 0], 16);
  }
}
addIndicator('ON green LED', 0.020, 0.009, greenLens);
addIndicator('L amber LED', 0.025, 0.009, goldMaterial);
addIndicator('TX red LED', 0.030, 0.009, redLens);
addIndicator('RX green LED', 0.030, 0.006, greenLens);

roundedBox('Reset tactile switch housing', [0.0062, 0.0031, 0.0062], [-0.027, 0.00225, -0.004], blackPlastic, 0.0008);
cylinder('Reset button stainless cap', 0.0018, 0.0018, 0.0011, [-0.027, 0.00435, -0.004], nickelMaterial, [0, 0, 0], 24);

const terminalMounts = [[-0.03175, -0.0235], [-0.03175, 0.0235], [0.03175, -0.0235], [0.03175, 0.0235]];
terminalMounts.forEach(([x, z], index) => {
  annulus(`Mounting hole ${index + 1} copper annulus`, 0.00165, 0.0023, [x, thickness / 2 + 0.00003, z], copperMaterial);
  annulus(`Mounting hole ${index + 1} underside annulus`, 0.00165, 0.0023, [x, -thickness / 2 - 0.00003, z], copperMaterial, true);
});

scene.updateMatrixWorld(true);
const assemblyBounds = new THREE.Box3().setFromObject(scene);
const assemblyCenter = assemblyBounds.getCenter(new THREE.Vector3());
scene.position.sub(assemblyCenter);

function sRGBToLinear(hex) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255].map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
}
function addBytes(binaryParts, data, target) {
  const currentLength = binaryParts.reduce((sum, item) => sum + item.length, 0);
  const padding = (4 - (currentLength % 4)) % 4;
  if (padding) binaryParts.push(Buffer.alloc(padding));
  const byteOffset = currentLength + padding;
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  binaryParts.push(buffer);
  const view = { buffer: 0, byteOffset, byteLength: buffer.length };
  if (target) view.target = target;
  return view;
}
function floatBytes(array) {
  return Buffer.from(array.buffer, array.byteOffset, array.byteLength);
}
function geometryAccessor(geometry, semantic, binaryParts, bufferViews, accessors) {
  let source = geometry;
  if (source.index) source = source.toNonIndexed();
  if (!source.getAttribute('normal')) source.computeVertexNormals();
  const attribute = source.getAttribute(semantic === 'TEXCOORD_0' ? 'uv' : semantic.toLowerCase());
  if (!attribute) return null;
  const values = Float32Array.from(attribute.array);
  const view = addBytes(binaryParts, floatBytes(values), 34962);
  const type = semantic === 'POSITION' || semantic === 'NORMAL' ? 'VEC3' : 'VEC2';
  const accessor = { bufferView: bufferViews.push(view) - 1, componentType: 5126, count: attribute.count, type };
  if (semantic === 'POSITION') {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < values.length; i += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], values[i + axis]);
        max[axis] = Math.max(max[axis], values[i + axis]);
      }
    }
    accessor.min = min;
    accessor.max = max;
  }
  return accessors.push(accessor) - 1;
}

const binaryParts = [];
const bufferViews = [];
const accessors = [];
const materialIndex = new Map();
const textureViews = [];
const gltfTextures = textures.map((texture) => {
  const view = addBytes(binaryParts, texture.buffer);
  textureViews.push(bufferViews.push(view) - 1);
  return { name: texture.name, sampler: 0, source: textureViews.length - 1 };
});
const gltfMaterials = materials.map((material) => {
  const result = {
    name: material.name,
    pbrMetallicRoughness: {
      baseColorFactor: material.color === '#ffffff' ? [1, 1, 1, material.alpha ?? 1] : [...sRGBToLinear(material.color), material.alpha ?? 1],
      metallicFactor: material.metallic,
      roughnessFactor: material.roughness,
    },
  };
  if (material.baseTexture !== undefined) result.pbrMetallicRoughness.baseColorTexture = { index: material.baseTexture, texCoord: 0 };
  if (material.metallicRoughnessTexture !== undefined) result.pbrMetallicRoughness.metallicRoughnessTexture = { index: material.metallicRoughnessTexture, texCoord: 0 };
  if (material.normalTexture !== undefined) result.normalTexture = { index: material.normalTexture, texCoord: 0, scale: 0.18 };
  if (material.emissive) {
    result.emissiveFactor = sRGBToLinear(material.emissive).map((channel) => channel * (material.emissiveStrength ?? 1));
  }
  if (material.alphaMode) result.alphaMode = material.alphaMode;
  return result;
});

const geometryAccessors = new WeakMap();
const gltfMeshes = [];
const gltfNodes = [];
function visit(object, parentIndex = null) {
  const node = { name: object.name || 'Scene node' };
  if (object.position.length() > 0) node.translation = object.position.toArray();
  if (object.quaternion.angleTo(new THREE.Quaternion()) > 1e-7) node.rotation = object.quaternion.toArray();
  if (object.scale.x !== 1 || object.scale.y !== 1 || object.scale.z !== 1) node.scale = object.scale.toArray();

  if (object.isMesh) {
    let accessorsForGeometry = geometryAccessors.get(object.geometry);
    if (!accessorsForGeometry) {
      accessorsForGeometry = {
        POSITION: geometryAccessor(object.geometry, 'POSITION', binaryParts, bufferViews, accessors),
        NORMAL: geometryAccessor(object.geometry, 'NORMAL', binaryParts, bufferViews, accessors),
        TEXCOORD_0: geometryAccessor(object.geometry, 'TEXCOORD_0', binaryParts, bufferViews, accessors),
      };
      geometryAccessors.set(object.geometry, accessorsForGeometry);
    }
    const material = materials.indexOf(object.material);
    let meshIndex = gltfMeshes.findIndex((mesh) => mesh.extras?.geometry === object.geometry && mesh.extras?.material === object.material);
    if (meshIndex < 0) {
      const primitive = { attributes: { POSITION: accessorsForGeometry.POSITION, NORMAL: accessorsForGeometry.NORMAL }, mode: 4, material };
      if (accessorsForGeometry.TEXCOORD_0 !== null) primitive.attributes.TEXCOORD_0 = accessorsForGeometry.TEXCOORD_0;
      meshIndex = gltfMeshes.push({ name: object.name, primitives: [primitive], extras: { geometry: object.geometry, material: object.material } }) - 1;
    }
    node.mesh = meshIndex;
  }

  const index = gltfNodes.push(node) - 1;
  if (parentIndex !== null) {
    gltfNodes[parentIndex].children ??= [];
    gltfNodes[parentIndex].children.push(index);
  }
  for (const child of object.children) visit(child, index);
  return index;
}

const rootNode = visit(scene);
for (const mesh of gltfMeshes) delete mesh.extras;
const imageDescriptors = textures.map((texture, index) => ({ name: texture.name, mimeType: 'image/png', bufferView: textureViews[index] }));
const finalBinary = Buffer.concat(binaryParts);
const gltf = {
  asset: { version: '2.0', generator: 'TrainArduino Arduino Uno R3 product asset generator' },
  scene: 0,
  scenes: [{ name: 'Arduino Uno R3 product model', nodes: [rootNode] }],
  nodes: gltfNodes,
  meshes: gltfMeshes,
  materials: gltfMaterials,
  textures: gltfTextures,
  images: imageDescriptors,
  samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
  accessors,
  bufferViews,
  buffers: [{ byteLength: finalBinary.length }],
};
const jsonChunk = Buffer.from(JSON.stringify(gltf));
const jsonPadding = (4 - (jsonChunk.length % 4)) % 4;
const paddedJson = Buffer.concat([jsonChunk, Buffer.alloc(jsonPadding, 0x20)]);
const binaryPadding = (4 - (finalBinary.length % 4)) % 4;
const paddedBinary = Buffer.concat([finalBinary, Buffer.alloc(binaryPadding)]);
const totalLength = 12 + 8 + paddedJson.length + 8 + paddedBinary.length;
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(totalLength, 8);
const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(paddedJson.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(paddedBinary.length, 0);
binaryHeader.writeUInt32LE(0x004e4942, 4);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]));
console.log(`Wrote ${outputPath}`);
console.log(`${parts.length} named component meshes, ${gltfMaterials.length} PBR materials, ${textures.length} embedded PNG textures, ${(totalLength / 1024 / 1024).toFixed(2)} MiB GLB`);
