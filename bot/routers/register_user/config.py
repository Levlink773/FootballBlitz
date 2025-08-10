
from database.models.user_bot import STATUS_USER_REGISTER
from .constans import (
    START_REGISTER_PHOTO,
    CREATER_CHARACTER_PHOTO,
    SEND_NAME_CHARACTER_PHOTO,
    SELECT_POSITION_PHOTO,
    TERRITORY_ACADEMY_PHOTO,
    JOIN_TO_CLUB_PHOTO,
    FIRST_TRAINING_PHOTO,
    FORGOT_TRAINING_PHOTO,
    SELECT_GENDER_PHOTO,
)

PHOTO_STAGE_REGISTER_USER = {
    STATUS_USER_REGISTER.START_REGISTER : START_REGISTER_PHOTO, 
    STATUS_USER_REGISTER.CREATE_TEAM : CREATER_CHARACTER_PHOTO,
    STATUS_USER_REGISTER.SEND_NAME_TEAM : SEND_NAME_CHARACTER_PHOTO,
    STATUS_USER_REGISTER.GET_FIRST_CHARACTER : TERRITORY_ACADEMY_PHOTO,
    STATUS_USER_REGISTER.END_REGISTER : JOIN_TO_CLUB_PHOTO,
    STATUS_USER_REGISTER.FORGOT_TRAINING : FORGOT_TRAINING_PHOTO
}
from config import LINK_TO_CHAT


TEXT_STAGE_REGISTER_USER = {
    
    STATUS_USER_REGISTER.START_REGISTER : """
<b>WELCOME TO THE GAME</b>
    
📍 <b>Локація: Ворота футбольної академії</b>

<i>(Ти виходиш з автобуса, тримаючи сумку з екіпіруванням. Перед тобою – величезні ворота з емблемою академії.)</i>    
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
— Залишився лише один крок! Пройди створення гравця до кінця — і отримай 300 сили в подарунок, а також гроші і досвід для перших покупок екіпірування: футболки, бутсів і шортів. ⚡️👕👟🩳🔥

Твоя команда вже чекає на тебе в грі. Почни зараз і вийди на поле сильнішим!
"""
}


TEXT_CHARACTER = """
<b>⚽ Персонаж:</b> {character_name}

<i>Це ваш стартовий персонаж з початковими статами для обраної позиції.</i>

<b>👤 Стать:</b> {gender}
<b>🎯 Техніка:</b> {effective_technique:.1f}
<b>🥋 Удари:</b> {effective_kicks:.1f}
<b>🛡️ Відбір м’яча:</b> {effective_ball_selection:.1f}
<b>⚡ Швидкість:</b> {effective_speed:.1f}
<b>🏃 Витривалість:</b> {effective_endurance:.1f}

<b>💪 Сумарна сила:</b> {full_power:.1f}
"""


