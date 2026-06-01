// ─── API Helper ──────────────────────────────────────────────────────────────

async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Ошибка сервера');
  return data;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const overlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalSave = document.getElementById('modal-save');

function openModal(title, html, onSave) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  overlay.classList.remove('hidden');
  modalSave.onclick = onSave;
}

function closeModal() { overlay.classList.add('hidden'); }

document.getElementById('modal-close').onclick = closeModal;
document.getElementById('modal-cancel').onclick = closeModal;
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

function getFormData(ids) {
  const out = {};
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const v = el.value.trim();
    out[id] = v === '' ? null : (el.type === 'number' ? Number(v) : v);
  }
  return out;
}

// ─── Routing ──────────────────────────────────────────────────────────────────

const routes = {
  dashboard:     renderDashboard,
  filials:       () => renderTable('filials'),
  racks:         () => renderTable('racks'),
  books:         () => renderTable('books'),
  copies:        () => renderTable('copies'),
  readers:       () => renderTable('readers'),
  registrations: () => renderTable('registrations'),
  loans:         () => renderTable('loans'),
  sql:           renderSQL,
};

let currentSection = 'dashboard';

function navigate(section) {
  currentSection = section;
  document.querySelectorAll('#sidebar nav a').forEach(a => {
    a.classList.toggle('active', a.dataset.section === section);
  });
  const fn = routes[section];
  if (fn) fn();
}

document.querySelectorAll('#sidebar nav a[data-section]').forEach(a => {
  a.addEventListener('click', () => navigate(a.dataset.section));
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function renderDashboard() {
  document.getElementById('page-title').textContent = 'Обзор системы';
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка...</div>';

  try {
    const [filials, racks, books, copies, readers, loans] = await Promise.all([
      api('GET', '/api/filials/'),
      api('GET', '/api/racks/'),
      api('GET', '/api/books/'),
      api('GET', '/api/copies/'),
      api('GET', '/api/readers/'),
      api('GET', '/api/loans/?active_only=true'),
    ]);

    const available = copies.filter(c => c.status === 'в наличии').length;
    const onHands = copies.filter(c => c.status === 'на руках').length;

    content.innerHTML = `
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">${filials.length}</div><div class="stat-label">Филиалов</div></div>
        <div class="stat-card"><div class="stat-value">${racks.length}</div><div class="stat-label">Стеллажей</div></div>
        <div class="stat-card"><div class="stat-value">${books.length}</div><div class="stat-label">Книг (названий)</div></div>
        <div class="stat-card"><div class="stat-value">${copies.length}</div><div class="stat-label">Экземпляров</div></div>
        <div class="stat-card"><div class="stat-value">${readers.length}</div><div class="stat-label">Читателей</div></div>
        <div class="stat-card"><div class="stat-value">${available}</div><div class="stat-label">В наличии</div></div>
        <div class="stat-card"><div class="stat-value">${onHands}</div><div class="stat-label">На руках</div></div>
      </div>
      <div class="card">
        <div class="card-header"><h2>Активные выдачи (формуляр)</h2></div>
        ${renderLoanTable(loans.slice(0, 10))}
      </div>`;
  } catch (e) {
    content.innerHTML = `<div class="card"><p style="color:var(--danger)">${e.message}</p></div>`;
  }
}

// ─── Table configs ────────────────────────────────────────────────────────────

const tableConfigs = {
  filials: {
    title: 'Филиалы',
    endpoint: '/api/filials/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название' },
      { key: 'address', label: 'Адрес' },
    ],
    formCreate: () => `
      <div class="form-group"><label>Название</label><input id="name" type="text" placeholder="Центральная библиотека"></div>
      <div class="form-group"><label>Адрес</label><textarea id="address" placeholder="ул. Пушкина, 1"></textarea></div>`,
    formEdit: (row) => `
      <div class="form-group"><label>Название</label><input id="name" type="text" value="${esc(row.name)}"></div>
      <div class="form-group"><label>Адрес</label><textarea id="address">${esc(row.address)}</textarea></div>`,
    fields: ['name', 'address'],
  },

  racks: {
    title: 'Стеллажи',
    endpoint: '/api/racks/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'coordinates', label: 'Координаты' },
      { key: 'room_number', label: 'Комната' },
      { key: 'filial_id', label: 'ID филиала' },
    ],
    formCreate: () => `
      <div class="form-group"><label>Координаты</label><input id="coordinates" type="text" placeholder="Ряд 3, Секция 2"></div>
      <div class="form-row">
        <div class="form-group"><label>Номер комнаты</label><input id="room_number" type="text" placeholder="101"></div>
        <div class="form-group"><label>ID филиала</label><input id="filial_id" type="number"></div>
      </div>`,
    formEdit: (row) => `
      <div class="form-group"><label>Координаты</label><input id="coordinates" type="text" value="${esc(row.coordinates)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Номер комнаты</label><input id="room_number" type="text" value="${esc(row.room_number)}"></div>
        <div class="form-group"><label>ID филиала</label><input id="filial_id" type="number" value="${row.filial_id}"></div>
      </div>`,
    fields: ['coordinates', 'room_number', 'filial_id'],
  },

  books: {
    title: 'Книги',
    endpoint: '/api/books/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название' },
      { key: 'author', label: 'Автор' },
      { key: 'year_of_publication', label: 'Год изд.' },
      { key: 'genre', label: 'Жанр' },
    ],
    searchFields: [
      { id: 'sq_name', placeholder: 'Поиск по названию', param: 'name' },
      { id: 'sq_author', placeholder: 'Поиск по автору', param: 'author' },
    ],
    formCreate: () => `
      <div class="form-group"><label>Название</label><input id="name" type="text"></div>
      <div class="form-group"><label>Автор</label><input id="author" type="text"></div>
      <div class="form-row">
        <div class="form-group"><label>Год издания</label><input id="year_of_publication" type="number"></div>
        <div class="form-group"><label>Жанр</label><input id="genre" type="text"></div>
      </div>`,
    formEdit: (row) => `
      <div class="form-group"><label>Название</label><input id="name" type="text" value="${esc(row.name)}"></div>
      <div class="form-group"><label>Автор</label><input id="author" type="text" value="${esc(row.author)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Год издания</label><input id="year_of_publication" type="number" value="${row.year_of_publication}"></div>
        <div class="form-group"><label>Жанр</label><input id="genre" type="text" value="${esc(row.genre||'')}"></div>
      </div>`,
    fields: ['name', 'author', 'year_of_publication', 'genre'],
  },

  copies: {
    title: 'Экземпляры',
    endpoint: '/api/copies/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'book_id', label: 'ID книги' },
      { key: 'status', label: 'Статус', fmt: v => badgeStatus(v) },
      { key: 'condition', label: 'Состояние', fmt: v => badgeCondition(v) },
      { key: 'rack_id', label: 'ID стеллажа', fmt: v => v ?? '—' },
    ],
    formCreate: () => `
      <div class="form-row">
        <div class="form-group"><label>ID книги</label><input id="book_id" type="number"></div>
        <div class="form-group"><label>ID стеллажа (необязательно)</label><input id="rack_id" type="number"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Статус</label>
          <select id="status"><option>в наличии</option><option>на руках</option><option>списан</option></select></div>
        <div class="form-group"><label>Состояние</label>
          <select id="condition"><option>хорошее</option><option>удовлетворительное</option><option>плохое</option></select></div>
      </div>`,
    formEdit: (row) => `
      <div class="form-row">
        <div class="form-group"><label>ID книги</label><input id="book_id" type="number" value="${row.book_id}"></div>
        <div class="form-group"><label>ID стеллажа</label><input id="rack_id" type="number" value="${row.rack_id ?? ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Статус</label>
          <select id="status">
            <option ${row.status==='в наличии'?'selected':''}>в наличии</option>
            <option ${row.status==='на руках'?'selected':''}>на руках</option>
            <option ${row.status==='списан'?'selected':''}>списан</option>
          </select></div>
        <div class="form-group"><label>Состояние</label>
          <select id="condition">
            <option ${row.condition==='хорошее'?'selected':''}>хорошее</option>
            <option ${row.condition==='удовлетворительное'?'selected':''}>удовлетворительное</option>
            <option ${row.condition==='плохое'?'selected':''}>плохое</option>
          </select></div>
      </div>`,
    fields: ['book_id', 'rack_id', 'status', 'condition'],
  },

  readers: {
    title: 'Читатели',
    endpoint: '/api/readers/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'full_name', label: 'ФИО' },
      { key: 'birth_date', label: 'Дата рожд.', fmt: fmtDate },
      { key: 'passport_data', label: 'Паспорт' },
      { key: 'profession', label: 'Профессия' },
      { key: 'status', label: 'Статус', fmt: v => badgeReaderStatus(v) },
      { key: 'discharge_date', label: 'Дата выписки', fmt: v => v ? fmtDate(v) : '—' },
    ],
    searchFields: [
      { id: 'sq_name', placeholder: 'Поиск по ФИО', param: 'full_name' },
    ],
    formCreate: () => `
      <div class="form-group"><label>ФИО</label><input id="full_name" type="text"></div>
      <div class="form-row">
        <div class="form-group"><label>Дата рождения</label><input id="birth_date" type="date"></div>
        <div class="form-group"><label>Паспортные данные</label><input id="passport_data" type="text" placeholder="4500 123456"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Профессия</label><input id="profession" type="text"></div>
        <div class="form-group"><label>Статус</label>
          <select id="status"><option>активный</option><option>выписан</option></select></div>
      </div>
      <div class="form-group"><label>Дата выписки (необязательно)</label><input id="discharge_date" type="date"></div>`,
    formEdit: (row) => `
      <div class="form-group"><label>ФИО</label><input id="full_name" type="text" value="${esc(row.full_name)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Дата рождения</label><input id="birth_date" type="date" value="${row.birth_date||''}"></div>
        <div class="form-group"><label>Паспортные данные</label><input id="passport_data" type="text" value="${esc(row.passport_data)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Профессия</label><input id="profession" type="text" value="${esc(row.profession||'')}"></div>
        <div class="form-group"><label>Статус</label>
          <select id="status">
            <option ${row.status==='активный'?'selected':''}>активный</option>
            <option ${row.status==='выписан'?'selected':''}>выписан</option>
          </select></div>
      </div>
      <div class="form-group"><label>Дата выписки</label><input id="discharge_date" type="date" value="${row.discharge_date||''}"></div>`,
    fields: ['full_name', 'birth_date', 'passport_data', 'profession', 'status', 'discharge_date'],
  },

  registrations: {
    title: 'Регистрации в филиалах',
    endpoint: '/api/registrations/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'reader_id', label: 'ID читателя' },
      { key: 'ticket_number', label: '№ билета' },
      { key: 'filial_id', label: 'ID филиала' },
      { key: 'registration_date', label: 'Дата регистрации', fmt: fmtDate },
    ],
    formCreate: () => `
      <div class="form-row">
        <div class="form-group"><label>ID читателя</label><input id="reader_id" type="number"></div>
        <div class="form-group"><label>ID филиала</label><input id="filial_id" type="number"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>№ билета</label><input id="ticket_number" type="text" placeholder="BIL-001"></div>
        <div class="form-group"><label>Дата регистрации</label><input id="registration_date" type="date" value="${today()}"></div>
      </div>`,
    formEdit: (row) => `
      <div class="form-row">
        <div class="form-group"><label>ID читателя</label><input id="reader_id" type="number" value="${row.reader_id}"></div>
        <div class="form-group"><label>ID филиала</label><input id="filial_id" type="number" value="${row.filial_id}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>№ билета</label><input id="ticket_number" type="text" value="${esc(row.ticket_number)}"></div>
        <div class="form-group"><label>Дата регистрации</label><input id="registration_date" type="date" value="${row.registration_date}"></div>
      </div>`,
    fields: ['reader_id', 'filial_id', 'ticket_number', 'registration_date'],
  },

  loans: {
    title: 'Формуляр (выдача)',
    endpoint: '/api/loans/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'reader_id', label: 'ID читателя' },
      { key: 'copy_id', label: 'ID экземпляра' },
      { key: 'issue_date', label: 'Дата выдачи', fmt: fmtDate },
      { key: 'planned_return_date', label: 'План. возврат', fmt: fmtDate },
      { key: 'actual_return_date', label: 'Факт. возврат', fmt: v => v ? fmtDate(v) : '<span class="badge badge-yellow">На руках</span>' },
    ],
    extraActions: (row) => !row.actual_return_date
      ? `<button class="btn btn-success btn-sm" onclick="returnBook(${row.id})">Вернуть</button>` : '',
    formCreate: () => `
      <div class="form-row">
        <div class="form-group"><label>ID читателя</label><input id="reader_id" type="number"></div>
        <div class="form-group"><label>ID экземпляра</label><input id="copy_id" type="number"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Дата выдачи</label><input id="issue_date" type="date" value="${today()}"></div>
        <div class="form-group"><label>Плановая дата возврата</label><input id="planned_return_date" type="date"></div>
      </div>`,
    formEdit: (row) => `
      <div class="form-row">
        <div class="form-group"><label>ID читателя</label><input id="reader_id" type="number" value="${row.reader_id}"></div>
        <div class="form-group"><label>ID экземпляра</label><input id="copy_id" type="number" value="${row.copy_id}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Дата выдачи</label><input id="issue_date" type="date" value="${row.issue_date}"></div>
        <div class="form-group"><label>Плановая дата возврата</label><input id="planned_return_date" type="date" value="${row.planned_return_date}"></div>
      </div>
      <div class="form-group"><label>Фактическая дата возврата</label><input id="actual_return_date" type="date" value="${row.actual_return_date||''}"></div>`,
    fields: ['reader_id', 'copy_id', 'issue_date', 'planned_return_date', 'actual_return_date'],
  },
};

// ─── Table renderer ───────────────────────────────────────────────────────────

const PAGE_SIZE = 20;
let tableData = [];
let currentPage = 1;

async function renderTable(section) {
  const cfg = tableConfigs[section];
  document.getElementById('page-title').textContent = cfg.title;
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка...</div>';

  try {
    const data = await api('GET', cfg.endpoint);
    tableData = data;
    currentPage = 1;
    renderTablePage(section, cfg);
  } catch (e) {
    content.innerHTML = `<div class="card"><p style="color:var(--danger)">${e.message}</p></div>`;
  }
}

function renderTablePage(section, cfg) {
  const content = document.getElementById('content');
  const total = tableData.length;
  const pages = Math.ceil(total / PAGE_SIZE);
  const slice = tableData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const searchHtml = cfg.searchFields ? `
    <div class="search-row">
      ${cfg.searchFields.map(f => `<input id="${f.id}" placeholder="${f.placeholder}" oninput="doSearch('${section}')">`).join('')}
    </div>` : '';

  const rows = slice.length === 0
    ? `<tr><td colspan="${cfg.columns.length + 1}" class="empty-state">Нет данных</td></tr>`
    : slice.map(row => `
        <tr>
          ${cfg.columns.map(col => `<td title="${plainText(row[col.key])}">${col.fmt ? col.fmt(row[col.key]) : esc(String(row[col.key] ?? ''))}</td>`).join('')}
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${cfg.extraActions ? cfg.extraActions(row) : ''}
              <button class="btn btn-ghost btn-sm" onclick="editRow('${section}',${row.id})">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="deleteRow('${section}',${row.id})">🗑</button>
            </div>
          </td>
        </tr>`).join('');

  const pagBtns = pages <= 1 ? '' : Array.from({length: pages}, (_, i) => i + 1)
    .map(p => `<button class="${p === currentPage ? 'active' : ''}" onclick="goPage('${section}',${p})">${p}</button>`)
    .join('');

  content.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>${cfg.title} <span style="color:var(--text-muted);font-weight:400;font-size:13px">(${total})</span></h2>
        <button class="btn btn-primary" onclick="createRow('${section}')">+ Добавить</button>
      </div>
      ${searchHtml}
      <div class="table-wrap">
        <table>
          <thead><tr>
            ${cfg.columns.map(c => `<th>${c.label}</th>`).join('')}
            <th>Действия</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="pagination">
        <button onclick="goPage('${section}',${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>‹</button>
        ${pagBtns}
        <button onclick="goPage('${section}',${currentPage + 1})" ${currentPage >= pages ? 'disabled' : ''}>›</button>
      </div>
    </div>`;
}

function goPage(section, p) {
  const cfg = tableConfigs[section];
  const pages = Math.ceil(tableData.length / PAGE_SIZE);
  if (p < 1 || p > pages) return;
  currentPage = p;
  renderTablePage(section, cfg);
}

async function doSearch(section) {
  const cfg = tableConfigs[section];
  if (!cfg.searchFields) return;
  const params = new URLSearchParams();
  cfg.searchFields.forEach(f => {
    const v = document.getElementById(f.id)?.value.trim();
    if (v) params.set(f.param, v);
  });
  try {
    const data = await api('GET', cfg.endpoint + (params.toString() ? '?' + params : ''));
    tableData = data;
    currentPage = 1;
    renderTablePage(section, cfg);
  } catch (e) { showToast(e.message, 'error'); }
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

function createRow(section) {
  const cfg = tableConfigs[section];
  openModal(`Добавить: ${cfg.title}`, cfg.formCreate(), async () => {
    try {
      const body = getFormData(cfg.fields);
      await api('POST', cfg.endpoint, body);
      showToast('Запись создана', 'success');
      closeModal();
      renderTable(section);
    } catch (e) { showToast(e.message, 'error'); }
  });
}

async function editRow(section, id) {
  const cfg = tableConfigs[section];
  try {
    const row = await api('GET', cfg.endpoint + id);
    openModal(`Редактировать #${id}`, cfg.formEdit(row), async () => {
      try {
        const body = getFormData(cfg.fields);
        await api('PUT', cfg.endpoint + id, body);
        showToast('Запись обновлена', 'success');
        closeModal();
        renderTable(section);
      } catch (e) { showToast(e.message, 'error'); }
    });
  } catch (e) { showToast(e.message, 'error'); }
}

async function deleteRow(section, id) {
  if (!confirm('Удалить запись #' + id + '?')) return;
  const cfg = tableConfigs[section];
  try {
    await api('DELETE', cfg.endpoint + id);
    showToast('Удалено', 'success');
    renderTable(section);
  } catch (e) { showToast(e.message, 'error'); }
}

async function returnBook(id) {
  if (!confirm('Отметить книгу возвращённой?')) return;
  try {
    await api('POST', `/api/loans/${id}/return`);
    showToast('Книга возвращена', 'success');
    renderTable('loans');
  } catch (e) { showToast(e.message, 'error'); }
}

// ─── SQL ──────────────────────────────────────────────────────────────────────

function renderSQL() {
  document.getElementById('page-title').textContent = 'SQL-консоль';
  document.getElementById('content').innerHTML = `
    <div class="card">
      <div class="card-header"><h2>Произвольный SQL-запрос</h2></div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">
        Доступны: SELECT, INSERT, UPDATE, DELETE. Запрещены: DROP, TRUNCATE, ALTER, CREATE.
      </p>
      <textarea id="sql-editor" placeholder="SELECT * FROM filial LIMIT 10;"></textarea>
      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="runSQL()">▶ Выполнить</button>
        <button class="btn btn-ghost" onclick="document.getElementById('sql-editor').value='';document.getElementById('sql-result').innerHTML=''">Очистить</button>
      </div>
      <div id="sql-result"></div>
    </div>
    <div class="card">
      <div class="card-header"><h2>Примеры запросов</h2></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${sqlExamples.map(e => `<button class="btn btn-ghost btn-sm" onclick="setSQLExample(${JSON.stringify(e.q)})">${e.label}</button>`).join('')}
      </div>
    </div>`;
}

const sqlExamples = [
  { label: 'Все филиалы', q: 'SELECT * FROM filial;' },
  { label: 'Все стеллажи', q: 'SELECT r.id, r.coordinates, r.room_number, f.name AS filial FROM rack r JOIN filial f ON r.filial_id = f.id;' },
  { label: 'Все книги', q: 'SELECT * FROM book ORDER BY name;' },
  { label: 'Все читатели', q: 'SELECT * FROM reader;' },
  { label: 'Книги на руках', q: "SELECT c.id, b.name, b.author, r.full_name, l.issue_date FROM loan l JOIN copy c ON l.copy_id = c.id JOIN book b ON c.book_id = b.id JOIN reader r ON l.reader_id = r.id WHERE l.actual_return_date IS NULL;" },
  { label: 'Просроченные', q: "SELECT l.id, r.full_name, b.name, l.planned_return_date FROM loan l JOIN reader r ON l.reader_id = r.id JOIN copy c ON l.copy_id = c.id JOIN book b ON c.book_id = b.id WHERE l.actual_return_date IS NULL AND l.planned_return_date < CURRENT_DATE;" },
  { label: 'Экземпляры по филиалам', q: 'SELECT f.name, COUNT(c.id) AS total, SUM(CASE WHEN c.status = \'в наличии\' THEN 1 ELSE 0 END) AS available FROM copy c JOIN rack rk ON c.rack_id = rk.id JOIN filial f ON rk.filial_id = f.id GROUP BY f.name;' },
  { label: 'Читатели по статусу', q: "SELECT status, COUNT(*) AS count FROM reader GROUP BY status;" },
  { label: 'Регистрации читателя', q: "SELECT r.full_name, reg.ticket_number, f.name AS filial, reg.registration_date FROM registration reg JOIN reader r ON reg.reader_id = r.id JOIN filial f ON reg.filial_id = f.id;" },
];

function setSQLExample(q) {
  document.getElementById('sql-editor').value = q;
}

async function runSQL() {
  const query = document.getElementById('sql-editor').value.trim();
  if (!query) return;
  const resultEl = document.getElementById('sql-result');
  resultEl.innerHTML = '<div class="loading"><div class="spinner"></div>Выполняется...</div>';
  try {
    const res = await api('POST', '/api/sql/', { query });
    const rows = res.rows;
    if (!rows || rows.length === 0) {
      resultEl.innerHTML = '<div class="result-info">Запрос выполнен. Строк не возвращено.</div>';
      return;
    }
    const cols = Object.keys(rows[0]);
    resultEl.innerHTML = `
      <div class="result-info">Возвращено строк: ${res.count}</div>
      <div class="table-wrap">
        <table>
          <thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${rows.slice(0, 500).map(row =>
            `<tr>${cols.map(c => `<td>${esc(String(row[c] ?? ''))}</td>`).join('')}</tr>`
          ).join('')}</tbody>
        </table>
      </div>`;
  } catch (e) {
    resultEl.innerHTML = `<div class="error-info">Ошибка: ${esc(e.message)}</div>`;
  }
}

// ─── Loan table helper ────────────────────────────────────────────────────────

function renderLoanTable(rows) {
  if (!rows.length) return '<div class="empty-state">Нет активных выдач</div>';
  return `<div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Читатель</th><th>Экземпляр</th><th>Выдана</th><th>План. возврат</th><th>Статус</th></tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td>${r.id}</td><td>${r.reader_id}</td><td>${r.copy_id}</td>
      <td>${fmtDate(r.issue_date)}</td><td>${fmtDate(r.planned_return_date)}</td>
      <td><span class="badge badge-yellow">На руках</span></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function plainText(v) { return String(v ?? ''); }
function today() { return new Date().toISOString().split('T')[0]; }
function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleDateString('ru-RU');
}
function badgeStatus(v) {
  if (v === 'в наличии') return '<span class="badge badge-green">в наличии</span>';
  if (v === 'на руках')  return '<span class="badge badge-yellow">на руках</span>';
  if (v === 'списан')    return '<span class="badge badge-red">списан</span>';
  return `<span class="badge badge-gray">${esc(v)}</span>`;
}
function badgeCondition(v) {
  if (v === 'хорошее')           return '<span class="badge badge-green">хорошее</span>';
  if (v === 'удовлетворительное') return '<span class="badge badge-yellow">удовл.</span>';
  if (v === 'плохое')            return '<span class="badge badge-red">плохое</span>';
  return `<span class="badge badge-gray">${esc(v)}</span>`;
}
function badgeReaderStatus(v) {
  if (v === 'активный') return '<span class="badge badge-green">активный</span>';
  if (v === 'выписан')  return '<span class="badge badge-gray">выписан</span>';
  return `<span class="badge badge-gray">${esc(v)}</span>`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

navigate('dashboard');
