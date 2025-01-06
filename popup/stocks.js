'use strict';

let PORTFOLIOS = [
  {'name': 'Tech', 'symbols': ['AMD', 'NVDA', 'MSFT', 'NFLX', 'SPOT']},
  {'name': 'Forex', 'symbols': ['USDEUR', 'USDGBP']},
  {'name': 'Crypto', 'symbols': ['BTCUSD', 'ETHUSD']},
  {'name': 'Market ETFs', 'symbols': ['SPY', 'DIA', 'QQQ', 'IWM']}
];
let portfoliosStates = [];
let color_dec;
let color_inc;
let apiKey;

const gettingItem = browser.storage.sync.get([
  'apiKey',
  'portfolios',
  'portfoliosStates',
  'color_dec',
  'color_inc'
]);
gettingItem.then((res) => {
  apiKey = res.apiKey;
  color_dec = res.color_dec ? hex_to_RGB(res.color_dec) : '255,0,0';
  color_inc = res.color_inc ? hex_to_RGB(res.color_inc) : '0,255,0';

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
const BASE_URL = 'https://financialmodelingprep.com/api/v3/quote/';

let symbols = [];
let forexSymbols = {};
let containerDiv = document.querySelector('.stocks-container');
let updatedDiv = document.querySelector('.updated-timestamp');

function init() {
  PORTFOLIOS.forEach((p, i) => addPortfolio(p, portfoliosStates[i]));
  symbols = symbols.filter((s, i) => symbols.indexOf(s) === i);
  updateData();
}

function addPortfolio(portfolio, opened) {
  const portfolioDiv = document.createElement('div');
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
  const tableHeaderHtml = `
    <thead>
      <tr>
        <th></th>
        <th class="stock-price">Last</th>
        <th class="stock-change">Change</th>
        <th class="stock-change-pct">Change%</th>
        <th class="stock-mkt-cap">Mkt Cap</th>
      </tr>
    </thead>`;

  const tableBodyHtml = portfolio.symbols.map(symbol => {
    symbol = symbol.toUpperCase();
    symbols.push(symbol);

    return `
      <tr data-symbol="${symbol}">
        <td class="stock-symbol"></td>
        <td class="stock-price"></td>
        <td class="stock-change"></td>
        <td class="stock-change-pct"></td>
        <td class="stock-mkt-cap"></td>
      </tr>
    `
  }).join('');;

  return `<table>${tableHeaderHtml}<tbody>${tableBodyHtml}</tbody></table>`
}

async function updateData() {
  let numberOfBatches = Math.ceil(symbols.length / BATCH_SIZE);

  for (let i = 0; i < numberOfBatches; i++) {
    let symbolsBatch = symbols.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    try {
      const symbolsData = await fetchSymbolsData(symbolsBatch);
      updateDataForBatch(symbolsData);
    } catch (error) {
      const response = error.response;
      if (response.status == 401) {
        document.getElementById('error').innerHTML = 'Invalid API Key.<br />Please create one on <a href="https://site.financialmodelingprep.com/developer">Financial Modeling Prep</a>'
      } else {
        document.getElementById('error').innerText = response.statusText;
      }
    }
  }

  updatedDiv.innerHTML = `Data updated: ${(new Date()).toLocaleString()}`;
}

async function updateDataForBatch(symbolsData) {
  symbolsData.forEach(data => {
    const exchange = data.exchange;
    const yahooUrl = generateYahooUrl(data.symbol, exchange);
    const formattedPrice = formatQuote(data.price);
    const formattedChange = data.change;
    const formattedChangePercent = data.changesPercentage.toLocaleString('en', { maximumFractionDigits: 2 }) + '%';
    const formattedMarketCap = exchange === 'FOREX' ? 'N/A' : formatMarketCap(data.marketCap);
    const rgbColor = data.changesPercentage > 0 ? color_inc : color_dec;
    const rgbOpacity = Math.min(Math.abs(data.changesPercentage / 100) * 20, 1);

    document.querySelectorAll(`[data-symbol="${data.symbol}"] .stock-symbol`).forEach(e => {
      e.outerHTML = `<a href="${yahooUrl}" target="_blank">${data.symbol}</a>`;
      e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
    });

    document.querySelectorAll(`[data-symbol="${data.symbol}"] .stock-price`).forEach(e => {
      e.innerHTML = formattedPrice;
      e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
    });

    document.querySelectorAll(`[data-symbol="${data.symbol}"] .stock-change`).forEach(e => {
      e.innerHTML = formattedChange;
      e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
    });

    document.querySelectorAll(`[data-symbol="${data.symbol}"] .stock-change-pct`).forEach(e => {
      e.innerHTML = formattedChangePercent;
      e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
    });

    document.querySelectorAll(`[data-symbol="${data.symbol}"] .stock-mkt-cap`).forEach(e => {
      e.innerHTML = formattedMarketCap;
      e.setAttribute('style', `background-color: rgba(${rgbColor}, ${rgbOpacity})`);
    });

    document.querySelectorAll(`[data-symbol="${data.symbol}"] .stock-symbol a`).forEach(e => {
      e.setAttribute('title', data.name);
    });
  });
}

async function fetchSymbolsData(symbols) {
  const url = `${BASE_URL}${symbols.join(',')}?apikey=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error();
    err.response = response;
    throw err;
  }
  return await response.json();
}

function generateYahooUrl(symbol, exchange) {
  switch (exchange) {
    case 'FOREX':
      return `https://finance.yahoo.com/quote/${symbol}=X`;
    case 'CRYPTO':
      return `https://finance.yahoo.com/quote/${symbol.substring(0, 3)}-${symbol.substring(3)}`;
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

// https://stackoverflow.com/a/30970691/1326281
function hex_to_RGB(hex) {
  var m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  return  `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

document.getElementById('settingsBtn').addEventListener('click', function() {
  browser.runtime.openOptionsPage();
});
