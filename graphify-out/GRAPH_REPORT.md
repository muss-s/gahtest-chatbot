# Graph Report - chatbot  (2026-11-12)

## Corpus Check
- 35 files · ~78,132 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 2)

## Summary
- 172 nodes · 290 edges · 10 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9

## God Nodes (most connected - your core abstractions)
1. `isAdmin()` - 17 edges
2. `handleEvent()` - 10 edges
3. `trim()` - 8 edges
4. `askLLM()` - 8 edges
5. `houseText()` - 7 edges
6. `houseText()` - 6 edges
7. `loadSettings()` - 6 edges
8. `cleanSettings()` - 6 edges
9. `quietState()` - 6 edges
10. `buildPrompt()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `isAdmin()`  [EXTRACTED]
  api/chat.js → lib/bot.js
- `POST()` --calls--> `isAdmin()`  [EXTRACTED]
  api/photo.js → lib/bot.js
- `GET()` --calls--> `isAdmin()`  [EXTRACTED]
  api/settings.js → lib/bot.js
- `PUT()` --calls--> `isAdmin()`  [EXTRACTED]
  api/settings.js → lib/bot.js
- `GET()` --calls--> `isAdmin()`  [EXTRACTED]
  api/today.js → lib/bot.js

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.12
Nodes (27): buildPrompt(), cached, cleanSettings(), FINANCING_TYPES, HANDOVER_TRIGGERS, HOUSE_FIELDS, HOUSE_STATUSES, housePhotos (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (23): ./api/chat.js, ./api/import.js, ./api/settings.js, ./api/status.js, ./api/webhook.js, ./lib/bot.js, agentOnly, auth (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (19): agentOnly, auth, bank, bella, calls, CHAIN, cleaned, failures (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (18): POST(), addLabel(), graph(), handleEvent(), handOver(), POST(), recentMessages(), recordLead() (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (19): askLLM(), buildPrompt(), cached, cleanSettings(), DEFAULT_SETTINGS, FINANCING_TYPES, HOUSE_FIELDS, HOUSE_STATUSES (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (11): decode(), POST(), DELETE(), GET(), POST(), GET(), groqModels(), GET() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (4): body, server, saved, saved

### Community 7 - "Community 7"
Cohesion: 0.27
Nodes (7): GET(), groqModels(), handleEvent(), POST(), recentMessages(), sendToMessenger(), validSignature()

### Community 8 - "Community 8"
Cohesion: 0.25
Nodes (8): dependencies, @vercel/blob@2.8.2, engines, node, name, private, type, @vercel/blob

### Community 9 - "Community 9"
Cohesion: 0.53
Nodes (5): GET(), PUT(), loadSettings(), saveSettings(), settingsFiles()

## Knowledge Gaps
- **6 isolated node(s):** `./api/webhook.js`, `./api/chat.js`, `./api/settings.js`, `./lib/bot.js`, `./api/status.js` (+1 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 77 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@vercel/blob` connect `Community 8` to `Community 0`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **What connects `./api/webhook.js`, `./api/chat.js`, `./api/settings.js` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12433862433862433 - nodes in this community are weakly interconnected._
- **Why does `isAdmin()` connect `Community 5` to `Community 0`, `Community 9`, `Community 3`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._