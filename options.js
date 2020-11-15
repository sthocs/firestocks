function restoreSymbols() {
  const portfolios = browser.storage.sync.get('portfolios');
  portfolios.then((res) => {
    restorePortfolios(res.portfolios);
  }).catch(e => {
    generateExampleData();
    console.log(e);
  });
}

document.addEventListener('DOMContentLoaded', restoreSymbols);
document.querySelector("#save").addEventListener("click", saveSymbols);
document.querySelector("#reset").addEventListener("click", generateExampleData);
document.querySelector("#revert").addEventListener("click", restoreSymbols);

const symbols_editor = document.getElementById('symbols_editor');
const add_group = document.getElementById('add_group');

document.querySelector('#add_group_btn').addEventListener('click', function() {
  symbols_editor.insertBefore(createGroupDiv("", undefined, [], undefined), add_group);
});
document.querySelector('#remove_group_btn').addEventListener('click', function() {
  const groupDivs = document.getElementsByClassName("group");
  groupDivs[groupDivs.length - 1].parentNode.removeChild(groupDivs[groupDivs.length - 1]);
});

function generateExampleData() {
  const exampleData = [
    {'name': 'Market ETFs', 'symbols': ['SPY', 'DIA', 'QQQ', 'IWM']},
    {'name': 'Tech', 'symbols': ['AMD', 'NVDA', 'NFLX', 'DVMT', 'SPOT']},
    {'name': 'Banks', 'symbols': ['GS', 'DB', 'CS', 'RBS']},
    {'name': 'Forex', 'type': 'forex', 'base': 'USD', 'symbols': ['EUR', 'GBP']}
  ];
  restorePortfolios(exampleData);
}

function restorePortfolios(portfolios) {
  // First clean all groups
  const groupDivs = document.getElementsByClassName("group");
  for (let i = groupDivs.length -1; i >= 0 ; --i) {
    groupDivs[i].parentNode.removeChild(groupDivs[i]);
  }

  if (!portfolios || portfolios.constructor !== Array) {
    symbols_editor.insertBefore(createGroupDiv("", undefined, [], undefined), add_group);
    return;
  }
  for (group of portfolios) {
    symbols_editor.insertBefore(createGroupDiv(group.name, group.type, group.symbols, group.base), add_group);
  }
}

function saveSymbols() {
  const toSave = [];
  const groupDivs = document.getElementsByClassName("group");
  const groupNames = document.getElementsByClassName("groupName");
  const symbolsDivs = document.getElementsByClassName("symbols");
  for (let i = 0; i < groupDivs.length; ++i) {
      const typeSelect = groupDivs[i].getElementsByTagName("select");
      const symbolInputs = groupDivs[i].getElementsByClassName("symbolsInput");
      const baseInput = groupDivs[i].getElementsByClassName("baseInput")[0];
      // this will remove spaces https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String/split#Supprimer_les_espaces_d'une_cha%C3%AEne
      const regex = /\s*,\s*/;
      const symbolNames = symbolInputs[0].value.split(regex);
      const group = {
        name: groupNames[i].value,
        type: typeSelect[0].value,
        symbols: symbolNames,
        base: baseInput.value,
      };
      toSave.push(group);
  }
  browser.storage.sync.set({
    portfolios: toSave,
    portfoliosStates: Array(toSave.length).fill(true), // Reset collapsed sections
    lastSaveDate: Date.now(),
  });
}

function createGroupDiv(groupName, type, symbols, base) {
  const newGroupDiv = document.createElement('div');
  newGroupDiv.className = "group";
  newGroupDiv.innerHTML = `
    <div class="row">
      <div>Group name:<input class="groupName" value="${groupName}"></div>
      <div>Type:
        <select class="type">
          <option value="stocks">Stocks</option>
          <option value="forex" ${type === 'forex' ? 'selected="selected"' : ''}>Forex</option>
        </select>
      </div>
      <div class="base" style="display: ${type === 'forex' ? 'inline-block' : 'none'}">Base:
        <input class="baseInput" size="5" value="${base || 'USD'}">
      </div>
    </div>
    <div class="symbols row">
      Symbols: <input class="symbolsInput" style="flex-grow:1;" value="${symbols.join(", ")}" placeholder="Put symbols names separated by commas, e.g.: AMD, NVDA, NFLX, DVMT, SPOT">
    </div>
  `;
  const baseDiv = newGroupDiv.getElementsByClassName('base')[0];
  const typeSelect = newGroupDiv.getElementsByTagName('select')[0];
  typeSelect.onchange = function(e) {
    const display = baseDiv.style.display;
    baseDiv.style.display = display === 'none' ? 'inline-block' : 'none';
  }
  return newGroupDiv;
}
