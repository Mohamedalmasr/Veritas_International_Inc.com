const emails = {
    1: { subject: "Regarding the new onboarding requirements", body: "Dear Jonathan, please provide the updated documentation for the new client onboarding process by Friday. Regards, Admin." },
    2: { subject: "Your ticket #9928 has been resolved", body: "Hello, your technical issue regarding the access portal has been fixed. Please verify. Best, Support Team." }
};

function openEmail(id) {
    document.getElementById('email-list-view').style.display = 'none';
    const detailView = document.getElementById('email-detail-view');
    detailView.style.display = 'block';
    
    document.getElementById('email-subject').innerText = emails[id].subject;
    document.getElementById('email-body').innerText = emails[id].body;
}

function backToInbox() {
    document.getElementById('email-list-view').style.display = 'block';
    document.getElementById('email-detail-view').style.display = 'none';
}

function sendReply() {
    const text = document.getElementById('reply-text').value;
    if(text.trim() === "") return alert("Please write something!");
    alert("Reply sent successfully!");
    document.getElementById('reply-text').value = "";
    backToInbox();
}