from enum import Enum, auto

class MoneyPack:
    def __init__(self, name, coins, price):
        self.name = name
        self.coins = coins
        self.price = price

    def __repr__(self):
        return f"{self.name}: {self.coins} монет - {self.price} грн"

class MoneyPackType(Enum):
    SMALL = "SMALL"  
    MIDDLE = "MIDDLE" 
    BIG = "BIG"  
    KING = "KING"   
    
money_packs = {
    MoneyPackType.SMALL: MoneyPack("Small pack", 300, 99),
    MoneyPackType.MIDDLE: MoneyPack("Middle pack", 1000, 240),
    MoneyPackType.BIG: MoneyPack("Big pack", 2000, 390),
    MoneyPackType.KING: MoneyPack("King pack", 5000, 690)
}