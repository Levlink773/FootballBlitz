// src/config/Config.js
import img1 from "./assets/main_background.png";
import img2 from "./assets/cup_icon.png";
import img3 from "./assets/dumbbell_icon.png";
import img4 from "./assets/stadion_icon.png";
import img5 from "./assets/character_icon.png";
import img6 from "./assets/rating_icon.png";
import img7 from "./assets/home_icon.png";
import img8 from "./assets/up_icon.png";
import img9 from "./assets/face_character.png";
import img10 from "./assets/arm.png";
import img11 from "./assets/target.png";
import img12 from "./assets/coin.png";
import img13 from "./assets/country.png";
import img14 from "./assets/vip_emblem_large.png";
import img15 from "./assets/vip_status_active.png";
import img16 from "./assets/football_goal.png";
import img17 from "./assets/vip_emblem_medium.png";
import img18 from "./assets/cup.png";
import img19 from "./assets/energy.png";
import img20 from "./assets/daily_task_main.png";
import img23 from "./assets/vip_emblem_small.png";
import img24 from "./assets/shop_icon.png";
import img25 from "./assets/bell_icon.png";
import img26 from "./assets/avatar.png";
import img27 from "./assets/bannerImage.png";
import img28 from "./assets/VIPImage.png";
import img30 from "./assets/training_background.png";
import img38 from "./assets/train_active.png";
import img39 from "./assets/train_line.png";
import img40 from "./assets/gold_line.png";
import img42 from "./assets/train_line1.png";
import img43 from "./assets/gold_small_line.png";
import blitz_background from "./assets/blitz_background.png";
import rating_background from "./assets/img.png";
import education_background from "./assets/img_1.png";
import shop_background from "./assets/img_2.png";
import transfer_background from "./assets/img_3.png";
import match_background from "./assets/img_4.png";
import img52 from "./assets/img52.png";
import img50 from "./assets/img50.png";
import crown from "./assets/img_5.png";


class Config {

    // пути к картинкам
    static IMAGES = {
        match_background: match_background,
        shop_background: shop_background,
        transfer_background: transfer_background,
        education_background: education_background,
        rating_background: rating_background,
        blitz_background: blitz_background,
        background: img1,
        cup_icon: img2,
        dumbbell_icon: img3,
        stadion_icon: img4,
        character_icon: img5,
        rating_icon: img6,
        home_icon: img7,
        up_icon: img8,
        face_character: img9,
        arm: img10,
        target: img11,
        coin: img12,
        country: img13,
        vip_emblem_large: img14,
        vip_status_active: img15,
        football_goal: img16,
        vip_emblem_medium: img17,
        cup: img18,
        energy: img19,
        daily_task_main: img20,
        vip_emblem_small: img23,
        shop_icon: img24,
        bell_icon: img25,
        avatar: img26,
        bannerImage: img27,
        VIPImage: img28,
        training_background: img30,
        train_line: img39,
        gold_line: img40,
        train_line1: img42,
        gold_small_line: img43,
        train_active: img38,
        trophy: img52,
        blitz_line: img50,
        crown: crown,
    };

    // какие-то игровые настройки
    static GAME = {
        maxPlayers: 11,
        blitzDuration: 30, // в минутах
    };
}

export default Config;
