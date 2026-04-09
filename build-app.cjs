const fs = require('fs');

// Read uxui.md
let code = fs.readFileSync('Prompt/uxui.md', 'utf8').replace(/\r\n/g, '\n');

// 1. Add GAS_URL after imports
code = code.replace(
  "const INACTIVE_COLOR = 'bg-white text-neutral-500 border-neutral-200';",
  `const INACTIVE_COLOR = 'bg-white text-neutral-500 border-neutral-200';

const GAS_URL = import.meta.env.VITE_GAS_URL;`
);

// 2. Replace mock historyRecords with empty array + add loading state + add GAS useEffect
code = code.replace(
  `  // History State
  const [historyRecords, setHistoryRecords] = useState([
    {
      id: 'mock-1',
      date: '10 เม.ย. 2026',
      round: 1,
      fruit: 'มะละกอ',
      totalWeight: 1245,
      timestamp: '08:30',
      details: [
         { category: 'ยาว', total: 503, count: 12, items: [45, 52, 40, 48, 41, 44, 46, 38, 42, 39, 35, 33] },
         { category: 'แหลม', total: 400, count: 8, items: [50, 48, 52, 49, 51, 47, 53, 50] },
         { category: 'กลม', total: 342, count: 5, items: [65, 70, 68, 72, 67] }
      ]
    },
    {
      id: 'mock-2',
      date: '09 เม.ย. 2026',
      round: 2,
      fruit: 'มะละกอ',
      totalWeight: 890,
      timestamp: '15:45',
      details: [
         { category: 'ยาว', total: 450, count: 10, items: [45, 45, 45, 45, 45, 45, 45, 45, 45, 45] },
         { category: 'ลาย', total: 440, count: 8, items: [55, 55, 55, 55, 55, 55, 55, 55] }
      ]
    }
  ]);`,
  `  // GAS Loading State
  const [gasLoading, setGasLoading] = useState(false);

  // History State
  const [historyRecords, setHistoryRecords] = useState([]);`
);

// 3. Add GAS useEffect after the existing safeguard useEffect
code = code.replace(
  `  // Safeguard: Ensure settingsActiveFruit is always valid
  useEffect(() => {
    if (fruits.length > 0 && !fruits.includes(settingsActiveFruit)) {
      setSettingsActiveFruit(fruits[0]);
    }
  }, [fruits, settingsActiveFruit]);`,
  `  // Safeguard: Ensure settingsActiveFruit is always valid
  useEffect(() => {
    if (fruits.length > 0 && !fruits.includes(settingsActiveFruit)) {
      setSettingsActiveFruit(fruits[0]);
    }
  }, [fruits, settingsActiveFruit]);

  // GAS Data Fetching
  useEffect(() => { loadGASData(); }, []);

  const loadGASData = async () => {
    if (!GAS_URL) return;
    setGasLoading(true);
    try {
      const [mRes, hRes] = await Promise.all([
        fetch(\`\${GAS_URL}?action=getMasterData\`),
        fetch(\`\${GAS_URL}?action=getHistory\`)
      ]);
      const mData = await mRes.json();
      const hData = await hRes.json();
      if (!mData.error) {
        setMasterData(mData);
        const firstFruit = Object.keys(mData)[0];
        if (firstFruit) {
          setSetupData(prev => ({ ...prev, fruit: firstFruit }));
          setSettingsActiveFruit(firstFruit);
        }
      }
      if (Array.isArray(hData)) setHistoryRecords(hData);
    } catch (e) { console.error('GAS fetch failed', e); }
    finally { setGasLoading(false); }
  };`
);

// 4. Replace handleConfirmRound to save to GAS
code = code.replace(
  `  const handleConfirmRound = () => {
    const historyEntry = {
      id: editingId || Date.now().toString(), date: setupData.date, round: setupData.round, fruit: setupData.fruit, totalWeight: grandTotal,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      details: groupedRecords.map(g => ({ category: g.category, total: g.total, count: g.items.length, items: g.items.map(item => item.weight).reverse() }))
    };
    
    if (editingId) { setHistoryRecords(prev => prev.map(r => r.id === editingId ? historyEntry : r)); setEditingId(null); } 
    else { setHistoryRecords(prev => [historyEntry, ...prev]); }

    setShowSummaryModal(false); setIsRecording(false); setRecords([]); setActiveCategory(''); setInputValue('');
    const nextRound = editingId ? Math.max(...historyRecords.map(r => typeof r.round === 'number' ? r.round : 0), 0) + 1 : setupData.round + 1;
    setSetupData(prev => ({ ...prev, round: nextRound, date: getTodayThaiFormat() }));
  };`,
  `  const handleConfirmRound = async () => {
    const historyEntry = {
      id: editingId || Date.now().toString(), date: setupData.date, round: setupData.round, fruit: setupData.fruit, totalWeight: grandTotal,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      details: groupedRecords.map(g => ({ category: g.category, total: g.total, count: g.items.length, items: g.items.map(item => item.weight).reverse() }))
    };
    
    if (editingId) { setHistoryRecords(prev => prev.map(r => r.id === editingId ? historyEntry : r)); setEditingId(null); } 
    else { setHistoryRecords(prev => [historyEntry, ...prev]); }

    setShowSummaryModal(false); setIsRecording(false); setRecords([]); setActiveCategory(''); setInputValue('');
    const nextRound = editingId ? Math.max(...historyRecords.map(r => typeof r.round === 'number' ? r.round : 0), 0) + 1 : setupData.round + 1;
    setSetupData(prev => ({ ...prev, round: nextRound, date: getTodayThaiFormat() }));

    // Save to GAS
    if (GAS_URL && !editingId) {
      try {
        await fetch(GAS_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'saveRecord',
            payload: {
              date: historyEntry.date, round: historyEntry.round, fruit: historyEntry.fruit,
              totalWeight: historyEntry.totalWeight,
              items: groupedRecords.flatMap(g => g.items.map(item => ({ category: g.category, weight: item.weight })))
            }
          })
        });
        loadGASData();
      } catch(e) { console.error('GAS save failed', e); }
    }
  };`
);

// 5. Add GAS loading overlay in the main return div
code = code.replace(
  `  return (
    <div className="w-full h-[100dvh] flex flex-col lg:flex-row bg-[#FDFBF7] overflow-hidden font-sans relative">`,
  `  return (
    <div className="w-full h-[100dvh] flex flex-col lg:flex-row bg-[#FDFBF7] overflow-hidden font-sans relative">
      {gasLoading && (
        <div className="fixed inset-0 z-[500] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin"></div>
        </div>
      )}`
);

// 6. Patch handleAddFruit to also save to GAS
code = code.replace(
  `    const handleAddFruit = () => {
      if (!newFruit.trim()) return;
      if (!masterData[newFruit.trim()]) {
         setMasterData(prev => ({...prev, [newFruit.trim()]: []}));
         setSettingsActiveFruit(newFruit.trim());
      }
      setNewFruit('');
    };`,
  `    const handleAddFruit = async () => {
      if (!newFruit.trim()) return;
      const name = newFruit.trim();
      if (!masterData[name]) {
        setMasterData(prev => ({...prev, [name]: []}));
        setSettingsActiveFruit(name);
      }
      setNewFruit('');
      if (GAS_URL) {
        try { await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addFruit', payload: { fruitName: name } }) }); }
        catch(e) { console.error('GAS addFruit failed', e); }
      }
    };`
);

// 7. Patch handleRemoveFruit to also delete from GAS
code = code.replace(
  `    const handleRemoveFruit = (f) => {
      const newData = {...masterData};
      delete newData[f];
      setMasterData(newData);
      if (setupData.fruit === f) setSetupData(prev => ({...prev, fruit: Object.keys(newData)[0] || ''}));
    };`,
  `    const handleRemoveFruit = async (f) => {
      const newData = {...masterData};
      delete newData[f];
      setMasterData(newData);
      if (setupData.fruit === f) setSetupData(prev => ({...prev, fruit: Object.keys(newData)[0] || ''}));
      if (GAS_URL) {
        try { await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteFruit', payload: { fruitName: f } }) }); }
        catch(e) { console.error('GAS deleteFruit failed', e); }
      }
    };`
);

// 8. Patch handleAddCat to also save to GAS
code = code.replace(
  `    const handleAddCat = () => {
      if (!newCat.trim() || !settingsActiveFruit) return;
      setMasterData(prev => ({
         ...prev,
         [settingsActiveFruit]: [...(prev[settingsActiveFruit] || []), newCat.trim()]
      }));
      setNewCat('');
    };`,
  `    const handleAddCat = async () => {
      if (!newCat.trim() || !settingsActiveFruit) return;
      const catName = newCat.trim();
      setMasterData(prev => ({
        ...prev,
        [settingsActiveFruit]: [...(prev[settingsActiveFruit] || []), catName]
      }));
      setNewCat('');
      if (GAS_URL) {
        try { await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addCategory', payload: { fruitName: settingsActiveFruit, categoryName: catName } }) }); }
        catch(e) { console.error('GAS addCategory failed', e); }
      }
    };`
);

// 9. Patch handleRemoveCat to also delete from GAS
code = code.replace(
  `    const handleRemoveCat = (c) => {
      setMasterData(prev => ({
         ...prev,
         [settingsActiveFruit]: prev[settingsActiveFruit].filter(item => item !== c)
      }));
      if (activeCategory === c) setActiveCategory('');
    };`,
  `    const handleRemoveCat = async (c) => {
      setMasterData(prev => ({
        ...prev,
        [settingsActiveFruit]: prev[settingsActiveFruit].filter(item => item !== c)
      }));
      if (activeCategory === c) setActiveCategory('');
      if (GAS_URL) {
        try { await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteCategory', payload: { fruitName: settingsActiveFruit, categoryName: c } }) }); }
        catch(e) { console.error('GAS deleteCategory failed', e); }
      }
    };`
);

// Write output
fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('App.jsx written successfully! Lines:', code.split('\n').length);
