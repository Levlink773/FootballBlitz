
from database.models.user_bot import STATUS_USER_REGISTER
from .constans import (
    START_REGISTER_PHOTO,
    CREATER_CHARACTER_PHOTO,
    SEND_NAME_CHARACTER_PHOTO,
    TERRITORY_ACADEMY_PHOTO,
    JOIN_TO_CLUB_PHOTO,
    FORGOT_TRAINING_PHOTO,
)

PHOTO_STAGE_REGISTER_USER = {
    STATUS_USER_REGISTER.START_REGISTER : START_REGISTER_PHOTO, 
    STATUS_USER_REGISTER.CREATE_TEAM : CREATER_CHARACTER_PHOTO,
    STATUS_USER_REGISTER.SEND_NAME_TEAM : SEND_NAME_CHARACTER_PHOTO,
    STATUS_USER_REGISTER.GET_FIRST_CHARACTER : TERRITORY_ACADEMY_PHOTO,
    STATUS_USER_REGISTER.END_REGISTER : JOIN_TO_CLUB_PHOTO,
    STATUS_USER_REGISTER.FORGOT_TRAINING : FORGOT_TRAINING_PHOTO
}

TEXT_STAGE_REGISTER_USER = {
    
    STATUS_USER_REGISTER.START_REGISTER : """
🏆 Вітаємо у Football Bliz!

Твоя футбольна пригода починається тут! ⚽
⬅️⬅️ Тисни синю кнопку <b>Грати</b> зліва! ⬅️⬅️
Відкрий додаток і створюй свою команду та отримай свого першого гравця! 💪🔥
""",

    STATUS_USER_REGISTER.CREATE_TEAM : """
🔹 <b>Тренер:</b>
<i>— О, ти саме той, кого я чекав!</i>  

Тут відбувається справжній онлайн-чемпіонат: сотні команд щодня виходять на поле, борються у турнірах і прокачують своїх гравців. ⚽🔥  

Але перш ніж почати шлях до перемог —  
нам потрібно створити <b>твою команду</b>.

<b><u>🔽 Натискай “СТВОРИТИ КОМАНДУ” та почнемо 🔽</u></b>
""",

STATUS_USER_REGISTER.SEND_NAME_TEAM : """
🔹 <b>Тренер</b>: Як назвемо твою команду, капітане? 🏆
""",

    STATUS_USER_REGISTER.GET_FIRST_CHARACTER : """
🔹 <b>Тренер</b>: Ну що ж... Настав момент істини!  
Зараз ми дізнаємось, хто стане першим гравцем у твоїй команді.    

<i>Готовий дізнатися, хто приєднається до твоєї легендарної майбутньої команди?</i> 🔥

""",

    STATUS_USER_REGISTER.END_REGISTER: f"""
🔹 <b>Тренер:</b>  
Вітаю, капітане! 🎉  
Ти створив свою команду і вже маєш першого футболіста у складі. Це лише початок великої футбольної історії! ⚽🔥  

Що далі?  
✅ <b>🧍‍♂️ Моя команда</b> – переглядай гравця, його силу, вік, талант і вартість.  
✅ <b>🏆 Турніри</b> – реєструйся у бліц-турнірах та здобувай нагороди.  
✅ <b>🏋️‍♂️ Тренування</b> – прокачуй силу гравця, використовуючи енергію.  
✅ <b>🧠 Учбовий центр</b> – виконуй завдання та отримуй монети й енергію.  
✅ <b>⚡ Енергія / Баланс</b> – слідкуй за ресурсами, щоб завжди бути готовим до гри.  
✅ <b>📊 Рейтинги</b> – змагайся з іншими та піднімайся на вершину!  

<i>Твій шлях до футбольної слави почався. Покажи, на що здатен твій клуб!</i> 🏟🔥
    """
    ,

    STATUS_USER_REGISTER.FORGOT_TRAINING : """
🔹 Тренер:
— Залишився лише один крок, капітане!

Створи свою команду у веб-додатку та отримай +200 енергії у подарунок, щоб одразу почати тренування або участь у турнірі.

👉 Натисни синю кнопку <b>Грати</b> зліва ← і пройди швидку реєстрацію.

Не гальмуй — місце у залі слави чекає саме на тебе! ⚽🔥
"""
}


