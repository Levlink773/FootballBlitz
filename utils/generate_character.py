import random
from dataclasses import dataclass
from enum import Enum

from config import Gender, Country
from constants import POWER_MUL, TALENT_MUL, AGE_MUL, MIN_PRICE_FIRST_CHARACTER


@dataclass
class CharacterData:
    name: str
    talent: int
    age: int
    power: int
    gender: Gender
    country: Country

    @property
    def price(self):
        return (self.power * POWER_MUL) + (self.talent * TALENT_MUL) - (self.age * AGE_MUL)


# Веса стран по популярности футбола (чем больше число — тем чаще страна выпадает)
COUNTRY_WEIGHTS = {
    Country.BRAZIL: 10,
    Country.ARGENTINA: 9,
    Country.FRANCE: 8,
    Country.GERMANY: 8,
    Country.SPAIN: 8,
    Country.ENGLAND: 8,
    Country.PORTUGAL: 7,
    Country.ITALY: 7,
    Country.NETHERLANDS: 6,
    Country.BELGIUM: 6,
    Country.CROATIA: 6,
    Country.URUGUAY: 5,
    Country.MEXICO: 5,
    Country.UKRAINE: 5,
    Country.MOROCCO: 4,
    Country.SENEGAL: 4,
    Country.NIGERIA: 4,
    Country.JAPAN: 3,
    Country.SOUTH_KOREA: 3,
    Country.USA: 2,
    Country.CANADA: 1,
}

# Примеры имен
MALE_NAMES = {
    'Hassan', 'Tristram', 'Theophilus', 'Brodie', 'Pedro Pablo', 'Presley', 'Chester', 'Harper', 'John', 'Rico',
    'Clarence', 'Diego Manuel', 'Angelo', 'Paulo Henrique', 'Rodrigo Alves', 'Ewan', 'Robin', 'Quinn', 'Chris',
    'Campbell', 'Guillermo', 'Lance', 'Elias Gabriel', 'Ali', 'Gerardo', 'Hugo Rafael', 'Ricky', 'Thurman', 'Emile',
    'Gian', 'Roderick', 'Ricardo Miguel', 'Virgil', 'Gerard', 'Juan', 'Ricardo Jose', 'David Leon', 'Sherman', 'Lawson',
    'Milo', 'Shane', 'Isaiah', 'Sincere', 'Dash', 'Milford', 'Junior', 'Cassius', 'Garland', 'Eric', 'Johnny', 'Manuel',
    'Jesús', 'Joe', 'Adriano', 'Willis', 'Norbert', 'Rory', 'Wes', 'Roald', 'Simon', 'Borislav', 'Pedro', 'Myles',
    'Kellan', 'Jose Eduardo', 'Wyatt', 'Adam', 'Odin', 'Reginald', 'Igor Alexey', 'Seth', 'Tomas', 'Glenn', 'Nat',
    'Omer', 'Benicio', 'Tudor', 'Piers', 'Onofre', 'Trent', 'Jameson', 'Horacio', 'Stacy', 'Yan', 'Haroun', 'Brady',
    'Matteo Lorenzo', 'Romeo', 'Carlos Eduardo', 'Lysander', 'Bennett', 'Winston', 'Maurice', 'Grant', 'Fred', 'Ken',
    'Jimmie', 'Diego Rafael', 'Vladislav', 'Morris', 'Rodolfo', 'Sage', 'Arden', 'Finnian', 'Clyde', 'Kermit',
    'Orville', 'Shakir', 'Yacine', 'Tristán', 'Elian', 'Marcin', 'Yasir', 'Harrison', 'Will', 'Yaroslav', 'Amadeo',
    'Rod', 'Wade', 'Stepan', 'Knut', 'Storm', 'Stan', 'Gonzalo', 'Denis', 'Gregory', 'Nash', 'Yuri Petrov', 'Evan',
    'Garrett', 'Jim', 'Carlos', 'Sonny', 'Thom', 'Jules', 'Cael', 'Jamison', 'Alberto', 'Robb', 'Dino', 'Roy', 'Damian',
    'Andrey', 'Jackson', 'Vlad', 'Pierce', 'Vyacheslav', 'Mickey', 'Evgeny', 'Jason', 'Tonio', 'Jon', 'Brad', 'Hadrian',
    'Kevin Manuel', 'Maximiano', 'Milton', 'Tommaso', 'Andres', 'Quincy', 'Khalil', 'Kai', 'Rocco', 'Giovanni',
    'Kurtis', 'Vance', 'Steve', 'Yulian', 'Calvin', 'Bradley', 'Judah', 'Rigoberto', 'Edmund',
    'Burke', 'Dexter', 'Konstantin Petrov', 'Killian', 'Kaleb', 'Federico', 'Marcus', 'Theodore', 'Franco', 'Ari',
    'James', 'Leroy', 'Louis', 'Fergus', 'Sheldon', 'Sylvio', 'Nadir', 'Amos', 'Beau', 'Thorin', 'Weaver', 'Stanton',
    'Luiz Fernando', 'Felix', 'Sergio Ricardo', 'Jake', 'Trey', 'Dimitri', 'Wilbert', 'Kristopher', 'Everton', 'Trajan',
    'Bruno Miguel', 'Leandro', 'Cassian', 'John Paul', 'Alphonse', 'Hussein', 'Vinh', 'Sidney', 'Alvin', 'Ignacio',
    'Vitaliy', 'Luis Alberto', 'Francis', 'Fischer', 'Tye', 'Webb', 'Thomas', 'Roland', 'Daniel', 'Hugh', 'Philemon',
    'Niklas', 'Victor Manuel', 'Quinton', 'Shahan', 'Talbot', 'Shepard', 'Yves', 'Yorick', 'Tien', 'Myron', 'Hector',
    'King', 'Bruce', 'Andrej', 'Voislav', 'Roan', 'Henrique', 'Blaine', 'Hagen', 'Caden', 'Colton', 'Theo', 'Slavko',
    'Cruz', 'Yisrael', 'Erik', 'Marshall', 'Robert', 'Spencer', 'Kurt', 'Thierry', 'Manuel Alejandro', 'Ryan', 'Alexis',
    'Desmond', 'Alec', 'Wilton', 'Malik', 'Jamal', 'Yale', 'Marty', 'Norris', 'Landon', 'Vladlen', 'Peyton', 'Hubert',
    'Felipe', 'Raul Alejandro', 'Gustavo', 'Reno', 'Donald', 'Johan', 'Lars', 'Raymond', 'Vaughn', 'Carter', 'Jeremias',
    'Marcos', 'Emil', 'Newton', 'Ruben', 'Ximeno', 'Rickey', 'Barry', 'Aron', 'Justus', 'Michel', 'Otavio', 'Wilfred',
    'Paco', 'Fabian', 'Laurence', 'Felipe Jose', 'Alessio', 'Lowell', 'Mircea', 'Isaias', 'Helmut', 'Charlie',
    'Lorenzo', 'Juan Andres', 'Lamont', 'Vern', 'Thiago', 'Peregrine', 'Joshua', 'Irving', 'Giovanni Paolo', 'Oren',
    'Mauricio', 'Vincent', 'Fridrik', 'Farid', 'Truman', 'Ion', 'Lester', 'Minh', 'Toni', 'Taylor', 'Austin',
    'Oscar Ivan', 'Roberto', 'Roberto Carlos', 'Rolf', 'Joel', 'Dermot', 'Stanislav', 'Graham', 'Vinicius', 'Ty',
    'Miguel', 'Parker', 'Leonel', 'Kolby', 'Torben', 'Seamus', 'Joao Pedro', 'Sinclair',
    'Nikos', 'Cornelius', 'Yasin', 'Terrance', 'Asher', 'Diego', 'Aziz', 'Stone', 'Juan Pablo', 'Ulric',
    'Cristian Camilo', 'Omar', 'Daryl', 'Olivier', 'Julius', 'Simon Peter', 'Jagger', 'Volodymyr', 'Rodrigo', 'Bodhi',
    'Raffaele', 'Greg', 'Dustin', 'Shawn', 'Jay', 'Tracy', 'Ryland', 'Fletcher', 'Talon', 'Jacob', 'Curtis', 'Josue',
    'Rafael Eduardo', 'Nasir', 'Rupert', 'Remi', 'Leopold', 'Neal', 'Riley', 'Morgan', 'Shad', 'Lucas', 'Ludovic',
    'Camden', 'Jerald', 'Terrence', 'Alfred', 'Trevor', 'Esteban Jose', 'Xander', 'Chance', 'Harley', 'Julian',
    'Vincenzo', 'Elias', 'Carlos Manuel', 'Dawson', 'Millard', 'Emilio Andres', 'Gaston', 'Harold', 'Esteban', 'Mikel',
    'Colby', 'Woodrow', 'Carl', 'Saul', 'Alden', 'Uwe', 'Solomon David', 'Hernando', 'Damon', 'Liam', 'Leif',
    'Bruno Henrique', 'Kareem', 'Ramon', 'Melvin', 'Salvador Miguel', 'Mateo Santiago', 'Nehemiah', 'Conrad', 'Jeremy',
    'Nathan', 'Rex', 'Pedro Henrique', 'Tate', 'Josh', 'Newell', 'Nilson', 'Tyson', 'Ivanhoe', 'Christian', 'Norwood',
    'Yigit', 'Brody', 'Monte', 'Mikael', 'Vedad', 'Johannes', 'Drake', 'Don', 'Santiago', 'Galen', 'Darrell', 'Dave',
    'Rocky', 'Theobald', 'Howard', 'Phoenix', 'Valentino', 'Ismael', 'Grigory', 'Vic', 'Lucas Enrique', 'Louie',
    'Marco', 'Herman', 'Klaus', 'Gavriel', 'Elijah', 'Marcel', 'Percy', 'Mario Alberto', 'Joaquin', 'Conner',
    'Geoffrey', 'Eugene', 'Mikhail', 'Sergio', 'Denis Alejandro', 'Pablo', 'Konnor', 'Vadim', 'Yoni', 'Justin', 'Jens',
    'Lonnie', 'Nicolas', 'Warren', 'Mike', 'Sergio Alejandro', 'Seymour', 'Jeffery', 'Aidan', 'Reynaldo', 'Jaden',
    'Marcelo Luis', 'Yvon', 'Lukas', 'Kenneth', 'Yoav', 'Toby', 'Troy', 'Tomasz', 'Cody', 'Leonard', 'Denver', 'Josef',
    'Thorben', 'Kenny', 'Merrill', 'Callum', 'Reuben', 'David Alejandro', 'Nestor', 'Khalid', 'Glen', 'Dwight',
    'Jasper', 'Kylian', 'Konstantin', 'Dakota', 'Artem', 'Fernando', 'Maddox', 'Cade', 'Preston', 'Oleg', 'Sabin',
    'Mohsen', 'Youssef', 'Everett', 'Carlo', 'Enrique', 'Blake', 'Connor', 'Wilfried', 'Kent', 'Roscoe', 'Tadeo',
    'Armando', 'Jerry', 'Yuriy', 'Cristian Javier', 'Giulio', 'Isidore', 'Torsten', 'Wayne', 'Arjun', 'Elliot',
    'Leonardo', 'Lazaro', 'Heath', 'Ethan', 'Romanov', 'Atticus', 'Holden', 'Jorge Manuel', 'Murad', 'Milan', 'Michele',
    'Hank', 'Lindon', 'Maximilian', 'Tobias', 'Claude', 'Rene', 'Nolan', 'Mark', 'Wilmer', 'Rylan', 'Hyman', 'Raul',
    'Basil', 'Rockwell', 'Miguel Angel', 'Ennis', 'Luther', 'Monroe', 'Wellington', 'Reece', 'Xerxes', 'Ned', 'Huxley',
    'Pablo Andres', 'Mariano', 'Otis', 'Murdock', 'Alessandro', 'Giancarlo', 'Eduardo', 'Luciano', 'Shiloh', 'Brian',
    'Nickolas', 'Marc', 'Colin', 'Damien', 'Emmett', 'Jeffrey', 'Lawrence', 'Gabriel Lucas', 'Yoan', 'Fabio',
    'Nathaniel', 'Raheem', 'Trenton', 'Jermaine', 'Gianluca', 'Kendall', 'Sammy', 'Wylie', 'Jonathon', 'Godfrey',
    'Mohammed', 'Tyler', 'Wallace James', 'Humberto', 'Karlis', 'Sloan', 'Adrian', 'Collin', 'Nando', 'Pierre', 'Ernie',
    'Valentin', 'Davis', 'Dominic', 'Watson', 'Yvan', 'Levi', 'Thurlow', 'Thor', 'Umar', 'Mohamed', 'Terence', 'Reid',
    'Artur', 'Brock', 'Velimir', 'Dario', 'Viktor', 'Wilber', 'Noel', 'Norman', 'Yakov', 'Mordecai', 'Mack', 'Carmelo',
    'Santiago Javier', 'Gino', 'Harris', 'Timur Bek', 'Antonio', 'Jarrett', 'Nigel', 'Kirill', 'Weston', 'Douglas',
    'Tadgh', 'Mauricio Javier', 'German', 'Luke', 'Ellis', 'George', 'Willem', 'Dmitry', 'Vernon', 'Langston',
    'Victoriano', 'Rowland', 'Tim', 'Michele Angelo', 'Finn', 'Owen', 'Larry', 'Kim', 'Alfie', 'Abel', 'Jesse',
    'Princeton', 'Carlo Antonio', 'Javier', 'Sebastian Andres', 'Eliot', 'Wladimir', 'Veniamin', 'Nicolo',
    'Karl', 'Floyd', 'Alexei', 'Silvio', 'Leo', 'Francisco Luis', 'Riccardo', 'Eduardo Rafael', 'Ivo', 'Demetrius',
    'Dallas', 'Dalton', 'Titus', 'Osman', 'Javier Luis', 'Gale', 'Royce', 'Kasper', 'Craig', 'Andre', 'Ray', 'Xavier',
    'Domenico', 'Nabil', 'Freddie', 'Stewart', 'Jonas', 'Patrick', 'Xzavier', 'Marco Antonio', 'Roger', 'Umberto',
    'Kevin Alejandro', 'Sabino', 'Kirby', 'Semen', 'Julian Esteban', 'Paulino', 'Forrest', 'Julian Manuel', 'Chandler',
    'Kendrick', 'Ross', 'Noah James', 'William', 'Ron', 'Chase', 'Achilles', 'Wilbur', 'Raylan', 'Vasil', 'Elvin',
    'Sebastian', 'Ephraim', 'Bernardo', 'Rafael Jose', 'Yusuf', 'Luis', 'Boris', 'Gordon', 'Kerry', 'Cesar',
    'Cristian Mateo', 'Merle', 'Jose Antonio', 'Clifford', 'Parrish', 'Primo', 'Jalen', 'Imran', 'Ward', 'Bruno',
    'Wolfgang', 'Nick', 'Victor', 'Corey', 'Aaron', 'Easton', 'Russell', 'Alfonso Maria', 'Edgar', 'Giuseppe Antonio',
    'Marek', 'Odell', 'Brent', 'Terrell', 'Yosef', 'Stevin', 'Hans', 'Mohammad', 'Quentin', 'Israel', 'Rogelio',
    'Rafael Augusto', 'Palmer', 'Edison', 'Pedro Miguel', 'Usman', 'Kingsley', 'Mustafa', 'Sandeep', 'Anders',
    'Marcelo', 'Kirk', 'Ripley', 'Wesley', 'Oswald', 'Inigo', 'Xenon', 'Arseny', 'Jorge Luiz', 'Danilo', 'Hasan', 'Tom',
    'Vicktor', 'Lemuel', 'Boyd', 'Jayden', 'Massimiliano', 'Trace', 'Shelby', 'Brice', 'Jonathan', 'Diego Armando',
    'Nahum', 'Lincoln', 'Rafael', 'Lachlan', 'Lorenzo Rafael', 'Jace', 'Walter', 'Turner', 'Cairo', 'Spiro', 'Akira',
    'Winfield', 'Rusty', 'Rudolph', 'Allen', 'Yago', 'Andreas', 'Kip', 'Orval', 'Stacey', 'Casey', 'Moses', 'Timur',
    'Mason', 'Michael', 'Neville', 'Albert', 'Liam Patrick', 'Rowan', 'Miguel Antonio', 'Antonio Miguel', 'Kyle',
    'Valery', 'Cal', 'Ronny', 'Benson', 'Vasily', 'Jakob', 'Perry', 'Sam', 'Dominic Xavier', 'Mac', 'Rodney',
    'Adrian Fernando', 'Amir', 'Mahmoud', 'Prince', 'Cooper', 'Justo', 'Francisco', 'Maynard', 'Selim', 'Logan',
    'Massimo', 'Lloyd', 'Rufus', 'Bertram', 'Isaac', 'Chad', 'Paris', 'Pavel', 'Gregg', 'Daniele', 'Ludwig', 'Benjamin',
    'Ira', 'Dion', 'Mathew', 'Stefanus', 'Mario', 'Pablo Miguel', 'Ronald', 'Norton', 'Lennard', 'Kole', 'Yannis',
    'Arnold', 'Royal', 'Philippe', 'Reinaldo', 'Morton', 'Karim', 'Gene', 'Salvador', 'Maximilianus', 'Magnus',
    'Manfred', 'Homer', 'Fabrizio', 'Jeremiah', 'Lewis', 'Nelson', 'Willoughby', 'Yohann', 'Barrett', 'Price',
    'Fernando Luis', 'Teo', 'Emmanuel', 'Horace', 'Noah', 'Caio', 'Moises', 'Tariq', 'Fernando Javier',
    'Nicolas Andres', 'Pavel Andreevich', 'Oscar', 'Axel', 'Salvatore', 'Vinnie', 'Mateo', 'Hector Luis', 'Duane',
    'Ashton', 'Bryson', 'Joseph', 'Misael', 'Cristiano', 'Nico', 'North', 'Mateo Ricardo', 'Marlon', 'Devin',
    'Franklin', 'Van', 'Drew', 'Ulrich', 'Sterling', 'Archie', 'Gary', 'Errol', 'Jimmy', 'Nikita', 'Fritz', 'Georgi',
    'Fedor', 'Jamie', 'Jacques', 'Alexander', 'Luka', 'Lennox', 'Remington', 'Grayson', 'Dorian', 'Xoan', 'Markus',
    'Sultan', 'Christophe', 'Declan', 'Reggie', 'Jean', 'Roman', 'Thatcher', 'Arlo', 'Aurelien', 'Gage', 'Neil',
    'Oliver James', 'Yonatan', 'Rolando', 'Jacobo', 'Boston', 'Jude', 'Anthony', 'Timmothy', 'Thanasis', 'Todor',
    'Robbie', 'Winn', 'Sergio Manuel', 'Tobin', 'Kingston', 'Hamid', 'Hermes', 'Yamil', 'Emilio', 'Filippo', 'Joey',
    'Alexandre', 'Andre Luiz', 'Elio', 'Jared', 'Zachariah', 'Ronnie', 'Abram', 'Willy', 'Nate', 'Orson', 'Caleb',
    'Shannon', 'Cristobal', 'Elmer', 'Ivan', 'Florian', 'Micah', 'Sean', 'Wael', 'Napoleon', 'Martin', 'Jorge Enrique',
    'Jonah', 'Pietro Angelo', 'Samuel David', 'Hugo', 'Kaiden', 'Orlando', 'Rick', 'Stephen', 'Sergey', 'Paul', 'Daven',
    'Emanuel',
    'Landen', 'Hershel', 'Marco Vinicio', 'Webster', 'Brendan', 'Jackie', 'Sheridan', 'Teddy', 'Pascal', 'Tommie',
    'Suleiman', 'Rudy', 'Giuseppe', 'Fraser', 'Dante', 'Karlo', 'Silas', 'Rahim', 'Ansel', 'Leonardo Miguel', 'Elroy',
    'Otto', 'Cedric', 'Jonathan David', 'Leslie', 'Anton', 'Valery Ivanovich', 'Dean', 'Niall', 'Sanford', 'Hudson',
    'Maximus', 'Clayton', 'Gabriel', 'Ace', 'Santiago David', 'Lev', 'Paxton', 'Alistair', 'Enrico', 'Jose', 'Alfonso',
    'Mitchell', 'Wendell', 'Porter', 'Josiah', 'Tucker', 'Uriel', 'Peter', 'Salim', 'August', 'Andres Felipe', 'Leon',
    'Seung', 'Jerome', 'Samuel', 'Miles', 'Shadrach', 'Dillon', 'Muhammad Ali', 'Omarion', 'Gonzalo Andres', 'Tasso',
    'Cristian', 'Caspian', 'Hunter', 'Jack', 'Lane', 'Lisandro', 'Manuel Antonio', 'Augustine', 'Salvatore Angelo',
    'Terry', 'Erling', 'David', 'Edwin', 'Claudio', 'Corbin', 'Dale', 'Gustavo Henrique', 'Leo Alexander', 'Wilhelm',
    'Roque', 'Ford', 'Cameron', 'Jhonatan', 'Kyler', 'Lucien', 'Monty', 'Natividad', 'Rhett', 'Rodrigo Miguel', 'Ivor',
    'Hernan', 'Remus', 'Ted', 'Thales', 'Anatoly', 'Jorge', 'Braxton', 'Ernest', 'Patricio', 'Vladimir', 'Salah',
    'Washington', 'Kelvin', 'Reed', 'Mervin', 'Frederick', 'Jaime', 'Yuri', 'Henry', 'Philip', 'Jose Manuel', 'Maxim',
    'Jensen', 'Tamás', 'Grover', 'Marco Aurelio', 'Kian', 'Jethro', 'Lee', 'Dylan', 'Harry', 'Charles', 'Edward',
    'Lamar', 'Wallace', 'Timothy', 'Brett', 'Nikolai', 'Talha', 'Tobiasz', 'Herbert', 'Werner', 'Quinlan', 'Salomon',
    'Griffin', 'Urs', 'Eli', 'Stanley', 'Wycliffe', 'Gareth', 'Luis Felipe', 'Eriksen', 'Igor', 'Duncan',
    'Thomas James', 'Bronson', 'Jamar', 'Chaim', 'Leland', 'Tony', 'Fredrik', 'Jordan', 'Bryant', 'Darren', 'Wilson',
    'Bowen', 'Byron', 'Cole', 'River', 'Guy', 'Pietro', 'Marvin', 'Rob', 'Frank', 'Juan Esteban',
    'Clark', 'Shaun', 'Rafe', 'Tommy', 'Cyrus', 'Henrik', 'Daniel Felipe', 'Stefan', 'Mehmet', 'Lionel', 'Renato',
    'Leandro Jose', 'Alonso', 'Sebastian Marco', 'Montgomery', 'Samson', 'Zachary', 'Derek', 'Theodor', 'Tiberius',
    'Vasily Petrovich', 'Alex', 'Sylvester', 'Thaddeus', 'Kyran', 'Matthias', 'Shay', 'Nino', 'Alan', 'Ibrahim',
    'Garrison', 'Jarvis', 'Simeon', 'Octavio', 'Matteo', 'Max', 'Jan', 'Kaden', 'Casimir', 'Kristian', 'Ulises',
    'Julio', 'Clinton', 'Francisco Javier', 'Torin', 'Laurent', 'Bode', 'Erick', 'Steven', 'Grady', 'Jeff', 'Montague',
    'Pete', 'Yitzhak', 'Stuart', 'Tanner', 'Donovan', 'Turhan', 'Enzo', 'Woody', 'Richie'}


class CheckCharacterType(Enum):
    SUCCESS = 0
    INVALID_NAME = 1
    INVALID_MIN_PRICE = 2

def generate_talent():
    # Генерация таланта по вероятностям
    talent_ranges = [
        (list(range(1, 4)), 0.60),  # 1–3 → 60%
        (list(range(4, 7)), 0.25),  # 4–6 → 25%
        ([7], 0.075),  # 7 → 7.5%
        ([8], 0.05),  # 8 → 5%
        ([9], 0.025)  # 9 → 2.5%
    ]

    # Сначала выбираем диапазон по весам
    range_choices = [rng for rng, _ in talent_ranges]
    range_weights = [w for _, w in talent_ranges]
    chosen_range = random.choices(range_choices, weights=range_weights, k=1)[0]

    # Потом случайное значение из диапазона
    return random.choice(chosen_range)
def generate_power():
    return random.randint(20, 100)

def generate_character(male_names: set[str]) -> CharacterData:
    # Определяем пол
    gender = Gender.MAN

    # Выбираем имя по полу
    name = random.choice(list(male_names))

    # Выбираем страну с учетом весов
    countries = list(COUNTRY_WEIGHTS.keys())
    weights = list(COUNTRY_WEIGHTS.values())
    country = random.choices(countries, weights=weights, k=1)[0]
    talent = generate_talent()
    age_ranges = [
        (range(18, 24), 0.50),  # 18–23 → 50%
        (range(24, 31), 0.35),  # 24–30 → 35%
        (range(31, 35), 0.10),  # 31–34 → 10%
        (range(35, 40), 0.05)  # 35–39 → 5%
    ]

    chosen_age_range = random.choices(
        [rng for rng, _ in age_ranges],
        weights=[w for _, w in age_ranges],
        k=1
    )[0]
    age = random.choice(list(chosen_age_range))

    # Сила
    power = generate_power()

    return CharacterData(
        name=name,
        talent=talent,
        age=age,
        power=power,
        gender=gender,
        country=country
    )


async def check_character(character_data: CharacterData) -> CheckCharacterType:
    from services.character_service import CharacterService
    if character_data.price < MIN_PRICE_FIRST_CHARACTER:
        return CheckCharacterType.INVALID_MIN_PRICE
    character = await CharacterService.get_character_by_name(character_data.name)
    if character:
        return CheckCharacterType.INVALID_NAME
    return CheckCharacterType.SUCCESS


async def get_character():
    male_names = MALE_NAMES.copy()
    suffix = 0
    attempts = 0
    while attempts < 50:
        if not male_names:
            suffix += 1
            male_names = {name + str(suffix) for name in MALE_NAMES}

        character_data = generate_character(male_names)
        check_type = await check_character(character_data)

        match check_type:
            case CheckCharacterType.SUCCESS:
                return character_data
            case CheckCharacterType.INVALID_NAME:
                if character_data.name in male_names:
                    male_names.remove(character_data.name)
            case CheckCharacterType.INVALID_MIN_PRICE:
                pass
        attempts += 1
    random_name: str = random.choice(list(male_names))
    return generate_character({f"{random_name} {random.randint(5000, 100000)}"})


def character_created_message(character: CharacterData) -> str:
    country_flag = COUNTRY_FLAGS.get(character.country)
    return (
        f"🎉 Поздравляем! Вам выпал новый персонаж — **{character.name} {country_flag}**.\n\n"
        f"🔹 Возраст: {character.age} лет\n"
        f"🔹 Талант: {character.talent}\n"
        f"🔹 Сила: {character.power}\n"
        f"🔹 Страна: {character.country.name.capitalize()} {country_flag}\n\n"
        f"Пусть этот персонаж принесёт вам много побед и радости!"
    )
COUNTRY_FLAGS = {
    Country.UKRAINE: "🇺🇦",
    Country.ARGENTINA: "🇦🇷",
    Country.BRAZIL: "🇧🇷",
    Country.FRANCE: "🇫🇷",
    Country.GERMANY: "🇩🇪",
    Country.SPAIN: "🇪🇸",
    Country.ENGLAND: "🇬🇧",  # флаг Англии отдельный, но часто используют Великобритании 🇬🇧
    Country.ITALY: "🇮🇹",
    Country.PORTUGAL: "🇵🇹",
    Country.NETHERLANDS: "🇳🇱",
    Country.BELGIUM: "🇧🇪",
    Country.CROATIA: "🇭🇷",
    Country.URUGUAY: "🇺🇾",
    Country.MEXICO: "🇲🇽",
    Country.USA: "🇺🇸",
    Country.CANADA: "🇨🇦",
    Country.JAPAN: "🇯🇵",
    Country.SOUTH_KOREA: "🇰🇷",
    Country.MOROCCO: "🇲🇦",
    Country.SENEGAL: "🇸🇳",
    Country.NIGERIA: "🇳🇬",
}