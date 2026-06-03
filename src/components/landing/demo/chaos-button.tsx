"use client";

import { forwardRef, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import styles from "./demo-portal.module.css";

/* Pass-through vertex shader. */
const VERTEX_SRC = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

/* Fragment shader — animated "chaos" lines (trig-noise FBM).
   Ported from the original Metal/WebGL shader (vjy / jh3yy). */
const FRAGMENT_SRC = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_tap;
  uniform float u_amplitude;
  uniform float u_pulseMin;
  uniform float u_pulseMax;

  float noiseTrig(vec2 p) {
    float x = p.x;
    float y = p.y;
    float n = sin(x * 1.0 + sin(y * 1.3)) * 0.5;
    n += sin(y * 1.0 + sin(x * 1.1)) * 0.5;
    n += sin((x + y) * 0.5) * 0.25;
    n += sin((x - y) * 0.7) * 0.25;
    return n * 0.5 + 0.5;
  }

  float fbm(vec2 p, vec3 a) {
    float v = 0.0;
    v += noiseTrig(p * a.x) * 0.50;
    v += noiseTrig(p * a.y) * 1.50;
    v += noiseTrig(p * a.z) * 0.125 * 0.1;
    return v;
  }

  vec3 drawLines(vec2 uv, vec3 fbmOffset, vec3 color1, float secs) {
    float timeVal = secs * 0.1;
    vec3 finalColor = vec3(0.0);

    vec3 colorSets[4];
    colorSets[0] = vec3(0.7, 0.05, 1.0);
    colorSets[1] = vec3(1.0, 0.19, 0.0);
    colorSets[2] = vec3(0.0, 1.0, 0.3);
    colorSets[3] = vec3(0.0, 0.38, 1.0);

    for (int i = 0; i < 4; i++) {
      float indexAsFloat = float(i);
      float amp = u_amplitude + (indexAsFloat * 0.0);
      float period = 2.0 + (indexAsFloat + 2.0);
      float thickness = mix(0.4, 0.2, noiseTrig(uv * 2.0));
      float t = abs(1.0 / (sin(uv.y + fbm(uv + timeVal * period, fbmOffset)) * amp) * thickness);
      finalColor += t * colorSets[i];
    }

    for (int i = 0; i < 4; i++) {
      float indexAsFloat = float(i);
      float amp = (u_amplitude * 0.5) + (indexAsFloat * 5.0);
      float period = 9.0 + (indexAsFloat + 2.0);
      float thickness = mix(0.1, 0.1, noiseTrig(uv * 12.0));
      float t = abs(1.0 / (sin(uv.y + fbm(uv + timeVal * period, fbmOffset)) * amp) * thickness);
      finalColor += t * colorSets[i] * color1;
    }

    return finalColor;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.x) * 1.0 - 1.0;
    uv *= 1.5;

    vec3 lineColor1 = vec3(1.0, 0.0, 0.5);
    vec3 lineColor2 = vec3(0.3, 0.5, 1.5);

    float spread = abs(u_tap);
    float t = sin(u_time) * 0.5 + 0.5;
    float pulse = mix(u_pulseMin, u_pulseMax, t);

    vec3 finalColor = drawLines(uv, vec3(65.2, 40.0, 4.0), lineColor1, u_time) * pulse;
    finalColor += drawLines(uv, vec3(5.0 * spread / 2.0, 2.1 * spread, 1.0), lineColor2, u_time);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const RESTING = { speed: 0.35, amplitude: 80, pulseMin: 0.05, pulseMax: 0.2, tap: 1.0 };
const ACTIVE = { speed: 2.8, amplitude: 10, pulseMin: 0.05, pulseMax: 0.4, tap: 1.0 };

type ChaosButtonProps = {
  label: string;
  onClick: () => void;
  "aria-expanded"?: boolean;
};

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Animated WebGL "chaos" pill. Idles with slow drifting noise; on press/hover
 * it smoothly accelerates and tightens (state values eased per-frame, no GSAP).
 * Clicking fires onClick (used to open the demo portal). Forwards its ref to the
 * underlying <button> so the parent can focus/measure it.
 */
export const ChaosButton = forwardRef<HTMLButtonElement, ChaosButtonProps>(
  function ChaosButton({ label, onClick, "aria-expanded": ariaExpanded }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const pressedRef = useRef(false);

    // Expose the inner button through the forwarded ref.
    useEffect(() => {
      if (typeof ref === "function") ref(buttonRef.current);
      else if (ref) ref.current = buttonRef.current;
    }, [ref]);

    useEffect(() => {
      const canvas = canvasRef.current;
      const button = buttonRef.current;
      if (!canvas || !button) return;

      const gl = canvas.getContext("webgl", { alpha: false, antialias: true });
      if (!gl) return;

      const vert = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC);
      const frag = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
      if (!vert || !frag) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vert);
      gl.attachShader(program, frag);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
      gl.useProgram(program);

      const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const u = {
        resolution: gl.getUniformLocation(program, "u_resolution"),
        time: gl.getUniformLocation(program, "u_time"),
        tap: gl.getUniformLocation(program, "u_tap"),
        amplitude: gl.getUniformLocation(program, "u_amplitude"),
        pulseMin: gl.getUniformLocation(program, "u_pulseMin"),
        pulseMax: gl.getUniformLocation(program, "u_pulseMax"),
      };

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = button.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(u.resolution, canvas.width, canvas.height);
      };
      resize();

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const cur = { ...RESTING };
      let phase = 0;
      let last = performance.now() / 1000;
      let raf = 0;

      const draw = () => {
        gl.uniform1f(u.time, phase);
        gl.uniform1f(u.tap, cur.tap);
        gl.uniform1f(u.amplitude, cur.amplitude);
        gl.uniform1f(u.pulseMin, cur.pulseMin);
        gl.uniform1f(u.pulseMax, cur.pulseMax);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };

      const frame = () => {
        const now = performance.now() / 1000;
        const dt = Math.min(0.05, now - last);
        last = now;

        const target = pressedRef.current ? ACTIVE : RESTING;
        const tau = pressedRef.current ? 0.12 : 0.9;
        const a = 1 - Math.exp(-dt / tau);
        cur.speed += (target.speed - cur.speed) * a;
        cur.amplitude += (target.amplitude - cur.amplitude) * a;
        cur.pulseMin += (target.pulseMin - cur.pulseMin) * a;
        cur.pulseMax += (target.pulseMax - cur.pulseMax) * a;
        cur.tap += (target.tap - cur.tap) * a;

        phase += dt * cur.speed;
        if (phase > 1000) phase %= 1000;

        draw();
        raf = requestAnimationFrame(frame);
      };

      const observer =
        typeof ResizeObserver !== "undefined"
          ? new ResizeObserver(resize)
          : null;
      observer?.observe(button);
      window.addEventListener("resize", resize);

      if (reduced) {
        draw(); // single static frame, no animation loop
      } else {
        raf = requestAnimationFrame(frame);
      }

      return () => {
        if (raf) cancelAnimationFrame(raf);
        observer?.disconnect();
        window.removeEventListener("resize", resize);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    }, []);

    const press = () => {
      pressedRef.current = true;
    };
    const release = () => {
      pressedRef.current = false;
    };

    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        onMouseDown={press}
        onMouseUp={release}
        onMouseEnter={press}
        onMouseLeave={release}
        onTouchStart={press}
        onTouchEnd={release}
        aria-haspopup="dialog"
        aria-expanded={ariaExpanded}
        className={cn(styles.chaosButton)}
      >
        <canvas ref={canvasRef} className={styles.chaosCanvas} aria-hidden />
        <span className={cn(styles.chaosLabel, "font-heading")}>{label}</span>
      </button>
    );
  },
);
