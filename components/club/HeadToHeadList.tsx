"use client";

import { useState } from "react";
import type { HeadToHeadMatch } from "@/lib/api/headToHead";
import TeamEmblem from "./TeamEmblem";
import Badge from "../Badge";
import { snapshotLabel } from "@/lib/format";

type Result = "W" | "D" | "L";

const RESULT_LABEL: Record<Result, string> = { W: "승", D: "무", L: "패" };
const RESULT_STYLE: Record<Result, string> = {
  W: "bg-brand text-white",
  D: "bg-border-light text-white",
  L: "bg-negative text-white",
};

function resultOf(match: HeadToHeadMatch): Result {
  const incheonIsHome = match.homeTeam === "인천 유나이티드";
  const incheonScore = incheonIsHome ? match.homeScore : match.awayScore;
  const opponentScore = incheonIsHome ? match.awayScore : match.homeScore;
  if (incheonScore > opponentScore) return "W";
  if (incheonScore < opponentScore) return "L";
  return "D";
}

// 인천 유나이티드와 상대팀의 실시간 상대전적(head-to-head) 영역 (헤더 + 리스트 + 모달)
export default function HeadToHeadList({ matches, updatedAt }: { matches: HeadToHeadMatch[], updatedAt: string | null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 메인 화면에는 최근 5경기만 노출
  const visibleMatches = matches.slice(0, 5);
  const hasMore = matches.length > 5;

  return (
    <div className="flex flex-col gap-4 bg-bg-surface p-5 rounded-xl shadow-sm">
      {/* 상대전적 헤더 및 전체보기 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-border-light rounded-full" />
          <h2 className="text-lg font-bold">상대전적</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasMore && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold text-brand hover:text-white transition-colors px-2 py-1 bg-brand/10 hover:bg-brand/20 rounded-md whitespace-nowrap"
            >
              전체보기 &gt;
            </button>
          )}
          {updatedAt && <Badge text={snapshotLabel(updatedAt)} variant="neutral" />}
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="text-text-muted">상대전적 데이터를 가져오지 못했습니다</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {visibleMatches.map((match) => {
          const incheonIsHome = match.homeTeam === "인천 유나이티드";
          const opponentName = incheonIsHome ? match.awayTeam : match.homeTeam;
          const incheonScore = incheonIsHome ? match.homeScore : match.awayScore;
          const opponentScore = incheonIsHome ? match.awayScore : match.homeScore;
          const result = resultOf(match);

          return (
            <a
              key={match.date}
              href={match.gameId ? `https://sports.daum.net/match/${match.gameId}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-1 min-w-[72px] flex-col items-center gap-1 rounded-md bg-[#0E1116] border border-border-dim p-2 shrink-0 ${match.gameId ? "hover:opacity-80 transition-opacity" : ""}`}
            >
              <span className="text-[10px] text-text-muted whitespace-nowrap">
                {match.date}
              </span>
              <span className="text-[10px] text-text-muted whitespace-nowrap truncate w-full text-center" title={match.venue}>
                {match.venue || (match.round ? match.round.replace("K리그1 ", "") : "")}
              </span>
              <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[8px] font-bold ${incheonIsHome ? "bg-border-light text-text-primary" : "bg-bg-interactive text-text-primary"}`}>
                {incheonIsHome ? "HOME" : "AWAY"}
              </span>
              <div className="mt-1 flex flex-col items-center gap-1">
                <TeamEmblem teamName={opponentName} size="sm" />
                <span className="w-full truncate text-center text-[10px] font-medium text-text-muted">
                  {opponentName}
                </span>
              </div>
              <span className="mt-1 text-xs font-bold whitespace-nowrap">
                {incheonScore}:{opponentScore}
              </span>
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${RESULT_STYLE[result]}`}
              >
                {RESULT_LABEL[result]}
              </span>
            </a>
          );
        })}
      </div>
      )}

      {/* 바텀 시트 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end items-center">
          {/* 어두운 배경 (클릭 시 닫힘) */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* 모달 콘텐츠 */}
          <div className="relative bg-bg-surface w-full max-w-[640px] h-[85vh] rounded-t-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between p-5 border-b border-border-dim">
              <h3 className="text-lg font-bold">역대 전적 전체보기 <span className="text-brand text-sm ml-1">총 {matches.length}경기</span></h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-border-light text-white/80 hover:bg-border-dim hover:text-white"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {matches.map((match) => {
                const incheonIsHome = match.homeTeam === "인천 유나이티드";
                const incheonScore = incheonIsHome ? match.homeScore : match.awayScore;
                const opponentScore = incheonIsHome ? match.awayScore : match.homeScore;
                const opponentName = incheonIsHome ? match.awayTeam : match.homeTeam;
                const result = resultOf(match);

                return (
                  <a
                    key={`${match.gameId}-${match.date}`}
                    href={match.gameId ? `https://sports.daum.net/match/${match.gameId}` : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-bg-interactive border border-border-dim hover:bg-border-light transition-colors"
                  >
                    <div className="flex flex-col flex-1 shrink-0">
                      <span className="text-xs text-text-muted">{match.date}</span>
                      <span className="text-[10px] text-text-muted truncate mt-0.5">{match.venue || match.round}</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 w-40 shrink-0">
                      <span className="text-sm font-medium w-12 text-right truncate">인천</span>
                      <div className="flex items-center gap-1 font-bold text-lg">
                        <span>{incheonScore}</span>
                        <span className="text-text-muted text-sm">:</span>
                        <span>{opponentScore}</span>
                      </div>
                      <span className="text-sm font-medium w-12 text-left truncate">{opponentName}</span>
                    </div>

                    <div className="flex justify-end flex-1 shrink-0">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${RESULT_STYLE[result]}`}>
                        {RESULT_LABEL[result]}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
