import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ep001Data from '../data/ep001.json';

export default function Player() {
  const { epId } = useParams();
  
  // 🎵 오디오 및 스크롤 상태 관리
  const [currentIndex, setCurrentIndex] = useState(null); // 현재 재생 중인 문장의 번호(인덱스)
  const [isPlayingAll, setIsPlayingAllState] = useState(false); // 전체 재생 모드인지 화면에 보여줄 상태
  
  const audioRef = useRef(null); // 실제 오디오 객체
  const autoPlayRef = useRef(false); // 전체 재생 모드인지 기억하는 비밀 창고 (Closure 버그 방지용)
  const lineRefs = useRef([]); // 각 문장들의 화면상 위치(좌표)를 기억할 배열

  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  // 상태와 Ref를 동시에 업데이트하는 헬퍼 함수
  const setIsPlayingAll = (value) => {
    setIsPlayingAllState(value);
    autoPlayRef.current = value;
  };

  // 페이지를 나갈 때 소리를 끄는 안전장치
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // 🎯 특정 문장을 재생하는 핵심 함수
  const playLine = (index) => {
    if (audioRef.current) audioRef.current.pause();

    const item = ep001Data.content[index];
    
    // 만약 재생할 오디오가 없는 줄이라면(효과음 등), 다음 줄로 넘어갑니다
    if (!item || !item.playable || !item.audio) {
      if (autoPlayRef.current && index < ep001Data.content.length - 1) {
        playLine(index + 1);
      } else {
        setIsPlayingAll(false);
        setCurrentIndex(null);
      }
      return;
    }

    const audioUrl = `${CDN_BASE_URL}/ep${epId}/${item.audio}`;
    const audio = new Audio(audioUrl);

    // 소리가 끝났을 때의 행동 지침
    audio.onended = () => {
      if (autoPlayRef.current) {
        // 전체 재생 중이라면 다음 문장으로!
        playLine(index + 1);
      } else {
        // 개별 재생이었다면 여기서 멈춤!
        setCurrentIndex(null);
      }
    };

    audioRef.current = audio;
    audio.play().catch(e => console.error("재생 에러:", e));
    setCurrentIndex(index);

    // ✨ 마법의 자동 스크롤 기능 (노래방 가사처럼 중앙으로 스르륵 이동)
    if (lineRefs.current[index]) {
      lineRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // ⏯️ 상단 전체 재생 / 일시정지 버튼 클릭 시
  const togglePlayAll = () => {
    if (isPlayingAll) {
      // 멈춤
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAll(false);
      setCurrentIndex(null);
    } else {
      // 재생 시작 (처음부터, 혹은 멈췄던 곳부터)
      setIsPlayingAll(true);
      const startIdx = currentIndex !== null ? currentIndex : 0;
      playLine(startIdx);
    }
  };

  // 👆 개별 문장 클릭 시
  const handleLineClick = (index) => {
    setIsPlayingAll(false); // 수동으로 클릭하면 전체 재생 모드는 잠시 끕니다
    playLine(index);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 bg-gray-50 min-h-screen">
      
      {/* 1. 상단 재생기 영역 (화면 위에 찰싹 붙어있음) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6 text-center sticky top-4 z-10 transition-all">
        <Link to="/course/real-reaction" className="text-gray-400 absolute left-6 top-6 hover:text-gray-600">
          ↓ 닫기
        </Link>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">EPISODE {epId}</p>
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900 mb-1">{ep001Data.metadata.title}</h1>
        <p className="text-indigo-600 font-medium text-sm mb-6">리얼 리액션</p>
        
        {/* ✨ 진짜 작동하는 전체 재생 컨트롤러 */}
        <div className="flex items-center justify-center gap-8">
          <button className="text-gray-400 hover:text-gray-600 font-bold text-xl">⏪</button>
          <button 
            onClick={togglePlayAll}
            className={`${isPlayingAll ? 'bg-indigo-600' : 'bg-gray-900'} text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-md text-xl`}
          >
            {isPlayingAll ? '⏸' : '▶'}
          </button>
          <button className="text-gray-400 hover:text-gray-600 font-bold text-xl">⏩</button>
        </div>
      </div>

      {/* 2. 인터랙티브 스크립트 영역 */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8 pb-32">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
          Interactive Script
        </h2>
        
        <div className="space-y-6">
          {ep001Data.content.map((item, index) => {
            if (item.type === 'FX') return null;

            const isMina = item.speaker === 'Mina';
            const isPlaying = currentIndex === index; 

            return (
              <div 
                key={index} 
                // 👇 여기가 핵심! 스크롤 위치를 위해 각각의 줄에 이름표(Ref)를 달아줍니다.
                ref={(el) => (lineRefs.current[index] = el)}
                className={`flex flex-col items-start gap-1 p-2 -mx-2 rounded-xl transition-all duration-300 ${isPlaying ? 'bg-indigo-50/50 border-l-4 border-indigo-400 pl-4' : 'border-l-4 border-transparent pl-4'}`}
              >
                
                <span className={`text-xs font-bold uppercase ${isMina ? 'text-indigo-500' : 'text-gray-400'}`}>
                  {item.speaker} {item.emotion && <span className="font-normal opacity-70">({item.emotion})</span>}
                </span>

                {item.playable ? (
                  <p 
                    onClick={() => handleLineClick(index)}
                    className={`text-xl font-bold cursor-pointer rounded-lg transition-colors flex items-center gap-2 group
                      ${isPlaying ? 'text-indigo-600' : 'text-gray-900 hover:text-indigo-500'}
                    `}
                  >
                    {item.text} 
                    <span className={`text-sm transition-colors ${isPlaying ? 'text-indigo-600 animate-pulse' : 'text-gray-300 group-hover:text-indigo-400'}`}>
                      {isPlaying ? '🔊' : '▶'}
                    </span>
                  </p>
                ) : (
                  <p className="text-lg text-gray-800">{item.text}</p>
                )}

                {item.translation && (
                  <p className="text-sm text-gray-500 font-medium mb-1 pl-2 border-l-2 border-gray-200">
                    {item.translation}
                  </p>
                )}

                {item.insight && (
                  <div className="mt-2 bg-white/80 border border-indigo-100 p-3 rounded-lg w-full shadow-sm">
                    <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-1">
                      💡 {item.insight.title}
                    </h4>
                    <p className="text-indigo-800/80 text-sm mt-1 leading-relaxed">
                      {item.insight.description}
                    </p>
                    {item.insight.usage_tip && (
                      <p className="text-indigo-600/70 text-xs mt-2 font-medium bg-indigo-50 inline-block px-2 py-1 rounded">
                        Tip: {item.insight.usage_tip}
                      </p>
                    )}
                  </div>
                )}
                
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}