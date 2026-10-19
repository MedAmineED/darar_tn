/* ============================================================
   Darihome i18n — Arabic (default) ⇄ French
   Swaps text + direction live, persists choice in localStorage.
   Usage in markup:
     <span data-i18n="nav.home"></span>
     <input data-i18n-attr="placeholder:form.email">
     <a data-i18n-attr="aria-label:nav.cart">
   ============================================================ */
(function () {
  "use strict";

  const DICT = {
    ar: {
      meta: {
        home_title: "داري هوم — مصنوعة يدويًا من أجل بيتك",
        shop_title: "داري هوم — تسوّق كل القطع",
        product_title: "داري هوم — مقعد البلوط المصنوع يدويًا",
        dir: "rtl",
      },
      brand: { name: "داري هوم" },
      nav: {
        home: "الرئيسية", shop: "المتجر", categories: "الفئات",
        about: "من نحن", contact: "اتصل بنا",
        search: "بحث", wishlist: "المفضلة", account: "حسابي", cart: "السلة",
        menu: "القائمة", close: "إغلاق", lang: "FR",
      },
      hero: {
        eyebrow: "حِرَفية خشبية أصيلة",
        title_1: "مصنوعة", title_2: "يدويًا", title_3: "من أجل", title_4: "بيتك",
        subtitle: "اكتشف قطع أثاث خشبية فريدة، مصمّمة بموادّ طبيعية وحِرفية خالدة وعناية بأدقّ التفاصيل.",
        cta_primary: "اكتشف المجموعة",
        cta_secondary: "قصّتنا",
        scroll: "اكتشف المزيد",
      },
      marquee: {
        a: "خشب صنوبر صلب", b: "صناعة يدوية", c: "توصيل لكامل الجمهورية",
        d: "تشطيب زيتي طبيعي", e: "تصميم مستدام",
      },
      cats: {
        title: "تسوّق حسب الفئة",
        subtitle: "مجموعات منتقاة لكل ركن من أركان بيتك.",
        stools: "المقاعد", tables: "الطاولات",
        shelves: "الرفوف الجدارية", pets: "أثاث الحيوانات",
        shop_now: "تسوّق الآن",
      },
      featured: {
        title: "قطع مختارة",
        subtitle: "الأكثر رواجًا هذا الموسم، مصنوعة قطعةً قطعة.",
        view_all: "عرض كل القطع",
        add: "أضف إلى السلة",
        sale: "تخفيض",
      },
      story: {
        eyebrow: "قصّتنا",
        title: "الجمال في البساطة",
        body: "في داري هوم نؤمن بأن الأثاث يُصنع ليدوم. كل قطعة تُنحت من خشب الصنوبر الصلب على يد حِرفيين، فتحمل دفء الصنعة اليدوية وسكينة العيش الهادئ.",
        stat_1_n: "100%", stat_1_l: "خشب طبيعي",
        stat_3_n: "+2000", stat_3_l: "بيت سعيد",
        cta: "تعرّف علينا أكثر",
      },
      news: {
        title: "انضمّ إلى عائلة داري هوم",
        subtitle: "اشترك لتصلك أخبار القطع الجديدة وإلهام العيش الهادئ.",
        placeholder: "بريدك الإلكتروني",
        button: "اشترك",
        note: "لا رسائل مزعجة، يمكنك إلغاء الاشتراك في أي وقت.",
      },
      footer: {
        tagline: "مصنوعة بدقّة وعناية.",
        col_shop: "المتجر", col_service: "الخدمة", col_contact: "تواصل", col_news: "النشرة",
        all: "كل المنتجات", furniture: "الأثاث", accessories: "الإكسسوارات",
        faq: "الأسئلة الشائعة", shipping: "الشحن والإرجاع", care: "دليل العناية",
        get_in_touch: "تواصل معنا", stores: "المتاجر",
        rights: "© 2026 داري هوم. جميع الحقوق محفوظة.",
        news_sub: "اشترك لتصلك أخبار العيش الهادئ.",
      },
      shop: {
        title: "تسوّق الكل",
        subtitle: "مصنوعة من أجل العيش الهادئ.",
        count: "6 منتجات",
        sort_by: "ترتيب حسب",
        sort_popular: "الأكثر رواجًا", sort_new: "وصل حديثًا", sort_price: "السعر: من الأقل",
        categories: "الفئات",
        finish: "نوع الخشب",
        light_oak: "بلوط فاتح", dark_walnut: "جوز داكن", natural_ash: "دردار طبيعي", reclaimed: "خشب مُعاد",
        price_range: "نطاق السعر",
        filters: "الفلاتر",
        apply: "تطبيق الفلاتر",
        cta_title: "تبحث عن شيء بعينه؟",
        cta_body: "اكتشف خدمة التصميم حسب الطلب لقياساتك الخاصة.",
        cta_button: "تواصل مع الورشة",
        prev: "السابق", next: "التالي",
      },
      product: {
        finish: "نوع الخشب",
        quantity: "الكمية",
        add_to_cart: "أضف إلى السلة",
        added: "أُضيف ✓",
        buy_now: "اشترِ الآن",
        specs: "المواصفات",
        material_l: "الخامة", material_v: "خشب صنوبر صلب",
        dims_l: "الأبعاد", dims_v: "45 سم ارتفاع × 30 سم عرض",
        finish_l: "التشطيب", finish_v: "زيت طبيعي",
        details: "التفاصيل والحِرفية",
        details_body: "كل مقعد يُنحت يدويًا من خشب الصنوبر المنتقى، ثم يُصقل ويُعالج بالزيت الطبيعي لإبراز عروق الخشب. مثالي كمقعد إضافي أو طاولة جانبية.",
        delivery: "التوصيل",
        delivery_body: "توصيل خلال 3 إلى 5 أيام عمل لكامل الجمهورية.",
        related: "قطع تُكمّل المشهد",
        share: "مشاركة",
      },
      crumbs: { home: "الرئيسية", shop: "المتجر", stools: "المقاعد", product: "مقعد كوبنهاغن" },
      products: {
        stool_kobenhavn: "مقعد كوبنهاغن",
        stool_aarhus: "مقعد آرهوس",
        shelf_fjord: "رفّ فيورد الجداري",
        desk_skagen: "مكتب سكاغن",
        pet_aalborg: "بيت آلبورغ للحيوانات",
        set_odense: "طقم مقاعد أودنسه",
      },
    },

    fr: {
      meta: {
        home_title: "Darihome — Fait main pour votre maison",
        shop_title: "Darihome — Toute la collection",
        product_title: "Darihome — Tabouret en chêne fait main",
        dir: "ltr",
      },
      brand: { name: "Darihome" },
      nav: {
        home: "Accueil", shop: "Boutique", categories: "Catégories",
        about: "À propos", contact: "Contact",
        search: "Rechercher", wishlist: "Favoris", account: "Compte", cart: "Panier",
        menu: "Menu", close: "Fermer", lang: "ع",
      },
      hero: {
        eyebrow: "Artisanat du bois authentique",
        title_1: "Fait", title_2: "main", title_3: "pour votre", title_4: "maison",
        subtitle: "Découvrez des meubles en bois uniques, conçus avec des matériaux naturels, un savoir-faire intemporel et le souci du moindre détail.",
        cta_primary: "Voir la collection",
        cta_secondary: "Notre histoire",
        scroll: "Explorer",
      },
      marquee: {
        a: "Bois de pin massif", b: "Fait main", c: "Livraison partout en Tunisie",
        d: "Finition à l'huile naturelle", e: "Design durable",
      },
      cats: {
        title: "Achetez par catégorie",
        subtitle: "Des collections pensées pour chaque coin de votre intérieur.",
        stools: "Tabourets", tables: "Tables",
        shelves: "Étagères murales", pets: "Mobilier animalier",
        shop_now: "Découvrir",
      },
      featured: {
        title: "Pièces choisies",
        subtitle: "Nos favoris de la saison, façonnés un par un.",
        view_all: "Voir tout",
        add: "Ajouter au panier",
        sale: "Solde",
      },
      story: {
        eyebrow: "Notre histoire",
        title: "La beauté de la simplicité",
        body: "Chez Darihome, nous croyons au mobilier fait pour durer. Chaque pièce est taillée dans du pin massif par des artisans, portant la chaleur du travail manuel et la sérénité d'un quotidien apaisé.",
        stat_1_n: "100 %", stat_1_l: "Bois naturel",
        stat_3_n: "2 000+", stat_3_l: "Foyers ravis",
        cta: "En savoir plus",
      },
      news: {
        title: "Rejoignez la famille Darihome",
        subtitle: "Abonnez-vous pour découvrir les nouveautés et notre inspiration slow living.",
        placeholder: "Votre adresse e-mail",
        button: "S'abonner",
        note: "Pas de spam, désabonnement à tout moment.",
      },
      footer: {
        tagline: "Fabriqué avec précision et soin.",
        col_shop: "Boutique", col_service: "Service", col_contact: "Contact", col_news: "Newsletter",
        all: "Tous les produits", furniture: "Meubles", accessories: "Accessoires",
        faq: "FAQ", shipping: "Livraison & retours", care: "Guide d'entretien",
        get_in_touch: "Nous contacter", stores: "Boutiques",
        rights: "© 2026 Darihome. Tous droits réservés.",
        news_sub: "Abonnez-vous pour un quotidien plus doux.",
      },
      shop: {
        title: "Toute la boutique",
        subtitle: "Fait pour le slow living.",
        count: "6 produits",
        sort_by: "Trier par",
        sort_popular: "Les plus populaires", sort_new: "Nouveautés", sort_price: "Prix croissant",
        categories: "Catégories",
        finish: "Essence de bois",
        light_oak: "Chêne clair", dark_walnut: "Noyer foncé", natural_ash: "Frêne naturel", reclaimed: "Bois recyclé",
        price_range: "Fourchette de prix",
        filters: "Filtres",
        apply: "Appliquer",
        cta_title: "Vous cherchez une pièce précise ?",
        cta_body: "Découvrez notre service sur mesure, à vos dimensions.",
        cta_button: "Contacter l'atelier",
        prev: "Précédent", next: "Suivant",
      },
      product: {
        finish: "Essence de bois",
        quantity: "Quantité",
        add_to_cart: "Ajouter au panier",
        added: "Ajouté ✓",
        buy_now: "Acheter maintenant",
        specs: "Spécifications",
        material_l: "Matériau", material_v: "Pin massif",
        dims_l: "Dimensions", dims_v: "45 cm H × 30 cm L",
        finish_l: "Finition", finish_v: "Huile naturelle",
        details: "Détails & savoir-faire",
        details_body: "Chaque tabouret est taillé à la main dans du pin sélectionné, poncé puis huilé pour révéler le veinage du bois. Parfait comme assise d'appoint ou table de chevet.",
        delivery: "Livraison",
        delivery_body: "Livraison en 3 à 5 jours ouvrés partout en Tunisie.",
        related: "Pièces complémentaires",
        share: "Partager",
      },
      crumbs: { home: "Accueil", shop: "Boutique", stools: "Tabourets", product: "Tabouret Kobenhavn" },
      products: {
        stool_kobenhavn: "Tabouret Kobenhavn",
        stool_aarhus: "Tabouret Aarhus",
        shelf_fjord: "Étagère murale Fjord",
        desk_skagen: "Bureau Skagen",
        pet_aalborg: "Maison animalière Aalborg",
        set_odense: "Ensemble de tabourets Odense",
      },
    },
  };

  const STORAGE_KEY = "darihome-lang";

  function get(dict, path) {
    return path.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : null), dict);
  }

  function apply(lang) {
    const dict = DICT[lang] || DICT.ar;
    const html = document.documentElement;
    html.setAttribute("lang", lang);
    html.setAttribute("dir", dict.meta.dir);

    // Text nodes
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const val = get(dict, el.getAttribute("data-i18n"));
      if (val != null) el.textContent = val;
    });

    // Attributes: "placeholder:form.email;aria-label:nav.cart"
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.getAttribute("data-i18n-attr").split(";").forEach((pair) => {
        const [attr, key] = pair.split(":");
        const val = get(dict, key);
        if (attr && val != null) el.setAttribute(attr.trim(), val);
      });
    });

    // Page title
    const titleKey = document.body.getAttribute("data-title-key");
    if (titleKey) {
      const t = get(dict, titleKey);
      if (t) document.title = t;
    }

    localStorage.setItem(STORAGE_KEY, lang);
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  function current() {
    return localStorage.getItem(STORAGE_KEY) || "ar";
  }

  function toggle() {
    const next = current() === "ar" ? "fr" : "ar";
    const body = document.body;
    body.classList.add("lang-fading");
    window.setTimeout(() => {
      apply(next);
      body.classList.remove("lang-fading");
    }, 220);
  }

  // Expose
  window.DariI18n = { apply, toggle, current };

  // Apply immediately (pre-paint to avoid flash where possible)
  apply(current());

  document.addEventListener("DOMContentLoaded", () => {
    apply(current());
    document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
      btn.addEventListener("click", toggle);
    });
  });
})();
