"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- three is an untyped UMD global */

// Rotating Earth for the landing hero (ported from maestro-landing.html). Loads a
// self-hosted three.js (UMD → window.THREE) and renders a blue-marble globe peeking up
// from the bottom. Degrades silently if WebGL/three is unavailable — the starfield and
// wordmark still carry the page. three is a runtime <script>, so it never enters our bundle.

// biome-ignore lint/suspicious/noExplicitAny: three is loaded as an untyped UMD global
type Three = any;

import { useEffect, useRef } from "react";

const THREE_SRC = "/vendor/three.min.js";
const EARTH_TEXTURE = "/textures/earth-blue-marble.jpg";

function loadThree(): Promise<Three | null> {
  return new Promise((resolve) => {
    const w = window as unknown as { THREE?: Three };
    if (w.THREE) {
      resolve(w.THREE);
      return;
    }
    const existing = document.getElementById("three-umd") as HTMLScriptElement | null;
    const onReady = () => resolve(w.THREE ?? null);
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.id = "three-umd";
    s.src = THREE_SRC;
    s.async = true;
    s.addEventListener("load", onReady, { once: true });
    s.addEventListener("error", () => resolve(null), { once: true });
    document.head.appendChild(s);
  });
}

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    let raf = 0;
    let disposed = false;
    let renderer: Three = null;
    let onResize: (() => void) | null = null;

    const start = (THREE: Three): void => {
      if (disposed) {
        return;
      }
      try {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h, false);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
        camera.position.set(0, 0, 9);
        camera.lookAt(0, 0, 0);

        const R = 6.7;
        const group = new THREE.Group();
        group.position.set(0, -7.32, 0);
        group.rotation.z = 0.12;
        scene.add(group);

        const earth = new THREE.Mesh(
          new THREE.SphereGeometry(R, 96, 96),
          new THREE.MeshStandardMaterial({
            map: new THREE.Texture(),
            roughness: 1,
            metalness: 0,
            emissive: 0x0a0f18,
            emissiveIntensity: 1,
          }),
        );
        earth.rotation.y = 1.9;
        group.add(earth);

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous");
        loader.load(EARTH_TEXTURE, (t: Three) => {
          if (disposed) {
            return;
          }
          if ("colorSpace" in t) {
            t.colorSpace = THREE.SRGBColorSpace;
          }
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          earth.material.map = t;
          t.needsUpdate = true;
          earth.material.needsUpdate = true;
        });

        // Subtle atmosphere rim.
        const atm = new THREE.Mesh(
          new THREE.SphereGeometry(R * 1.03, 96, 96),
          new THREE.ShaderMaterial({
            uniforms: {
              glowColor: { value: new THREE.Color(0xb4ccef) },
              intensity: { value: 0.5 },
            },
            vertexShader:
              "varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }",
            fragmentShader:
              "uniform vec3 glowColor; uniform float intensity; varying vec3 vN; varying vec3 vP; void main(){ vec3 vd = normalize(-vP); float f = pow(1.0 - abs(dot(vN, vd)), 4.6); gl_FragColor = vec4(glowColor, f * intensity); }",
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
          }),
        );
        group.add(atm);

        const dir = new THREE.DirectionalLight(0xffffff, 2.7);
        dir.position.set(-0.3, 0.75, 1.05);
        scene.add(dir);
        scene.add(new THREE.AmbientLight(0x3a4763, 0.95));
        const rim = new THREE.DirectionalLight(0x9fb6df, 0.5);
        rim.position.set(0.7, 0.25, 0.5);
        scene.add(rim);

        onResize = () => {
          const w2 = canvas.clientWidth;
          const h2 = canvas.clientHeight;
          renderer.setSize(w2, h2, false);
          camera.aspect = w2 / h2;
          camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", onResize);

        const animate = () => {
          if (disposed) {
            return;
          }
          earth.rotation.y += 0.0006;
          renderer.render(scene, camera);
          raf = requestAnimationFrame(animate);
        };
        animate();
      } catch {
        // WebGL unavailable / context lost → leave the canvas blank, page still looks great.
      }
    };

    void loadThree().then((THREE) => {
      if (THREE) {
        start(THREE);
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (onResize) {
        window.removeEventListener("resize", onResize);
      }
      try {
        renderer?.dispose?.();
      } catch {
        // ignore
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] block h-[66vh] w-full"
    />
  );
}
