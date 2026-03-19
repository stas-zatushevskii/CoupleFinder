import type { User } from "../types/user";

const names = [
    "Anna",
    "Elena",
    "Maria",
    "Sofia",
    "Daria",
    "Nina",
    "Olga",
    "Alina",
    "Karina",
    "Viktoria",
    "Irina",
    "Tatiana",
    "Diana",
    "Veronica",
    "Julia",
    "Anastasia",
    "Ksenia",
    "Milena",
    "Cristina",
    "Lilia",
    "Eva",
    "Marta",
    "Bianca",
    "Sabina",
    "Valeria",
    "Angela",
    "Adriana",
    "Laura",
    "Alexandra",
    "Daniela",
    "Camelia",
    "Ioana",
    "Paula",
    "Natalia",
    "Inga",
    "Yana",
    "Polina",
    "Amina",
    "Clara",
    "Loredana",
];

const cities = [
    "Chisinau",
    "Balti",
    "Cahul",
    "Orhei",
    "Ungheni",
    "Comrat",
    "Soroca",
    "Straseni",
];

const bios = [
    "Люблю прогулки, музыку и искренние разговоры.",
    "Ценю юмор, уютные вечера и хорошие фильмы.",
    "Ищу интересное общение и новые знакомства.",
    "Люблю путешествия, кофе и теплую атмосферу.",
    "Обожаю спорт, активность и позитивных людей.",
    "Нравятся книги, кино и долгие разговоры вечером.",
    "Хочу познакомиться с открытым и добрым человеком.",
    "Люблю спонтанные поездки и красивую музыку.",
];

const interestsPool = [
    "music",
    "travel",
    "cinema",
    "books",
    "coffee",
    "fitness",
    "art",
    "yoga",
    "photography",
    "cooking",
    "dogs",
    "hiking",
    "dancing",
    "coding",
    "fashion",
    "gaming",
];

function pickInterests(index: number): string[] {
    return [
        interestsPool[index % interestsPool.length],
        interestsPool[(index + 3) % interestsPool.length],
        interestsPool[(index + 7) % interestsPool.length],
    ];
}

export const discoverMockUsers: User[] = Array.from({ length: 60 }, (_, i) => {
    const id = i + 1;

    return {
        id,
        name: names[i % names.length],
        age: 20 + (i % 11),
        city: cities[i % cities.length],
        bio: bios[i % bios.length],
        interests: pickInterests(i),
        avatar: `https://i.pravatar.cc/400?img=${(i % 70) + 1}`,
    };
});