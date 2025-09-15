import Config from "../../config.js";


const PromoCard = () => {
    return (
        <div className="w-[90%] max-w-md mx-auto rounded-2xl p-4 bg-gray-800/80 backdrop-blur-md flex flex-col items-center gap-4 shadow-lg">
            {/* Заголовок */}
            <h2 className="text-white font-bold text-xl text-center">
                МАТЧ
            </h2>

            {/* Картинка футбольных ворот */}
            <img
                src={Config.IMAGES.goal1}
                alt="football goal"
                className="w-full rounded-lg"
            />

            {/* Текстовый блок */}
            <div className="text-center text-white text-sm flex flex-col gap-2">
                <p>🔥 Вирішальний момент епізоду вже близько! 🔥</p>
                <p>
                    Ваша енергія може стати тим самим поштовхом, що змінить усе –
                    підтримайте свою команду!
                </p>
                <p>
                    ⭐ Досагніть 200 енергії у цьому епізоді – і отримаєте буст
                    +300% до суми донату!
                </p>
            </div>

            {/* Блок кнопок */}
            <div className="flex justify-center gap-4 w-full">
                <button className="flex-1">
                    <img
                        src={Config.IMAGES.gold_button}
                        alt="Підсилити"
                        className="w-full"
                    />
                </button>
                <button className="flex-1">
                    <img
                        src={Config.IMAGES.energy_button}
                        alt="Купити"
                        className="w-full"
                    />
                </button>
            </div>
        </div>
    );
};

export default PromoCard;