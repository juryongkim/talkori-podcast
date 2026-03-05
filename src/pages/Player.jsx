import { useState, useRef, useEffect } from 'react';
// ✨ useSearchParams 는 이제 안 쓰니까 뺐습니다!
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import courses from '../data/courses.json'; 

export default function Player() {
  const { epId } = useParams();
  const navigate = useNavigate();
  
  // ==========================================
  // ✨ [핵심 수정] 주소창 대신 메모리(세션)에서 데모 모드를 확인합니다!
  const isDemoMode = sessionStorage.getItem('talkori_demo_mode') === 'true';
  // ==========================================

  const { i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'en'; 
  
  const [epData, setEpData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('script');
  const [playingVocaIndex, setPlayingVocaIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlayingAll, setIsPlayingAllState] = useState(false);

  // ✨ 4. 배속 설정 (1.0 -> 0.8 -> 0.6)
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // ✨ 프리미엄 모달 팝업 상태 (추가됨)
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const audioRef = useRef(null);
  const autoPlayRef = useRef(false);
  const lineRefs = useRef([]);
  const lastPlayedIndexRef = useRef(0); 
  
  // ✨ [추가] 자동 스크롤을 위한 현재 에피소드 위치 기억 장치!
  const activeEpRef = useRef(null);

  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  // ==========================================
  // [로컬 스토리지 북마크 로직]
  // ==========================================
  const [savedVoca, setSavedVoca] = useState(() => {
    const saved = localStorage.getItem('talkori_saved_voca');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedScript, setSavedScript] = useState(() => {
    const saved = localStorage.getItem('talkori_saved_script');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('talkori_saved_voca', JSON.stringify(savedVoca));
  }, [savedVoca]);

  useEffect(() => {
    localStorage.setItem('talkori_saved_script', JSON.stringify(savedScript));
  }, [savedScript]);

  const getTodayDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const dateOffset = new Date(now.getTime() - offset);
    return dateOffset.toISOString().split('T')[0];
  };

  const toggleVocaBookmark = (voca, e) => {
    e.stopPropagation();
    const isSaved = savedVoca.some(v => v.word === voca.word);
    if (isSaved) {
      setSavedVoca(savedVoca.filter(v => v.word !== voca.word));
    } else {
      setSavedVoca([...savedVoca, { ...voca, epId, dateSaved: getTodayDate() }]); 
    }
  };

  const toggleScriptBookmark = (item, e) => {
    e.stopPropagation();
    const isSaved = savedScript.some(s => s.text === item.text);
    if (isSaved) {
      setSavedScript(savedScript.filter(s => s.text !== item.text));
    } else {
      setSavedScript([...savedScript, { ...item, epId, dateSaved: getTodayDate() }]); 
    }
  };

  // ==========================================
  // ✨ 3. 나가기 버튼 함수 (아이프레임 밖으로 메시지 전송)
  // ==========================================
  const handleExit = () => {
    window.parent.postMessage('closeTalkori', '*');
    if (window.self === window.top) {
      navigate('/');
    }
  };

  // ==========================================
  // ✨ 4. 배속 변경 함수 (1.0 -> 0.8 -> 0.6)
  // ==========================================
  const cyclePlaybackRate = () => {
    const rates = [1.0, 0.8, 0.6];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

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
    setIsPlaylistOpen(false); 

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

  // ✨ [추가] 목록창(사이드바/모바일 팝업)이 열리거나 화수가 바뀔 때, 내 위치로 스크롤!
  useEffect(() => {
    if (activeEpRef.current) {
      setTimeout(() => {
        activeEpRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [epId, isPlaylistOpen]);

  const handleTabChange = (tab) => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAll(false);
    setCurrentIndex(null);
    setPlayingVocaIndex(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    audio.playbackRate = playbackRate;

    // ✨ 잠금 화면 백그라운드 재생 제어
    if ('mediaSession' in navigator) {
      const cleanSpeaker = item.speaker.replace(/\s*\(.*?\)\s*/g, '').trim();
      navigator.mediaSession.metadata = new MediaMetadata({
        title: item.text, 
        artist: `Talkori EP.${epId} - ${cleanSpeaker}`,
        album: 'Real Reaction',
      });
    }

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
      lineRefs.current[index].scrollIntoView({ behavior: "smooth", block: "center" });
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

    audio.playbackRate = playbackRate;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: item.word,
        artist: item.meaning,
        album: `Talkori EP.${epId} Vocabulary`,
      });
    }

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

  const currentCourse = epData ? courses.find(c => c.id === epData.metadata.course) : null;
  const playlistEps = currentCourse ? [...currentCourse.episodes].sort((a,b) => parseInt(a.id) - parseInt(b.id)) : [];

  // ✨ [추가] 이전/다음 화 버튼을 위한 인덱스 계산
  const currentEpIndex = playlistEps.findIndex(e => e.id === epId);
  const prevEp = currentEpIndex > 0 ? playlistEps[currentEpIndex - 1] : null;
  const nextEp = currentEpIndex >= 0 && currentEpIndex < playlistEps.length - 1 ? playlistEps[currentEpIndex + 1] : null;


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
      </div>
    );
  }

  if (!epData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-50">
        <p className="text-xl font-bold text-gray-700 mb-4">Oops! I can't find the episode. 😢</p>
        <Link to="/course/real-reaction" className="text-indigo-600 hover:underline">Back to list</Link>
      </div>
    );
  }

  const displayTitle = typeof epData.metadata.title === 'object' ? (epData.metadata.title[lang] || epData.metadata.title.en) : epData.metadata.title;

  const PlaylistContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-5 border-b border-gray-100 shrink-0 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{currentCourse?.icon || '🎙️'}</span>
            <h2 className="text-lg font-extrabold text-gray-900 leading-tight">
              {currentCourse?.title[lang] || 'Talkori Course'}
            </h2>
          </div>
          <p className="text-sm font-bold text-gray-400">{playlistEps.length} Episodes</p>
        </div>
        
        {/* ✨ 3. 나가기 버튼 (아이프레임 연동용) */}
        <button onClick={handleExit} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-xl transition-colors" title="학습 종료">
          ✕ EXIT
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {playlistEps.map((ep, index) => {
          const isCurrent = ep.id === epId;
          const isLocked = isDemoMode && index >= 3; 

          return (
            <div 
              key={ep.id} 
              // ✨ [핵심] 현재 에피소드일 경우 위치를 기억하도록 나침반(ref)을 달아줍니다!
              ref={isCurrent ? activeEpRef : null}
              onClick={() => { 
                if (isLocked) {
                  setShowPremiumModal(true);
                  return;
                }
                if (!isCurrent) navigate(`/player/${ep.id}`); 
              }} 
              className={`flex flex-col p-3 rounded-xl cursor-pointer transition-all ${isCurrent ? 'bg-indigo-50 border border-indigo-100' : isLocked ? 'opacity-50 hover:bg-gray-50' : 'hover:bg-gray-50 border border-transparent'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}`}>
                  EPISODE {ep.id} {isLocked && '🔒'}
                </span>
                {isCurrent && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded animate-pulse">PLAYING</span>}
              </div>
              <p className={`text-sm font-bold line-clamp-2 leading-snug ${isCurrent ? 'text-indigo-900' : 'text-gray-700'}`}>{ep.title[lang]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      
      <aside className="hidden lg:flex flex-col w-[320px] xl:w-[380px] bg-white border-r border-gray-200 h-screen sticky top-0 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <PlaylistContent />
      </aside>

      {isPlaylistOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsPlaylistOpen(false)}></div>
          <div className="relative w-4/5 max-w-sm bg-white h-full ml-auto shadow-2xl flex flex-col transform transition-transform animate-slide-in-right">
            <button onClick={() => setIsPlaylistOpen(false)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">✕</button>
            <PlaylistContent />
          </div>
        </div>
      )}

      <main className="flex-1 w-full relative">
        <div className="max-w-4xl mx-auto md:px-4 py-0 md:py-8 pb-32">
          
          <div className="bg-white pt-2 pb-0 px-2 md:p-6 rounded-b-2xl md:rounded-3xl shadow-sm border-b md:border border-gray-200 mb-4 md:mb-6 sticky top-0 md:top-4 z-20 transition-all">
            
            <div className="hidden md:block text-center relative">
              <button onClick={handleExit} className="text-gray-400 absolute left-2 top-2 hover:text-red-500 text-sm font-bold flex items-center gap-1 transition-colors">
                ✕ EXIT
              </button>
              
              <button onClick={cyclePlaybackRate} className="absolute right-2 top-1 text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                Speed: {playbackRate}x
              </button>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">EPISODE {epId}</p>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 mb-1 line-clamp-2 px-16">
                {displayTitle}
              </h1>
              <div className="flex flex-col items-center gap-3 mb-6">
                <p className="text-indigo-600 font-medium text-sm">Real Reaction</p>
                {epData.metadata.youtube && (
                  <a 
                    href={epData.metadata.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full transition-colors shadow-sm"
                  >
                    <span className="text-base">▶️</span> Watch Video Version
                  </a>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-8 mb-4">
                <button className="text-gray-400 hover:text-gray-600 font-bold text-xl">⏪</button>
                <button onClick={togglePlayAll} className={`${isPlayingAll ? 'bg-indigo-600' : 'bg-gray-900'} text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-md text-xl`}>
                  {isPlayingAll ? '⏸' : '▶'}
                </button>
                <button className="text-gray-400 hover:text-gray-600 font-bold text-xl">⏩</button>
              </div>
            </div>

            <div className="md:hidden flex flex-col gap-2 pt-1 pb-1">
              <div className="flex items-center justify-between w-full">
                <button onClick={handleExit} className="text-gray-500 p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                
                <div className="flex-1 flex flex-col items-center mx-2 overflow-hidden">
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">EPISODE {epId}</p>
                  <h1 className="text-sm font-extrabold text-gray-900 truncate w-full text-center">
                    {displayTitle}
                  </h1>
                </div>

                <button onClick={() => setIsPlaylistOpen(true)} className="text-indigo-600 bg-indigo-50 p-1.5 px-2.5 rounded-md text-xs font-bold">
                  ☰
                </button>
              </div>

              <div className="flex items-center justify-between px-3 mt-1">
                <button onClick={cyclePlaybackRate} className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-1.5 rounded-md w-12 text-center shadow-sm">
                  {playbackRate}x
                </button>
                
                <div className="flex items-center gap-6">
                  <button className="text-gray-400 text-sm">⏪</button>
                  <button onClick={togglePlayAll} className={`${isPlayingAll ? 'bg-indigo-600' : 'bg-gray-900'} text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md`}>
                    <span className="text-sm">{isPlayingAll ? '⏸' : '▶'}</span>
                  </button>
                  <button className="text-gray-400 text-sm">⏩</button>
                </div>
                
                <div className="w-12"></div>
              </div>
            </div>

            <div className="flex border-t border-gray-100 pt-3 mt-2 md:mt-2 md:pt-4 mx-2 md:mx-0">
              <button onClick={() => handleTabChange('script')} className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'script' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                📝 대본 (Script)
              </button>
              <button onClick={() => handleTabChange('voca')} className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'voca' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                📚 단어장 (Vocabulary)
              </button>
            </div>
          </div>

          <div className="bg-white md:rounded-3xl shadow-sm border-y md:border border-gray-200 p-4 md:p-8">
            <h2 className="hidden md:block text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
              {activeTab === 'script' ? 'Interactive Script' : 'Vocabulary List'}
            </h2>
            
            {activeTab === 'script' && (
              <div className="space-y-6">
                {epData.content.map((item, index) => {
                  if (item.type === 'FX') return null;
                  
                  const cleanSpeakerName = item.speaker.replace(/\s*\(.*?\)\s*/g, '').trim();
                  
                  const isMina = cleanSpeakerName.toUpperCase().includes('MINA');
                  const isPlaying = currentIndex === index; 
                  const isSaved = savedScript.some(s => s.text === item.text);

                  return (
                    <div key={index} ref={(el) => (lineRefs.current[index] = el)} className={`relative flex flex-col items-start gap-1 p-2 -mx-2 rounded-xl transition-all duration-300 ${isPlaying ? 'bg-indigo-50/50 border-l-4 border-indigo-400 pl-4' : 'border-l-4 border-transparent pl-4 hover:bg-gray-50/50'}`}>
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-xs font-bold uppercase ${isMina ? 'text-indigo-500' : 'text-gray-400'}`}>
                          {cleanSpeakerName} 
                        </span>
                        {item.playable && (
                          <button onClick={(e) => toggleScriptBookmark(item, e)} className={`text-xl transition-transform hover:scale-110 ${isSaved ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
                            {isSaved ? '★' : '☆'}
                          </button>
                        )}
                      </div>

                      {item.playable ? (
                        <p onClick={() => handleLineClick(index)} className={`text-xl font-bold cursor-pointer rounded-lg transition-colors flex items-center gap-2 group pr-8 whitespace-pre-wrap ${isPlaying ? 'text-indigo-600' : 'text-gray-900 hover:text-indigo-500'}`}>
                          {item.text} <span className={`text-sm transition-colors ${isPlaying ? 'text-indigo-600 animate-pulse' : 'text-gray-300 group-hover:text-indigo-400'}`}>{isPlaying ? '🔊' : '▶'}</span>
                        </p>
                      ) : (
                        <p onClick={() => handleLineClick(index)} className={`text-lg px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer pr-8 whitespace-pre-wrap ${isPlaying ? 'text-indigo-600 font-bold' : 'text-gray-800 hover:text-gray-600'}`}>
                          {item.text}
                        </p>
                      )}

                      {item.translation && <p className="text-sm text-gray-500 font-medium mb-1 pl-2 border-l-2 border-gray-200 whitespace-pre-wrap">{item.translation}</p>}
                      {item.insight && (
                        <div className="mt-2 bg-white/80 border border-indigo-100 p-3 rounded-lg w-full shadow-sm">
                          <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-1">💡 {item.insight.title}</h4>
                          <p className="text-indigo-800/80 text-sm mt-1 leading-relaxed">{item.insight.description}</p>
                          {item.insight.usage_tip && <p className="text-indigo-600/70 text-xs mt-2 font-medium bg-indigo-50 inline-block px-2 py-1 rounded">Tip: {item.insight.usage_tip}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'voca' && (
              <div className="space-y-4">
                {!epData.vocabulary || epData.vocabulary.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-medium">등록된 단어가 없습니다.</div>
                ) : (
                  epData.vocabulary.map((voca, idx) => {
                    const isPlayingVoca = playingVocaIndex === idx;
                    const isSaved = savedVoca.some(v => v.word === voca.word);

                    return (
                      <div key={idx} className={`flex flex-col items-start gap-1 p-4 rounded-xl transition-all duration-300 border ${isPlayingVoca ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-100'}`}>
                        <div className="flex justify-between items-start w-full mb-1">
                          <h3 className={`text-xl font-extrabold flex items-center gap-2 ${isPlayingVoca ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {voca.word}
                            <button onClick={(e) => toggleVocaBookmark(voca, e)} className={`text-xl transition-transform hover:scale-110 mb-1 ${isSaved ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
                              {isSaved ? '★' : '☆'}
                            </button>
                          </h3>
                          <button onClick={() => playVoca(idx)} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPlayingVoca ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                            <span className="text-sm">{isPlayingVoca ? '🔊' : '▶'}</span>
                          </button>
                        </div>
                        <p className="text-sm font-bold text-indigo-500 mb-2">{voca.meaning}</p>
                        {voca.example && <div className="bg-gray-50 rounded-lg p-3 w-full border border-gray-100/50"><p className="text-sm text-gray-600 font-medium">{voca.example}</p></div>}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* 🚀 [핵심 추가] 하단 네비게이션 (이전 / 목록 / 다음) */}
            {/* ==================================================== */}
            <div className="mt-16 pt-6 border-t border-gray-100 flex items-center justify-between gap-3 md:gap-4">
              
              {/* ⬅️ 이전 화 버튼 */}
              {prevEp ? (
                <Link 
                  to={`/player/${prevEp.id}`} 
                  className="flex-1 py-4 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-colors shadow-sm"
                >
                  ← Prev
                </Link>
              ) : (
                <div className="flex-1 opacity-50 cursor-not-allowed py-4 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center font-extrabold text-sm">
                  ← Prev
                </div>
              )}

              {/* ☰ 목록 버튼 (주로 모바일 환경을 위해 노출) */}
              <button
                onClick={() => setIsPlaylistOpen(true)}
                className="lg:hidden flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center font-extrabold text-sm transition-colors shadow-md gap-2"
              >
                ☰ {lang === 'ko' ? '목록보기' : 'Playlist'}
              </button>

              {/* ➡️ 다음 화 버튼 (데모 락 팝업 완벽 연동!) */}
              {nextEp ? (
                <button
                  onClick={(e) => {
                    const nextIndex = playlistEps.findIndex(ep => ep.id === nextEp.id);
                    const isNextLocked = isDemoMode && nextIndex >= 3;
                    
                    if (isNextLocked) {
                      e.preventDefault();
                      setShowPremiumModal(true); // 자물쇠 팝업 띄우기!
                    } else {
                      navigate(`/player/${nextEp.id}`);
                    }
                  }}
                  className="flex-1 py-4 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded-2xl flex items-center justify-center font-extrabold text-sm transition-colors shadow-sm"
                >
                  Next →
                </button>
              ) : (
                <div className="flex-1 opacity-50 cursor-not-allowed py-4 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center font-extrabold text-sm">
                  Next →
                </div>
              )}
            </div>
            {/* ==================================================== */}

          </div>
        </div>
      </main>

      {/* ==================================================== */}
      {/* ✨ 프리미엄 모달 팝업 UI */}
      {/* ==================================================== */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[24px] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">Premium Content</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              This lesson is for premium members only.<br/>
              Upgrade now to get <strong className="text-gray-700">unlimited access to</strong><br/>
              all classes and the wordbook!
            </p>
            <button
              onClick={() => {
                window.parent.postMessage('openUpgradePage', '*');
              }}
              className="w-full bg-[#3b32f5] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors mb-4 shadow-md text-[15px]"
            >
              Upgrade Now 🚀
            </button>
            <button
              onClick={() => setShowPremiumModal(false)}
              className="text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
      {/* ==================================================== */}

    </div>
  );
}