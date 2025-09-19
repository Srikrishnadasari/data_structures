# Alumni Connect – Static SPA

A no-build, CDN-powered single page app implementing the architecture:
- Alumni: Update Profile, Share Achievements, Mentor Students, Contribute Donations
- Students: Seek Mentorship, Apply for Internships, Attend Alumni Events
- Faculty: Create Events, Share Announcements, Coordinate with Alumni
- Admin: Manage Alumni Database, Approve Interactions, Manage Events, Generate Reports
- Extras: Analytics (Chart.js), Leaderboards, Messaging, AI-style recommendations, Dark mode, CSV import/export, LocalStorage persistence

## Run
- Open `index.html` directly in your browser, or from the folder:
```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Notes
- Data is persisted in `localStorage` under `alumni_portal_db`. Reset from Settings.
- UI powered by Tailwind + DaisyUI via CDN. Charts via Chart.js via CDN.
