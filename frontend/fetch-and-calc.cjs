const { io } = require('socket.io-client');
const url = process.env.METRICS_URL || 'http://localhost:5001';
const socket = io(url, { transports: ['websocket'] });
console.log('Connecting to', url);

const MAX_UPDATES = Number(process.env.MAX_UPDATES) || 25;
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS) || 12000;
let updates = [];
let got = false;

socket.on('connect', () => {
  console.log('Connected', socket.id);
  socket.emit('joinElection', 'mock-election');
});

socket.on('prediction:update', (msg) => {
  const data = msg?.data || msg;
  if (!data || !data.predictions) return;
  updates.push({ ts: Date.now(), predictions: data.predictions });
  console.log('update', updates.length, 'preds', data.predictions.map(p=>`${p.candidate_id}:${p.predicted_pct}`));
  if (updates.length >= MAX_UPDATES) doCompute();
});

function safeDiv(n,d){return d===0?0:n/d}

function calcClassificationMetrics(predicted, actual){
  let TP=0,FP=0,TN=0,FN=0;
  for(let i=0;i<predicted.length;i++){
    const p = predicted[i], a = actual[i];
    if (p===1 && a===1) TP++;
    else if (p===1 && a===0) FP++;
    else if (p===0 && a===0) TN++;
    else if (p===0 && a===1) FN++;
  }
  const accuracy = safeDiv(TP+TN, TP+TN+FP+FN);
  const precision = safeDiv(TP, TP+FP);
  const recall = safeDiv(TP, TP+FN);
  const f1 = (precision+recall)===0?0:(2*precision*recall)/(precision+recall);
  return {TP,FP,TN,FN,accuracy,precision,recall,f1};
}

function calcRegression(preds, acts){
  const n = Math.min(preds.length, acts.length);
  let sumAbs=0,sumSq=0; for(let i=0;i<n;i++){ const e=preds[i]-acts[i]; sumAbs+=Math.abs(e); sumSq+=e*e; }
  const MAE = n? sumAbs/n:0; const RMSE = n? Math.sqrt(sumSq/n):0; return {MAE,RMSE};
}

function calcBrier(probs,outcomes){ const n=Math.min(probs.length,outcomes.length); if(n===0) return 0; let s=0; for(let i=0;i<n;i++){ const d=probs[i]-outcomes[i]; s+=d*d;} return s/n; }

function doCompute(){
  if (got) return; got=true;
  if (updates.length===0){ console.error('No updates received'); process.exit(2); }

  // collect candidate ids
  const ids = Array.from(new Set(updates.flatMap(u=>u.predictions.map(p=>p.candidate_id))));

  const per = {};
  ids.forEach(id=> per[id] = {pred:[], act:[], prob:[], winPred:[], winAct:[]});

  const winnerPredArr = [];
  const winnerActArr = [];

  for(const u of updates){
    // find tops
    const predTop = u.predictions.reduce((a,b)=> b.predicted_pct > a.predicted_pct ? b : a);
    const actTop = u.predictions.reduce((a,b)=> b.actual_pct > a.actual_pct ? b : a);
    winnerPredArr.push(predTop.candidate_id);
    winnerActArr.push(actTop.candidate_id);

    for(const p of u.predictions){
      const id = p.candidate_id;
      per[id].pred.push(p.predicted_pct);
      per[id].act.push(p.actual_pct);
      per[id].prob.push(p.predicted_pct/100);
      per[id].winPred.push(p.candidate_id===predTop.candidate_id?1:0);
      per[id].winAct.push(p.candidate_id===actTop.candidate_id?1:0);
    }
  }

  const results = { perCandidate:{}, overall:{} };
  // per-candidate metrics
  for(const id of ids){
    const reg = calcRegression(per[id].pred, per[id].act);
    const cls = calcClassificationMetrics(per[id].winPred, per[id].winAct);
    const brier = calcBrier(per[id].prob, per[id].winAct);
    results.perCandidate[id] = { regression: reg, classification: cls, brier };
  }

  // aggregated regression
  const allPred = [], allAct = [];
  ids.forEach(id => { allPred.push(...per[id].pred); allAct.push(...per[id].act); });
  results.overall.regression = calcRegression(allPred, allAct);

  // winner accuracy
  let correct=0; for(let i=0;i<winnerActArr.length;i++) if(winnerActArr[i]===winnerPredArr[i]) correct++;
  results.overall.winnerAccuracy = safeDiv(correct, winnerActArr.length);

  console.log('\n=== Computed Metrics (from collected updates) ===');
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

setTimeout(()=>{ if(!got) doCompute(); }, TIMEOUT_MS);
