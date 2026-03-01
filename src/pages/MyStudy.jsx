import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function MyStudy() {
  const [savedVoca, setSavedVoca] = useState([]);
  const [savedScript, setSavedScript] = useState([]);
  
  const [activeTab, setActiveTab] = useState('voca');
  const [selectedFolder, setSelectedFolder] = useState('all'); // 'all' 또는 특정 날짜("YYYY-MM-DD")
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false); 
  
  const audioRef = useRef(null);
  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  useEffect(() => {
    const voca = JSON.parse(localStorage.getItem('talkori_saved_voca')) || [];
    const script = JSON.parse(localStorage.getItem('talkori_saved_script')) || [];
    setSavedVoca(voca);
    setSavedScript(script);

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const removeVoca = (wordToRemove) => {
    const updated = savedVoca.filter(v => v.word !== wordToRemove);
    setSavedVoca(updated);
    localStorage.setItem('talkori_saved_voca', JSON.stringify(updated));
  };

  const removeScript = (textToRemove) => {
    const updated = savedScript.filter(s => s.text !== textToRemove);
    setSavedScript(updated);
    localStorage.setItem('talkori_saved_script', JSON.stringify(updated));
  };

  const playAudio = (epId, audioFile) => {
    if (audioRef.current) audioRef.current.pause();
    if (!audioFile) return;
    
    const audioUrl = `${CDN_BASE_URL}/ep${epId}/${audioFile}`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play().catch(e => console.error("재생 에러:", e));
  };

  // ✨ 에피소드가 아닌 '날짜(dateSaved)' 기준으로 고유 폴더 추출 후 "최신순(내림차순)" 정렬
  const getUniqueFolders = () => {
    const dates = new Set([
      ...savedVoca.map(v => v.dateSaved || 'old'),
      ...savedScript.map(s => s.dateSaved || 'old')
    ]);
    
    return Array.from(dates).sort((a, b) => {
      // '이전 기록'은 항상 맨 뒤로
      if (a === 'old') return 1;
      if (b === 'old') return -1;
      // 날짜 문자열(YYYY-MM-DD) 내림차순 정렬
      return b.localeCompare(a); 
    });
  };

  const folders = getUniqueFolders();

  // ✨ 선택된 날짜 폴더에 맞게 데이터 필터링
  const filteredVoca = selectedFolder === 'all' 
    ? savedVoca 
    : savedVoca.filter(v => (v.dateSaved || 'old') === selectedFolder);
    
  const filteredScript = selectedFolder === 'all' 
    ? savedScript 
    : savedScript.filter(s => (s.dateSaved || 'old') === selectedFolder);

  // ✨ 날짜 포맷 예쁘게 바꾸기 (예: "2026-03-02" -> "2026년 3월 2일")
  const formatDate = (dateStr) => {
    if (dateStr === 'old') return '이전 저장 기록';
    const [y, m, d] = dateStr.split('-');
    return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
  };

  const FolderListContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📅</span>
          <h2 className="text-lg font-extrabold text-gray-900 leading-tight">
            학습 날짜별 보기
          </h2>
        </div>
        <p className="text-sm font-bold text-gray-400">총 {savedVoca.length + savedScript.length}개의 북마크</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div 
          onClick={() => { setSelectedFolder('all'); setIsFolderMenuOpen(false); }}
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedFolder === 'all' ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📁</span>
            <p className={`text-sm font-bold ${selectedFolder === 'all' ? 'text-indigo-900' : 'text-gray-700'}`}>
              전체 모아보기
            </p>
          </div>
          <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-gray-500 shadow-sm">
            {savedVoca.length + savedScript.length}
          </span>
        </div>

        {/* 날짜 폴더 렌더링 */}
        {folders.map(dateKey => {
          const epVocaCount = savedVoca.filter(v => (v.dateSaved || 'old') === dateKey).length;
          const epScriptCount = savedScript.filter(s => (s.dateSaved || 'old') === dateKey).length;
          const totalCount = epVocaCount + epScriptCount;

          return (
            <div 
              key={dateKey}
              onClick={() => { setSelectedFolder(dateKey); setIsFolderMenuOpen(false); }}
              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedFolder === dateKey ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🗓️</span>
                <p className={`text-sm font-bold ${selectedFolder === dateKey ? 'text-indigo-900' : 'text-gray-700'}`}>
                  {formatDate(dateKey)}
                </p>
              </div>
              <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-gray-500 shadow-sm">
                {totalCount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      
      <aside className="hidden lg:flex flex-col w-[320px] xl:w-[380px] bg-white border-r border-gray-200 h-screen sticky top-0 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <FolderListContent />
      </aside>

      {isFolderMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsFolderMenuOpen(false)}></div>
          <div className="relative w-4/5 max-w-sm bg-white h-full ml-auto shadow-2xl flex flex-col transform transition-transform animate-slide-in-right">
            <button onClick={() => setIsFolderMenuOpen(false)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">✕</button>
            <FolderListContent />
          </div>
        </div>
      )}

      <main className="flex-1 w-full relative">
        <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 pb-32">
          
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 mb-6 sticky top-4 z-20 transition-all">
            <button 
              onClick={() => setIsFolderMenuOpen(true)}
              className="lg:hidden absolute right-6 top-6 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              ☰ 날짜 선택
            </button>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
              {selectedFolder === 'all' ? '전체 북마크' : formatDate(selectedFolder)}
            </h1>
            <p className="text-gray-500 font-medium text-sm mb-6">
              선택한 날짜에 저장한 단어와 문장만 집중 복습하세요!
            </p>

            <div className="flex border-t border-gray-100 pt-4">
              <button 
                onClick={() => setActiveTab('voca')}
                className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'voca' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                단어장 ({filteredVoca.length})
              </button>
              <button 
                onClick={() => setActiveTab('script')}
                className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'script' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                주요 문장 ({filteredScript.length})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8 min-h-[50vh]">
            
            {activeTab === 'voca' && (
              <div className="space-y-4">
                {filteredVoca.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-medium">
                    <span className="text-3xl block mb-3">☆</span>
                    이 날짜에 저장된 단어가 없습니다.
                  </div>
                ) : (
                  filteredVoca.map((voca, idx) => (
                    <div key={idx} className="flex flex-col items-start gap-1 p-4 rounded-xl transition-all duration-300 border bg-white border-gray-100 hover:border-indigo-100">
                      <div className="flex justify-between items-start w-full mb-1">
                        <div>
                          {selectedFolder === 'all' && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                              {formatDate(voca.dateSaved || 'old')} (EP.{voca.epId})
                            </span>
                          )}
                          <h3 className="text-xl font-extrabold text-gray-900">{voca.word}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => playAudio(voca.epId, voca.audio)} className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">▶</button>
                          <button onClick={() => removeVoca(voca.word)} className="text-yellow-400 hover:scale-110 text-2xl transition-transform" title="저장 취소">★</button>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-indigo-500 mb-2">{voca.meaning}</p>
                      {voca.example && (
                        <div className="bg-gray-50 rounded-lg p-3 w-full border border-gray-100/50">
                          <p className="text-sm text-gray-600 font-medium">{voca.example}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'script' && (
              <div className="space-y-4">
                {filteredScript.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-medium">
                    <span className="text-3xl block mb-3">☆</span>
                    이 날짜에 저장된 문장이 없습니다.
                  </div>
                ) : (
                  filteredScript.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-start gap-1 p-4 rounded-xl transition-all duration-300 border bg-white border-gray-100 hover:border-indigo-100">
                      <div className="flex justify-between items-start w-full mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                          {selectedFolder === 'all' ? `${formatDate(item.dateSaved || 'old')} • ` : ''}EP.{item.epId} • {item.speaker}
                        </span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => playAudio(item.epId, item.audio)} className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">▶</button>
                          <button onClick={() => removeScript(item.text)} className="text-yellow-400 hover:scale-110 text-2xl transition-transform" title="저장 취소">★</button>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900 leading-snug mb-1">{item.text}</p>
                      {item.translation && (
                        <p className="text-sm text-gray-500 font-medium pl-2 border-l-2 border-gray-200">
                          {item.translation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}