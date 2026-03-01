import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ep001Data from '../data/ep001.json';

export default function Player() {
  const { epId } = useParams();
  
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlayingAll, setIsPlayingAllState] = useState(false);
  
  const audioRef = useRef(null);
  const autoPlayRef = useRef(false);
  const lineRefs = useRef([]);

  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  const setIsPlayingAll = (value) => {
    setIsPlayingAllState(value);
    autoPlayRef.current = value;
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const playLine = (index) => {
    if (audioRef.current) audioRef.current.pause();

    const item = ep001Data.content[index];
    
    // 🚨 핵심 수정 부분: item.playable 조건 삭제!
    // 재생 버튼 유무와 상관없이 오디오 파일(item.audio)만 있으면 무조건 재생합니다.
    if (!item || !item.audio) {
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
      setCurrentIndex(null);
    } else {
      setIsPlayingAll(true);
      const startIdx = currentIndex !== null ? currentIndex : 0;
      playLine(startIdx);
    }
  };

  const handleLineClick = (index) => {
    setIsPlayingAll(false);
    playLine(index);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 bg-gray-50 min-h-screen">
      
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6 text-center sticky top-4 z-10 transition-all">
        <Link to="/course/real-reaction" className="text-gray-400 absolute left-6 top-6 hover:text-gray-600">
          ↓ 닫기
        </Link>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">EPISODE {epId}</p>
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900 mb-1">{ep001Data.metadata.title}</h1>
        <p className="text-indigo-600 font-medium text-sm mb-6">리얼 리액션</p>
        
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
                ref={(el) => (lineRefs.current[index] = el)}
                className={`flex flex-col items-start gap-1 p-2 -mx-2 rounded-xl transition-all duration-300 ${isPlaying ? 'bg-indigo-50/50 border-l-4 border-indigo-400 pl-4' : 'border-l-4 border-transparent pl-4'}`}
              >
                
                <span className={`text-xs font-bold uppercase ${isMina ? 'text-indigo-500' : 'text-gray-400'}`}>
                  {item.speaker} {item.emotion && <span className="font-normal opacity-70">({item.emotion})</span>}
                </span>

                {item.playable ? (
                  // 미나의 한국어 대사 (클릭 가능)
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
                  // 🚨 존의 영어 대사 (클릭 버튼은 없지만, 자동 재생 시 색깔이 예쁘게 변하도록 수정!)
                  <p 
                    onClick={() => handleLineClick(index)} // 혹시 몰라 존 대사도 클릭하면 들리게 숨겨뒀습니다!
                    className={`text-lg px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer
                      ${isPlaying ? 'text-indigo-600 font-bold' : 'text-gray-800 hover:text-gray-600'}
                    `}
                  >
                    {item.text}
                  </p>
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