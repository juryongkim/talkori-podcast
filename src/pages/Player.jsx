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
  
  // ✨ [핵심 추가] 마지막으로 들었던 문장 번호를 기억하는 '책갈피'
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
    lastPlayedIndexRef.current = 0; // 방에 새로 들어오면 책갈피도 0번으로 초기화!

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
    
    // ✨ 오디오를 재생할 때마다 "나 방금 여기 읽었어!" 하고 책갈피를 꽂아둡니다.
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
        // 개별 재생이 끝났을 때만 하이라이트를 끕니다. (하지만 책갈피는 그대로 남아있습니다!)
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
      // ⏸️ 일시정지 누를 때
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAll(false);
      // UX 개선: 일시정지해도 currentIndex를 null로 만들지 않아서 파란색 하이라이트가 유지됩니다!
    } else {
      // ▶️ 전체 재생 누를 때
      setIsPlayingAll(true);
      
      // ✨ 마법의 로직: 현재 멈춰있는 문장(currentIndex)이 있으면 거기서부터, 
      // 개별 클릭으로 다 듣고 하이라이트가 꺼졌다면 기억해둔 책갈피(lastPlayedIndexRef)부터 재생!
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium">에피소드를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!epData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl font-bold text-gray-700 mb-4">앗! 에피소드를 찾을 수 없어요. 😢</p>
        <Link to="/course/real-reaction" className="text-indigo-600 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 bg-gray-50 min-h-screen">
      
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6 text-center sticky top-4 z-10 transition-all">
        <Link to="/course/real-reaction" className="text-gray-400 absolute left-6 top-6 hover:text-gray-600">
          ↓ 닫기
        </Link>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">EPISODE {epId}</p>
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900 mb-1">{epData.metadata.title}</h1>
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
          {epData.content.map((item, index) => {
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
                  <p 
                    onClick={() => handleLineClick(index)}
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