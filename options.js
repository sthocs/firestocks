function restoreSymbols() {
  var portfolios = browser.storage.sync.get('portfolios');
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

var symbols_editor = document.getElementById('symbols_editor');
var add_group = document.getElementById('add_group');

document.querySelector('#add_group_btn').addEventListener('click', function() {
  symbols_editor.insertBefore(createGroupDiv("", []), add_group);
});
document.querySelector('#remove_group_btn').addEventListener('click', function() {
  var groupDivs = document.getElementsByClassName("group");
  groupDivs[groupDivs.length - 1].parentNode.removeChild(groupDivs[groupDivs.length - 1]);
});

function generateExampleData() {
  var PORTFOLIOS = [
    {'name': 'Market ETFs', 'symbols': ['SPY', 'DIA', 'QQQ', 'IWM']},
    {'name': 'Tech', 'symbols': ['AMD', 'NVDA', 'NFLX', 'DVMT', 'SPOT']},
    {'name': 'Banks', 'symbols': ['GS', 'DB', 'CS', 'RBS']}
  ];
  restorePortfolios(PORTFOLIOS);
}

function restorePortfolios(portfolios) {
  // First clean all groups
  var groupDivs = document.getElementsByClassName("group");
  for (let i = groupDivs.length -1; i >= 0 ; --i) {
    groupDivs[i].parentNode.removeChild(groupDivs[i]);
  }

  if (!portfolios || portfolios.constructor !== Array) {
    symbols_editor.insertBefore(createGroupDiv("", []), add_group);
    return;
  }
  for (group of portfolios) {
    symbols_editor.insertBefore(createGroupDiv(group.name, group.symbols), add_group);
  }
}

function saveSymbols() {
  var toSave = [];
  var groupDivs = document.getElementsByClassName("groupName");
  var symbolsDivs = document.getElementsByClassName("symbols");
  for (let i = 0; i < groupDivs.length; ++i) {
      var symbolInputs = symbolsDivs[i].getElementsByTagName("input");
      // this will remove spaces https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String/split#Supprimer_les_espaces_d'une_cha%C3%AEne
      var regex = /\s*,\s*/;
      var symbolNames = symbolInputs[0].value.split(regex);
      var group = { name: groupDivs[i].value, symbols: symbolNames };
      toSave.push(group);
  }
  browser.storage.sync.set({
    portfolios: toSave
  });
}

function createGroupDiv(groupName, symbols) {
  var newGroupDiv = document.createElement('div');
  newGroupDiv.className = "group";

  var groupNameDiv = document.createElement('div');
  var input = document.createElement('input');
  groupNameDiv.innerText = "Group name: ";
  input.value = groupName;
  input.className = "groupName";
  groupNameDiv.appendChild(input);

  var symbolsDiv = document.createElement('div');
  symbolsDiv.className = "symbols";
  symbolsDiv.innerText = "Symbols: ";

  var symbolsInput = document.createElement('input');
  symbolsInput.placeholder = "Put symbols names separated by commas, e.g.: AMD, NVDA, NFLX, DVMT, SPOT";
  symbolsInput.value = symbols.join(", ");
  symbolsInput.size = 100;
  symbolsDiv.appendChild(symbolsInput);

  newGroupDiv.appendChild(groupNameDiv);
  newGroupDiv.appendChild(symbolsDiv);
  return newGroupDiv;
}
