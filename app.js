// app.js

// 1. Создаем пустые хранилища данных Vis.js
const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);

// 2. Находим контейнер и настраиваем физику
const container = document.getElementById("mynetwork");
const data = { nodes: nodes, edges: edges };

const options = {
  physics: {
    solver: "forceAtlas2Based",
    forceAtlas2Based: {
      gravitationalConstant: -50,
      centralGravity: 0.01,
      springLength: 100,
      springConstant: 0.08
    }
  }
};

// 3. Запускаем граф
const network = new vis.Network(container, data, options);

// 4. Функция поиска нового слова
function searchWord() {
  const input = document.getElementById("wordInput");
  const word = input.value.trim();
  if (!word) return;

  nodes.clear();
  edges.clear();

  // Добавляем центральный узел
  nodes.add({
    id: "root",
    label: word,
    color: "#6366f1",
    font: { color: "#ffffff", size: 20 }
  });

  input.value = "";
}

// Запуск поиска по нажатию клавиши Enter
document.getElementById("wordInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchWord();
});

