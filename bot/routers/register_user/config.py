
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
<b>ЛАСКАВО ПРОСИМО ДО FOOTBALL BLITZ! ⚽🔥</b>

📍 <b>Локація: Центральний стадіон академії</b>

<i>(Ти виходиш з автобуса, тримаючи сумку з екіпіруванням. Перед тобою – величезні ворота з емблемою майбутнього клубу. Сьогодні починається твій шлях у світ великого футболу!)</i>

🏟 Тут ти створиш власну команду, отримаєш першого гравця та почнеш підкорювати турнірні вершини.  
💪 Тренуй футболістів, бери участь у блиц-турнірах та доведи, що саме твій клуб стане легендою Football Blitz!  
""",

    STATUS_USER_REGISTER.CREATE_TEAM : """
🔹 <b>Тренер</b>:
<i>— О, ти саме той, кого я чекав!</i>  

<b>У нас тут справжній</b> <b>онлайн турнір</b>, де сотні команд щодня виходять на поле. Матчі, стратегія, перемоги — усе по-справжньому. ⚽🔥  

Але перш ніж вийти на гру —  
ти маєш зібрати свою команду.  

<b><u>🔽 НАТИСКАЙ КНОПКУ “СТВОРИТИ КОМАНДУ” 🔽</u></b>
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
    🔹 <b>Тренер:</b> Вітаю, капітане! 🎉  
    Ти створив свою команду і вже маєш першого гравця у складі. Це лише початок великої футбольної історії! ⚽🔥  

    Що далі?  
    ✅ <b>🧍‍♂️ Моя команда</b> – керуй складом, переглядай свого гравця та підсилюй команду.  
    ✅ <b>🏆 Турніри</b> – реєструйся у бліц турнірах та веди команду до перемоги.  
    ✅ <b>🏋️‍♂️ Тренування</b> – прокачуй футболістів, щоб вони ставали сильнішими.  
    ✅ <b>🧠 Учбовий центр</b> – дізнавайся нові тактики та секрети гри.  
    ✅ <b>⚡ Енергія / Баланс</b> – стеж за ресурсами, щоб завжди бути готовим до матчу.  
    ✅ <b>📊 Рейтинги</b> – змагайся з іншими командами та піднімайся на вершину!  

    <i>Твоя команда готова. Тепер настав час показати, на що ви здатні!</i> 🏟🔥
    """
    ,

    STATUS_USER_REGISTER.FORGOT_TRAINING : """
🔹 Тренер:
— Залишився лише один крок! Пройди створення команди до кінця та отримай +200 енергії у подарунок.

Твоя команда вже чекає на тебе в грі. Почни зараз і вийди на поле сильнішим!
"""
}


