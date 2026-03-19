const usersList = document.getElementById('usersList')
const statusEl = document.getElementById('status')
const searchInput = document.getElementById('searchInput')
const genderFilter = document.getElementById('genderFilter')
const refreshBtn = document.getElementById('refreshBtn')

async function loadUsers() {
    statusEl.textContent = 'Загрузка...'
    usersList.innerHTML = ''

    const search = searchInput.value.trim()
    const gender = genderFilter.value

    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (gender) params.set('gender', gender)

    try {
        const res = await fetch(`/api/users?${params.toString()}`)
        const users = await res.json()

        if (!Array.isArray(users) || users.length === 0) {
            statusEl.textContent = 'Записи не найдены'
            return
        }

        statusEl.textContent = `Найдено записей: ${users.length}`

        for (const user of users) {
            const card = document.createElement('div')
            card.className = 'card'

            card.innerHTML = `
        <div class="card-top">
          <div>
            <h3>#${user.id} — ${user.name}</h3>
            <div class="meta">
              ${user.gender}, ${user.age} лет, ${user.city}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Анкета</div>
          <div class="pref-box">
            <div><b>Цель:</b> ${user.relationship_goal}</div>
            <div><b>Образ жизни:</b> ${user.lifestyle}</div>
            <div><b>Bio:</b> ${user.bio || '-'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Предпочтения</div>
          <div class="pref-box">
            <div><b>Ищет пол:</b> ${user.preferred_gender}</div>
            <div><b>Возраст:</b> ${user.age_from} - ${user.age_to}</div>
            <div><b>Город:</b> ${user.preferred_city || '-'}</div>
            <div><b>Цель:</b> ${user.preferred_goal || '-'}</div>
            <div><b>Образ жизни:</b> ${user.preferred_lifestyle || '-'}</div>
            <div><b>Допускает вредные привычки:</b> ${user.has_bad_habits ? 'Да' : 'Нет'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Интересы</div>
          <div class="tags">
            ${(user.interests || []).map((i) => `<span class="tag">${i}</span>`).join('')}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Вредные привычки</div>
          <div class="tags">
            ${
                (user.bad_habits || []).length
                    ? user.bad_habits.map((h) => `<span class="tag bad-tag">${h}</span>`).join('')
                    : '<span class="meta">Нет</span>'
            }
          </div>
        </div>
      `

            usersList.appendChild(card)
        }
    } catch (e) {
        console.error(e)
        statusEl.textContent = 'Ошибка загрузки данных'
    }
}

refreshBtn.addEventListener('click', loadUsers)
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadUsers()
})
genderFilter.addEventListener('change', loadUsers)

loadUsers()