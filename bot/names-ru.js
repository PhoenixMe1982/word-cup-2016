// Перевод имён игроков football-data.org (латиница) → кириллица для приложения.
// 1) NAME_RU — точные написания известных игроков (ключ — имя как его отдаёт API)
// 2) genericTranslit — фолбэк для неизвестных имён; такие случаи бот помечает
//    админу в Telegram, исправить можно командой /scorer ren N Имя

const NAME_RU = {
  // ── Группа A ──
  'Julián Quiñones': 'Хулиан Киньонес',
  'Raúl Jiménez': 'Рауль Хименес',
  'Santiago Giménez': 'Сантьяго Хименес',
  'Hirving Lozano': 'Ирвинг Лосано',
  'Edson Álvarez': 'Эдсон Альварес',
  'Lyle Foster': 'Лайл Фостер',
  'Themba Zwane': 'Темба Зване',
  // Корейцев football-data.org присылает в порядке «имя фамилия» — держим оба варианта
  'Son Heung-min': 'Сон Хын Мин',
  'Heung-min Son': 'Сон Хын Мин',
  'Hwang Hee-chan': 'Хван Хи Чхан',
  'Hee-chan Hwang': 'Хван Хи Чхан',
  'Lee Kang-in': 'Ли Кан Ин',
  'Kang-in Lee': 'Ли Кан Ин',
  'Oh Hyeon-gyu': 'О Хён Гю',
  'Hyeon-gyu Oh': 'О Хён Гю',
  'Hwang In-beom': 'Хван Ин Бём',
  'In-beom Hwang': 'Хван Ин Бём',
  'Cho Gue-sung': 'Чо Гю Сон',
  'Gue-sung Cho': 'Чо Гю Сон',
  'Patrik Schick': 'Патрик Шик',
  'Adam Hložek': 'Адам Гложек',
  'Tomáš Souček': 'Томаш Соучек',
  'Ladislav Krejčí': 'Ладислав Крейчи',
  'Lukáš Provod': 'Лукаш Провод',
  'Václav Černý': 'Вацлав Черни',
  // ── Группа B ──
  'Jonathan David': 'Джонатан Дэвид',
  'Alphonso Davies': 'Альфонсо Дэвис',
  'Cyle Larin': 'Сайл Ларин',
  'Tajon Buchanan': 'Тажон Бьюкенен',
  'Edin Džeko': 'Эдин Джеко',
  'Ermedin Demirović': 'Эрмедин Демирович',
  'Akram Afif': 'Акрам Афиф',
  'Almoez Ali': 'Альмоэз Али',
  'Breel Embolo': 'Брель Эмболо',
  'Granit Xhaka': 'Гранит Джака',
  'Zeki Amdouni': 'Зеки Амдуни',
  'Dan Ndoye': 'Дан Ндой',
  // ── Группа C ──
  'Vinicius Junior': 'Винисиус Жуниор',
  'Vinícius Júnior': 'Винисиус Жуниор',
  'Rodrygo': 'Родриго',
  'Raphinha': 'Рафинья',
  'Endrick': 'Эндрик',
  'Neymar': 'Неймар',
  'Gabriel Martinelli': 'Габриэл Мартинелли',
  'Matheus Cunha': 'Матеус Кунья',
  'Youssef En-Nesyri': 'Юссеф Эн-Несири',
  'Brahim Díaz': 'Брахим Диас',
  'Hakim Ziyech': 'Хаким Зиеш',
  'Achraf Hakimi': 'Ашраф Хакими',
  'Soufiane Rahimi': 'Суфиан Рахими',
  'Scott McTominay': 'Скотт Мактоминей',
  'John McGinn': 'Джон Макгинн',
  'Ché Adams': 'Че Адамс',
  'Lyndon Dykes': 'Линдон Дайкс',
  'Duckens Nazon': 'Дакенс Назон',
  // ── Группа D ──
  'Christian Pulisic': 'Кристиан Пулишич',
  'Folarin Balogun': 'Фоларин Балогун',
  'Timothy Weah': 'Тимоти Веа',
  'Ricardo Pepi': 'Рикардо Пепи',
  'Miguel Almirón': 'Мигель Альмирон',
  'Julio Enciso': 'Хулио Энсисо',
  'Antonio Sanabria': 'Антонио Санабрия',
  'Mitchell Duke': 'Митчелл Дьюк',
  'Craig Goodwin': 'Крейг Гудвин',
  'Kenan Yıldız': 'Кенан Йылдыз',
  'Arda Güler': 'Арда Гюлер',
  'Hakan Çalhanoğlu': 'Хакан Чалханоглу',
  'Kerem Aktürkoğlu': 'Керем Актюркоглу',
  // ── Группа E ──
  'Jamal Musiala': 'Джамал Мусиала',
  'Florian Wirtz': 'Флориан Вирц',
  'Kai Havertz': 'Кай Хаверц',
  'Niclas Füllkrug': 'Никлас Фюллькруг',
  'Leroy Sané': 'Лерой Сане',
  'Serge Gnabry': 'Серж Гнабри',
  'Sébastien Haller': 'Себастьен Алле',
  'Franck Kessié': 'Франк Кессье',
  'Simon Adingra': 'Симон Адингра',
  'Enner Valencia': 'Эннер Валенсия',
  'Moisés Caicedo': 'Мойсес Кайседо',
  'Kevin Rodríguez': 'Кевин Родригес',
  // ── Группа F ──
  'Memphis Depay': 'Мемфис Депай',
  'Cody Gakpo': 'Коди Гакпо',
  'Xavi Simons': 'Хави Симонс',
  'Wout Weghorst': 'Ваут Вегхорст',
  'Takefusa Kubo': 'Такефуса Кубо',
  'Kaoru Mitoma': 'Каору Митома',
  'Ayase Ueda': 'Аясэ Уэда',
  'Ritsu Doan': 'Рицу Доан',
  'Takumi Minamino': 'Такуми Минамино',
  'Viktor Gyökeres': 'Виктор Дьёкереш',
  'Alexander Isak': 'Александер Исак',
  'Dejan Kulusevski': 'Деян Кулусевски',
  'Hannibal Mejbri': 'Ханнибаль Мейбри',
  'Youssef Msakni': 'Юссеф Мсакни',
  // ── Группа G ──
  'Romelu Lukaku': 'Ромелу Лукаку',
  'Kevin De Bruyne': 'Кевин Де Брёйне',
  'Jérémy Doku': 'Жереми Доку',
  'Loïs Openda': 'Лоис Опенда',
  'Charles De Ketelaere': 'Шарль Де Кетеларе',
  'Mohamed Salah': 'Мохамед Салах',
  'Omar Marmoush': 'Омар Мармуш',
  'Mehdi Taremi': 'Мехди Тареми',
  'Sardar Azmoun': 'Сардар Азмун',
  'Chris Wood': 'Крис Вуд',
  // ── Группа H ──
  'Lamine Yamal': 'Ламин Ямаль',
  'Nico Williams': 'Нико Уильямс',
  'Álvaro Morata': 'Альваро Мората',
  'Dani Olmo': 'Дани Ольмо',
  'Mikel Oyarzabal': 'Микель Оярсабаль',
  'Ferran Torres': 'Ферран Торрес',
  'Pedri': 'Педри',
  'Darwin Núñez': 'Дарвин Нуньес',
  'Federico Valverde': 'Федерико Вальверде',
  'Facundo Pellistri': 'Факундо Пельистри',
  'Salem Al-Dawsari': 'Салем Аль-Досари',
  'Firas Al-Buraikan': 'Фирас Аль-Брайкан',
  // ── Группа I ──
  'Kylian Mbappé': 'Килиан Мбаппе',
  'Antoine Griezmann': 'Антуан Гризманн',
  'Ousmane Dembélé': 'Усман Дембеле',
  'Marcus Thuram': 'Маркус Тюрам',
  'Bradley Barcola': 'Брэдли Барколя',
  'Michael Olise': 'Микаэль Олисе',
  'Sadio Mané': 'Садио Мане',
  'Nicolas Jackson': 'Николас Джексон',
  'Ismaïla Sarr': 'Исмаила Сарр',
  'Boulaye Dia': 'Булай Диа',
  'Erling Haaland': 'Эрлинг Холанд',
  'Martin Ødegaard': 'Мартин Эдегор',
  'Alexander Sørloth': 'Александер Сёрлот',
  'Aymen Hussein': 'Аймен Хусейн',
  // ── Группа J ──
  'Lionel Messi': 'Лионель Месси',
  'Lautaro Martínez': 'Лаутаро Мартинес',
  'Julián Álvarez': 'Хулиан Альварес',
  'Nicolás González': 'Николас Гонсалес',
  'Alexis Mac Allister': 'Алексис Мак Аллистер',
  'Paulo Dybala': 'Пауло Дибала',
  'Riyad Mahrez': 'Рияд Марез',
  'Amine Gouiri': 'Амин Гуири',
  'Mohamed Amoura': 'Мохамед Амура',
  'Marko Arnautović': 'Марко Арнаутович',
  'Marcel Sabitzer': 'Марсель Забитцер',
  'Christoph Baumgartner': 'Кристоф Баумгартнер',
  'Michael Gregoritsch': 'Михаэль Грегорич',
  'Mousa Tamari': 'Муса Тамари',
  // ── Группа K ──
  'Cristiano Ronaldo': 'Криштиану Роналду',
  'Rafael Leão': 'Рафаэл Леан',
  'Bruno Fernandes': 'Бруну Фернандеш',
  'Gonçalo Ramos': 'Гонсалу Рамуш',
  'João Félix': 'Жоау Фелиш',
  'Cédric Bakambu': 'Седрик Бакамбу',
  'Yoane Wissa': 'Йоан Висса',
  'Eldor Shomurodov': 'Элдор Шомуродов',
  'Abbosbek Fayzullaev': 'Аббосбек Файзуллаев',
  'Luis Díaz': 'Луис Диас',
  'James Rodríguez': 'Хамес Родригес',
  'Jhon Durán': 'Джон Дуран',
  'Jhon Córdoba': 'Джон Кордоба',
  // ── Группа L ──
  'Harry Kane': 'Харри Кейн',
  'Jude Bellingham': 'Джуд Беллингем',
  'Bukayo Saka': 'Букайо Сака',
  'Phil Foden': 'Фил Фоден',
  'Cole Palmer': 'Коул Палмер',
  'Ollie Watkins': 'Олли Уоткинс',
  'Luka Modrić': 'Лука Модрич',
  'Andrej Kramarić': 'Андрей Крамарич',
  'Ivan Perišić': 'Иван Перишич',
  'Mohammed Kudus': 'Мохаммед Кудус',
  'Jordan Ayew': 'Джордан Айю',
  'Antoine Semenyo': 'Антуан Семеньо',
  'Ismael Díaz': 'Исмаэль Диас',
}

// ── Фолбэк-транслитерация (приближённая, помечается админу) ────────────────

const DIGRAPHS = [
  ['shch', 'щ'], ['sch', 'ш'], ['tsch', 'ч'],
  ['ch', 'ч'], ['sh', 'ш'], ['zh', 'ж'], ['kh', 'х'], ['ph', 'ф'], ['th', 'т'],
  ['ck', 'к'], ['qu', 'ку'], ['ll', 'ль'], ['gn', 'нь'],
  ['ya', 'я'], ['yu', 'ю'], ['yo', 'йо'], ['ye', 'е'],
  ['ai', 'ай'], ['ei', 'ей'], ['oi', 'ой'], ['ou', 'у'], ['ee', 'и'], ['oo', 'у'],
]

const CHARS = {
  a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х',
  i: 'и', j: 'дж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п',
  q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс',
  y: 'й', z: 'з',
  'ñ': 'нь', 'ç': 'с', 'ß': 'сс',
}

function stripDiacritics(s) {
  // ñ/ç/ß обрабатываются отдельно — не упрощаем их
  return s.replace(/[^ -~ñçß]/g, (ch) =>
    ch.normalize('NFD').replace(/[̀-ͯ]/g, '')
  )
}

function translitWord(word) {
  let w = stripDiacritics(word.toLowerCase())
  let out = ''
  let i = 0
  while (i < w.length) {
    const pair = DIGRAPHS.find(([d]) => w.startsWith(d, i))
    if (pair) { out += pair[1]; i += pair[0].length; continue }
    out += CHARS[w[i]] ?? w[i]
    i++
  }
  return out.charAt(0).toUpperCase() + out.slice(1)
}

function genericTranslit(name) {
  return name.split(/\s+/).map(part =>
    part.split('-').map(translitWord).join('-')
  ).join(' ')
}

// Возвращает { name, exact } — exact=false значит сработал фолбэк
function toRussianName(latinName) {
  const hit = NAME_RU[latinName] || NAME_RU[stripDiacritics(latinName)]
  if (hit) return { name: hit, exact: true }
  return { name: genericTranslit(latinName), exact: false }
}

module.exports = { toRussianName, NAME_RU }
