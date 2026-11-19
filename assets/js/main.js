(() => {
  "use strict";
  const config = window.RAY_CONFIG || {};
  const navItems = [
    ["Início", "index.html"],
    ["Sobre", "sobre.html"],
    ["Soluções", "solucoes.html"],
    ["Ferramentas", "ferramentas.html"],
    ["Conteúdos", "conteudos.html"]
  ];
  const path = window.location.pathname.split("/").pop() || "index.html";
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");

  if (header) {
    header.innerHTML = `
      <header class="site-header">
        <div class="section-shell nav-shell">
          <a class="brand" href="index.html" aria-label="Ray Financeiro — página inicial">
            <span class="brand-mark">R</span><span class="brand-name">ray<span>.</span><small>FINANCEIRO</small></span>
          </a>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" aria-label="Abrir menu"><span></span><span></span></button>
          <nav class="primary-nav" id="primary-nav" aria-label="Navegação principal">
            ${navItems.map(([label, href]) => `<a href="${href}" ${path === href ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
            <a class="nav-contact" href="contato.html">Fale com Ray <span aria-hidden="true">↗</span></a>
          </nav>
        </div>
      </header>`;
  }

  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <div class="section-shell footer-main">
          <div class="footer-brand-block">
            <a class="brand brand-footer" href="index.html"><span class="brand-mark">R</span><span class="brand-name">ray<span>.</span><small>FINANCEIRO</small></span></a>
            <p>Educação financeira para entender seu dinheiro, planejar seus próximos passos e fazer escolhas mais conscientes.</p>
          </div>
          <div class="footer-column"><b>EXPLORE</b><a href="sobre.html">Sobre o projeto</a><a href="solucoes.html">Soluções</a><a href="ferramentas.html">Ferramentas gratuitas</a><a href="conteudos.html">Conteúdos</a></div>
          <div class="footer-column"><b>CONTATO</b><a href="contato.html">Fale com Ray</a><a href="contato.html#formulario">Agendar conversa</a><a href="privacidade.html">Privacidade</a><a href="termos.html">Termos e avisos</a></div>
          <div class="footer-note"><span class="eyebrow eyebrow-light">UMA IDEIA PARA LEVAR</span><p>Organização não é sobre controlar cada centavo. É sobre fazer escolhas com mais consciência.</p><a class="footer-cta" href="ferramentas.html">Começar agora ↗</a></div>
        </div>
        <div class="section-shell footer-bottom"><span>© <span id="current-year"></span> Ray Financeiro. Todos os direitos reservados.</span><span>Feito com clareza e propósito.</span></div>
        <div class="section-shell footer-disclaimer">Conteúdo educativo e informativo. Não constitui recomendação individualizada de investimentos ou garantia de resultados.</div>
      </footer>`;
  }

  const year = document.getElementById("current-year");
  if (year) year.textContent = new Date().getFullYear();

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Abrir menu" : "Fechar menu");
      nav.classList.toggle("is-open", !open);
      document.body.classList.toggle("menu-open", !open);
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    }));
  }

  const digits = String(config.whatsapp || "").replace(/\D/g, "");
  const whatsappStatus = document.getElementById("contact-whatsapp-status");
  const emailStatus = document.getElementById("contact-email-status");
  if (whatsappStatus && digits) whatsappStatus.textContent = "Canal configurado para atendimento.";
  if (emailStatus && config.email) emailStatus.textContent = config.email;

  document.querySelectorAll("[data-product]").forEach(link => {
    link.addEventListener("click", () => {
      const product = link.getAttribute("data-product");
      const select = document.querySelector('#contact-form select[name="interest"]');
      if (select && product) {
        const map = {
          "Organiza 7 Dias": "Quero conhecer os materiais digitais",
          "Plano Financeiro Pessoal": "Tenho interesse no Plano Financeiro Pessoal",
          "Finanças na Prática": "Quero conhecer os materiais digitais",
          "Evolução 90": "Tenho interesse no Plano Financeiro Pessoal"
        };
        select.value = map[product] || "Outro assunto";
      }
    });
  });

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", event => {
      event.preventDefault();
      const status = document.getElementById("contact-status");
      if (!contactForm.reportValidity()) return;
      const data = new FormData(contactForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const interest = String(data.get("interest") || "").trim();
      const message = String(data.get("message") || "").trim();
      const body = [
        "Olá, Ray! Gostaria de conversar sobre organização financeira.",
        "",
        "Nome: " + name,
        "E-mail: " + email,
        "Assunto: " + interest,
        "Mensagem: " + (message || "Prefiro explicar durante a conversa.")
      ].join("\n");

      if (digits) {
        const url = "https://wa.me/" + digits + "?text=" + encodeURIComponent(body);
        window.open(url, "_blank", "noopener,noreferrer");
        status.textContent = "Sua mensagem foi preparada no WhatsApp. Revise e envie por lá.";
      } else if (config.email) {
        window.location.href = "mailto:" + encodeURIComponent(config.email) + "?subject=" + encodeURIComponent("Contato pelo site Ray Financeiro") + "&body=" + encodeURIComponent(body);
        status.textContent = "Seu aplicativo de e-mail foi aberto com a mensagem preparada.";
      } else {
        status.textContent = "O formulário está pronto, mas ainda não existe um canal de recebimento configurado. Adicione o WhatsApp ou e-mail em assets/js/config.js antes de publicar.";
      }
    });
  }

  document.querySelectorAll("[data-instagram]").forEach(link => {
    if (config.instagram) link.href = config.instagram;
    else {
      link.href = "contato.html";
      link.setAttribute("aria-label", "Configure o Instagram em assets/js/config.js");
    }
  });
})();