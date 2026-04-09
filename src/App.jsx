import React, { useState, useEffect } from 'react';
import { 
  History, 
  Settings, 
  BarChart2, 
  Trash2, 
  Delete, 
  Edit2, 
  ChevronDown,
  AlertCircle,
  Undo2,
  Leaf,
  Asterisk,
  Sparkles,
  CheckCircle,
  ListChecks,
  Search,
  Calendar,
  Clock,
  LayoutGrid,
  List,
  Plus,
  Loader2
} from 'lucide-react';

// --- Constants ---
const GAS_URL = import.meta.env.VITE_GAS_URL;

const DEFAULT_CATEGORY_COLORS = {
  'ยาว': 'bg-[#4ADE80] text-neutral-900 border-[#4ADE80]', 
  'แหลม': 'bg-[#C084FC] text-white border-[#C084FC]', 
  'กลม': 'bg-[#FDE047] text-neutral-900 border-[#FDE047]', 
  'ลาย': 'bg-[#93C5FD] text-neutral-900 border-[#93C5FD]', 
  'ตั้งฉ่าย': 'bg-[#F9A8D4] text-neutral-900 border-[#F9A8D4]', 
};

const FALLBACK_COLORS = [
  'bg-[#FCA5A5] text-neutral-900 border-[#FCA5A5]',
  'bg-[#99F6E4] text-neutral-900 border-[#99F6E4]',
  'bg-[#E9D5FF] text-neutral-900 border-[#E9D5FF]',
  'bg-[#FDBA74] text-neutral-900 border-[#FDBA74]',
  'bg-[#A7F3D0] text-neutral-900 border-[#A7F3D0]',
];

const INACTIVE_COLOR = 'bg-white text-neutral-500 border-neutral-200';

export default function App() {
  const getTodayThaiFormat = () => {
    const d = new Date();
    const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear()}`;
  };

  // --- State ---
  const [activeTab, setActiveTab] = useState('record');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [masterData, setMasterData] = useState({});
  const [historyRecords, setHistoryRecords] = useState([]);
  
  const [setupData, setSetupData] = useState({
    date: getTodayThaiFormat(),
    round: 1,
    fruit: ''
  });

  const [activeCategory, setActiveCategory] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [records, setRecords] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [expandedCats, setExpandedCats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedHistory, setExpandedHistory] = useState([]);

  // --- Data Fetching ---
  useEffect(() => {
    fetchMasterData();
    fetchHistory();
  }, []);

  const fetchMasterData = async () => {
    if (!GAS_URL) return;
    try {
      setLoading(true);
      const res = await fetch(`${GAS_URL}?action=getMasterData`);
      const data = await res.json();
      setMasterData(data);
      const fruits = Object.keys(data);
      if (fruits.length > 0) {
        setSetupData(prev => ({ ...prev, fruit: fruits[0] }));
      }
    } catch (err) {
      console.error("Failed to fetch master data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!GAS_URL) return;
    try {
      const res = await fetch(`${GAS_URL}?action=getHistory`);
      const data = await res.json();
      setHistoryRecords(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleSaveToGAS = async (payload) => {
    if (!GAS_URL) {
      alert("Please set VITE_GAS_URL in your .env file");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveRecord',
          payload: payload
        })
      });
      const result = await res.json();
      if (result.success) {
        fetchHistory();
        return true;
      }
    } catch (err) {
      console.error("Failed to save record", err);
      alert("Error saving to Google Sheets. Check CORS or GAS permissions.");
    } finally {
      setLoading(false);
    }
    return false;
  };

  // --- Computed ---
  const fruits = Object.keys(masterData);
  const currentCategories = masterData[setupData.fruit] || [];
  const grandTotal = records.reduce((sum, r) => sum + r.weight, 0);

  const getCategoryColorClass = (cat) => {
    if (DEFAULT_CATEGORY_COLORS[cat]) return DEFAULT_CATEGORY_COLORS[cat];
    let hash = 0;
    for (let i = 0; i < cat.length; i++) hash += cat.charCodeAt(i);
    return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
  };

  const getCategoryTotal = (cat) => records.filter(r => r.category === cat).reduce((sum, r) => sum + r.weight, 0);

  const groupedRecords = currentCategories.map(cat => ({ 
    category: cat, 
    items: records.filter(r => r.category === cat), 
    total: getCategoryTotal(cat) 
  })).filter(g => g.items.length > 0);

  const filteredHistory = historyRecords.filter(record => 
    record.date.toString().includes(searchTerm) || 
    record.fruit.includes(searchTerm)
  );

  // --- Handlers ---
  const handleStartRound = () => { setIsRecording(true); setActiveCategory(''); };
  
  const handleNumpadClick = (val) => {
    if (!activeCategory) { 
      setErrorMsg('กรุณาเลือกประเภทก่อน'); 
      setTimeout(() => setErrorMsg(''), 2000); 
      return; 
    }
    if (val === 'BACKSPACE') setInputValue(prev => prev.slice(0, -1));
    else if (val === '.') { if (!inputValue.includes('.')) setInputValue(prev => prev ? prev + '.' : '0.'); } 
    else if (inputValue.length < 6) setInputValue(prev => prev + val);
  };

  const handleEnter = () => {
    if (!activeCategory || !inputValue || parseFloat(inputValue) <= 0) return;
    const newRecord = { 
      id: Date.now().toString() + Math.random(), 
      category: activeCategory, 
      weight: parseFloat(inputValue), 
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) 
    };
    setRecords(prev => [newRecord, ...prev]);
    setInputValue(''); 
  };

  const handleConfirmRound = async () => {
    const payload = {
      date: setupData.date,
      round: setupData.round,
      fruit: setupData.fruit,
      totalWeight: grandTotal,
      items: records.map(r => ({ category: r.category, weight: r.weight }))
    };

    const success = await handleSaveToGAS(payload);
    if (success) {
      setShowSummaryModal(false);
      setIsRecording(false);
      setRecords([]);
      setSetupData(prev => ({ ...prev, round: prev.round + 1 }));
    }
  };

  // --- UI Components ---
  const renderSetup = () => (
    <div className="flex-1 flex flex-col p-4 justify-center items-center relative overflow-hidden">
      <Asterisk className="absolute top-6 left-6 w-10 h-10 text-purple-400 opacity-20 animate-spin-slow" />
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-100 w-full max-w-md relative z-10">
        <h2 className="text-3xl font-black text-neutral-900 mb-8 text-center">เริ่มบันทึกรอบใหม่</h2>
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 ml-2">วันที่</label>
            <div className="w-full bg-neutral-50 p-4 rounded-2xl font-bold border border-neutral-100 flex items-center gap-2 cursor-pointer shadow-sm">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>{setupData.date}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-1/3">
              <label className="block text-xs font-bold text-neutral-400 mb-2 ml-2">รอบที่</label>
              <input 
                type="number" 
                value={setupData.round} 
                onChange={e => setSetupData(prev => ({...prev, round: parseInt(e.target.value) || 1}))}
                className="w-full bg-yellow-300 text-neutral-900 p-4 rounded-2xl font-bold text-center border-none shadow-sm focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div className="w-2/3">
              <label className="block text-xs font-bold text-neutral-400 mb-2 ml-2">ผลไม้</label>
              <select 
                value={setupData.fruit} 
                onChange={e => setSetupData(prev => ({...prev, fruit: e.target.value}))}
                className="w-full bg-white border border-neutral-200 p-4 rounded-2xl font-bold text-sm appearance-none shadow-sm"
              >
                {fruits.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>
        <button onClick={handleStartRound} className="w-full bg-neutral-900 text-white font-bold text-lg py-5 rounded-3xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          เริ่มบันทึก <ChevronDown className="w-5 h-5 -rotate-90" />
        </button>
      </div>
    </div>
  );

  const renderActive = () => (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
      {/* Header Info */}
      <div className="p-4 flex justify-between items-center border-b border-neutral-100 bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsRecording(false)} className="bg-white border p-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1"><Edit2 className="w-3 h-3" /> {setupData.date}</button>
          <div className="bg-green-400 text-neutral-900 px-3 py-2 rounded-xl text-xs font-bold shadow-sm">รอบ {setupData.round}</div>
          <div className="bg-purple-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm">{setupData.fruit}</div>
        </div>
        <button onClick={() => setShowSummaryModal(true)} disabled={records.length === 0} className="bg-neutral-900 text-yellow-300 px-5 py-2 rounded-xl font-bold text-xs shadow-md disabled:bg-neutral-200">
          สรุปรอบ
        </button>
      </div>

      {/* Total Card */}
      <div className="p-4">
        <div className="bg-yellow-300 rounded-[2rem] p-6 shadow-sm flex justify-between items-center overflow-hidden relative">
          <Asterisk className="absolute -right-2 -top-2 w-16 h-16 text-black opacity-5" />
          <div>
            <h3 className="font-black text-xl text-neutral-800 uppercase">Total weight</h3>
            <p className="text-neutral-700 text-xs font-medium">ยอดรวมสุทธิ กิโลกรัม</p>
          </div>
          <div className="text-5xl font-black text-neutral-900">
            {grandTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex overflow-x-auto px-4 gap-3 py-2 hide-scrollbar shrink-0">
        {currentCategories.map(cat => {
          const isActive = activeCategory === cat;
          const total = getCategoryTotal(cat);
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex flex-col min-w-[100px] p-4 rounded-3xl border-2 transition-all text-left ${isActive ? getCategoryColorClass(cat) : INACTIVE_COLOR}`}>
              <span className="text-[10px] font-bold opacity-70 mb-1">{total > 0 ? total : '0'} กก.</span>
              <span className="text-xl font-bold">{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Main Recording Area */}
      <div className="flex-1 flex flex-col md:flex-row bg-white rounded-t-[2.5rem] mt-4 shadow-2xl border border-neutral-100 overflow-hidden">
        {/* Recent List */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-xl font-black text-neutral-800 mb-4">รายการล่าสุด</h3>
          <div className="space-y-3">
            {records.map(r => (
              <div key={r.id} className="bg-neutral-50 p-4 rounded-2xl flex justify-between items-center border border-neutral-100 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">{r.category.charAt(0)}</div>
                  <div className="font-bold text-sm">{r.category}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black">{r.weight}</span>
                  <button onClick={() => setRecords(prev => prev.filter(x => x.id !== r.id))} className="text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Numpad */}
        <div className="w-full md:w-[420px] bg-neutral-50 p-6 flex flex-col gap-4">
          <div className={`bg-white rounded-2xl p-4 shadow-inner border-2 min-h-[80px] flex items-center justify-between ${activeCategory ? 'border-neutral-900' : 'border-neutral-200'}`}>
            <div className="text-sm font-bold text-neutral-400">{activeCategory || 'เลือกประเภท'}</div>
            <div className="text-5xl font-black text-neutral-900">{inputValue || 0}</div>
            {errorMsg && <div className="absolute inset-x-6 top-6 bg-red-500 text-white p-4 rounded-xl text-center font-bold animate-bounce">{errorMsg}</div>}
          </div>
          <div className="grid grid-cols-4 gap-3 flex-1">
            <div className="col-span-3 grid grid-cols-3 gap-3">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.'].map(b => (
                <button key={b} onClick={() => handleNumpadClick(b)} className="bg-white rounded-2xl shadow-sm text-3xl font-bold py-4 hover:bg-neutral-100 active:scale-95 transition-all">{b}</button>
              ))}
            </div>
            <div className="col-span-1 flex flex-col gap-3">
              <button onClick={() => handleNumpadClick('BACKSPACE')} className="bg-neutral-200 rounded-2xl flex items-center justify-center flex-1"><Delete className="w-6 h-6" /></button>
              <button onClick={handleEnter} disabled={!activeCategory || !inputValue} className="bg-neutral-900 text-white rounded-2xl flex-2 flex flex-col items-center justify-center font-black uppercase text-xl disabled:opacity-20">Enter</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-black text-neutral-900">History</h2>
        <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border">
          <Search className="w-4 h-4 text-neutral-400 mr-2" />
          <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {filteredHistory.map(h => (
          <div key={h.id} className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div>
                 <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">{h.date} | {h.timestamp}</div>
                 <h3 className="text-2xl font-black text-neutral-900">{h.fruit} <span className="text-sm font-bold text-neutral-400 font-sans">รอบ {h.round}</span></h3>
               </div>
               <div className="text-right">
                 <div className="text-3xl font-black text-purple-600">{h.totalWeight} <span className="text-xs font-bold text-neutral-400">กก.</span></div>
               </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {h.details.map(d => (
                <div key={d.category} className="bg-neutral-50 px-3 py-2 rounded-xl text-xs font-bold border border-neutral-100">
                  {d.category}: {d.total} ({d.count} ครั้ง)
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#FDFBF7] flex flex-col font-sans select-none antialiased">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-neutral-900 animate-spin" />
          </div>
        )}
        
        {activeTab === 'record' ? (isRecording ? renderActive() : renderSetup()) : activeTab === 'history' ? renderHistory() : <div className="p-10 text-center font-black">Coming Soon...</div>}
      </main>

      {/* Nav Bar */}
      <nav className="h-20 bg-white border-t border-neutral-100 flex items-center justify-around px-2 shrink-0 z-50">
        <button onClick={() => setActiveTab('record')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'record' ? 'text-neutral-900 scale-110' : 'text-neutral-300'}`}>
          <Plus className={`w-8 h-8 ${activeTab === 'record' ? 'bg-yellow-300 rounded-full p-1 shadow-md' : ''}`} />
          <span className="text-[10px] font-bold">Record</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-neutral-900 scale-110' : 'text-neutral-300'}`}>
          <History className="w-8 h-8" />
          <span className="text-[10px] font-bold">History</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-neutral-900 scale-110' : 'text-neutral-300'}`}>
          <BarChart2 className="w-8 h-8" />
          <span className="text-[10px] font-bold">Stats</span>
        </button>
      </nav>

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-[100] bg-neutral-900/40 backdrop-blur-sm flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-10 space-y-6">
            <h2 className="text-3xl font-black">ยืนยันการบันทึก <span className="text-purple-600">รอบที่ {setupData.round}</span></h2>
            <div className="space-y-4">
              {groupedRecords.map(g => (
                <div key={g.category} className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold">{g.category} ({g.items.length})</span>
                  <span className="font-black text-xl">{g.total} กก.</span>
                </div>
              ))}
              <div className="bg-yellow-100 p-4 rounded-2xl flex justify-between items-center">
                <span className="font-black">ยอดรวมสุทธิ</span>
                <span className="text-4xl font-black">{grandTotal} กก.</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowSummaryModal(false)} className="flex-1 py-4 font-bold bg-neutral-100 rounded-3xl">แก้ไขเพิ่ม</button>
              <button onClick={handleConfirmRound} className="flex-2 py-4 font-bold bg-neutral-900 text-white rounded-3xl shadow-lg">บันทึกลง Google Sheet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
