import { useState, useEffect } from 'react';

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Android: Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // 3. iOS Check
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setIsIOS(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show custom modal for iOS
      setShowIOSModal(true);
    } else if (deferredPrompt) {
      // Show native prompt for Android
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback for PC or unsupported browsers
      alert("Please select 'Add to Home Screen' from your browser menu.");
    }
  };

  // Don't render the button if the app is already installed
  if (isInstalled) return null;

  return (
    <>
      {/* 📱 Sidebar Button */}
      <button
        onClick={handleInstallClick}
        className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-bold shadow-md hover:scale-[1.02] transition-transform"
      >
        <span className="text-xl">📱</span>
        <span>Install App</span>
      </button>

      {/* 🍎 iOS Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setShowIOSModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowIOSModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl">✕</button>
            <div className="text-center">
              <div className="text-5xl mb-4">🍎</div>
              <h3 className="text-xl font-black mb-2 text-gray-800">How to Install on iOS</h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Due to Apple's policy, iOS apps must be installed manually. Please follow these quick steps:
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-4 mb-6">
                <p className="text-sm text-gray-700 font-medium flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-bold">1</span>
                  <span>Tap the <strong className="text-blue-500">Share [⍐]</strong> button at the bottom of your screen.</span>
                </p>
                <p className="text-sm text-gray-700 font-medium flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-bold">2</span>
                  <span>Scroll down and tap <strong className="border-b-2 border-gray-300">Add to Home Screen [➕]</strong>.</span>
                </p>
                <p className="text-sm text-gray-700 font-medium flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs font-bold">3</span>
                  <span>Tap <strong className="text-blue-500">Add</strong> in the top right corner.</span>
                </p>
              </div>

              <button onClick={() => setShowIOSModal(false)} className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-colors">
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}