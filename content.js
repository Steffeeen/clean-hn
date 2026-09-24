(() => {
  const supportedLists = new Set(["/", "/news", "/newest", "/ask", "/show", "/best"]);
  const path = window.location.pathname;
  const isList = supportedLists.has(path);
  const isItem = path === "/item";

  if ((!isList && !isItem) || !document.querySelector("#hnmain")) return;

  const themes = new Set(["system", "light", "dark"]);
  const applyTheme = (theme) => {
    const selected = themes.has(theme) ? theme : "system";
    document.documentElement.dataset.mhnTheme = selected;
    document.querySelectorAll(".mhn-theme-option").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.theme === selected));
    });
  };
  applyTheme("system");
  globalThis.chrome?.storage?.local.get({ theme: "system" }, ({ theme }) => applyTheme(theme));

  const icon = (name) => {
    const icons = {
      search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>'
    };
    return icons[name];
  };

  const makeLink = (className, href, label, iconName) => {
    const link = document.createElement("a");
    link.className = className;
    link.href = href;
    link.setAttribute("aria-label", label);
    link.title = label;
    link.innerHTML = icon(iconName);
    return link;
  };

  const buildHeader = () => {
    const header = document.createElement("header");
    header.className = "mhn-header";

    const brand = document.createElement("a");
    brand.className = "mhn-brand";
    brand.href = "/news";
    brand.innerHTML = '<span class="mhn-logo">hn</span><span>Clean HN</span>';

    const nav = document.createElement("nav");
    nav.className = "mhn-nav";
    nav.setAttribute("aria-label", "Hacker News sections");
    const sections = [
      ["Top", "/news", path === "/" || path === "/news"],
      ["Ask", "/ask", path === "/ask"],
      ["Show", "/show", path === "/show"],
      ["Best", "/best", path === "/best"],
      ["New", "/newest", path === "/newest"]
    ];
    for (const [label, href, active] of sections) {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      if (active) link.setAttribute("aria-current", "page");
      nav.append(link);
    }

    const actions = document.createElement("div");
    actions.className = "mhn-actions";

    const themeSwitch = document.createElement("div");
    themeSwitch.className = "mhn-theme-switch";
    themeSwitch.setAttribute("role", "group");
    themeSwitch.setAttribute("aria-label", "Color theme");
    for (const theme of themes) {
      const button = document.createElement("button");
      button.className = "mhn-theme-option";
      button.type = "button";
      button.dataset.theme = theme;
      button.textContent = theme[0].toUpperCase() + theme.slice(1);
      button.setAttribute("aria-pressed", String(document.documentElement.dataset.mhnTheme === theme));
      button.addEventListener("click", () => {
        applyTheme(theme);
        globalThis.chrome?.storage?.local.set({ theme });
      });
      themeSwitch.append(button);
    }

    actions.append(
      themeSwitch,
      makeLink("mhn-icon-link", "https://hn.algolia.com/", "Search", "search")
    );

    header.append(brand, nav, actions);
    return header;
  };

  const separator = () => {
    const dot = document.createElement("span");
    dot.className = "mhn-dot";
    dot.textContent = "·";
    return dot;
  };

  const cleanText = (value) => value?.replace(/\s+/g, " ").trim() || "";

  const buildList = () => {
    const rows = [...document.querySelectorAll("tr.athing.submission")];
    if (!rows.length || document.querySelector("table.fatitem")) return null;

    const main = document.createElement("main");
    main.className = "mhn-main mhn-list-page";

    const list = document.createElement("ol");
    list.className = "mhn-story-list";

    for (const row of rows) {
      const titleLink = row.querySelector(".titleline > a");
      if (!titleLink) continue;

      const details = row.nextElementSibling?.querySelector(".subline");
      const item = document.createElement("li");
      item.className = "mhn-story";

      const title = titleLink.cloneNode(true);
      title.className = "mhn-story-title";

      const meta = document.createElement("div");
      meta.className = "mhn-story-meta";
      const site = row.querySelector(".sitestr")?.closest("a")?.cloneNode(true);
      const score = details?.querySelector(".score")?.cloneNode(true);
      const user = details?.querySelector(".hnuser")?.cloneNode(true);
      const age = details?.querySelector(".age a")?.cloneNode(true);
      const discussion = [...(details?.querySelectorAll("a") || [])].find((link) =>
        /comment|discuss/i.test(link.textContent)
      )?.cloneNode(true);

      const values = [site, score, user, age, discussion].filter(Boolean);
      values.forEach((value, index) => {
        if (index) meta.append(separator());
        if (value === site) value.className = "mhn-site";
        meta.append(value);
      });

      item.append(title, meta);
      list.append(item);
    }

    const more = document.querySelector(".morelink")?.cloneNode(true);
    if (more) {
      more.className = "mhn-more";
      more.textContent = "More stories";
    }

    main.append(list);
    if (more) main.append(more);
    return main;
  };

  const buildItem = () => {
    const story = document.querySelector("table.fatitem .athing.submission");
    if (!story) return null;

    const main = document.createElement("main");
    main.className = "mhn-main mhn-item-page";
    const hero = document.createElement("article");
    hero.className = "mhn-story-hero";

    const titleSource = story.querySelector(".titleline > a");
    const title = document.createElement("h1");
    const titleLink = titleSource?.cloneNode(true);
    if (titleLink) title.append(titleLink);

    const subline = story.nextElementSibling?.querySelector(".subline");
    const meta = document.createElement("div");
    meta.className = "mhn-hero-meta";
    const site = story.querySelector(".sitestr")?.closest("a")?.cloneNode(true);
    const score = subline?.querySelector(".score")?.cloneNode(true);
    const user = subline?.querySelector(".hnuser")?.cloneNode(true);
    const age = subline?.querySelector(".age a")?.cloneNode(true);
    [site, score, user, age].filter(Boolean).forEach((value, index) => {
      if (index) meta.append(separator());
      if (value === site) value.className = "mhn-site";
      meta.append(value);
    });

    const discussion = [...(subline?.querySelectorAll("a") || [])].find((link) => /comment|discuss/i.test(link.textContent));
    hero.append(title, meta);
    const storyText = document.querySelector("table.fatitem .toptext")?.cloneNode(true);
    if (storyText?.textContent.trim()) {
      storyText.className = "mhn-story-text";
      hero.append(storyText);
    }

    const commentRows = [...document.querySelectorAll(".comment-tree tr.comtr")];
    const commentsSection = document.createElement("section");
    commentsSection.className = "mhn-comments";
    const commentsTitle = document.createElement("h2");
    const commentLabel = cleanText(discussion?.textContent);
    commentsTitle.textContent = commentLabel && !/discuss/i.test(commentLabel) ? commentLabel : `${commentRows.length} comments`;
    commentsSection.append(commentsTitle);

    for (const row of commentRows) {
      const indent = Number(row.querySelector(".ind")?.getAttribute("indent") || 0);
      const comment = document.createElement("article");
      comment.className = "mhn-comment";
      comment.id = `mhn-${row.id}`;
      comment.dataset.indent = indent;
      comment.style.setProperty("--indent", Math.min(indent, 8));

      const head = document.createElement("header");
      head.className = "mhn-comment-head";
      const collapse = document.createElement("button");
      collapse.className = "mhn-collapse";
      collapse.type = "button";
      collapse.setAttribute("aria-label", "Collapse comment thread");
      collapse.setAttribute("aria-expanded", "true");

      const byline = document.createElement("div");
      byline.className = "mhn-comment-byline";
      const user = row.querySelector(".hnuser")?.cloneNode(true);
      const age = row.querySelector(".age a")?.cloneNode(true);
      if (user) byline.append(user);
      if (age) byline.append(separator(), age);

      head.append(collapse, byline);

      const body = row.querySelector(".commtext")?.cloneNode(true);
      if (body) body.className = "mhn-comment-body";
      comment.append(head);
      if (body) comment.append(body);
      commentsSection.append(comment);
    }

    commentsSection.addEventListener("click", (event) => {
      const button = event.target.closest(".mhn-collapse");
      if (!button) return;
      const comment = button.closest(".mhn-comment");
      const indent = Number(comment.dataset.indent);
      const collapsed = button.getAttribute("aria-expanded") === "false";
      button.setAttribute("aria-expanded", String(collapsed));
      comment.classList.toggle("is-collapsed", !collapsed);

      let sibling = comment.nextElementSibling;
      while (sibling?.classList.contains("mhn-comment") && Number(sibling.dataset.indent) > indent) {
        sibling.hidden = !collapsed;
        sibling = sibling.nextElementSibling;
      }
    });

    main.append(hero, commentsSection);
    return main;
  };

  const main = isList ? buildList() : buildItem();
  if (!main) return;

  document.documentElement.classList.add("modern-hn");
  document.body.prepend(buildHeader());
  document.body.append(main);
  applyTheme(document.documentElement.dataset.mhnTheme);
})();
