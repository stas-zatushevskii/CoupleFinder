package domain

type Gender string
type RelationshipGoal string
type Lifestyle string

const (
	GenderMale   Gender = "male"
	GenderFemale Gender = "female"
)

const (
	GoalSerious       RelationshipGoal = "serious"
	GoalFriendship    RelationshipGoal = "friendship"
	GoalCommunication RelationshipGoal = "communication"
)

const (
	LifestyleActive  Lifestyle = "active"
	LifestyleFamily  Lifestyle = "family"
	LifestylePassive Lifestyle = "passive"
)

const (
	BadHabitAlcohol    = "alcohol"
	BadHabitSmoking    = "smoking"
	BadHabitDrugs      = "drugs"
	BadHabitGambling   = "gambling"
	BadHabitOvereating = "overeating"
)

type Preferences struct {
	PreferredGender    Gender
	AgeFrom            int
	AgeTo              int
	PreferredCity      string
	PreferredGoal      RelationshipGoal
	PreferredLifestyle Lifestyle
	PreferredBadHabits []string
}

type User struct {
	ID               int64
	Name             string
	Gender           Gender
	Age              int
	City             string
	RelationshipGoal RelationshipGoal
	Lifestyle        Lifestyle
	BadHabits        []string
	Bio              string
	Interests        []string
	Preferences      Preferences
}
