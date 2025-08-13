from .types import ResultTraining

class TrainingTextTemplate:
    SUCCESS_MESSAGE = "🎉 <b>Вітаємо!</b> Сила гравця зросла на <b>{points}</b> поінт(и)! 💪"
    FAILURE_MESSAGE = "😔 <b>Не вдалося...</b> Гравцю не вистачило удачі для підвищення сили. Спробуйте ще раз! 🔄"

    @staticmethod
    def get_training_text(result: ResultTraining, points: float = 0) -> str:
        if result == ResultTraining.SUCCESS:
            return TrainingTextTemplate.SUCCESS_MESSAGE.format(points=round(points, 3))
        return TrainingTextTemplate.FAILURE_MESSAGE.format()

