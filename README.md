# To-Do App

A clean, dark-themed to-do list app with priority levels, filters, and localStorage persistence.

## Features Implemented

- ✅ Add tasks with a text input + Enter key support
- ✅ Priority selector (Low / Medium / High) with color-coded labels
- ✅ Mark tasks as complete (checkbox — completed tasks move to bottom with strikethrough)
- ✅ Delete individual tasks (with slide-out animation)
- ✅ Edit task text inline
- ✅ Filter buttons: All / Pending / Completed
- ✅ Clear all completed tasks at once
- ✅ LocalStorage persistence (tasks survive page reload)
- ✅ Animated task entry/exit
- ✅ Empty state display
- ✅ Fully responsive (mobile-friendly)
- ✅ Keyboard accessible (Tab/Enter/Space navigation)

## How to Run

Just open `index.html` in any modern browser — no build step or server needed.

```
todo-app/
├── index.html   # Markup & structure
├── style.css    # All styling & animations
├── app.js       # All JavaScript logic
└── README.md
```

## Design Choices

- **Dark editorial theme** with amber (#e8b84b) accent
- **Playfair Display** display font + **DM Sans** body font
- Priority shown via left-side colored accent bar and badge
- Hover-reveal action buttons for a clean, uncluttered layout
- Noise texture overlay for depth

## Bonus Features

- Shake animation on empty submit attempt
- Smooth slide-in / slide-out task animations
- Tasks sorted: pending first, then completed
- XSS protection via DOM text node sanitization
