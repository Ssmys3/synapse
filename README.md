# Synapse

Interactive associative concept map and dynamic knowledge graph powered by Vis.js and physics-based force simulation.

## Overview
Synapse allows you to explore associative connections between ideas, words, and concepts. It renders a living Force-Directed network graph in the browser where nodes attract, repel, and spring organically into place.

## Tech Stack
- Frontend: Vanilla JavaScript (ES6+), HTML5, CSS3
- Graph Engine: Vis.js Network (ForceAtlas2 physics engine)
- Styling: Dark mode UI with glassmorphism controls

## Project Structure
- index.html: Main layout and canvas container
- style.css: Dark UI, layout and glassmorphism styling
- app.js: Graph initialization, physics config, interaction logic
- README.md: Documentation

## How to Run
Simply open index.html in any modern web browser, or serve it locally:
python3 -m http.server 8000

Then visit http://localhost:8000
