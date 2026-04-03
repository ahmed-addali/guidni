// ─────────────────────────────────────────────────────────────────────────────
// Destination Guide Data
// Trilingual (en / fr / ar) structured content for the destination guide page.
// Keyed by destination slug. Returns null for destinations without rich guide data.
// ─────────────────────────────────────────────────────────────────────────────

export type GuideSection = {
  tagline: string;
  description: string;
  quickFacts: { label: string; value: string }[];
  highlights: { title: string; description: string }[];
  culture: { title: string; points: string[] }[];
  weather: {
    description: string;
    seasons: { name: string; dates: string; description: string; hot: boolean }[];
    bestTime: { period: string; note: string }[];
    climate: { type: string; tempRange: string; rainfall: string };
    tip: string;
  };
  food: { name: string; description: string }[];
  transport: {
    gettingThere: { name: string; description: string }[];
    movingAround: { name: string; description: string }[];
  };
  budget: {
    currency: string;
    levels: { name: string; range: string }[];
    examples: { item: string; price: string }[];
    tips: string[];
  };
  safety: {
    overview: string;
    tips: string[];
    emergency: { service: string; number: string }[];
  };
  packing: {
    essentials: string[];
    summer: string[];
    winter: string[];
  };
};

export type DestinationGuide = {
  en: GuideSection;
  fr: GuideSection;
  ar: GuideSection;
};

// ─── Djerba ──────────────────────────────────────────────────────────────────

const djerba: DestinationGuide = {
  en: {
    tagline: "Island of Dreams",
    description:
      "The island of Djerba is a stunning gem off the southeastern coast of Tunisia — known for its white-sand beaches, ancient history, and traditional Berber villages. A rare blend of Mediterranean charm and North African soul, it offers something for every kind of traveller.",
    quickFacts: [
      { label: "Language", value: "Arabic, French" },
      { label: "Currency", value: "Tunisian Dinar (TND)" },
      { label: "Population", value: "≈ 165,000" },
      { label: "Region", value: "Médenine, Tunisia" },
      { label: "Time Zone", value: "CET (UTC+1)" },
      { label: "Airport", value: "DJE – Djerba-Zarzis" },
    ],
    highlights: [
      {
        title: "Ancient History",
        description:
          "Inhabited since prehistoric times and mentioned by Homer as the 'Land of the Lotus-Eaters'. Phoenician, Roman and Islamic heritage layers the island.",
      },
      {
        title: "Unique Architecture",
        description:
          "Whitewashed houses with blue doors, traditional 'menzel' and 'hosh' courtyards, alongside fortified mosques found nowhere else in the world.",
      },
      {
        title: "El Ghriba Synagogue",
        description:
          "One of the oldest synagogues in the world and a UNESCO World Heritage site candidate, at the heart of North Africa's oldest Jewish community.",
      },
      {
        title: "Djerbahood",
        description:
          "A massive open-air street art project that turned the village of Erriadh into an outdoor gallery with over 150 works by international artists.",
      },
    ],
    culture: [
      {
        title: "Religion & Community",
        points: [
          "Predominantly Muslim with a welcoming, laid-back culture",
          "One of North Africa's oldest Jewish communities — home to the El Ghriba pilgrimage",
          "Respectful coexistence of multiple faiths is a point of local pride",
        ],
      },
      {
        title: "Customs & Etiquette",
        points: [
          "Greet with 'Salam' or 'Bonjour' — handshakes are common",
          "Dress modestly when visiting villages, mosques, and the synagogue",
          "Friday is a holy day — some shops close around prayer time",
          "Remove shoes before entering homes or religious sites",
        ],
      },
      {
        title: "Festivals & Events",
        points: [
          "Eid al-Fitr and Eid al-Adha celebrated island-wide",
          "Annual Jewish pilgrimage to El Ghriba on Lag BaOmer (spring)",
          "International Festival of Djerba (summer) — music, theatre, crafts",
        ],
      },
    ],
    weather: {
      description:
        "Djerba enjoys a Mediterranean climate with over 300 days of sunshine per year. Summers are hot and dry; winters are mild with occasional rain.",
      seasons: [
        { name: "Spring", dates: "Mar – May", description: "Mild and pleasant — perfect for sightseeing and hiking without the heat.", hot: false },
        { name: "Summer", dates: "Jun – Aug", description: "Hot and sunny with temperatures up to 37 °C. Peak beach season.", hot: true },
        { name: "Autumn", dates: "Sep – Nov", description: "Warm and less crowded. Ideal for both beach and cultural visits.", hot: false },
        { name: "Winter", dates: "Dec – Feb", description: "Mild (15–20 °C) with occasional rain. Great for budget travel.", hot: false },
      ],
      bestTime: [
        { period: "April – June", note: "Warm weather, fewer crowds, lush greenery — the sweet spot." },
        { period: "September – October", note: "Sea still warm, summer crowds gone — great value on accommodation." },
      ],
      climate: {
        type: "Mediterranean (semi-arid)",
        tempRange: "15 °C – 37 °C",
        rainfall: "Low overall; occasional showers Dec–Feb",
      },
      tip: "July and August see peak tourist crowds and temperatures above 37 °C — pack sunscreen, a hat, and stay hydrated.",
    },
    food: [
      { name: "Brik", description: "A crispy deep-fried pastry filled with egg, tuna, capers and herbs — the quintessential Tunisian street snack." },
      { name: "Couscous djerbien", description: "Slow-cooked fish couscous with octopus and local spices — a Djerbian signature dish unlike any other in Tunisia." },
      { name: "Ojja", description: "Spicy tomato stew with eggs and merguez sausage, eaten at any time of day." },
      { name: "Grilled Sea Bass", description: "Fresh from the harbour and grilled simply with lemon and olive oil — find it at any seafront restaurant." },
      { name: "Makroudh", description: "Date-filled semolina pastry drizzled in honey — the island's favourite sweet." },
      { name: "Harissa", description: "The fiery red chilli paste present at every table. Djerbian harissa is milder and more aromatic than the mainland variety." },
    ],
    transport: {
      gettingThere: [
        { name: "By Plane", description: "Djerba–Zarzis International Airport (DJE) has direct flights from Paris, Marseille, Lyon, Brussels, and other European cities, plus domestic connections from Tunis." },
        { name: "By Car", description: "A Roman causeway connects the island to the mainland at El Kantara — drive on and you're there in seconds." },
        { name: "By Ferry", description: "Ferries from Ajim–Jorf crossing operate frequently (~20 min) and transport cars, bikes, and passengers across the channel." },
      ],
      movingAround: [
        { name: "Taxis", description: "Yellow taxis are cheap and plentiful — always agree on a price before departing or ask to use the meter." },
        { name: "Car Rental", description: "Renting a car gives you full freedom to explore the island. Several agencies are at the airport and in Houmt Souk." },
        { name: "Scooter / Bike", description: "Popular for short distances near the beach zone. Rentals available in Midoun and Houmt Souk." },
        { name: "Louage (shared taxi)", description: "Cheap shared taxis run fixed routes between towns — ask locals at the departure points." },
      ],
    },
    budget: {
      currency: "Tunisian Dinar (TND)",
      levels: [
        { name: "Budget", range: "50–80 TND / day" },
        { name: "Mid-range", range: "80–150 TND / day" },
        { name: "Luxury", range: "150+ TND / day" },
      ],
      examples: [
        { item: "Coffee at a café", price: "2–4 TND" },
        { item: "Brik (street snack)", price: "2–3 TND" },
        { item: "Meal at a local restaurant", price: "10–25 TND" },
        { item: "Taxi ride (short)", price: "3–8 TND" },
        { item: "Beach activity (jet ski, etc.)", price: "50–120 TND" },
        { item: "Hotel (per night)", price: "100–400 TND" },
        { item: "Airport taxi to Houmt Souk", price: "15–25 TND" },
      ],
      tips: [
        "Exchange currency at official bureaux or bank ATMs — avoid street exchangers.",
        "Credit cards are accepted at hotels and large restaurants but cash is king at local spots and markets.",
        "Bargaining is expected at the souk — start at 50–60% of the asking price.",
        "Tipping is appreciated but not mandatory; 5–10% at restaurants is standard.",
      ],
    },
    safety: {
      overview:
        "Djerba is generally very safe for tourists. Petty crime is rare, locals are welcoming, and the island has a relaxed atmosphere. Apply standard travel precautions as you would anywhere.",
      tips: [
        "Avoid walking alone in isolated areas after midnight",
        "Keep valuables in hotel safes when not needed",
        "Dress modestly when visiting religious or rural areas",
        "Stay hydrated and wear sunscreen in summer — heatstroke is a real risk",
        "Use official taxis or negotiate fares before departing",
      ],
      emergency: [
        { service: "Police", number: "197" },
        { service: "Ambulance", number: "190" },
        { service: "Fire", number: "198" },
        { service: "Coast Guard", number: "22 750 600" },
      ],
    },
    packing: {
      essentials: [
        "Passport and travel documents",
        "Travel insurance",
        "Sunscreen (SPF 50+) and sunglasses",
        "Comfortable walking shoes",
        "Modest clothing for cultural and religious sites",
        "Reusable water bottle",
        "Power adapter (Type C/E/F sockets)",
      ],
      summer: [
        "Lightweight breathable clothing",
        "Sun hat or cap",
        "Flip-flops or sandals",
        "After-sun lotion",
        "Portable fan or misting spray",
      ],
      winter: [
        "Light jacket or sweater for cool evenings",
        "Layering pieces for temperature changes",
        "Compact umbrella for occasional showers",
      ],
    },
  },

  // ─── French ─────────────────────────────────────────────────────────────────

  fr: {
    tagline: "L'Île des Rêves",
    description:
      "L'île de Djerba est un joyau magnifique au large de la côte sud-est de la Tunisie — connue pour ses plages de sable blanc, son histoire millénaire et ses villages berbères. Un mélange rare de charme méditerranéen et d'âme nord-africaine, elle offre quelque chose pour chaque type de voyageur.",
    quickFacts: [
      { label: "Langue", value: "Arabe, Français" },
      { label: "Devise", value: "Dinar tunisien (TND)" },
      { label: "Population", value: "≈ 165 000" },
      { label: "Région", value: "Médenine, Tunisie" },
      { label: "Fuseau horaire", value: "HEC (UTC+1)" },
      { label: "Aéroport", value: "DJE – Djerba-Zarzis" },
    ],
    highlights: [
      {
        title: "Histoire ancienne",
        description:
          "Habitée depuis la préhistoire et mentionnée par Homère comme la « Terre des Lotophages ». Héritages phénicien, romain et islamique se superposent sur l'île.",
      },
      {
        title: "Architecture unique",
        description:
          "Maisons blanchies à la chaux avec des portes bleues, cours intérieures traditionnelles, mosquées fortifiées introuvables ailleurs dans le monde.",
      },
      {
        title: "La Ghriba",
        description:
          "L'une des plus anciennes synagogues au monde et candidate au patrimoine UNESCO, cœur de la plus ancienne communauté juive d'Afrique du Nord.",
      },
      {
        title: "Djerbahood",
        description:
          "Un immense projet de street art à ciel ouvert qui a transformé le village d'Erriadh en galerie extérieure avec plus de 150 œuvres d'artistes internationaux.",
      },
    ],
    culture: [
      {
        title: "Religion et communauté",
        points: [
          "À majorité musulmane avec une culture détendue et accueillante",
          "L'une des plus anciennes communautés juives d'Afrique du Nord — pèlerinage annuel à la Ghriba",
          "La coexistence respectueuse de plusieurs religions est une fierté locale",
        ],
      },
      {
        title: "Coutumes et étiquette",
        points: [
          "Saluez par 'Salam' ou 'Bonjour' — les poignées de main sont courantes",
          "Habillez-vous modestement dans les villages, mosquées et synagogue",
          "Le vendredi est un jour saint — certains commerces ferment à l'heure de la prière",
          "Retirez vos chaussures en entrant dans les maisons ou lieux de culte",
        ],
      },
      {
        title: "Fêtes et événements",
        points: [
          "Aïd el-Fitr et Aïd el-Adha célébrés sur toute l'île",
          "Pèlerinage juif annuel à la Ghriba pour Lag BaOmer (printemps)",
          "Festival International de Djerba (été) — musique, théâtre, artisanat",
        ],
      },
    ],
    weather: {
      description:
        "Djerba bénéficie d'un climat méditerranéen avec plus de 300 jours de soleil par an. Les étés sont chauds et secs ; les hivers doux avec de rares pluies.",
      seasons: [
        { name: "Printemps", dates: "Mars – Mai", description: "Doux et agréable — idéal pour visiter les sites sans la chaleur estivale.", hot: false },
        { name: "Été", dates: "Juin – Août", description: "Chaud et ensoleillé, jusqu'à 37 °C. Haute saison balnéaire.", hot: true },
        { name: "Automne", dates: "Sept – Nov", description: "Chaud et moins fréquenté. Idéal pour la plage et les visites culturelles.", hot: false },
        { name: "Hiver", dates: "Déc – Fév", description: "Doux (15–20 °C) avec quelques pluies. Excellent rapport qualité-prix.", hot: false },
      ],
      bestTime: [
        { period: "Avril – Juin", note: "Météo clémente, moins de touristes, végétation luxuriante — le meilleur moment." },
        { period: "Septembre – Octobre", note: "Mer encore chaude, foule estivale disparue — hébergements à bon prix." },
      ],
      climate: {
        type: "Méditerranéen (semi-aride)",
        tempRange: "15 °C – 37 °C",
        rainfall: "Faibles précipitations ; quelques averses de déc. à fév.",
      },
      tip: "Juillet et août sont les mois les plus fréquentés avec des températures dépassant 37 °C — prévoyez crème solaire, chapeau et hydratation.",
    },
    food: [
      { name: "Brik", description: "Crêpe frite croustillante farcie d'œuf, de thon, de câpres et d'herbes — le snack de rue tunisien par excellence." },
      { name: "Couscous djerbien", description: "Couscous de poisson mijoté avec poulpe et épices locales — la signature gastronomique de Djerba." },
      { name: "Ojja", description: "Ragoût de tomates épicé aux œufs et merguez, servi à toute heure." },
      { name: "Bar grillé", description: "Fraîchement sorti du port, grillé simplement au citron et huile d'olive — dans n'importe quel restaurant du front de mer." },
      { name: "Makroudh", description: "Gâteau de semoule fourré aux dattes et nappé de miel — le doux favori de l'île." },
      { name: "Harissa", description: "La pâte de piment rouge présente sur chaque table. La harissa djerbienne est plus douce et aromatique que celle du continent." },
    ],
    transport: {
      gettingThere: [
        { name: "En avion", description: "L'aéroport Djerba-Zarzis (DJE) propose des vols directs depuis Paris, Marseille, Lyon, Bruxelles et d'autres villes européennes, plus des liaisons domestiques depuis Tunis." },
        { name: "En voiture", description: "Une chaussée romaine relie l'île au continent à El Kantara — vous y êtes en quelques secondes." },
        { name: "En ferry", description: "Les ferries Ajim–Jorf fonctionnent fréquemment (~20 min) et transportent voitures, vélos et passagers." },
      ],
      movingAround: [
        { name: "Taxis", description: "Les taxis jaunes sont bon marché et nombreux — convenez toujours d'un prix avant de partir ou demandez à utiliser le compteur." },
        { name: "Location de voiture", description: "La liberté totale pour explorer l'île. Plusieurs agences à l'aéroport et à Houmt Souk." },
        { name: "Scooter / Vélo", description: "Populaires pour les courts trajets dans la zone balnéaire. Locations disponibles à Midoun et Houmt Souk." },
        { name: "Louage (taxi partagé)", description: "Taxis partagés bon marché sur itinéraires fixes entre les villes — demandez aux habitants." },
      ],
    },
    budget: {
      currency: "Dinar tunisien (TND)",
      levels: [
        { name: "Budget", range: "50–80 TND / jour" },
        { name: "Milieu de gamme", range: "80–150 TND / jour" },
        { name: "Luxe", range: "150+ TND / jour" },
      ],
      examples: [
        { item: "Café en terrasse", price: "2–4 TND" },
        { item: "Brik (snack de rue)", price: "2–3 TND" },
        { item: "Repas dans un restaurant local", price: "10–25 TND" },
        { item: "Course en taxi (courte)", price: "3–8 TND" },
        { item: "Activité plage (jet ski, etc.)", price: "50–120 TND" },
        { item: "Hôtel (par nuit)", price: "100–400 TND" },
        { item: "Taxi aéroport vers Houmt Souk", price: "15–25 TND" },
      ],
      tips: [
        "Changez votre argent dans les bureaux de change officiels ou les distributeurs bancaires.",
        "Les cartes bancaires sont acceptées dans les hôtels et grands restaurants mais le cash est roi dans les échoppes locales et au souk.",
        "Le marchandage est de mise au souk — commencez à 50–60 % du prix affiché.",
        "Le pourboire est apprécié mais non obligatoire ; 5–10 % au restaurant est la norme.",
      ],
    },
    safety: {
      overview:
        "Djerba est généralement très sûre pour les touristes. La petite délinquance est rare, les habitants sont accueillants et l'île a une atmosphère détendue. Appliquez les précautions de voyage habituelles.",
      tips: [
        "Évitez de marcher seul dans des zones isolées après minuit",
        "Laissez vos objets de valeur dans le coffre de l'hôtel",
        "Habillez-vous modestement dans les zones religieuses ou rurales",
        "Restez hydraté et portez de la crème solaire en été — le coup de chaleur est réel",
        "Utilisez des taxis officiels ou négociez le tarif avant de partir",
      ],
      emergency: [
        { service: "Police", number: "197" },
        { service: "Ambulance", number: "190" },
        { service: "Pompiers", number: "198" },
        { service: "Garde côtière", number: "22 750 600" },
      ],
    },
    packing: {
      essentials: [
        "Passeport et documents de voyage",
        "Assurance voyage",
        "Crème solaire (SPF 50+) et lunettes de soleil",
        "Chaussures confortables pour la marche",
        "Vêtements modestes pour les sites culturels et religieux",
        "Gourde réutilisable",
        "Adaptateur secteur (prises de type C/E/F)",
      ],
      summer: [
        "Vêtements légers et respirants",
        "Chapeau ou casquette",
        "Tongues ou sandales",
        "Lait après-soleil",
        "Éventail ou spray rafraîchissant",
      ],
      winter: [
        "Veste légère ou pull pour les soirées fraîches",
        "Pièces superposables pour les variations de température",
        "Parapluie compact pour les averses occasionnelles",
      ],
    },
  },

  // ─── Arabic ──────────────────────────────────────────────────────────────────

  ar: {
    tagline: "جزيرة الأحلام",
    description:
      "جزيرة جربة جوهرة ساحرة تقع قبالة الساحل الجنوبي الشرقي لتونس — تشتهر بشواطئها ذات الرمال البيضاء وتاريخها العريق وقرى الأمازيغ التقليدية. مزيج نادر من السحر المتوسطي والروح الإفريقية الشمالية، تقدم شيئًا لكل نوع من المسافرين.",
    quickFacts: [
      { label: "اللغة", value: "العربية، الفرنسية" },
      { label: "العملة", value: "الدينار التونسي (TND)" },
      { label: "السكان", value: "≈ 165,000" },
      { label: "المنطقة", value: "مدنين، تونس" },
      { label: "المنطقة الزمنية", value: "CET (UTC+1)" },
      { label: "المطار", value: "DJE – جربة جرجيس" },
    ],
    highlights: [
      {
        title: "تاريخ قديم",
        description:
          "مأهولة منذ عصور ما قبل التاريخ وذكرها هوميروس باسم 'أرض آكلي اللوتس'. تتراكم على الجزيرة طبقات من التراث الفينيقي والروماني والإسلامي.",
      },
      {
        title: "عمارة فريدة",
        description:
          "منازل مطلية باللون الأبيض بأبواب زرقاء، وأفنية 'المنزل' و'الحوش' التقليدية، إلى جانب مساجد محصنة لا مثيل لها في العالم.",
      },
      {
        title: "كنيس الغريبة",
        description:
          "واحدة من أقدم الكنس في العالم ومرشحة لقائمة اليونسكو للتراث العالمي، في قلب أعرق مجتمع يهودي في شمال إفريقيا.",
      },
      {
        title: "جربة هود",
        description:
          "مشروع فن الشارع العملاق الذي حوّل قرية أجيم إلى معرض في الهواء الطلق يضم أكثر من 150 عملًا لفنانين دوليين.",
      },
    ],
    culture: [
      {
        title: "الدين والمجتمع",
        points: [
          "غالبية مسلمة ذات ثقافة مرحة ومضيافة",
          "واحدة من أقدم الجاليات اليهودية في شمال إفريقيا — حج سنوي إلى الغريبة",
          "التعايش السلمي بين الأديان مصدر فخر محلي",
        ],
      },
      {
        title: "العادات وآداب السلوك",
        points: [
          "التحية بـ'سلام' أو 'بونجور' — المصافحة شائعة",
          "ارتداء ملابس محتشمة في القرى والمساجد والكنيس",
          "يوم الجمعة يوم مقدس — قد تُغلق بعض المحلات وقت الصلاة",
          "خلع الأحذية قبل الدخول إلى المنازل أو الأماكن الدينية",
        ],
      },
      {
        title: "الأعياد والفعاليات",
        points: [
          "عيد الفطر وعيد الأضحى يُحتفل بهما في كل أرجاء الجزيرة",
          "الحج اليهودي السنوي إلى الغريبة في لاج بعومر (الربيع)",
          "المهرجان الدولي لجربة (الصيف) — موسيقى، مسرح، حرف يدوية",
        ],
      },
    ],
    weather: {
      description:
        "تتمتع جربة بمناخ متوسطي مع أكثر من 300 يوم مشمس في السنة. الصيف حار وجاف؛ الشتاء معتدل مع أمطار خفيفة.",
      seasons: [
        { name: "الربيع", dates: "مارس – ماي", description: "معتدل ولطيف — مثالي لزيارة المعالم بعيدًا عن حرارة الصيف.", hot: false },
        { name: "الصيف", dates: "جوان – أوت", description: "حار ومشمس حتى 37 درجة. موسم الشاطئ الذروة.", hot: true },
        { name: "الخريف", dates: "سبتمبر – نوفمبر", description: "دافئ وأقل ازدحامًا. مثالي للشاطئ والزيارات الثقافية.", hot: false },
        { name: "الشتاء", dates: "ديسمبر – فيفري", description: "معتدل (15–20 درجة) مع أمطار متفرقة. ممتاز لسياحة الميزانية.", hot: false },
      ],
      bestTime: [
        { period: "أبريل – جوان", note: "طقس لطيف، حشود أقل، خضرة — الوقت المثالي." },
        { period: "سبتمبر – أكتوبر", note: "البحر لا يزال دافئًا، حشود الصيف غادرت — أسعار إقامة ممتازة." },
      ],
      climate: {
        type: "متوسطي (شبه جاف)",
        tempRange: "15 درجة – 37 درجة",
        rainfall: "أمطار منخفضة؛ زخات متفرقة من ديسمبر إلى فبراير",
      },
      tip: "تشهد أشهر جويلية وأوت أعلى حضور سياحي ودرجات حرارة فوق 37 درجة — احمل واقي الشمس والقبعة واشرب الماء بوفرة.",
    },
    food: [
      { name: "بريك", description: "فطيرة مقلية مقرمشة محشوة بالبيض والتونة والكبار والأعشاب — وجبة الشارع التونسية بامتياز." },
      { name: "كسكسي جربي", description: "كسكسي سمك مطهو ببطء مع الأخطبوط والتوابل المحلية — الطبق الجربي الأصيل." },
      { name: "عجة", description: "يخنة طماطم حارة مع البيض ونقانق المرقاز، تُقدَّم في أي وقت من اليوم." },
      { name: "لوبان مشوي", description: "طازج من الميناء، مشوي ببساطة بالليمون وزيت الزيتون — في أي مطعم على الواجهة البحرية." },
      { name: "مقرود", description: "حلوى سميد محشوة بالتمر ومسكوبة بالعسل — الحلوى المفضلة في الجزيرة." },
      { name: "هريسة", description: "معجون الفلفل الأحمر الحار الحاضر على كل طاولة. هريسة جربة أكثر لطفًا وعطرًا من تلك الموجودة في البر التونسي." },
    ],
    transport: {
      gettingThere: [
        { name: "بالطائرة", description: "مطار جربة جرجيس الدولي (DJE) يوفر رحلات مباشرة من باريس وليون وبروكسل ومدن أوروبية أخرى، بالإضافة إلى وصلات داخلية من تونس العاصمة." },
        { name: "بالسيارة", description: "طريق روماني يربط الجزيرة باليابسة عند القنطرة — تصلها في ثوانٍ." },
        { name: "بالعبّارة", description: "تعمل العبارات بين أجيم والجرف بشكل متكرر (~20 دقيقة) وتنقل السيارات والدراجات والركاب." },
      ],
      movingAround: [
        { name: "التاكسي", description: "التاكسيات الصفراء رخيصة ومتوفرة — اتفق دائمًا على السعر قبل الانطلاق أو اطلب تشغيل العداد." },
        { name: "تأجير سيارة", description: "حرية كاملة لاستكشاف الجزيرة. وكالات متعددة في المطار وفي حومة السوق." },
        { name: "دراجة نارية / دراجة", description: "شائعة للمسافات القصيرة قرب منطقة الشاطئ. تأجير متاح في مدون وحومة السوق." },
        { name: "لواج (سيارة أجرة مشتركة)", description: "تاكسيات مشتركة رخيصة على مسارات ثابتة بين المدن — اسأل السكان المحليين." },
      ],
    },
    budget: {
      currency: "الدينار التونسي (TND)",
      levels: [
        { name: "مقتصد", range: "50–80 دينار / يوم" },
        { name: "متوسط", range: "80–150 دينار / يوم" },
        { name: "فاخر", range: "150+ دينار / يوم" },
      ],
      examples: [
        { item: "قهوة في مقهى", price: "2–4 دينار" },
        { item: "بريك (وجبة شارع)", price: "2–3 دينار" },
        { item: "وجبة في مطعم محلي", price: "10–25 دينار" },
        { item: "تاكسي (مسافة قصيرة)", price: "3–8 دينار" },
        { item: "نشاط شاطئي (جت سكي، إلخ)", price: "50–120 دينار" },
        { item: "فندق (ليلة واحدة)", price: "100–400 دينار" },
        { item: "تاكسي المطار إلى حومة السوق", price: "15–25 دينار" },
      ],
      tips: [
        "قم بتحويل العملة في مكاتب الصرافة الرسمية أو أجهزة الصراف الآلي للبنوك.",
        "بطاقات الائتمان مقبولة في الفنادق والمطاعم الكبيرة لكن النقد أفضل في المحلات المحلية والأسواق.",
        "المساومة متوقعة في السوق — ابدأ بـ 50–60% من السعر المطلوب.",
        "الإكراميات محل تقدير لكنها ليست إلزامية؛ 5–10% في المطاعم هو المعتاد.",
      ],
    },
    safety: {
      overview:
        "جربة آمنة بشكل عام جدًا للسياح. الجرائم الصغيرة نادرة والسكان مرحبون والجزيرة تتمتع بأجواء هادئة. طبّق احتياطات السفر المعتادة كما في أي مكان آخر.",
      tips: [
        "تجنب المشي منفردًا في المناطق النائية بعد منتصف الليل",
        "ضع أشياءك القيمة في خزانة الفندق عند عدم الحاجة إليها",
        "ارتدِ ملابس محتشمة عند زيارة المناطق الدينية أو الريفية",
        "حافظ على رطوبتك واستخدم واقي الشمس في الصيف — ضربة الشمس خطر حقيقي",
        "استخدم التاكسيات الرسمية أو تفاوض على الأجرة قبل الانطلاق",
      ],
      emergency: [
        { service: "الشرطة", number: "197" },
        { service: "الإسعاف", number: "190" },
        { service: "الإطفاء", number: "198" },
        { service: "خفر السواحل", number: "22 750 600" },
      ],
    },
    packing: {
      essentials: [
        "جواز السفر والوثائق الرسمية",
        "تأمين السفر",
        "واقي شمس (SPF 50+) ونظارات شمسية",
        "أحذية مريحة للمشي",
        "ملابس محتشمة للمواقع الثقافية والدينية",
        "زجاجة ماء قابلة لإعادة الاستخدام",
        "محول كهربائي (مقابس من النوع C/E/F)",
      ],
      summer: [
        "ملابس خفيفة وقابلة للتنفس",
        "قبعة شمس أو كاب",
        "شباشب أو صندل",
        "كريم ما بعد الشمس",
        "مروحة محمولة أو بخاخ تبريد",
      ],
      winter: [
        "سترة خفيفة أو سويتر للأمسيات الباردة",
        "قطع قابلة للتطبيق لتغييرات الحرارة",
        "مظلة مدمجة للأمطار المتفرقة",
      ],
    },
  },
};

// ─── Dubai ───────────────────────────────────────────────────────────────────

const dubai: DestinationGuide = {
  en: {
    tagline: "City of the Future",
    description:
      "Dubai is a global metropolis that has transformed from a fishing village into one of the world's most iconic destinations in just a few decades. Towering skyscrapers, endless desert, pristine beaches, and some of the world's finest dining and shopping — all in one electrifying city.",
    quickFacts: [
      { label: "Language", value: "Arabic, English" },
      { label: "Currency", value: "UAE Dirham (AED)" },
      { label: "Population", value: "≈ 3.5 million" },
      { label: "Region", value: "Dubai Emirate, UAE" },
      { label: "Time Zone", value: "GST (UTC+4)" },
      { label: "Airport", value: "DXB – Dubai International" },
    ],
    highlights: [
      {
        title: "Burj Khalifa",
        description: "The world's tallest building at 828 m. The observation deck on floor 148 offers jaw-dropping 360° views over the city, desert and sea.",
      },
      {
        title: "Old Dubai",
        description: "The Al Fahidi Historical Neighbourhood and Dubai Creek offer a window into the city's pre-oil trading past, with wind-tower architecture and traditional souks.",
      },
      {
        title: "Palm Jumeirah",
        description: "The world's largest artificial archipelago, built in the shape of a palm tree and visible from space — now home to luxury hotels and residences.",
      },
      {
        title: "Dubai Desert",
        description: "Just 45 minutes from the city, the Arabian Desert offers dune bashing, camel riding, sandboarding, and Bedouin-style camp dinners under the stars.",
      },
    ],
    culture: [
      {
        title: "Religion & Society",
        points: [
          "Islam is the official religion; respect prayer times and customs",
          "Friday is a weekend day — some government offices close Thursday afternoon",
          "Ramadan brings changed hours and no eating/drinking in public during fasting hours",
        ],
      },
      {
        title: "Customs & Etiquette",
        points: [
          "Public displays of affection should be kept to a minimum",
          "Dress modestly in malls, souks, and mosques — beachwear only at beaches",
          "Alcohol is available in licensed venues (hotels, bars, restaurants) but not in public",
          "Photography of people requires permission, especially women in traditional dress",
        ],
      },
      {
        title: "Events & Festivals",
        points: [
          "Dubai Shopping Festival (January–February) — massive sales and events",
          "Dubai Food Festival (February–March) — citywide culinary celebrations",
          "Eid celebrations with impressive fireworks and events across the city",
        ],
      },
    ],
    weather: {
      description:
        "Dubai has a hot desert climate with sunshine virtually year-round. Winters are mild and pleasant; summers are extremely hot and humid.",
      seasons: [
        { name: "Winter", dates: "Nov – Feb", description: "The ideal season — sunny, 20–28 °C, and perfect for all outdoor activities.", hot: false },
        { name: "Spring", dates: "Mar – Apr", description: "Warming up to 35 °C. Good weather with occasional dust storms.", hot: false },
        { name: "Summer", dates: "May – Sep", description: "Extreme heat 38–45 °C with high humidity. Mostly indoors.", hot: true },
        { name: "Autumn", dates: "Oct", description: "Temperatures drop back to a comfortable 30–35 °C — busy season picks up.", hot: false },
      ],
      bestTime: [
        { period: "November – February", note: "Perfect weather for sightseeing, desert tours, beaches and outdoor dining." },
        { period: "March – April", note: "Still good before the heat peaks — book early as prices rise." },
      ],
      climate: {
        type: "Hot desert (BWh)",
        tempRange: "14 °C – 45 °C",
        rainfall: "Very low; under 100 mm/year",
      },
      tip: "Summer (May–September) is extremely hot — plan indoor activities like malls and museums, and avoid outdoor exertion midday.",
    },
    food: [
      { name: "Shawarma", description: "Spit-roasted meat (chicken or lamb) wrapped in flatbread with garlic sauce and pickles — the ultimate street food." },
      { name: "Hummus & Meze", description: "Creamy chickpea dip with flatbread, part of an extensive Lebanese-influenced meze spread found across the city." },
      { name: "Al Harees", description: "A traditional slow-cooked wheat and meat dish served during Ramadan and celebrations — simple, hearty, and deeply comforting." },
      { name: "Arabic Coffee & Dates", description: "Cardamom-spiced coffee (qahwa) served with fresh dates is the traditional welcome at any meeting or gathering." },
      { name: "Luqaimat", description: "Golden deep-fried dough balls drizzled with date syrup and sesame — Dubai's favourite sweet street snack." },
      { name: "Seafood", description: "Fresh hamour, prawns, and lobster from the Gulf, grilled or in rich curries at waterfront restaurants." },
    ],
    transport: {
      gettingThere: [
        { name: "By Plane", description: "Dubai International Airport (DXB) is one of the world's busiest — direct flights from virtually every major city. Terminal 3 serves Emirates." },
        { name: "By Train", description: "No international rail connections — fly is the only practical option." },
        { name: "By Cruise", description: "Dubai is a major cruise hub with ships docking at Port Rashid; popular for Middle East itineraries." },
      ],
      movingAround: [
        { name: "Dubai Metro", description: "Clean, air-conditioned, and affordable. The Red and Green lines cover most tourist areas. Runs 05:30–midnight (01:00 Fri–Sat)." },
        { name: "Taxis", description: "Abundant, metered, and reasonably priced. Uber and Careem (local) also operate citywide." },
        { name: "Water Taxi (Abra)", description: "Traditional wooden boats crossing Dubai Creek for 1 AED — a must-do experience connecting Deira and Bur Dubai." },
        { name: "Car Rental", description: "Highly recommended for desert excursions. International license valid; right-hand traffic." },
      ],
    },
    budget: {
      currency: "UAE Dirham (AED)",
      levels: [
        { name: "Budget", range: "200–350 AED / day" },
        { name: "Mid-range", range: "350–700 AED / day" },
        { name: "Luxury", range: "700+ AED / day" },
      ],
      examples: [
        { item: "Coffee at a café", price: "15–25 AED" },
        { item: "Shawarma wrap", price: "8–15 AED" },
        { item: "Meal at a mid-range restaurant", price: "50–100 AED" },
        { item: "Metro ride", price: "3–8 AED" },
        { item: "Taxi (short ride)", price: "15–30 AED" },
        { item: "Burj Khalifa observation deck", price: "149–399 AED" },
        { item: "Hotel (per night)", price: "300–2000+ AED" },
      ],
      tips: [
        "Book Burj Khalifa tickets online in advance — walk-ins cost significantly more.",
        "Dubai Mall, Mall of the Emirates, and most attractions have free entry — budget for food and experiences.",
        "Alcohol is expensive (typically 40–80 AED per drink in licensed venues).",
        "Grab card (Careem Pay) and contactless payments are widely accepted.",
      ],
    },
    safety: {
      overview:
        "Dubai is one of the world's safest cities with very low crime rates. The police are visible and responsive. Normal travel precautions apply.",
      tips: [
        "Dress modestly in public areas — beachwear only at beaches and pools",
        "Public intoxication is illegal — drink only in licensed venues",
        "Jaywalking carries fines — use pedestrian crossings",
        "Be careful with social media posts — criticism of UAE authorities can have legal consequences",
      ],
      emergency: [
        { service: "Police", number: "999" },
        { service: "Ambulance", number: "998" },
        { service: "Fire", number: "997" },
        { service: "Coast Guard", number: "996" },
      ],
    },
    packing: {
      essentials: [
        "Passport and visa documents",
        "Travel insurance",
        "Sunscreen (SPF 50+) and sunglasses",
        "Comfortable walking shoes",
        "Modest clothing for malls and religious sites",
        "Reusable water bottle",
        "Power adapter (Type G sockets)",
      ],
      summer: [
        "Ultra-light, breathable fabrics",
        "Sun hat and UV-protection clothing",
        "Cooling towel or spray",
        "Indoor-focused itinerary items",
      ],
      winter: [
        "Light jacket or cardigan for air-conditioned spaces",
        "Layering pieces for temperature variations",
      ],
    },
  },
  fr: {
    tagline: "La Ville du Futur",
    description:
      "Dubaï est une métropole mondiale qui s'est transformée d'un village de pêcheurs en l'une des destinations les plus emblématiques du monde en quelques décennies. Gratte-ciel vertigineux, désert infini, plages immaculées et une offre culinaire et commerciale parmi les meilleures au monde — tout dans une ville électrisante.",
    quickFacts: [
      { label: "Langue", value: "Arabe, Anglais" },
      { label: "Devise", value: "Dirham des Émirats (AED)" },
      { label: "Population", value: "≈ 3,5 millions" },
      { label: "Région", value: "Émirat de Dubaï, EAU" },
      { label: "Fuseau horaire", value: "GST (UTC+4)" },
      { label: "Aéroport", value: "DXB – Dubaï International" },
    ],
    highlights: [
      {
        title: "Burj Khalifa",
        description: "Le plus haut bâtiment du monde (828 m). L'observatoire au 148e étage offre une vue à 360° époustouflante sur la ville, le désert et la mer.",
      },
      {
        title: "Vieux Dubaï",
        description: "Le quartier historique d'Al Fahidi et la crique de Dubaï offrent une fenêtre sur le passé commercial pré-pétrole de la ville, avec son architecture à tours à vent et ses souks traditionnels.",
      },
      {
        title: "Palm Jumeirah",
        description: "Le plus grand archipel artificiel au monde, en forme de palmier et visible depuis l'espace — aujourd'hui domicile d'hôtels et de résidences de luxe.",
      },
      {
        title: "Désert de Dubaï",
        description: "À 45 minutes seulement de la ville, le désert d'Arabie propose dune bashing, balade à dos de chameau, sandboard et dîner bédouin sous les étoiles.",
      },
    ],
    culture: [
      {
        title: "Religion & Société",
        points: [
          "L'islam est la religion officielle ; respectez les heures de prière et les coutumes",
          "Le vendredi est jour de repos — certains bureaux gouvernementaux ferment le jeudi après-midi",
          "Le Ramadan modifie les horaires et interdit de manger ou boire en public pendant le jeûne",
        ],
      },
      {
        title: "Coutumes & Étiquette",
        points: [
          "Les démonstrations d'affection en public doivent rester discrètes",
          "Habillez-vous modestement dans les centres commerciaux, souks et mosquées",
          "L'alcool est disponible dans les établissements agréés (hôtels, bars, restaurants) mais pas dans les espaces publics",
          "La photographie de personnes nécessite leur accord, surtout des femmes en tenue traditionnelle",
        ],
      },
      {
        title: "Événements & Fêtes",
        points: [
          "Festival du Shopping de Dubaï (janvier–février) — soldes massives et événements",
          "Dubaï Food Festival (février–mars) — célébrations culinaires à travers la ville",
          "Fêtes de l'Aïd avec feux d'artifice et animations dans toute la ville",
        ],
      },
    ],
    weather: {
      description:
        "Dubaï bénéficie d'un climat désertique chaud avec du soleil pratiquement toute l'année. Les hivers sont doux et agréables ; les étés sont extrêmement chauds et humides.",
      seasons: [
        { name: "Hiver", dates: "Nov – Fév", description: "La saison idéale — ensoleillé, 20–28 °C, parfait pour toutes les activités en plein air.", hot: false },
        { name: "Printemps", dates: "Mars – Avr", description: "Montée vers 35 °C. Bonne météo avec quelques tempêtes de sable.", hot: false },
        { name: "Été", dates: "Mai – Sep", description: "Chaleur extrême 38–45 °C avec forte humidité. Principalement en intérieur.", hot: true },
        { name: "Automne", dates: "Oct", description: "Les températures redescendent à 30–35 °C — la haute saison reprend.", hot: false },
      ],
      bestTime: [
        { period: "Novembre – Février", note: "Météo parfaite pour les visites, excursions désert, plages et dîners en terrasse." },
        { period: "Mars – Avril", note: "Encore agréable avant la montée en chaleur — réservez tôt car les prix augmentent." },
      ],
      climate: {
        type: "Désertique chaud (BWh)",
        tempRange: "14 °C – 45 °C",
        rainfall: "Très faible ; moins de 100 mm/an",
      },
      tip: "L'été (mai–septembre) est extrêmement chaud — planifiez des activités en intérieur (centres commerciaux, musées) et évitez les efforts physiques en plein midi.",
    },
    food: [
      { name: "Shawarma", description: "Viande rôtie à la broche (poulet ou agneau) dans du pain plat avec sauce à l'ail et cornichons — le street food ultime." },
      { name: "Houmous & Mezze", description: "Purée de pois chiches crémeuse avec pain pita, dans un mezze libanais qui s'étend sur toute la ville." },
      { name: "Al Harees", description: "Un plat traditionnel de blé et de viande cuit lentement, servi pendant le Ramadan et les célébrations — simple et réconfortant." },
      { name: "Café arabe & Dattes", description: "Le café à la cardamome (qahwa) servi avec des dattes fraîches est l'accueil traditionnel à toute réunion." },
      { name: "Luqaimat", description: "Beignets dorés arrosés de sirop de dattes et de sésame — le snack sucré favori des rues de Dubaï." },
      { name: "Fruits de mer", description: "Hamour frais, crevettes et homard du Golfe, grillés ou en curry dans les restaurants au bord de l'eau." },
    ],
    transport: {
      gettingThere: [
        { name: "En avion", description: "L'aéroport international de Dubaï (DXB) est l'un des plus fréquentés au monde — vols directs depuis quasiment toutes les grandes villes. Terminal 3 pour Emirates." },
        { name: "En train", description: "Pas de liaison ferroviaire internationale — l'avion est la seule option pratique." },
        { name: "En croisière", description: "Dubaï est un hub majeur de croisières avec des escales au Port Rachid, populaire pour les itinéraires Moyen-Orient." },
      ],
      movingAround: [
        { name: "Métro de Dubaï", description: "Propre, climatisé et abordable. Les lignes Rouge et Verte couvrent la plupart des zones touristiques. En service 05h30–minuit (01h00 ven–sam)." },
        { name: "Taxis", description: "Nombreux, à compteur et raisonnablement tarifés. Uber et Careem (local) fonctionnent dans toute la ville." },
        { name: "Abra (taxi sur l'eau)", description: "Embarcations en bois traditionnelles traversant la crique de Dubaï pour 1 AED — une expérience incontournable." },
        { name: "Location de voiture", description: "Vivement recommandée pour les excursions dans le désert. Permis international valide ; circulation à droite." },
      ],
    },
    budget: {
      currency: "Dirham des Émirats (AED)",
      levels: [
        { name: "Budget", range: "200–350 AED / jour" },
        { name: "Milieu de gamme", range: "350–700 AED / jour" },
        { name: "Luxe", range: "700+ AED / jour" },
      ],
      examples: [
        { item: "Café en terrasse", price: "15–25 AED" },
        { item: "Shawarma", price: "8–15 AED" },
        { item: "Repas dans un restaurant moyen", price: "50–100 AED" },
        { item: "Trajet en métro", price: "3–8 AED" },
        { item: "Taxi (court trajet)", price: "15–30 AED" },
        { item: "Observatoire Burj Khalifa", price: "149–399 AED" },
        { item: "Hôtel (par nuit)", price: "300–2000+ AED" },
      ],
      tips: [
        "Réservez les billets du Burj Khalifa en ligne à l'avance — les prix à la caisse sont bien plus élevés.",
        "Dubai Mall, Mall of the Emirates et la plupart des attractions sont à entrée libre — budgétez pour la nourriture et les expériences.",
        "L'alcool est cher (généralement 40–80 AED par verre dans les établissements agréés).",
        "Grab card (Careem Pay) et paiements sans contact sont largement acceptés.",
      ],
    },
    safety: {
      overview:
        "Dubaï est l'une des villes les plus sûres au monde avec des taux de criminalité très bas. La police est visible et réactive. Les précautions de voyage normales s'appliquent.",
      tips: [
        "Habillez-vous modestement dans les espaces publics — tenues de plage uniquement sur les plages",
        "L'ivresse publique est illégale — consommez dans les établissements agréés uniquement",
        "Traverser en dehors des passages piétons est passible d'amende",
        "Soyez prudent avec les posts sur les réseaux sociaux — critiquer les autorités des EAU peut avoir des conséquences légales",
      ],
      emergency: [
        { service: "Police", number: "999" },
        { service: "Ambulance", number: "998" },
        { service: "Pompiers", number: "997" },
        { service: "Garde côtière", number: "996" },
      ],
    },
    packing: {
      essentials: [
        "Passeport et documents de visa",
        "Assurance voyage",
        "Crème solaire (SPF 50+) et lunettes de soleil",
        "Chaussures confortables pour marcher",
        "Vêtements modestes pour centres commerciaux et sites religieux",
        "Gourde réutilisable",
        "Adaptateur secteur (prises de type G)",
      ],
      summer: [
        "Tissus ultra-légers et respirants",
        "Chapeau de soleil et vêtements anti-UV",
        "Serviette rafraîchissante ou spray",
        "Programme d'activités en intérieur",
      ],
      winter: [
        "Veste légère ou cardigan pour les espaces climatisés",
        "Pièces superposables pour les variations de température",
      ],
    },
  },
  ar: {
    tagline: "مدينة المستقبل",
    description:
      "دبي مدينة عالمية تحولت من قرية صيد إلى واحدة من أكثر الوجهات شهرة في العالم خلال عقود قليلة. ناطحات سحاب شاهقة، وصحراء لا نهاية لها، وشواطئ بكر، ومطاعم ومراكز تسوق من بين الأفضل في العالم — كل ذلك في مدينة كهربائية واحدة.",
    quickFacts: [
      { label: "اللغة", value: "العربية، الإنجليزية" },
      { label: "العملة", value: "الدرهم الإماراتي (AED)" },
      { label: "السكان", value: "≈ 3.5 مليون" },
      { label: "المنطقة", value: "إمارة دبي، الإمارات" },
      { label: "المنطقة الزمنية", value: "GST (UTC+4)" },
      { label: "المطار", value: "DXB – دبي الدولي" },
    ],
    highlights: [
      {
        title: "برج خليفة",
        description: "أطول مبنى في العالم (828 م). منصة المراقبة في الطابق 148 توفر إطلالة 360 درجة مذهلة على المدينة والصحراء والبحر.",
      },
      {
        title: "دبي القديمة",
        description: "حي الفهيدي التاريخي وخور دبي يفتحان نافذة على ماضي المدينة التجاري قبل عصر النفط، مع عمارة أبراج الرياح والأسواق التقليدية.",
      },
      {
        title: "نخلة جميرا",
        description: "أكبر أرخبيل اصطناعي في العالم، على شكل نخلة ويمكن رؤيته من الفضاء — يضم اليوم فنادق فخمة وإقامات راقية.",
      },
      {
        title: "صحراء دبي",
        description: "على بعد 45 دقيقة من المدينة، تقدم الصحراء العربية تزلجًا على الكثبان وركوب جمال وسفاري بالسيارات وعشاء بدوي تحت النجوم.",
      },
    ],
    culture: [
      {
        title: "الدين والمجتمع",
        points: [
          "الإسلام هو الدين الرسمي؛ احترم أوقات الصلاة والعادات",
          "الجمعة يوم عطلة — بعض الدوائر الحكومية تغلق بعد ظهر الخميس",
          "رمضان يغير مواعيد العمل ويحظر الأكل والشرب في الأماكن العامة وقت الإفطار",
        ],
      },
      {
        title: "العادات وآداب السلوك",
        points: [
          "إظهار المشاعر في الأماكن العامة يجب أن يكون محدودًا",
          "ارتدِ ملابس محتشمة في المراكز التجارية والأسواق والمساجد",
          "الكحول متاح في الأماكن المرخصة (فنادق، بارات، مطاعم) لكن ليس في الأماكن العامة",
          "التصوير يستلزم إذنًا، خاصة لصور النساء بالزي التقليدي",
        ],
      },
      {
        title: "الأحداث والفعاليات",
        points: [
          "مهرجان دبي للتسوق (يناير–فبراير) — تخفيضات ضخمة وفعاليات",
          "مهرجان دبي للطعام (فبراير–مارس) — احتفالات طهوية في أرجاء المدينة",
          "احتفالات العيد مع الألعاب النارية والفعاليات في جميع أنحاء المدينة",
        ],
      },
    ],
    weather: {
      description:
        "دبي ذات مناخ صحراوي حار مع شمس طوال العام تقريبًا. الشتاء معتدل ولطيف؛ الصيف حار للغاية ورطب.",
      seasons: [
        { name: "الشتاء", dates: "نوفمبر – فبراير", description: "الموسم المثالي — مشمس، 20–28 درجة، مثالي لجميع الأنشطة الخارجية.", hot: false },
        { name: "الربيع", dates: "مارس – أبريل", description: "يرتفع حتى 35 درجة. طقس جيد مع عواصف رملية عرضية.", hot: false },
        { name: "الصيف", dates: "مايو – سبتمبر", description: "حر شديد 38–45 درجة مع رطوبة عالية. معظم الأنشطة في الداخل.", hot: true },
        { name: "الخريف", dates: "أكتوبر", description: "تنخفض درجات الحرارة إلى 30–35 درجة — الموسم المرتفع يبدأ.", hot: false },
      ],
      bestTime: [
        { period: "نوفمبر – فبراير", note: "طقس مثالي لزيارة المعالم وجولات الصحراء والشواطئ والعشاء في الهواء الطلق." },
        { period: "مارس – أبريل", note: "لا يزال جيدًا قبل ذروة الحر — احجز مبكرًا فالأسعار ترتفع." },
      ],
      climate: {
        type: "صحراوي حار (BWh)",
        tempRange: "14 درجة – 45 درجة",
        rainfall: "منخفض جدًا؛ أقل من 100 مم/سنة",
      },
      tip: "الصيف (مايو–سبتمبر) حار للغاية — خطط لأنشطة داخلية (مراكز تسوق، متاحف) وتجنب المجهود البدني في منتصف النهار.",
    },
    food: [
      { name: "شاورما", description: "لحم مشوي على السيخ (دجاج أو خروف) ملفوف في خبز مع صلصة الثوم والمخلل — وجبة الشارع الأمثل." },
      { name: "حمص ومزة", description: "دق الحمص الكريمي مع الخبز، ضمن مزة لبنانية متنوعة منتشرة في كل أنحاء المدينة." },
      { name: "الهريس", description: "طبق تقليدي من القمح واللحم يُطهى ببطء، يُقدَّم في رمضان والاحتفالات — بسيط وشهي." },
      { name: "قهوة عربية وتمر", description: "القهوة بالهيل (قهوة) مع التمر الطازج هو الترحيب التقليدي في أي لقاء أو اجتماع." },
      { name: "لقيمات", description: "كرات عجين مقلية ذهبية مسكوبة بديبس التمر والسمسم — الحلوى الشارعية المفضلة في دبي." },
      { name: "المأكولات البحرية", description: "هامور طازج وروبيان وجراد بحر من الخليج، مشوي أو في كاري غني في المطاعم على الواجهة المائية." },
    ],
    transport: {
      gettingThere: [
        { name: "بالطائرة", description: "مطار دبي الدولي (DXB) من أكثر المطارات ازدحامًا في العالم — رحلات مباشرة من تقريبًا كل المدن الكبرى. المبنى 3 يخدم طيران الإمارات." },
        { name: "بالقطار", description: "لا توجد وصلات سكك حديدية دولية — الطائرة هي الخيار العملي الوحيد." },
        { name: "بالسفينة السياحية", description: "دبي مركز سياحة بحرية رئيسي مع رسو السفن في ميناء راشد، شائع لرحلات الشرق الأوسط." },
      ],
      movingAround: [
        { name: "مترو دبي", description: "نظيف ومكيف وبأسعار معقولة. الخطان الأحمر والأخضر يغطيان معظم المناطق السياحية. يعمل 05:30–منتصف الليل (01:00 ج–س)." },
        { name: "تاكسي", description: "وفير بعداد وأسعار معقولة. أوبر وكريم (المحلي) يعملان في جميع أنحاء المدينة." },
        { name: "عبرة (قارب تقليدي)", description: "قوارب خشبية تقليدية تعبر خور دبي بدرهم واحد — تجربة لا تُفوَّت تربط ديرة وبر دبي." },
        { name: "تأجير سيارة", description: "موصى به للرحلات الصحراوية. الرخصة الدولية سارية؛ القيادة على اليمين." },
      ],
    },
    budget: {
      currency: "الدرهم الإماراتي (AED)",
      levels: [
        { name: "مقتصد", range: "200–350 درهم / يوم" },
        { name: "متوسط", range: "350–700 درهم / يوم" },
        { name: "فاخر", range: "700+ درهم / يوم" },
      ],
      examples: [
        { item: "قهوة في مقهى", price: "15–25 درهم" },
        { item: "شاورما", price: "8–15 درهم" },
        { item: "وجبة في مطعم متوسط", price: "50–100 درهم" },
        { item: "رحلة بالمترو", price: "3–8 دراهم" },
        { item: "تاكسي (مسافة قصيرة)", price: "15–30 درهم" },
        { item: "منصة مراقبة برج خليفة", price: "149–399 درهم" },
        { item: "فندق (ليلة واحدة)", price: "300–2000+ درهم" },
      ],
      tips: [
        "احجز تذاكر برج خليفة عبر الإنترنت مسبقًا — الأسعار في الشباك أعلى بكثير.",
        "دبي مول وإيموي وتسوق في دبي ومعظم المعالم دخولها مجاني — خصص ميزانية للطعام والتجارب.",
        "الكحول غالٍ (عادة 40–80 درهم للمشروب في الأماكن المرخصة).",
        "بطاقة كريم والمدفوعات اللاتلامسية مقبولة على نطاق واسع.",
      ],
    },
    safety: {
      overview:
        "دبي من أكثر المدن أمانًا في العالم مع معدلات جريمة منخفضة جدًا. الشرطة موجودة وسريعة الاستجابة. تنطبق احتياطات السفر المعتادة.",
      tips: [
        "ارتدِ ملابس محتشمة في الأماكن العامة — ملابس الشاطئ فقط على الشواطئ والمسابح",
        "السكر في الأماكن العامة غير قانوني — اشرب في الأماكن المرخصة فقط",
        "العبور خارج ممرات المشاة يستوجب غرامة",
        "انتبه لمنشورات التواصل الاجتماعي — انتقاد السلطات الإماراتية قد تترتب عليه عواقب قانونية",
      ],
      emergency: [
        { service: "الشرطة", number: "999" },
        { service: "الإسعاف", number: "998" },
        { service: "الإطفاء", number: "997" },
        { service: "خفر السواحل", number: "996" },
      ],
    },
    packing: {
      essentials: [
        "جواز السفر ووثائق التأشيرة",
        "تأمين السفر",
        "واقي شمس (SPF 50+) ونظارات شمسية",
        "أحذية مريحة للمشي",
        "ملابس محتشمة للمراكز التجارية والمواقع الدينية",
        "زجاجة ماء قابلة لإعادة الاستخدام",
        "محول كهربائي (مقابس من النوع G)",
      ],
      summer: [
        "أقمشة خفيفة للغاية وقابلة للتنفس",
        "قبعة شمس وملابس بحماية من الأشعة فوق البنفسجية",
        "منشفة أو بخاخ تبريد",
        "جدول أنشطة داخلية",
      ],
      winter: [
        "سترة خفيفة أو كارديغان للأماكن المكيفة",
        "قطع قابلة للطبق لتغييرات الحرارة",
      ],
    },
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────

const GUIDES: Record<string, DestinationGuide> = {
  djerba,
  dubai,
};

export function getDestinationGuide(slug: string): DestinationGuide | null {
  return GUIDES[slug] ?? null;
}
