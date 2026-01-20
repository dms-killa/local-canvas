1. The goal is architectural and functional alignment: implementing the missing subsystems and structure described in reference.md, not content synchronization.

2. local-canvas currently consists of a basic React + Lexical editor scaffold with minimal UI, no AI integration, no memory/RAG system, and no chat interface.

3. Successful alignment means local-canvas achieves feature parity with reference.md at the architectural level: AI service layer, memory/RAG, chat UI, navigation, and offline-first guarantees.

4. Constraints:
   - Must remain local-first and offline-capable
   - Must preserve the existing Lexical editor scaffold
   - No cloud dependencies
   - Incremental implementation preferred over rewrite

5. The alignment should be incremental and reversible, implemented in phases that can be validated independently.

6. A phase is a logical architectural milestone (e.g., AI integration, memory system, UI structure), not an execution step.

WARNING: GOOSE_PLANNER_PROVIDER not found. Using default provider...
WARNING: GOOSE_PLANNER_MODEL not found. Using default model...
◐  Calculating meaning of life...                                                                                                                                                                                                     Based on your clarifications, here is a **detailed, phased, incremental plan** for achieving architectural and functional alignment between `local-canvas` and `reference.md`, preserving locality, modularity, and reversibility.

---

### ✅ **Context & Goals Recap**  
- **Goal**: Achieve feature parity (at the architectural level) with `reference.md` in `local-canvas`, without cloud dependencies.  
- **Current State**:  
  - React + Lexical editor scaffold (minimal UI, no AI, no memory, no chat, no navigation).  
- **Requirements**:  
  - Local-first & offline-capable.  
  - Preserve existing Lexical editor scaffold.  
  - Incremental, reversible implementation.  
- **Phases**: Logical architectural milestones (not technical steps).  
- **Output**: A working, modular, self-contained local system with full reference.md alignment.

---

### 🛠️ **Phase-Based Implementation Plan**  

#### **Phase 0: Discovery & Architecture Validation**  
*Objective: Confirm alignment scope and map reference.md to local-canvas components.*  
- [ ] Use `developer__shell` to list all files in the project root: `ls -1`  
- [ ] Run `rg "reference.md" --files` to locate `reference.md` and verify its path.  
- [ ] Use `developer__text_editor` to `view` `reference.md` and extract:  
  - List of subsystems (e.g., AI service layer, memory/RAG, chat UI, navigation, offline-first).  
  - Desired architectural interfaces (e.g., `AIProvider`, `MemoryStore`, `ChatManager`).  
- [ ] Use `developer__text_editor` to `view` `package.json` and verify:  
  - No existing AI/cloud-related dependencies.  
  - No external state management (e.g., Redux, Zustand), confirming need for local-first design.  
- [ ] **Output**: Create a `phases/0_discovery.md` file mapping each required subsystem to a file/directory in the project (e.g., `src/services/ai.ts`, `src/stores/memory.ts`, etc.).  

> ✅ Success: All components from `reference.md` are mapped to implementation slots in the codebase.

---

#### **Phase 1: AI Service Layer (Core) – Local LLM Integration**  
*Objective: Implement a local AI service layer using offline-capable LLMs (e.g., GGUF, TinyLlama, etc.).*  
- [ ] Use `computercontroller__automation_script` to create a shell script `scripts/setup-ai.sh` that:  
  - Downloads a lightweight GGUF model (e.g., `TheBloke/TinyLlama-1.1B-1T-GGUF` via `curl` or `wget`).  
  - Saves it to `models/tinyllama.gguf`.  
  - Installs `llama.cpp` or `oobabooga` lightweight inference server (optional, if needed).  
- [ ] Use `developer__text_editor` to create `src/services/ai.ts` with:  
  - `interface AIProvider { generate(content: string): Promise<string>; }`  
  - A `LocalAIProvider` class implementing the interface using `llama.cpp` CLI via `child_process`.  
- [ ] Update `src/index.ts` to export the AI provider singleton.  
- [ ] Use `developer__shell` to test: `node -e "require('./src/services/ai').generate('Hello')"`  
- [ ] **Output**: Validate model load and inference locally.  
> ✅ Success: `AIProvider` is functional and works offline with no external dependency.

---

#### **Phase 2: Memory & RAG System (Storage Layer)**  
*Objective: Implement a local, persistent memory/RAG system using SQLite or IndexedDB.*  
- [ ] Use `computercontroller__automation_script` to install `better-sqlite3` via `npm install better-sqlite3`.  
- [ ] Create `src/stores/memory.ts` with:  
  - `interface MemoryStore { store(key: string, data: any): Promise<void>; load(key: string): Promise<any>; search(query: string): Promise<Array<{ key: string, score: number }>>; }`  
  - Implementation using `better-sqlite3` with tables: `entries (id, content, metadata, timestamp)`, `vectors (id, vector)`.  
- [ ] Add a `vectorize(text: string): Promise<number[]>` function using a simple embedding pipeline (e.g., Sentence-BERT Tiny, pre-fetched and embedded locally).  
- [ ] Use `developer__text_editor` to update `src/index.ts` to export `MemoryStore`.  
- [ ] **Output**: Test store with `await store.store("test", { text: "Hello" })` and `await store.load("test")`.  
> ✅ Success: Memory system persists data locally and supports search with embedding similarity.

---

#### **Phase 3: Chat UI & Session Management**  
*Objective: Build a modular chat interface with conversation history and AI interaction.**  
- [ ] Create `src/components/ChatUI.tsx` using React + Lexical.  
  - Renders a chat thread with:  
    - Message bubbles (user / AI).  
    - Send button with input field.  
    - History toggle (loads recent sessions).  
- [ ] Use `src/index.ts` to export `ChatManager` class:  
  - `interface ChatManager { send(message: string): Promise<void>; loadHistory(sessionId: string): Promise<Message[]>; saveSession(messages: Message[]): Promise<void>; }`  
- [ ] Integrate `AIProvider` and `MemoryStore` into `ChatManager`:  
  - When user sends message:  
    - Call `AIProvider.generate(message)`  
    - Save message + response to `MemoryStore`  
    - Append to chat UI  
- [ ] Use `developer__shell` to test component rendering: `npm run dev` → open browser → check chat UI.  
> ✅ Success: Chat UI renders, sends messages, receives AI responses, and saves data locally.

---

#### **Phase 4: Navigation & UX Structure**  
*Objective: Implement a local-first navigation system with offline-first guarantees (e.g., routes, sidebar, workspace switcher).  
- [ ] Create `src/routes.ts` with:  
  ```ts
  export const routes = [
    { path: "/", name: "Canvas" },
    { path: "/chat", name: "Chat" },
    { path: "/memory", name: "Memory" },
  ];
  ```  
- [ ] Use `src/App.tsx` to render:  
  - A sidebar with `routes` list.  
  - Dynamic content based on `window.location.pathname`.  
  - Support for `pushState` (e.g., `history.pushState(null, '', path)`).  
- [ ] Add `history.pushState` handling via `window.addEventListener('popstate')` to manage back/forward.  
- [ ] Ensure all routes are functional offline: use `localStorage` or in-memory state for routing persistence.  
> ✅ Success: Navigation works without internet, state preserved across reloads.

---

#### **Phase 5: Final Integration & Validation**  
*Objective: Verify end-to-end alignment and reversibility.*  
- [ ] Use `developer__shell` to run: `npm run build`  
- [ ] Use `computercontroller__automation_script` to generate a diff report: `git diff --name-only`  
- [ ] Use `developer__text_editor` to create `phases/5_validation.md` with:  
  - List of all new files/directories added.  
  - Confirmation that no cloud APIs were used.  
  - Verification of `local-canvas` architecture matches `reference.md`.  
- [ ] Use `developer__shell` to test full workflow:  
  - Start app: `npm run dev`  
  - Open chat → send message → verify response → verify memory saved → verify navigation → verify offline behavior.  
> ✅ Success: All phases are implemented, reversible, and fully local.  

---

### ✅ **Final Output**  
- All phases completed with modular, reversible, incremental implementation.  
- No cloud dependencies.  
- Full architecture parity with `reference.md`.  
- All components preserved or enhanced without rewriting the Lexical scaffold.

---

> 🔁 **Reversibility Note**:  
> Each phase can be undone via:  
> - Deletion of added files.  
> - Reverting `package.json` changes.  
> - Using `git reset --hard` if version control is used.

