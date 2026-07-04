// icons.js - Icons Library Page

document.addEventListener("DOMContentLoaded", () => {
  console.log("%c✅ Icons Library page loaded successfully", "color: #0b3d91; font-weight: bold;");

  const iconsData = [
    {
      icon: "🏠",
      name: "Home",
      description: "Navigate to dashboard or main page"
    },
    {
      icon: "👤",
      name: "User Profile",
      description: "User account and personal information"
    },
    {
      icon: "⚙️",
      name: "Settings",
      description: "System and account preferences"
    },
    {
      icon: "📊",
      name: "Analytics",
      description: "Reports and data visualization"
    },
    {
      icon: "📋",
      name: "Documents",
      description: "View and manage documents"
    },
    {
      icon: "➕",
      name: "Add New",
      description: "Create new record or entry"
    },
    {
      icon: "✏️",
      name: "Edit",
      description: "Modify existing information"
    },
    {
      icon: "🗑️",
      name: "Delete",
      description: "Remove record permanently"
    },
    {
      icon: "🔍",
      name: "Search",
      description: "Search through records or data"
    },
    {
      icon: "📧",
      name: "Email",
      description: "Email communication"
    },
    {
      icon: "📱",
      name: "Phone",
      description: "Phone number or contact"
    },
    {
      icon: "❓",
      name: "Help",
      description: "Help and support center"
    },
    {
      icon: "✅",
      name: "Success",
      description: "Action completed successfully"
    },
    {
      icon: "⚠️",
      name: "Warning",
      description: "Important warning or alert"
    },
    {
      icon: "❌",
      name: "Error",
      description: "Error or failed action"
    },
    {
      icon: "📄",
      name: "Report",
      description: "Generate or view reports"
    },
    {
      icon: "💼",
      name: "Organization",
      description: "Company or organization details"
    },
    {
      icon: "👥",
      name: "Team",
      description: "Users and team management"
    },
    {
      icon: "🔒",
      name: "Security",
      description: "Security and permissions"
    },
    {
      icon: "📅",
      name: "Calendar",
      description: "Date and schedule management"
    }
  ];

  const grid = document.getElementById("icons-grid");

  iconsData.forEach(item => {
    const card = document.createElement("div");
    card.className = "icon-card";
    
    card.innerHTML = `
      <div class="icon-wrapper">
        <span class="icon">${item.icon}</span>
      </div>
      <div class="icon-name">${item.name}</div>
      <div class="icon-description">${item.description}</div>
      <div class="tooltip">${item.name} - ${item.description}</div>
    `;

    // Optional: Click effect
    card.addEventListener("click", () => {
      card.style.transform = "scale(0.95)";
      setTimeout(() => {
        card.style.transform = "scale(1)";
      }, 150);
      
      // You can later add copy to clipboard functionality here
      console.log(`Icon clicked: ${item.name}`);
    });

    grid.appendChild(card);
  });
});