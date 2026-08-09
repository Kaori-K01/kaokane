const $ = (id) => document.getElementById(id);
const categories = ['食費','外食','住居','通信費','交通費','車','日用品','衣服・美容','医療','交際費','勉強・仕事','サブスク','税金・保険','その他'];
const payments = ['dカード','Amazonカード','イオンカード','d払い','PayPay','銀行口座','現金','その他'];
const incomeCategories = ['給与','賞与','臨時収入','返金','その他'];

const ids = [
'monthLabel','monthSpend','needSpend','funSpend','compareText','unorganizedCard','unorganizedText',
'highCard','highList','recentList','historyList','histAllBtn','histHighBtn','expenseForm','amount',
'category','needBtn','funBtn','payment','date','memo','approx','highWarn','incomeForm','incomeAmount',
'incomeCategory','incomeDate','incomeMemo','assetTotal','bankUpdated','bankValue','cashValue','bankInput',
'cashInput','thresholdInput','arcadeTotal','editExpenseForm','editId','editAmount','editCategory',
'editNeedBtn','editFunBtn','editPayment','editDate','editMemo','editApprox','editHighWarn','bulkModeBtn','bulkDeleteBtn','bulkInfo','bulkControls','expenseFilters','histExpenseBtn','histIncomeBtn','thresholdDisplay','thresholdEditPanel','balanceAdjustPanel','homeIncomeTotal','homeIncomeList','incomeMonthTitle','unsettledSection','unsettledList','splitEditor','splitRows','editSplitEditor','editSplitRows','paymentMapList','paymentMapPanel','analyticsPanel','financeChart','chartExpenseBtn','chartIncomeBtn','chartBalanceBtn','chartNote','analysisBreakdownTitle','kaokaneKeypadBackdrop','kaokaneKeypadValue','kaokaneKeypadSign','recurringAddPanel','recurringEnabled','recurringUnit','recurringEvery','recurringEditPanel','editRecurringEnabled','editRecurringUnit','editRecurringEvery','transferPanel','transferDirection','transferAmount','categoryPie','categoryPieLegend','settlementHomeSection','settlementHomeList','homeCategoryPie','homeCategoryPieLegend','homeSortPanel','homeSortList','editIncomeForm','editIncomeAmount','editIncomeCategory','editIncomeDate','editIncomeMemo','monthlyYearLabel','monthlyMonthGrid','monthlyExpenseBtn','monthlyIncomeBtn','monthlySelectedLabel','monthlyTotal','monthlyCount','monthlyExpenseBreakdown','monthlyNeed','monthlyFun','monthlyListTitle','monthlyHistoryList'
];
const el = {};
ids.forEach(id => el[id] = $(id));

const state = {
  get expenses(){ try{return JSON.parse(localStorage.getItem('kaokane_expenses')||'[]')}catch{return []} },
  set expenses(v){ localStorage.setItem('kaokane_expenses',JSON.stringify(v)) },
  get incomes(){ try{return JSON.parse(localStorage.getItem('kaokane_incomes')||'[]')}catch{return []} },
  set incomes(v){ localStorage.setItem('kaokane_incomes',JSON.stringify(v)) },
  get assets(){ try{return JSON.parse(localStorage.getItem('kaokane_assets')||'{"bank":0,"cash":0,"bankUpdated":null}')}catch{return {bank:0,cash:0,bankUpdated:null}} },
  set assets(v){ localStorage.setItem('kaokane_assets',JSON.stringify(v)) },
  get threshold(){ return Number(localStorage.getItem('kaokane_threshold')||10000) },
  set threshold(v){ localStorage.setItem('kaokane_threshold',String(v)) },
  get paymentMap(){
    const defaults={'現金':'cash','Amazonカード':'bank','dカード':'bank','PayPay':'bank','イオンカード':'bank','d払い':'bank','銀行口座':'bank','その他':'none'};
    try{return {...defaults,...JSON.parse(localStorage.getItem('kaokane_payment_map')||'{}')}}catch{return defaults}
  },
  set paymentMap(v){ localStorage.setItem('kaokane_payment_map',JSON.stringify(v)) },
  get balanceHistory(){ try{return JSON.parse(localStorage.getItem('kaokane_balance_history')||'[]')}catch{return []} },
  set balanceHistory(v){ localStorage.setItem('kaokane_balance_history',JSON.stringify(v)) },
  get recurring(){ try{return JSON.parse(localStorage.getItem('kaokane_recurring')||'[]')}catch{return []} },
  set recurring(v){ localStorage.setItem('kaokane_recurring',JSON.stringify(v)) },
  get settlements(){ try{return JSON.parse(localStorage.getItem('kaokane_settlements')||'[]')}catch{return []} },
  set settlements(v){ localStorage.setItem('kaokane_settlements',JSON.stringify(v)) },
  get balanceAdjustments(){
    try{return JSON.parse(localStorage.getItem('kaokane_balance_adjustments')||'[]')}catch{return []}
  },
  set balanceAdjustments(v){ localStorage.setItem('kaokane_balance_adjustments',JSON.stringify(v)) },
  get homeOrder(){
    const defaults=['summary','expenseEntry','income','settlement','categoryPie','recentExpense'];
    try{
      const saved=JSON.parse(localStorage.getItem('kaokane_home_order')||'[]');
      return [...saved,...defaults.filter(x=>!saved.includes(x))].filter((x,i,a)=>a.indexOf(x)===i);
    }catch{return defaults}
  },
  set homeOrder(v){ localStorage.setItem('kaokane_home_order',JSON.stringify(v)) }
};

let expenseType='必要', editExpenseType='必要', historyFilter='all', historyKind='expense', arcadeSum=0, bulkMode=false, selectedExpenseIds=new Set(), chartMode='expense', incomeBulkMode=false, selectedIncomeIds=new Set(), editingIncomeId=null, monthlyYear=new Date().getFullYear(), monthlyMonth=new Date().getMonth()+1, monthlyHistoryKind='expense';
const yen=n=>'¥'+Number(n||0).toLocaleString('ja-JP');
const today=()=>{ const d=new Date(); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; };
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));


let activeNumericInput=null;
let keypadBuffer='';

function isSignedNumericInput(input){
  return input && (input.id==='bankInput' || input.id==='cashInput');
}
function openKaokaneKeypad(input){
  if(!input)return;
  const backdrop=document.getElementById('kaokaneKeypadBackdrop');
  const valueEl=document.getElementById('kaokaneKeypadValue');
  const signEl=document.getElementById('kaokaneKeypadSign');
  if(!backdrop||!valueEl)return;

  if(document.activeElement && document.activeElement!==document.body){
    try{document.activeElement.blur();}catch{}
  }

  activeNumericInput=input;
  keypadBuffer=String(input.value||'');
  if(keypadBuffer==='0')keypadBuffer='';

  if(signEl){
    signEl.classList.toggle('hidden',!isSignedNumericInput(input));
  }

  const shown=keypadBuffer===''?0:keypadBuffer;
  valueEl.textContent=Number(shown||0).toLocaleString('ja-JP');
  backdrop.classList.remove('hidden');
  document.body.style.overflow='hidden';
}
function updateKaokaneKeypadDisplay(){
  const valueEl=document.getElementById('kaokaneKeypadValue');
  if(!valueEl)return;
  const shown=keypadBuffer===''?0:keypadBuffer;
  valueEl.textContent=Number(shown||0).toLocaleString('ja-JP');
}
function keypadDigit(d){
  if(!activeNumericInput)return;
  const negative=keypadBuffer.startsWith('-');
  let body=negative?keypadBuffer.slice(1):keypadBuffer;
  body=(body==='0'?'':body)+d;
  body=body.replace(/^0+(?=\d)/,'');
  keypadBuffer=(negative?'-':'')+body;
  updateKaokaneKeypadDisplay();
}
function keypadBackspace(){
  if(!activeNumericInput)return;
  keypadBuffer=keypadBuffer.slice(0,-1);
  if(keypadBuffer==='-')keypadBuffer='';
  updateKaokaneKeypadDisplay();
}
function keypadClear(){
  keypadBuffer='';
  updateKaokaneKeypadDisplay();
}
function keypadToggleSign(){
  if(!activeNumericInput||!isSignedNumericInput(activeNumericInput))return;
  if(keypadBuffer.startsWith('-'))keypadBuffer=keypadBuffer.slice(1);
  else keypadBuffer='-'+(keypadBuffer||'0');
  updateKaokaneKeypadDisplay();
}
function finishKaokaneKeypad(){
  if(!activeNumericInput)return;
  activeNumericInput.value=keypadBuffer===''?'':keypadBuffer;
  activeNumericInput.dispatchEvent(new Event('input',{bubbles:true}));
  activeNumericInput.dispatchEvent(new Event('change',{bubbles:true}));
  const backdrop=document.getElementById('kaokaneKeypadBackdrop');
  if(backdrop)backdrop.classList.add('hidden');
  document.body.style.overflow='';
  activeNumericInput=null;
}
function closeKaokaneKeypad(event){
  const backdrop=document.getElementById('kaokaneKeypadBackdrop');
  if(event && backdrop && event.target!==backdrop)return;
  finishKaokaneKeypad();
}
function bindCustomNumericKeypad(){
  document.querySelectorAll('input[type="number"]').forEach(input=>{
    input.removeAttribute('readonly');
    input.setAttribute('inputmode','none');
    input.classList.add('kaokane-numeric-input');
  });

  const handler=(e)=>{
    const input=e.target.closest?.('input[type="number"]');
    if(!input)return;
    e.preventDefault();
    e.stopPropagation();
    openKaokaneKeypad(input);
  };

  document.addEventListener('pointerdown',handler,{passive:false});
  document.addEventListener('touchstart',handler,{passive:false});
  document.addEventListener('click',handler);
}
function setup(){
  bindCustomNumericKeypad();
  if(el.editIncomeCategory) el.editIncomeCategory.innerHTML=incomeCategories.map(c=>`<option>${esc(c)}</option>`).join('');
  if(el.editIncomeForm) el.editIncomeForm.addEventListener('submit',saveIncomeEdit);
  el.category.innerHTML=categories.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  el.payment.innerHTML=payments.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  el.incomeCategory.innerHTML=incomeCategories.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  el.editCategory.innerHTML=categories.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  el.editPayment.innerHTML=payments.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  el.date.value=today(); el.incomeDate.value=today(); el.thresholdInput.value=state.threshold; el.thresholdDisplay.textContent=yen(state.threshold);
  tagHomeBlocks();
  migrateDataSafely();
  processRecurringExpenses();
  if(state.balanceHistory.length===0) recordBalanceSnapshot('manual');
  const resumeArcade=restoreArcadeSession();
  render();
  if(resumeArcade) setTimeout(()=>go('arcade'),80);
}

function go(id){
  document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
  const target=$(id); if(target) target.classList.add('active');
  document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.go===id));
  if(id==='arcade' || id==='edit') document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));
  render();
  if(id==='monthlyHistory') renderMonthlyHistory();
  window.scrollTo({top:0,behavior:'smooth'});
}

function pickType(v){
  expenseType=v;
  el.needBtn.classList.toggle('selected',v==='必要');
  el.funBtn.classList.toggle('selected',v==='娯楽');
}
function pickEditType(v){
  editExpenseType=v;
  el.editNeedBtn.classList.toggle('selected',v==='必要');
  el.editFunBtn.classList.toggle('selected',v==='娯楽');
}

el.amount.addEventListener('input',()=>{
  el.highWarn.classList.toggle('hidden', Number(el.amount.value||0) < state.threshold);
});
el.editAmount.addEventListener('input',()=>{
  el.editHighWarn.classList.toggle('hidden', Number(el.editAmount.value||0) < state.threshold);
});

el.expenseForm.addEventListener('submit',e=>{
  e.preventDefault();
  const amt=Number(el.amount.value);
  if(!amt || amt<=0){ alert('金額を入力してください。'); return; }
  const mem=el.memo.value.trim();
  if(amt>=state.threshold && !mem){ alert('高額支出はメモ必須です。何を購入したか入力してください。'); return; }

  const item={id:uid(),amount:amt,category:el.category.value,type:expenseType,payment:el.payment.value,
    date:el.date.value||today(),memo:mem,approx:el.approx.checked,unorganized:false,createdAt:new Date().toISOString(),
    splits:getSplitData(false),balanceTarget:assetTargetForPayment(el.payment.value)};
  const xs=state.expenses; xs.push(item); state.expenses=xs;

  applyExpenseBalance(item.payment,amt,-1);
  el.expenseForm.reset(); el.recurringEnabled.checked=false; el.recurringUnit.value='monthly'; el.recurringEvery.value=1; el.recurringAddPanel.classList.add('hidden'); el.date.value=today(); pickType('必要'); clearSplitRows(false); el.splitEditor.classList.add('hidden'); render(); go('home');
});

el.incomeForm.addEventListener('submit',e=>{
  e.preventDefault();
  const amt=Number(el.incomeAmount.value);
  if(!amt || amt<=0){ alert('金額を入力してください。'); return; }
  const xs=state.incomes;
  xs.push({id:uid(),amount:amt,category:el.incomeCategory.value,date:el.incomeDate.value||today(),
    memo:el.incomeMemo.value.trim(),createdAt:new Date().toISOString()});
  state.incomes=xs;
  applyIncomeBalance(amt);
  el.incomeForm.reset(); el.incomeDate.value=today(); render(); go('home');
});

el.editExpenseForm.addEventListener('submit',e=>{
  e.preventDefault();
  const id=el.editId.value;
  const xs=state.expenses;
  const i=xs.findIndex(x=>x.id===id);
  if(i<0){ alert('支出が見つかりません。'); go('history'); return; }

  const old=xs[i];
  const amt=Number(el.editAmount.value);
  if(!amt || amt<=0){ alert('金額を入力してください。'); return; }
  const mem=el.editMemo.value.trim();
  if(amt>=state.threshold && !mem){ alert('高額支出はメモ必須です。何を購入したか入力してください。'); return; }

  // Undo old balance effect first.
  applyExpenseBalance(old.payment,old.amount,+1,old.balanceTarget||assetTargetForPayment(old.payment));

  const updated={
    ...old, amount:amt, category:el.editCategory.value, type:editExpenseType, payment:el.editPayment.value,
    date:el.editDate.value||today(), memo:mem, approx:el.editApprox.checked, unorganized:false,
    updatedAt:new Date().toISOString(), splits:getSplitData(true),
    balanceTarget:assetTargetForPayment(el.editPayment.value)
  };

  // Apply the edited balance effect.
  applyExpenseBalance(updated.payment,amt,-1,updated.balanceTarget);

  xs[i]=updated; state.expenses=xs;
  render(); go('history');
});

function openEdit(id){
  const x=state.expenses.find(v=>v.id===id);
  if(!x) return;
  el.editId.value=x.id;
  el.editAmount.value=x.amount;
  el.editCategory.value=categories.includes(x.category)?x.category:'その他';
  pickEditType(x.type==='娯楽'?'娯楽':'必要');
  el.editPayment.value=payments.includes(x.payment)?x.payment:'現金';
  el.editDate.value=x.date||today();
  el.editMemo.value=x.memo||'';
  el.editApprox.checked=!!x.approx;
  populateEditSplits(x.splits||[]);
  el.editHighWarn.classList.toggle('hidden',Number(x.amount||0)<state.threshold);
  const rr=state.recurring.find(r=>r.sourceExpenseId===x.id);el.editRecurringEnabled.checked=!!rr;el.editRecurringUnit.value=rr?.unit||'monthly';el.editRecurringEvery.value=rr?.every||1;el.recurringEditPanel.classList.add('hidden');
  go('edit');
}

function deleteCurrentExpense(){
  const id=el.editId.value;
  const xs=state.expenses;
  const i=xs.findIndex(x=>x.id===id);
  if(i<0) return;
  const x=xs[i];
  if(!confirm(`${yen(x.amount)} の支出を削除しますか？`)) return;

  applyExpenseBalance(x.payment,x.amount,+1,x.balanceTarget||assetTargetForPayment(x.payment));
  xs.splice(i,1); state.expenses=xs;
  render(); go('history');
}

function quickAmount(amt){
  const xs=state.expenses;
  xs.push({id:uid(),amount:amt,category:'未整理',type:null,payment:null,date:today(),memo:'',
    approx:false,unorganized:true,createdAt:new Date().toISOString()});
  state.expenses=xs; render();
}

function setHistoryFilter(v){ historyFilter=v; renderHistory(); }

function effectiveExpenseAmount(x){
  const refunded=(x.splits||[]).filter(s=>s.settled).reduce((sum,s)=>sum+Number(s.amount||0),0);
  return Math.max(0,Number(x.amount||0)-refunded);
}
function saveArcadeSession(){
  localStorage.setItem('kaokane_arcade_session',JSON.stringify({
    active:true,
    sum:arcadeSum,
    startedAt:localStorage.getItem('kaokane_arcade_started_at')||new Date().toISOString()
  }));
  if(!localStorage.getItem('kaokane_arcade_started_at')){
    localStorage.setItem('kaokane_arcade_started_at',new Date().toISOString());
  }
}
function clearArcadeSession(){
  localStorage.removeItem('kaokane_arcade_session');
  localStorage.removeItem('kaokane_arcade_started_at');
}
function restoreArcadeSession(){
  try{
    const s=JSON.parse(localStorage.getItem('kaokane_arcade_session')||'null');
    if(s && s.active){
      arcadeSum=Number(s.sum||0);
      el.arcadeTotal.textContent=yen(arcadeSum);
      return true;
    }
  }catch{}
  return false;
}
function startArcade(){
  arcadeSum=0;
  el.arcadeTotal.textContent=yen(0);
  localStorage.setItem('kaokane_arcade_started_at',new Date().toISOString());
  saveArcadeSession();
  go('arcade');
}
function arcadeAdd(n){
  arcadeSum+=n;
  el.arcadeTotal.textContent=yen(arcadeSum);
  saveArcadeSession();
}
function finishArcade(){
  if(!arcadeSum){ cancelArcade(); return; }
  const xs=state.expenses;
  xs.push({id:uid(),amount:arcadeSum,category:'交際費',type:'娯楽',payment:'現金',date:today(),
    memo:'ゲームセンター',approx:false,unorganized:false,createdAt:new Date().toISOString(),splits:[],balanceTarget:'cash'});
  state.expenses=xs;
  applyExpenseBalance('現金',arcadeSum,-1);
  arcadeSum=0;
  clearArcadeSession();
  go('home');
}
function cancelArcade(){
  arcadeSum=0;
  clearArcadeSession();
  go('home');
}


function recordBalanceAdjustment(target,before,after){
  before=Number(before||0); after=Number(after||0);
  if(before===after)return;
  const arr=state.balanceAdjustments;
  arr.push({
    id:uid(),
    target,
    before,
    after,
    delta:after-before,
    date:today(),
    ts:new Date().toISOString()
  });
  state.balanceAdjustments=arr.slice(-500);
}
function toggleBalanceAdjustmentHistory(force){
  const panel=el.balanceAdjustmentHistoryPanel;
  if(!panel)return;
  const show=typeof force==='boolean'?force:panel.classList.contains('hidden');
  panel.classList.toggle('hidden',!show);
  if(show)renderBalanceAdjustmentHistory();
}
function formatAdjustmentDate(ts){
  try{
    const d=new Date(ts);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }catch{return ''}
}
function renderBalanceAdjustmentHistory(){
  const box=el.balanceAdjustmentHistoryList;
  if(!box)return;
  const xs=state.balanceAdjustments.slice().sort((a,b)=>(b.ts||'').localeCompare(a.ts||''));
  if(!xs.length){
    box.innerHTML='<div class="note">まだ残高の手動修正履歴はありません。</div>';
    return;
  }
  box.innerHTML=xs.map(x=>{
    const name=x.target==='bank'?'生活口座':'現金';
    const delta=Number(x.delta||0);
    const deltaText=(delta>0?'+':'')+yen(delta);
    return `<div class="balance-adjustment-row">
      <div class="balance-adjustment-head">
        <div class="balance-adjustment-target">${name}</div>
        <div class="balance-adjustment-delta">${deltaText}</div>
      </div>
      <div class="balance-adjustment-meta">
        ${formatAdjustmentDate(x.ts)}<br>
        ${yen(x.before)} → ${yen(x.after)}
      </div>
    </div>`;
  }).join('');
}
function updateBank(){
  const a=state.assets;
  const before=Number(a.bank||0), after=Number(el.bankInput.value||0);
  a.bank=after; a.bankUpdated=today(); state.assets=a;
  recordBalanceAdjustment('bank',before,after);
  el.bankInput.value=''; recordBalanceSnapshot('manual'); renderAssets(); renderBalanceAdjustmentHistory(); toggleBalanceAdjust(false);
}
function updateCash(){
  const a=state.assets;
  const before=Number(a.cash||0), after=Number(el.cashInput.value||0);
  a.cash=after; state.assets=a;
  recordBalanceAdjustment('cash',before,after);
  el.cashInput.value=''; recordBalanceSnapshot('manual'); renderAssets(); renderBalanceAdjustmentHistory(); toggleBalanceAdjust(false);
}
function saveThreshold(){
  state.threshold=Math.max(1000,Number(el.thresholdInput.value||10000));
  el.thresholdInput.value=state.threshold;
  el.thresholdDisplay.textContent=yen(state.threshold);
  toggleThresholdEdit(false);
  render();
  alert(`${state.threshold.toLocaleString('ja-JP')}円に設定しました。`);
}
function resetAllData(){
  if(!confirm('カオカネの支出・収入・資産データをすべて削除します。元に戻せません。実行しますか？')) return;
  if(!confirm('本当に初期化しますか？')) return;
  ['kaokane_expenses','kaokane_incomes','kaokane_assets'].forEach(k=>localStorage.removeItem(k));
  render();
  alert('データを初期化しました。');
  go('home');
}




function assetTargetForPayment(payment){
  return state.paymentMap[payment] || 'none';
}
function applyExpenseBalance(payment,amount,direction=-1,explicitTarget=null){
  const target=explicitTarget || assetTargetForPayment(payment);
  if(target==='none') return;
  const a=state.assets;
  if(target==='cash') a.cash=Number(a.cash||0)+(direction*Number(amount||0));
  if(target==='bank') a.bank=Number(a.bank||0)+(direction*Number(amount||0));
  state.assets=a;
  recordBalanceSnapshot('auto');
}
function applyIncomeBalance(amount){
  const a=state.assets;
  a.bank=Number(a.bank||0)+Number(amount||0);
  state.assets=a;
  recordBalanceSnapshot('auto');
}
function renderPaymentMap(){
  if(!el.paymentMapList) return;
  const map=state.paymentMap;
  el.paymentMapList.innerHTML=payments.map(p=>`
    <div class="mapping-row">
      <div>
        <div class="mapping-name">${esc(p)}</div>
        <div class="asset-hint">${p==='現金'?'現金残高':p==='銀行口座'?'生活口座':'支出登録時に指定残高を減算'}</div>
      </div>
      <select onchange="savePaymentMap('${esc(p)}',this.value)">
        <option value="bank" ${map[p]==='bank'?'selected':''}>生活口座</option>
        <option value="cash" ${map[p]==='cash'?'selected':''}>現金</option>
        <option value="none" ${map[p]==='none'?'selected':''}>連動しない</option>
      </select>
    </div>`).join('');
}
function savePaymentMap(payment,target){
  const map=state.paymentMap;
  map[payment]=target;
  state.paymentMap=map;
}



function toggleHomeSortPanel(force){
  const show=typeof force==='boolean'?force:el.homeSortPanel.classList.contains('hidden');
  el.homeSortPanel.classList.toggle('hidden',!show);
  if(show)renderHomeSortList();
}
function homeBlockLabel(key){
  return {
    summary:'今月の支出',
    expenseEntry:'支出を記録',
    income:'今月の収入',
    settlement:'精算待ち',
    categoryPie:'今月の支出内訳',
    recentExpense:'最近の支出'
  }[key]||key;
}
function renderHomeSortList(){
  if(!el.homeSortList)return;
  const order=state.homeOrder;
  el.homeSortList.innerHTML=order.map((k,i)=>`
    <div class="home-sort-row">
      <strong>${esc(homeBlockLabel(k))}</strong>
      <button class="sort-btn" onclick="moveHomeBlock(${i},-1)" ${i===0?'disabled':''}>↑</button>
      <button class="sort-btn" onclick="moveHomeBlock(${i},1)" ${i===order.length-1?'disabled':''}>↓</button>
    </div>`).join('');
}
function moveHomeBlock(index,dir){
  const order=state.homeOrder, j=index+dir;
  if(j<0||j>=order.length)return;
  [order[index],order[j]]=[order[j],order[index]];
  state.homeOrder=order;
  applyHomeOrder();renderHomeSortList();
}
function applyHomeOrder(){
  const home=$('home');
  if(!home)return;
  const map={};
  [...home.querySelectorAll('[data-home-block]')].forEach(node=>map[node.dataset.homeBlock]=node);
  state.homeOrder.forEach(k=>{if(map[k])home.appendChild(map[k]);});
}
function renderHomeCategoryPie(){
  drawSmartPie(el.homeCategoryPie,el.homeCategoryPieLegend,'#fff');
}

function tagHomeBlocks(){
  const home=$('home'); if(!home)return;
  const sections=[...home.children];
  // Summary: first large card after title/header
  const summary=sections.find(x=>x.classList&&x.classList.contains('card')&&x.querySelector('#monthTotal'));
  if(summary)summary.dataset.homeBlock='summary';
  const expenseTitle=sections.find(x=>x.classList&&x.classList.contains('section-title')&&x.textContent.includes('支出を記録'));
  if(expenseTitle){
    const wrap=document.createElement('div');wrap.dataset.homeBlock='expenseEntry';
    home.insertBefore(wrap,expenseTitle);wrap.appendChild(expenseTitle);
    if(wrap.nextElementSibling)wrap.appendChild(wrap.nextElementSibling);
  }
  const incomeTitle=[...home.querySelectorAll('.section-title')].find(x=>x.textContent.includes('今月の収入'));
  if(incomeTitle&&!incomeTitle.parentElement.dataset.homeBlock){
    const wrap=document.createElement('div');wrap.dataset.homeBlock='income';
    home.insertBefore(wrap,incomeTitle);wrap.appendChild(incomeTitle);
    if(wrap.nextElementSibling)wrap.appendChild(wrap.nextElementSibling);
  }
  const settlement=el.settlementHomeSection;if(settlement)settlement.dataset.homeBlock='settlement';
  const pie=el.homeCategoryPie?.closest('[data-home-block="categoryPie"]');
  if(pie)pie.dataset.homeBlock='categoryPie';
  const recentTitle=[...home.querySelectorAll('.section-title')].find(x=>x.textContent.includes('最近の支出'));
  if(recentTitle&&!recentTitle.parentElement.dataset.homeBlock){
    const wrap=document.createElement('div');wrap.dataset.homeBlock='recentExpense';
    home.insertBefore(wrap,recentTitle);wrap.appendChild(recentTitle);
    if(wrap.nextElementSibling)wrap.appendChild(wrap.nextElementSibling);
  }
}

function toggleRecurringDetail(mode){
  const panel=mode==='edit'?el.recurringEditPanel:el.recurringAddPanel;
  panel.classList.toggle('hidden');
}
function addMonthsSafe(dateStr,n){
  const [y,m,d]=dateStr.split('-').map(Number),t=new Date(y,m-1+n,1),last=new Date(t.getFullYear(),t.getMonth()+1,0).getDate();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(Math.min(d,last)).padStart(2,'0')}`;
}
function addYearsSafe(dateStr,n){
  const [y,m,d]=dateStr.split('-').map(Number),last=new Date(y+n,m,0).getDate();
  return `${y+n}-${String(m).padStart(2,'0')}-${String(Math.min(d,last)).padStart(2,'0')}`;
}
function nextRecurringDate(d,u,e){return u==='yearly'?addYearsSafe(d,e):addMonthsSafe(d,e);}
function syncRecurringRuleFromExpense(item,enabled,unit,every){
  let rules=state.recurring.filter(r=>r.sourceExpenseId!==item.id);
  if(enabled){const e=Math.max(1,Number(every||1));rules.push({id:uid(),sourceExpenseId:item.id,active:true,amount:Number(item.amount),category:item.category,type:item.type,payment:item.payment,memo:item.memo||'',unit,every:e,nextDate:nextRecurringDate(item.date,unit,e)});}
  state.recurring=rules;
}
function processRecurringExpenses(){
  const rules=state.recurring;if(!rules.length)return;const xs=state.expenses;let changed=false;
  rules.forEach(r=>{if(!r.active)return;let guard=0;while(r.nextDate<=today()&&guard++<60){
    const item={id:uid(),amount:Number(r.amount),category:r.category,type:r.type,payment:r.payment,date:r.nextDate,memo:r.memo||'',approx:false,unorganized:false,createdAt:new Date().toISOString(),splits:[],recurringRuleId:r.id,autoRecurring:true,balanceTarget:assetTargetForPayment(r.payment)};
    xs.push(item);applyExpenseBalance(item.payment,item.amount,-1);r.nextDate=nextRecurringDate(r.nextDate,r.unit,Number(r.every||1));changed=true;
  }});
  if(changed){state.expenses=xs;state.recurring=rules;}
}
function toggleTransferPanel(force){
  const show=typeof force==='boolean'?force:el.transferPanel.classList.contains('hidden');el.transferPanel.classList.toggle('hidden',!show);
}
function executeTransfer(){
  const amt=Number(el.transferAmount.value||0);if(!amt||amt<=0){alert('金額を入力してください。');return;}
  const a=state.assets;
  if(el.transferDirection.value==='bankToCash'){a.bank=Number(a.bank||0)-amt;a.cash=Number(a.cash||0)+amt;}
  else{a.cash=Number(a.cash||0)-amt;a.bank=Number(a.bank||0)+amt;}
  state.assets=a;recordBalanceSnapshot('transfer');el.transferAmount.value='';renderAssets();renderFinanceChart();toggleTransferPanel(false);
}
function addPaybackReminder(){
  const name=prompt('返金する相手の名前');if(name===null)return;const amount=Number(prompt('返金する金額')||0);if(!amount)return;
  const arr=state.settlements;arr.push({id:uid(),kind:'pay',name:name||'相手',amount,date:today(),settled:false});state.settlements=arr;renderSettlementHome();
}
function renderSettlementHome(){
  if(!el.settlementHomeSection||!el.settlementHomeList)return;
  const pending=[];
  state.expenses.forEach(x=>(x.splits||[]).forEach((s,i)=>{
    if(!s.settled)pending.push({
      id:`split:${x.id}:${i}`,kind:'receive',name:s.name||'相手',
      amount:Number(s.amount||0),date:x.date,expenseId:x.id,index:i,
      memo:x.memo||x.category||'支出'
    });
  }));
  state.settlements.filter(s=>!s.settled).forEach(s=>pending.push(s));
  el.settlementHomeSection.classList.toggle('hidden',pending.length===0);
  if(!pending.length){el.settlementHomeList.innerHTML='';return;}
  const receiveCount=pending.filter(p=>p.kind==='receive').length;
  const payCount=pending.filter(p=>p.kind==='pay').length;
  el.settlementHomeList.innerHTML=
    `<div class="note" style="margin-top:10px">受取待ち ${receiveCount}件 · 返金待ち ${payCount}件</div>`+
    pending.map(p=>`
      <div class="pending-card">
        <div class="pending-title">${p.kind==='pay'?'自分が返金する':'返金をもらう'} · ${esc(p.name||'相手')}</div>
        <div class="pending-meta">${yen(p.amount)} · ${esc(p.date||'')}${p.memo?` · ${esc(p.memo)}`:''}</div>
        <button class="mini-action" style="margin-top:8px"
          onclick="settlePending('${p.kind}','${p.id}','${p.expenseId||''}',${Number.isInteger(p.index)?p.index:-1})">
          ${p.kind==='pay'?'返金した':'返金された'}
        </button>
      </div>`).join('');
}
function settlePending(kind,id,expenseId,index){
  if(kind==='receive')markSplitSettled(expenseId,index);else{const arr=state.settlements,x=arr.find(s=>s.id===id);if(x)x.settled=true;state.settlements=arr;}render();
}
function migrateDataSafely(){
  // Never delete user data during an app update.
  // Only add missing fields/defaults so older saved records remain valid.
  const xs=state.expenses;
  let changed=false;
  xs.forEach(x=>{
    if(!Array.isArray(x.splits)){x.splits=[];changed=true;}
    if(typeof x.approx!=='boolean'){x.approx=false;changed=true;}
    if(typeof x.unorganized!=='boolean'){x.unorganized=false;changed=true;}
    if(!('balanceTarget' in x)){x.balanceTarget=assetTargetForPayment(x.payment);changed=true;}
  });
  if(changed) state.expenses=xs;

  const inc=state.incomes;
  let incChanged=false;
  inc.forEach(x=>{
    if(!x.id){x.id=uid();incChanged=true;}
    if(!x.createdAt){x.createdAt=new Date((x.date||today())+'T12:00:00').toISOString();incChanged=true;}
  });
  if(incChanged) state.incomes=inc;
}
function recordBalanceSnapshot(reason='auto'){
  const a=state.assets;
  const arr=state.balanceHistory;
  arr.push({date:today(),bank:Number(a.bank||0),cash:Number(a.cash||0),total:Number(a.bank||0)+Number(a.cash||0),reason,ts:new Date().toISOString()});
  // Keep one latest snapshot per calendar day for ordinary auto updates, while preserving manual snapshots.
  const byDate=new Map();
  arr.forEach(x=>{
    const key=x.date+'|'+(x.reason==='manual'?'manual':'auto');
    byDate.set(key,x);
  });
  state.balanceHistory=[...byDate.values()].sort((a,b)=>(a.ts||'').localeCompare(b.ts||'')).slice(-800);
}
function togglePaymentMapPanel(force){
  const show=typeof force==='boolean'?force:el.paymentMapPanel.classList.contains('hidden');
  el.paymentMapPanel.classList.toggle('hidden',!show);
  if(show) renderPaymentMap();
}
function toggleAnalytics(force){
  const show=typeof force==='boolean'?force:el.analyticsPanel.classList.contains('hidden');
  el.analyticsPanel.classList.toggle('hidden',!show);
  if(show){
    setTimeout(()=>{
      renderFinanceChart();
      renderCategoryPie();
    },60);
  }
}
function setChartMode(mode){
  chartMode=mode;
  el.chartExpenseBtn.classList.toggle('active',mode==='expense');
  el.chartIncomeBtn.classList.toggle('active',mode==='income');
  el.chartBalanceBtn.classList.toggle('active',mode==='balance');
  renderFinanceChart();

  renderCategoryPie();
}
function monthKey(d){
  return String(d||'').slice(0,7);
}
function recentMonthKeys(count=6){
  const now=new Date();
  const arr=[];
  for(let i=count-1;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    arr.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  return arr;
}
function renderFinanceChart(){
  const canvas=el.financeChart;
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#fafafa';ctx.fillRect(0,0,W,H);

  const months=recentMonthKeys(6);
  let values=[];
  let note='';

  if(chartMode==='expense'){
    values=months.map(m=>state.expenses.filter(x=>!x.unorganized && monthKey(x.date)===m).reduce((s,x)=>s+effectiveExpenseAmount(x),0));
    note='月ごとの実質支出（受取済の立替返金分を除外）';
  }else if(chartMode==='income'){
    values=months.map(m=>state.incomes.filter(x=>monthKey(x.date)===m).reduce((s,x)=>s+Number(x.amount||0),0));
    note='月ごとの収入';
  }else{
    const hist=state.balanceHistory;
    values=months.map(m=>{
      const candidates=hist.filter(x=>monthKey(x.date)===m);
      if(candidates.length) return Number(candidates[candidates.length-1].total||0);
      return null;
    });
    // Current month always reflects live balances, even if an older snapshot exists.
    const current=monthKey(today());
    const idx=months.indexOf(current);
    if(idx>=0){
      const a=state.assets;
      values[idx]=Number(a.bank||0)+Number(a.cash||0);
    }
    note='残高＝生活口座＋現金の合算（今月は現在残高）';
  }
  el.chartNote.textContent=note;

  const numeric=values.filter(v=>v!=null);
  const rawMax=Math.max(0,...numeric);
  const rawMin=chartMode==='balance'&&numeric.length?Math.min(...numeric):0;

  function currencyStep(range){
    const target=Math.max(1,Math.abs(range)/4);
    const power=Math.pow(10,Math.floor(Math.log10(target)));
    const n=target/power;
    const unit=n<=1?1:n<=2?2:n<=5?5:10;
    return unit*power;
  }

  let min=0,max=0,step=1;
  if(chartMode==='balance'){
    // Residual balances often cluster tightly; anchor to clean currency levels.
    const spread=Math.max(1,rawMax-rawMin);
    step=currencyStep(spread);
    // If only one/few balance points exist, base the step on the balance magnitude too.
    if(spread < Math.max(1000,rawMax*0.02)){
      step=currencyStep(Math.max(1000,rawMax*0.08));
    }
    min=Math.floor(rawMin/step)*step;
    max=Math.ceil(rawMax/step)*step;
    if(max===min)max=min+step*4;
    // Keep roughly 3–6 grid intervals.
    while((max-min)/step>6)step*=2;
    min=Math.floor(rawMin/step)*step;
    max=Math.ceil(rawMax/step)*step;
  }else{
    step=currencyStep(Math.max(1,rawMax));
    min=0;
    max=Math.ceil(rawMax/step)*step;
    if(max===0)max=step*4;
    while(max/step>6)step*=2;
    max=Math.ceil(rawMax/step)*step || step*4;
  }

  const padL=82,padR=24,padT=28,padB=54;
  const gw=W-padL-padR, gh=H-padT-padB;

  // axes/grid
  ctx.strokeStyle='#dddddd';ctx.lineWidth=1;
  ctx.fillStyle='#777';ctx.font='18px -apple-system, sans-serif';
  ctx.textAlign='right';
  const tickCount=Math.max(1,Math.round((max-min)/step));
  for(let i=0;i<=tickCount;i++){
    const val=max-step*i;
    const y=padT+gh*((max-val)/Math.max(1,max-min));
    ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke();
    ctx.fillText('¥'+Math.round(val).toLocaleString('ja-JP'),padL-10,y+6);
  }

  ctx.textAlign='center';
  months.forEach((m,i)=>{
    const x=padL+(gw*(i+.5)/months.length);
    ctx.fillStyle='#777';
    ctx.fillText(Number(m.slice(5))+'月',x,H-22);
  });

  if(chartMode==='balance'){
    ctx.strokeStyle='#111';ctx.lineWidth=5;ctx.lineJoin='round';ctx.lineCap='round';
    let started=false;
    ctx.beginPath();
    values.forEach((v,i)=>{
      if(v==null) return;
      const x=padL+(gw*(i+.5)/months.length);
      const y=padT+gh*(max-v)/(Math.max(1,max-min));
      if(!started){ctx.moveTo(x,y);started=true}else ctx.lineTo(x,y);
    });
    ctx.stroke();
    values.forEach((v,i)=>{
      if(v==null)return;
      const x=padL+(gw*(i+.5)/months.length);
      const y=padT+gh*(max-v)/(Math.max(1,max-min));
      ctx.fillStyle='#d96b62';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();
    });
  }else{
    const bw=gw/months.length*0.54;
    values.forEach((v,i)=>{
      const x=padL+(gw*(i+.5)/months.length)-bw/2;
      const h=gh*(v/max);
      ctx.fillStyle='#303030';
      ctx.beginPath();
      const y=padT+gh-h;
      const r=8;
      ctx.roundRect(x,y,bw,h,r);
      ctx.fill();
      if(v>0){
        ctx.fillStyle='#333';ctx.font='16px -apple-system, sans-serif';ctx.textAlign='center';
        ctx.fillText('¥'+Number(v).toLocaleString('ja-JP'),x+bw/2,Math.max(18,y-8));
      }
    });
  }
}


function prepareHiDPICanvas(canvas,cssSize){
  const dpr=Math.max(1,Math.min(3,window.devicePixelRatio||1));
  const size=cssSize||132;
  canvas.style.width=size+'px';
  canvas.style.height=size+'px';
  canvas.width=Math.round(size*dpr);
  canvas.height=Math.round(size*dpr);
  const ctx=canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,W:size,H:size};
}
function pieDataForCurrentMonth(){
  const current=monthKey(today()),totals={};
  state.expenses.filter(x=>!x.unorganized&&monthKey(x.date)===current).forEach(x=>{
    totals[x.category]=(totals[x.category]||0)+effectiveExpenseAmount(x);
  });
  const rows=Object.entries(totals).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  return {rows,total:rows.reduce((s,[,v])=>s+v,0)};
}
function drawSmartPie(canvas,legend,centerBg='#f1f2f4'){
  if(!canvas||!legend)return;
  const {ctx,W,H}=prepareHiDPICanvas(canvas,132);
  ctx.clearRect(0,0,W,H);
  const {rows,total}=pieDataForCurrentMonth();
  if(!total){
    const cx=W/2,cy=H/2,outer=W*.46,inner=W*.29;
    ctx.beginPath();
    ctx.arc(cx,cy,outer,0,Math.PI*2);
    ctx.arc(cx,cy,inner,0,Math.PI*2,true);
    ctx.closePath();
    ctx.fillStyle='#e4e6e9';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx,cy,inner-1,0,Math.PI*2);
    ctx.fillStyle=centerBg;
    ctx.fill();
    legend.innerHTML=`<div class="empty-pie-note">
      <div class="empty-pie-title">今月の支出はありません</div>
      <div class="empty-pie-amount">¥0</div>
    </div>`;
    return;
  }
  const colors=['#e2766d','#525b68','#8e96a0','#b3a79e','#738177','#a08a8a','#6d7075','#c3bbb2','#59616a','#aaaeb3'];
  const cx=W/2,cy=H/2,outer=W*.46,inner=W*.29;
  let angle=-Math.PI/2;
  rows.forEach(([name,val],i)=>{
    const next=angle+(val/total)*Math.PI*2;
    ctx.beginPath();
    ctx.arc(cx,cy,outer,angle,next);
    ctx.arc(cx,cy,inner,next,angle,true);
    ctx.closePath();
    ctx.fillStyle=colors[i%colors.length];
    ctx.fill();
    angle=next;
  });
  ctx.beginPath();
  ctx.arc(cx,cy,inner-1,0,Math.PI*2);
  ctx.fillStyle=centerBg;
  ctx.fill();

  ctx.fillStyle='#202124';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.font='700 10px -apple-system,BlinkMacSystemFont,sans-serif';
  ctx.fillText('今月',cx,cy-9);
  ctx.font='800 13px -apple-system,BlinkMacSystemFont,sans-serif';
  const totalLabel='¥'+total.toLocaleString('ja-JP');
  ctx.fillText(totalLabel.length>10?'合計':totalLabel,cx,cy+9);

  legend.innerHTML=rows.map(([name,val],i)=>{
    const pct=Math.round(val/total*100);
    return `<div class="pie-row">
      <span class="pie-dot" style="background:${colors[i%colors.length]}"></span>
      <span class="pie-name">${esc(name)}</span>
      <span>
        <span class="pie-percent">${pct}%</span>
        <span class="pie-value"> · ${yen(val)}</span>
      </span>
    </div>`;
  }).join('');
}

function drawBreakdownPieFromRows(canvas,legend,rows,centerBg='#f1f2f4',emptyText='データはありません'){
  if(!canvas||!legend)return;
  const safeRows=rows.filter(([,v])=>Number(v)!==0);
  const absTotal=safeRows.reduce((s,[,v])=>s+Math.abs(Number(v||0)),0);
  const {ctx,W,H}=prepareHiDPICanvas(canvas,132);
  ctx.clearRect(0,0,W,H);

  if(!absTotal){
    const cx=W/2,cy=H/2,outer=W*.46,inner=W*.29;
    ctx.beginPath();
    ctx.arc(cx,cy,outer,0,Math.PI*2);
    ctx.arc(cx,cy,inner,0,Math.PI*2,true);
    ctx.closePath();
    ctx.fillStyle='#e4e6e9';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx,cy,inner-1,0,Math.PI*2);
    ctx.fillStyle=centerBg;
    ctx.fill();
    legend.innerHTML=`<div class="empty-pie-note">
      <div class="empty-pie-title">${esc(emptyText)}</div>
      <div class="empty-pie-amount">¥0</div>
    </div>`;
    return;
  }

  const colors=['#e2766d','#525b68','#8e96a0','#b3a79e','#738177','#a08a8a','#6d7075','#c3bbb2','#59616a','#aaaeb3'];
  const cx=W/2,cy=H/2,outer=W*.46,inner=W*.29;
  let angle=-Math.PI/2;
  safeRows.forEach(([name,val],i)=>{
    const next=angle+(Math.abs(Number(val))/absTotal)*Math.PI*2;
    ctx.beginPath();
    ctx.arc(cx,cy,outer,angle,next);
    ctx.arc(cx,cy,inner,next,angle,true);
    ctx.closePath();
    ctx.fillStyle=colors[i%colors.length];
    ctx.fill();
    angle=next;
  });

  ctx.beginPath();
  ctx.arc(cx,cy,inner-1,0,Math.PI*2);
  ctx.fillStyle=centerBg;
  ctx.fill();

  const signedTotal=safeRows.reduce((s,[,v])=>s+Number(v||0),0);
  ctx.fillStyle='#202124';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.font='700 10px -apple-system,BlinkMacSystemFont,sans-serif';
  ctx.fillText('合計',cx,cy-9);
  ctx.font='800 13px -apple-system,BlinkMacSystemFont,sans-serif';
  const totalLabel=yen(signedTotal);
  ctx.fillText(totalLabel.length>11?'表示中':totalLabel,cx,cy+9);

  legend.innerHTML=safeRows.map(([name,val],i)=>{
    const pct=Math.round(Math.abs(Number(val))/absTotal*100);
    return `<div class="pie-row">
      <span class="pie-dot" style="background:${colors[i%colors.length]}"></span>
      <span class="pie-name">${esc(name)}</span>
      <span>
        <span class="pie-percent">${pct}%</span>
        <span class="pie-value"> · ${yen(Number(val))}</span>
      </span>
    </div>`;
  }).join('');
}
function renderCategoryPie(){
  if(!el.categoryPie||!el.categoryPieLegend)return;
  if(chartMode==='expense'){
    if(el.analysisBreakdownTitle)el.analysisBreakdownTitle.textContent='今月の支出内訳';
    drawSmartPie(el.categoryPie,el.categoryPieLegend,'#f1f2f4');
    return;
  }

  if(chartMode==='income'){
    if(el.analysisBreakdownTitle)el.analysisBreakdownTitle.textContent='今月の収入内訳';
    const current=monthKey(today()),totals={};
    state.incomes.filter(x=>monthKey(x.date)===current).forEach(x=>{
      const name=x.category||'その他';
      totals[name]=(totals[name]||0)+Number(x.amount||0);
    });
    drawBreakdownPieFromRows(
      el.categoryPie,
      el.categoryPieLegend,
      Object.entries(totals).filter(([,v])=>v!==0).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])),
      '#f1f2f4',
      '今月の収入はありません'
    );
    return;
  }

  if(el.analysisBreakdownTitle)el.analysisBreakdownTitle.textContent='現在の残高内訳';
  const a=state.assets;
  const rows=[['生活口座',Number(a.bank||0)],['現金',Number(a.cash||0)]];
  drawBreakdownPieFromRows(
    el.categoryPie,
    el.categoryPieLegend,
    rows,
    '#f1f2f4',
    '残高はありません'
  );
}

function toggleThresholdEdit(force){
  const show=typeof force==='boolean'?force:el.thresholdEditPanel.classList.contains('hidden');
  el.thresholdEditPanel.classList.toggle('hidden',!show);
  if(show){ el.thresholdInput.value=state.threshold; setTimeout(()=>el.thresholdInput.focus(),120); }
}
function toggleBalanceAdjust(force){
  const show=typeof force==='boolean'?force:el.balanceAdjustPanel.classList.contains('hidden');
  el.balanceAdjustPanel.classList.toggle('hidden',!show);
}
function setHistoryKind(kind){
  historyKind=kind;
  bulkMode=false;
  selectedExpenseIds.clear();
  el.bulkControls.classList.add('hidden');
  el.histExpenseBtn.classList.toggle('active',kind==='expense');
  el.histIncomeBtn.classList.toggle('active',kind==='income');
  el.expenseFilters.classList.toggle('hidden',kind!=='expense');
  el.bulkModeBtn.classList.toggle('hidden',kind!=='expense');
  renderHistory();

  if(kind==='income'){
    bulkMode=false; selectedExpenseIds.clear();
  }else{
    incomeBulkMode=false; selectedIncomeIds.clear();
  }
  updateHistoryBulkButton();
}
function toggleSplitEditor(){
  const willShow=el.splitEditor.classList.contains('hidden');
  el.splitEditor.classList.toggle('hidden',!willShow);
  if(willShow && el.splitRows.children.length===0) addSplitRow();
}
function toggleEditSplitEditor(){
  const willShow=el.editSplitEditor.classList.contains('hidden');
  el.editSplitEditor.classList.toggle('hidden',!willShow);
  if(willShow && el.editSplitRows.children.length===0) addEditSplitRow();
}
function splitRowHTML(name='',amount='',settled=false){
  return `<div class="split-row">
    <input class="split-name" type="text" placeholder="相手の名前" value="${esc(name)}">
    <input class="split-amount" type="number" min="1" inputmode="numeric" placeholder="金額" value="${amount||''}">
    <button type="button" class="split-remove" onclick="this.parentElement.remove()">×</button>
    <input class="split-settled" type="hidden" value="${settled?'1':'0'}">
  </div>`;
}
function addSplitRow(){ el.splitRows.insertAdjacentHTML('beforeend',splitRowHTML()); }
function addEditSplitRow(){ el.editSplitRows.insertAdjacentHTML('beforeend',splitRowHTML()); }
function clearSplitRows(edit=false){ (edit?el.editSplitRows:el.splitRows).innerHTML=''; }
function getSplitData(edit=false){
  const root=edit?el.editSplitRows:el.splitRows;
  return [...root.querySelectorAll('.split-row')].map(r=>({
    id:uid(),
    name:r.querySelector('.split-name').value.trim(),
    amount:Number(r.querySelector('.split-amount').value||0),
    settled:r.querySelector('.split-settled')?.value==='1'
  })).filter(x=>x.name && x.amount>0);
}
function populateEditSplits(splits){
  clearSplitRows(true);
  splits.forEach(s=>el.editSplitRows.insertAdjacentHTML('beforeend',splitRowHTML(s.name,s.amount,!!s.settled)));
  el.editSplitEditor.classList.toggle('hidden',splits.length===0);
}
function markSplitSettled(expenseId,splitIndex){
  const xs=state.expenses;
  const x=xs.find(v=>v.id===expenseId);
  if(!x || !x.splits || !x.splits[splitIndex]) return;
  x.splits[splitIndex].settled=true;
  state.expenses=xs;
  render();
}
function toggleBulkMode(){
  bulkMode=!bulkMode;
  selectedExpenseIds.clear();
  el.bulkModeBtn.textContent=bulkMode?'選択終了':'複数選択';
  el.bulkControls.classList.toggle('hidden',!bulkMode);
  updateBulkInfo();
  renderHistory();
}

function toggleSelectExpense(id){
  if(!bulkMode) return;
  if(selectedExpenseIds.has(id)) selectedExpenseIds.delete(id);
  else selectedExpenseIds.add(id);
  updateBulkInfo();
  renderHistory();
}

function updateBulkInfo(){
  if(!el.bulkInfo) return;
  const n=selectedExpenseIds.size;
  el.bulkInfo.textContent=`${n}件選択中`;
  if(el.bulkDeleteBtn){
    el.bulkDeleteBtn.disabled=n===0;
    el.bulkDeleteBtn.style.opacity=n===0?'.45':'1';
  }
}

function bulkDelete(){
  const ids=[...selectedExpenseIds,'balanceAdjustmentHistoryPanel','balanceAdjustmentHistoryList'];
  if(ids.length===0) return;
  if(!confirm(`${ids.length}件の支出をまとめて削除しますか？`)) return;

  const xs=state.expenses;
  const deleting=xs.filter(x=>selectedExpenseIds.has(x.id));
  deleting.forEach(x=>applyExpenseBalance(x.payment,x.amount,+1,x.balanceTarget||assetTargetForPayment(x.payment)));

  state.expenses=xs.filter(x=>!selectedExpenseIds.has(x.id));
  selectedExpenseIds.clear();
  bulkMode=false;
  el.bulkModeBtn.textContent='複数選択';
  el.bulkControls.classList.add('hidden');
  render();
}

function isThisMonth(d){
  const x=new Date(d+'T00:00:00'), n=new Date();
  return x.getFullYear()===n.getFullYear() && x.getMonth()===n.getMonth();
}
function isLastMonthToSameDay(d){
  const n=new Date(), x=new Date(d+'T00:00:00');
  const last=new Date(n.getFullYear(),n.getMonth()-1,1);
  return x.getFullYear()===last.getFullYear() && x.getMonth()===last.getMonth()
    && x.getDate()<=Math.min(n.getDate(),new Date(last.getFullYear(),last.getMonth()+1,0).getDate());
}

function itemHTML(x){
  const flags=[
    x.unorganized?'<span class="pill danger">未整理</span>':'',
    x.approx?'<span class="pill">概算</span>':''
  ].join(' ');
  const refunded=(x.splits||[]).filter(s=>s.settled).reduce((sum,s)=>sum+Number(s.amount||0),0);
  const net=effectiveExpenseAmount(x);
  const refundNote=refunded>0?`実質負担 ${yen(net)}`:'';
  const recurringNote=x.autoRecurring?'定期支出':(state.recurring.some(r=>r.sourceExpenseId===x.id)?'定期設定あり':'');
  const sub=[x.date,x.category,x.type,x.payment,x.memo,recurringNote,refundNote].filter(Boolean).map(esc).join(' · ');
  const checked=selectedExpenseIds.has(x.id)?'checked':'';
  const checkbox=bulkMode?`<input class="bulk-check" type="checkbox" ${checked} onclick="event.stopPropagation();toggleSelectExpense('${esc(x.id)}')">`:'';
  const click=bulkMode?`toggleSelectExpense('${esc(x.id)}')`:`openEdit('${esc(x.id)}')`;
  return `<div class="item ${bulkMode?'selecting':''}" onclick="${click}" style="cursor:pointer">
    ${checkbox}
    <div class="item-main">
      <div class="item-title">${flags||esc(x.category)||'支出'}</div>
      <div class="item-sub">${sub}</div>
    </div>
    <div class="item-amount">${yen(x.amount)}</div>
  </div>`;
}

function incomeItemHTML(x){
  const sub=[x.date,x.category,x.memo].filter(Boolean).map(esc).join(' · ');
  return `<div class="item">
    <div class="item-main"><div class="item-title">${esc(x.category||'収入')}</div><div class="item-sub">${sub}</div></div>
    <div class="item-amount">${yen(x.amount)}</div>
  </div>`;
}


function openMonthlyHistory(){
  const now=new Date();
  monthlyYear=now.getFullYear();
  monthlyMonth=now.getMonth()+1;
  monthlyHistoryKind=historyKind==='income'?'income':'expense';
  renderMonthlyHistory();
  go('monthlyHistory');
}
function changeMonthlyYear(delta){
  monthlyYear+=Number(delta||0);
  renderMonthlyHistory();
}
function selectMonthlyMonth(month){
  monthlyMonth=Number(month);
  renderMonthlyHistory();
}
function setMonthlyHistoryKind(kind){
  monthlyHistoryKind=kind;
  renderMonthlyHistory();
}
function monthlyKey(year,month){
  return `${year}-${String(month).padStart(2,'0')}`;
}
function monthHasAnyData(year,month){
  const key=monthlyKey(year,month);
  return state.expenses.some(x=>monthKey(x.date)===key) || state.incomes.some(x=>monthKey(x.date)===key);
}
function renderMonthlyHistory(){
  if(!el.monthlyYearLabel)return;
  const key=monthlyKey(monthlyYear,monthlyMonth);

  el.monthlyYearLabel.textContent=`${monthlyYear}年`;
  el.monthlyMonthGrid.innerHTML=Array.from({length:12},(_,i)=>{
    const m=i+1;
    const active=m===monthlyMonth?'active':'';
    const has=monthHasAnyData(monthlyYear,m)?'has-data':'';
    return `<button class="monthly-month-btn ${active} ${has}" onclick="selectMonthlyMonth(${m})">${m}月</button>`;
  }).join('');

  el.monthlyExpenseBtn.classList.toggle('active',monthlyHistoryKind==='expense');
  el.monthlyIncomeBtn.classList.toggle('active',monthlyHistoryKind==='income');
  el.monthlySelectedLabel.textContent=`${monthlyYear}年${monthlyMonth}月`;

  if(monthlyHistoryKind==='income'){
    const xs=state.incomes
      .filter(x=>monthKey(x.date)===key)
      .sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||'').localeCompare(a.createdAt||''));
    const total=xs.reduce((s,x)=>s+Number(x.amount||0),0);
    el.monthlyTotal.textContent=yen(total);
    el.monthlyCount.textContent=`${xs.length}件`;
    el.monthlyExpenseBreakdown.classList.add('hidden');
    el.monthlyListTitle.textContent='収入一覧';
    el.monthlyHistoryList.innerHTML=xs.length?xs.map(x=>`
      <div class="item" onclick="openIncomeEdit('${x.id}')" style="cursor:pointer">
        <div class="item-main">
          <div class="item-title">${esc(x.category||'収入')}</div>
          <div class="item-sub">${[x.date,x.category,x.memo].filter(Boolean).map(esc).join(' · ')}</div>
        </div>
        <div class="item-amount">${yen(x.amount)}</div>
      </div>`).join(''):`<div class="monthly-empty">${monthlyYear}年${monthlyMonth}月の収入はありません。</div>`;
    return;
  }

  const xs=state.expenses
    .filter(x=>monthKey(x.date)===key)
    .sort((a,b)=>(b.date+(b.createdAt||'')).localeCompare(a.date+(a.createdAt||'')));
  const total=xs.reduce((s,x)=>s+effectiveExpenseAmount(x),0);
  const need=xs.filter(x=>x.type==='必要').reduce((s,x)=>s+effectiveExpenseAmount(x),0);
  const fun=xs.filter(x=>x.type==='娯楽').reduce((s,x)=>s+effectiveExpenseAmount(x),0);

  el.monthlyTotal.textContent=yen(total);
  el.monthlyCount.textContent=`${xs.length}件`;
  el.monthlyExpenseBreakdown.classList.remove('hidden');
  el.monthlyNeed.textContent=yen(need);
  el.monthlyFun.textContent=yen(fun);
  el.monthlyListTitle.textContent='支出一覧';
  el.monthlyHistoryList.innerHTML=xs.length?xs.map(x=>{
    const refunded=(x.splits||[]).filter(s=>s.settled).reduce((sum,s)=>sum+Number(s.amount||0),0);
    const refundNote=refunded>0?`実質負担 ${yen(effectiveExpenseAmount(x))}`:'';
    const recurringNote=x.autoRecurring?'定期支出':(state.recurring.some(r=>r.sourceExpenseId===x.id)?'定期設定あり':'');
    const sub=[x.date,x.category,x.type,x.payment,x.memo,recurringNote,refundNote].filter(Boolean).map(esc).join(' · ');
    return `<div class="history-item" onclick="openEdit('${x.id}')">
      <div class="history-main">
        <div class="history-amount">${yen(x.amount)}</div>
        <div class="history-sub">${sub}</div>
      </div>
    </div>`;
  }).join(''):`<div class="monthly-empty">${monthlyYear}年${monthlyMonth}月の支出はありません。</div>`;
}
function toggleHistoryBulkMode(){
  if(historyKind==='income'){
    toggleIncomeBulkMode();
  }else{
    toggleBulkMode();
  }
  updateHistoryBulkButton();
}
function updateHistoryBulkButton(){
  if(!el.bulkModeBtn)return;
  const active=historyKind==='income'?incomeBulkMode:bulkMode;
  el.bulkModeBtn.textContent=active?'完了':'複数選択';
}
function toggleIncomeBulkMode(){
  incomeBulkMode=!incomeBulkMode;
  if(!incomeBulkMode)selectedIncomeIds.clear();
  renderHistory();
}
function toggleIncomeSelected(id){
  if(selectedIncomeIds.has(id))selectedIncomeIds.delete(id);else selectedIncomeIds.add(id);
  renderHistory();
}
function deleteSelectedIncomes(){
  if(!selectedIncomeIds.size)return;
  if(!confirm(`${selectedIncomeIds.size}件の収入を削除しますか？`))return;
  const deleting=state.incomes.filter(x=>selectedIncomeIds.has(x.id));
  const total=deleting.reduce((s,x)=>s+Number(x.amount||0),0);
  state.incomes=state.incomes.filter(x=>!selectedIncomeIds.has(x.id));
  // Income had increased bank when recorded, so deletion reverses it.
  if(total>0){
    const a=state.assets;a.bank=Number(a.bank||0)-total;state.assets=a;recordBalanceSnapshot('auto');
  }
  selectedIncomeIds.clear();incomeBulkMode=false;render();
}
function openIncomeEdit(id){
  const x=state.incomes.find(i=>i.id===id);if(!x)return;
  editingIncomeId=id;
  el.editIncomeAmount.value=x.amount||'';
  el.editIncomeCategory.value=x.category||incomeCategories[0]||'給与';
  el.editIncomeDate.value=x.date||today();
  el.editIncomeMemo.value=x.memo||'';
  go('editIncome');
}
function saveIncomeEdit(e){
  e.preventDefault();
  const xs=state.incomes, i=xs.findIndex(x=>x.id===editingIncomeId);if(i<0)return;
  const old=xs[i], amount=Number(el.editIncomeAmount.value||0);if(!amount)return;
  const diff=amount-Number(old.amount||0);
  xs[i]={...old,amount,category:el.editIncomeCategory.value,date:el.editIncomeDate.value,memo:el.editIncomeMemo.value.trim()};
  state.incomes=xs;
  if(diff!==0){
    const a=state.assets;a.bank=Number(a.bank||0)+diff;state.assets=a;recordBalanceSnapshot('auto');
  }
  editingIncomeId=null;render();go('history');
}

function renderHistory(){
  updateHistoryBulkButton();
  el.histExpenseBtn.classList.toggle('active',historyKind==='expense');
  el.histIncomeBtn.classList.toggle('active',historyKind==='income');
  el.expenseFilters.classList.toggle('hidden',historyKind!=='expense');
  el.bulkModeBtn.classList.toggle('hidden',historyKind!=='expense');

  if(historyKind==='income'){
    const xs=state.incomes.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||'').localeCompare(a.createdAt||''));
    el.historyList.innerHTML=`
      ${xs.length?xs.map(x=>{
        const checked=selectedIncomeIds.has(x.id)?'checked':'';
        const click=incomeBulkMode?`toggleIncomeSelected('${x.id}')`:`openIncomeEdit('${x.id}')`;
        const checkbox=incomeBulkMode?`<input class="bulk-check" type="checkbox" ${checked} onclick="event.stopPropagation();toggleIncomeSelected('${x.id}')">`:'';
        const sub=[x.date,x.category,x.memo].filter(Boolean).map(esc).join(' · ');
        return `<div class="item ${incomeBulkMode?'selecting':''}" onclick="${click}" style="cursor:pointer">
          ${checkbox}
          <div class="item-main">
            <div class="item-title">${esc(x.category||'収入')}</div>
            <div class="item-sub">${sub}</div>
          </div>
          <div class="item-amount">${yen(x.amount)}</div>
        </div>`;
      }).join(''):'<div class="card"><div class="note">収入がありません。</div></div>'}
      ${incomeBulkMode&&selectedIncomeIds.size?`<button class="btn danger full" style="margin-top:12px" onclick="deleteSelectedIncomes()">選択した${selectedIncomeIds.size}件を削除</button>`:''}`;
    return;
  }

  el.histAllBtn.classList.toggle('active',historyFilter==='all');
  el.histHighBtn.classList.toggle('active',historyFilter==='high');
  let xs=[...state.expenses].sort((a,b)=>(b.date+(b.createdAt||'')).localeCompare(a.date+(a.createdAt||'')));
  if(historyFilter==='high') xs=xs.filter(x=>effectiveExpenseAmount(x)>=state.threshold);
  el.historyList.innerHTML=xs.map(itemHTML).join('')||'<div class="empty">該当する支出はありません。</div>';
  updateBulkInfo();
}

function renderAssets(){
  const a=state.assets;
  el.bankValue.textContent=yen(a.bank);
  el.cashValue.textContent=yen(a.cash);
  el.assetTotal.textContent=yen(Number(a.bank||0)+Number(a.cash||0));
  el.bankUpdated.textContent=a.bankUpdated?`最終補正 ${a.bankUpdated}`:'カオカネ残高';
}

function render(){
  const now=new Date();
  el.monthLabel.textContent=`${now.getMonth()+1}月の支出`;
  const xs=state.expenses;
  const month=xs.filter(x=>isThisMonth(x.date)&&!x.unorganized);
  const sum=month.reduce((s,x)=>s+x.amount,0);
  el.monthSpend.textContent=yen(sum);
  el.needSpend.textContent=yen(month.filter(x=>x.type==='必要').reduce((s,x)=>s+x.amount,0));
  el.funSpend.textContent=yen(month.filter(x=>x.type==='娯楽').reduce((s,x)=>s+x.amount,0));

  const prev=xs.filter(x=>isLastMonthToSameDay(x.date)&&!x.unorganized).reduce((s,x)=>s+x.amount,0);
  const diff=sum-prev;
  el.compareText.textContent=prev===0 ? '先月同時期のデータがまだありません'
    : `先月同時期より ${diff===0?'±¥0':(diff>0?'+':'−')+yen(Math.abs(diff))}`;

  const un=xs.filter(x=>x.unorganized);
  el.unorganizedCard.classList.toggle('hidden',un.length===0);
  el.unorganizedText.textContent=un.length?`${un.length}件あります。タップして内容を完成させてください。`:'';

  const high=month.filter(x=>effectiveExpenseAmount(x)>=state.threshold).sort((a,b)=>effectiveExpenseAmount(b)-effectiveExpenseAmount(a));
  el.highCard.classList.toggle('hidden',high.length===0);
  el.highList.innerHTML=high.slice(0,4).map(itemHTML).join('');

  el.recentList.innerHTML=xs.filter(x=>!x.unorganized)
    .sort((a,b)=>(b.date+(b.createdAt||'')).localeCompare(a.date+(a.createdAt||'')))
    .slice(0,6).map(itemHTML).join('')||'<div class="empty">まだ支出がありません。</div>';

  const monthIncome=state.incomes.filter(x=>isThisMonth(x.date)).sort((a,b)=>(b.date+(b.createdAt||'')).localeCompare(a.date+(a.createdAt||'')));
  el.incomeMonthTitle.textContent=`${now.getMonth()+1}月の収入`;
  el.homeIncomeTotal.textContent=yen(monthIncome.reduce((s,x)=>s+Number(x.amount||0),0));
  el.homeIncomeList.innerHTML=monthIncome.map(incomeItemHTML).join('')||'<div class="empty">今月の収入はまだありません。</div>';

  const unsettled=[];
  state.expenses.forEach(exp=>{
    (exp.splits||[]).forEach((s,idx)=>{
      if(!s.settled) unsettled.push({expense:exp,split:s,index:idx});
    });
  });
  el.unsettledSection.classList.toggle('hidden',unsettled.length===0);
  el.unsettledList.innerHTML=unsettled.map(u=>`
    <div class="item">
      <div class="item-main">
        <div class="unsettled-name">${esc(u.split.name)} から ${yen(u.split.amount)}</div>
        <div class="unsettled-sub">${esc(u.expense.date)} · ${esc(u.expense.memo||u.expense.category||'支出')}</div>
      </div>
      <button class="settle-btn" onclick="markSplitSettled('${esc(u.expense.id)}',${u.index})">受取済</button>
    </div>`).join('');

  renderHistory(); renderAssets(); renderPaymentMap(); renderSettlementHome(); renderHomeCategoryPie(); applyHomeOrder();
}


document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'){
    try{
      const s=JSON.parse(localStorage.getItem('kaokane_arcade_session')||'null');
      if(s && s.active){
        arcadeSum=Number(s.sum||0);
        el.arcadeTotal.textContent=yen(arcadeSum);
        const arcadeScreen=$('arcade');
        if(arcadeScreen && !arcadeScreen.classList.contains('active')) go('arcade');
      }
    }catch{}
  }
});
window.addEventListener('pageshow',()=>{
  try{
    const s=JSON.parse(localStorage.getItem('kaokane_arcade_session')||'null');
    if(s && s.active){
      arcadeSum=Number(s.sum||0);
      el.arcadeTotal.textContent=yen(arcadeSum);
      setTimeout(()=>go('arcade'),40);
    }
  }catch{}
});

Object.assign(window,{
  go,pickType,pickEditType,quickAmount,setHistoryFilter,startArcade,arcadeAdd,finishArcade,cancelArcade,
  updateBank,updateCash,saveThreshold,openEdit,deleteCurrentExpense,resetAllData,toggleBulkMode,toggleSelectExpense,bulkDelete,toggleThresholdEdit,toggleBalanceAdjust,setHistoryKind,toggleSplitEditor,toggleEditSplitEditor,addSplitRow,addEditSplitRow,markSplitSettled,savePaymentMap,togglePaymentMapPanel,toggleAnalytics,setChartMode,toggleRecurringDetail,toggleTransferPanel,executeTransfer,addPaybackReminder,settlePending,toggleHistoryBulkMode,toggleIncomeBulkMode,toggleIncomeSelected,deleteSelectedIncomes,openIncomeEdit,toggleHomeSortPanel,moveHomeBlock,openMonthlyHistory,changeMonthlyYear,selectMonthlyMonth,setMonthlyHistoryKind,openKaokaneKeypad,keypadDigit,keypadBackspace,keypadClear,keypadToggleSign,finishKaokaneKeypad,closeKaokaneKeypad,toggleBalanceAdjustmentHistory});

try{
  localStorage.setItem('kaokane_test','ok');
  localStorage.removeItem('kaokane_test');
  setup();
}catch(err){
  document.body.insertAdjacentHTML('afterbegin',
    '<div style="padding:12px;background:#fff1f1;color:#991b1b;font-family:sans-serif;font-weight:700">この表示環境ではデータ保存機能が使えません。Safariなど通常のブラウザで開いてください。</div>');
  console.error(err);
}
