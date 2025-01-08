/* global browser */

async function restoreSymbols() {
  try {
    const storage = await browser.storage.sync.get(['apiKey', 'portfolios', 'color_dec', 'color_inc']);
    document.getElementById('apiKey').value = storage.apiKey || '';
    restorePortfolios(storage.portfolios);
    restoreColors(storage.color_dec, storage.color_inc);
  } catch (e) {
    console.error(e);
    restorePortfolios();
  }
}

document.addEventListener('DOMContentLoaded', restoreSymbols);
document.querySelector('#save').addEventListener('click', saveSymbols);
document.querySelector('#reset').addEventListener('click', generateExampleData);
document.querySelector('#revert').addEventListener('click', restoreSymbols);

const groupsDiv = document.getElementById('groups');

document.querySelector('#add_group_btn').addEventListener('click', function () {
  groupsDiv.appendChild(createGroupDiv('', []));
});
document.querySelector('#remove_group_btn').addEventListener('click', function () {
  const groupDivs = document.getElementsByClassName('group');
  groupDivs[groupDivs.length - 1].parentNode.removeChild(groupDivs[groupDivs.length - 1]);
});

function generateExampleData() {
  const exampleData = [
    { name: 'Tech', symbols: ['AMD', 'NVDA', 'NFLX', 'SPOT'] },
    { name: 'Forex', symbols: ['USDEUR', 'USDGBP'] },
    { name: 'Crypto', symbols: ['BTCUSD', 'ETHUSD'] },
    { name: 'Market ETFs', symbols: ['SPY', 'DIA', 'QQQ', 'IWM'] },
  ];
  restorePortfolios(exampleData);
}

function restorePortfolios(portfolios) {
  // First clean all groups
  const groupDivs = document.getElementsByClassName('group');
  for (let i = groupDivs.length - 1; i >= 0; --i) {
    groupDivs[i].parentNode.removeChild(groupDivs[i]);
  }

  if (!portfolios || portfolios.constructor !== Array) {
    groupsDiv.appendChild(createGroupDiv('', []));
    return;
  }
  for (const group of portfolios) {
    groupsDiv.appendChild(createGroupDiv(group.name, group.symbols));
  }
}

function restoreColors(color_dec, color_inc) {
  document.getElementById('color_dec').value = color_dec || '#ff0000';
  document.getElementById('color_inc').value = color_inc || '#00ff00';
}

function saveSymbols() {
  const toSave = [];
  const groupDivs = document.getElementsByClassName('group');
  const groupNames = document.getElementsByClassName('groupName');
  for (let i = 0; i < groupDivs.length; ++i) {
    const symbolInputs = groupDivs[i].getElementsByClassName('symbolsInput');
    // this will remove spaces https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String/split#Supprimer_les_espaces_d'une_cha%C3%AEne
    const regex = /\s*,\s*/;
    const symbolNames = symbolInputs[0].value.split(regex);
    const group = {
      name: groupNames[i].value,
      symbols: symbolNames,
    };
    toSave.push(group);
  }

  // API Key
  const apiKey = document.getElementById('apiKey').value;

  // Colors
  const color_dec = document.getElementById('color_dec').value;
  const color_inc = document.getElementById('color_inc').value;

  browser.storage.sync.set({
    apiKey,
    portfolios: toSave,
    portfoliosStates: Array(toSave.length).fill(true), // Reset collapsed sections
    color_dec,
    color_inc,
  });
}

function createGroupDiv(groupName, symbols) {
  const stocksPlaceholder = 'Put symbols names separated by commas, e.g.: AMD, NVDA, EURUSD, BTCUSD';
  const newGroupDiv = document.createElement('div');
  newGroupDiv.className = 'group';
  newGroupDiv.innerHTML = `
    <div class="row">
      <div>Group name:<input class="groupName" value="${groupName}"></div>
    </div>
    <div class="symbols row">
      Symbols:
      <input class="symbolsInput" style="flex-grow:1;" value="${symbols.join(', ')}"
        placeholder="${stocksPlaceholder}">
    </div>
  `;
  return newGroupDiv;
}
