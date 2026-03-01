import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function Player() {
  const { epId } = useParams();
  
  const [epData, setEpData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlayingAll, setIsPlayingAllState] = useState(false);
  
  const audioRef = useRef(null);
  const autoPlayRef = useRef(false);
  const lineRefs = useRef([]);
  const lastPlayedIndexRef = useRef(0); 

  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  const setIsPlayingAll = (value) => {
    setIsPlayingAllState(value);
    autoPlayRef.current = value;
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.pause();
    setIsLoading(true);
    setEpData(null);
    setCurrentIndex(null);
    setIsPlayingAll(false);
    lastPlayedIndexRef.current = 0;

    import(`../data/ep${epId}.json`)
      .then((module) => {
        setEpData(module.default);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("데이터 로드 실패:", err);
        setIsLoading(false);
      });
      
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [epId]);

  const playLine = (index) => {
    if (audioRef.current) audioRef.current.pause();

    const item = epData.content[index];
    lastPlayedIndexRef.current = index; 
    
    if (!item || !item.audio) {
      if (autoPlayRef.current && index < epData.content.length - 1) {
        playLine(index + 1);
      } else {
        setIsPlayingAll(false);
        setCurrentIndex(null);
      }
      return;
    }

    const audioUrl = `${CDN_BASE_URL}/ep${epId}/${item.audio}`;
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      if (autoPlayRef.current) {
        playLine(index + 1);
      } else {
        setCurrentIndex(null);
      }
    };

    audioRef.current = audio;
    audio.play().catch(e => console.error("재생 에러:", e));
    setCurrentIndex(index);

    if (lineRefs.current[index]) {
      lineRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const togglePlayAll = () => {
    if (isPlayingAll) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAll(false);
    } else {
      setIsPlayingAll(true);
      const startIdx = currentIndex !== null ? currentIndex : lastPlayedIndexRef.current;
      playLine(startIdx);
    }
  };

  const handleLineClick = (index) => {
    setIsPlayingAll(false);
    playLine(index);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
      </div>
    );
  }

  if (!epData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <p className="text-xl font-bold text-gray-700 mb-4">앗! 에피소드를 찾을 수 없어요. 😢</p>
        <Link to={`/course/${epData?.metadata?.course || 'real-reaction'}`} className="text-indigo-600 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
      
      {/* 1. 상단 재생기 (디자인 정밀화) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8 text-center sticky top-4 md:top-8 z-10 transition-all backdrop-blur-xl bg-white/90">
        <Link to={`/course/real-reaction`} className="text-gray-400 absolute left-6 top-6 hover:text-gray-600 flex items-center gap-1 text-sm font-medium">
          ← 뒤로
        </Link>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 mt-2 md:mt-0">EPISODE {epId}</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1.5">{epData.metadata.title}</h1>
        <p className="text-indigo-600 font-semibold text-sm mb-8">{epData.metadata.course || '리얼 리액션'}</p>
        
        <div className="flex items-center justify-center gap-8">
          <button className="text-gray-300 hover:text-gray-500 font-bold text-2xl transition-colors">⏪</button>
          <button 
            onClick={togglePlayAll}
            className={`${isPlayingAll ? 'bg-indigo-600 scale-95' : 'bg-gray-900 hover:scale-105'} text-white w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg text-2xl`}
          >
            {isPlayingAll ? '⏸' : '▶'}
          </button>
          <button className="text-gray-300 hover:text-gray-500 font-bold text-2xl transition-colors">⏩</button>
        </div>
      </div>

      {/* 2. 대본 영역 */}
      <div className="px-2 md:px-4">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 border-b border-gray-100 pb-3">
          Interactive Script
        </h2>
        
        <div className="space-y-8">
          {epData.content.map((item, index) => {
            if (item.type === 'FX') return null;

            const isMina = item.speaker.includes('Mina') || item.speaker.includes('MINA');
            const isPlaying = currentIndex === index; 
            
            // ✨ [핵심 수정] 괄호 안에 있는 글자(감정 지시문)를 정규식으로 완벽하게 삭제합니다!
            // 예: "MINA (황당해하며)" -> "MINA"
            const cleanSpeakerName = item.speaker.replace(/\s*\(.*?\)\s*/g, '').trim();

            return (
              <div 
                key={index} 
                ref={(el) => (lineRefs.current[index] = el)}
                className={`flex flex-col items-start gap-1.5 p-3 -mx-3 rounded-2xl transition-all duration-500 ${isPlaying ? 'bg-indigo-50/60 border-l-[3px] border-indigo-500 pl-5 shadow-sm' : 'border-l-[3px] border-transparent pl-5'}`}
              >
                
                {/* 깔끔해진 화자 이름 렌더링 */}
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isMina ? 'text-indigo-500' : 'text-gray-400'}`}>
                  {cleanSpeakerName}
                </span>

                {item.playable ? (
                  <p 
                    onClick={() => handleLineClick(index)}
                    className={`text-xl md:text-2xl font-bold cursor-pointer rounded-lg transition-colors flex items-start gap-2 group leading-tight
                      ${isPlaying ? 'text-indigo-700' : 'text-gray-900 hover:text-indigo-500'}
                    `}
                  >
                    {item.text} 
                    <span className={`text-base mt-1 transition-colors ${isPlaying ? 'text-indigo-600 animate-pulse' : 'text-gray-200 group-hover:text-indigo-300'}`}>
                      {isPlaying ? '🔊' : '▶'}
                    </span>
                  </p>
                ) : (
                  <p 
                    onClick={() => handleLineClick(index)}
                    className={`text-lg md:text-xl px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer leading-tight
                      ${isPlaying ? 'text-indigo-700 font-bold' : 'text-gray-700 hover:text-gray-500'}
                    `}
                  >
                    {item.text}
                  </p>
                )}

                {item.translation && (
                  <p className="text-sm md:text-base text-gray-500 font-medium mt-1 mb-1 pl-3 border-l-2 border-gray-200">
                    {item.translation}
                  </p>
                )}

                {item.insight && (
                  <div className="mt-3 bg-white border border-indigo-50 p-4 rounded-xl w-full shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">💡</span> {item.insight.title}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.insight.description}
                    </p>
                    {item.insight.usage_tip && (
                      <div className="mt-3">
                        <span className="text-indigo-600/80 text-xs font-bold bg-indigo-50 px-2 py-1 rounded-md">
                          Tip
                        </span>
                        <span className="text-gray-500 text-xs ml-2">{item.insight.usage_tip}</span>
                      </div>
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