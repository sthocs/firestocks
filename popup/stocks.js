'use strict';

var PORTFOLIOS = [
  {'name': 'Market ETFs', 'symbols': ['DIA', 'QQQ', 'IWM']},
  {'name': 'Banks', 'symbols': ['GS', 'MS', 'JPM', 'WFC', 'C', 'BAC', 'BCS', 'DB', 'CS', 'RBS']},
  {'name': 'Tech', 'symbols': ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'FB', 'TWTR', 'NFLX', 'SNAP', 'SPOT', 'DBX', 'BABA', 'INTC', 'AMD', 'NVDA', 'ORCL']},
  {'name': 'Forex', 'type': 'forex', 'base': 'USD', 'symbols': ['GBP', 'EUR']},
];
var portfoliosStates = [];

var gettingItem = browser.storage.sync.get(['portfolios', 'portfoliosStates', 'lastSaveDate']);
gettingItem.then((res) => {
  if (res.portfolios) {
    PORTFOLIOS = res.portfolios;
  }
  portfoliosStates = res.portfoliosStates ?
    res.portfoliosStates :
    Array(PORTFOLIOS.length).fill(true);
  init(res.lastSaveDate);
}).catch(err => {
  containerDiv.innerText = err;
});

const BATCH_SIZE = 100;
const BASE_URL = 'https://cloud.iexapis.com/v1/stock/market/batch';
const TOKEN='';

let symbols = [];
let forexSymbols = {};
let containerDiv = document.querySelector('.stocks-container');
let updatedDiv = document.querySelector('.updated-timestamp');

function init(lastSaveDate) {
  PORTFOLIOS.forEach((p, i) => addPortfolio(p, portfoliosStates[i]));
  symbols = symbols.filter((s, i) => symbols.indexOf(s) === i);
  updateData(lastSaveDate);
}

function addPortfolio(portfolio, opened) {
  let portfolioDiv = document.createElement('div');
  const detailsElt = document.createElement('details');
  detailsElt.className = 'portfolio-section';
  if (opened) {
    detailsElt.setAttribute('open', true);
  }
  detailsElt.innerHTML = `
    <summary>${portfolio.name}</summary>
    ${getTableHTML(portfolio)}
  `;
  detailsElt.addEventListener('toggle', elt => {
    const portfoliosStates =
      Array.from(document.getElementsByClassName('portfolio-section'))
     .map(details => details.open);
    browser.storage.sync.set({
      portfoliosStates
    });
  });
  portfolioDiv.appendChild(detailsElt);
  containerDiv.appendChild(portfolioDiv);
}

function getTableHTML(portfolio) {
  const tableHeaderHtml = portfolio.type !== 'forex' ? `
    <thead>
      <tr>
        <th></th>
        <th class="stock-price">Last</th>
        <th class="stock-change">Change</th>
        <th class="stock-change-pct">Change%</th>
        <th class="stock-mkt-cap">Mkt Cap</th>
      </tr>
    </thead>` : `
    <thead>
      <tr>
        <th></th>
        <th class="currency-price">Last</th>
        <th class="currency-change">Change</th>
        <th class="currency-change-pct">Change%</th>
      </tr>
    </thead>`;

  const tableBodyHtml = portfolio.symbols.map(symbol => {
    symbol = symbol.toUpperCase();
    if (portfolio.type === 'forex') {
      if (!forexSymbols[portfolio.base]) {
        forexSymbols[portfolio.base] = [];
      }
      forexSymbols[portfolio.base].push(symbol);
    } else {
      symbols.push(symbol);
    }


    if (portfolio.type === 'forex') {
      return `
        <tr data-symbol="${portfolio.base}${symbol}">
          <td class="forex-symbol"><a href="${symbolUrl(symbol, portfolio.base, portfolio.type)}" target="_blank">${portfolio.base}/${symbol}</a></td>
          <td class="currency-price"></td>
          <td class="currency-change"></td>
          <td class="currency-change-pct"></td>
        </tr>
      `
    }
    return `
      <tr data-symbol="${symbol}">
        <td class="stock-symbol"><a href="${symbolUrl(symbol)}" target="_blank">${symbol}</a></td>
        <td class="stock-price"></td>
        <td class="stock-change"></td>
        <td class="stock-change-pct"></td>
        <td class="stock-mkt-cap"></td>
      </tr>
    `
  }).join('');;

  return `<table>${tableHeaderHtml}<tbody>${tableBodyHtml}</tbody></table>`
}

function updateData(lastSaveDate) {
  let numberOfBatches = Math.ceil(symbols.length / BATCH_SIZE);

  for (let i = 0; i < numberOfBatches; i++) {
    let symbolsBatch = symbols.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    updateDataForBatch(symbolsBatch);
  }

  updateForexData(forexSymbols, lastSaveDate);

  updatedDiv.innerHTML = `Data updated: ${(new Date()).toLocaleString()}`;
}

function updateDataForBatch(symbols) {
  let filters = ['latestPrice', 'change', 'changePercent', 'marketCap', 'companyName'];
  let url = `${BASE_URL}?types=quote&symbols=${symbols.join(',')}&filter=${filters.join(',')}&token=${TOKEN}`;

  fetch(url).then(response => response.json()).then(json => {
    symbols.forEach(symbol => {
      let data = json[symbol];
      if (!data || !data.quote) return;

      let formattedPrice = formatQuote(data.quote.latestPrice);
      let formattedChange = data.quote.change.toLocaleString('en', {'minimumFractionDigits': 2});
      let formattedChangePercent = (data.quote.changePercent * 100).toFixed(1) + '%';
      let formattedMarketCap = formatMarketCap(data.quote.marketCap);
      let rgbColor = data.quote.changePercent > 0 ? '0,255,0' : '255,0,0';
      let rgbOpacity = Math.min(Math.abs(data.quote.changePercent) * 20, 1);

      document.querySelectorAll(`[data-symbol="${symbol}"] .stock-price`).forEach(e => {
        e.innerHTML = formattedPrice;
        e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
      });

      document.querySelectorAll(`[data-symbol="${symbol}"] .stock-change`).forEach(e => {
        e.innerHTML = formattedChange;
        e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
      });

      document.querySelectorAll(`[data-symbol="${symbol}"] .stock-change-pct`).forEach(e => {
        e.innerHTML = formattedChangePercent;
        e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
      });

      document.querySelectorAll(`[data-symbol="${symbol}"] .stock-mkt-cap`).forEach(e => {
        e.innerHTML = formattedMarketCap;
        e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
      });

      document.querySelectorAll(`[data-symbol="${symbol}"] .stock-symbol a`).forEach(e => {
        e.setAttribute('title', data.quote.companyName);
      });
    });
  });
}

async function updateForexData(symbols, lastPortfolioSaveDate) {
  let { forex, lastForexDateFetch = Date.now() } = await browser.storage.sync.get(['forex', 'lastForexDateFetch']);
  const today = new Date();
  const yesterday = new Date();
  today.setDate(today.getDate() - 1);
  yesterday.setDate(yesterday.getDate() - 2);
  const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

  forex = forex || {};
  let todayData = forex[todayStr];
  let yesterdayData = forex[yesterdayStr];
  let newDateFetched = false;
  if (!todayData || lastForexDateFetch < lastPortfolioSaveDate) {
    todayData = {};
    for (const base of Object.keys(symbols)) {
      todayData[base] = await fetchForexData({ date: todayStr, base, symbols: symbols[base] });
    }
    newDateFetched = true;
  }
  if (!yesterdayData || lastForexDateFetch < lastPortfolioSaveDate) {
    yesterdayData = {};
    for (const base of Object.keys(symbols)) {
      yesterdayData[base] = await fetchForexData({ date: yesterdayStr, base, symbols: symbols[base] });
    }
    newDateFetched = true;
  }
  if (newDateFetched) {
    const toSave = {};
    toSave[todayStr] = todayData;
    toSave[yesterdayStr] = yesterdayData;
    browser.storage.sync.set({ forex: toSave, lastForexDateFetch: Date.now() });
  }

  Object.keys(todayData).forEach(base => {
    if (!todayData[base]) return;
    Object.keys(todayData[base]).forEach(symbol => {
      const change = todayData[base][symbol] - yesterdayData[base][symbol];
      const changePct = (change / yesterdayData[base][symbol]) * 100;
      let rgbColor = changePct > 0 ? '0,255,0' : '255,0,0';
      let rgbOpacity = Math.abs(changePct);
      document.querySelectorAll(`[data-symbol="${base}${symbol}"] .currency-price`).forEach(e => {
        e.innerHTML = `${todayData[base][symbol].toFixed(5)}`;
        e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
      });

      document.querySelectorAll(`[data-symbol="${base}${symbol}"] .currency-change`).forEach(e => {
        e.innerHTML = change.toFixed(3);
        e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
      });

      document.querySelectorAll(`[data-symbol="${base}${symbol}"] .currency-change-pct`).forEach(e => {
        e.innerHTML = changePct.toFixed(3);
        e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
      });
    });
  });
}

async function fetchForexData({ date, base, symbols }) {
  if (!base) return;
  base = base.toUpperCase();
  if (base === 'EUR') { // Doesn't work for EUR/EUR
    symbols = symbols.filter(symbol => symbol && symbol.toUpperCase() !== 'EUR');
  }
  const res = await fetch(`https://api.exchangeratesapi.io/${date}?base=${base}&symbols=${symbols.join(',')}`);
  const jsonResponse = await res.json();
  return jsonResponse.rates;
}

function symbolUrl(symbol, base, type) {
  switch (type) {
    case 'forex':
      return `https://finance.yahoo.com/quote/${base}${symbol}=X`;
    default:
      return `https://finance.yahoo.com/quote/${symbol}`;
  }
}

function formatQuote(value) {
  let options = {
    'minimumFractionDigits': 2,
    'style': 'currency',
    'currency': 'USD'
  };
  return value.toLocaleString('en', options);
}

function formatMarketCap(marketCap) {
  let value, suffix;
  if (marketCap >= 1e12) {
    value = marketCap / 1e12;
    suffix = 'T';
  } else if (marketCap >= 1e9) {
    value = marketCap / 1e9;
    suffix = 'B';
  } else {
    value = marketCap / 1e6;
    suffix = 'M';
  }

  let digits = value < 10 ? 1 : 0;

  return '$' + value.toFixed(digits) + suffix;
}

document.getElementById('settingsBtn').addEventListener('click', function() {
  browser.runtime.openOptionsPage();
});
