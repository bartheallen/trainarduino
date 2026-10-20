'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerspectiveCamera, Sparkles, useGLTF } from '@react-three/drei';
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';

useGLTF.preload('/models/arduino-uno.glb');

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function easeBetween(value: number, start: number, end: number) {
  const amount = clamp((value - start) / (end - start), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function getCinematicProgress(progress: number) {
  if (progress < 0.22) {
    return 0.08 * easeBetween(progress, 0, 0.16);
  }
  if (progress < 0.78) {
    return 0.08 + 0.78 * easeBetween(progress, 0.22, 0.72);
  }
  return 0.86 + 0.14 * easeBetween(progress, 0.78, 1);
}

function useScrollProgress() {
  const progressRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      progressRef.current = clamp(window.scrollY / maxScroll, 0, 1);
    };

    update();
    const onScroll = () => update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return progressRef;
}

class ModelErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

function ArduinoModel() {
  const { scene } = useGLTF('/models/arduino-uno.glb');
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }

      object.castShadow = true;
      object.receiveShadow = true;
      object.material = Array.isArray(object.material)
        ? object.material.map((material) => {
            const preserved = material.clone();
            if (preserved instanceof THREE.MeshStandardMaterial) {
              preserved.envMapIntensity = Math.max(preserved.envMapIntensity, 1.15);
            }
            return preserved;
          })
        : (() => {
            const preserved = object.material.clone();
            if (preserved instanceof THREE.MeshStandardMaterial) {
              preserved.envMapIntensity = Math.max(preserved.envMapIntensity, 1.15);
            }
            return preserved;
          })();
    });

    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 14 / Math.max(size.x, size.y, size.z, 0.001);

    return {
      scene: clone,
      scale,
      position: new THREE.Vector3(-center.x * scale, 0.3 - center.y * scale, -center.z * scale),
    };
  }, [scene]);

  return (
    <group position={model.position} scale={model.scale} rotation={[-0.2, 0.78, 0.08]}>
      <primitive object={model.scene} />
    </group>
  );
}

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera } = useThree();
  const progressRef = useScrollProgress();
  const rollRef = useRef(0);
  const path = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2, 3.8, 15),
        new THREE.Vector3(-1.7, 3.92, 13.5),
        new THREE.Vector3(-0.5, 4.15, 11.1),
        new THREE.Vector3(1.8, 4.4, 8.7),
        new THREE.Vector3(4.2, 4.7, 6.2),
        new THREE.Vector3(5.8, 5, 4.2),
        new THREE.Vector3(6.8, 5.3, 2.5),
        new THREE.Vector3(7.2, 5.5, 1.2),
      ], false, 'centripetal'),
    [],
  );

  const lookTarget = useMemo(() => new THREE.Vector3(0, 0.8, 0), []);

  useFrame((_, delta) => {
    const normalized = clamp(progressRef.current, 0, 1);
    const p = reducedMotion ? normalized * 0.65 : getCinematicProgress(normalized);
    const anchor = path.getPointAt(p);
    const focus = path.getPointAt(Math.min(p + 0.06, 1));
    const targetPosition = anchor.clone();
    const before = path.getTangentAt(Math.max(p - 0.015, 0));
    const after = path.getTangentAt(Math.min(p + 0.015, 1));
    const curveBank = reducedMotion ? 0 : clamp((after.x - before.x) * -0.12, -0.035, 0.035);
    const gentleRoll = reducedMotion ? 0 : Math.sin(p * Math.PI * 2) * 0.008;
    const targetRoll = curveBank + gentleRoll;
    const damping = reducedMotion ? 0.09 : 0.038;
    const easing = 1 - Math.exp(-delta * 60 * damping);
    camera.position.lerp(targetPosition, easing);
    rollRef.current = THREE.MathUtils.damp(rollRef.current, targetRoll, reducedMotion ? 2 : 1.1, delta);
    lookTarget.lerp(focus, easing);
    camera.lookAt(lookTarget);
    camera.rotateZ(rollRef.current);
  });

  return null;
}

function SceneContent() {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.6, 15]} fov={34} near={0.1} far={100} />
      <color attach="background" args={['#07121c']} />
      <fog attach="fog" args={['#07121c', 10, 30]} />

      <ambientLight intensity={0.7} color="#eaf3ff" />
      <hemisphereLight intensity={0.75} color="#dfeeff" groundColor="#050d18" />
      <directionalLight position={[7, 8, 7]} intensity={1.35} color="#f4f7ff" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-radius={5} />
      <directionalLight position={[-9, 6, -5]} intensity={1.15} color="#9ec8ff" />
      <directionalLight position={[2, 5, -8]} intensity={0.8} color="#f3d0a9" />
      <pointLight position={[0, 2.5, 4]} intensity={1.3} color="#6db8ff" />
      <pointLight position={[-4, 1.5, 2]} intensity={0.55} color="#ffc28a" distance={12} />

      <Environment resolution={128} environmentIntensity={0.35}>
        <Lightformer form="rect" intensity={1.4} color="#eef5ff" position={[0, 5, -7]} scale={[10, 5, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffc995" position={[-7, 2, 1]} scale={[5, 3, 1]} />
      </Environment>

      <Sparkles count={22} scale={[18, 8, 16]} size={0.7} speed={reducedMotion ? 0 : 0.07} color="#dfeeff" opacity={0.2} />

      <CameraRig reducedMotion={reducedMotion} />
      <ModelErrorBoundary>
        <Suspense fallback={null}>
          <ArduinoModel />
        </Suspense>
      </ModelErrorBoundary>
    </>
  );
}

export function ArduinoScene() {
  return (
    <div className="relative h-full w-full">
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.8]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        shadows
        camera={{ position: [0, 1.6, 15], fov: 34, near: 0.1, far: 100 }}
      >
        <SceneContent />
      </Canvas>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 backdrop-blur-[1px] [mask-image:radial-gradient(ellipse_at_center,transparent_58%,black_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(2,8,15,0.18)_100%)]" />
    </div>
  );
}
