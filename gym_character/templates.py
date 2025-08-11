from .types import ResultTraining

class TrainingTextTemplate:
    SUCCESS_MESSAGE = "<b>Вітаю</b>! Силу покращено на {points} поінта!"
    FAILURE_MESSAGE = "<b>На жаль</b>, ваш персонаж не зміг покращити силу. Спробуйте ще раз!"

    @staticmethod
    def get_training_text(result: ResultTraining, points: int = 0) -> str:
        if result == ResultTraining.SUCCESS:
            return TrainingTextTemplate.SUCCESS_MESSAGE.format(points=points)
        return TrainingTextTemplate.FAILURE_MESSAGE.format()

