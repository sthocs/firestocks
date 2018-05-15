function saveOptions(e) {
  var newValue = document.querySelector("#portfolios").value;

  try {
    JSON.parse(newValue);
  }
  catch(e) {
    document.querySelector("#error").innerText = 'Error: not a valid JSON: ' + e;
    return;
  }

  document.querySelector("#error").innerText = '';
  browser.storage.sync.set({
    portfolios: newValue
  });
  document.querySelector("#followed-stocks").innerText = newValue;
  e.preventDefault();
}

function restoreOptions() {
  var portfolios = browser.storage.sync.get('portfolios');
  portfolios.then((res) => {
    document.querySelector("#portfolios").value = res.portfolios || "";
    document.querySelector("#followed-stocks").innerText = res.portfolios ||
    'None, save a string under the form: [{"name": "Find alternatives to", "symbols": ["GOOGL", "AAPL", "FB", "AMZN", "MSFT"]}]';
  });
}

function resetTextArea() {
  document.querySelector("#portfolios").value =
  '[\n' +
    '{"name": "Market ETFs", "symbols": ["SPY", "DIA", "QQQ", "IWM"]},\n' +
    '{"name": "Tech", "symbols": ["AMD", "NVDA", "NFLX", "DVMT", "SPOT"]},\n' +
    '{"name": "Banks", "symbols": ["GS", "DB", "CS", "RBS"]}\n' +
  ']';
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("#save").addEventListener("click", saveOptions);
document.querySelector("#reset").addEventListener("click", resetTextArea);
