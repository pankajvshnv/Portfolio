document.addEventListener("DOMContentLoaded", () => {

  // ---- live clock ----
  const clockEl = document.getElementById("local-clock");
  function tick() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  tick();
  setInterval(tick, 1000);

  // ---- scrollspy: sync tab bar + sidebar + breadcrumb with visible section ----
  const sections = document.querySelectorAll(".code-section");
  const tabs = document.querySelectorAll(".tab");
  const fileItems = document.querySelectorAll(".file-item");
  const breadcrumb = document.getElementById("breadcrumb-text");

  const labels = {
    about: "portfolio > about.py",
    projects: "portfolio > projects.py",
    skills: "portfolio > skills.py",
    experience: "portfolio > experience.py",
    contact: "portfolio > contact.sh",
  };

  function setActive(id) {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.section === id));
    fileItems.forEach(f => f.classList.toggle("active", f.dataset.section === id));
    if (breadcrumb && labels[id]) breadcrumb.textContent = labels[id];
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: "-40% 0px -50% 0px", threshold: 0 });

  sections.forEach(sec => observer.observe(sec));

  // ---- mobile sidebar toggle ----
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    document.querySelectorAll(".file-item").forEach(item => {
      item.addEventListener("click", () => sidebar.classList.remove("open"));
    });
  }
  // ---- dynamic line numbering ----
  function updateLineNumbers() {
    const gutter = document.getElementById("global-line-gutter");
    const wrapper = document.querySelector(".content-wrapper");
    if (!gutter || !wrapper) return;
    
    // Approx 24.75px per line based on css line-height
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

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(updateLineNumbers);
    const wrapper = document.querySelector(".content-wrapper");
    if (wrapper) ro.observe(wrapper);
  }
});

window.openProject = function(projectId, projectName) {
  // Hide main content
  document.getElementById("main-content").style.display = "none";
  // Show project views container
  document.getElementById("project-content").style.display = "block";
  
  // Hide all individual project views
  document.querySelectorAll(".project-view").forEach(el => el.style.display = "none");
  // Show the specific project view
  document.getElementById("project-view-" + projectId).style.display = "block";
  
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
    projFile.style.paddingLeft = "24px"; // Indent to look like it's inside a folder
    projFile.innerHTML = `<span class="file-icon py">●</span>${projectName}`;
    projFile.onclick = (e) => { e.preventDefault(); openProject(projectId, projectName); };
    
    // Insert after projects.py
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
}

window.closeProject = function(projectId, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  // Remove tab and file item
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
    
    window.location.hash = "projects";
    
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.section === "projects"));
    document.querySelectorAll(".file-item").forEach(f => f.classList.toggle("active", f.dataset.section === "projects"));
    const breadcrumb = document.getElementById("breadcrumb-text");
    if (breadcrumb) {
      breadcrumb.textContent = "portfolio > projects.py";
    }
  }
}
