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
  symbols_editor.insertBefore(createGroupDiv("", []), add_group);
});
document.querySelector('#remove_group_btn').addEventListener('click', function() {
  const groupDivs = document.getElementsByClassName("group");
  groupDivs[groupDivs.length - 1].parentNode.removeChild(groupDivs[groupDivs.length - 1]);
});

function generateExampleData() {
  const exampleData = [
    {'name': 'Market ETFs', 'symbols': ['SPY', 'DIA', 'QQQ', 'IWM']},
    {'name': 'Tech', 'symbols': ['AMD', 'NVDA', 'NFLX', 'DVMT', 'SPOT']},
    {'name': 'Banks', 'symbols': ['GS', 'DB', 'CS', 'RBS']}
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
    symbols_editor.insertBefore(createGroupDiv("", []), add_group);
    return;
  }
  for (group of portfolios) {
    symbols_editor.insertBefore(createGroupDiv(group.name, group.symbols), add_group);
  }
}

function saveSymbols() {
  const toSave = [];
  const groupDivs = document.getElementsByClassName("groupName");
  const symbolsDivs = document.getElementsByClassName("symbols");
  for (let i = 0; i < groupDivs.length; ++i) {
      const symbolInputs = symbolsDivs[i].getElementsByTagName("input");
      // this will remove spaces https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String/split#Supprimer_les_espaces_d'une_cha%C3%AEne
      const regex = /\s*,\s*/;
      const symbolNames = symbolInputs[0].value.split(regex);
      const group = { name: groupDivs[i].value, symbols: symbolNames };
      toSave.push(group);
  }
  browser.storage.sync.set({
    portfolios: toSave,
    portfoliosStates: Array(toSave.length).fill(true) // Reset collapsed sections
  });
}

function createGroupDiv(groupName, symbols) {
  const newGroupDiv = document.createElement('div');
  newGroupDiv.className = "group";

  const groupNameDiv = document.createElement('div');
  const input = document.createElement('input');
  groupNameDiv.innerText = "Group name: ";
  input.value = groupName;
  input.className = "groupName";
  groupNameDiv.appendChild(input);

  const symbolsDiv = document.createElement('div');
  symbolsDiv.className = "symbols";
  symbolsDiv.innerText = "Symbols: ";

  const symbolsInput = document.createElement('input');
  symbolsInput.placeholder = "Put symbols names separated by commas, e.g.: AMD, NVDA, NFLX, DVMT, SPOT";
  symbolsInput.value = symbols.join(", ");
  symbolsInput.size = 100;
  symbolsDiv.appendChild(symbolsInput);

  newGroupDiv.appendChild(groupNameDiv);
  newGroupDiv.appendChild(symbolsDiv);
  return newGroupDiv;
}
