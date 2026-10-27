import type { Locale } from './config';

/**
 * UI string dictionary, ported from the template's assets/js/i18n.js.
 * Product/category *content* comes from the API; these are chrome strings only.
 */
export interface Dictionary {
  meta: { homeTitle: string; shopTitle: string; siteName: string };
  brand: { name: string };
  nav: {
    home: string;
    shop: string;
    categories: string;
    about: string;
    contact: string;
    search: string;
    wishlist: string;
    account: string;
    cart: string;
    menu: string;
    close: string;
    lang: string;
  };
  hero: {
    eyebrow: string;
    title1: string;
    title2: string;
    title3: string;
    title4: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scroll: string;
  };
  marquee: { a: string; b: string; c: string; d: string; e: string };
  cats: { title: string; subtitle: string; shopNow: string };
  featured: {
    title: string;
    subtitle: string;
    viewAll: string;
    add: string;
    sale: string;
  };
  story: {
    eyebrow: string;
    title: string;
    body: string;
    stat1n: string;
    stat1l: string;
    stat3n: string;
    stat3l: string;
    cta: string;
  };
  news: {
    title: string;
    subtitle: string;
    placeholder: string;
    button: string;
    note: string;
  };
  footer: {
    tagline: string;
    colShop: string;
    colService: string;
    colContact: string;
    all: string;
    furniture: string;
    accessories: string;
    faq: string;
    shipping: string;
    care: string;
    getInTouch: string;
    stores: string;
    rights: string;
  };
  shop: {
    title: string;
    subtitle: string;
    sortBy: string;
    sortPopular: string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    categories: string;
    all: string;
    filters: string;
    apply: string;
    empty: string;
    ctaTitle: string;
    ctaBody: string;
    ctaButton: string;
    prev: string;
    next: string;
    page: string;
    search: string;
    searchClear: string;
  };
  product: {
    quantity: string;
    addToCart: string;
    added: string;
    specs: string;
    details: string;
    delivery: string;
    deliveryBody: string;
    related: string;
    share: string;
    outOfStock: string;
    home: string;
    shop: string;
    trustDelivery: string;
    trustDeliveryNote: string;
    trustCod: string;
    trustCodNote: string;
    recentlyViewed: string;
  };
  cart: {
    title: string;
    empty: string;
    emptyHint: string;
    subtotal: string;
    shippingNote: string;
    checkout: string;
    continue: string;
    remove: string;
    each: string;
    delivery: string;
    deliveryFree: string;
    total: string;
  };
  checkout: {
    title: string;
    contactInfo: string;
    name: string;
    phone: string;
    email: string;
    optional: string;
    address: string;
    addressHint: string;
    notes: string;
    summary: string;
    subtotal: string;
    total: string;
    delivery: string;
    deliveryFree: string;
    codNote: string;
    place: string;
    placing: string;
    emptyTitle: string;
    emptyHint: string;
    successTitle: string;
    successBody: string;
    orderNumber: string;
    errorUnavailable: string;
    errorGeneric: string;
  };
  common: { currency: string };
  packs: {
    title: string;
    subtitle: string;
    badge: string;
    includes: string;
    save: string;
    viewAll: string;
    empty: string;
    contents: string;
    separately: string;
    others: string;
  };
}

const ar: Dictionary = {
  meta: {
    homeTitle: 'مصنوعة يدويًا من أجل بيتك',
    shopTitle: 'تسوّق كل القطع',
    siteName: 'دارار',
  },
  brand: { name: 'دارار' },
  nav: {
    home: 'الرئيسية',
    shop: 'المتجر',
    categories: 'الفئات',
    about: 'من نحن',
    contact: 'اتصل بنا',
    search: 'بحث',
    wishlist: 'المفضلة',
    account: 'حسابي',
    cart: 'السلة',
    menu: 'القائمة',
    close: 'إغلاق',
    lang: 'FR',
  },
  hero: {
    eyebrow: 'حِرَفية خشبية أصيلة',
    title1: 'مصنوعة',
    title2: 'يدويًا',
    title3: 'من أجل',
    title4: 'بيتك',
    subtitle:
      'اكتشف قطع أثاث خشبية فريدة، مصمّمة بموادّ طبيعية وحِرفية خالدة وعناية بأدقّ التفاصيل.',
    ctaPrimary: 'اكتشف المجموعة',
    ctaSecondary: 'قصّتنا',
    scroll: 'اكتشف المزيد',
  },
  marquee: {
    a: 'خشب عالي الجودة',
    b: 'صناعة يدوية',
    c: 'توصيل لكامل الجمهورية',
    d: 'تشطيب زيتي طبيعي',
    e: 'تصميم مستدام',
  },
  cats: {
    title: 'تسوّق حسب الفئة',
    subtitle: 'مجموعات منتقاة لكل ركن من أركان بيتك.',
    shopNow: 'تسوّق الآن',
  },
  featured: {
    title: 'قطع مختارة',
    subtitle: 'الأكثر رواجًا هذا الموسم، مصنوعة قطعةً قطعة.',
    viewAll: 'عرض كل القطع',
    add: 'أضف إلى السلة',
    sale: 'تخفيض',
  },
  story: {
    eyebrow: 'قصّتنا',
    title: 'الجمال في البساطة',
    body: 'في دارار نؤمن بأن الأثاث يُصنع ليدوم. كل قطعة تُنحت من خشب عالي الجودة على يد حِرفيين، فتحمل دفء الصنعة اليدوية وسكينة العيش الهادئ.',
    stat1n: '100%',
    stat1l: 'خشب طبيعي',
    stat3n: '+2000',
    stat3l: 'بيت سعيد',
    cta: 'تعرّف علينا أكثر',
  },
  news: {
    title: 'انضمّ إلى عائلة دارار',
    subtitle: 'اشترك لتصلك أخبار القطع الجديدة وإلهام العيش الهادئ.',
    placeholder: 'بريدك الإلكتروني',
    button: 'اشترك',
    note: 'لا رسائل مزعجة، يمكنك إلغاء الاشتراك في أي وقت.',
  },
  footer: {
    tagline: 'مصنوعة بدقّة وعناية.',
    colShop: 'المتجر',
    colService: 'الخدمة',
    colContact: 'تواصل',
    all: 'كل المنتجات',
    furniture: 'الأثاث',
    accessories: 'الإكسسوارات',
    faq: 'الأسئلة الشائعة',
    shipping: 'الشحن والإرجاع',
    care: 'دليل العناية',
    getInTouch: 'تواصل معنا',
    stores: 'المتاجر',
    rights: '© 2026 دارار. جميع الحقوق محفوظة.',
  },
  shop: {
    title: 'تسوّق الكل',
    subtitle: 'مصنوعة من أجل العيش الهادئ.',
    sortBy: 'ترتيب حسب',
    sortPopular: 'الأكثر رواجًا',
    sortNewest: 'وصل حديثًا',
    sortPriceAsc: 'السعر: من الأقل',
    sortPriceDesc: 'السعر: من الأعلى',
    categories: 'الفئات',
    all: 'كل الفئات',
    filters: 'الفلاتر',
    apply: 'تطبيق الفلاتر',
    empty: 'لا توجد منتجات مطابقة.',
    ctaTitle: 'تبحث عن شيء بعينه؟',
    ctaBody: 'اكتشف خدمة التصميم حسب الطلب لقياساتك الخاصة.',
    ctaButton: 'تواصل مع الورشة',
    prev: 'السابق',
    next: 'التالي',
    page: 'صفحة',
    search: 'ابحث عن منتج…',
    searchClear: 'مسح',
  },
  product: {
    quantity: 'الكمية',
    addToCart: 'أضف إلى السلة',
    added: 'أُضيف ✓',
    specs: 'المواصفات',
    details: 'التفاصيل والحِرفية',
    delivery: 'التوصيل',
    deliveryBody:
      'توصيل خلال 3 إلى 5 أيام عمل لكامل الجمهورية.',
    related: 'قطع تُكمّل المشهد',
    share: 'مشاركة',
    outOfStock: 'غير متوفر حاليًا',
    home: 'الرئيسية',
    shop: 'المتجر',
    trustDelivery: 'توصيل لكامل الجمهورية',
    trustDeliveryNote: 'خلال 3 إلى 5 أيام عمل',
    trustCod: 'الدفع عند الاستلام',
    trustCodNote: 'ادفع نقدًا عند وصول طلبك',
    recentlyViewed: 'شاهدتَ مؤخّرًا',
  },
  cart: {
    title: 'سلة التسوّق',
    empty: 'سلتك فارغة',
    emptyHint: 'أضف بعض القطع الجميلة لتبدأ.',
    subtotal: 'المجموع الفرعي',
    shippingNote: 'تُحتسب مصاريف التوصيل عند إتمام الطلب.',
    checkout: 'إتمام الطلب',
    continue: 'مواصلة التسوّق',
    remove: 'إزالة',
    each: 'للقطعة',
    delivery: 'التوصيل',
    deliveryFree: 'مجاني',
    total: 'الإجمالي',
  },
  checkout: {
    title: 'إتمام الطلب',
    contactInfo: 'معلومات التواصل والتوصيل',
    name: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني',
    optional: 'اختياري',
    address: 'عنوان التوصيل',
    addressHint: 'المدينة، الشارع، رقم المنزل…',
    notes: 'ملاحظات',
    summary: 'ملخّص الطلب',
    subtotal: 'المجموع الفرعي',
    total: 'الإجمالي',
    delivery: 'التوصيل',
    deliveryFree: 'مجاني',
    codNote: 'الدفع عند الاستلام — تُحتسب مصاريف التوصيل عند التأكيد.',
    place: 'تأكيد الطلب',
    placing: 'جارٍ إرسال الطلب…',
    emptyTitle: 'سلتك فارغة',
    emptyHint: 'أضف بعض القطع قبل إتمام الطلب.',
    successTitle: 'تمّ استلام طلبك بنجاح!',
    successBody: 'شكرًا لك. سنتواصل معك هاتفيًا لتأكيد الطلب وموعد التوصيل.',
    orderNumber: 'رقم الطلب',
    errorUnavailable: 'إحدى القطع لم تعد متوفّرة. يرجى مراجعة سلتك.',
    errorGeneric: 'تعذّر إتمام الطلب. حاول مرة أخرى.',
  },
  common: { currency: 'د.ت' },
  packs: {
    title: 'عروض الباقات',
    subtitle: 'مجموعات قطع متناسقة بسعر خاص.',
    badge: 'باقة',
    includes: 'تحتوي على',
    save: 'وفّر',
    viewAll: 'كل الباقات',
    empty: 'لا توجد باقات متاحة حاليًا.',
    contents: 'محتوى الباقة',
    separately: 'السعر عند شراء القطع منفردة:',
    others: 'باقات أخرى',
  },
};

const fr: Dictionary = {
  meta: {
    homeTitle: 'Fait main pour votre maison',
    shopTitle: 'Toute la collection',
    siteName: 'Darar',
  },
  brand: { name: 'Darar' },
  nav: {
    home: 'Accueil',
    shop: 'Boutique',
    categories: 'Catégories',
    about: 'À propos',
    contact: 'Contact',
    search: 'Rechercher',
    wishlist: 'Favoris',
    account: 'Compte',
    cart: 'Panier',
    menu: 'Menu',
    close: 'Fermer',
    lang: 'ع',
  },
  hero: {
    eyebrow: 'Artisanat du bois authentique',
    title1: 'Fait',
    title2: 'main',
    title3: 'pour votre',
    title4: 'maison',
    subtitle:
      'Découvrez des meubles en bois uniques, conçus avec des matériaux naturels, un savoir-faire intemporel et le souci du moindre détail.',
    ctaPrimary: 'Voir la collection',
    ctaSecondary: 'Notre histoire',
    scroll: 'Explorer',
  },
  marquee: {
    a: 'Bois de haute qualité',
    b: 'Fait main',
    c: 'Livraison partout en Tunisie',
    d: 'Finition à l’huile naturelle',
    e: 'Design durable',
  },
  cats: {
    title: 'Achetez par catégorie',
    subtitle: 'Des collections pensées pour chaque coin de votre intérieur.',
    shopNow: 'Découvrir',
  },
  featured: {
    title: 'Pièces choisies',
    subtitle: 'Nos favoris de la saison, façonnés un par un.',
    viewAll: 'Voir tout',
    add: 'Ajouter au panier',
    sale: 'Solde',
  },
  story: {
    eyebrow: 'Notre histoire',
    title: 'La beauté de la simplicité',
    body: 'Chez Darar, nous croyons au mobilier fait pour durer. Chaque pièce est taillée dans un bois de haute qualité par des artisans, portant la chaleur du travail manuel et la sérénité d’un quotidien apaisé.',
    stat1n: '100 %',
    stat1l: 'Bois naturel',
    stat3n: '2 000+',
    stat3l: 'Foyers ravis',
    cta: 'En savoir plus',
  },
  news: {
    title: 'Rejoignez la famille Darar',
    subtitle:
      'Abonnez-vous pour découvrir les nouveautés et notre inspiration slow living.',
    placeholder: 'Votre adresse e-mail',
    button: 'S’abonner',
    note: 'Pas de spam, désabonnement à tout moment.',
  },
  footer: {
    tagline: 'Fabriqué avec précision et soin.',
    colShop: 'Boutique',
    colService: 'Service',
    colContact: 'Contact',
    all: 'Tous les produits',
    furniture: 'Meubles',
    accessories: 'Accessoires',
    faq: 'FAQ',
    shipping: 'Livraison & retours',
    care: 'Guide d’entretien',
    getInTouch: 'Nous contacter',
    stores: 'Boutiques',
    rights: '© 2026 Darar. Tous droits réservés.',
  },
  shop: {
    title: 'Toute la boutique',
    subtitle: 'Fait pour le slow living.',
    sortBy: 'Trier par',
    sortPopular: 'Les plus populaires',
    sortNewest: 'Nouveautés',
    sortPriceAsc: 'Prix croissant',
    sortPriceDesc: 'Prix décroissant',
    categories: 'Catégories',
    all: 'Toutes les catégories',
    filters: 'Filtres',
    apply: 'Appliquer',
    empty: 'Aucun produit ne correspond.',
    ctaTitle: 'Vous cherchez une pièce précise ?',
    ctaBody: 'Découvrez notre service sur mesure, à vos dimensions.',
    ctaButton: 'Contacter l’atelier',
    prev: 'Précédent',
    next: 'Suivant',
    page: 'Page',
    search: 'Rechercher un produit…',
    searchClear: 'Effacer',
  },
  product: {
    quantity: 'Quantité',
    addToCart: 'Ajouter au panier',
    added: 'Ajouté ✓',
    specs: 'Spécifications',
    details: 'Détails & savoir-faire',
    delivery: 'Livraison',
    deliveryBody:
      'Livraison en 3 à 5 jours ouvrés partout en Tunisie.',
    related: 'Pièces complémentaires',
    share: 'Partager',
    outOfStock: 'Indisponible',
    home: 'Accueil',
    shop: 'Boutique',
    trustDelivery: 'Livraison partout en Tunisie',
    trustDeliveryNote: 'Sous 3 à 5 jours ouvrés',
    trustCod: 'Paiement à la livraison',
    trustCodNote: 'Réglez en espèces à réception',
    recentlyViewed: 'Vus récemment',
  },
  cart: {
    title: 'Panier',
    empty: 'Votre panier est vide',
    emptyHint: 'Ajoutez quelques belles pièces pour commencer.',
    subtotal: 'Sous-total',
    shippingNote: 'Les frais de livraison sont calculés au paiement.',
    checkout: 'Commander',
    continue: 'Continuer les achats',
    remove: 'Retirer',
    each: 'l’unité',
    delivery: 'Livraison',
    deliveryFree: 'Gratuite',
    total: 'Total',
  },
  checkout: {
    title: 'Finaliser la commande',
    contactInfo: 'Coordonnées et livraison',
    name: 'Nom complet',
    phone: 'Numéro de téléphone',
    email: 'E-mail',
    optional: 'facultatif',
    address: 'Adresse de livraison',
    addressHint: 'Ville, rue, numéro…',
    notes: 'Remarques',
    summary: 'Récapitulatif',
    subtotal: 'Sous-total',
    total: 'Total',
    delivery: 'Livraison',
    deliveryFree: 'Gratuite',
    codNote: 'Paiement à la livraison — les frais de livraison sont calculés à la confirmation.',
    place: 'Confirmer la commande',
    placing: 'Envoi de la commande…',
    emptyTitle: 'Votre panier est vide',
    emptyHint: 'Ajoutez quelques pièces avant de commander.',
    successTitle: 'Commande reçue avec succès !',
    successBody: 'Merci. Nous vous appellerons pour confirmer la commande et la livraison.',
    orderNumber: 'Numéro de commande',
    errorUnavailable: 'Un article n’est plus disponible. Vérifiez votre panier.',
    errorGeneric: 'Impossible de finaliser la commande. Réessayez.',
  },
  common: { currency: 'DT' },
  packs: {
    title: 'Offres packs',
    subtitle: 'Des ensembles de pièces assorties à prix spécial.',
    badge: 'Pack',
    includes: 'Comprend',
    save: 'Économisez',
    viewAll: 'Tous les packs',
    empty: 'Aucun pack disponible pour le moment.',
    contents: 'Contenu du pack',
    separately: 'Prix des pièces achetées séparément :',
    others: 'Autres packs',
  },
};

const dictionaries: Record<Locale, Dictionary> = { ar, fr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
