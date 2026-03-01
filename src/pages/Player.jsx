import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import courses from '../data/courses.json';

export default function Player() {
  const { epId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'en'; 

  const [epData, setEpData] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('script');

  const [currentIndex, setCurrentIndex] = useState(null);
  const [playingVocaIndex, setPlayingVocaIndex] = useState(null);
  const [isPlayingAll, setIsPlayingAllState] = useState(false);
  
  const audioRef = useRef(null);
  const autoPlayRef = useRef(false);
  const lineRefs = useRef([]);
  const lastPlayedIndexRef = useRef(0); 

  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  // --- 🇰🇷 주변 에피소드 리스트 로직 ---
  const [adjacentEpisodes, setAdjacentEpisodes] = useState([]);
  const [prevEpId, setPrevEpId] = useState(null);
  const [nextEpId, setNextEpId] = useState(null);

  useEffect(() => {
    if (epData && epData.metadata.course) {
      const currentCourse = courses.find(c => c.id === epData.metadata.course);
      if (currentCourse) {
        setCourseData(currentCourse);
        const sortedEps = [...currentCourse.episodes].sort((a, b) => parseInt(a.id) - parseInt(b.id));
        const currentIdx = sortedEps.findIndex(ep => ep.id === epId);
        
        if (currentIdx !== -1) {
          setPrevEpId(currentIdx > 0 ? sortedEps[currentIdx - 1].id : null);
          setNextEpId(currentIdx < sortedEps.length - 1 ? sortedEps[currentIdx + 1].id : null);

          let startIdx = Math.max(0, currentIdx - 2);
          let endIdx = Math.min(sortedEps.length, startIdx + 5);
          if (endIdx - startIdx < 5) {
             startIdx = Math.max(0, endIdx - 5);
          }
          setAdjacentEpisodes(sortedEps.slice(startIdx, endIdx));
        }
      }
    }
  }, [epData, epId]);

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

  const handleNavigate = (targetEpId) => {
    if (targetEpId) {
      navigate(`/player/${targetEpId}`);
      window.scrollTo(0, 0); 
    }
  };

  if (isLoading || !epData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f2f2f7]">
        {isLoading ? (
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5449e9] mb-4"></div>
        ) : (
          <p className="text-xl font-bold text-gray-700">에피소드를 찾을 수 없어요. 😢</p>
        )}
      </div>
    );
  }

  return (
    // 스티치가 지정한 배경색(#f2f2f7) 적용
    <div className="min-h-screen bg-[#f2f2f7] text-gray-900 font-sans flex flex-col">
      
      {/* --- 🌟 상단 스티키 헤더 (Stitch 디자인 완벽 이식) --- */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 md:px-8 pt-4 pb-0 shadow-sm">
        <div className="max-w-3xl mx-auto">
          
          <div className="flex items-center justify-between mb-4">
            <Link to={`/course/${epData.metadata.course}`} className="text-gray-400 font-bold text-sm hover:text-[#5449e9] transition-colors">
              ← Back
            </Link>
            <h1 className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500">Now Playing</h1>
            <div className="w-10"></div> {/* 여백 밸런스용 */}
          </div>

          {/* 재생 정보 카드 */}
          <div className="bg-white rounded-2xl p-2.5 flex items-center gap-3 border border-gray-100 shadow-[0_2px_10px_-1px_rgba(0,0,0,0.05)] mb-4">
            <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl shadow-inner bg-gradient-to-br ${courseData?.theme || 'from-indigo-400 to-purple-500'}`}>
              {courseData?.icon || '🎙️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-bold text-[13px] md:text-sm leading-tight truncate">
                {epData.metadata.title[lang] || epData.metadata.title.en}
              </p>
              <p className="text-[#5449e9] font-medium text-[11px] md:text-xs truncate">
                {courseData?.title[lang] || 'Talkori Course'} • Ep. {epData.metadata.id}
              </p>
            </div>
            <button onClick={togglePlayAll} className="text-[#5449e9] pr-2 hover:scale-110 transition-transform">
              <span className="text-3xl">{isPlayingAll ? '⏸' : '▶'}</span>
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex">
            <button 
              onClick={() => handleTabChange('script')}
              className={`flex-1 text-center pb-3 text-sm font-bold transition-all ${activeTab === 'script' ? 'text-[#5449e9] border-b-[2.5px] border-[#5449e9]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              📝 대본 (Script)
            </button>
            <button 
              onClick={() => handleTabChange('voca')}
              className={`flex-1 text-center pb-3 text-sm font-bold transition-all ${activeTab === 'voca' ? 'text-[#5449e9] border-b-[2.5px] border-[#5449e9]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              📚 단어장 (Vocabulary)
            </button>
          </div>
        </div>
      </header>

      {/* --- 메인 콘텐츠 영역 (pb-40으로 하단 플레이어에 가리지 않게 여백 확보) --- */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-4 pb-40">
        
        {/* 📝 스크립트 탭 */}
        {activeTab === 'script' && (
          <div className="space-y-4">
            {epData.content.map((item, index) => {
              if (item.type === 'FX') return null;
              const isPlaying = currentIndex === index; 
              const cleanSpeakerName = item.speaker.replace(/\s*\(.*?\)\s*/g, '').trim();

              return (
                <div 
                  key={index} 
                  ref={(el) => (lineRefs.current[index] = el)}
                  onClick={() => { setIsPlayingAll(false); playLine(index); }}
                  className={`rounded-[24px] p-6 transition-all duration-300 cursor-pointer border ${isPlaying ? 'bg-[#f0f0ff] border-[#5449e9]/20 shadow-[0_4px_20px_-1px_rgba(84,73,233,0.15)] scale-[1.01]' : 'bg-white border-transparent shadow-[0_4px_20px_-1px_rgba(0,0,0,0.05)] hover:border-gray-100 hover:shadow-md'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className={`font-semibold text-xs uppercase tracking-wider mb-1 ${isPlaying ? 'text-[#5449e9]' : 'text-gray-400'}`}>
                        {cleanSpeakerName}
                      </p>
                      {item.playable ? (
                        <h2 className={`text-xl md:text-2xl font-bold leading-snug tracking-tight ${isPlaying ? 'text-gray-900' : 'text-gray-800'}`}>
                          {item.text}
                        </h2>
                      ) : (
                        <h2 className={`text-lg md:text-xl font-medium leading-snug ${isPlaying ? 'text-gray-800' : 'text-gray-600'}`}>
                          {item.text}
                        </h2>
                      )}
                    </div>
                    {item.playable && (
                      <button className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ml-4 ${isPlaying ? 'bg-[#5449e9]/10 text-[#5449e9]' : 'bg-gray-50 text-gray-300'}`}>
                        <span className="text-lg">{isPlaying ? '🔊' : '▶'}</span>
                      </button>
                    )}
                  </div>
                  
                  {item.translation && (
                    <div className={`rounded-xl p-4 border mt-3 ${isPlaying ? 'bg-white/60 border-[#5449e9]/10' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed">
                        {item.translation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 📚 단어장 탭 (Stitch의 사전 레이아웃 100% 반영) */}
        {activeTab === 'voca' && (
          <div className="space-y-4">
            {!epData.vocabulary || epData.vocabulary.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-medium">등록된 단어가 없습니다.</div>
            ) : (
              epData.vocabulary.map((voca, idx) => {
                const isPlayingVoca = playingVocaIndex === idx;
                return (
                  <div 
                    key={idx} 
                    onClick={() => playVoca(idx)}
                    className={`rounded-[24px] p-6 transition-all duration-300 cursor-pointer border ${isPlayingVoca ? 'bg-[#f0f0ff] border-[#5449e9]/20 shadow-[0_4px_20px_-1px_rgba(84,73,233,0.15)] scale-[1.01]' : 'bg-white border-transparent shadow-[0_4px_20px_-1px_rgba(0,0,0,0.05)] hover:border-gray-100'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-none tracking-tight">
                          {voca.word}
                        </h2>
                        <p className={`font-semibold text-xs mt-2 uppercase tracking-wider ${isPlayingVoca ? 'text-[#5449e9]' : 'text-gray-400'}`}>
                          {voca.meaning}
                        </p>
                      </div>
                      <button className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPlayingVoca ? 'bg-[#5449e9]/10 text-[#5449e9]' : 'bg-gray-50 text-gray-400'}`}>
                        <span className="text-lg">{isPlayingVoca ? '🔊' : '▶'}</span>
                      </button>
                    </div>
                    
                    {voca.example && (
                      <div className={`rounded-xl p-4 border ${isPlayingVoca ? 'bg-white/60 border-[#5449e9]/10' : 'bg-gray-50 border-gray-100'}`}>
                        <p className="text-sm font-medium text-gray-600 leading-relaxed">
                          "{voca.example}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
        
        {/* 🇰🇷 주변 에피소드 리스트 */}
        <div className="mt-8">
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">More Episodes</h3>
          <div className="space-y-2">
            {adjacentEpisodes.map((ep) => {
              const isCurrent = ep.id === epId;
              return (
                <div 
                  key={ep.id} 
                  onClick={() => !isCurrent && handleNavigate(ep.id)}
                  className={`flex items-center gap-4 p-4 rounded-[20px] transition-all ${isCurrent ? 'bg-white shadow-sm border border-gray-100 cursor-default' : 'bg-white/50 border border-transparent hover:bg-white cursor-pointer hover:shadow-sm'}`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-[#5449e9] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                    {isCurrent ? '▶' : ep.id}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm md:text-base font-bold line-clamp-1 ${isCurrent ? 'text-[#5449e9]' : 'text-gray-800'}`}>
                      {ep.title[lang]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* --- 📱 스티치표 블랙 플로팅 플레이어 (전체 화면 공통 하단 고정) --- */}
      <div className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto">
        <div className="bg-gray-900/95 backdrop-blur-lg rounded-2xl px-5 py-4 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-white/10">
          
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-xl bg-gradient-to-br ${courseData?.theme || 'from-indigo-400 to-purple-500'}`}>
              {courseData?.icon || '🎙️'}
            </div>
            <div className="truncate pr-4">
              <p className="text-white text-sm font-bold truncate">
                {epData.metadata.title[lang] || epData.metadata.title.en}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {activeTab === 'script' ? '스크립트 학습 중' : '단어장 학습 중'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => handleNavigate(prevEpId)} disabled={!prevEpId} className="text-gray-400 disabled:opacity-30 hover:text-white transition-colors">
              <span className="text-xl">⏪</span>
            </button>
            <button onClick={togglePlayAll} className="text-white hover:scale-110 transition-transform">
              <span className="text-3xl">{isPlayingAll ? '⏸' : '▶'}</span>
            </button>
            <button onClick={() => handleNavigate(nextEpId)} disabled={!nextEpId} className="text-gray-400 disabled:opacity-30 hover:text-white transition-colors">
              <span className="text-xl">⏩</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}