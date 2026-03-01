import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ep001Data from '../data/ep001.json';

export default function Player() {
  const { epId } = useParams();
  
  // 🎵 오디오 상태 관리
  const [playingAudio, setPlayingAudio] = useState(null); // 현재 재생 중인 파일명 추적
  const audioRef = useRef(null); // HTML 오디오 객체를 담아둘 상자

  // ⚠️ [중요] 아래 주소를 대표님의 실제 버니넷 풀존(Pull Zone) 주소로 변경해 주세요!
  // 예: "https://my-talkori.b-cdn.net/podcast/reaction"
  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  // 사용자가 페이지를 나갈 때 소리를 꺼주는 안전장치
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // 🎵 재생 함수
  const handlePlay = (audioFileName) => {
    // 1. 이미 다른 소리가 나고 있다면 끕니다.
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // 2. 버니넷 URL 조립 (예: .../ep001/RR_001_s004.mp3)
    const audioUrl = `${CDN_BASE_URL}/ep${epId}/${audioFileName}`;

    // 👉 [이 줄을 추가해 주세요!] 완성된 주소를 콘솔창에 출력합니다.
    console.log("🔍 [디버깅] 요청하는 오디오 주소:", audioUrl);
    
    // 3. 소리 재생!
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error("재생 에러 (버니넷 주소를 확인하세요):", e));
    
    // 4. 소리가 끝나면 상태 초기화
    audio.onended = () => {
      setPlayingAudio(null);
    };

    audioRef.current = audio;
    setPlayingAudio(audioFileName);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 bg-gray-50 min-h-screen">
      
      {/* 1. 상단 재생기 영역 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6 text-center sticky top-4 z-10">
        <Link to="/course/real-reaction" className="text-gray-400 absolute left-6 top-6 hover:text-gray-600">
          ↓ 닫기
        </Link>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">EPISODE {epId}</p>
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900 mb-1">{ep001Data.metadata.title}</h1>
        <p className="text-indigo-600 font-medium text-sm mb-6">리얼 리액션</p>
        
        <div className="flex items-center justify-center gap-8">
          <button className="text-gray-400 hover:text-gray-600 font-bold text-xl">⏪</button>
          <button className="bg-gray-900 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-md text-xl">
            ▶
          </button>
          <button className="text-gray-400 hover:text-gray-600 font-bold text-xl">⏩</button>
        </div>
      </div>

      {/* 2. 인터랙티브 스크립트 영역 */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
          Interactive Script
        </h2>
        
        <div className="space-y-6">
          {ep001Data.content.map((item, index) => {
            if (item.type === 'FX') return null;

            const isMina = item.speaker === 'Mina';
            // 현재 이 문장이 재생 중인지 확인
            const isPlaying = playingAudio === item.audio; 

            return (
              <div key={index} className="flex flex-col items-start gap-1">
                
                <span className={`text-xs font-bold uppercase ${isMina ? 'text-indigo-500' : 'text-gray-400'}`}>
                  {item.speaker} {item.emotion && <span className="font-normal opacity-70">({item.emotion})</span>}
                </span>

                {item.playable ? (
                  // 👉 여기를 클릭하면 handlePlay 함수가 실행됩니다!
                  <p 
                    onClick={() => handlePlay(item.audio)}
                    className={`text-xl font-bold cursor-pointer px-2 py-1 -ml-2 rounded-lg transition-colors flex items-center gap-2 group
                      ${isPlaying ? 'text-indigo-600 bg-indigo-50' : 'text-gray-900 hover:bg-gray-100'}
                    `}
                  >
                    {item.text} 
                    {/* 재생 중이면 스피커 아이콘, 아니면 플레이 아이콘으로 바뀝니다 */}
                    <span className={`text-sm transition-colors ${isPlaying ? 'text-indigo-600' : 'text-gray-300 group-hover:text-indigo-400'}`}>
                      {isPlaying ? '🔊' : '▶'}
                    </span>
                  </p>
                ) : (
                  <p className="text-lg text-gray-800 px-2 py-1 -ml-2">{item.text}</p>
                )}

                {item.translation && (
                  <p className="text-sm text-gray-500 font-medium mb-1 pl-2 border-l-2 border-gray-200">
                    {item.translation}
                  </p>
                )}

                {item.insight && (
                  <div className="mt-2 bg-indigo-50/50 border-l-4 border-indigo-400 p-3 rounded-r-lg w-full">
                    <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-1">
                      💡 {item.insight.title}
                    </h4>
                    <p className="text-indigo-800/80 text-sm mt-1 leading-relaxed">
                      {item.insight.description}
                    </p>
                    {item.insight.usage_tip && (
                      <p className="text-indigo-600/70 text-xs mt-2 font-medium bg-white/50 inline-block px-2 py-1 rounded">
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