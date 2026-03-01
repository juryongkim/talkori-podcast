import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Player() {
  const { epId } = useParams();
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'en'; 

  const [epData, setEpData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🎯 핵심 추가: 현재 열려있는 탭 상태 관리 ('script' 또는 'voca')
  const [activeTab, setActiveTab] = useState('script');

  // 재생 관련 상태들
  const [currentIndex, setCurrentIndex] = useState(null); // 대사 재생 인덱스
  const [playingVocaIndex, setPlayingVocaIndex] = useState(null); // 단어장 재생 인덱스
  const [isPlayingAll, setIsPlayingAllState] = useState(false);
  
  const audioRef = useRef(null);
  const autoPlayRef = useRef(false);
  const lineRefs = useRef([]);
  const lastPlayedIndexRef = useRef(0); 

  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction"; // 실제 서비스 시 대표님의 버니넷 주소 유지

  const setIsPlayingAll = (value) => {
    setIsPlayingAllState(value);
    autoPlayRef.current = value;
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.pause();
    setIsLoading(true);
    setEpData(null);
    setCurrentIndex(null);
    setPlayingVocaIndex(null);
    setIsPlayingAll(false);
    lastPlayedIndexRef.current = 0;
    setActiveTab('script'); // 에피소드가 바뀌면 무조건 스크립트 탭으로 초기화

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

  // 탭을 바꿀 때 재생 중이던 오디오 정지
  const handleTabChange = (tab) => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAll(false);
    setCurrentIndex(null);
    setPlayingVocaIndex(null);
    setActiveTab(tab);
  };

  // 📝 1. 스크립트(대사) 재생 함수
  const playLine = (index) => {
    if (audioRef.current) audioRef.current.pause();
    setPlayingVocaIndex(null); // 단어장 재생 끄기

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

    if (lineRefs.current[index] && activeTab === 'script') {
      lineRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // 📚 2. 단어장(VOCA) 재생 함수
  const playVoca = (index) => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAll(false);
    setCurrentIndex(null); // 대사 재생 끄기

    const item = epData.vocabulary[index];
    if (!item || !item.audio) return;

    const audioUrl = `${CDN_BASE_URL}/ep${epId}/${item.audio}`;
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      setPlayingVocaIndex(null); // 재생 끝나면 하이라이트 끄기
    };

    audioRef.current = audio;
    audio.play().catch(e => console.error("단어 재생 에러:", e));
    setPlayingVocaIndex(index);
  };

  const togglePlayAll = () => {
    // 단어장 탭에 있을 때는 전체 재생 버튼 동작 안 함 (또는 첫 대사부터 재생)
    if (activeTab === 'voca') {
      setActiveTab('script');
    }
    
    if (isPlayingAll) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAll(false);
    } else {
      setIsPlayingAll(true);
      const startIdx = currentIndex !== null ? currentIndex : lastPlayedIndexRef.current;
      playLine(startIdx);
    }
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
      
      {/* --- 🌟 상단 플레이어 고정 헤더 --- */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-6 text-center sticky top-4 md:top-8 z-10 backdrop-blur-xl bg-white/90">
        <Link to={`/course/real-reaction`} className="text-gray-400 absolute left-6 top-6 hover:text-gray-600 flex items-center gap-1 text-sm font-medium">
          ← Back
        </Link>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 mt-2 md:mt-0">EPISODE {epData.metadata.id}</p>
        
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1.5">
          {epData.metadata.title[lang] || epData.metadata.title.en}
        </h1>
        
        <div className="flex justify-center items-center gap-2 mb-8">
          {epData.metadata.level && (
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{epData.metadata.level}</span>
          )}
          <p className="text-indigo-600 font-semibold text-sm">Real Reaction</p>
        </div>
        
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

      {/* --- 🗂️ 탭 스위치 (Script vs Voca) --- */}
      <div className="flex border-b border-gray-200 mb-8 px-2">
        <button 
          onClick={() => handleTabChange('script')}
          className={`flex-1 pb-3 text-sm md:text-base font-bold text-center border-b-2 transition-colors duration-200 ${activeTab === 'script' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'}`}
        >
          📝 대본 (Script)
        </button>
        <button 
          onClick={() => handleTabChange('voca')}
          className={`flex-1 pb-3 text-sm md:text-base font-bold text-center border-b-2 transition-colors duration-200 ${activeTab === 'voca' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'}`}
        >
          📚 단어장 (Vocabulary)
        </button>
      </div>

      {/* --- 📝 대본 (Script) 렌더링 --- */}
      {activeTab === 'script' && (
        <div className="px-2 md:px-4 space-y-8 pb-10">
          {epData.content.map((item, index) => {
            if (item.type === 'FX') return null;

            const isMina = item.speaker.includes('Mina') || item.speaker.includes('MINA');
            const isPlaying = currentIndex === index; 
            const cleanSpeakerName = item.speaker.replace(/\s*\(.*?\)\s*/g, '').trim();

            return (
              <div 
                key={index} 
                ref={(el) => (lineRefs.current[index] = el)}
                className={`flex flex-col items-start gap-1.5 p-3 -mx-3 rounded-2xl transition-all duration-500 ${isPlaying ? 'bg-indigo-50/60 border-l-[3px] border-indigo-500 pl-5 shadow-sm' : 'border-l-[3px] border-transparent pl-5'}`}
              >
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isMina ? 'text-indigo-500' : 'text-gray-400'}`}>
                  {cleanSpeakerName}
                </span>

                {item.playable ? (
                  <p 
                    onClick={() => { setIsPlayingAll(false); playLine(index); }}
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
                    onClick={() => { setIsPlayingAll(false); playLine(index); }}
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
                        <span className="text-indigo-600/80 text-xs font-bold bg-indigo-50 px-2 py-1 rounded-md">Tip</span>
                        <span className="text-gray-500 text-xs ml-2">{item.insight.usage_tip}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- 📚 단어장 (VOCA) 렌더링 --- */}
      {activeTab === 'voca' && (
        <div className="px-2 md:px-4 space-y-4 pb-10">
          {!epData.vocabulary || epData.vocabulary.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-medium">
              이 에피소드에는 등록된 단어가 없습니다.
            </div>
          ) : (
            epData.vocabulary.map((voca, idx) => {
              const isPlayingVoca = playingVocaIndex === idx;

              return (
                <div 
                  key={idx} 
                  className={`p-5 rounded-2xl border transition-all duration-300 ${isPlayingVoca ? 'border-indigo-500 bg-indigo-50/40 shadow-md' : 'border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-100'}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className={`text-2xl font-extrabold mb-1 ${isPlayingVoca ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {voca.word}
                      </h3>
                      <p className="text-base font-semibold text-gray-500 mb-4">
                        {voca.meaning}
                      </p>
                      
                      {voca.example && (
                        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100/80">
                          <p className="text-sm font-medium text-gray-700 leading-relaxed">
                            {voca.example}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* 단어 재생 버튼 */}
                    <button 
                      onClick={() => playVoca(idx)}
                      className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlayingVoca ? 'bg-indigo-600 text-white shadow-lg scale-95' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-105'}`}
                    >
                      <span className={`${isPlayingVoca ? 'animate-pulse' : ''} text-xl ml-1`}>
                        {isPlayingVoca ? '🔊' : '▶'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}