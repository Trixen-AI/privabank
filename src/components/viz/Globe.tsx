import { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "../../hooks";

/**
 * Spectral relayer globe.
 *
 * An original point-cloud sphere: dots scattered with a Fibonacci lattice so the
 * density stays even, a brighter ring of "relayer" nodes on a tilted band, and
 * proof arcs that travel between random node pairs and fade. The sphere turns
 * slowly on its own axis. Everything is drawn from the violet token ramp.
 */
export function Globe() {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const world = new THREE.Group();
    world.rotation.z = -0.28; // a slight axial tilt, so the band reads as a band
    scene.add(world);

    const R = 2.5;

    /* --- dot shell: Fibonacci lattice keeps spacing even at the poles --- */
    const DOTS = 2600;
    const positions = new Float32Array(DOTS * 3);
    const colors = new Float32Array(DOTS * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const base = new THREE.Color("#e3c7ff"); // lighter than the panel violet, or the shell vanishes into it
    const lit = new THREE.Color("#ffffff");

    for (let i = 0; i < DOTS; i++) {
      const y = 1 - (i / (DOTS - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      positions[i * 3] = x * R;
      positions[i * 3 + 1] = y * R;
      positions[i * 3 + 2] = z * R;

      // dots near the equatorial band glow, the rest recede
      const band = 1 - Math.min(1, Math.abs(y) / 0.42);
      const c = base.clone().lerp(lit, band * 0.7).multiplyScalar(0.55 + band * 0.45);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const shellGeo = new THREE.BufferGeometry();
    shellGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    shellGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const shell = new THREE.Points(
      shellGeo,
      new THREE.PointsMaterial({
        size: 0.042,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );
    world.add(shell);

    /* --- relayer nodes: a handful of brighter points on the band --- */
    const NODES = 22;
    const nodePos: THREE.Vector3[] = [];
    const nodeArr = new Float32Array(NODES * 3);
    for (let i = 0; i < NODES; i++) {
      const lat = (Math.random() - 0.5) * 0.9;
      const lon = (i / NODES) * Math.PI * 2 + Math.random() * 0.25;
      const y = Math.sin(lat);
      const r = Math.cos(lat);
      const v = new THREE.Vector3(Math.cos(lon) * r * R, y * R, Math.sin(lon) * r * R);
      nodePos.push(v);
      nodeArr[i * 3] = v.x;
      nodeArr[i * 3 + 1] = v.y;
      nodeArr[i * 3 + 2] = v.z;
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodeArr, 3));
    world.add(
      new THREE.Points(
        nodeGeo,
        new THREE.PointsMaterial({ size: 0.11, color: 0xeedfff, transparent: true, opacity: 0.95, depthWrite: false }),
      ),
    );

    /* --- proof arcs: great-circle hops that draw on and fade out --- */
    type Arc = { line: THREE.Line; born: number; life: number; count: number };
    const arcs: Arc[] = [];
    const arcGroup = new THREE.Group();
    world.add(arcGroup);
    const SEGMENTS = 48;

    const spawnArc = (now: number) => {
      const a = nodePos[Math.floor(Math.random() * NODES)];
      const b = nodePos[Math.floor(Math.random() * NODES)];
      if (a.distanceTo(b) < R * 0.7) return;

      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        // slerp along the sphere, then lift into an arc over the surface
        const v = a.clone().lerp(b, t).normalize();
        const lift = 1 + Math.sin(t * Math.PI) * 0.22;
        pts.push(v.multiplyScalar(R * lift));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      geo.setDrawRange(0, 0);
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({ color: 0xe3c7ff, transparent: true, opacity: 0.9 }),
      );
      arcGroup.add(line);
      arcs.push({ line, born: now, life: 2600, count: SEGMENTS + 1 });
    };

    let nextArc = 0;
    let raf = 0;
    const clock = new THREE.Clock();

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // pull the camera back on narrow viewports so the sphere always fits
      camera.position.z = w < 640 ? 9.4 : w < 1000 ? 8.3 : 7.4;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(mount);

    const render = () => {
      const now = performance.now();
      const dt = clock.getDelta();

      if (visible) {
        world.rotation.y += dt * 0.085;

        if (now > nextArc) {
          spawnArc(now);
          nextArc = now + 420 + Math.random() * 640;
        }

        for (let i = arcs.length - 1; i >= 0; i--) {
          const arc = arcs[i];
          const age = (now - arc.born) / arc.life;
          if (age >= 1) {
            arcGroup.remove(arc.line);
            arc.line.geometry.dispose();
            (arc.line.material as THREE.Material).dispose();
            arcs.splice(i, 1);
            continue;
          }
          // first 45% draws the arc on, the rest fades it
          const drawT = Math.min(1, age / 0.45);
          arc.line.geometry.setDrawRange(0, Math.floor(drawT * arc.count));
          (arc.line.material as THREE.LineBasicMaterial).opacity =
            age < 0.45 ? 0.9 : 0.9 * (1 - (age - 0.45) / 0.55);
        }

        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(render);
    };

    if (reduced) {
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      shellGeo.dispose();
      nodeGeo.dispose();
      arcs.forEach((a) => {
        a.line.geometry.dispose();
        (a.line.material as THREE.Material).dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [reduced]);

  return <div className="globe-canvas" ref={mountRef} aria-hidden="true" />;
}
