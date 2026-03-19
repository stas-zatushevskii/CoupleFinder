const usersList = document.getElementById('usersList')
const statusEl = document.getElementById('status')
const searchInput = document.getElementById('searchInput')
const genderFilter = document.getElementById('genderFilter')
const refreshBtn = document.getElementById('refreshBtn')

function renderTags(values, className = 'tag') {
    if (!values || values.length === 0) {
        return '<span class="empty">Нет</span>'
    }

    return `
    <div class="tags">
      ${values.map((value) => `<span class="${className}">${value}</span>`).join('')}
    </div>
  `
}

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
            usersList.innerHTML = ''
            return
        }

        statusEl.textContent = `Найдено записей: ${users.length}`

        usersList.innerHTML = `
      <div class="table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Пол / возраст / город</th>
              <th>Анкета</th>
              <th>Предпочтения</th>
              <th>Интересы</th>
              <th>Вредные привычки</th>
              <th>Предпочитаемые вредные привычки</th>
            </tr>
          </thead>
          <tbody>
            ${users
            .map(
                (user) => `
                <tr>
                  <td class="id-cell">#${user.id}</td>

                  <td>
                    <div><strong>${user.name}</strong></div>
                  </td>

                  <td>
                    <div>${user.gender}</div>
                    <div class="meta-text">${user.age} лет</div>
                    <div class="meta-text">${user.city}</div>
                  </td>

                  <td>
                    <div class="pref-box">
                      <div><b>Цель:</b> ${user.relationship_goal}</div>
                      <div><b>Образ жизни:</b> ${user.lifestyle}</div>
                      <div class="bio-cell"><b>Bio:</b> ${user.bio || '-'}</div>
                    </div>
                  </td>

                  <td>
                    <div class="pref-box">
                      <div><b>Ищет пол:</b> ${user.preferred_gender}</div>
                      <div><b>Возраст:</b> ${user.age_from} - ${user.age_to}</div>
                      <div><b>Город:</b> ${user.preferred_city || '-'}</div>
                      <div><b>Цель:</b> ${user.preferred_goal || '-'}</div>
                      <div><b>Образ жизни:</b> ${user.preferred_lifestyle || '-'}</div>
                    </div>
                  </td>

                  <td>
                    ${renderTags(user.interests, 'tag')}
                  </td>

                  <td>
                    ${renderTags(user.bad_habits, 'tag bad-tag')}
                  </td>

                  <td>
                    ${renderTags(user.preferred_bad_habits, 'tag')}
                  </td>
                </tr>
              `,
            )
            .join('')}
          </tbody>
        </table>
      </div>
    `
    } catch (e) {
        console.error(e)
        statusEl.textContent = 'Ошибка загрузки данных'
        usersList.innerHTML = ''
    }
}

refreshBtn.addEventListener('click', loadUsers)
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadUsers()
})
genderFilter.addEventListener('change', loadUsers)

loadUsers()