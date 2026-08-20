    const menuButton = document.querySelector(".menu-toggle");
    const links = document.querySelectorAll(".nav-links a");
    const form = document.querySelector("#quote-form");
    const note = document.querySelector("#form-note");

    if (menuButton) {
      menuButton.addEventListener("click", () => {
        const open = document.body.classList.toggle("menu-open");
        menuButton.setAttribute("aria-expanded", String(open));
        menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
    }

    links.forEach((link) => {
      link.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        if (menuButton) {
          menuButton.setAttribute("aria-expanded", "false");
          menuButton.setAttribute("aria-label", "Open menu");
        }
      });
    });

    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const submission = {
          name: data.get("name") || "",
          email: data.get("email") || "",
          phone: data.get("phone") || "",
          service: data.get("service") || "",
          message: data.get("message") || "",
          submittedAt: new Date().toISOString()
        };

        let saved = false;
        try {
          if (window.storage) {
            const key = "submissions:" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
            const result = await window.storage.set(key, JSON.stringify(submission), true);
            saved = !!result;
          }
        } catch (err) {
          console.error("Could not save submission:", err);
        }

        const subject = encodeURIComponent("GPSL website quote request");
        const body = encodeURIComponent(
          "Name: " + submission.name + "\n" +
          "Email: " + submission.email + "\n" +
          "Phone: " + submission.phone + "\n" +
          "Service: " + submission.service + "\n\n" +
          "Message:\n" + submission.message
        );

        if (note) {
          note.textContent = saved
            ? "Saved! Also opening your email app to send it directly."
            : "Opening your email app with the message ready to send.";
        }
        window.location.href = "mailto:GPSExpressTranport@gmail.com?subject=" + subject + "&body=" + body;
      });
    }

    /* Photo card lightbox */
    const photoCards = document.querySelectorAll(".team-photo");
    const lightbox = document.querySelector("#photoLightbox");
    const lightboxFrame = document.querySelector("#photoLightboxFrame");
    const lightboxName = document.querySelector("#photoLightboxName");
    const lightboxRole = document.querySelector("#photoLightboxRole");
    const lightboxContact = document.querySelector("#photoLightboxContact");
    const lightboxClose = document.querySelector("#photoLightboxClose");
    let lastFocused = null;

    function openLightbox(card) {
      const name = card.getAttribute("data-name") || "";
      const role = card.getAttribute("data-role") || "";
      const existingImg = card.querySelector("img");
      const photoUrl = (existingImg && existingImg.src) || card.getAttribute("data-photo") || "";
      const telegram = (card.getAttribute("data-telegram") || "").trim();

      lightboxName.textContent = name;
      lightboxRole.textContent = role;

      if (photoUrl) {
        lightboxFrame.innerHTML = '<img src="' + photoUrl + '" alt="' + name + '" />';
      } else {
        // No photo uploaded yet: reuse the same placeholder icon
        lightboxFrame.innerHTML = card.querySelector("svg").outerHTML;
      }

      lightboxContact.innerHTML = "";
      if (telegram) {
        const handle = telegram.replace(/^@/, "");
        const link = document.createElement("a");
        link.className = "contact-pill";
        link.href = "https://t.me/" + handle;
        link.target = "_blank";
        link.rel = "noopener";
        link.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.99 15.6 9.8 19.3c.36 0 .52-.16.71-.35l1.7-1.63 3.53 2.6c.65.36 1.11.17 1.29-.6l2.33-11c.24-1.02-.37-1.42-1.02-1.16L3.4 11.06c-1 .4-.98.96-.17 1.22l4.63 1.45L18.6 6.7c.5-.33.96-.15.58.18" /></svg><span>Telegram: @' +
          handle +
          "</span>";
        lightboxContact.appendChild(link);
      }

      lastFocused = document.activeElement;
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      lightboxClose.focus();
      document.addEventListener("keydown", onLightboxKeydown);
    }

    function closeLightbox() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.removeEventListener("keydown", onLightboxKeydown);
      if (lastFocused) lastFocused.focus();
    }

    function onLightboxKeydown(event) {
      if (event.key === "Escape") closeLightbox();
    }

    if (lightbox && lightboxClose) {
      photoCards.forEach((card) => {
        card.addEventListener("click", () => openLightbox(card));
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openLightbox(card);
          }
        });
      });

      lightboxClose.addEventListener("click", closeLightbox);
      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) closeLightbox();
      });
    }

    /* Admin view: visit the page with #admin in the URL to see saved quote requests */
    const adminPanel = document.querySelector("#adminPanel");
    const adminList = document.querySelector("#adminList");
    const adminClose = document.querySelector("#adminClose");

    async function openAdminPanel() {
      adminList.innerHTML = '<p class="admin-empty">Loading...</p>';
      adminPanel.classList.add("open");
      adminPanel.setAttribute("aria-hidden", "false");

      try {
        if (!window.storage) {
          adminList.innerHTML = '<p class="admin-empty">Storage isn\'t available in this view.</p>';
          return;
        }
        const listResult = await window.storage.list("submissions:", true);
        const keys = (listResult && listResult.keys) || [];
        if (!keys.length) {
          adminList.innerHTML = '<p class="admin-empty">No quote requests saved yet.</p>';
          return;
        }
        const rows = [];
        for (const key of keys) {
          try {
            const item = await window.storage.get(key, true);
            const s = JSON.parse(item.value);
            rows.push(
              '<div class="admin-row"><strong>' + (s.name || "—") + '</strong> · ' +
              (s.email || "—") + " · " + (s.phone || "—") + "<br>" +
              "Service: " + (s.service || "—") + "<br>" +
              (s.message || "").replace(/</g, "&lt;") + "<br>" +
              '<span style="color: var(--mist)">' + new Date(s.submittedAt).toLocaleString() + "</span></div>"
            );
          } catch (e) {
            // skip unreadable entries
          }
        }
        rows.reverse();
        adminList.innerHTML = rows.join("") || '<p class="admin-empty">No quote requests saved yet.</p>';
      } catch (err) {
        adminList.innerHTML = '<p class="admin-empty">Couldn\'t load saved requests.</p>';
      }
    }

    function closeAdminPanel() {
      adminPanel.classList.remove("open");
      adminPanel.setAttribute("aria-hidden", "true");
    }

    if (adminPanel && adminList && adminClose) {
      adminClose.addEventListener("click", closeAdminPanel);
      adminPanel.addEventListener("click", (event) => {
        if (event.target === adminPanel) closeAdminPanel();
      });

      if (window.location.hash === "#admin") openAdminPanel();
      window.addEventListener("hashchange", () => {
        if (window.location.hash === "#admin") openAdminPanel();
      });
    }

    /* Promo slider (homepage only) */
    const promoSlider = document.querySelector("#promoSlider");
    if (promoSlider) {
      const slides = Array.from(promoSlider.querySelectorAll(".promo-slide"));
      const dots = Array.from(promoSlider.querySelectorAll(".promo-dot"));
      const prevBtn = document.querySelector("#promoPrev");
      const nextBtn = document.querySelector("#promoNext");
      let current = 0;
      let timer = null;
      const INTERVAL = 5000;

      function goTo(index) {
        slides[current].classList.remove("active");
        dots[current].classList.remove("active");
        current = (index + slides.length) % slides.length;
        slides[current].classList.add("active");
        dots[current].classList.add("active");
      }

      function next() { goTo(current + 1); }
      function prev() { goTo(current - 1); }

      function startAutoplay() {
        stopAutoplay();
        timer = setInterval(next, INTERVAL);
      }
      function stopAutoplay() {
        if (timer) clearInterval(timer);
      }

      if (nextBtn) nextBtn.addEventListener("click", () => { next(); startAutoplay(); });
      if (prevBtn) prevBtn.addEventListener("click", () => { prev(); startAutoplay(); });
      dots.forEach((dot) => {
        dot.addEventListener("click", () => {
          goTo(parseInt(dot.dataset.dot, 10));
          startAutoplay();
        });
      });

      promoSlider.addEventListener("mouseenter", stopAutoplay);
      promoSlider.addEventListener("mouseleave", startAutoplay);

      startAutoplay();
    }
