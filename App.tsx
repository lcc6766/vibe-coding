
import React, { useState, useRef } from 'react';
import { Camera, Wand2, RefreshCw, Shirt, Sparkles, Upload, Type, ShoppingBag, User, ArrowRight, CheckCircle2, Trophy, Star, Zap } from 'lucide-react';
import { Header } from './components/Header';
import { Spinner } from './components/Spinner';
import { 
  analyzeOutfit, 
  generateVirtualTryOn, 
  analyzeMatch, 
  generateVirtualTryOnWithItem,
  analyzeGarment,
  generateModelTryOn,
  analyzePersonalizedStyle
} from './services/geminiService';
import { TryOnMode, Workflow, Gender, StyleRecommendation, OutfitAnalysis, PersonalizedStyleAnalysis } from './types';

const App: React.FC = () => {
  // Workflow State
  const [workflow, setWorkflow] = useState<Workflow>(Workflow.PERSON);

  // Main Person State (Workflow.PERSON)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<TryOnMode>(TryOnMode.TEXT);
  const [outfitAnalysis, setOutfitAnalysis] = useState<OutfitAnalysis | null>(null);
  const [matchAdvice, setMatchAdvice] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [garmentImage, setGarmentImage] = useState<string | null>(null);

  // Item Workflow State (Workflow.ITEM)
  const [targetGender, setTargetGender] = useState<Gender>('female');
  const [styleOptions, setStyleOptions] = useState<StyleRecommendation[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleRecommendation | null>(null);
  const [modelGeneratedImage, setModelGeneratedImage] = useState<string | null>(null);
  
  // Advisor Workflow State (Workflow.ADVISOR)
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [fitnessLevel, setFitnessLevel] = useState<string>("一般體型");
  const [targetStyle, setTargetStyle] = useState<string>("");
  const [personalizedAnalysis, setPersonalizedAnalysis] = useState<PersonalizedStyleAnalysis | null>(null);
  const [advisorGeneratedImage, setAdvisorGeneratedImage] = useState<string | null>(null);

  // Shared State
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const itemWorkflowInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const resetState = () => {
    setOutfitAnalysis(null);
    setMatchAdvice(null);
    setGeneratedImage(null);
    setGarmentImage(null);
    setPrompt("");
    setStyleOptions([]);
    setSelectedStyle(null);
    setModelGeneratedImage(null);
    setPersonalizedAnalysis(null);
    setAdvisorGeneratedImage(null);
  };

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

  const handleGarmentChange = (event: React.ChangeEvent<HTMLInputElement>, isMainWorkflowInput: boolean = false) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setGarmentImage(base64);
        if (isMainWorkflowInput) {
           setStyleOptions([]);
           setSelectedStyle(null);
           setModelGeneratedImage(null);
        } else {
           setMatchAdvice(null); 
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeOutfit = async (image: string) => {
    setLoading(true);
    setLoadingMessage("正在評分您的時尚指數並分析造型...");
    try {
      const result = await analyzeOutfit(image);
      setOutfitAnalysis(result);
      setPrompt(result.suggestedPrompt);
    } catch (error) {
      alert("評分分析失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePerson = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setGeneratedImage(null);
    setMatchAdvice(null);
    try {
      if (mode === TryOnMode.TEXT) {
        if (!prompt) return;
        setLoadingMessage("正在根據建議合成新造型...");
        const resultImage = await generateVirtualTryOn(selectedImage, prompt);
        setGeneratedImage(resultImage);
      } else {
        if (!garmentImage) return;
        setLoadingMessage("正在分析單品搭配性...");
        const advice = await analyzeMatch(selectedImage, garmentImage);
        setMatchAdvice(advice);
        setLoadingMessage("正在為您試穿這件單品...");
        const resultImage = await generateVirtualTryOnWithItem(selectedImage, garmentImage);
        setGeneratedImage(resultImage);
      }
    } catch (error: any) {
      alert(`處理失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeGarment = async () => {
    if (!garmentImage) return;
    setLoading(true);
    setLoadingMessage("正在偵測最新潮流趨勢並匹配風格...");
    setStyleOptions([]);
    setSelectedStyle(null);
    setModelGeneratedImage(null);
    try {
      const styles = await analyzeGarment(garmentImage);
      setStyleOptions(styles);
    } catch (error) {
      alert("分析失敗，請確認圖片清晰");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAdvisor = async () => {
    if (!selectedImage || !height || !weight || !targetStyle) {
      alert("請填寫完整資訊並上傳自拍照");
      return;
    }
    setLoading(true);
    setLoadingMessage("正在深度分析您的身材特徵與風格合適度...");
    setPersonalizedAnalysis(null);
    try {
      const result = await analyzePersonalizedStyle(selectedImage, height, weight, fitnessLevel, targetStyle);
      setPersonalizedAnalysis(result);
    } catch (error) {
      alert("顧問分析失敗，請檢查網路後重試");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStyleImage = async () => {
    if (!garmentImage || !selectedStyle) return;
    setLoading(true);
    setLoadingMessage(`正在渲染 ${selectedStyle.styleName} 穿搭概念圖...`);
    setModelGeneratedImage(null);
    try {
      const image = await generateModelTryOn(garmentImage, targetGender, selectedStyle.visualPrompt);
      setModelGeneratedImage(image);
    } catch (error: any) {
      alert(`生成失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'text-amber-400 border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.3)]';
      case 'A': return 'text-slate-200 border-slate-200 bg-slate-200/10';
      case 'B': return 'text-blue-400 border-blue-400 bg-blue-400/10';
      case 'C': return 'text-gray-400 border-gray-400 bg-gray-400/10';
      default: return 'text-red-400 border-red-400 bg-red-400/10';
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerGarmentInput = () => garmentInputRef.current?.click();
  const triggerItemWorkflowInput = () => itemWorkflowInputRef.current?.click();

  return (
    <div className="min-h-screen flex flex-col bg-brand-black font-sans text-gray-200">
      <Header />

      <div className="bg-brand-black border-b border-brand-gray sticky top-[80px] z-40">
        <div className="container mx-auto px-4 py-4 flex justify-center gap-4">
          <button
            onClick={() => { setWorkflow(Workflow.PERSON); resetState(); setSelectedImage(null); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${
              workflow === Workflow.PERSON 
                ? 'bg-brand-gold text-black font-bold shadow-lg scale-105' 
                : 'bg-brand-gray/30 text-gray-400 hover:bg-brand-gray/50'
            }`}
          >
            <Camera size={18} /> 個人造型改造
          </button>
          <button
             onClick={() => { setWorkflow(Workflow.ITEM); resetState(); setSelectedImage(null); }}
             className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${
              workflow === Workflow.ITEM
                ? 'bg-brand-gold text-black font-bold shadow-lg scale-105' 
                : 'bg-brand-gray/30 text-gray-400 hover:bg-brand-gray/50'
            }`}
          >
            <Zap size={18} className="text-brand-gold" /> 潮流單品探索
          </button>
          <button
            onClick={() => { setWorkflow(Workflow.ADVISOR); resetState(); setSelectedImage(null); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${
              workflow === Workflow.ADVISOR 
                ? 'bg-brand-gold text-black font-bold shadow-lg scale-105' 
                : 'bg-brand-gray/30 text-gray-400 hover:bg-brand-gray/50'
            }`}
          >
            <Sparkles size={18} className="text-brand-gold" /> 自我風格顧問
          </button>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-8">
        
        {workflow === Workflow.PERSON && (
          <>
            {!selectedImage && (
              <div className="flex flex-col items-center justify-center h-[50vh] border-2 border-dashed border-brand-gray rounded-xl bg-brand-gray/20 hover:bg-brand-gray/30 transition-all cursor-pointer group" onClick={triggerFileInput}>
                <div className="text-brand-gold mb-4 p-4 bg-brand-black rounded-full group-hover:scale-110 transition-transform">
                  <User size={48} />
                </div>
                <h2 className="text-2xl font-serif mb-2 text-white">上傳您的全身照</h2>
                <p className="text-gray-400">開始您的專屬 AI 時尚評分與造型建議</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>
            )}

            {selectedImage && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                  <div className="relative rounded-xl overflow-hidden shadow-2xl border border-brand-gray group">
                    <img src={selectedImage} alt="Original" className="w-full h-auto object-cover" />
                    <button 
                      onClick={() => { setSelectedImage(null); resetState(); }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>

                  {loading && !outfitAnalysis ? (
                    <div className="bg-brand-gray/20 p-8 rounded-xl border border-brand-gray/50 text-center">
                       <Spinner />
                       <p className="text-sm text-gray-400 mt-4">{loadingMessage}</p>
                    </div>
                  ) : outfitAnalysis && (
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-brand-gray/20 p-4 rounded-xl border border-brand-gray/50 text-center">
                             <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Style Score</p>
                             <div className="text-4xl font-serif font-bold text-brand-gold">{outfitAnalysis.score}</div>
                          </div>
                          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center ${getGradeColor(outfitAnalysis.grade)}`}>
                             <p className="text-xs uppercase tracking-widest mb-1 opacity-70">Style Grade</p>
                             <div className="text-4xl font-serif font-bold flex items-center gap-1">
                                {outfitAnalysis.grade === 'S' && <Star size={24} className="fill-current"/>}
                                {outfitAnalysis.grade}
                             </div>
                          </div>
                       </div>
                       <div className="bg-brand-gray/20 p-6 rounded-xl border border-brand-gray/50">
                          <h3 className="text-lg font-serif text-brand-gold mb-4 flex items-center gap-2">
                             <Trophy size={18} /> 專家詳細點評
                          </h3>
                          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-gray-300">
                             {outfitAnalysis.analysisText}
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-brand-gray/10 p-6 rounded-xl border border-brand-gray/50 h-full flex flex-col">
                    <div className="flex p-1 bg-brand-black/50 rounded-lg mb-6 border border-brand-gray/30">
                      <button onClick={() => setMode(TryOnMode.TEXT)} className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === TryOnMode.TEXT ? 'bg-brand-gray text-brand-gold' : 'text-gray-500'}`}>
                        <Type size={16} /> 文字描述生成
                      </button>
                      <button onClick={() => setMode(TryOnMode.ITEM)} className={`flex-1 py-2 px-4 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === TryOnMode.ITEM ? 'bg-brand-gray text-brand-gold' : 'text-gray-500'}`}>
                        <ShoppingBag size={16} /> 單品搭配合成
                      </button>
                    </div>

                    <div className="mb-6">
                      {mode === TryOnMode.TEXT ? (
                         <div className="space-y-3">
                            <label className="block text-sm text-gray-400 flex justify-between"><span>描述風格</span>{prompt && <span className="text-brand-gold text-xs italic">* 已自動帶入建議</span>}</label>
                            <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-brand-black border border-brand-gray rounded-lg px-4 py-3 text-white focus:border-brand-gold resize-none" placeholder="例如：換成白色絲質襯衫..." />
                         </div>
                      ) : (
                        <div className="grid grid-cols-[1fr_2fr] gap-4 items-center">
                          <div onClick={triggerGarmentInput} className="h-24 border-2 border-dashed border-brand-gray rounded-lg flex items-center justify-center cursor-pointer hover:bg-brand-gray/10 relative overflow-hidden">
                            {garmentImage ? <img src={garmentImage} className="w-full h-full object-contain p-1" /> : <Upload className="text-gray-400" />}
                            <input type="file" ref={garmentInputRef} onChange={(e) => handleGarmentChange(e)} accept="image/*" className="hidden" />
                          </div>
                          <p className="text-sm text-gray-400">上傳想嘗試的單品，AI 將分析並為您試穿。</p>
                        </div>
                      )}
                      <button onClick={handleGeneratePerson} disabled={loading || (mode === TryOnMode.TEXT ? !prompt : !garmentImage)} className={`w-full mt-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${loading || (mode === TryOnMode.TEXT ? !prompt : !garmentImage) ? 'bg-gray-800 text-gray-500' : 'bg-brand-gold text-black hover:bg-amber-300'}`}>
                        {loading ? <Spinner /> : <Wand2 size={18} />} 開始生成
                      </button>
                    </div>

                    {matchAdvice && (
                      <div className="mb-4 bg-brand-black/40 border-l-2 border-brand-gold p-4 rounded-r-lg">
                        <h4 className="text-brand-gold font-bold text-sm mb-2"><Sparkles size={14} className="inline mr-1" /> 搭配建議</h4>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{matchAdvice}</p>
                      </div>
                    )}

                    <div className="flex-grow bg-black/40 rounded-lg border border-dashed border-brand-gray/50 flex items-center justify-center overflow-hidden min-h-[400px] relative">
                      {loading && !generatedImage ? (
                        <div className="text-center p-8"><Spinner /><p className="text-brand-gold animate-pulse mt-4">{loadingMessage}</p></div>
                      ) : generatedImage ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black">
                          <img src={generatedImage} className="max-h-[500px] max-w-full object-contain" />
                          <a href={generatedImage} download="vogue-ai-look.png" className="absolute bottom-4 right-4 bg-brand-gold text-black px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-white"><Upload size={14} className="rotate-180" /> 下載</a>
                        </div>
                      ) : (
                        <div className="text-center opacity-50"><Shirt className="w-16 h-16 mx-auto mb-4" /><p>生成結果將在此處顯示</p></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {workflow === Workflow.ADVISOR && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center mb-8">
               <h2 className="text-3xl font-serif text-white mb-2">AI 私人風格顧問</h2>
               <p className="text-gray-400">結合您的身形數據與風格偏好，打造最契合的時尚建議</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  {!selectedImage ? (
                    <div className="aspect-square border-2 border-dashed border-brand-gray rounded-xl bg-brand-gray/20 hover:bg-brand-gray/30 transition-all cursor-pointer flex flex-col items-center justify-center p-8 group" onClick={triggerFileInput}>
                      <Camera size={48} className="text-brand-gold mb-4 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-bold">上傳一張正面自拍照</p>
                      <p className="text-xs text-gray-500 mt-2 text-center">清晰的半身或全身照佳</p>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden shadow-2xl border border-brand-gray group">
                      <img src={selectedImage} alt="Selfie" className="w-full h-auto object-cover" />
                      <button 
                        onClick={() => { setSelectedImage(null); setPersonalizedAnalysis(null); }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">身高 (cm)</label>
                        <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-brand-gray/20 border border-brand-gray/50 rounded-lg px-4 py-2 text-white focus:border-brand-gold outline-none" placeholder="175" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">體重 (kg)</label>
                        <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-brand-gray/20 border border-brand-gray/50 rounded-lg px-4 py-2 text-white focus:border-brand-gold outline-none" placeholder="70" />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">健身程度 / 體型描述</label>
                     <select value={fitnessLevel} onChange={(e) => setFitnessLevel(e.target.value)} className="w-full bg-brand-gray/20 border border-brand-gray/50 rounded-lg px-4 py-3 text-white focus:border-brand-gold outline-none appearance-none">
                        <option value="纖細" className="bg-brand-black">纖細 (Slender)</option>
                        <option value="一般體型" className="bg-brand-black">一般體型 (Average)</option>
                        <option value="健身愛好者" className="bg-brand-black">健身愛好者 (Athletic/Fit)</option>
                        <option value="壯碩" className="bg-brand-black">壯碩 (Muscular)</option>
                        <option value="豐滿" className="bg-brand-black">豐滿 (Curvy/Full-figured)</option>
                     </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">想要嘗試的風格</label>
                     <input type="text" value={targetStyle} onChange={(e) => setTargetStyle(e.target.value)} className="w-full bg-brand-gray/20 border border-brand-gray/50 rounded-lg px-4 py-3 text-white focus:border-brand-gold outline-none" placeholder="例如：日系 City Boy, 歐美極簡, 韓系精緻..." />
                  </div>

                  <button onClick={handleAnalyzeAdvisor} disabled={loading || !selectedImage || !height || !weight || !targetStyle} className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-transform ${loading || !selectedImage || !height || !weight || !targetStyle ? 'bg-gray-800 text-gray-600' : 'bg-brand-gold text-black hover:bg-amber-300 hover:scale-[1.02]'}`}>
                    {loading ? <Spinner /> : <Sparkles size={20} />} 獲取專屬建議
                  </button>
               </div>

               <div className="space-y-6">
                  {loading && !personalizedAnalysis ? (
                    <div className="h-full bg-brand-gray/10 rounded-xl border border-dashed border-brand-gray flex flex-col items-center justify-center p-12 text-center">
                       <Spinner />
                       <p className="text-brand-gold mt-4 animate-pulse">{loadingMessage}</p>
                    </div>
                  ) : personalizedAnalysis ? (
                    <div className="space-y-6">
                       <div className="bg-brand-gray/20 p-6 rounded-xl border border-brand-gray/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xl font-serif text-brand-gold flex items-center gap-2">
                                <CheckCircle2 size={24} /> 風格合適度分析
                             </h3>
                             <div className="text-3xl font-serif font-bold text-brand-gold">{personalizedAnalysis.suitabilityScore}%</div>
                          </div>
                          <div className="prose prose-invert prose-sm max-w-none text-gray-300 mb-6">
                             {personalizedAnalysis.suitabilityExplanation}
                          </div>
                          
                          <div className="space-y-4">
                             <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <ShoppingBag size={14} className="text-brand-gold" /> 推薦品牌 (針對此風格)
                             </h4>
                             <div className="flex flex-wrap gap-2">
                                {personalizedAnalysis.recommendedBrands.map((brand, idx) => (
                                   <span key={idx} className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-xs border border-brand-gold/30">
                                      {brand}
                                   </span>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-4 mt-6">
                             <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <RefreshCw size={14} className="text-brand-gold" /> 推薦其他更加契合的風格
                             </h4>
                             <div className="grid gap-3">
                                {personalizedAnalysis.recommendedStyles.map((style, idx) => (
                                   <div key={idx} className="bg-brand-black/40 p-4 rounded-lg border border-brand-gray/30 hover:border-brand-gold/50 transition-colors">
                                      <div className="font-bold text-brand-gold mb-1">{style.name}</div>
                                      <div className="text-xs text-gray-400">{style.reason}</div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          <button 
                            onClick={async () => {
                              if (!selectedImage || !personalizedAnalysis?.visualPrompt) return;
                              setLoading(true);
                              setLoadingMessage(`正在為您生成「${targetStyle}」風格預覽...`);
                              setAdvisorGeneratedImage(null);
                              try {
                                const img = await generateVirtualTryOn(selectedImage, personalizedAnalysis.visualPrompt);
                                setAdvisorGeneratedImage(img);
                              } catch (e: any) {
                                alert("預覽生成失敗: " + e.message);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading || !personalizedAnalysis}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform ${loading ? 'bg-gray-800 text-gray-600' : 'bg-brand-gold text-black hover:bg-white hover:scale-[1.02]'}`}
                          >
                             {loading && advisorGeneratedImage === null ? <Spinner /> : <Shirt size={20} />} 生成專屬風格穿搭預覽
                          </button>

                          {advisorGeneratedImage && (
                            <div className="relative rounded-xl overflow-hidden border border-brand-gold/50 shadow-2xl animate-in zoom-in-95 duration-500">
                               <img src={advisorGeneratedImage} alt="Advisor Try-on" className="w-full h-auto" />
                               <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                                  <p className="text-white font-bold text-sm mb-1">{targetStyle} 風格預覽</p>
                                  <p className="text-xs text-gray-400">這是根據您的身形數據優化後的預想效果</p>
                               </div>
                               <a 
                                 href={advisorGeneratedImage} 
                                 download={`vogueai-advisor-${targetStyle}.png`}
                                 className="absolute top-2 right-2 bg-brand-gold text-black p-2 rounded-full shadow-lg"
                               >
                                  <Upload size={16} className="rotate-180" />
                               </a>
                            </div>
                          )}
                       </div>

                       <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-center">
                          <Zap size={24} className="text-amber-500 shrink-0" />
                          <p className="text-xs text-amber-500/80">提示：AI 已考量您的 {height}cm 身高與 {fitnessLevel} 特徵。您可以嘗試在「個人造型改造」中輸入推薦的風格名稱來預覽外觀！</p>
                       </div>
                    </div>
                  ) : (
                    <div className="h-full bg-brand-gray/10 rounded-xl border border-dashed border-brand-gray/30 flex flex-col items-center justify-center p-12 text-center text-gray-600">
                       <User size={64} className="mb-4 opacity-50" />
                       <p className="text-lg">您的風格報告將在此生成</p>
                       <p className="text-sm mt-2">填寫左側資訊並點擊按鈕開始</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
        {workflow === Workflow.ITEM && (
           <div className="max-w-7xl mx-auto">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3 space-y-6">
                   <div 
                      onClick={triggerItemWorkflowInput}
                      className="aspect-[3/4] border-2 border-dashed border-brand-gray rounded-xl bg-brand-gray/10 hover:bg-brand-gray/20 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group"
                   >
                      {garmentImage ? (
                        <>
                          <img src={garmentImage} alt="Item" className="w-full h-full object-contain p-4" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <p className="text-white font-bold flex items-center gap-2"><RefreshCw size={20}/> 更換單品</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-brand-gray/30 rounded-full flex items-center justify-center mb-4 text-brand-gold">
                             <Shirt size={40} />
                          </div>
                          <h3 className="text-xl text-white font-serif">上傳潮流單品</h3>
                          <p className="text-gray-500 mt-2 text-sm">解鎖最新穿搭趨勢</p>
                        </>
                      )}
                      <input type="file" ref={itemWorkflowInputRef} onChange={(e) => handleGarmentChange(e, true)} accept="image/*" className="hidden" />
                   </div>

                   <div className="bg-brand-gray/10 p-6 rounded-xl border border-brand-gray/50">
                      <label className="block text-sm text-gray-400 mb-4 font-bold">選擇模特兒性別</label>
                      <div className="flex gap-4 mb-6">
                        <button 
                          onClick={() => setTargetGender('female')}
                          className={`flex-1 py-3 rounded-lg border transition-all ${targetGender === 'female' ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                        >
                          Female
                        </button>
                        <button 
                          onClick={() => setTargetGender('male')}
                          className={`flex-1 py-3 rounded-lg border transition-all ${targetGender === 'male' ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                        >
                          Male
                        </button>
                      </div>
                      
                      <button 
                        onClick={handleAnalyzeGarment}
                        disabled={!garmentImage || loading}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-transform ${!garmentImage || loading ? 'bg-gray-800 text-gray-600' : 'bg-brand-gold text-black hover:bg-amber-300 hover:scale-[1.02]'}`}
                      >
                         {loading && styleOptions.length === 0 ? <Spinner /> : <Sparkles size={18} />}
                         1. 分析潮流風格潛力
                      </button>
                   </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-serif text-white flex items-center gap-2">
                          <Zap size={20} className="text-brand-gold"/> 潮流趨勢建議
                       </h3>
                       {styleOptions.length > 0 && <span className="text-xs text-gray-400">點擊選擇想探索的風格</span>}
                    </div>

                    {loading && styleOptions.length === 0 ? (
                       <div className="space-y-4">
                          {[1,2,3].map(i => (
                             <div key={i} className="h-32 bg-brand-gray/10 rounded-xl animate-pulse border border-brand-gray/30"></div>
                          ))}
                       </div>
                    ) : styleOptions.length > 0 ? (
                       <div className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {styleOptions.map((style) => (
                             <div 
                                key={style.id}
                                onClick={() => setSelectedStyle(style)}
                                className={`p-5 rounded-xl border-2 cursor-pointer transition-all relative ${
                                   selectedStyle?.id === style.id 
                                   ? 'border-brand-gold bg-brand-gold/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                                   : 'border-brand-gray/30 bg-brand-gray/10 hover:bg-brand-gray/20 hover:border-brand-gray'
                                }`}
                             >
                                <div className="flex justify-between items-start mb-2">
                                   <h4 className={`font-serif text-lg font-bold ${selectedStyle?.id === style.id ? 'text-brand-gold' : 'text-white'}`}>{style.styleName}</h4>
                                   {selectedStyle?.id === style.id && <CheckCircle2 className="text-brand-gold" size={20} />}
                                </div>
                                <p className="text-sm text-gray-300 mb-3">{style.description}</p>
                                <div className="bg-black/30 p-3 rounded-lg border border-brand-gray/30">
                                   <p className="text-xs text-brand-gold font-bold mb-1 flex items-center gap-1"><ShoppingBag size={10}/> 推薦搭配單品：</p>
                                   <p className="text-xs text-gray-400 leading-relaxed">{style.matchAdvice}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-brand-gray/30 rounded-xl bg-brand-gray/5 p-8">
                          <ArrowRight size={32} className="mb-4 opacity-50" />
                          <p>請先上傳單品並點擊「分析潮流風格潛力」</p>
                       </div>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                   <div className="bg-black/40 rounded-xl border border-dashed border-brand-gray/50 h-[520px] flex items-center justify-center relative overflow-hidden">
                      {loading && modelGeneratedImage === null && selectedStyle ? (
                         <div className="text-center p-8">
                            <Spinner />
                            <p className="text-brand-gold mt-4 animate-pulse">正在渲染時髦造型...</p>
                         </div>
                      ) : modelGeneratedImage ? (
                         <div className="w-full h-full flex items-center justify-center bg-black">
                            <img src={modelGeneratedImage} alt="Model Try-On" className="h-full w-full object-contain" />
                             <a href={modelGeneratedImage} download={`vogue-ai-${selectedStyle?.styleName}.png`} className="absolute bottom-6 right-6 bg-brand-gold text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-white shadow-xl"><Upload size={18} className="rotate-180" /> 下載</a>
                         </div>
                      ) : (
                         <div className="text-center opacity-40 px-6">
                            <User size={64} className="mx-auto mb-4 text-gray-600" />
                            <p>選擇推薦風格後生成視覺圖</p>
                         </div>
                      )}
                   </div>
                   
                   <button 
                      onClick={handleGenerateStyleImage}
                      disabled={!selectedStyle || loading}
                      className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 shadow-lg ${!selectedStyle || loading ? 'bg-gray-800 text-gray-600' : 'bg-brand-gold text-black hover:bg-amber-300 hover:scale-[1.02] transition-transform'}`}
                    >
                      {loading && modelGeneratedImage === null && selectedStyle ? <Spinner /> : <Wand2 size={20} />}
                      2. 生成潮流穿搭圖
                    </button>
                </div>
             </div>
           </div>
        )}
      </main>

      <footer className="py-6 border-t border-brand-gray mt-auto bg-brand-black">
         <div className="container mx-auto px-4 text-center">
           <p className="text-gray-600 text-sm">Powered by Google Gemini 3 Flash & Imagen</p>
         </div>
      </footer>
    </div>
  );
};

export default App;
