/* Mock DB with localStorage persistence */
window.DEMO_DB = {
  alumni: [
    { id: 'a1', name: 'Aarav Sharma', batch: 2018, dept: 'CSE', role: 'SWE @ FinTech', skills: ['React', 'Node', 'Cloud'], location: 'Bengaluru', donations: 35000, mentorships: 6, achievements: ['Best Innovator 2023'] },
    { id: 'a2', name: 'Diya Patel', batch: 2016, dept: 'ECE', role: 'Product @ HealthTech', skills: ['PM', 'UX', 'AI'], location: 'Pune', donations: 120000, mentorships: 12, achievements: ['Top Mentor 2024'] },
    { id: 'a3', name: 'Karthik Iyer', batch: 2020, dept: 'ME', role: 'Founder @ RoboWorks', skills: ['Robotics', 'ML'], location: 'Chennai', donations: 25000, mentorships: 3, achievements: [] }
  ],
  students: [
    { id: 's1', name: 'Neha Gupta', year: 3, dept: 'CSE', interests: ['AI', 'Frontend'], seeking: 'Mentorship' },
    { id: 's2', name: 'Rohit Verma', year: 4, dept: 'ECE', interests: ['Embedded', 'Product'], seeking: 'Internship' }
  ],
  faculty: [
    { id: 'f1', name: 'Prof. Rao', dept: 'CSE', email: 'rao@college.edu' }
  ],
  events: [
    { id: 'e1', title: 'Alumni Meetup 2025', date: '2025-11-10', location: 'Campus Auditorium', capacity: 300, attendees: 126 },
    { id: 'e2', title: 'Mentor Hours: Frontend', date: '2025-10-02', location: 'Online', capacity: 100, attendees: 74 }
  ],
  internships: [
    { id: 'i1', role: 'Frontend Intern', company: 'FinTechX', location: 'Remote', stipend: 25000, tags: ['React', 'Tailwind'], posted: '2025-09-01' },
    { id: 'i2', role: 'Hardware Intern', company: 'ChipLabs', location: 'Pune', stipend: 20000, tags: ['Embedded', 'C'], posted: '2025-08-21' }
  ],
  mentorshipRequests: [
    { id: 'm1', studentId: 's1', area: 'Frontend', status: 'Pending', preferredMentorId: 'a1' }
  ],
  approvals: [
    { id: 'ap1', type: 'Mentorship', refId: 'm1', status: 'Pending' }
  ],
  donationsLedger: [
    { date: '2025-05-01', amount: 12000 },
    { date: '2025-06-01', amount: 18000 },
    { date: '2025-07-01', amount: 22000 },
    { date: '2025-08-01', amount: 28000 }
  ],
  notifications: [
    { id: 'n1', text: 'New mentorship request from Neha Gupta', ts: Date.now() - 3600_000 },
    { id: 'n2', text: 'Alumni Meetup registrations crossed 100!', ts: Date.now() - 7200_000 }
  ],
  badges: [
    { id: 'b1', label: 'Top Mentor', criteria: '10+ mentorships' },
    { id: 'b2', label: 'Philanthropist', criteria: '₹100k+ donated' }
  ]
};

(function hydrate() {
  const key = 'alumni_portal_db';
  const stored = localStorage.getItem(key);
  if (stored) {
    try { window.DB = JSON.parse(stored); }
    catch { window.DB = window.DEMO_DB; }
  } else {
    window.DB = window.DEMO_DB;
    localStorage.setItem(key, JSON.stringify(window.DB));
  }
  window.persistDB = () => localStorage.setItem(key, JSON.stringify(window.DB));
})();
