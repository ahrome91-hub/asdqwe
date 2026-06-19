const BIN_ID = '6a34730dda38895dfeda3121';
const MASTER_KEY = '$2a$10$euK6kkgJrxsrsI06lUXdu.Zyp1byoA3eVeev6S/Kiol96uQejCvKa';
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

async function loadFromBin() {
    try {
        const resp = await fetch(BASE_URL, {
            headers: { 'X-Master-Key': MASTER_KEY }
        });
        const json = await resp.json();
        return json.record?.data || [];
    } catch (e) {
        console.warn('Ошибка загрузки:', e);
        return [];
    }
}

async function saveToBin(data) {
    try {
        await fetch(BASE_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': MASTER_KEY
            },
            body: JSON.stringify({ data })
        });
        return true;
    } catch (e) {
        console.warn('Ошибка сохранения:', e);
        return false;
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
}

function getStatusLabel(st) {
    const map = { new: 'Новое', contacted: 'В работе', meeting: 'Встреча', deal: 'Сделка', lost: 'Потеряно' };
    return map[st] || st;
}
