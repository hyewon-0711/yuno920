"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

const switches = [
  { id: "blue", name: "청축", emoji: "🔵", word: "찰칵찰칵", description: "높고 또렷한 클릭 소리", color: "#457bd3", tone: 1900, body: 320, decay: .07, click: .65 },
  { id: "brown", name: "갈축", emoji: "🟤", word: "사각사각", description: "부드럽고 가벼운 타건 소리", color: "#9a6b48", tone: 1100, body: 240, decay: .06, click: .22 },
  { id: "red", name: "적축", emoji: "🔴", word: "톡톡", description: "짧고 매끈한 타건 소리", color: "#d46164", tone: 700, body: 180, decay: .055, click: .08 },
  { id: "banana", name: "바나나축", emoji: "🍌", word: "도각도각", description: "둥글고 도톰한 타건 소리", color: "#b78a15", tone: 850, body: 380, decay: .095, click: .18 },
] as const;
const rows = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const patterns = ["YUNHO", "BANANA", "HAPPY", "KEYCAP"];

export default function KeyboardPage() {
  const [choice, setChoice] = useState(0);
  const [volume, setVolume] = useState(35);
  const [muted, setMuted] = useState(false);
  const [count, setCount] = useState(0);
  const [active, setActive] = useState<string[]>([]);
  const [lastKey, setLastKey] = useState("");
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState(false);
  const [pattern, setPattern] = useState(0);
  const [progress, setProgress] = useState(0);
  const audio = useRef<AudioContext | null>(null);
  const output = useRef<GainNode | null>(null);
  const noise = useRef<AudioBuffer | null>(null);
  const timers = useRef(new Map<string, number>());
  const mounted = useRef(true);
  const selected = switches[choice];
  const word = patterns[pattern];
  const complete = progress === word.length;

  useEffect(() => {
    mounted.current = true;
    const pending = timers.current;
    return () => {
      mounted.current = false;
      pending.forEach(window.clearTimeout);
      pending.clear();
      void audio.current?.close();
      audio.current = null;
      output.current = null;
      noise.current = null;
    };
  }, []);

  useEffect(() => {
    if (audio.current && output.current) output.current.gain.setTargetAtTime(muted ? 0 : volume / 100 * .5, audio.current.currentTime, .01);
  }, [volume, muted]);

  const sound = useCallback(async (key: string) => {
    if (muted || volume === 0) return;
    try {
      if (!audio.current) {
        const context = new AudioContext();
        audio.current = context;
        const gain = context.createGain();
        gain.gain.value = volume / 100 * .5;
        const compressor = context.createDynamicsCompressor();
        gain.connect(compressor);
        compressor.connect(context.destination);
        output.current = gain;
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .15), context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        noise.current = buffer;
      }
      const context = audio.current;
      if (context.state === "suspended") await context.resume();
      if (!mounted.current || context.state !== "running" || !output.current) return;
      setError("");
      const start = context.currentTime;
      const pitch = key === "SPACE" ? .7 : 1 + (key.charCodeAt(0) % 7 - 3) * .025;
      const burst = (offset: number, level: number, frequency: number, duration: number) => {
        const source = context.createBufferSource();
        source.buffer = noise.current;
        const filter = context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = frequency * pitch;
        filter.Q.value = .8;
        const envelope = context.createGain();
        envelope.gain.setValueAtTime(level, start + offset);
        envelope.gain.exponentialRampToValueAtTime(.001, start + offset + duration);
        source.connect(filter); filter.connect(envelope); envelope.connect(output.current!);
        source.start(start + offset); source.stop(start + offset + duration);
        source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
      };
      burst(0, .9, selected.tone, selected.decay);
      burst(.012, switches[choice].click, 4200, .025);
      burst(.075, .25, selected.tone * 1.3, .035);
      const body = context.createOscillator();
      const envelope = context.createGain();
      body.type = "sine";
      body.frequency.setValueAtTime(selected.body * pitch, start);
      body.frequency.exponentialRampToValueAtTime(selected.body * .55 * pitch, start + selected.decay);
      envelope.gain.setValueAtTime(.001, start);
      envelope.gain.linearRampToValueAtTime(.65, start + .002);
      envelope.gain.exponentialRampToValueAtTime(.001, start + selected.decay);
      body.connect(envelope); envelope.connect(output.current);
      body.start(start); body.stop(start + selected.decay);
      body.onended = () => { body.disconnect(); envelope.disconnect(); };
    } catch {
      if (mounted.current) setError("소리를 재생하지 못했어요. 화면의 키캡을 다시 눌러 주세요.");
    }
  }, [muted, volume, selected, choice]);

  const press = useCallback((key: string) => {
    void sound(key);
    setCount((previous) => previous + 1);
    setLastKey(key);
    setActive((previous) => [...new Set([...previous, key])]);
    window.clearTimeout(timers.current.get(key));
    timers.current.set(key, window.setTimeout(() => {
      setActive((previous) => previous.filter((item) => item !== key));
      timers.current.delete(key);
    }, 140));
    if (challenge) setProgress((previous) => previous < word.length && key === word[previous] ? previous + 1 : previous);
  }, [sound, challenge, word]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.code === "Space" && target.closest("button, a, summary")) return;
      const key = event.code.startsWith("Key") ? event.code.slice(3) : event.code.startsWith("Digit") ? event.code.slice(5) : event.code === "Space" ? "SPACE" : "";
      if (key && (key === "SPACE" || /^[A-Z0-9]$/.test(key))) {
        event.preventDefault();
        press(key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return <>
    <AppHeader title="키캡 소리 놀이" backHref="/play" />
    <main className={styles.page} style={{ "--switch-color": selected.color } as React.CSSProperties}>
      <div className={styles.intro}><span>⌨️</span><h2>윤호의 키보드 소리 연구소</h2><p>어떤 소리가 가장 좋아? 축을 바꿔 가며 톡톡 눌러 봐!</p></div>
      <div className={styles.switches} aria-label="키보드 축 선택">{switches.map((item, index) =>
        <button key={item.id} aria-pressed={choice === index} onClick={() => setChoice(index)}><span>{item.emoji}</span><strong>{item.name}</strong><small>{item.word}</small></button>)}</div>
      <section className={styles.soundPanel} aria-label="소리 설정">
        <div><strong>{selected.emoji} {selected.name} · {selected.word}</strong><p>{selected.description}</p></div>
        <div className={styles.volume}><button onClick={() => setMuted(!muted)} aria-pressed={muted}>{muted ? "🔇 소리 켜기" : "🔊 음소거"}</button><label htmlFor="keyboard-volume">음량 {volume}%</label><input id="keyboard-volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></div>
      </section>
      <div className={styles.modes}><button aria-pressed={!challenge} onClick={() => setChallenge(false)}>자유롭게 톡톡</button><button aria-pressed={challenge} onClick={() => { setChallenge(true); setProgress(0); }}>단어 따라 치기</button></div>
      {challenge && <section className={styles.challenge} aria-label="단어 따라 치기"><p>빛나는 글자의 키캡을 찾아 눌러 주세요.</p><div className={styles.word}>{word.split("").map((letter, index) => <span key={index} className={index < progress ? styles.done : index === progress ? styles.next : ""}>{letter}</span>)}</div><p role="status">{complete ? "🎉 성공! 멋진 소리를 만들었어요!" : `${progress} / ${word.length} 글자 완료`}</p>{complete && <button onClick={() => { setPattern((pattern + 1) % patterns.length); setProgress(0); }}>다음 단어</button>}</section>}
      <section className={styles.keyboard} aria-label="소리 나는 키보드">{rows.map((row) => <div className={styles.row} key={row}>{row.split("").map((key) => <button key={key} aria-label={`${key} 키캡`} className={`${styles.key} ${active.includes(key) ? styles.pressed : ""} ${challenge && word[progress] === key ? styles.target : ""}`} onClick={() => press(key)}>{key}</button>)}</div>)}<div className={styles.row}><button aria-label="스페이스 키캡" className={`${styles.key} ${styles.space} ${active.includes("SPACE") ? styles.pressed : ""}`} onClick={() => press("SPACE")}>SPACE</button></div></section>
      <div className={styles.counter}><span>{lastKey ? `${lastKey === "SPACE" ? "스페이스" : lastKey} · ${selected.word}` : "첫 키캡을 눌러 보세요"}</span><strong>{count.toLocaleString()}번 톡톡</strong></div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <p className={styles.note}>화면의 키캡 또는 실제 키보드의 영문·숫자·스페이스 키로 놀 수 있어요. 한글 입력 상태에서도 같은 자리의 키가 반응해요.</p>
      <p className={styles.note}>각 축의 느낌을 표현한 합성음이에요. 실제 제품 녹음은 아니며, 키보드와 키캡에 따라 실제 소리는 달라요.</p>
    </main>
  </>;
}
