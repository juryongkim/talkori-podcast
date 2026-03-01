import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function Player() {
  const { epId } = useParams(); // URL에서 001, 002를 가져옵니다.
  
  // 📚 데이터 상태 관리 (동적으로 불러온 JSON을 담을 빈 상자)
  const [epData, setEpData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🎵 오디오 및 스크롤 상태 관리
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

  // 🪄 [핵심!] URL(epId)이 바뀔 때마다 알맞은 JSON 파일을 알아서 불러옵니다!
  useEffect(() => {
    // 1. 방에 새로 들어왔으니 기존 재생되던 소리는 끄고, 로딩 상태로 만듭니다.
    if (audioRef.current) audioRef.current.pause();
    setIsLoading(true);
    setEpData(null);
    setCurrentIndex(null);
    setIsPlayingAll(false);

    // 2. 동적으로 파일 불러오기 (예: ../data/ep002.json)
    import(`../data/ep${epId}.json`)
      .then((module) => {
        setEpData(module.default); // 성공적으로 불러오면 상자에 담습니다.
        setIsLoading(false); // 로딩 끝!
      })
      .catch((err) => {
        console.error("데이터를 불러오지 못했습니다:", err);
        setIsLoading(false);
      });
      
    // 컴포넌트가 꺼질 때(뒤로가기 등) 소리 끄기
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [epId]); // epId가 바뀔 때마다 이 useEffect가 다시 실행됩니다.

  const playLine = (index) => {
    if (audioRef.current) audioRef.current.pause();

    const item = epData.content[index];
    
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

  // ⏳ 데이터가 아직 도착하지 않았을 때 보여줄 로딩 화면
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium">에피소드를 불러오는 중입니다...</p>
      </div>
    );
  }

  // ❌ 에러가 났거나 파일이 없을 때 보여줄 화면
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

  // ✨ 드디어 렌더링! (ep001Data -> epData 로 모두 변경되었습니다)
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