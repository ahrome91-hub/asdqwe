document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('csvFile');
    const importBtn = document.getElementById('importBtn');
    const previewContainer = document.getElementById('previewContainer');
    const progressBar = document.getElementById('progressBar');

    if (importBtn) {
        importBtn.addEventListener('click', function() {
            const file = fileInput.files[0];
            if (!file) {
                showToast('Выберите CSV файл');
                return;
            }
            processCSV(file);
        });
    }
});

function processCSV(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const text = event.target.result;
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                showToast('Файл пуст или повреждён');
                return;
            }

            // Парсим заголовки
            const headers = parseCSVLine(lines[0]);
            const previewData = [];
            const allData = [];

            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLine(lines[i]);
                if (values.length < headers.length) continue;
                const obj = {};
                headers.forEach((h, idx) => {
                    obj[h.trim()] = values[idx]?.trim() || '';
                });
                allData.push(obj);
                if (i <= 6) previewData.push(obj);
            }

            if (allData.length === 0) {
                showToast('Нет данных для импорта');
                return;
            }

            showPreview(previewData, allData.length);
            showToast(`Найдено ${allData.length} записей`);

            // Кнопка подтверждения импорта
            const confirmBtn = document.getElementById('confirmImport');
            if (confirmBtn) {
                confirmBtn.style.display = 'inline-block';
                confirmBtn.onclick = function() {
                    importData(allData);
                };
            }

        } catch (e) {
            showToast('Ошибка парсинга: ' + e.message);
        }
    };
    reader.readAsText(file);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function showPreview(data, total) {
    const container = document.getElementById('previewContainer');
    if (!container) return;

    let html = `
        <div style="margin-top:16px; padding:16px; background:var(--bg-toolbar); border-radius:var(--radius); border:1px solid var(--border-light);">
            <h4>Предпросмотр (${Math.min(data.length, 5)} из ${total} записей)</h4>
            <div style="overflow-x:auto; margin-top:12px;">
                <table>
                    <thead>
                        <tr>${Object.keys(data[0] || {}).map(k => `<th>${k}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${data.slice(0, 5).map(row => `
                            <tr>${Object.values(row).map(v => `<td>${v || '—'}</td>`).join('')}</tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top:12px; display:flex; gap:12px; flex-wrap:wrap;">
                <button class="btn btn-success" id="confirmImport"><i class="fas fa-check"></i> Подтвердить импорт (${total})</button>
                <button class="btn btn-secondary" onclick="document.getElementById('previewContainer').innerHTML='';">Отмена</button>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

async function importData(data) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = '50%';

    try {
        const existing = await loadFromBin();
        let imported = 0;

        for (const row of data) {
            if (row.name) {
                const obj = {
                    id: generateId(),
                    name: row.name || row['Название'] || '',
                    category: row.category || row['Категория'] || '—',
                    phone: row.phone || row['Телефон'] || '—',
                    website: row.website || row['Сайт'] || '',
                    rating: parseFloat(row.rating || row['Рейтинг']) || 0,
                    status: row.status || row['Статус'] || 'new',
                    priority: row.priority || row['Приоритет'] || 'medium',
                    notes: row.notes || row['Заметки'] || '',
                    favorite: row.favorite === 'true' || row.favorite === 'True' || row['Избранное'] === 'true',
                    history: [{ date: new Date().toLocaleString(), type: 'import', note: 'Импортировано из CSV' }]
                };
                existing.push(obj);
                imported++;
            }
        }

        if (progressBar) progressBar.style.width = '80%';
        await saveToBin(existing);
        if (progressBar) progressBar.style.width = '100%';

        showToast(`✅ Импортировано ${imported} записей!`);
        setTimeout(() => {
            window.location.href = 'clients.html';
        }, 1500);

    } catch (e) {
        showToast('Ошибка импорта: ' + e.message);
        if (progressBar) progressBar.style.width = '0%';
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) {
        const div = document.createElement('div');
        div.className = 'toast';
        div.id = 'toast';
        div.innerHTML = `<i class="fas fa-check-circle"></i> <span>${msg}</span>`;
        document.body.appendChild(div);
        setTimeout(() => div.style.display = 'flex', 100);
        setTimeout(() => div.style.display = 'none', 3000);
    } else {
        toast.querySelector('span').textContent = msg;
        toast.style.display = 'flex';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }
}
