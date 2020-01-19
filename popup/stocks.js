'use strict';

var PORTFOLIOS = [
  {'name': 'Market ETFs', 'symbols': ['DIA', 'QQQ', 'IWM']},
  {'name': 'Sector ETFs', 'symbols': ['XLF', 'XLK', 'XLV', 'XLP', 'XLY', 'XLE', 'XLB', 'XLI', 'XLU', 'XLRE']},
  {'name': 'Banks', 'symbols': ['GS', 'MS', 'JPM', 'WFC', 'C', 'BAC', 'BCS', 'DB', 'CS', 'RBS']},
  {'name': 'Tech', 'symbols': ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'FB', 'TWTR', 'NFLX', 'SNAP', 'SPOT', 'DBX', 'BABA', 'INTC', 'AMD', 'NVDA', 'ORCL']},
  {'name': 'Bond ETFs', 'symbols': ['BND', 'BIV', 'JNK']},
  {'name': 'Other ETFs', 'symbols': ['VOO', 'VTI', 'VGK', 'VPL', 'VWO', 'VDE', 'XOP', 'VFH', 'VHT', 'VIG', 'VYM', 'VAW', 'REM', 'XHB', 'GLD']},
  {'name': 'Mortgage REITs', 'symbols': ['EFC', 'EARN', 'NLY', 'AGNC', 'CIM', 'TWO', 'NRZ']},
  {'name': 'BigCos', 'symbols': ['XOM', 'WMT', 'JNJ', 'GE', 'T', 'KO', 'DIS', 'MCD', 'PG']}
];
var portfoliosStates = [];

var gettingItem = browser.storage.sync.get(['portfolios', 'portfoliosStates']);
gettingItem.then((res) => {
  if (res.portfolios) {
    PORTFOLIOS = res.portfolios;
  }
  portfoliosStates = res.portfoliosStates ?
    res.portfoliosStates :
    Array(PORTFOLIOS.length).fill(true);
  init();
}).catch(err => {
  containerDiv.innerText = err;
});

const BATCH_SIZE = 100;
const BASE_URL = 'https://cloud.iexapis.com/v1/stock/market/batch';
const TOKEN='';

let symbols = [];
let containerDiv = document.querySelector('.stocks-container');
let updatedDiv = document.querySelector('.updated-timestamp');

function init() {
  PORTFOLIOS.forEach((p, i) => addPortfolio(p, portfoliosStates[i]));
  symbols = symbols.filter((s, i) => symbols.indexOf(s) === i);
  updateData();
}

function addPortfolio(portfolio, opened) {
  let tableHeaderHtml = `
    <thead>
      <tr>
        <th></th>
        <th class="stock-price">Last</th>
        <th class="stock-change">Change</th>
        <th class="stock-change-pct">Change%</th>
        <th class="stock-mkt-cap">Mkt Cap</th>
      </tr>
    </thead>`;

  let tableBodyHtml = portfolio.symbols.map(symbol => {
    symbol = symbol.toUpperCase();
    symbols.push(symbol);

    let html = `
      <tr data-symbol="${symbol}">
        <td class="stock-symbol"><a href="${symbolUrl(symbol)}" target="_blank">${symbol}</a></td>
        <td class="stock-price"></td>
        <td class="stock-change"></td>
        <td class="stock-change-pct"></td>
        <td class="stock-mkt-cap"></td>
      </tr>
    `

    return html;
  }).join('');

  let portfolioDiv = document.createElement('div');
  const detailsElt = document.createElement('details');
  detailsElt.className = 'portfolio-section';
  if (opened) {
    detailsElt.setAttribute('open', true);
  }
  detailsElt.innerHTML = `
    <summary>${portfolio.name}</summary>
    <table>${tableHeaderHtml}<tbody>${tableBodyHtml}</tbody></table>
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

function updateData() {
  let numberOfBatches = Math.ceil(symbols.length / BATCH_SIZE);

  for (let i = 0; i < numberOfBatches; i++) {
    let symbolsBatch = symbols.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    updateDataForBatch(symbolsBatch);
  }

  updatedDiv.innerHTML = `Data updated: ${(new Date()).toLocaleString()}`;
}

function updateDataForBatch(symbols) {
  let filters = ['latestPrice', 'change', 'changePercent', 'marketCap', 'companyName'];
  let url = `${BASE_URL}?types=quote&symbols=${symbols.join(',')}&filter=${filters.join(',')}&token=${TOKEN}`;

  fetch(url).then(response => response.json()).then(json => {
    symbols.forEach(symbol => {
      let data = json[symbol];
      if (typeof(data) === 'undefined') return;

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

function symbolUrl(symbol) {
  return `https://finance.yahoo.com/quote/${symbol}`;
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
