"use client";

import { useEffect, useMemo, useState } from "react";
import { Chess, type Square, type PieceSymbol } from "chess.js";
import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

const symbols = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const names = { k: "킹", q: "퀸", r: "룩", b: "비숍", n: "나이트", p: "폰" };
const values = { k: 0, q: 9, r: 5, b: 3, n: 3, p: 1 };
type Promotion = "q" | "r" | "b" | "n";

export default function ChessPage() {
  const [moves, setMoves] = useState<string[]>([]);
  const [mode, setMode] = useState<"computer" | "together">("computer");
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const game = useMemo(() => {
    const chess = new Chess();
    moves.forEach((move) => chess.move(move));
    return chess;
  }, [moves]);
  const thinking = mode === "computer" && game.turn() === "b" && !game.isGameOver();
  const legal = selected ? game.moves({ square: selected, verbose: true }) : [];
  const last = game.history({ verbose: true }).at(-1);
  const squares = Array.from({ length: 64 }, (_, i) => `${"abcdefgh"[i % 8]}${8 - Math.floor(i / 8)}` as Square);
  if (flipped) squares.reverse();

  useEffect(() => {
    if (!thinking) return;
    const timer = window.setTimeout(() => {
      // A small local opponent: prefer material gains, avoid immediate losses.
      const options = game.moves({ verbose: true });
      const scored = options.map((move) => {
        const next = new Chess(game.fen());
        next.move(move.san);
        const replyGain = Math.max(0, ...next.moves({ verbose: true }).map((reply) =>
          (reply.captured ? values[reply.captured] : 0) + (reply.promotion ? values[reply.promotion] - 1 : 0)));
        const score = next.isCheckmate() ? 10000 :
          (move.captured ? values[move.captured] : 0) + (move.promotion ? values[move.promotion] - 1 : 0) - replyGain + Math.random() * 0.8;
        return { move, score };
      });
      scored.sort((a, b) => b.score - a.score);
      if (scored[0]) setMoves((previous) => [...previous, scored[0].move.san]);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [game, thinking]);

  function play(from: Square, to: Square, promote: Promotion = "q") {
    const move = game.moves({ square: from, verbose: true }).find((candidate) =>
      candidate.to === to && (!candidate.promotion || candidate.promotion === promote));
    if (!move) return;
    setMoves([...moves, move.san]);
    setSelected(null);
    setPromotion(null);
  }

  function select(square: Square) {
    if (thinking || game.isGameOver() || promotion) return;
    const target = legal.find((move) => move.to === square);
    if (selected && target) {
      if (target.promotion) setPromotion({ from: selected, to: square });
      else play(selected, square);
      return;
    }
    setSelected(square !== selected && game.get(square)?.color === game.turn() ? square : null);
  }

  function reset(nextMode = mode) {
    if (moves.length && !window.confirm("지금 두던 판을 끝내고 새로 시작할까요?")) return;
    setMode(nextMode);
    setMoves([]);
    setSelected(null);
    setPromotion(null);
  }

  function undo() {
    const count = mode === "computer" && game.turn() === "w" ? 2 : 1;
    setMoves(moves.slice(0, Math.max(0, moves.length - count)));
    setSelected(null);
    setPromotion(null);
  }

  const turn = game.turn() === "w" ? "백" : "흑";
  const status = game.isCheckmate() ? `체크메이트! ${game.turn() === "w" ? "흑" : "백"}이 이겼어요 🎉` :
    game.isStalemate() ? "움직일 수 있는 수가 없어 무승부예요." :
    game.isThreefoldRepetition() ? "같은 위치가 세 번 나와 무승부예요." :
    game.isInsufficientMaterial() ? "체크메이트할 기물이 부족해 무승부예요." :
    game.isDraw() ? "무승부예요. 멋진 대국이었어요!" :
    thinking ? "컴퓨터가 생각하고 있어요…" : `${turn} 차례예요${game.isCheck() ? " · 체크! 킹을 지켜 주세요." : ""}`;

  return (
    <>
      <AppHeader title="체스" backHref="/play" />
      <main className={styles.page}>
        <div className={styles.intro}><h2>한 수씩, 즐겁게 ♟️</h2><p>기물을 누르고, 표시된 칸으로 움직여 보세요.</p></div>
        <div className={styles.controls} aria-label="대국 모드">
          <button aria-pressed={mode === "computer"} onClick={() => mode !== "computer" && reset("computer")}>컴퓨터와 연습</button>
          <button aria-pressed={mode === "together"} onClick={() => mode !== "together" && reset("together")}>둘이 함께</button>
        </div>
        <p className={styles.note}>{mode === "computer" ? "나는 백, 컴퓨터는 흑 · 가볍게 연습하는 상대예요." : "한 기기에서 백과 흑을 번갈아 두세요."}</p>
        <div className={styles.status} role="status" aria-live="polite">{status}</div>
        <div className={styles.board} role="group" aria-label="체스판">
          {squares.map((square) => {
            const piece = game.get(square);
            const available = legal.some((move) => move.to === square);
            const dark = (square.charCodeAt(0) - 97 + Number(square[1])) % 2 === 1;
            const check = piece?.type === "k" && piece.color === game.turn() && game.isCheck();
            return <button key={square} type="button" onClick={() => select(square)}
              disabled={thinking || game.isGameOver() || !!promotion}
              className={[styles.square, dark ? styles.dark : styles.light, selected === square ? styles.selected : "", last && (last.from === square || last.to === square) ? styles.last : "", check ? styles.check : ""].join(" ")}
              aria-label={`${square}${piece ? ` ${piece.color === "w" ? "백" : "흑"} ${names[piece.type]}` : " 빈칸"}${available ? " 이동 가능" : ""}`} aria-pressed={selected === square}>
              <span className={styles.coordinate}>{square}</span>
              {piece && <span aria-hidden="true" className={piece.color === "w" ? styles.whitePiece : styles.blackPiece}>{symbols[piece.type]}</span>}
              {available && <span className={piece ? styles.capture : styles.dot} />}
            </button>;
          })}
        </div>
        {promotion && <div className={styles.promotion} role="group" aria-label="승격할 기물 선택"><p>폰이 끝까지 왔어요! 어떤 기물로 바꿀까요?</p><div className={styles.controls}>
          {(["q", "r", "b", "n"] as Promotion[]).map((piece) => <button key={piece} onClick={() => play(promotion.from, promotion.to, piece)}>{symbols[piece]} {names[piece]}</button>)}
          <button onClick={() => setPromotion(null)}>취소</button></div></div>}
        <div className={styles.controls}>
          <button onClick={undo} disabled={!moves.length}>한 수 되돌리기</button>
          <button onClick={() => setFlipped(!flipped)}>체스판 돌리기</button>
          <button onClick={() => reset()}>새로 시작</button>
        </div>
        <details className={styles.help}><summary>기물 움직임 알아보기</summary>
          <ul>{(Object.keys(names) as PieceSymbol[]).map((piece) => <li key={piece}><strong>{symbols[piece]} {names[piece]}</strong> — {({ k: "어느 방향이든 한 칸", q: "가로·세로·대각선으로 자유롭게", r: "가로·세로로 자유롭게", b: "대각선으로 자유롭게", n: "ㄱ자로 이동하고 다른 기물을 뛰어넘어요", p: "앞으로 한 칸, 처음에는 두 칸도 가능해요. 잡을 때는 대각선!" })[piece]}</li>)}</ul>
          <p>킹이 공격받으면 체크! 공격을 피할 수 없으면 체크메이트예요. 캐슬링은 킹을 두 칸 움직여요. 앙파상과 폰 승격도 가능해요.</p>
        </details>
        <details className={styles.help}><summary>이번 판 기록 ({moves.length}수)</summary><p className={styles.history}>{moves.length ? moves.map((move, i) => `${i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ""}${move}`).join(" ") : "첫 수를 두어 보세요."}</p></details>
        <p className={styles.note}>대국은 이 화면에서만 유지돼요. 화면을 나가거나 새로고침하면 초기화돼요.</p>
      </main>
    </>
  );
}
