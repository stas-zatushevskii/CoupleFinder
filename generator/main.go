package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	_ "github.com/lib/pq"
)

type User struct {
	Name             string
	Gender           string
	Age              int
	City             string
	RelationshipGoal string
	Lifestyle        string
	Bio              string
	Interests        []string
	BadHabits        []string
	Preferences      Preferences
}

type Preferences struct {
	PreferredGender    string
	AgeFrom            int
	AgeTo              int
	PreferredCity      string
	PreferredGoal      string
	PreferredLifestyle string
	HasBadHabits       bool
}

func main() {
	var (
		count int
		dsn   string
	)

	flag.IntVar(&count, "count", 100, "number of users to generate")
	flag.StringVar(&dsn, "dsn", "", "postgres dsn")
	flag.Parse()

	if dsn == "" {
		dsn = os.Getenv("POSTGRES_DSN")
	}
	if dsn == "" {
		log.Fatal("POSTGRES_DSN or -dsn is required")
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	for i := 0; i < count; i++ {
		user := generateUser(rng)

		if err := insertUserAggregate(ctx, db, user); err != nil {
			log.Fatalf("failed on record %d: %v", i+1, err)
		}
	}

	log.Printf("seed completed: inserted %d users", count)
}

// generateUser: gets prepared values from constants and by random generates records for database
func generateUser(rng *rand.Rand) User {
	gender := pick(rng, []string{"male", "female"})

	name := ""
	if gender == "male" {
		name = pick(rng, maleNames)
	} else {
		name = pick(rng, femaleNames)
	}

	age := randInt(rng, 18, 45)
	city := pick(rng, cities)
	goal := pick(rng, goals)
	lifestyle := pick(rng, lifestyles)
	bio := pick(rng, bioTemplates)

	interests := pickUnique(rng, interestsPool, randInt(rng, 3, 6))

	hasBadHabits := rng.Intn(100) < 35
	badHabits := []string{}
	if hasBadHabits {
		badHabits = pickUnique(rng, badHabitsPool, randInt(rng, 1, 3))
	}

	preferredGender := "female"
	if gender == "female" {
		preferredGender = "male"
	}

	ageFrom := max(18, age-randInt(rng, 2, 6))
	ageTo := min(60, age+randInt(rng, 2, 8))

	preferredCity := city
	if rng.Intn(100) < 25 {
		preferredCity = pick(rng, cities)
	}

	preferredGoal := goal
	if rng.Intn(100) < 30 {
		preferredGoal = pick(rng, goals)
	}

	preferredLifestyle := lifestyle
	if rng.Intn(100) < 30 {
		preferredLifestyle = pick(rng, lifestyles)
	}

	return User{
		Name:             fmt.Sprintf("%s_%d", name, randInt(rng, 1000, 9999)),
		Gender:           gender,
		Age:              age,
		City:             city,
		RelationshipGoal: goal,
		Lifestyle:        lifestyle,
		Bio:              bio,
		Interests:        interests,
		BadHabits:        badHabits,
		Preferences: Preferences{
			PreferredGender:    preferredGender,
			AgeFrom:            ageFrom,
			AgeTo:              ageTo,
			PreferredCity:      preferredCity,
			PreferredGoal:      preferredGoal,
			PreferredLifestyle: preferredLifestyle,
			HasBadHabits:       hasBadHabits,
		},
	}
}

// insertUserAggregate: insert function
func insertUserAggregate(ctx context.Context, db *sql.DB, u User) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	var userID int64
	err = tx.QueryRowContext(ctx, `
		INSERT INTO users (
			name,
			gender,
			age,
			city,
			relationship_goal,
			lifestyle,
			bio
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`,
		u.Name,
		u.Gender,
		u.Age,
		u.City,
		u.RelationshipGoal,
		u.Lifestyle,
		u.Bio,
	).Scan(&userID)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO user_preferences (
			user_id,
			preferred_gender,
			age_from,
			age_to,
			preferred_city,
			preferred_goal,
			preferred_lifestyle,
			has_bad_habits
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`,
		userID,
		u.Preferences.PreferredGender,
		u.Preferences.AgeFrom,
		u.Preferences.AgeTo,
		u.Preferences.PreferredCity,
		u.Preferences.PreferredGoal,
		u.Preferences.PreferredLifestyle,
		u.Preferences.HasBadHabits,
	)
	if err != nil {
		return err
	}

	for _, interest := range u.Interests {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO user_interests (user_id, interest)
			VALUES ($1, $2)
		`, userID, interest)
		if err != nil {
			return err
		}
	}

	for _, habit := range u.BadHabits {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO user_bad_habits (user_id, bad_habit)
			VALUES ($1, $2)
		`, userID, habit)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func pick(rng *rand.Rand, arr []string) string {
	return arr[rng.Intn(len(arr))]
}

func pickUnique(rng *rand.Rand, pool []string, n int) []string {
	if n >= len(pool) {
		out := make([]string, len(pool))
		copy(out, pool)
		shuffle(rng, out)
		return out
	}

	tmp := make([]string, len(pool))
	copy(tmp, pool)
	shuffle(rng, tmp)

	return tmp[:n]
}

func shuffle(rng *rand.Rand, arr []string) {
	for i := len(arr) - 1; i > 0; i-- {
		j := rng.Intn(i + 1)
		arr[i], arr[j] = arr[j], arr[i]
	}
}

func randInt(rng *rand.Rand, minV, maxV int) int {
	return minV + rng.Intn(maxV-minV+1)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
