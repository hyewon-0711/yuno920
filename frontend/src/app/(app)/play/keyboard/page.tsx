"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

const switches = [
  { id: "blue", name: "청축", emoji: "🔵", word: "찰칵찰칵", description: "높고 또렷한 클릭 소리", color: "#457bd3", tone: 1900, body: 320, decay: .07, click: .65 },
  { id: "brown", name: "갈축", emoji: "🟤", word: "사각사각", description: "부드럽고 가벼운 타건 소리", color: "#9a6b48", tone: 1100, body: 240, decay: .06, click: .22 },
  { id: "red", name: "적축", emoji: "🔴", word: "톡톡", description: "짧고 매끈한 타건 소리", color: "#d46164", tone: 700, body: 180, decay: .055, click: .08 },
  { id: "banana", name: "바나나축", emoji: "🍌", word: "도각도각", description: "둥글고 도톰한 타건 소리", color: "#b78a15", tone: 850, body: 380, decay: .095, click: .18 },
  { id: "black", name: "흑축", emoji: "⚫", word: "둑둑", description: "낮고 묵직한 울림", color: "#526074", tone: 480, body: 120, decay: .12, click: .04 },
  { id: "silver", name: "은축", emoji: "⚪", word: "틱틱", description: "높고 짧게 끊어지는 소리", color: "#687b91", tone: 2800, body: 520, decay: .03, click: .3 },
  { id: "white", name: "백축", emoji: "🤍", word: "딸깍딸깍", description: "맑은 클릭과 가벼운 울림", color: "#7775ad", tone: 2400, body: 450, decay: .085, click: .8 },
  { id: "green", name: "녹축", emoji: "🟢", word: "철컥철컥", description: "두 번 걸리는 듯한 진한 클릭", color: "#377b58", tone: 1600, body: 260, decay: .11, click: .95 },
  { id: "silent-red", name: "저소음 적축", emoji: "🌸", word: "툭툭", description: "폭신하고 아주 짧은 소리", color: "#b3607a", tone: 400, body: 150, decay: .035, click: .015 },
  { id: "silent-brown", name: "저소음 갈축", emoji: "🧸", word: "보독보독", description: "조용하고 포근한 낮은 소리", color: "#917052", tone: 600, body: 210, decay: .05, click: .025 },
] as const;
const soundProfiles: Record<string, { noise: number; body: number; resonance: number; release: number; wave: OscillatorType }> = {
  blue: { noise: .85, body: .35, resonance: 1.8, release: .4, wave: "triangle" },
  brown: { noise: .65, body: .55, resonance: .8, release: .2, wave: "sine" },
  red: { noise: .35, body: .65, resonance: .6, release: .12, wave: "sine" },
  banana: { noise: .55, body: .85, resonance: 2.4, release: .3, wave: "sine" },
  black: { noise: .4, body: .95, resonance: 1.4, release: .18, wave: "sine" },
  silver: { noise: .8, body: .25, resonance: 2.8, release: .2, wave: "triangle" },
  white: { noise: .75, body: .45, resonance: 3.2, release: .45, wave: "triangle" },
  green: { noise: .95, body: .6, resonance: 1.6, release: .5, wave: "triangle" },
  "silent-red": { noise: .16, body: .28, resonance: .5, release: .03, wave: "sine" },
  "silent-brown": { noise: .25, body: .35, resonance: 1.1, release: .05, wave: "sine" },
};
const rows = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const patterns = ["YUNHO", "BANANA", "HAPPY", "KEYCAP"];
const koreanKeys: Record<string, string> = Object.fromEntries(
  [..."QWERTYUIOPASDFGHJKLZXCVBNM"].map((key, index) => [key, [..."ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔㅁㄴㅇㄹㅎㅗㅓㅏㅣㅋㅌㅊㅍㅠㅜㅡ"][index]]),
);
const koreanPatterns = [
  { word: "윤호", keys: "DBSGH" },
  { word: "바나나", keys: "QKSKSK" },
  { word: "사랑", keys: "TKFKD" },
  { word: "키보드", keys: "ZLQHEM" },
];

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
  const [language, setLanguage] = useState<"ko" | "en">("ko");
  const audio = useRef<AudioContext | null>(null);
  const output = useRef<GainNode | null>(null);
  const noise = useRef<AudioBuffer | null>(null);
  const timers = useRef(new Map<string, number>());
  const mounted = useRef(true);
  const selected = switches[choice];
  const word = language === "ko" ? koreanPatterns[pattern].word : patterns[pattern];
  const sequence = language === "ko" ? koreanPatterns[pattern].keys : patterns[pattern];
  const keyLabel = (key: string) => language === "ko" ? koreanKeys[key] ?? key : key;
  const complete = progress === sequence.length;

  const changeLanguage = useCallback((next: "ko" | "en") => {
    setLanguage(next);
    setProgress(0);
    setLastKey("");
  }, []);

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
      const profile = soundProfiles[selected.id];
      const pitch = key === "SPACE" ? .7 : 1 + (key.charCodeAt(0) % 7 - 3) * .025;
      const burst = (offset: number, level: number, frequency: number, duration: number) => {
        const source = context.createBufferSource();
        source.buffer = noise.current;
        const filter = context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = frequency * pitch;
        filter.Q.value = profile.resonance;
        const envelope = context.createGain();
        envelope.gain.setValueAtTime(level, start + offset);
        envelope.gain.exponentialRampToValueAtTime(.001, start + offset + duration);
        source.connect(filter); filter.connect(envelope); envelope.connect(output.current!);
        source.start(start + offset); source.stop(start + offset + duration);
        source.onended = () => { source.disconnect(); filter.disconnect(); envelope.disconnect(); };
      };
      burst(0, profile.noise, selected.tone, selected.decay);
      burst(.012, switches[choice].click, 4200, .025);
      burst(.075, profile.release, selected.tone * 1.3, .035);
      if (selected.id === "green") burst(.035, .65, 3200, .025);
      if (selected.id === "white") burst(.022, .35, 5800, .05);
      const body = context.createOscillator();
      const envelope = context.createGain();
      body.type = profile.wave;
      body.frequency.setValueAtTime(selected.body * pitch, start);
      body.frequency.exponentialRampToValueAtTime(selected.body * .55 * pitch, start + selected.decay);
      envelope.gain.setValueAtTime(.001, start);
      envelope.gain.linearRampToValueAtTime(profile.body, start + .002);
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
    if (challenge) setProgress((previous) => previous < sequence.length && key === sequence[previous] ? previous + 1 : previous);
  }, [sound, challenge, sequence]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.code === "Lang1" || event.key === "HangulMode") {
        event.preventDefault();
        changeLanguage(language === "ko" ? "en" : "ko");
        return;
      }
      if (event.code === "Space" && target.closest("button, a, summary")) return;
      const key = event.code.startsWith("Key") ? event.code.slice(3) : event.code.startsWith("Digit") ? event.code.slice(5) : event.code === "Space" ? "SPACE" : "";
      if (key && (key === "SPACE" || /^[A-Z0-9]$/.test(key))) {
        event.preventDefault();
        press(key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, language, changeLanguage]);

  return <>
    <AppHeader title="키캡 소리 놀이" backHref="/play" />
    <main className={styles.page} style={{ "--switch-color": selected.color } as React.CSSProperties}>
      <div className={styles.intro}><span>⌨️</span><h2>윤호의 키보드 소리 연구소</h2><p>어떤 소리가 가장 좋아? 축을 바꿔 가며 톡톡 눌러 봐!</p></div>
      <p className={styles.note}>10가지 축 소리 · 같은 키를 누르며 소리의 차이를 비교해 보세요.</p>
      <div className={styles.switches} role="group" aria-label="키보드 축 선택">{switches.map((item, index) =>
        <button key={item.id} aria-pressed={choice === index} onClick={() => setChoice(index)}><span>{item.emoji}</span><strong>{item.name}</strong><small>{item.word}</small></button>)}</div>
      <section className={styles.soundPanel} aria-label="소리 설정">
        <div><strong>{selected.emoji} {selected.name} · {selected.word}</strong><p>{selected.description}</p></div>
        <div className={styles.volume}><button onClick={() => setMuted(!muted)} aria-pressed={muted}>{muted ? "🔇 소리 켜기" : "🔊 음소거"}</button><label htmlFor="keyboard-volume">음량 {volume}%</label><input id="keyboard-volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></div>
      </section>
      <div className={styles.modes}><button aria-pressed={!challenge} onClick={() => setChallenge(false)}>자유롭게 톡톡</button><button aria-pressed={challenge} onClick={() => { setChallenge(true); setProgress(0); }}>단어 따라 치기</button></div>
      <div className={styles.modes} role="group" aria-label="타자 언어"><button aria-pressed={language === "ko"} onClick={() => changeLanguage("ko")}>한글 ㄱㄴㄷ</button><button aria-pressed={language === "en"} onClick={() => changeLanguage("en")}>영문 ABC</button></div>
      {challenge && <section className={styles.challenge} aria-label="단어 따라 치기"><strong className={styles.prompt}>{word}</strong><p>{language === "ko" ? "자음과 모음을 차례로 눌러 단어를 완성해 봐요." : "빛나는 글자의 키캡을 찾아 눌러 주세요."}</p><div className={styles.word}>{sequence.split("").map((key, index) => <span key={index} className={index < progress ? styles.done : index === progress ? styles.next : ""}>{keyLabel(key)}</span>)}</div><p role="status">{complete ? `🎉 ${word} 완성! 멋진 소리를 만들었어요!` : `${progress} / ${sequence.length}타 완료`}</p>{complete && <button onClick={() => { setPattern((pattern + 1) % patterns.length); setProgress(0); }}>다음 단어</button>}</section>}
      <section className={styles.keyboard} aria-label="소리 나는 키보드">{rows.map((row) => <div className={styles.row} key={row}>{row.split("").map((key) => <button key={key} aria-label={`${keyLabel(key)} 키캡`} className={`${styles.key} ${active.includes(key) ? styles.pressed : ""} ${challenge && sequence[progress] === key ? styles.target : ""}`} onClick={() => press(key)}>{keyLabel(key)}</button>)}</div>)}<div className={styles.row}><button aria-label="스페이스 키캡" className={`${styles.key} ${styles.space} ${active.includes("SPACE") ? styles.pressed : ""}`} onClick={() => press("SPACE")}>{language === "ko" ? "띄어쓰기" : "SPACE"}</button></div></section>
      <div className={styles.counter}><span>{lastKey ? `${lastKey === "SPACE" ? "스페이스" : keyLabel(lastKey)} · ${selected.word}` : "첫 키캡을 눌러 보세요"}</span><strong>{count.toLocaleString()}번 톡톡</strong></div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <p className={styles.note}>한글·영문 버튼으로 전환해 보세요. 화면 키캡과 실제 키보드 모두 사용할 수 있어요. 한글은 두벌식 자리로 반응하며, 컴퓨터의 입력 언어와 별도로 위에서 선택한 언어를 따라요.</p>
      <p className={styles.note}>각 축에서 영감을 얻어 클릭감·음높이·울림을 다르게 만든 놀이용 합성음이에요. 실제 제품 녹음은 아니며, 제조사와 키보드·키캡에 따라 실제 소리는 달라요.</p>
    </main>
  </>;
}
