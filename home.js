// عند تحميل الصفحة، ننشئ تاب الرئيسية فوراً
document.addEventListener('DOMContentLoaded', () => {
    createHomeTab();
});

function createHomeTab() {
    const container = document.getElementById('tabs-container');
    const tab = document.createElement('div');
    tab.className = 'tab active';
    tab.setAttribute('data-tab', 'Home');
    // لاحظ أننا لم نضع زر الإغلاق × هنا
    tab.innerHTML = `Home`; 
    tab.onclick = () => switchTab('Home');
    container.appendChild(tab);
}

function openTab(title, url) {
    const container = document.getElementById('tabs-container');
    const contentArea = document.getElementById('main-content-area');
    const dashboard = document.getElementById('home-dashboard');

    // إخفاء الداشبورد الرئيسي إذا كنا نفتح شيئاً آخر
    dashboard.style.display = 'none';

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    let existingTab = document.querySelector(`[data-tab="${title}"]`);
    
    if (!existingTab) {
        const tab = document.createElement('div');
        tab.className = 'tab active';
        tab.setAttribute('data-tab', title);
        // زر الإغلاق يظهر فقط للتابات الجديدة
        tab.innerHTML = `${title} <span style="margin-left:10px; cursor:pointer" onclick="event.stopPropagation(); closeTab('${title}')">×</span>`;
        tab.onclick = () => switchTab(title);
        container.appendChild(tab);

        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.className = 'tab-content active';
        iframe.id = `content-${title}`;
        contentArea.appendChild(iframe);
    } else {
        existingTab.classList.add('active');
        document.getElementById(`content-${title}`).classList.add('active');
    }
}

function switchTab(title) {
    const dashboard = document.getElementById('home-dashboard');
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === title));
    
    if (title === 'Home') {
        dashboard.style.display = 'block';
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    } else {
        dashboard.style.display = 'none';
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `content-${title}`));
    }
}

function closeTab(title) {
    // نمنع إغلاق الهوم لو حاول أحد
    if (title === 'Home') return;

    const tab = document.querySelector(`[data-tab="${title}"]`);
    const content = document.getElementById(`content-${title}`);
    tab.remove();
    content.remove();
    
    // نعود للرئيسية تلقائياً
    switchTab('Home');
}