import io

from bot.utils.xls.base_xls import BaseXLS
from database.models.character import Character
from database.models.user_bot import UserBot
from services.user_service import UserService

class GenerateNewMemberXLS(BaseXLS):
    HEADERS = [
        "ID користувача",
        "Нікнейм (@username)",
        "Ім'я команди",
        "Дата регістрації",
        "Персонажі",
        "Кількість грошей",
        "Енергія",
        "Останнє тренування",
        "VIP статус (до коли)",
        
    ]


    def __init__(self, members: list[UserBot]):
        super().__init__(members)
        self.current_sheet.title = "Нові гравці"
        self.header_setings()
        
    async def generate_xls(self) -> None:
        for member in self.members:
            vip_status = (
                f"Активний до {member.vip_pass_expiration_date.strftime('%Y-%m-%d %H:%M:%S')}"
                if member.vip_pass_is_active else "Неактивний"
            )
            try:
                last_traning = member.main_character.reminder.time_start_training.strftime('%Y-%m-%d %H:%M:%S') if member.reminder.time_start_training else "Немає даних"
            except:
                last_traning = "Немає даних"
            chars = f"{member.team_name_user} (" + "| ".join(
                f"{char.name} ⚡{int(char.power)} , 🎯{char.talent} , 🎂{char.age}"
                for char in member.characters
            ) + ")"
            self.current_sheet.append([
                member.user_id,
                f"@{member.user_name}" if member and member.user_name else "Невідомо",
                member.team_name,
                member.user_time_register,
                chars,
                member.money,
                member.energy,
                last_traning,
                vip_status,
            ])
            if member and member.user_name:
                telegram_link = f"https://t.me/{member.user_name}"
                row_index = self.current_sheet.max_row
                col_index = 5  # Колонка с ссылкой (Telegram)
                cell = self.current_sheet.cell(row=row_index, column=col_index)
                cell.hyperlink = telegram_link
                cell.style = "Hyperlink"

            
    def save_to_bytes(self) -> bytes:
        self.set_base_settings()
        with io.BytesIO() as output:
            self.workbook.save(output)
            output.seek(0)
            return output.read()