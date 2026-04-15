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
    out[id] = v === '' ? null : (el.type === 'number' ? (v === '' ? null : Number(v)) : v);
  }
  return out;
}

// ─── Routing ──────────────────────────────────────────────────────────────────

const routes = {
  dashboard: renderDashboard,
  filials:   () => renderTable('filials'),
  users:     () => renderTable('users'),
  books:     () => renderTable('books'),
  loans:     () => renderTable('loans'),
  userloans: () => renderTable('userloans'),
  catalogs:  () => renderTable('catalogs'),
  transactions: () => renderTable('transactions'),
  userfilials:  () => renderTable('userfilials'),
  sql:       renderSQL,
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
    const [filials, users, books, loans, userloans] = await Promise.all([
      api('GET', '/api/filials/'),
      api('GET', '/api/users/'),
      api('GET', '/api/books/'),
      api('GET', '/api/loans/'),
      api('GET', '/api/user-loans/?active_only=true'),
    ]);

    const available = loans.filter(l => l.status_free === 'в библиотеке').length;
    const onHands = loans.filter(l => l.status_free === 'на руках').length;

    content.innerHTML = `
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">${filials.length}</div><div class="stat-label">Филиалов</div></div>
        <div class="stat-card"><div class="stat-value">${users.length}</div><div class="stat-label">Читателей</div></div>
        <div class="stat-card"><div class="stat-value">${books.length}</div><div class="stat-label">Книг (названий)</div></div>
        <div class="stat-card"><div class="stat-value">${loans.length}</div><div class="stat-label">Экземпляров</div></div>
        <div class="stat-card"><div class="stat-value">${available}</div><div class="stat-label">В библиотеке</div></div>
        <div class="stat-card"><div class="stat-value">${onHands}</div><div class="stat-label">На руках</div></div>
      </div>
      <div class="card">
        <div class="card-header"><h2>Активные выдачи</h2></div>
        ${renderUserLoanTable(userloans.slice(0, 10))}
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
      { key: 'name_library', label: 'Библиотека' },
      { key: 'address', label: 'Адрес' },
      { key: 'created_at', label: 'Создан', fmt: fmtDate },
    ],
    formCreate: () => `
      <div class="form-group"><label>Название библиотеки</label><input id="name_library" type="text" placeholder="Центральная библиотека"></div>
      <div class="form-group"><label>Адрес</label><textarea id="address" placeholder="ул. Пушкина, 1"></textarea></div>`,
    formEdit: (row) => `
      <div class="form-group"><label>Название библиотеки</label><input id="name_library" type="text" value="${esc(row.name_library)}"></div>
      <div class="form-group"><label>Адрес</label><textarea id="address">${esc(row.address)}</textarea></div>`,
    fields: ['name_library', 'address'],
  },

  users: {
    title: 'Читатели',
    endpoint: '/api/users/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'number_reading_ticket', label: '№ билета' },
      { key: 'passport_data', label: 'Паспорт' },
      { key: 'professions', label: 'Профессия' },
      { key: 'gender', label: 'Пол' },
      { key: 'years', label: 'Год рожд.' },
      { key: 'sing_in', label: 'Дата записи', fmt: fmtDate },
      { key: 'sing_out', label: 'Дата выписки', fmt: v => v ? fmtDate(v) : '—' },
    ],
    formCreate: () => `
      <div class="form-row">
        <div class="form-group"><label>№ читательского билета</label><input id="number_reading_ticket" type="text"></div>
        <div class="form-group"><label>Год рождения</label><input id="years" type="number" min="1900" max="2020"></div>
      </div>
      <div class="form-group"><label>Паспортные данные</label><textarea id="passport_data"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Профессия</label><input id="professions" type="text"></div>
        <div class="form-group"><label>Пол</label>
          <select id="gender"><option value="М">Мужской</option><option value="Ж">Женский</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Дата записи</label><input id="sing_in" type="date"></div>
        <div class="form-group"><label>Дата выписки</label><input id="sing_out" type="date"></div>
      </div>`,
    formEdit: (row) => `
      <div class="form-row">
        <div class="form-group"><label>№ читательского билета</label><input id="number_reading_ticket" type="text" value="${esc(row.number_reading_ticket)}"></div>
        <div class="form-group"><label>Год рождения</label><input id="years" type="number" value="${row.years}"></div>
      </div>
      <div class="form-group"><label>Паспортные данные</label><textarea id="passport_data">${esc(row.passport_data)}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Профессия</label><input id="professions" type="text" value="${esc(row.professions||'')}"></div>
        <div class="form-group"><label>Пол</label>
          <select id="gender"><option value="М" ${row.gender==='М'?'selected':''}>Мужской</option><option value="Ж" ${row.gender==='Ж'?'selected':''}>Женский</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Дата записи</label><input id="sing_in" type="date" value="${row.sing_in||''}"></div>
        <div class="form-group"><label>Дата выписки</label><input id="sing_out" type="date" value="${row.sing_out||''}"></div>
      </div>`,
    fields: ['number_reading_ticket', 'passport_data', 'professions', 'gender', 'years', 'sing_in', 'sing_out'],
  },

  books: {
    title: 'Книги',
    endpoint: '/api/books/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Название' },
      { key: 'author', label: 'Автор' },
      { key: 'year_of_publication', label: 'Год изд.' },
      { key: 'topic', label: 'Тематика' },
      { key: 'created_at', label: 'Добавлена', fmt: fmtDate },
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
        <div class="form-group"><label>Тематика</label><input id="topic" type="text"></div>
      </div>`,
    formEdit: (row) => `
      <div class="form-group"><label>Название</label><input id="name" type="text" value="${esc(row.name)}"></div>
      <div class="form-group"><label>Автор</label><input id="author" type="text" value="${esc(row.author)}"></div>
      <div class="form-row">
        <div class="form-group"><label>Год издания</label><input id="year_of_publication" type="number" value="${row.year_of_publication}"></div>
        <div class="form-group"><label>Тематика</label><input id="topic" type="text" value="${esc(row.topic||'')}"></div>
      </div>`,
    fields: ['name', 'author', 'year_of_publication', 'topic'],
  },

  loans: {
    title: 'Экземпляры книг',
    endpoint: '/api/loans/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'id_book_id', label: 'ID книги' },
      { key: 'id_filial_id', label: 'ID филиала' },
      { key: 'status_free', label: 'Наличие', fmt: v => badgeStatusFree(v) },
      { key: 'status_condition', label: 'Состояние', fmt: v => badgeCondition(v) },
      { key: 'nomer_room', label: 'Комната' },
      { key: 'rack_coordination', label: 'Стеллаж' },
    ],
    formCreate: () => `
      <div class="form-row">
        <div class="form-group"><label>ID книги</label><input id="id_book_id" type="number"></div>
        <div class="form-group"><label>ID филиала</label><input id="id_filial_id" type="number"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Состояние</label>
          <select id="status_condition">
            <option>хорошее</option><option>плохое</option><option>требует ремонта</option>
          </select></div>
        <div class="form-group"><label>Наличие</label>
          <select id="status_free"><option>в библиотеке</option><option>на руках</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Комната</label><input id="nomer_room" type="text"></div>
        <div class="form-group"><label>Координата стеллажа</label><input id="rack_coordination" type="text"></div>
      </div>
      <div class="form-group"><label>Адрес хранения</label><input id="address" type="text"></div>`,
    formEdit: (row) => `
      <div class="form-row">
        <div class="form-group"><label>ID книги</label><input id="id_book_id" type="number" value="${row.id_book_id}"></div>
        <div class="form-group"><label>ID филиала</label><input id="id_filial_id" type="number" value="${row.id_filial_id}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Состояние</label>
          <select id="status_condition">
            <option ${row.status_condition==='хорошее'?'selected':''}>хорошее</option>
            <option ${row.status_condition==='плохое'?'selected':''}>плохое</option>
            <option ${row.status_condition==='требует ремонта'?'selected':''}>требует ремонта</option>
            <option ${row.status_condition==='списано'?'selected':''}>списано</option>
          </select></div>
        <div class="form-group"><label>Наличие</label>
          <select id="status_free">
            <option ${row.status_free==='в библиотеке'?'selected':''}>в библиотеке</option>
            <option ${row.status_free==='на руках'?'selected':''}>на руках</option>
            <option ${row.status_free==='списано'?'selected':''}>списано</option>
          </select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Комната</label><input id="nomer_room" type="text" value="${esc(row.nomer_room||'')}"></div>
        <div class="form-group"><label>Стеллаж</label><input id="rack_coordination" type="text" value="${esc(row.rack_coordination||'')}"></div>
      </div>
      <div class="form-group"><label>Адрес хранения</label><input id="address" type="text" value="${esc(row.address||'')}"></div>`,
    fields: ['id_book_id', 'id_filial_id', 'status_condition', 'status_free', 'nomer_room', 'rack_coordination', 'address'],
  },

  userloans: {
    title: 'Формуляр (выдача)',
    endpoint: '/api/user-loans/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'id_user_id', label: 'ID читателя' },
      { key: 'id_loan_id', label: 'ID экземпляра' },
      { key: 'id_filial_id', label: 'ID филиала' },
      { key: 'date_issue', label: 'Дата выдачи', fmt: fmtDate },
      { key: 'date_return', label: 'Дата возврата', fmt: v => v ? fmtDate(v) : '<span class="badge badge-yellow">На руках</span>' },
    ],
    extraActions: (row) => !row.date_return
      ? `<button class="btn btn-success btn-sm" onclick="returnBook(${row.id})">Вернуть</button>` : '',
    formCreate: () => `
      <div class="form-row">
        <div class="form-group"><label>ID читателя</label><input id="id_user_id" type="number"></div>
        <div class="form-group"><label>ID экземпляра</label><input id="id_loan_id" type="number"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>ID филиала</label><input id="id_filial_id" type="number"></div>
        <div class="form-group"><label>Дата выдачи</label><input id="date_issue" type="date" value="${today()}"></div>
      </div>`,
    formEdit: (row) => `
      <div class="form-row">
        <div class="form-group"><label>ID читателя</label><input id="id_user_id" type="number" value="${row.id_user_id}"></div>
        <div class="form-group"><label>ID экземпляра</label><input id="id_loan_id" type="number" value="${row.id_loan_id}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>ID филиала</label><input id="id_filial_id" type="number" value="${row.id_filial_id}"></div>
        <div class="form-group"><label>Дата выдачи</label><input id="date_issue" type="date" value="${row.date_issue}"></div>
      </div>
      <div class="form-group"><label>Дата возврата</label><input id="date_return" type="date" value="${row.date_return||''}"></div>`,
    fields: ['id_user_id', 'id_loan_id', 'id_filial_id', 'date_issue', 'date_return'],
  },

  catalogs: {
    title: 'Каталог',
    endpoint: '/api/catalogs/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'id_book_id', label: 'ID книги' },
      { key: 'catalog_type', label: 'Тип', fmt: v => `<span class="badge badge-blue">${v}</span>` },
      { key: 'catalog_value', label: 'Значение' },
      { key: 'created_at', label: 'Создан', fmt: fmtDate },
    ],
    formCreate: () => `
      <div class="form-group"><label>ID книги</label><input id="id_book_id" type="number"></div>
      <div class="form-row">
        <div class="form-group"><label>Тип каталога</label>
          <select id="catalog_type"><option>тематический</option><option>алфавитный</option></select></div>
        <div class="form-group"><label>Значение</label><input id="catalog_value" type="text"></div>
      </div>`,
    formEdit: (row) => `
      <div class="form-group"><label>ID книги</label><input id="id_book_id" type="number" value="${row.id_book_id}"></div>
      <div class="form-row">
        <div class="form-group"><label>Тип каталога</label>
          <select id="catalog_type">
            <option ${row.catalog_type==='тематический'?'selected':''}>тематический</option>
            <option ${row.catalog_type==='алфавитный'?'selected':''}>алфавитный</option>
          </select></div>
        <div class="form-group"><label>Значение</label><input id="catalog_value" type="text" value="${esc(row.catalog_value)}"></div>
      </div>`,
    fields: ['id_book_id', 'catalog_type', 'catalog_value'],
  },

  transactions: {
    title: 'Поступление и списание',
    endpoint: '/api/transactions/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'id_loan_id', label: 'ID экземпляра' },
      { key: 'operation_type', label: 'Тип операции', fmt: v => v === 'поступление'
          ? '<span class="badge badge-green">поступление</span>'
          : '<span class="badge badge-red">списание</span>' },
      { key: 'operation_date', label: 'Дата', fmt: fmtDate },
      { key: 'reason', label: 'Причина' },
    ],
    formCreate: () => `
      <div class="form-row">
        <div class="form-group"><label>ID экземпляра</label><input id="id_loan_id" type="number"></div>
        <div class="form-group"><label>Тип операции</label>
          <select id="operation_type"><option>поступление</option><option>списание</option></select></div>
      </div>
      <div class="form-group"><label>Дата операции</label><input id="operation_date" type="date" value="${today()}"></div>
      <div class="form-group"><label>Причина</label><textarea id="reason"></textarea></div>`,
    formEdit: (row) => `
      <div class="form-row">
        <div class="form-group"><label>ID экземпляра</label><input id="id_loan_id" type="number" value="${row.id_loan_id}"></div>
        <div class="form-group"><label>Тип операции</label>
          <select id="operation_type">
            <option ${row.operation_type==='поступление'?'selected':''}>поступление</option>
            <option ${row.operation_type==='списание'?'selected':''}>списание</option>
          </select></div>
      </div>
      <div class="form-group"><label>Дата операции</label><input id="operation_date" type="date" value="${row.operation_date}"></div>
      <div class="form-group"><label>Причина</label><textarea id="reason">${esc(row.reason||'')}</textarea></div>`,
    fields: ['id_loan_id', 'operation_type', 'operation_date', 'reason'],
  },

  userfilials: {
    title: 'Регистрация читателей в филиалах',
    endpoint: '/api/user-filials/',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'id_user_id', label: 'ID читателя' },
      { key: 'id_filial_id', label: 'ID филиала' },
      { key: 'registration_date', label: 'Дата регистрации', fmt: fmtDate },
      { key: 'created_at', label: 'Создан', fmt: fmtDate },
    ],
    formCreate: () => `
      <div class="form-row">
        <div class="form-group"><label>ID читателя</label><input id="id_user_id" type="number"></div>
        <div class="form-group"><label>ID филиала</label><input id="id_filial_id" type="number"></div>
      </div>
      <div class="form-group"><label>Дата регистрации</label><input id="registration_date" type="date" value="${today()}"></div>`,
    formEdit: (row) => `
      <div class="form-row">
        <div class="form-group"><label>ID читателя</label><input id="id_user_id" type="number" value="${row.id_user_id}"></div>
        <div class="form-group"><label>ID филиала</label><input id="id_filial_id" type="number" value="${row.id_filial_id}"></div>
      </div>
      <div class="form-group"><label>Дата регистрации</label><input id="registration_date" type="date" value="${row.registration_date}"></div>`,
    fields: ['id_user_id', 'id_filial_id', 'registration_date'],
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
    await api('POST', `/api/user-loans/${id}/return`);
    showToast('Книга возвращена', 'success');
    renderTable('userloans');
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
  { label: 'Все читатели', q: 'SELECT * FROM users;' },
  { label: 'Все книги', q: 'SELECT * FROM books ORDER BY name;' },
  { label: 'Книги на руках', q: "SELECT l.id, b.name, b.author, u.number_reading_ticket, ul.date_issue FROM user_loan ul JOIN loan l ON ul.id_loan_id = l.id JOIN books b ON l.id_book_id = b.id JOIN users u ON ul.id_user_id = u.id WHERE ul.date_return IS NULL;" },
  { label: 'Просроченные (>14 дней)', q: "SELECT ul.id, u.number_reading_ticket, b.name, ul.date_issue FROM user_loan ul JOIN users u ON ul.id_user_id = u.id JOIN loan l ON ul.id_loan_id = l.id JOIN books b ON l.id_book_id = b.id WHERE ul.date_return IS NULL AND ul.date_issue < CURRENT_DATE - INTERVAL '14 days';" },
  { label: 'Наличие по филиалам', q: 'SELECT f.name_library, COUNT(l.id) AS total, SUM(CASE WHEN l.status_free = \'в библиотеке\' THEN 1 ELSE 0 END) AS available FROM loan l JOIN filial f ON l.id_filial_id = f.id GROUP BY f.name_library;' },
  { label: 'Читатели по полу', q: "SELECT gender, COUNT(*) AS count FROM users GROUP BY gender;" },
  { label: 'Тематический каталог', q: "SELECT c.catalog_value, COUNT(b.id) AS books_count FROM catalog c JOIN books b ON c.id_book_id = b.id WHERE c.catalog_type = 'тематический' GROUP BY c.catalog_value ORDER BY books_count DESC;" },
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

// ─── UserLoan table helper ────────────────────────────────────────────────────

function renderUserLoanTable(rows) {
  if (!rows.length) return '<div class="empty-state">Нет активных выдач</div>';
  return `<div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Читатель</th><th>Экземпляр</th><th>Филиал</th><th>Выдана</th><th>Статус</th></tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td>${r.id}</td><td>${r.id_user_id}</td><td>${r.id_loan_id}</td>
      <td>${r.id_filial_id}</td><td>${fmtDate(r.date_issue)}</td>
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
function badgeStatusFree(v) {
  if (v === 'в библиотеке') return '<span class="badge badge-green">в библиотеке</span>';
  if (v === 'на руках')     return '<span class="badge badge-yellow">на руках</span>';
  if (v === 'списано')      return '<span class="badge badge-red">списано</span>';
  return `<span class="badge badge-gray">${esc(v)}</span>`;
}
function badgeCondition(v) {
  if (v === 'хорошее')         return '<span class="badge badge-green">хорошее</span>';
  if (v === 'плохое')          return '<span class="badge badge-red">плохое</span>';
  if (v === 'требует ремонта') return '<span class="badge badge-yellow">ремонт</span>';
  if (v === 'списано')         return '<span class="badge badge-gray">списано</span>';
  return `<span class="badge badge-gray">${esc(v)}</span>`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

navigate('dashboard');
