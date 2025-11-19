import React, { useState, useRef } from 'react';
import { Camera, Wand2, RefreshCw, Shirt, Sparkles, Upload, Type, ShoppingBag } from 'lucide-react';
import { Header } from './components/Header';
import { Spinner } from './components/Spinner';
import { analyzeOutfit, generateVirtualTryOn, analyzeMatch, generateVirtualTryOnWithItem } from './services/geminiService';
import { TryOnMode } from './types';

const App: React.FC = () => {
  // Main State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Mode State
  const [mode, setMode] = useState<TryOnMode>(TryOnMode.TEXT);
  
  // Analysis State
  const [outfitAnalysis, setOutfitAnalysis] = useState<string | null>(null);
  const [matchAdvice, setMatchAdvice] = useState<string | null>(null);
  
  // Generation State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Inputs
  const [prompt, setPrompt] = useState<string>("");
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  
  // Loading State
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  // Handler for Main Person Image
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        resetState();
        handleAnalyzeOutfit(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler for Garment Item Image
  const handleGarmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGarmentImage(reader.result as string);
        setMatchAdvice(null); // Reset previous match advice
      };
      reader.readAsDataURL(file);
    }
  };

  const resetState = () => {
    setOutfitAnalysis(null);
    setMatchAdvice(null);
    setGeneratedImage(null);
    setGarmentImage(null);
    setPrompt("");
  };

  const handleAnalyzeOutfit = async (image: string) => {
    setLoading(true);
    setLoadingMessage("正在分析您的穿搭風格...");
    try {
      const result = await analyzeOutfit(image);
      setOutfitAnalysis(result);
    } catch (error) {
      alert("分析失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;
    
    setLoading(true);
    setGeneratedImage(null);
    setMatchAdvice(null);

    try {
      if (mode === TryOnMode.TEXT) {
        if (!prompt) return;
        setLoadingMessage("正在根據描述合成造型...");
        const resultImage = await generateVirtualTryOn(selectedImage, prompt);
        setGeneratedImage(resultImage);
      } else {
        if (!garmentImage) return;
        
        // Step 1: Analyze Match
        setLoadingMessage("正在分析單品搭配性...");
        const advice = await analyzeMatch(selectedImage, garmentImage);
        setMatchAdvice(advice);

        // Step 2: Generate Image
        setLoadingMessage("正在為您試穿這件單品...");
        const resultImage = await generateVirtualTryOnWithItem(selectedImage, garmentImage);
        setGeneratedImage(resultImage);
      }
    } catch (error) {
      console.error(error);
      alert("處理失敗，請嘗試不同的圖片或描述");
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerGarmentInput = () => garmentInputRef.current?.click();

  return (
    <div className="min-h-screen flex flex-col bg-brand-black font-sans text-gray-200">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        
        {/* Hero / Upload Section */}
        {!selectedImage && (
          <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-brand-gray rounded-xl bg-brand-gray/20 hover:bg-brand-gray/30 transition-all cursor-pointer group" onClick={triggerFileInput}>
            <div className="text-brand-gold mb-4 p-4 bg-brand-black rounded-full group-hover:scale-110 transition-transform">
              <Camera size={48} />
            </div>
            <h2 className="text-2xl font-serif mb-2 text-white">上傳您的全身照</h2>
            <p className="text-gray-400">開始您的 AI 時尚改造之旅</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        )}

        {/* Main Workflow */}
        {selectedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Original Image & Analysis */}
            <div className="lg:col-span-5 space-y-6">
              {/* Image Display */}
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-brand-gray group">
                <img src={selectedImage} alt="Original" className="w-full h-auto object-cover" />
                <button 
                  onClick={() => { setSelectedImage(null); resetState(); }}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                  title="重新上傳"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              {/* Initial Outfit Analysis Results */}
              <div className="bg-brand-gray/20 p-6 rounded-xl border border-brand-gray/50">
                <h3 className="text-xl font-serif text-brand-gold mb-4 flex items-center gap-2">
                  <Sparkles size={20} />
                  整體風格分析
                </h3>
                {loading && !outfitAnalysis ? (
                  <div className="text-center py-8">
                    <Spinner />
                    <p className="text-sm text-gray-400 mt-2">{loadingMessage}</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-gray-300">
                    {outfitAnalysis}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Virtual Try-On & Matching */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-brand-gray/10 p-6 rounded-xl border border-brand-gray/50 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-serif text-brand-gold flex items-center gap-2">
                    <Shirt size={20} />
                    虛擬穿搭實驗室
                  </h3>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-brand-black/50 rounded-lg mb-6 border border-brand-gray/30">
                  <button
                    onClick={() => setMode(TryOnMode.TEXT)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      mode === TryOnMode.TEXT 
                        ? 'bg-brand-gray text-brand-gold shadow-sm' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Type size={16} /> 文字描述生成
                  </button>
                  <button
                    onClick={() => setMode(TryOnMode.ITEM)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      mode === TryOnMode.ITEM
                        ? 'bg-brand-gray text-brand-gold shadow-sm' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <ShoppingBag size={16} /> 單品搭配合成
                  </button>
                </div>

                {/* Controls based on Mode */}
                <div className="mb-6">
                  {mode === TryOnMode.TEXT ? (
                    <div className="animate-fade-in">
                      <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">
                        描述您想嘗試的風格
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="例如：換成白色絲質襯衫，搭配黑色寬褲..."
                          className="flex-grow bg-brand-black border border-brand-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
                          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {['日系極簡風格', '復古丹寧外套', '正式晚宴禮服', 'Cyberpunk 街頭風'].map(tag => (
                          <button 
                            key={tag}
                            onClick={() => setPrompt(tag)}
                            className="text-xs border border-gray-700 px-2 py-1 rounded-full hover:border-brand-gold hover:text-brand-gold transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-start">
                      <div 
                        onClick={triggerGarmentInput}
                        className="border-2 border-dashed border-brand-gray rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-gray/10 transition-colors relative overflow-hidden"
                      >
                        {garmentImage ? (
                          <>
                            <img src={garmentImage} alt="Garment" className="w-full h-full object-contain p-2" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                               <p className="text-white text-xs font-bold">更換圖片</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">點擊上傳單品 (衣/褲/裙)</p>
                          </>
                        )}
                        <input 
                          type="file" 
                          ref={garmentInputRef} 
                          onChange={handleGarmentChange} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                      
                      <div className="text-sm text-gray-400 space-y-2 pt-1">
                        <p className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-gold rounded-full"></span> 上傳您想嘗試的衣服</p>
                        <p className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-gold rounded-full"></span> AI 將分析搭配性</p>
                        <p className="flex items-center gap-2"><span className="w-1 h-1 bg-brand-gold rounded-full"></span> 自動合成試穿效果</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={loading || (mode === TryOnMode.TEXT ? !prompt : !garmentImage)}
                    className={`w-full mt-4 py-3 rounded-lg font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${
                      loading || (mode === TryOnMode.TEXT ? !prompt : !garmentImage)
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : 'bg-brand-gold text-black hover:bg-amber-300 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                    }`}
                  >
                    {loading ? <Spinner /> : <Wand2 size={18} />}
                    {mode === TryOnMode.TEXT ? '生成造型' : '分析搭配並試穿'}
                  </button>
                </div>

                {/* Match Advice (Specific to Item Mode) */}
                {matchAdvice && (
                   <div className="mb-4 bg-brand-black/40 border-l-2 border-brand-gold p-4 rounded-r-lg animate-fade-in">
                      <h4 className="text-brand-gold font-bold text-sm mb-2 flex items-center gap-2">
                        <Sparkles size={14} /> 單品搭配建議
                      </h4>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {matchAdvice}
                      </p>
                   </div>
                )}

                {/* Result Area */}
                <div className="flex-grow bg-black/40 rounded-lg border border-dashed border-brand-gray/50 flex flex-col items-center justify-center overflow-hidden min-h-[400px] relative">
                   {loading && generatedImage === null ? (
                     <div className="text-center p-8">
                       <Spinner />
                       <p className="text-brand-gold animate-pulse mt-4 text-lg font-serif">{loadingMessage}</p>
                       <p className="text-gray-500 text-sm mt-2">正在調用 Gemini 影像生成模型...</p>
                     </div>
                   ) : generatedImage ? (
                     <div className="relative w-full h-full flex items-center justify-center bg-black animate-fade-in">
                        <img src={generatedImage} alt="Generated Try-On" className="max-h-[500px] max-w-full object-contain shadow-2xl" />
                        <div className="absolute bottom-4 right-4">
                          <a 
                            href={generatedImage} 
                            download="vogue-ai-look.png"
                            className="bg-brand-gold text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-white transition-colors shadow-lg flex items-center gap-2"
                          >
                            <Upload size={14} className="rotate-180" /> 下載圖片
                          </a>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center p-8 opacity-50">
                       <Shirt className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                       <p className="text-gray-400">
                         {mode === TryOnMode.TEXT 
                           ? "輸入描述並點擊生成\n預覽將在此處顯示" 
                           : "上傳單品並點擊試穿\n預覽將在此處顯示"}
                       </p>
                     </div>
                   )}
                </div>

              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 border-t border-brand-gray mt-auto bg-brand-black">
         <div className="container mx-auto px-4 text-center">
           <p className="text-gray-600 text-sm">Powered by Google Gemini 2.5 Flash & Imagen</p>
         </div>
      </footer>
    </div>
  );
};

export default App;