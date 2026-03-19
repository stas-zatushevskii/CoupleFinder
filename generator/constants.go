package main

// here describes prepared values for database records
var (
	maleNames = []string{
		"Alex", "Ivan", "Dmitry", "Nikita", "Andrei", "Victor", "Maksim", "Roman", "Denis", "Pavel",
	}

	femaleNames = []string{
		"Anna", "Maria", "Elena", "Olga", "Sofia", "Daria", "Alina", "Irina", "Karina", "Natalia",
	}

	cities = []string{
		"Chisinau", "Balti", "Cahul", "Orhei", "Ungheni", "Tiraspol",
	}

	goals = []string{
		"serious", "friendship", "communication",
	}

	lifestyles = []string{
		"active", "family", "passive",
	}

	interestsPool = []string{
		"music", "travel", "sport", "movies", "books",
		"games", "cooking", "art", "technology", "nature",
		"fitness", "photography", "dancing", "animals", "hiking",
	}

	// Под твою текущую схему bad_habits — ОДНА строка.
	badHabitsPool = []string{
		"none",
		"alcohol",
		"smoking",
		"drugs",
		"gambling",
		"overeating",
	}

	bioTemplates = []string{
		"Люблю активный отдых и интересные разговоры.",
		"Ищу человека с похожими ценностями и чувством юмора.",
		"Нравятся путешествия, музыка и спокойные вечера.",
		"Люблю спорт, прогулки и живое общение.",
		"Ценю искренность, доверие и взаимопонимание.",
		"Интересуюсь книгами, фильмами и саморазвитием.",
	}
)
