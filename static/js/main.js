document.addEventListener("DOMContentLoaded", () => {

  // ──── Live clock in sidebar ────
  const clockEl = document.getElementById("local-clock");
  function tick() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  tick();
  setInterval(tick, 1000);

  // ──── Scrollspy: sync tab bar + sidebar + breadcrumb + window title ────
  const sections = document.querySelectorAll(".code-section");
  const tabs = document.querySelectorAll(".tab:not(.dynamic-tab)");
  const fileItems = document.querySelectorAll(".file-item:not(.dynamic-file)");
  const breadcrumb = document.getElementById("breadcrumb-text");
  const winTitle = document.getElementById("window-title-text");

  const labels = {
    about: "portfolio > src > about.py",
    projects: "portfolio > src > projects.py",
    skills: "portfolio > src > skills.py",
    experience: "portfolio > src > experience.py",
    contact: "portfolio > src > contact.py",
    readme: "portfolio > README.md",
  };

  const titles = {
    about: "portfolio — about.py",
    projects: "portfolio — projects.py",
    skills: "portfolio — skills.py",
    experience: "portfolio — experience.py",
    contact: "portfolio — contact.py",
    readme: "portfolio — README.md",
  };

  function setActive(id) {
    if (document.getElementById("main-content").style.display === "none") return;
    tabs.forEach(t => t.classList.toggle("active", t.dataset.section === id));
    fileItems.forEach(f => {
      const match = f.dataset.section === id;
      f.classList.toggle("active", match);
    });
    if (breadcrumb && labels[id]) breadcrumb.textContent = labels[id];
    if (winTitle && titles[id]) winTitle.textContent = titles[id];
  }

  const editorPane = document.querySelector(".editor-pane");

  // ──── Enforce Zero-Scroll on Window Shell & Outer Containers ────
  function forceResetOuterScroll() {
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0);
    }
    const outerSelectors = [".window-shell", ".ide-shell", ".editor-column", ".activity-bar", ".sidebar", ".ai-dock"];
    for (let i = 0; i < outerSelectors.length; i++) {
      const el = document.querySelector(outerSelectors[i]);
      if (el && (el.scrollTop !== 0 || el.scrollLeft !== 0)) {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      }
    }
  }

  // Intercept any accidental scrolling on window or outer shell
  window.addEventListener("scroll", forceResetOuterScroll, { passive: true });
  document.addEventListener("scroll", (e) => {
    if (!e.target || e.target === document || e.target === document.body || e.target === document.documentElement) {
      forceResetOuterScroll();
    } else if (e.target.classList && (
      e.target.classList.contains("window-shell") ||
      e.target.classList.contains("ide-shell") ||
      e.target.classList.contains("editor-column") ||
      e.target.classList.contains("activity-bar") ||
      e.target.classList.contains("sidebar") ||
      e.target.classList.contains("ai-dock")
    )) {
      e.target.scrollTop = 0;
      e.target.scrollLeft = 0;
    }
  }, { capture: true, passive: true });

  // ──── Jump to Section inside Editor Pane only ────
  window.jumpToSection = function(targetId, smooth = true) {
    const targetEl = document.getElementById(targetId);
    if (targetEl && editorPane) {
      editorPane.scrollTo({
        top: Math.max(0, targetEl.offsetTop - 15),
        behavior: smooth ? "smooth" : "auto"
      });
      setActive(targetId);
      history.replaceState(null, "", window.location.pathname + "#" + targetId);
      forceResetOuterScroll();
    }
  };

  // ──── Handle Initial Page Hash without displacing the IDE window ────
  if (window.location.hash) {
    const initHash = window.location.hash.slice(1);
    // Neutralize initial hash jump on outer page
    history.replaceState(null, "", window.location.pathname);
    forceResetOuterScroll();

    setTimeout(() => {
      forceResetOuterScroll();
      window.jumpToSection(initHash, false);
    }, 50);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { root: editorPane, rootMargin: "-15% 0px -55% 0px", threshold: 0 });

  sections.forEach(sec => observer.observe(sec));

  // ──── Prevent Window Scrolling & Smoothly Scroll Editor Pane on Link Clicks ────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") return;
      e.preventDefault();
      const targetId = href.slice(1);
      window.jumpToSection(targetId, true);
    });
  });

  // ──── Folder collapse / expand toggles ────
  const rootToggle = document.getElementById("root-folder-toggle");
  const rootChevron = document.getElementById("root-chevron");
  const subfolderGroup = document.querySelector(".tree-subfolder-group");
  if (rootToggle) {
    rootToggle.addEventListener("click", () => {
      const isClosed = rootChevron && rootChevron.classList.toggle("collapsed");
      if (subfolderGroup) subfolderGroup.style.display = isClosed ? "none" : "";
    });
  }

  // Open Editors toggle (stays closed by default)
  const openEdToggle = document.getElementById("opened-editors-toggle");
  const openEdList = document.getElementById("opened-editors-list");
  const openEdChevron = document.getElementById("open-editors-chevron");
  if (openEdToggle && openEdList) {
    const userPref = localStorage.getItem("openEditorsExpanded");
    if (userPref === "true") {
      openEdList.classList.remove("collapsed");
      if (openEdChevron) openEdChevron.classList.remove("collapsed");
    } else {
      openEdList.classList.add("collapsed");
      if (openEdChevron) openEdChevron.classList.add("collapsed");
    }

    openEdToggle.addEventListener("click", () => {
      const isCollapsed = openEdList.classList.toggle("collapsed");
      if (openEdChevron) openEdChevron.classList.toggle("collapsed", isCollapsed);
      localStorage.setItem("openEditorsExpanded", (!isCollapsed).toString());
    });
  }

  // Templates folder toggle
  const tplToggle = document.getElementById("templates-folder-toggle");
  const tplChildren = document.getElementById("templates-folder-children");
  const tplChevron = document.getElementById("templates-chevron");
  if (tplToggle && tplChildren) {
    tplToggle.addEventListener("click", () => {
      const isCollapsed = tplChildren.classList.toggle("collapsed");
      if (tplChevron) tplChevron.classList.toggle("collapsed", isCollapsed);
    });
  }

  // Primary Sidebar layout toggle
  const sidebar = document.getElementById("sidebar");
  const sideToggleBtn = document.getElementById("toggle-sidebar-btn");
  const actExplorer = document.getElementById("act-explorer");
  function toggleSidebar() {
    if (!sidebar) return;
    const isClosed = sidebar.classList.toggle("collapsed");
    if (sideToggleBtn) sideToggleBtn.classList.toggle("active", !isClosed);
    if (actExplorer) actExplorer.classList.toggle("active", !isClosed);
  }
  if (sideToggleBtn) sideToggleBtn.addEventListener("click", toggleSidebar);
  if (actExplorer) actExplorer.addEventListener("click", toggleSidebar);

  // ──── Mobile sidebar toggle ────
  const mobToggleBtn = document.getElementById("sidebar-toggle");
  if (mobToggleBtn && sidebar) {
    mobToggleBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    document.querySelectorAll(".file-item").forEach(item => {
      item.addEventListener("click", () => sidebar.classList.remove("open"));
    });
  }

  // ──── Interactive VS Code Terminal ────
  const termInput = document.getElementById("term-input");
  const termHistory = document.getElementById("term-history");
  const termPanel = document.getElementById("terminal-panel");
  const termToggleBtn = document.getElementById("toggle-terminal-btn");

  const scrollPill = document.getElementById("editor-scroll-pill");

  window.toggleTerminal = function () {
    if (!termPanel) return;
    const isCollapsed = termPanel.classList.toggle("collapsed");
    document.body.classList.toggle("term-collapsed", isCollapsed);
    if (termToggleBtn) termToggleBtn.classList.toggle("active", !isCollapsed);
    if (!isCollapsed && termInput) termInput.focus();
  };

  window.terminalShowTab = function (tabName) {
    document.querySelectorAll(".term-tab").forEach(t => {
      t.classList.toggle("active", t.textContent.toLowerCase().includes(tabName));
    });
  };

  const termCommands = {
    help: "Available commands:\n  • whoami       : About Pankaj Bairagi\n  • about        : Jump to About section\n  • projects     : Jump to Featured Projects\n  • skills       : Jump to Tech Stack\n  • experience   : Jump to Career Timeline\n  • contact      : Jump to Get in Touch\n  • cat README.md: Display README overview\n  • python app.py: Simulate running FastAPI backend\n  • clear        : Clear terminal output",
    whoami: "Pankaj Bairagi — Gen AI Engineer\nLocation: Indore, India • Open to Work",
    about: () => { window.jumpToSection("about"); return "Navigated to about.py"; },
    projects: () => { window.jumpToSection("projects"); return "Navigated to projects.py"; },
    skills: () => { window.jumpToSection("skills"); return "Navigated to skills.py"; },
    experience: () => { window.jumpToSection("experience"); return "Navigated to experience.py"; },
    contact: () => { window.jumpToSection("contact"); return "Navigated to contact.py"; },
    "cat readme.md": "# Pankaj Bairagi Portfolio\nProduction AI Systems, RAG Pipelines & High-Performance Backends.\nStack: Python, FastAPI, PyTorch, LangChain, SQLite, Docker.",
    "python app.py": "INFO:     Started server process [8841]\nINFO:     Waiting for application startup.\nINFO:     Application startup complete.\nINFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)"
  };

  window.terminalExec = function (cmd) {
    if (!cmd) return;
    const trimmed = cmd.trim();
    if (trimmed.toLowerCase() === "clear") {
      if (termHistory) termHistory.innerHTML = "";
      return;
    }

    // Append entered command
    const cmdRow = document.createElement("div");
    cmdRow.className = "term-row";
    cmdRow.innerHTML = `<span class="term-user">pankajvshnv@Pankajs-MacBook</span> <span class="term-dir">portfolio</span> <span class="term-sym">%</span> <span>${trimmed}</span>`;
    termHistory.appendChild(cmdRow);

    const lookup = trimmed.toLowerCase();
    let reply = "";
    if (termCommands[lookup]) {
      const val = termCommands[lookup];
      reply = typeof val === "function" ? val() : val;
    } else {
      reply = `zsh: command not found: ${trimmed}. Type 'help' for available commands.`;
    }

    if (reply) {
      const respRow = document.createElement("div");
      respRow.className = "term-row term-info";
      respRow.style.whiteSpace = "pre-wrap";
      respRow.textContent = reply;
      termHistory.appendChild(respRow);
    }

    const termBody = document.getElementById("terminal-body");
    if (termBody) termBody.scrollTop = termBody.scrollHeight;
  };

  if (termInput) {
    termInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = termInput.value;
        termInput.value = "";
        window.terminalExec(cmd);
      }
    });
  }

  // ──── Dynamic Line Numbering Gutter ────
  function updateLineNumbers() {
    const gutter = document.getElementById("global-line-gutter");
    const wrapper = document.querySelector(".content-wrapper");
    if (!gutter || !wrapper) return;

    const lineHeight = 24.75;
    const numLines = Math.max(1, Math.floor(wrapper.offsetHeight / lineHeight));

    let html = '';
    for (let i = 1; i <= numLines; i++) {
      html += `<span>${i}</span>`;
    }

    if (gutter.innerHTML !== html) {
      gutter.innerHTML = html;
    }
  }

  updateLineNumbers();
  window.addEventListener("resize", updateLineNumbers);

  if (editorPane) {
    editorPane.addEventListener("scroll", () => {
      const lineHeight = 24.75;
      const currentLine = Math.max(1, Math.floor(editorPane.scrollTop / lineHeight) + 1);
      const cursorEl = document.getElementById("editor-cursor-pos");
      if (cursorEl) cursorEl.textContent = `Ln ${currentLine}, Col 1`;

      // Hide or show floating scroll pill based on scroll position
      if (scrollPill) {
        if (editorPane.scrollTop > 80) {
          scrollPill.classList.add("hidden");
        } else {
          scrollPill.classList.remove("hidden");
        }
      }
    });
  }

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(updateLineNumbers);
    const wrapper = document.querySelector(".content-wrapper");
    if (wrapper) ro.observe(wrapper);
  }

  // ──── Typewriter Focus Line ────
  const typedEl = document.getElementById('typed');
  const typedOut = document.getElementById('typed-text');
  if (typedEl && typedOut) {
    let words = [];
    try { words = JSON.parse(typedEl.dataset.words); } catch (e) { }
    if (!words.length) words = ['High-Performance Backend', 'LLMs & RAG Pipelines', 'Autonomous Agents'];
    let w = 0, i = 0, del = false;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const typeTick = () => {
      const word = String(words[w]);
      if (reduce) { typedOut.textContent = `"${word}"`; return; }
      typedOut.textContent = `"${word.slice(0, i)}"`;
      if (!del && i < word.length) {
        i++;
      } else if (!del) {
        del = true;
        return setTimeout(typeTick, 1500);
      } else if (i > 0) {
        i--;
      } else {
        del = false;
        w = (w + 1) % words.length;
      }
      setTimeout(typeTick, del ? 35 : 75);
    };
    typeTick();
  }

  // ──── Count-up Stats ────
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    let n = 0;
    const step = () => {
      n += Math.max(1, Math.ceil(target / 20));
      el.textContent = Math.min(n, target);
      if (n < target) setTimeout(step, 45);
    };
    setTimeout(step, 400);
  });

  // ──── 3D Card Tilt & Interactive Spotlight ────
  const canTilt = matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canTilt) {
    const tiltCards = document.querySelectorAll('.skill-card-modern, .hero-card');
    tiltCards.forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const rotY = (x - 0.5) * 10;
        const rotX = (0.5 - y) * 10;
        card.style.transform = `perspective(900px) rotateY(${rotY}deg) rotateX(${rotX}deg) translateY(-4px)`;
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ──── Scroll Reveal Observer ────
  const revealItems = document.querySelectorAll('.reveal');
  if (revealItems.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    revealItems.forEach((el, idx) => {
      el.style.transitionDelay = ((idx % 4) * 75) + 'ms';
      io.observe(el);
    });
  }
});

// ──── Project Tab & View Navigation ────
window.openProject = function (projectId, projectName) {
  // Hide main content
  document.getElementById("main-content").style.display = "none";
  // Show project views container
  document.getElementById("project-content").style.display = "block";

  // Hide all individual project views
  document.querySelectorAll(".project-view").forEach(el => el.style.display = "none");
  // Show the specific project view
  const targetView = document.getElementById("project-view-" + projectId);
  if (targetView) targetView.style.display = "block";

  // Manage Tabs
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  let projTab = document.getElementById("tab-proj-" + projectId);
  if (!projTab) {
    projTab = document.createElement("a");
    projTab.href = "#";
    projTab.className = "tab active dynamic-tab";
    projTab.id = "tab-proj-" + projectId;
    projTab.innerHTML = `${projectName} <span class="tab-close" onclick="closeProject('${projectId}', event)" style="margin-left: 8px; cursor: pointer; color: #ff5555; font-weight: bold;">✕</span>`;
    projTab.onclick = (e) => { e.preventDefault(); openProject(projectId, projectName); };
    document.getElementById("tab-bar").appendChild(projTab);
  } else {
    projTab.classList.add("active");
  }

  // Manage Sidebar
  document.querySelectorAll(".file-item").forEach(f => f.classList.remove("active"));
  let projFile = document.getElementById("file-proj-" + projectId);
  if (!projFile) {
    projFile = document.createElement("a");
    projFile.href = "#";
    projFile.className = "file-item active dynamic-file";
    projFile.id = "file-proj-" + projectId;
    projFile.style.paddingLeft = "24px";
    projFile.innerHTML = `<span class="file-icon py">●</span>${projectName}`;
    projFile.onclick = (e) => { e.preventDefault(); openProject(projectId, projectName); };

    const projectsFile = document.querySelector('.file-item[data-section="projects"]');
    if (projectsFile) {
      projectsFile.parentNode.insertBefore(projFile, projectsFile.nextSibling);
    } else {
      document.getElementById("file-tree").appendChild(projFile);
    }
  } else {
    projFile.classList.add("active");
  }

  // Update breadcrumb
  const breadcrumb = document.getElementById("breadcrumb-text");
  if (breadcrumb) {
    breadcrumb.textContent = "portfolio > projects > " + projectName;
  }
};

window.closeProject = function (projectId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const projTab = document.getElementById("tab-proj-" + projectId);
  if (projTab) projTab.remove();

  const projFile = document.getElementById("file-proj-" + projectId);
  if (projFile) projFile.remove();

  const remainingTabs = document.querySelectorAll(".dynamic-tab");
  if (remainingTabs.length > 0) {
    remainingTabs[remainingTabs.length - 1].click();
  } else {
    document.getElementById("project-content").style.display = "none";
    document.getElementById("main-content").style.display = "block";

    window.jumpToSection("projects", true);

    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.section === "projects"));
    document.querySelectorAll(".file-item").forEach(f => f.classList.toggle("active", f.dataset.section === "projects"));
    const breadcrumb = document.getElementById("breadcrumb-text");
    if (breadcrumb) {
      breadcrumb.textContent = "portfolio > projects.py";
    }
  }
};
