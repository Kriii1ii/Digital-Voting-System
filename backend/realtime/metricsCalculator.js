/**
 * metricsCalculator.js
 * Functions to compute classification/regression/Brier metrics
 */
function safeDiv(n, d) {
  return d === 0 ? 0 : n / d;
}

function calculateClassificationMetrics(predicted, actual) {
  // predicted and actual are arrays of 0/1
  const n = predicted.length;
  let TP = 0, FP = 0, TN = 0, FN = 0;
  for (let i = 0; i < n; i++) {
    const p = predicted[i];
    const a = actual[i];
    if (p === 1 && a === 1) TP++;
    else if (p === 1 && a === 0) FP++;
    else if (p === 0 && a === 0) TN++;
    else if (p === 0 && a === 1) FN++;
  }
  const accuracy = safeDiv(TP + TN, TP + TN + FP + FN);
  const precision = safeDiv(TP, TP + FP);
  const recall = safeDiv(TP, TP + FN);
  const f1 = (precision + recall) === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { TP, FP, TN, FN, accuracy, precision, recall, f1 };
}

function calculateRegressionMetrics(predictions, actuals) {
  if (!predictions || !actuals || predictions.length === 0) return { MAE: 0, RMSE: 0 };
  const n = Math.min(predictions.length, actuals.length);
  let sumAbs = 0, sumSq = 0;
  for (let i = 0; i < n; i++) {
    const e = predictions[i] - actuals[i];
    sumAbs += Math.abs(e);
    sumSq += e * e;
  }
  const MAE = sumAbs / n;
  const RMSE = Math.sqrt(sumSq / n);
  return { MAE, RMSE };
}

function calculateBrierScore(probabilities, outcomes) {
  // probabilities: array of [0..1], outcomes: 0/1
  if (!probabilities || !outcomes || probabilities.length === 0) return 0;
  const n = Math.min(probabilities.length, outcomes.length);
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const p = probabilities[i];
    const o = outcomes[i];
    const d = p - o;
    sumSq += d * d;
  }
  return sumSq / n; // Brier score
}

module.exports = {
  calculateClassificationMetrics,
  calculateRegressionMetrics,
  calculateBrierScore,
};
