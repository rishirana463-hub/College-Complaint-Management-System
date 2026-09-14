import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Float,
  OrbitControls,
  RoundedBox,
  Text,
  useGLTF,
  useCursor,
} from "@react-three/drei";
import { a, useSpring } from "@react-spring/three";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

function BookModel({ reducedMotion, hovered, dragging }) {
  const open = false;
  const book = useRef();
  const { scene: vintageBook } = useGLTF("/models/vintage-book-optimized.glb");
  const idleRotation = useRef(-0.1);
  const lastActivity = useRef(performance.now());
  const tilt = useRef({ x: 0, y: 0 });
  const leatherTexture = useMemo(() => {
    const size = 64;
    const data = new Uint8Array(size * size);
    for (let index = 0; index < data.length; index += 1) {
      const grain = 112 + Math.floor(Math.random() * 92);
      data[index] = grain;
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 7);
    texture.needsUpdate = true;
    return texture;
  }, []);
  const cornerShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.3, 0);
    shape.lineTo(0, 0.3);
    shape.closePath();
    return shape;
  }, []);

  const coverAnimation = useSpring({
    rotationY: open ? -Math.PI * 0.82 : 0,
    config: { mass: 1.5, tension: 110, friction: 18 },
  });

  useEffect(() => {
    lastActivity.current = performance.now();
  }, [hovered, dragging]);

  useEffect(() => {
    vintageBook.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [vintageBook]);

  useFrame((state, delta) => {
    if (!book.current || reducedMotion) return;
    const now = performance.now();
    const idle = !hovered && !dragging && now - lastActivity.current > 1500;
    if (idle) idleRotation.current += delta * 0.22;

    const targetX = -0.12 + (hovered ? state.pointer.y * 0.08 : 0);
    const targetY = hovered ? state.pointer.x * 0.14 : 0;
    tilt.current.x = THREE.MathUtils.lerp(tilt.current.x, targetX, 0.07);
    tilt.current.y = THREE.MathUtils.lerp(tilt.current.y, targetY, 0.07);
    book.current.rotation.x = THREE.MathUtils.lerp(
      book.current.rotation.x,
      tilt.current.x,
      0.08,
    );
    book.current.rotation.y = THREE.MathUtils.lerp(
      book.current.rotation.y,
      idleRotation.current + tilt.current.y,
      0.08,
    );
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.5}
      rotationIntensity={reducedMotion ? 0 : 0.12}
      floatIntensity={reducedMotion ? 0 : 0.35}
    >
      <group
        ref={book}
        rotation={[-0.12, -0.1, -0.05]}
        scale={hovered ? 1.04 : 1}
      >
        <group visible={open}>
          <RoundedBox
            args={[2.8, 3.8, 0.15]}
            radius={0.09}
            smoothness={5}
            position={[0, 0, -0.3]}
          >
            <meshStandardMaterial
              color="#5c3d16"
              roughness={0.68}
              metalness={0.03}
              bumpMap={leatherTexture}
              bumpScale={0.035}
              roughnessMap={leatherTexture}
            />
          </RoundedBox>
          <RoundedBox
            args={[2.58, 3.58, 0.48]}
            radius={0.05}
            smoothness={4}
            position={[0.05, 0, -0.02]}
          >
            <meshStandardMaterial color="#f2ead9" roughness={0.82} />
          </RoundedBox>
          <group>
            <mesh position={[0.05, 1.8, -0.02]}>
              <boxGeometry args={[2.45, 0.035, 0.5]} />
              <meshStandardMaterial color="#f2ead9" roughness={0.78} />
            </mesh>
            <mesh position={[0.05, -1.8, -0.02]}>
              <boxGeometry args={[2.45, 0.035, 0.5]} />
              <meshStandardMaterial color="#f2ead9" roughness={0.78} />
            </mesh>
            <mesh position={[1.32, 0, -0.02]}>
              <boxGeometry args={[0.035, 3.35, 0.5]} />
              <meshStandardMaterial color="#f2ead9" roughness={0.78} />
            </mesh>
            {[
              1.32, 1.08, 0.84, 0.6, 0.36, 0.12, -0.12, -0.36, -0.6, -0.84,
              -1.08, -1.32,
            ].map((y) => (
              <mesh key={y} position={[1.345, y, 0.24]}>
                <boxGeometry args={[0.012, 0.018, 0.42]} />
                <meshStandardMaterial color="#d8ccb8" roughness={0.9} />
              </mesh>
            ))}
          </group>
          <group position={[0.18, 0, 0.25]} rotation={[0, 0, 0.01]}>
            <Text
              color="#111111"
              fontSize={0.24}
              anchorX="center"
              anchorY="middle"
              position={[0, 0.62, 0.02]}
            >
              CAMPUSDESK
            </Text>
            <Text
              color="#111111"
              fontSize={0.17}
              anchorX="center"
              anchorY="middle"
              position={[0, 0.25, 0.02]}
            >
              SUBMIT · TRACK · RESOLVE
            </Text>
            <mesh position={[0, -0.2, 0.01]}>
              <boxGeometry args={[1.35, 0.025, 0.01]} />
              <meshStandardMaterial
                color="#bddc88"
                emissive="#78994d"
                emissiveIntensity={0.15}
              />
            </mesh>
          </group>
          <mesh position={[1.34, 0, 0]}>
            <boxGeometry args={[0.035, 3.4, 0.42]} />
            <meshStandardMaterial
              color="#c8ef88"
              emissive="#769844"
              emissiveIntensity={0.2}
            />
          </mesh>
          <RoundedBox
            args={[0.24, 3.82, 0.67]}
            radius={0.08}
            smoothness={5}
            position={[-1.38, 0, 0]}
          >
            <meshStandardMaterial
              color="#5c3d16"
              roughness={0.68}
              metalness={0.03}
              bumpMap={leatherTexture}
              bumpScale={0.035}
              roughnessMap={leatherTexture}
            />
          </RoundedBox>
          {[-1.15, -0.38, 0.38, 1.15].map((y) => (
            <RoundedBox
              key={y}
              args={[0.22, 0.04, 0.035]}
              radius={0.012}
              smoothness={2}
              position={[-1.38, y, 0.36]}
            >
              <meshStandardMaterial
                color="#7a5220"
                roughness={0.56}
                metalness={0.04}
              />
            </RoundedBox>
          ))}
          <a.group
            position={[-1.4, 0, 0.3]}
            rotation-y={coverAnimation.rotationY}
          >
            <RoundedBox
              args={[2.8, 3.8, 0.15]}
              radius={0.09}
              smoothness={5}
              position={[1.4, 0, 0]}
              onPointerOver={(event) => {
                event.stopPropagation();
              }}
            >
              <meshStandardMaterial
                color="#5c3d16"
                roughness={0.62}
                metalness={0.04}
                bumpMap={leatherTexture}
                bumpScale={0.035}
                roughnessMap={leatherTexture}
              />
            </RoundedBox>
            <Text
              color="#d4a017"
              fontSize={0.13}
              anchorX="center"
              anchorY="middle"
              position={[1.4, 0.92, 0.17]}
            >
              campusdesk
            </Text>
            <mesh position={[1.4, 0, 0.078]} rotation={[0, 0, -0.62]}>
              <boxGeometry args={[0.4, 4.18, 0.02]} />
              <meshStandardMaterial
                color="#2e1d08"
                roughness={0.9}
                transparent
                opacity={0.34}
              />
            </mesh>
            <mesh position={[1.4, 0, 0.09]} rotation={[0, 0, -0.62]}>
              <boxGeometry args={[0.34, 4.15, 0.075]} />
              <meshStandardMaterial
                color="#c41e3a"
                roughness={0.48}
                metalness={0.03}
              />
            </mesh>
            <mesh position={[1.4, 0, 0.135]} rotation={[0, 0, -0.62]}>
              <boxGeometry args={[0.12, 4.15, 0.025]} />
              <meshStandardMaterial color="#7a1620" roughness={0.6} />
            </mesh>
            {[
              [0.25, 1.42],
              [2.55, 1.42],
              [0.25, -1.42],
              [2.55, -1.42],
            ].map(([x, y], index) => (
              <mesh
                key={index}
                position={[x, y, 0.11]}
                rotation={[0, 0, index % 2 ? Math.PI : 0]}
              >
                <shapeGeometry args={[cornerShape]} />
                <meshStandardMaterial
                  color="#d4a017"
                  roughness={0.3}
                  metalness={0.62}
                />
              </mesh>
            ))}
            <mesh position={[1.4, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.06, 32]} />
              <meshStandardMaterial
                color="#d4a017"
                roughness={0.24}
                metalness={0.68}
                emissive="#6d4b08"
                emissiveIntensity={0.16}
              />
            </mesh>
            <Text
              color="#5c3d16"
              fontSize={0.13}
              anchorX="center"
              anchorY="middle"
              position={[1.4, 0, 0.18]}
            >
              C
            </Text>
          </a.group>
        </group>
        <group position={[3.8, -1.9, 0]} scale={13.5} visible={!open}>
          <primitive
            object={vintageBook}
            onPointerOver={(event) => event.stopPropagation()}
          />
        </group>
      </group>
    </Float>
  );
}

export default function CampusBook() {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(true);
  const reducedMotion = useReducedMotion();
  const container = useRef();

  useCursor(hovered);

  useEffect(() => {
    if (!container.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={container}
      className="campus-book"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <Canvas
        frameloop={inView ? "always" : "never"}
        camera={{ position: [0, 0.2, 7], fov: 36 }}
        dpr={[1, 1.25]}
      >
        <ambientLight intensity={1.25} />
        <directionalLight position={[4, 6, 6]} intensity={2.5} />
        <pointLight position={[-4, 1, 4]} intensity={1.2} color="#d1f49a" />
        <pointLight
          position={[-3.2, 0.4, 1.8]}
          intensity={0.8}
          color="#b9ed78"
          distance={5}
        />
        <BookModel
          reducedMotion={reducedMotion}
          hovered={hovered}
          dragging={dragging}
        />
        <ContactShadows
          position={[0, -2.3, 0]}
          opacity={0.3}
          scale={6}
          blur={2.5}
          frames={Infinity}
        />
        <Environment preset="city" />
        <OrbitControls
          enabled={!reducedMotion}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 2.8}
          maxPolarAngle={Math.PI / 1.8}
          onStart={() => {
            setDragging(true);
            markInteracted();
          }}
          onEnd={() => setDragging(false)}
        />
      </Canvas>
    </div>
  );
}
