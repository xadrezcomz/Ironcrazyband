// CameraManager: leva a câmera entre os pontos de vista com GSAP, roda a entrada
// cinematográfica (rua → porta → salão) e aplica uma leve paralaxe com o mouse.

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { VIEWS, type Vec3 } from './views';
import { useExperience } from '../stores/useExperience';

const v = (a: Vec3) => new THREE.Vector3(...a);

// Em aparelhos lentos o GSAP "segura" o tempo quando um quadro atrasa; aqui a câmera
// deve chegar no tempo previsto, mesmo pulando quadros.
gsap.ticker.lagSmoothing(0);

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  // ao recriar o renderer (troca de qualidade), começa de onde o visitante está
  const start = useExperience.getState().phase === 'pub' ? VIEWS[useExperience.getState().view] : VIEWS.fachada;
  const base = useRef(v(start.position));
  const target = useRef(v(start.target));
  const tmp = useRef(new THREE.Vector2());
  const parallax = useRef(new THREE.Vector2());
  const tl = useRef<gsap.core.Timeline | null>(null);

  const phase = useExperience((s) => s.phase);
  const view = useExperience((s) => s.view);

  // entrada cinematográfica
  useEffect(() => {
    if (phase !== 'entering') return;
    const st = useExperience.getState();
    const fast = st.reducedMotion || st.introSkip;
    tl.current?.kill();
    base.current.copy(v(VIEWS.fachada.position));
    target.current.copy(v(VIEWS.fachada.target));

    const finish = () => {
      useExperience.getState().set({ phase: 'pub', view: 'salao', visited: true, doorOpen: true });
    };
    if (fast) {
      st.setDoorOpen(true);
      base.current.copy(v(VIEWS.salao.position));
      target.current.copy(v(VIEWS.salao.target));
      finish();
      return;
    }

    const t = gsap.timeline({ onComplete: finish });
    t.to(base.current, { x: 0, y: 1.65, z: 11.4, duration: 2.4, ease: 'power1.inOut' })
      .to(target.current, { x: 0, y: 1.7, z: 6, duration: 2.4, ease: 'power1.inOut' }, '<')
      .call(() => useExperience.getState().setDoorOpen(true), [], '-=0.6')
      .to(base.current, { x: 0, y: 1.7, z: 7.4, duration: 1.8, ease: 'power1.in' }, '+=0.35')
      .to(target.current, { x: 0, y: 1.5, z: -6, duration: 1.8, ease: 'power1.inOut' }, '<')
      .to(base.current, { x: VIEWS.salao.position[0], y: VIEWS.salao.position[1], z: VIEWS.salao.position[2], duration: 1.6, ease: 'power2.out' })
      .to(target.current, { x: VIEWS.salao.target[0], y: VIEWS.salao.target[1], z: VIEWS.salao.target[2], duration: 1.6, ease: 'power2.out' }, '<');
    tl.current = t;

    // "pular introdução" durante a cena
    const skip = () => {
      t.progress(1);
    };
    window.addEventListener('ironcrazy:skip-intro', skip);
    return () => window.removeEventListener('ironcrazy:skip-intro', skip);
  }, [phase]);

  // transições entre pontos de vista
  useEffect(() => {
    if (phase !== 'pub') return;
    const def = VIEWS[view];
    const fast = useExperience.getState().reducedMotion;
    const dist = base.current.distanceTo(v(def.position));
    const duration = fast ? 0 : Math.min(2.2, 0.9 + dist * 0.12);
    tl.current?.kill();
    const t = gsap.timeline();
    t.to(base.current, { x: def.position[0], y: def.position[1], z: def.position[2], duration, ease: 'power2.inOut' })
      .to(target.current, { x: def.target[0], y: def.target[1], z: def.target[2], duration, ease: 'power2.inOut' }, '<');
    tl.current = t;
  }, [view, phase]);

  useFrame((state, dt) => {
    const st = useExperience.getState();
    const amount = (phase === 'pub' ? VIEWS[st.view].parallax : 0.12) * st.sensitivity * (st.reducedMotion ? 0 : 1);
    parallax.current.lerp(tmp.current.set(state.pointer.x * amount, state.pointer.y * amount * 0.5), 1 - Math.exp(-dt * 3));
    camera.position.set(base.current.x + parallax.current.x, base.current.y + parallax.current.y, base.current.z);
    camera.lookAt(target.current);
  });

  return null;
}
