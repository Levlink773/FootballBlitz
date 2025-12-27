from enum import Enum

from .types import SceneTemplate
from ..entities import BlitzMatchData

# --- СЦЕНИ БЕЗ ГОЛА (NO_GOAL_EVENT_SCENES) ---
# Списки розширено, щоб для кожної комбінації було мінімум 3 варіанти.
NO_GOAL_EVENT_SCENES = [
# 1. Attacker vs Enemy Goalkeeper (Сейв 1 на 1)
    SceneTemplate(
        text="Вихід віч-на-віч! <b>{attacker}</b> намагається прокинути м'яч повз <b>{enemy_goalkeeper}</b>, але кіпер читає думки і забирає м'яч у ногах! Гросмейстерський сейв! 🧠🧤",
        required_positions=["attacker", "enemy_goalkeeper"]
    ),
    # 2. Midfielder - Дальній удар (Промах)
    SceneTemplate(
        text="<b>{midfielder}</b> підхоплює відскок і з льоту б'є по воротах! Гармата страшна, але м'яч свистить над перекладиною! Трибуни видихнули! 🌬️🚀",
        required_positions=["midfielder"]
    ),
    # 3. Attacker vs Enemy Defender (Блок)
    SceneTemplate(
        text="<b>{attacker}</b> вже бачив м'яч у сітці, але <b>{enemy_defender}</b> виростає нізвідки і тілом блокує цей постріл! Справжній мур! 🧱🛡️",
        required_positions=["attacker", "enemy_defender"]
    ),
    # 4. Defender (Кутовий) vs Enemy Goalkeeper
    SceneTemplate(
        text="Подача з кутового, <b>{defender}</b> вистрибує вище всіх і б'є головою! Але <b>{enemy_goalkeeper}</b> у неймовірному стрибку витягує м'яч з дев'ятки! 🐈✈️",
        required_positions=["defender", "enemy_goalkeeper"]
    ),
    # 5. Midfielder vs Enemy Midfielder (Відбір)
    SceneTemplate(
        text="<b>{midfielder}</b> намагався пройти центром, демонструючи техніку, але <b>{enemy_midfielder}</b> жорстко, але чисто відбирає м'яч! Центр поля програно! ⚔️❌",
        required_positions=["midfielder", "enemy_midfielder"]
    ),
    # 6. Attacker (Штанга)
    SceneTemplate(
        text="Який момент! <b>{attacker}</b> майстерно закручує м'яч у дальній кут... ДЗВІН ШТАНГИ! Каркас воріт рятує суперника! 😱🔔",
        required_positions=["attacker"]
    ),
    # 7. Attacker vs Enemy Defender (Офсайд/Пастка)
    SceneTemplate(
        text="<b>{attacker}</b> виривається на оперативний простір, але <b>{enemy_defender}</b> вчасно робить крок вперед. Арбітр фіксує офсайд! Пастка спрацювала! 🚩🧐",
        required_positions=["attacker", "enemy_defender"]
    ),
    # 8. Midfielder vs Enemy Goalkeeper (Сейв)
    SceneTemplate(
        text="Хитрий удар зі штрафного від <b>{midfielder}</b>! М'яч опускався у нижній кут, але <b>{enemy_goalkeeper}</b> кінчиками пальців переводить на кутовий! 🧤🔥",
        required_positions=["midfielder", "enemy_goalkeeper"]
    ),
    # 9. Defender - Невдалий пас
    SceneTemplate(
        text="<b>{defender}</b> підключився до атаки, але його передача вздовж воріт не знайшла адресата. М'яч просто викотився за лінію. Прикро! 📉",
        required_positions=["defender"]
    ),
    # 10. Attacker vs Enemy Defender (Підкат)
    SceneTemplate(
        text="<b>{attacker}</b> на швидкості вривається у штрафний, але <b>{enemy_defender}</b> виконує ідеально чистий підкат! М'яч вибито! Підручник захисту! 📚👟",
        required_positions=["attacker", "enemy_defender"]
    ),
    # 11. Goalkeeper (помилка візаві)
    SceneTemplate(
        text="Суперник намагався перекинути нашого воротаря, але <b>{goalkeeper}</b> спокійно контролював ситуацію і забрав м'яч до рук. Легка здобич! 😎👐",
        required_positions=["goalkeeper"]
    ),
    # 12. Midfielder (Технічний брак)
    SceneTemplate(
        text="<b>{midfielder}</b> опинився на вбивчій позиції, але м'яч зрізався з ноги і полетів в бік кутового прапорця. Техніка підвела! 🥴📉",
        required_positions=["midfielder"]
    ),
    # 13. Attacker vs Enemy Goalkeeper (Сейв ногами)
    SceneTemplate(
        text="Удар впритул від <b>{attacker}</b>! Здавалося, це гол, але <b>{enemy_goalkeeper}</b> інстинктивно відбиває м'яч ногою! Реакція мангуста! 🐍⛔️",
        required_positions=["attacker", "enemy_goalkeeper"]
    ),
    # 14. Defender vs Enemy Attacker (Блокування навісу)
    SceneTemplate(
        text="Суперник намагався навісити, але <b>{defender}</b> грамотно обрав позицію і заблокував передачу. Повітря під контролем! 🛡️✈️",
        required_positions=["defender"]
    ),
    # 15. Attacker (Перетримав)
    SceneTemplate(
        text="<b>{attacker}</b> занадто довго возився з м'ячем у штрафному, намагаючись обіграти всіх. Захисники встигли повернутися і відібрати сферу! 🐢❌",
        required_positions=["attacker"]
    ),
# 16. Attacker vs Enemy Defender (Блокування корпусом)
    SceneTemplate(
        text="<b>{attacker}</b> намагається протиснути <b>{enemy_defender}</b> і вийти на ударну позицію, але захисник ставить залізний корпус! М'яч втрачено! 🛑🛡️",
        required_positions=["attacker", "enemy_defender"]
    ),
    # 17. Midfielder vs Enemy Goalkeeper (Впевнений сейв)
    SceneTemplate(
        text="Потужний постріл від <b>{midfielder}</b> метрів з 25-ти! М'яч летить по центру, і <b>{enemy_goalkeeper}</b> спокійно фіксує його намертво. На досвіді! 👴🧤",
        required_positions=["midfielder", "enemy_goalkeeper"]
    ),
    # 18. Defender vs Enemy Attacker (Перехоплення)
    SceneTemplate(
        text="Суперник намагався розрізати оборону пасом на хід, але <b>{defender}</b> прочитав задум і перехопив м'яч у стилі італійських майстрів! Bravo! 🇮🇹🍕",
        required_positions=["defender"]
    ),
    # 19. Attacker (Невлучно головою)
    SceneTemplate(
        text="Ідеальний навіс на <b>{attacker}</b>! Він б'є головою без опору... але м'яч проходить в сантиметрах від стійки! Як же так?! 😱📏",
        required_positions=["attacker"]
    ),
    # 20. Goalkeeper (Гра на виході)
    SceneTemplate(
        text="Небезпечна подача у воротарський майданчик! <b>{goalkeeper}</b> безстрашно йде на вихід і кулаками вибиває м'яч подалі від воріт! Король повітря! 👑✈️",
        required_positions=["goalkeeper"]
    ),
    # 21. Midfielder vs Enemy Midfielder (Тактичний фол - без картки, просто зрив атаки)
    SceneTemplate(
        text="<b>{midfielder}</b> розганявся центром, але <b>{enemy_midfielder}</b> грамотно зупиняє прорив дрібним фолом. Атаку зірвано, захист встиг повернутися. 🛑🧠",
        required_positions=["midfielder", "enemy_midfielder"]
    ),
    # 22. Attacker vs Enemy Goalkeeper (Сейв обличчям/тілом)
    SceneTemplate(
        text="<b>{attacker}</b> розстрілює ворота в упор! <b>{enemy_goalkeeper}</b> кидається під удар і відбиває м'яч... здається, обличчям! Героїчний порятунок! 🤕🧱",
        required_positions=["attacker", "enemy_goalkeeper"]
    ),
    # 23. Defender (Рикошет)
    SceneTemplate(
        text="<b>{defender}</b> наважився на дальній удар. М'яч зачіпає захисника суперників, змінює траєкторію... і проходить поруч зі штангою! Кутовий! ↪️🚩",
        required_positions=["defender"]
    ),
    # 24. Midfielder (Втрата рівноваги)
    SceneTemplate(
        text="<b>{midfielder}</b> готувався завдати вирішального удару, але поїхала опорна нога! Удар вийшов слабким і неточним. Прикрість! ⛸️🤦",
        required_positions=["midfielder"]
    ),
    # 25. Attacker vs Enemy Defender (Виніс з лінії)
    SceneTemplate(
        text="Воротар вже був відіграний! <b>{attacker}</b> котив м'яч у порожні ворота, але <b>{enemy_defender}</b> в останню секунду вибиває його з лінії! Неймовірно! 🚒💨",
        required_positions=["attacker", "enemy_defender"]
    ),
    # 26. Goalkeeper (Подвійний сейв)
    SceneTemplate(
        text="Перший удар <b>{goalkeeper}</b> відбиває перед собою, добивання... і знову сейв! Воротар сьогодні зловив кураж! Стіна! 🧱🔥",
        required_positions=["goalkeeper"]
    ),
    # 27. Attacker (Зайві фінти)
    SceneTemplate(
        text="<b>{attacker}</b> хотів зіграти красиво і почав робити фінти у штрафному, замість того щоб просто пробити. Захисники подякували і забрали м'яч. 🎪🤡",
        required_positions=["attacker"]
    ),
    # 28. Defender vs Enemy Attacker (Гра плече в плече)
    SceneTemplate(
        text="<b>{enemy_attacker}</b> рвався до воріт, але <b>{defender}</b> нав'язав силову боротьбу плече в плече і відтіснив суперника від м'яча. Чисто! 💪⚖️",
        required_positions=["defender", "enemy_team_character"] # Тут enemy_attacker потрапить в enemy_team_character
    ),
    # 29. Midfielder (Влучання в свого)
    SceneTemplate(
        text="<b>{midfielder}</b> потужно пробиває, але м'яч влучає у спину власного нападника! Найкращий захисник суперника — це наш гравець! 😂🛡️",
        required_positions=["midfielder"]
    ),
    # 30. Attacker vs Enemy Goalkeeper (Своєчасний вихід)
    SceneTemplate(
        text="<b>{attacker}</b> отримав розрізний пас, але <b>{enemy_goalkeeper}</b> вчасно вийшов з воріт і першим встиг до м'яча, вибивши його в аут! Ліберо! 🏃‍♂️🧤",
        required_positions=["attacker", "enemy_goalkeeper"]
    ),
# 31. Attacker (Удар через себе - невдача)
    SceneTemplate(
        text="<b>{attacker}</b> наважується на удар бісіклетою! Це виглядало ефектно, але м'яч полетів в бік кутового прапорця. За сміливість — п'ять, за виконання — два. 🤸‍♂️📉",
        required_positions=["attacker"]
    ),
    # 32. Midfielder vs Enemy Defender (Стіна)
    SceneTemplate(
        text="<b>{midfielder}</b> потужно прикладається до м'яча, але влучає прямо у <b>{enemy_defender}</b>. Захисник навіть не поворухнувся! Залізна людина! 🤖🛡️",
        required_positions=["midfielder", "enemy_defender"]
    ),
    # 33. Goalkeeper (Сейв ногою)
    SceneTemplate(
        text="Рикошет дезорієнтував усіх, крім <b>{goalkeeper}</b>! Воротар встигає виставити ногу і відбити м'яч, що вже котився у ворота. Рефлекси на рівні бога! ⚡🦶",
        required_positions=["goalkeeper"]
    ),
    # 34. Defender vs Enemy Attacker (Гра корпусом)
    SceneTemplate(
        text="<b>{enemy_attacker}</b> намагався прокинути м'яч повз <b>{defender}</b>, але захисник грамотно поставив корпус і відтіснив опонента за межі поля. Удар від воріт. 🚪💪",
        required_positions=["defender", "enemy_team_character"]
    ),
    # 35. Attacker (Егоїзм)
    SceneTemplate(
        text="Партнери були відкриті, але <b>{attacker}</b> вирішив все зробити сам. Удар з гострого кута прийшовся у зовнішню сітку. Команда незадоволена! 😠🕸️",
        required_positions=["attacker"]
    ),
    # 36. Midfielder vs Enemy Goalkeeper (Кінчиками пальців)
    SceneTemplate(
        text="Кручений удар від <b>{midfielder}</b> під дальню стійку! <b>{enemy_goalkeeper}</b> витягується у струнку і кінчиками рукавичок переводить м'яч на кутовий! Красень! 🧤📐",
        required_positions=["midfielder", "enemy_goalkeeper"]
    ),
    # 37. Defender (Блок головою)
    SceneTemplate(
        text="Гарматний постріл по воротах! <b>{defender}</b> без страху підставляє голову під м'яч і рятує ворота! Це справжній капітанський вчинок! 🤕🛡️",
        required_positions=["defender"]
    ),
    # 38. Attacker (Слизький газон)
    SceneTemplate(
        text="<b>{attacker}</b> отримав пас на хід, але послизнувся на рівному місці в вирішальний момент! Газон сьогодні грає за захист. 🌱💦",
        required_positions=["attacker"]
    ),
    # 39. Goalkeeper (Перехоплення навісу)
    SceneTemplate(
        text="Небезпечний навіс з флангу! <b>{goalkeeper}</b> гучно кричить 'Я!' і забирає м'яч у найвищій точці. Повний контроль штрафного майданчика. 📢👐",
        required_positions=["goalkeeper"]
    ),
    # 40. Midfielder vs Enemy Midfielder (Пресинг)
    SceneTemplate(
        text="<b>{midfielder}</b> забарився з прийняттям рішення, і <b>{enemy_midfielder}</b> миттєво накрив його пресингом. М'яч відібрано без порушення правил! 🦈⚙️",
        required_positions=["midfielder", "enemy_midfielder"]
    ),
    # 41. Attacker vs Enemy Defender (Штучний офсайд)
    SceneTemplate(
        text="<b>{attacker}</b> забиває гол! Але ні... боковий арбітр підняв прапорець. <b>{enemy_defender}</b> ідеально витримав лінію. Гол скасовано! 🚩🚫",
        required_positions=["attacker", "enemy_defender"]
    ),
    # 42. Defender (Винос)
    SceneTemplate(
        text="Паніка у штрафному майданчику! М'яч метається між ногами, але <b>{defender}</b> просто виносить його подалі на трибуни. Простіше, але надійно! 🚒💨",
        required_positions=["defender"]
    ),
    # 43. Midfielder (По горобцях)
    SceneTemplate(
        text="Ударна позиція для <b>{midfielder}</b>! Розбіг, удар... і м'яч летить десь на парковку стадіону. Сьогодні приціл збитий. 🕊️🚗",
        required_positions=["midfielder"]
    ),
    # 44. Attacker vs Enemy Goalkeeper (Психологія)
    SceneTemplate(
        text="<b>{attacker}</b> пробиває пенальті... і <b>{enemy_goalkeeper}</b> бере цей удар! Він вказав кут і стрибнув саме туди! Психологічна перемога! 🧠🧤",
        required_positions=["attacker", "enemy_goalkeeper"]
    ),
    # 45. Team (Непорозуміння)
    SceneTemplate(
        text="<b>{attacker}</b> і <b>{midfielder}</b> завадили один одному пробити по воротах! Зіткнулися лобами, а м'яч дістався супернику. Комедія помилок! 🎭🤦",
        required_positions=["attacker", "midfielder"]
    ),
    # --- Roles: ["team_character", "enemy_team_character"] ---
    SceneTemplate(
        text="<b>{team_character}</b> б'є впритул, але <b>{enemy_team_character}</b> у шпагаті блокує цей удар! Неймовірний захист! 🧱🔥",
        required_positions=["team_character", "enemy_team_character"]
    ),
    SceneTemplate(
        text="Удар зльоту від <b>{team_character}</b>! Але <b>{enemy_team_character}</b> кидається під м'яч і рятує команду. Це самопожертва! 💥🛡️",
        required_positions=["team_character", "enemy_team_character"]
    ),
    SceneTemplate(
        text="Небезпечний простріл на <b>{team_character}</b>, але <b>{enemy_team_character}</b> в останню мить вибиває м'яч з-під ніг. Ледь не проскочило! ⚡️",
        required_positions=["team_character", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{team_character}</b> вже замахнувся на удар, але <b>{enemy_team_character}</b> встигає підкотитися і вибити м’яч. Героєм матчу може стати! 🦸",
        required_positions=["team_character", "enemy_team_character"]
    ),
    SceneTemplate(
        text="Після розкішного пасу <b>{team_character}</b> виходить на ударну позицію, але <b>{enemy_team_character}</b> чудово читає гру і перехоплює м’яч! 🧠",
        required_positions=["team_character", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{team_character}</b> пробиває у верхній кут, але <b>{enemy_team_character}</b> витягує цей м’яч з-під поперечини! Фантастичний сейв! 🧤😮",
        required_positions=["team_character", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{team_character}</b> виривається сам на сам, але <b>{enemy_team_character}</b> кидається в ноги і рятує ситуацію! Блискавична реакція! ⚡️🧤",
        required_positions=["team_character", "enemy_team_character"]
    ),
    SceneTemplate(
        text="Момент для <b>{team_character}</b>! Удар — але <b>{enemy_team_character}</b> на лінії воріт виносить м’яч! Просто неймовірно! 🚫🥅",
        required_positions=["team_character", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{team_character}</b> намагається обійти <b>{enemy_team_character}</b> і пробити, але той не дозволяє цього, виграючи мікродуель. 🥊",
        required_positions=["team_character", "enemy_team_character"]
    ),
    SceneTemplate(
        text="Блискуча передача на <b>{team_character}</b> і здається, що це гол! Але <b>{enemy_team_character}</b> встигає підставити ногу! Шанс втрачено! ❌",
        required_positions=["team_character", "enemy_team_character"]
    ),
    # --- Roles: ["team_character"] ---
    SceneTemplate(
        text="<b>{team_character}</b> обігрує всіх і вже б'є по воротах, але м’яч влучає у штангу і вилітає за межі поля! Який момент! 😱🥅",
        required_positions=["team_character"]
    ),
    SceneTemplate(
        text="<b>{team_character}</b> пробиває в дотик після класної передачі, але м’яч просвистів поруч зі стійкою. Лічені сантиметри! 🌀",
        required_positions=["team_character"]
    ),
    SceneTemplate(
        text="<b>{team_character}</b> виривається сам на сам і вже готовий забивати, але підслизнувся в останню мить! Невдача! ❄️🤦",
        required_positions=["team_character"]
    ),
    SceneTemplate(
        text="Після індивідуального проходу <b>{team_character}</b> потужно б'є — і м’яч з гуркотом влучає в поперечину! Глядачі схопилися за голови! 😵‍💫",
        required_positions=["team_character"]
    ),
    SceneTemplate(
        text="<b>{team_character}</b> опиняється у вигідній позиції, б’є... але м’яч проходить вище воріт! Такий шанс не кожного дня! 🎯",
        required_positions=["team_character"]
    ),

]

# --- ГОЛЕВЫЕ СЦЕНЫ (GOAL_EVENT_SCENES) ---
# Списки розширено, щоб для кожної комбінації було мінімум 3 варіанти.
GOAL_EVENT_SCENES = [
# 1. Assistant (Mid) -> Scorer (Att) (Класика)
    SceneTemplate(
        text="<b>{assistant}</b> розрізає оборону пасом-цукеркою, <b>{scorer}</b> вибігає з-за спин захисників і котить м'яч повз воротаря! Класична атака! 🎩⚽",
        required_positions=["assistant", "scorer"]
    ),
    # 2. Scorer (Att) - Соло
    SceneTemplate(
        text="Що творить <b>{scorer}</b>?! Прийняв м'яч, прибрав одного, другого, поклав воротаря на газон і забив у порожні! Це магія! 🪄✨",
        required_positions=["scorer"]
    ),
    # 3. Assistant (Def) -> Scorer (Att) (Лонгбол)
    SceneTemplate(
        text="<b>{assistant}</b> зі своєї половини поля запускає діагональ на 50 метрів! <b>{scorer}</b> приймає на груди і другим дотиком вгачує м'яч у сітку! 🚀📡",
        required_positions=["assistant", "scorer"]
    ),
    # 4. Scorer (Mid) - Дальній удар
    SceneTemplate(
        text="<b>{scorer}</b> не став зближуватися, а просто бахнув метрів з 30-ти! М'яч влітає в дев'ятку, павутиння зірвано! Гол туру! 🕸️💣",
        required_positions=["scorer"]
    ),
    # 5. Assistant (Att) -> Scorer (Mid) (Скидка)
    SceneTemplate(
        text="<b>{assistant}</b> виграє верхову боротьбу і скидає під удар. <b>{scorer}</b> набігає з глибини і потужним ударом прошиває рукавички воротаря! 🥊⚽",
        required_positions=["assistant", "scorer"]
    ),
    # 6. Scorer (Att) vs Enemy Goalkeeper (Паненка)
    SceneTemplate(
        text="Вихід віч-на-віч... <b>{scorer}</b> знущально підсікає м'яч над <b>{enemy_goalkeeper}</b>! Це нахабство, але яке красиве! Паненка! 🥄🤤",
        required_positions=["scorer", "enemy_goalkeeper"]
    ),
    # 7. Scorer (Defender) - Кутовий
    SceneTemplate(
        text="Метушня у штрафному після кутового... М'яч відскакує до <b>{scorer}</b>, і захисник вганяє його у ворота, як цвях! Несподіваний герой! 🔨🛡️",
        required_positions=["scorer"]
    ),
    # 8. Assistant (Mid) -> Scorer (Att) (Простріл)
    SceneTemplate(
        text="<b>{assistant}</b> промчав флангом і прострілив уздовж воріт. <b>{scorer}</b> випередив усіх і замкнув передачу на дальній стійці! Як по нотах! 🎵🎹",
        required_positions=["assistant", "scorer"]
    ),
    # 9. Scorer vs Enemy Defender (Фінтом)
    SceneTemplate(
        text="<b>{scorer}</b> фінтом Зідана залишає <b>{enemy_defender}</b> в дурнях і крученим ударом вражає дальній кут! Самба на футбольному полі! 💃🇧🇷",
        required_positions=["scorer", "enemy_defender"]
    ),
    # 10. Scorer (Att) - Бісіклета
    SceneTemplate(
        text="Неймовірно! <b>{scorer}</b> складається в повітрі і б'є через себе! М'яч у сітці! Цей гол будуть крутити в повторах роками! 🚲📸",
        required_positions=["scorer"]
    ),
    # 11. Assistant (GK) -> Scorer (Att) (Асист воротаря)
    SceneTemplate(
        text="<b>{assistant}</b> вибиває м'яч від воріт так сильно, що виводить <b>{scorer}</b> сам на сам! Воротар стає асистентом! А нападник не схибив! 🎯🧤",
        required_positions=["assistant", "scorer"]
    ),
    # 12. Scorer vs Enemy Goalkeeper (Поміж ніг)
    SceneTemplate(
        text="<b>{scorer}</b> отримує м'яч у штрафному і несильно, але точно котить його поміж ніг <b>{enemy_goalkeeper}</b>! Прикрий гол для воротаря! 🎱😅",
        required_positions=["scorer", "enemy_goalkeeper"]
    ),
    # 13. Assistant (Att) -> Scorer (Att) (Два нападники)
    SceneTemplate(
        text="Два нападники вийшли на одного захисника! <b>{assistant}</b> не поскупився і покотив на порожні ворота для <b>{scorer}</b>. Легкий гол! 🤝🍰",
        required_positions=["assistant", "scorer"]
    ),
    # 14. Scorer (Mid) - Штрафний
    SceneTemplate(
        text="Штрафний удар. <b>{scorer}</b> розбігається і перекидає стінку. М'яч ідеально лягає в кут воріт! Майстер стандартів! 📏📐",
        required_positions=["scorer"]
    ),
    # 15. Scorer vs Enemy Defender (Помилка захисту)
    SceneTemplate(
        text="<b>{enemy_defender}</b> помиляється при передачі назад! <b>{scorer}</b> перехоплює, обходить воротаря і закочує у порожні! Покарання миттєве! 🎁⚖️",
        required_positions=["scorer", "enemy_defender"]
    ),
# 16. Assistant (Defender) -> Scorer (Attacker) (Крос)
    SceneTemplate(
        text="<b>{assistant}</b> підключився до атаки флангом і вирізав ідеальний крос! <b>{scorer}</b> замикає передачу головою у протихід воротарю! ГОЛ! 🎯✈️",
        required_positions=["assistant", "scorer"]
    ),
    # 17. Scorer (Midfielder) - Прохід центром
    SceneTemplate(
        text="<b>{scorer}</b> підхопив м'яч у центрі, протащив його 30 метрів, не помітивши опорників, і поклав м'яч у кут! Танк! 🚜💥",
        required_positions=["scorer"]
    ),
    # 18. Assistant (Mid) -> Scorer (Mid) (Дальній постріл після скидки)
    SceneTemplate(
        text="<b>{assistant}</b> відкотив м'яч під удар, і <b>{scorer}</b> зльоту вгатив його у дев'ятку! Воротар навіть не стрибнув! Гармата! 💣🕸️",
        required_positions=["assistant", "scorer"]
    ),
    # 19. Scorer (Attacker) vs Enemy Defender (Помилка захисту)
    SceneTemplate(
        text="Жахлива помилка <b>{enemy_defender}</b>! Послизнувся на рівному місці! <b>{scorer}</b> каже 'дякую', підхоплює м'яч і реалізує вихід віч-на-віч! 🎁⚽",
        required_positions=["scorer", "enemy_defender"]
    ),
    # 20. Scorer (Defender) - Штрафний
    SceneTemplate(
        text="До м'яча підходить захисник <b>{scorer}</b>... Розбіг... Удар! М'яч оминає стінку і влітає в притирку зі стійкою! Роберто Карлос би оцінив! 🍌🔥",
        required_positions=["scorer"]
    ),
    # 21. Assistant (Att) -> Scorer (Att) (Добивання)
    SceneTemplate(
        text="<b>{assistant}</b> потужно б'є, воротар відбиває перед собою, але <b>{scorer}</b> першим на добиванні! Інстинкт вбивці! 🔪⚽",
        required_positions=["assistant", "scorer"]
    ),
    # 22. Scorer vs Enemy Goalkeeper (Між ніг)
    SceneTemplate(
        text="<b>{scorer}</b> опинився перед воротами і нахабно прокинув м'яч поміж ніг <b>{enemy_goalkeeper}</b>! Це приниження! 🏠⚽",
        required_positions=["scorer", "enemy_goalkeeper"]
    ),
    # 23. Assistant (GK) -> Scorer (Mid) (Швидка контратака)
    SceneTemplate(
        text="<b>{assistant}</b> швидко вводить м'яч рукою на половину поля суперника! <b>{scorer}</b> тікає в контратаку і реалізує чисельну більшість! Бліцкриг! ⚡🏁",
        required_positions=["assistant", "scorer"]
    ),
    # 24. Scorer (Attacker) - Удар через себе (Скорпіон/Ножиці)
    SceneTemplate(
        text="Фантастика! <b>{scorer}</b> ловить м'яч у повітрі і ударом 'ножицями' відправляє його у сітку! Претендент на гол року! ✂️🏆",
        required_positions=["scorer"]
    ),
    # 25. Assistant (Mid) -> Scorer (Def) (Кутовий)
    SceneTemplate(
        text="<b>{assistant}</b> подає корнер на ближню стійку, <b>{scorer}</b> випереджає всіх і підрізає м'яч у дальній кут! Домашня заготовка! 📚⚽",
        required_positions=["assistant", "scorer"]
    ),
    # 26. Scorer (Midfielder) - Дриблінг
    SceneTemplate(
        text="<b>{scorer}</b> увімкнув режим Мессі! Обійшов трьох захисників у слаломі і закотив м'яч у кут! Це просто космос! 👽🇦🇷",
        required_positions=["scorer"]
    ),
    # 27. Assistant (Att) -> Scorer (Att) (Пас на порожні)
    SceneTemplate(
        text="Воротар вийшов на перехоплення, але <b>{assistant}</b> встиг віддати пас вбік. <b>{scorer}</b> забиває вже у порожні ворота! Легкі гроші! 💸🥅",
        required_positions=["assistant", "scorer"]
    ),
    # 28. Scorer (Attacker) vs Enemy Defender (Пресинг)
    SceneTemplate(
        text="<b>{scorer}</b> накриває <b>{enemy_defender}</b> пресингом біля власного штрафного, відбирає м'яч і розстрілює ворота! Працьовитість винагороджена! 🛠️⚽",
        required_positions=["scorer", "enemy_defender"]
    ),
    # 29. Scorer (Midfielder) - Рикошет
    SceneTemplate(
        text="<b>{scorer}</b> наважився на удар з-за меж штрафного. М'яч зачіпає захисника і по дузі перелітає дезорієнтованого воротаря! Курйозний гол! 🎱🍀",
        required_positions=["scorer"]
    ),
    # 30. Assistant (Mid) -> Scorer (Att) (Черпачок)
    SceneTemplate(
        text="Геніальний пас 'черпачком' від <b>{assistant}</b> за спини захисникам! <b>{scorer}</b> приймає і другим дотиком забиває! Естетика футболу! 🎨⚽",
        required_positions=["assistant", "scorer"]
    ),
# 31. Assistant (GK) -> Scorer (Att) (Винос від воріт)
    SceneTemplate(
        text="<b>{assistant}</b> вибиває м'яч від воріт так сильно, що той перелітає всіх захисників! <b>{scorer}</b> вибігає сам на сам і не хибить! Асист голкіпера! 🧤🎯",
        required_positions=["assistant", "scorer"]
    ),
    # 32. Scorer (Midfielder) - "Сухий лист" (Кутовий)
    SceneTemplate(
        text="Неймовірно! <b>{scorer}</b> закручує м'яч з кутового прямо у ворота! 'Сухий лист' у виконанні майстра! Воротар у шоці! 🍂🌪️",
        required_positions=["scorer"]
    ),
    # 33. Assistant (Att) -> Scorer (Mid) (П'ятою)
    SceneTemplate(
        text="Магія у штрафному! <b>{assistant}</b> не дивлячись віддає пас п'ятою назад, і <b>{scorer}</b> з ходу вганяє м'яч у кут! Jogo Bonito! 🇧🇷✨",
        required_positions=["assistant", "scorer"]
    ),
    # 34. Scorer (Defender) - Гармата
    SceneTemplate(
        text="М'яч відскакує до центрального кола, де його підхоплює <b>{scorer}</b>. Захисник вирішує пробити... ГОООЛ! М'яч ледь не порвав сітку! 🚀💣",
        required_positions=["scorer"]
    ),
    # 35. Assistant (Mid) -> Scorer (Att) (Навіс робоною)
    SceneTemplate(
        text="<b>{assistant}</b> виконує навіс рабоною! Це фантастика! <b>{scorer}</b> замикає цю красу ударом головою! Гол для хіт-парадів! 🎥🌟",
        required_positions=["assistant", "scorer"]
    ),
    # 36. Scorer (Attacker) vs Enemy Defender (Знущання)
    SceneTemplate(
        text="<b>{scorer}</b> прокидає м'яч поміж ніг <b>{enemy_defender}</b>, виходить на ударну позицію і точно б'є у дальній кут! Оборона знищена! 🥜⚽",
        required_positions=["scorer", "enemy_defender"]
    ),
    # 37. Assistant (Def) -> Scorer (Att) (Контратака)
    SceneTemplate(
        text="<b>{assistant}</b> перехоплює м'яч у своєму штрафному і миттєво кидає у прорив <b>{scorer}</b>. Спринт на 50 метрів завершується голом! 🏎️💨",
        required_positions=["assistant", "scorer"]
    ),
    # 38. Scorer (Midfielder) - Штрафний під стінкою
    SceneTemplate(
        text="Усі чекали удару верхом, стінка підстрибнула, а <b>{scorer}</b> хитро покотив м'яч низом! Воротар безсилий! Геній! 🧠💡",
        required_positions=["scorer"]
    ),
    # 39. Assistant (Mid) -> Scorer (Att) (Стіночка)
    SceneTemplate(
        text="<b>{scorer}</b> і <b>{assistant}</b> проходять захист, граючи в 'стіночку', наче на тренуванні. Завершальний удар у порожній кут! Тікі-така! 🧩🤝",
        required_positions=["assistant", "scorer"]
    ),
    # 40. Scorer (Attacker) - Рибка
    SceneTemplate(
        text="М'яч летів низько над газоном, і <b>{scorer}</b> кидається 'рибкою' вперед, щоб замкнути передачу головою! Красивий гол у падінні! 🐟🌊",
        required_positions=["scorer"]
    ),
    # 41. Scorer vs Enemy Goalkeeper (Помилка воротаря)
    SceneTemplate(
        text="Жахливий ляп <b>{enemy_goalkeeper}</b>! Він випустив м'яч з рук, і <b>{scorer}</b> тут як тут, добиває його у сітку! Подарунок долі! 🎁😱",
        required_positions=["scorer", "enemy_goalkeeper"]
    ),
    # 42. Assistant (Mid) -> Scorer (Def) (Підключення)
    SceneTemplate(
        text="Несподівано захисник <b>{scorer}</b> опинився на вістрі атаки! <b>{assistant}</b> помітив це і віддав ідеальний пас. Гол захисника! 🛡️➡️⚔️",
        required_positions=["assistant", "scorer"]
    ),
    # 43. Scorer (Attacker) - З розвороту
    SceneTemplate(
        text="<b>{scorer}</b> приймає м'яч спиною до воріт, різко розвертається на 180 градусів і б'є з лету! Невідпорно! Справжній форвард! 🌪️⚽",
        required_positions=["scorer"]
    ),
    # 44. Assistant (Att) -> Scorer (Att) (Альтруїзм)
    SceneTemplate(
        text="Вихід 2 в 0! <b>{assistant}</b> міг забивати сам, але покотив на <b>{scorer}</b>, щоб той забив у порожні ворота. Командний дух! 🫂❤️",
        required_positions=["assistant", "scorer"]
    ),
    # 45. Scorer (Midfielder) - З центра поля
    SceneTemplate(
        text="<b>{scorer}</b> помітив, що воротар вийшов далеко з воріт, і наважився на удар з центру поля! М'яч залітає 'за комірець'! Легендарно! 🏟️🤯",
        required_positions=["scorer"]
    ),
    # --- Roles: ["assistant", "scorer"] ---
    SceneTemplate(
        text="<b>{assistant}</b> і <b>{scorer}</b> розіграли блискучу стіночку, після якої <b>{scorer}</b> спокійно відправив м'яч у сітку! Ідеальна взаємодія! 🤝⚽️",
        required_positions=["assistant", "scorer"]
    ),
    SceneTemplate(
        text="<b>{assistant}</b> протягнув м'яч флангом і віддав ідеальний пас на <b>{scorer}</b>, якому залишалося лише підставити ногу! ГОЛ! 🔥🎯",
        required_positions=["assistant", "scorer"]
    ),
    SceneTemplate(
        text="Яка комбінація! <b>{assistant}</b> віддає пас п'ятою, а <b>{scorer}</b> в дотик відправляє м'яч у ворота! Це було красиво! 🤩",
        required_positions=["assistant", "scorer"]
    ),

    # --- Roles: ["assistant", "scorer", "enemy_goalkeeper"] ---
    SceneTemplate(
        text="<b>{assistant}</b> перехоплює м'яч, миттєвий пас на <b>{scorer}</b> — і той потужним ударом прошиває <b>{enemy_team_character}</b>! ⚡️🥅",
        required_positions=["assistant", "scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{assistant}</b> навішує у штрафний майданчик, <b>{scorer}</b> виграє верхову боротьбу і головою б'є повз <b>{enemy_team_character}</b>! 🧠",
        required_positions=["assistant", "scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{assistant}</b> виводить <b>{scorer}</b> віч-на-віч, і той холоднокровно переграє <b>{enemy_team_character}</b>! Класика! ❄️",
        required_positions=["assistant", "scorer", "enemy_team_character"]
    ),

    # --- Roles: ["scorer", "enemy_defender"] ---
    SceneTemplate(
        text="<b>{scorer}</b> накрутив <b>{enemy_team_character}</b> фінтами і невідпорно пробив у дальній кут! Майстерний гол! 🎩✨",
        required_positions=["scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> ставить корпус, відтісняє <b>{enemy_team_character}</b> і з розвороту б'є точно в ціль! Силовий гол! 💪",
        required_positions=["scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{enemy_team_character}</b> намагається перехопити м'яч, але <b>{scorer}</b> виявляється спритнішим і з-під захисника відправляє м'яч у сітку! ⚡️",
        required_positions=["scorer", "enemy_team_character"]
    ),

    # --- Roles: ["assistant", "scorer", "enemy_team_character"] ---
    SceneTemplate(
        text="<b>{assistant}</b> віддає пас у розріз, <b>{scorer}</b> випереджає <b>{enemy_team_character}</b> і холоднокровно реалізує свій момент! 🚀",
        required_positions=["assistant", "scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{assistant}</b> прокидає м'яч поміж ніг <b>{enemy_team_character}</b>, а <b>{scorer}</b> вже чекає на передачу і забиває! Ефектно! 🤯",
        required_positions=["assistant", "scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> отримує пас від <b>{assistant}</b>, і навіть відчайдушний підкат від <b>{enemy_team_character}</b> не рятує команду від голу! 💥",
        required_positions=["assistant", "scorer", "enemy_team_character"]
    ),

    # --- Roles: ["scorer"] ---
    SceneTemplate(
        text="<b>{scorer}</b> наважується на удар з дальньої дистанції — і м'яч залітає точнісінько в дев'ятку! Неймовірний постріл! 💣💥",
        required_positions=["scorer"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> підхоплює м'яч після рикошету, миттєво оцінює ситуацію і влучним ударом забиває гол! Гольове чуття! 🎯",
        required_positions=["scorer"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> бере ініціативу на себе, йде в сольний прохід і завершує його ідеальним ударом! Все зробив сам! 🦁",
        required_positions=["scorer"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> перехоплює м'яч у центрі поля, розганяє атаку і завдає потужного удару! Це гол! 🚀",
        required_positions=["scorer"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> опиняється в потрібному місці та в потрібний час — точний удар і м'яч у воротах! Інстинкт бомбардира! 🦅",
        required_positions=["scorer"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> зміщується з флангу в центр і пробиває з-за меж штрафного! Гол-красень! 🌟",
        required_positions=["scorer"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> виграє боротьбу у повітрі та забиває головою після подачі! Повітряний ас! 🛫",
        required_positions=["scorer"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> обманним рухом залишає суперника позаду та пробиває в дальній кут! Холоднокровно! ❄️",
        required_positions=["scorer"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> миттєво реагує на відскок і з близької відстані відправляє м'яч у сітку! Легкий, але важливий гол! 🎯",
        required_positions=["scorer"]
    ),

    # --- Roles: ["scorer", "enemy_team_character"] ---
    SceneTemplate(
        text="<b>{scorer}</b> підхоплює м'яч, на швидкості обходить захисника і б'є повз <b>{enemy_team_character}</b>! Сольний прохід, що завершився голом! 💪",
        required_positions=["scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> б'є з гострого кута, <b>{enemy_team_character}</b> не очікував такого рішення! М'яч у сітці! Хитрий гол! 😏",
        required_positions=["scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> потужно пробиває по центру воріт, <b>{enemy_team_character}</b> не встигає зреагувати на силу удару! Прошив воротаря! 🚀",
        required_positions=["scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> обігрує <b>{enemy_team_character}</b> на замаху та пробиває в дальній кут! Красиве завершення атаки! 🎯",
        required_positions=["scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> виграє боротьбу у <b>{enemy_team_character}</b> та відправляє м'яч під поперечину! Жорстка дуель завершилась голом! 💥",
        required_positions=["scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> пробиває з-за меж штрафного, м'яч пролітає повз <b>{enemy_team_character}</b> і влітає у ворота! Неймовірна дальня спроба! 🚀",
        required_positions=["scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> перехоплює пас від <b>{enemy_team_character}</b>, виходить сам на сам і холоднокровно забиває! Помилка суперника коштувала дорого! 😱",
        required_positions=["scorer", "enemy_team_character"]
    ),
    SceneTemplate(
        text="<b>{scorer}</b> пробиває після рикошету від <b>{enemy_team_character}</b> — м'яч зрикошетив у ворота! Доля посміхнулась атакуючому! 🍀",
        required_positions=["scorer", "enemy_team_character"]
    ),
]


class TemplatesMatch(Enum):
    # Текст адаптирован под более быстрый и напряженный формат блиц-турнира 1v1
    START_MATCH = """
⚔️ Розпочинаємо напружений бліц-матч між командами <b>{name_first_team}</b> та <b>{name_second_team}</b>!

🏟️ Арена: Бліц-турнір

🔹 Обидві команди готові:
- <b>{name_first_team}</b>: загальна сила <b>{power_first_team:.2f}</b> 
- <b>{name_second_team}</b>: загальна сила <b>{power_second_team:.2f}</b>

🔥 Хто з вас вийде переможцем та пройде до <b>{stages_of_blitz}</b>? Поїхали! 🏆
"""
    START_MATCH_FINAL = """
🌟 <b>ФІНАЛЬНИЙ МАТЧ БЛІЦ-ТУРНІРУ!</b> 🌟

⚔️ Поєдинок між легендарними командами
<b>{name_first_team}</b> та <b>{name_second_team}</b> розпочинається прямо зараз! 🏆

🏟️ Арена: Бліц-турніру

🔹 Обидві Команди готові до вирішального бою:
- <b>{name_first_team}</b>: загальна сила <b>{power_first_team:.2f}</b>
- <b>{name_second_team}</b>: загальна сила <b>{power_second_team:.2f}</b>

🔥 Хто з вас увійде в історію цього дня і забере середній лутбокс?

🕰️ Час тиснути на газ – гра починається!
    """
    TEMPLATE_PARTICIPANTS_MATCH = """
📋 <b>Склади команд на ваш бліц-матч:</b>

🔸 <b>{name_first_team}</b>
- Гравець: 
{players_first_team}

🔸 <b>{name_second_team}</b>
- Гравець: 
{players_second_team}

🏆 Гра обіцяє бути швидкою та видовищною!
Починаємо! 🔥
    """

    TEMPLATE_PARTICIPANTS_MATCH_FINAL = """
🎯 <b>СКЛАДИ КОМАНД ФІНАЛЬНИЙ БЛІЦ-МАТЧ:</b>

⚔️ У останньому бліц-матчі зустрічаються справжні титани:
<b>{name_first_team}</b>
- Гравець:
{players_first_team}

<b>{name_second_team}</b>
- Гравець:
{players_second_team}

🏟️ Арена: «Бліц-турніру»

Нехай переможе найсильніший! 💥
    """

    TEMPLATE_PARTICIPANT = """
👤 {character_name} | ⚔️ Сила команди: <b>{power_user:.2f}</b>"""

    TEMPLATE_COMING_GOAL = """  
⚽️ <b>Вирішальний момент епізоду вже близько!</b> ⚽️  

🔥 <b>Поточні шанси на гол:</b>  
- ⚽️ Команда <b>{name_first_team}</b>: <b>{chance_first_team:.2f}%</b>  
- ⚽️ Команда <b>{name_second_team}</b>: <b>{chance_second_team:.2f}%</b>  

💥 <b>Це момент істини!</b>
Ваша енергія може стати тим самим поштовхом, що змінить усе — підтримайте свою команду! 🚀

✨ <b>Досягніть {min_donate_energy_bonus} енергії</b> в цьому епізоді — і отримаєте буст <b>+{koef_donate_energy}% до суми донату</b>!
Цей бонус посилить удар і збільшить шанси забити гол! ⚡️

⏳ У вас лише <b>30 секунд</b>, щоб вплинути на результат!
<b>Надішліть енергію</b> — і допоможіть своїй команді перемогти! 🥅🏆
"""
    TEMPLATE_COMING_GOAL_DIZAIN = """  
    ⚽️ <b>Вирішальний момент епізоду вже близько!</b> ⚽️
    🔥 <b>Поточні шанси на гол:</b>  
    - ⚽️ Команда <b>{name_first_team}</b>: <b>{chance_first_team:.2f}%</b>  
    - ⚽️ Команда <b>{name_second_team}</b>: <b>{chance_second_team:.2f}%</b>    
    💥 <b>Це момент істини!</b>
    Ваша енергія може стати тим самим поштовхом, що змінить усе — підтримайте свою команду! 🚀
    ⏳ У вас лише <b>30 секунд</b>, щоб вплинути на результат!
    <b>Надішліть енергію</b> — і допоможіть своїй команді перемогти! 🥅🏆
    """

    TEMPLATE_END = """
🎉 Бліц-матч між командами <b>{name_first_team}</b> та <b>{name_second_team}</b> завершено! 

📊 Кінцевий рахунок: <b>{goals_first_team}</b> - <b>{goals_second_team}</b>.

{match_information}

🏆 Дякуємо командам за видовищну гру та справжній дух суперництва!
Переможець переходить до <b>{stages_of_blitz}</b> 🔥
    """
    TEMPLATE_END_CONSIDER_POWER = """
🎉 Бліц-матч між командами <b>{name_first_team}</b> та <b>{name_second_team}</b> завершено! 

📊 Кінцевий рахунок: <b>{goals_first_team}</b> - <b>{goals_second_team}</b>.

{match_information}

🏆 Дякуємо командам за видовищну гру та справжній дух суперництва!
Переможець переходить до <b>{stages_of_blitz}</b> 🔥
        """
    TEMPLATE_END_FINAL = """
🎉 <b>ФІНАЛЬНИЙ БЛІЦ-МАТЧ ЗАВЕРШЕНО!</b> 🎉

📊 Фінальний рахунок між <b>{name_first_team}</b> та <b>{name_second_team}</b>: <b>{goals_first_team}</b> - <b>{goals_second_team}</b>.

{match_information}

🏆 Легендарна битва завершена!
Переможець забирає середній лутбокс і стає володарем блиц-турніру! 🔥
    """

    # Фінальне завершення з врахуванням сили команд
    TEMPLATE_END_CONSIDER_POWER_FINAL = """
🎉 <b>ФІНАЛЬНИЙ БЛІЦ-МАТЧ ЗАВЕРШЕНО!</b> 🎉

📊 Фінальний рахунок між <b>{name_first_team}</b> (сила <b>{power_first_team:.2f}</b>) та <b>{name_second_team}</b> (сила <b>{power_second_team:.2f}</b>):
<b>{goals_first_team}</b> - <b>{goals_second_team}</b>.

{match_information}

🏆 Незабутній фінал, де сила зіграла ключову роль!
Переможець бере середній лутбокс і стає героєм блиц-турніру! 🔥
    """

    DRAW_TEMPLATE = """
Матч завершився внічию! Обидві команди билися гідно! 🤝
"""

    WIN_LOSE_TEMPLATE = """
🎉 Переможець бліц-матча: <b>{winner_team_name}</b>! 
🙄 Програвша команда: <b>{loser_team_name}</b>.
"""
    WIN_LOSE_TEMPLATE_FINAL = """
🏆 Переможець: <b>{winner_team_name}</b>! 
🙄 Програвша команда: <b>{loser_team_name}</b>.
    """

    TEMPLATE_SCORE = """
⚽️ <b>{scoring_team}</b> забиває гол!

🏟 Матч: <b>{name_first_team}</b> — <b>{name_second_team}</b>
📊 Рахунок: <b>{goals_first_team}</b> - <b>{goals_second_team}</b>
"""


class GetterTemplatesMatch:

    def __init__(self, match_data: BlitzMatchData) -> None:
        self.match_data = match_data

    def format_message(
            self,
            template: TemplatesMatch,
            extra_context: dict = {}
    ) -> str:
        context = {
            'name_first_team': self.match_data.first_team.team_name,
            'name_second_team': self.match_data.second_team.team_name,
            'goals_first_team': self.match_data.first_team.goals,
            'goals_second_team': self.match_data.second_team.goals,
            'power_first_team': self.match_data.first_team.team_power,
            'power_second_team': self.match_data.second_team.team_power,
            'members_first_team': len(self.match_data.first_team.users_in_match),
            'members_second_team': len(self.match_data.second_team.users_in_match)
        }
        if extra_context:
            context.update(extra_context)
        return template.value.format(**context)
