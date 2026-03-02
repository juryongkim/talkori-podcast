import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toPng } from 'html-to-image'; // ✨ PDF 캡처용
import { jsPDF } from 'jspdf';         // ✨ PDF 생성용

export default function MyStudy() {
  const [savedVoca, setSavedVoca] = useState([]);
  const [savedScript, setSavedScript] = useState([]);
  
  const [activeTab, setActiveTab] = useState('voca');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false); 
  
  // ✨ PDF 다운로드 로딩 상태 관리
  const [isExporting, setIsExporting] = useState(false);

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

  const getUniqueFolders = () => {
    const dates = new Set([
      ...savedVoca.map(v => v.dateSaved || 'old'),
      ...savedScript.map(s => s.dateSaved || 'old')
    ]);
    
    return Array.from(dates).sort((a, b) => {
      if (a === 'old') return 1;
      if (b === 'old') return -1;
      return b.localeCompare(a); 
    });
  };

  const folders = getUniqueFolders();

  const filteredVoca = selectedFolder === 'all' 
    ? savedVoca 
    : savedVoca.filter(v => (v.dateSaved || 'old') === selectedFolder);
    
  const filteredScript = selectedFolder === 'all' 
    ? savedScript 
    : savedScript.filter(s => (s.dateSaved || 'old') === selectedFolder);

const formatDate = (dateStr) => {
    // 1. 'old' 데이터는 깔끔하게 영어로
    if (dateStr === 'old') return 'Previous Records'; 
    
    const [y, m, d] = dateStr.split('-');
    
    // 영어식 달(Month) 이름 배열
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = monthNames[parseInt(m) - 1];
    
    // 2. 자연스러운 미국식 날짜 표기 (예: Mar 2, 2026)
    return `${monthName} ${parseInt(d)}, ${y}`; 
  };

// ==========================================
  // ✨ [완결판] PDF 내보내기 마법의 함수 (oklch 에러 완벽 해결)
  // ==========================================
  const exportToPDF = async () => {
    setIsExporting(true); 
    
    try {
      // 1. UI 렌더링 대기
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = document.getElementById('pdf-print-area'); 
      if (!element) throw new Error("PDF로 변환할 영역을 찾을 수 없습니다.");
      
      // ✨ 2. 최신 엔진(html-to-image)으로 캡처 진행 (최신 CSS 완벽 지원)
      const dataUrl = await toPng(element, { 
        backgroundColor: '#ffffff',
        pixelRatio: 2, // 고화질
        style: {
          margin: '0', // 캡처 시 여백 틀어짐 방지
        }
      });

      // 3. A4 사이즈 PDF 생성
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // 원본 DOM 요소의 비율을 계산
      const elementWidth = element.offsetWidth;
      const elementHeight = element.offsetHeight;
      const imgWidth = pdfWidth;
      const imgHeight = (elementHeight * pdfWidth) / elementWidth;

      let heightLeft = imgHeight;
      let position = 0;

      // 첫 페이지 추가
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // 내용이 길어서 A4 한 장을 넘어가면 자동으로 새 페이지 생성
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // 4. 파일 다운로드 트리거
      const fileName = selectedFolder === 'all' ? 'Talkori_All_Study_Notes.pdf' : `Talkori_Study_${selectedFolder}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error("PDF 생성 중 오류 상세:", error);
      alert(`PDF 저장 실패: ${error.message}`); 
    } finally {
      setIsExporting(false); 
    }
  };
  // ==========================================

  const FolderListContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📅</span>
          <h2 className="text-lg font-extrabold text-gray-900 leading-tight">View by learning date</h2>
        </div>
        <p className="text-sm font-bold text-gray-400"> {savedVoca.length + savedScript.length}bookmarks</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div onClick={() => { setSelectedFolder('all'); setIsFolderMenuOpen(false); }} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedFolder === 'all' ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">📁</span>
            <p className={`text-sm font-bold ${selectedFolder === 'all' ? 'text-indigo-900' : 'text-gray-700'}`}>View all</p>
          </div>
          <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-gray-500 shadow-sm">{savedVoca.length + savedScript.length}</span>
        </div>

        {folders.map(dateKey => {
          const epVocaCount = savedVoca.filter(v => (v.dateSaved || 'old') === dateKey).length;
          const epScriptCount = savedScript.filter(s => (s.dateSaved || 'old') === dateKey).length;
          const totalCount = epVocaCount + epScriptCount;

          return (
            <div key={dateKey} onClick={() => { setSelectedFolder(dateKey); setIsFolderMenuOpen(false); }} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedFolder === dateKey ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">🗓️</span>
                <p className={`text-sm font-bold ${selectedFolder === dateKey ? 'text-indigo-900' : 'text-gray-700'}`}>{formatDate(dateKey)}</p>
              </div>
              <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-gray-500 shadow-sm">{totalCount}</span>
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
            <button onClick={() => setIsFolderMenuOpen(true)} className="lg:hidden absolute right-6 top-6 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
              ☰ 날짜 선택
            </button>

            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                {selectedFolder === 'all' ? '전체 북마크' : formatDate(selectedFolder)}
              </h1>
              
              {/* ✨ PDF 다운로드 버튼 */}
              <button 
                onClick={exportToPDF}
                disabled={isExporting || (filteredVoca.length === 0 && filteredScript.length === 0)}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isExporting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'}`}
              >
                <span className="text-lg">📥</span> 
                {isExporting ? 'Creating PDF...' : 'Export to PDF'}
              </button>
            </div>
            
            <p className="text-gray-500 font-medium text-sm mb-6">
              Focus on reviewing only the words and sentences you saved on the selected date!
            </p>

            <div className="flex border-t border-gray-100 pt-4">
              <button onClick={() => setActiveTab('voca')} className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'voca' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                Vocabulary ({filteredVoca.length})
              </button>
              <button onClick={() => setActiveTab('script')} className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'script' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                Key sentences ({filteredScript.length})
              </button>
            </div>
            
            {/* 모바일용 PDF 다운로드 버튼 (작은 화면용) */}
            <button 
              onClick={exportToPDF}
              disabled={isExporting || (filteredVoca.length === 0 && filteredScript.length === 0)}
              className={`md:hidden mt-4 w-full flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isExporting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
            >
              <span className="text-lg">📥</span> 
              {isExporting ? 'PDF 생성 중...' : '현재 화면 PDF로 저장하기'}
            </button>
          </div>

          {/* ✨ id="pdf-print-area" 이 div 안의 내용이 PDF로 캡처됩니다! */}
          <div id="pdf-print-area" className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8 min-h-[50vh]">
            
            {activeTab === 'voca' && (
              <div className="space-y-4">
                {filteredVoca.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-medium" data-html2canvas-ignore>
                    <span className="text-3xl block mb-3">☆</span>이 날짜에 저장된 단어가 없습니다.
                  </div>
                ) : (
                  filteredVoca.map((voca, idx) => (
                    <div key={idx} className="flex flex-col items-start gap-1 p-4 rounded-xl border bg-white border-gray-100">
                      <div className="flex justify-between items-start w-full mb-1">
                        <div>
                          {selectedFolder === 'all' && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                              {formatDate(voca.dateSaved || 'old')} (EP.{voca.epId})
                            </span>
                          )}
                          <h3 className="text-xl font-extrabold text-gray-900">{voca.word}</h3>
                        </div>
                        {/* data-html2canvas-ignore: 재생/삭제 버튼은 PDF에 인쇄 안 되게 숨김 */}
                        <div className="flex items-center gap-2" data-html2canvas-ignore>
                          <button onClick={() => playAudio(voca.epId, voca.audio)} className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600">▶</button>
                          <button onClick={() => removeVoca(voca.word)} className="text-yellow-400 text-2xl">★</button>
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
                  <div className="text-center py-20 text-gray-400 font-medium" data-html2canvas-ignore>
                    <span className="text-3xl block mb-3">☆</span>이 날짜에 저장된 문장이 없습니다.
                  </div>
                ) : (
                  filteredScript.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-start gap-1 p-4 rounded-xl border bg-white border-gray-100">
                      <div className="flex justify-between items-start w-full mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                          {selectedFolder === 'all' ? `${formatDate(item.dateSaved || 'old')} • ` : ''}EP.{item.epId} • {item.speaker}
                        </span>
                        <div className="flex items-center gap-2" data-html2canvas-ignore>
                          <button onClick={() => playAudio(item.epId, item.audio)} className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600">▶</button>
                          <button onClick={() => removeScript(item.text)} className="text-yellow-400 text-2xl">★</button>
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