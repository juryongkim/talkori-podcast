import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Player() {
  const { epId } = useParams();
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'en'; 
  
  const [epData, setEpData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('script');
  const [playingVocaIndex, setPlayingVocaIndex] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlayingAll, setIsPlayingAllState] = useState(false);
  
  const audioRef = useRef(null);
  const autoPlayRef = useRef(false);
  const lineRefs = useRef([]);
  const lastPlayedIndexRef = useRef(0); 

  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  // ==========================================
  // ✨ [Phase 1 핵심 추가] 로컬 스토리지 북마크 로직
  // ==========================================
  
  // 1. 단어장 저장 state (초기값은 로컬 스토리지에서 불러옴)
  const [savedVoca, setSavedVoca] = useState(() => {
    const saved = localStorage.getItem('talkori_saved_voca');
    return saved ? JSON.parse(saved) : [];
  });

  // 2. 대본 문장 저장 state
  const [savedScript, setSavedScript] = useState(() => {
    const saved = localStorage.getItem('talkori_saved_script');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. state가 바뀔 때마다 로컬 스토리지에 자동 저장 (동기화)
  useEffect(() => {
    localStorage.setItem('talkori_saved_voca', JSON.stringify(savedVoca));
  }, [savedVoca]);

  useEffect(() => {
    localStorage.setItem('talkori_saved_script', JSON.stringify(savedScript));
  }, [savedScript]);

  // 4. 단어 북마크 토글 함수
  const toggleVocaBookmark = (voca, e) => {
    e.stopPropagation(); // 플레이어 재생 클릭과 겹치지 않게 방지
    const isSaved = savedVoca.some(v => v.word === voca.word);
    if (isSaved) {
      setSavedVoca(savedVoca.filter(v => v.word !== voca.word)); // 삭제
    } else {
      setSavedVoca([...savedVoca, { ...voca, epId }]); // 추가 (에피소드 출처도 함께 저장)
    }
  };

  // 5. 문장 북마크 토글 함수
  const toggleScriptBookmark = (item, e) => {
    e.stopPropagation();
    const isSaved = savedScript.some(s => s.text === item.text);
    if (isSaved) {
      setSavedScript(savedScript.filter(s => s.text !== item.text)); // 삭제
    } else {
      setSavedScript([...savedScript, { ...item, epId }]); // 추가
    }
  };

  // ==========================================

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
    setActiveTab('script'); 

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

  const handleTabChange = (tab) => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAll(false);
    setCurrentIndex(null);
    setPlayingVocaIndex(null);
    setActiveTab(tab);
  };

  const playLine = (index) => {
    if (audioRef.current) audioRef.current.pause();
    setPlayingVocaIndex(null); 

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

  const playVoca = (index) => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAll(false);
    setCurrentIndex(null); 

    const item = epData.vocabulary[index];
    if (!item || !item.audio) return;

    const audioUrl = `${CDN_BASE_URL}/ep${epId}/${item.audio}`;
    const audio = new Audio(audioUrl);

    audio.onended = () => setPlayingVocaIndex(null);
    
    audioRef.current = audio;
    audio.play().catch(e => console.error("단어 재생 에러:", e));
    setPlayingVocaIndex(index);
  };

  const togglePlayAll = () => {
    if (activeTab === 'voca') setActiveTab('script'); 

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium">에피소드를 불러오는 중...</p>
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

  const displayTitle = typeof epData.metadata.title === 'object' 
    ? (epData.metadata.title[lang] || epData.metadata.title.en)
    : epData.metadata.title;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 bg-gray-50 min-h-screen">
      
      {/* --- 상단 스티키 플레이어 --- */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6 text-center sticky top-4 z-10 transition-all">
        <Link to="/course/real-reaction" className="text-gray-400 absolute left-6 top-6 hover:text-gray-600 text-sm font-bold">
          ← List
        </Link>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 mt-2 md:mt-0">EPISODE {epId}</p>
        <h1 className="text-xl font-extrabold tracking-tight text-gray-900 mb-1 line-clamp-2">
          {displayTitle}
        </h1>
        <p className="text-indigo-600 font-medium text-sm mb-6">Real Reaction</p>
        
        <div className="flex items-center justify-center gap-8 mb-4">
          <button className="text-gray-400 hover:text-gray-600 font-bold text-xl">⏪</button>
          <button 
            onClick={togglePlayAll}
            className={`${isPlayingAll ? 'bg-indigo-600' : 'bg-gray-900'} text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-md text-xl`}
          >
            {isPlayingAll ? '⏸' : '▶'}
          </button>
          <button className="text-gray-400 hover:text-gray-600 font-bold text-xl">⏩</button>
        </div>

        <div className="flex border-t border-gray-100 pt-4 mt-2">
          <button 
            onClick={() => handleTabChange('script')}
            className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'script' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            📝 대본 (Script)
          </button>
          <button 
            onClick={() => handleTabChange('voca')}
            className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'voca' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            📚 단어장 (Vocabulary)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8 pb-32">
        
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
          {activeTab === 'script' ? 'Interactive Script' : 'Vocabulary List'}
        </h2>
        
        {/* 📝 스크립트 영역 */}
        {activeTab === 'script' && (
          <div className="space-y-6">
            {epData.content.map((item, index) => {
              if (item.type === 'FX') return null;

              const isMina = item.speaker.toUpperCase().includes('MINA');
              const isPlaying = currentIndex === index; 
              // ✨ 해당 문장이 저장되어 있는지 확인
              const isSaved = savedScript.some(s => s.text === item.text);

              return (
                <div 
                  key={index} 
                  ref={(el) => (lineRefs.current[index] = el)}
                  className={`relative flex flex-col items-start gap-1 p-2 -mx-2 rounded-xl transition-all duration-300 ${isPlaying ? 'bg-indigo-50/50 border-l-4 border-indigo-400 pl-4' : 'border-l-4 border-transparent pl-4 hover:bg-gray-50/50'}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs font-bold uppercase ${isMina ? 'text-indigo-500' : 'text-gray-400'}`}>
                      {item.speaker} {item.emotion && <span className="font-normal opacity-70">({item.emotion})</span>}
                    </span>
                    
                    {/* ✨ 문장 북마크 버튼 추가 */}
                    {item.playable && (
                      <button 
                        onClick={(e) => toggleScriptBookmark(item, e)}
                        className={`text-xl transition-transform hover:scale-110 ${isSaved ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                        title="내 학습장에 저장"
                      >
                        {isSaved ? '★' : '☆'}
                      </button>
                    )}
                  </div>

                  {item.playable ? (
                    <p 
                      onClick={() => handleLineClick(index)}
                      className={`text-xl font-bold cursor-pointer rounded-lg transition-colors flex items-center gap-2 group pr-8
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
                      className={`text-lg px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer pr-8
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
        )}

        {/* 📚 단어장 영역 */}
        {activeTab === 'voca' && (
          <div className="space-y-4">
            {!epData.vocabulary || epData.vocabulary.length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-medium">등록된 단어가 없습니다.</div>
            ) : (
              epData.vocabulary.map((voca, idx) => {
                const isPlayingVoca = playingVocaIndex === idx;
                // ✨ 해당 단어가 저장되어 있는지 확인
                const isSaved = savedVoca.some(v => v.word === voca.word);

                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col items-start gap-1 p-4 rounded-xl transition-all duration-300 border ${isPlayingVoca ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-100'}`}
                  >
                    <div className="flex justify-between items-start w-full mb-1">
                      <h3 className={`text-xl font-extrabold flex items-center gap-2 ${isPlayingVoca ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {voca.word}
                        {/* ✨ 단어 북마크 버튼 추가 */}
                        <button 
                          onClick={(e) => toggleVocaBookmark(voca, e)}
                          className={`text-xl transition-transform hover:scale-110 mb-1 ${isSaved ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                          title="단어장에 저장"
                        >
                          {isSaved ? '★' : '☆'}
                        </button>
                      </h3>
                      
                      <button 
                        onClick={() => playVoca(idx)}
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPlayingVoca ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                      >
                        <span className="text-sm">{isPlayingVoca ? '🔊' : '▶'}</span>
                      </button>
                    </div>
                    
                    <p className="text-sm font-bold text-indigo-500 mb-2">
                      {voca.meaning}
                    </p>
                    
                    {voca.example && (
                      <div className="bg-gray-50 rounded-lg p-3 w-full border border-gray-100/50">
                        <p className="text-sm text-gray-600 font-medium">
                          {voca.example}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}