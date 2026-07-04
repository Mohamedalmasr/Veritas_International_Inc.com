document.addEventListener('DOMContentLoaded', () => {
    initTabs();
});

function initTabs() {
    const container = document.getElementById('tabs-container');
    // إضافة تاب الهوم الثابتة
    const tab = document.createElement('div');
    tab.className = 'tab active';
    tab.setAttribute('data-tab', 'Home');
    tab.innerHTML = `Home`; 
    tab.onclick = () => switchTab('Home');
    container.appendChild(tab);
}

function openTab(title, url) {
    const container = document.getElementById('tabs-container');
    const contentArea = document.getElementById('main-content-area');
    const dashboard = document.getElementById('home-dashboard');

    // إخفاء الداشبورد الرئيسي
    dashboard.style.display = 'none';

    // إخفاء جميع محتويات التابات الأخرى أولاً
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    // التحقق إذا كانت التاب موجودة
    let existingTab = document.querySelector(`[data-tab="${title}"]`);
    
    if (!existingTab) {
        // إنشاء زر التاب
        const tab = document.createElement('div');
        tab.className = 'tab active';
        tab.setAttribute('data-tab', title);
        tab.innerHTML = `${title} <span style="margin-left:10px; cursor:pointer" onclick="event.stopPropagation(); closeTab('${title}')">×</span>`;
        tab.onclick = () => switchTab(title);
        container.appendChild(tab);

        // إنشاء iframe مستقل لكل صفحة
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.className = 'tab-content active';
        iframe.id = `content-${title}`;
        iframe.style.display = 'block'; // إظهار هذا التاب فقط
        iframe.style.width = '100%';
        iframe.style.height = 'calc(100vh - 150px)';
        iframe.style.border = 'none';
        contentArea.appendChild(iframe);
    } else {
        existingTab.classList.add('active');
        const content = document.getElementById(`content-${title}`);
        content.style.display = 'block'; // إظهار المحتوى الخاص بهذه التاب فقط
    }
}

function switchTab(title) {
    const dashboard = document.getElementById('home-dashboard');
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === title));
    
    if (title === 'Home') {
        dashboard.style.display = 'block';
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    } else {
        dashboard.style.display = 'none';
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        const target = document.getElementById(`content-${title}`);
        if (target) target.style.display = 'block';
    }
}

function closeTab(title) {
    const tab = document.querySelector(`[data-tab="${title}"]`);
    const content = document.getElementById(`content-${title}`);
    if(tab) tab.remove();
    if(content) content.remove();
    switchTab('Home');
}