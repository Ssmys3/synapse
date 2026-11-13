// app.js — Synapse Infinite Multimodal MindMap Engine

// Color association map for common concepts
const COLOR_MAP = {
  coffee: "#6F4E37", espresso: "#3B2F2F", mocha: "#8B5A2B",
  milk: "#FDFBF7", tea: "#2E8B57", matcha: "#7C9D64",
  apple: "#DC2626", red: "#EF4444", wine: "#722F37",
  space: "#0B3D91", night: "#0A0B10", stars: "#FDE047",
  ocean: "#0284C7", water: "#38BDF8", sky: "#7DD3FC",
  forest: "#15803D", grass: "#22C55E", tree: "#166534",
  sun: "#F59E0B", gold: "#EAB308", fire: "#EA580C",
  cat: "#1E293B", shadow: "#0F172A", snow: "#F8FAFC"
};

// 1. Vis.js DataSets
const nodes = new vis.DataSet([]);
const edges = new vis.DataSet([]);
const expandedNodes = new Set();
let nodeCounter = 0;

// 2. Physics & Visual Configuration
const container = document.getElementById("mynetwork");
const data = { nodes: nodes, edges: edges };

const options = {
  physics: {
    solver: "forceAtlas2Based",
    forceAtlas2Based: {
      gravitationalConstant: -70,
      centralGravity: 0.012,
      springLength: 140,
      springConstant: 0.06,
      damping: 0.4
    },
    stabilization: {
      enabled: true,
      iterations: 150,
      updateInterval: 25
    }
  },
  edges: {
    smooth: {
      type: "continuous",
      roundness: 0.2
    }
  },
  interaction: {
    hover: true,
    zoomView: true,
    dragView: true
  }
};

const network = new vis.Network(container, data, options);

// 3. Multimodal Bloom Engine (Expands any node dynamically)
async function bloomNode(parentNodeId, word) {
  if (expandedNodes.has(parentNodeId)) {
    return; // Already bloomed
  }
  expandedNodes.add(parentNodeId);

  try {
    // 3 Parallel Queries: Triggers, Adjectives, Wikipedia Summary
    const [resContext, resProps, resWiki] = await Promise.all([
      fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(word)}&max=6`),
      fetch(`https://api.datamuse.com/words?rel_jjb=${encodeURIComponent(word)}&max=5`),
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`).catch(() => null)
    ]);

    const context = resContext.ok ? await resContext.json() : [];
    const props = resProps.ok ? await resProps.json() : [];
    const wiki = resWiki && resWiki.ok ? await resWiki.json() : null;

    const newNodes = [];
    const newEdges = [];

    // --- A. WIKIPEDIA PHOTO NODE (if available) ---
    if (wiki && wiki.thumbnail && wiki.thumbnail.source) {
      const photoId = `photo_${++nodeCounter}`;
      newNodes.push({
        id: photoId,
        shape: "circularImage",
        image: wiki.thumbnail.source,
        size: 34,
        borderWidth: 2,
        color: { border: "#ffffff", background: "#050508" },
        title: `Wikipedia: ${word}`
      });
      newEdges.push({
        from: parentNodeId,
        to: photoId,
        length: 130,
        color: { color: "rgba(255, 255, 255, 0.75)", highlight: "#ffffff" },
        width: 1.8
      });
    }

    // --- B. WIKIPEDIA CONTEXT CARD (Description) ---
    if (wiki && (wiki.description || wiki.extract)) {
      const summaryText = wiki.description || wiki.extract.slice(0, 60) + "...";
      const descId = `desc_${++nodeCounter}`;
      newNodes.push({
        id: descId,
        label: `✦ ${summaryText}`,
        shape: "box",
        color: { background: "#ffffff", border: "#ffffff" },
        font: { color: "#000000", size: 11, face: "monospace" },
        margin: 8,
        title: wiki.extract || ""
      });
      newEdges.push({
        from: parentNodeId,
        to: descId,
        length: 160,
        color: { color: "rgba(255, 255, 255, 0.35)" },
        width: 1
      });
    }

    // --- C. COLOR SWATCH NODE (if concept evokes color) ---
    const detectedColor = COLOR_MAP[word];
    if (detectedColor) {
      const colorId = `color_${++nodeCounter}`;
      newNodes.push({
        id: colorId,
        label: detectedColor,
        shape: "circle",
        color: { background: detectedColor, border: "#ffffff" },
        font: { color: "#ffffff", size: 10, face: "monospace" },
        size: 20,
        borderWidth: 2
      });
      newEdges.push({
        from: parentNodeId,
        to: colorId,
        length: 110,
        color: { color: "rgba(255, 255, 255, 0.5)" },
        width: 1.5
      });
    }

    // --- D. ASSOCIATIVE WORD NODES (Nouns & Adjectives) ---
    const seenWords = new Set([word]);
    const candidates = [];

    context.forEach(item => {
      if (!seenWords.has(item.word) && item.word.length < 18) {
        seenWords.add(item.word);
        candidates.push({ word: item.word, tier: "core" });
      }
    });

    props.forEach(item => {
      if (!seenWords.has(item.word) && item.word.length < 18) {
        seenWords.add(item.word);
        candidates.push({ word: item.word, tier: "prop" });
      }
    });

    // Take top 6-8 distinct concepts to keep map organically clustered
    const selected = candidates.slice(0, 7);

    selected.forEach((item) => {
      const childId = `word_${++nodeCounter}`;
      const isCore = item.tier === "core";

      newNodes.push({
        id: childId,
        label: `${item.word} +`, // "+" indicates it can bloom further!
        concept: item.word,
        color: {
          background: isCore ? "#ffffff" : "#0f172a",
          border: "#ffffff"
        },
        font: {
          color: isCore ? "#000000" : "#ffffff",
          size: isCore ? 14 : 12,
          face: "monospace"
        },
        shape: "box",
        margin: 7,
        borderWidth: 1
      });

      newEdges.push({
        from: parentNodeId,
        to: childId,
        length: isCore ? 140 : 210,
        color: {
          color: isCore ? "rgba(255, 255, 255, 0.45)" : "rgba(255, 255, 255, 0.2)",
          highlight: "#ffffff"
        },
        width: isCore ? 1.4 : 1
      });
    });

    // Add all nodes and edges in batch
    nodes.add(newNodes);
    edges.add(newEdges);

  } catch (err) {
    console.error("Bloom error:", err);
  }
}

// 4. Main Search Function (Initial Root Bloom)
async function searchWord() {
  const input = document.getElementById("wordInput");
  const word = input.value.trim().toLowerCase();
  if (!word) return;

  nodes.clear();
  edges.clear();
  expandedNodes.clear();
  nodeCounter = 0;

  // Create Root Luminous Sun
  const rootId = "root";
  nodes.add({
    id: rootId,
    label: word,
    concept: word,
    shape: "circle",
    size: 34,
    color: {
      background: "#ffffff",
      border: "#ffffff",
      highlight: { background: "#ffffff", border: "#ffffff" }
    },
    font: { color: "#000000", size: 20, face: "monospace", bold: true },
    borderWidth: 3,
    shadow: {
      enabled: true,
      color: "rgba(255, 255, 255, 0.6)",
      size: 25,
      x: 0,
      y: 0
    }
  });

  input.value = "";

  // Immediately bloom from root!
  await bloomNode(rootId, word);
}

// 5. Interactive Click: Click ANY node to bloom further!
network.on("click", async function (params) {
  if (!params.nodes || params.nodes.length === 0) return;

  const clickedId = params.nodes[0];
  const nodeData = nodes.get(clickedId);
  if (!nodeData) return;

  const word = nodeData.concept || nodeData.label.replace(" +", "");

  // Don't expand photo, desc, or color cards
  if (clickedId.startsWith("photo_") || clickedId.startsWith("desc_") || clickedId.startsWith("color_")) {
    return;
  }

  // Bloom further into the darkness!
  await bloomNode(clickedId, word);

  // Remove the "+" from label once bloomed
  if (nodeData.label && nodeData.label.endsWith(" +")) {
    nodes.update({
      id: clickedId,
      label: word
    });
  }
});

// 6. Enter Key trigger
document.getElementById("wordInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchWord();
});
