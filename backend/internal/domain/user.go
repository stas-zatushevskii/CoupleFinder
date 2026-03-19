package domain

type Gender string
type RelationshipGoal string
type Lifestyle string
type BadHabits string

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
	LifestyleActive   Lifestyle = "active"
	LifestyleBalanced Lifestyle = "balanced"
	LifestyleHome     Lifestyle = "home"
)

const (
	HabitsNone         BadHabits = "none"
	HabitsOccasionally BadHabits = "occasionally"
	HabitsSmoking      BadHabits = "smoking"
)

type Preferences struct {
	PreferredGender    Gender
	AgeFrom            int
	AgeTo              int
	PreferredCity      string
	PreferredGoal      RelationshipGoal
	PreferredLifestyle Lifestyle
	PreferredBadHabits BadHabits
}

type User struct {
	ID               int64
	Name             string
	Gender           Gender
	Age              int
	City             string
	RelationshipGoal RelationshipGoal
	Lifestyle        Lifestyle
	BadHabits        BadHabits
	Bio              string
	Interests        []string
	Preferences      Preferences
}
