"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

const SIZE = 9;
const KOMI = 6.5;

type Stone = 0 | 1 | 2;
type Player = 1 | 2;
type Point = { row: number; col: number };

interface GameState {
  board: Stone[];
  turn: Player;
  blackCaptures: number;
  whiteCaptures: number;
  passes: number;
  lastMove: Point | null;
}

const initialState = (): GameState => ({
  board: Array<Stone>(SIZE * SIZE).fill(0),
  turn: 1,
  blackCaptures: 0,
  whiteCaptures: 0,
  passes: 0,
  lastMove: null,
});

const indexOf = (row: number, col: number) => row * SIZE + col;

function neighbors(index: number): number[] {
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const result: number[] = [];
  if (row > 0) result.push(indexOf(row - 1, col));
  if (row < SIZE - 1) result.push(indexOf(row + 1, col));
  if (col > 0) result.push(indexOf(row, col - 1));
  if (col < SIZE - 1) result.push(indexOf(row, col + 1));
  return result;
}

function getGroup(board: Stone[], start: number) {
  const color = board[start];
  const stones = new Set<number>([start]);
  const liberties = new Set<number>();
  const queue = [start];

  while (queue.length) {
    const current = queue.pop()!;
    for (const next of neighbors(current)) {
      if (board[next] === 0) liberties.add(next);
      if (board[next] === color && !stones.has(next)) {
        stones.add(next);
        queue.push(next);
      }
    }
  }
  return { stones, liberties };
}

function boardKey(board: Stone[]) {
  return board.join("");
}

function scoreBoard(board: Stone[]) {
  let black = board.filter((stone) => stone === 1).length;
  let white = board.filter((stone) => stone === 2).length + KOMI;
  const checked = new Set<number>();

  board.forEach((stone, start) => {
    if (stone !== 0 || checked.has(start)) return;
    const region = new Set<number>([start]);
    const borders = new Set<Stone>();
    const queue = [start];
    checked.add(start);
    while (queue.length) {
      const current = queue.pop()!;
      for (const next of neighbors(current)) {
        if (board[next] === 0 && !checked.has(next)) {
          checked.add(next);
          region.add(next);
          queue.push(next);
        } else if (board[next] !== 0) {
          borders.add(board[next]);
        }
      }
    }
    if (borders.size === 1) {
      if (borders.has(1)) black += region.size;
      if (borders.has(2)) white += region.size;
    }
  });

  return { black, white };
}

export default function BadukPage() {
  const [game, setGame] = useState<GameState>(initialState);
  const [history, setHistory] = useState<GameState[]>([]);
  const [message, setMessage] = useState("검은 돌부터 시작해요.");
  const [finished, setFinished] = useState(false);

  const score = useMemo(() => scoreBoard(game.board), [game.board]);
  const winner = score.black > score.white ? "흑" : "백";
  const margin = Math.abs(score.black - score.white);

  const play = (row: number, col: number) => {
    if (finished) return;
    const placedAt = indexOf(row, col);
    if (game.board[placedAt] !== 0) {
      setMessage("이미 돌이 놓인 자리예요.");
      return;
    }

    const board = [...game.board];
    board[placedAt] = game.turn;
    const opponent: Player = game.turn === 1 ? 2 : 1;
    let captured = 0;

    for (const next of neighbors(placedAt)) {
      if (board[next] !== opponent) continue;
      const group = getGroup(board, next);
      if (group.liberties.size === 0) {
        captured += group.stones.size;
        group.stones.forEach((stone) => (board[stone] = 0));
      }
    }

    if (getGroup(board, placedAt).liberties.size === 0) {
      setMessage("자충수라서 그곳에는 둘 수 없어요.");
      return;
    }

    const positionBeforeOpponentMove = history.at(-1)?.board;
    if (positionBeforeOpponentMove && boardKey(board) === boardKey(positionBeforeOpponentMove)) {
      setMessage("패 규칙 때문에 바로 되따낼 수 없어요.");
      return;
    }

    setHistory((previous) => [...previous, game]);
    setGame({
      board,
      turn: opponent,
      blackCaptures: game.blackCaptures + (game.turn === 1 ? captured : 0),
      whiteCaptures: game.whiteCaptures + (game.turn === 2 ? captured : 0),
      passes: 0,
      lastMove: { row, col },
    });
    setMessage(captured ? `${captured}개의 돌을 잡았어요!` : `${opponent === 1 ? "흑" : "백"} 차례예요.`);
  };

  const pass = () => {
    if (finished) return;
    const nextPasses = game.passes + 1;
    setHistory((previous) => [...previous, game]);
    setGame({ ...game, turn: game.turn === 1 ? 2 : 1, passes: nextPasses, lastMove: null });
    if (nextPasses >= 2) {
      setFinished(true);
      setMessage("두 번 연속으로 쉬어서 대국이 끝났어요.");
    } else {
      setMessage(`${game.turn === 1 ? "흑" : "백"}이 쉬었어요. 다음 차례!`);
    }
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setGame(previous);
    setHistory((items) => items.slice(0, -1));
    setFinished(false);
    setMessage("한 수 무르기 했어요.");
  };

  const restart = () => {
    setGame(initialState());
    setHistory([]);
    setFinished(false);
    setMessage("새 대국을 시작해요. 검은 돌 차례!");
  };

  return (
    <>
      <AppHeader title="윤호의 9줄 바둑" showBack backHref="/play" />
      <main className={styles.page}>
        <section className={styles.statusCard} aria-live="polite">
          <div className={styles.turnRow}>
            <span className={`${styles.turnStone} ${game.turn === 1 ? styles.black : styles.white}`} />
            <strong>{finished ? "대국 종료" : `${game.turn === 1 ? "흑" : "백"} 차례`}</strong>
          </div>
          <p>{message}</p>
        </section>

        <div className={styles.captureRow}>
          <span>⚫ 흑이 잡은 돌 <strong>{game.blackCaptures}</strong></span>
          <span>⚪ 백이 잡은 돌 <strong>{game.whiteCaptures}</strong></span>
        </div>

        <div className={styles.boardFrame}>
          <div className={styles.board} role="grid" aria-label="9줄 바둑판">
            {game.board.map((stone, index) => {
              const row = Math.floor(index / SIZE);
              const col = index % SIZE;
              const isLast = game.lastMove?.row === row && game.lastMove?.col === col;
              return (
                <button
                  type="button"
                  role="gridcell"
                  key={index}
                  className={styles.point}
                  onClick={() => play(row, col)}
                  aria-label={`${row + 1}행 ${col + 1}열${stone === 1 ? " 흑돌" : stone === 2 ? " 백돌" : " 빈자리"}`}
                  disabled={finished}
                >
                  {stone !== 0 && (
                    <span className={`${styles.stone} ${stone === 1 ? styles.black : styles.white}`}>
                      {isLast && <span className={styles.lastMove} />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {finished && (
          <section className={styles.resultCard}>
            <span className={styles.resultEmoji}>🎉</span>
            <h2>{winner}이 {margin}집 이겼어요!</h2>
            <p>흑 {score.black}집 · 백 {score.white}집 (덤 {KOMI}집 포함)</p>
            <small>돌과 둘러싼 빈칸을 함께 세는 방식이에요.</small>
          </section>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={undo} disabled={!history.length}>
            <Undo2 size={18} /> 한 수 무르기
          </button>
          <button type="button" className={styles.passButton} onClick={pass} disabled={finished}>이번 차례 쉬기</button>
          <button type="button" className={styles.secondaryButton} onClick={restart}>
            <RotateCcw size={18} /> 새 대국
          </button>
        </div>

        <details className={styles.help}>
          <summary>바둑 규칙 도움말</summary>
          <p>돌을 번갈아 놓고, 숨 쉴 곳이 없어진 상대 돌을 잡아요. 두 사람이 연속으로 쉬면 돌과 둘러싼 빈칸을 세어 승부를 정해요.</p>
        </details>
      </main>
    </>
  );
}
