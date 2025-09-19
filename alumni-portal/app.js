/* SPA Router + Views + Interactions */
(function () {
  let activeCharts = [];

  function q(sel, root = document) { return root.querySelector(sel); }
  function qq(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function fmtINR(n) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n); }
  function nowStr() { return new Date().toISOString().slice(0, 16).replace('T', ' '); }

  function initChrome() {
    feather.replace();
    q('#theme-toggle').onclick = () => {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      html.setAttribute('data-theme', next);
    };
    q('#clear-storage').onclick = () => {
      localStorage.removeItem('alumni_portal_db');
      location.reload();
    };
    q('#cta-mentorship').onclick = () => { location.hash = '#/students'; };

    q('#notifications-btn').onclick = () => {
      const items = DB.notifications.map(n => `<div class="alert alert-info"><i data-feather="bell"></i><span>${n.text}</span></div>`).join('');
      const modalBody = `<div class="space-y-3">${items || '<div class="text-sm opacity-60">No notifications</div>'}</div>`;
      showMessagesModal('Notifications', modalBody, false);
      q('#notif-dot')?.classList.add('hidden');
      feather.replace();
    };

    q('#global-search').addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      window.GLOBAL_SEARCH_TERM = term;
      if (['#/alumni', '#/students', '#/admin', '#/leaderboard'].includes(location.hash)) {
        render();
      }
    });

    q('#active-users').textContent = Math.max(42, Math.floor(Math.random() * 100));
    if ((DB.notifications || []).length) q('#notif-dot')?.classList.remove('hidden');
  }

  function showMessagesModal(title, bodyHtml, showComposer = true) {
    const dlg = q('#modal-messages');
    const body = q('#messages-body');
    body.innerHTML = `<h4 class="font-semibold text-base mb-2">${title}</h4>${bodyHtml}`;
    q('#message-input').parentElement.classList.toggle('hidden', !showComposer);
    dlg.showModal();
  }

  const routes = {
    '#/overview': renderOverview,
    '#/alumni': renderAlumni,
    '#/students': renderStudents,
    '#/faculty': renderFaculty,
    '#/admin': renderAdmin,
    '#/analytics': renderAnalytics,
    '#/leaderboard': renderLeaderboards,
    '#/messages': () => renderMessages(true),
    '#/settings': renderSettings,
    '#/about': renderAbout,
    '#/privacy': renderPrivacy,
    '#/help': renderHelp
  };

  function destroyCharts() {
    activeCharts.forEach(c => c?.destroy());
    activeCharts = [];
  }

  function render() {
    destroyCharts();
    const route = location.hash || '#/overview';
    const view = routes[route] || renderOverview;
    view();
    feather.replace();
  }

  function renderOverview() {
    const totalDonations = DB.alumni.reduce((s, a) => s + (a.donations || 0), 0);
    const totalMentorships = DB.alumni.reduce((s, a) => s + (a.mentorships || 0), 0);
    const upcoming = DB.events.filter(e => new Date(e.date) >= new Date()).slice(0, 3);

    q('#content').innerHTML = `
      <section class="grid gap-6 xl:grid-cols-4 lg:grid-cols-2">
        <div class="stats shadow bg-base-100">
          <div class="stat">
            <div class="stat-figure text-primary"><i data-feather="users"></i></div>
            <div class="stat-title">Alumni</div>
            <div class="stat-value">${DB.alumni.length}</div>
            <div class="stat-desc">active on platform</div>
          </div>
          <div class="stat">
            <div class="stat-figure text-secondary"><i data-feather="heart"></i></div>
            <div class="stat-title">Donations</div>
            <div class="stat-value text-secondary">${fmtINR(totalDonations)}</div>
            <div class="stat-desc">all-time</div>
          </div>
          <div class="stat">
            <div class="stat-figure text-accent"><i data-feather="handshake"></i></div>
            <div class="stat-title">Mentorships</div>
            <div class="stat-value text-accent">${totalMentorships}</div>
            <div class="stat-desc">completed</div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl col-span-2">
          <div class="card-body">
            <h2 class="card-title">Donations Over Time</h2>
            <canvas id="chart-donations" height="110"></canvas>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Quick Actions</h2>
            <div class="flex flex-wrap gap-2">
              <a href="#/students" class="btn btn-primary btn-sm">Seek Mentorship</a>
              <a href="#/alumni" class="btn btn-secondary btn-sm">Share Achievement</a>
              <a href="#/faculty" class="btn btn-accent btn-sm">Create Event</a>
              <a href="#/admin" class="btn btn-info btn-sm">Manage DB</a>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl col-span-2">
          <div class="card-body">
            <h2 class="card-title">Upcoming Events</h2>
            <div class="grid md:grid-cols-3 gap-3">
              ${upcoming.map(ev => `
                <div class="card bg-base-200">
                  <div class="card-body">
                    <h3 class="font-semibold">${ev.title}</h3>
                    <p class="text-sm opacity-70"><i data-feather="calendar"></i> ${ev.date} · ${ev.location}</p>
                    <progress class="progress progress-primary w-full" value="${ev.attendees}" max="${ev.capacity}"></progress>
                    <div class="card-actions justify-end">
                      <button class="btn btn-sm" data-join="${ev.id}">Join</button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">AI Recommendations</h2>
            <p class="text-sm opacity-75">Curated mentor suggestions based on interests and skills.</p>
            <div id="ai-reco" class="mt-2 space-y-2"></div>
          </div>
        </div>
      </section>
    `;

    qq('[data-join]').forEach(btn => btn.onclick = () => {
      const id = btn.getAttribute('data-join');
      const ev = DB.events.find(e => e.id === id);
      if (ev) { ev.attendees = Math.min(ev.capacity, ev.attendees + 1); persistDB(); renderOverview(); }
    });

    const ctx = q('#chart-donations');
    const labels = DB.donationsLedger.map(d => d.date);
    const values = DB.donationsLedger.map(d => d.amount);
    activeCharts.push(new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Donations (INR)', data: values, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', tension: 0.35, fill: true }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    }));

    const topMentors = [...DB.alumni].sort((a,b) => (b.mentorships||0) - (a.mentorships||0)).slice(0,3);
    q('#ai-reco').innerHTML = topMentors.map(a => `
      <div class="alert bg-base-200">
        <i data-feather="user-check"></i>
        <div>
          <div class="font-medium">${a.name}</div>
          <div class="text-xs opacity-70">${a.role} · ${a.location} · Skills: ${a.skills.join(', ')}</div>
        </div>
        <button class="btn btn-primary btn-xs ml-auto" data-message="${a.id}">Message</button>
      </div>
    `).join('');
    qq('[data-message]').forEach(b => b.onclick = () => renderMessages(true, b.getAttribute('data-message')));
  }

  function renderAlumni() {
    const term = (window.GLOBAL_SEARCH_TERM || '');
    const list = DB.alumni.filter(a => {
      const blob = `${a.name} ${a.role} ${a.dept} ${a.location} ${a.skills.join(' ')}`.toLowerCase();
      return blob.includes(term);
    });
    q('#content').innerHTML = `
      <section class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-semibold">Alumni Directory</h2>
            <div class="flex gap-2">
              <button id="export-csv" class="btn btn-outline btn-sm"><i data-feather="download"></i>Export CSV</button>
              <label class="btn btn-outline btn-sm">
                <i data-feather="upload"></i>Import CSV
                <input id="import-csv" type="file" accept=".csv" class="hidden" />
              </label>
            </div>
          </div>
          <div class="grid md:grid-cols-2 gap-4">
            ${list.map(a => `
              <div class="card bg-base-100 shadow">
                <div class="card-body">
                  <div class="flex items-start justify-between">
                    <div>
                      <h3 class="card-title">${a.name}</h3>
                      <p class="text-sm opacity-70">${a.role} · ${a.location}</p>
                      <div class="mt-2 flex flex-wrap gap-2">
                        ${a.skills.map(s => `<div class="badge badge-outline">${s}</div>`).join('')}
                      </div>
                    </div>
                    ${badge(a)}
                  </div>
                  <div class="grid grid-cols-3 gap-2 mt-3">
                    <div class="stat bg-base-200 rounded-box stat-ring">
                      <div class="stat-title">Donations</div>
                      <div class="stat-value text-primary text-lg">${fmtINR(a.donations || 0)}</div>
                    </div>
                    <div class="stat bg-base-200 rounded-box">
                      <div class="stat-title">Mentorships</div>
                      <div class="stat-value text-lg">${a.mentorships || 0}</div>
                    </div>
                    <div class="stat bg-base-200 rounded-box">
                      <div class="stat-title">Batch</div>
                      <div class="stat-value text-lg">${a.batch}</div>
                    </div>
                  </div>
                  <div class="card-actions justify-end">
                    <button class="btn btn-primary btn-sm" data-msg="${a.id}">Message</button>
                    <button class="btn btn-secondary btn-sm" data-mentor="${a.id}">Offer Mentorship</button>
                    <button class="btn btn-accent btn-sm" data-donate="${a.id}">Donate</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="space-y-4">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h3 class="card-title">Update Profile</h3>
              <div class="form-control">
                <label class="label"><span class="label-text">Name</span></label>
                <input id="al-name" class="input input-bordered" placeholder="Your name" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Role</span></label>
                <input id="al-role" class="input input-bordered" placeholder="Current role" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Skills (comma separated)</span></label>
                <input id="al-skills" class="input input-bordered" placeholder="React, Node, Cloud" />
              </div>
              <button id="al-save" class="btn btn-primary mt-3">Save</button>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h3 class="card-title">Share Achievement</h3>
              <input id="al-achievement" class="input input-bordered" placeholder="Achievement title" />
              <button id="al-add-achievement" class="btn btn-secondary">Add</button>
              <div class="divider"></div>
              <ul class="list-disc ml-6 text-sm" id="al-ach-list">
                ${(DB.alumni[0]?.achievements || []).map(a => `<li>${a}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      </section>
    `;

    qq('[data-msg]').forEach(b => b.onclick = () => renderMessages(true, b.getAttribute('data-msg')));
    qq('[data-mentor]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-mentor');
      const al = DB.alumni.find(a => a.id === id);
      if (al) { al.mentorships = (al.mentorships || 0) + 1; persistDB(); toast('Mentorship offered'); renderAlumni(); }
    });
    qq('[data-donate]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-donate');
      const al = DB.alumni.find(a => a.id === id);
      const amount = Math.round(5000 + Math.random() * 20000);
      if (al) {
        al.donations = (al.donations || 0) + amount;
        DB.donationsLedger.push({ date: new Date().toISOString().slice(0,10), amount });
        persistDB(); toast(`Donation recorded: ${fmtINR(amount)}`); renderAlumni();
      }
    });

    q('#al-save').onclick = () => {
      const self = DB.alumni[0];
      self.name = q('#al-name').value || self.name;
      self.role = q('#al-role').value || self.role;
      const skills = q('#al-skills').value.trim();
      if (skills) self.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
      persistDB(); toast('Profile updated');
      renderAlumni();
    };
    q('#al-add-achievement').onclick = () => {
      const val = q('#al-achievement').value.trim();
      if (!val) return;
      DB.alumni[0].achievements = DB.alumni[0].achievements || [];
      DB.alumni[0].achievements.push(val);
      persistDB(); q('#al-achievement').value = '';
      q('#al-ach-list').innerHTML = DB.alumni[0].achievements.map(a => `<li>${a}</li>`).join('');
      toast('Achievement added');
    };

    q('#export-csv').onclick = () => {
      const header = ['id','name','batch','dept','role','skills','location','donations','mentorships'];
      const rows = DB.alumni.map(a => [a.id,a.name,a.batch,a.dept,a.role,(a.skills||[]).join('|'),a.location,a.donations||0,a.mentorships||0]);
      const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
      download('alumni.csv', csv, 'text/csv');
    };
    q('#import-csv').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const lines = reader.result.split(/\r?\n/).filter(Boolean);
        const [head, ...rest] = lines;
        const cols = head.split(',');
        const arr = rest.map(line => {
          const cells = line.split(',');
          const obj = {}; cols.forEach((c,i)=> obj[c]=cells[i]);
          obj.batch = +obj.batch || 0;
          obj.donations = +obj.donations || 0;
          obj.mentorships = +obj.mentorships || 0;
          obj.skills = (obj.skills||'').split('|').filter(Boolean);
          return obj;
        });
        DB.alumni = arr; persistDB(); renderAlumni(); toast('CSV imported');
      };
      reader.readAsText(f);
    };
  }

  function badge(a) {
    const badges = [];
    if ((a.mentorships||0) >= 10) badges.push('<div class="badge badge-primary badge-outline">Top Mentor</div>');
    if ((a.donations||0) >= 100000) badges.push('<div class="badge badge-secondary badge-outline">Philanthropist</div>');
    return `<div class="flex gap-2">${badges.join('')}</div>`;
  }

  function renderStudents() {
    const term = (window.GLOBAL_SEARCH_TERM || '');
    q('#content').innerHTML = `
      <section class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-4">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Seek Mentorship</h2>
              <div class="grid md:grid-cols-2 gap-3">
                <select id="stu-area" class="select select-bordered">
                  <option>Frontend</option><option>Backend</option><option>AI</option><option>Robotics</option><option>Product</option>
                </select>
                <select id="stu-mentor" class="select select-bordered">
                  ${DB.alumni.map(a => `<option value="${a.id}">${a.name} – ${a.skills.join(' / ')}</option>`).join('')}
                </select>
              </div>
              <button id="stu-request" class="btn btn-primary mt-3">Request</button>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Internships</h2>
              <div class="grid md:grid-cols-2 gap-3">
                ${DB.internships.filter(i => (i.role+i.company+i.tags.join(' ')).toLowerCase().includes(term)).map(i => `
                  <div class="card bg-base-200">
                    <div class="card-body">
                      <h3 class="font-semibold">${i.role}</h3>
                      <p class="text-sm opacity-70">${i.company} · ${i.location}</p>
                      <div class="flex flex-wrap gap-2 my-2">
                        ${i.tags.map(t => `<div class="badge badge-outline">${t}</div>`).join('')}
                      </div>
                      <div class="text-sm">Stipend: <span class="font-medium">${fmtINR(i.stipend)}</span></div>
                      <button class="btn btn-sm btn-secondary mt-2" data-apply="${i.id}">Apply</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Alumni Events</h2>
              <div class="grid md:grid-cols-2 gap-3">
                ${DB.events.map(ev => `
                  <div class="card bg-base-200">
                    <div class="card-body">
                      <h3 class="font-semibold">${ev.title}</h3>
                      <p class="text-sm opacity-70"><i data-feather="calendar"></i> ${ev.date} · ${ev.location}</p>
                      <progress class="progress progress-accent w-full" value="${ev.attendees}" max="${ev.capacity}"></progress>
                      <button class="btn btn-sm btn-accent mt-2" data-register="${ev.id}">Register</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h3 class="card-title">My Mentorship Requests</h3>
              <div id="stu-req-list" class="space-y-2 text-sm"></div>
            </div>
          </div>
        </div>
      </section>
    `;

    q('#stu-request').onclick = () => {
      const m = {
        id: 'm' + Math.random().toString(36).slice(2,7),
        studentId: DB.students[0]?.id || 's_demo',
        area: q('#stu-area').value,
        status: 'Pending',
        preferredMentorId: q('#stu-mentor').value
      };
      DB.mentorshipRequests.push(m);
      DB.approvals.push({ id: 'ap' + Math.random().toString(36).slice(2,7), type: 'Mentorship', refId: m.id, status: 'Pending' });
      persistDB(); toast('Mentorship requested');
      renderStudents();
    };
    qq('[data-apply]').forEach(b => b.onclick = () => { toast('Application submitted'); });
    qq('[data-register]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-register');
      const ev = DB.events.find(e => e.id === id); if (ev) { ev.attendees++; persistDB(); renderStudents(); toast('Registered'); }
    });

    q('#stu-req-list').innerHTML = DB.mentorshipRequests.slice(-5).map(r => {
      const m = DB.alumni.find(a => a.id === r.preferredMentorId);
      return `<div class="alert ${r.status==='Approved' ? 'alert-success' : 'bg-base-200'}">
        <i data-feather="handshake"></i>
        <span>${r.area} with ${m?.name || 'Mentor'} — <b>${r.status}</b></span>
      </div>`;
    }).join('');
  }

  function renderFaculty() {
    q('#content').innerHTML = `
      <section class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-4">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Create Event</h2>
              <div class="grid md:grid-cols-3 gap-3">
                <input id="ev-title" class="input input-bordered" placeholder="Title" />
                <input id="ev-date" type="date" class="input input-bordered" />
                <input id="ev-location" class="input input-bordered" placeholder="Location" />
              </div>
              <div class="grid md:grid-cols-3 gap-3 mt-2">
                <input id="ev-capacity" type="number" class="input input-bordered" placeholder="Capacity" />
                <button id="ev-create" class="btn btn-primary">Create</button>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Announcements</h2>
              <div class="flex gap-2">
                <input id="an-text" class="input input-bordered flex-1" placeholder="Announcement..." />
                <button id="an-post" class="btn btn-secondary">Post</button>
              </div>
              <div id="an-list" class="mt-3 space-y-2"></div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h3 class="card-title">Coordinate with Alumni</h3>
              <p class="text-sm opacity-70">Reach out to top mentors and donors.</p>
              <div class="flex flex-col gap-2">
                ${[...DB.alumni].sort((a,b) => (b.mentorships||0) - (a.mentorships||0)).slice(0,5).map(a => `
                  <button class="btn btn-outline btn-sm" data-ping="${a.id}">
                    <i data-feather="send"></i>${a.name} — ${a.role}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    q('#ev-create').onclick = () => {
      const ev = {
        id: 'e' + Math.random().toString(36).slice(2,7),
        title: q('#ev-title').value || 'Untitled Event',
        date: q('#ev-date').value || new Date().toISOString().slice(0,10),
        location: q('#ev-location').value || 'Campus',
        capacity: +q('#ev-capacity').value || 100,
        attendees: 0
      };
      DB.events.unshift(ev); persistDB(); toast('Event created'); renderFaculty();
    };
    const announcements = DB.announcements = DB.announcements || [];
    q('#an-post').onclick = () => {
      const txt = q('#an-text').value.trim(); if (!txt) return;
      announcements.unshift({ text: txt, ts: nowStr() }); persistDB(); renderFaculty();
    };
    q('#an-list').innerHTML = announcements.map(a => `<div class="alert bg-base-200"><i data-feather="megaphone"></i><span>${a.text}</span><span class="ml-auto text-xs opacity-60">${a.ts}</span></div>`).join('');
    qq('[data-ping]').forEach(b => b.onclick = () => { toast('Message sent'); });
  }

  function renderAdmin() {
    const term = (window.GLOBAL_SEARCH_TERM || '');
    const list = DB.alumni.filter(a => (a.name + a.role + a.location + a.dept).toLowerCase().includes(term));
    q('#content').innerHTML = `
      <section class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-4">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Manage Alumni Database</h2>
              <div class="overflow-x-auto">
                <table class="table table-zebra">
                  <thead><tr><th>Name</th><th>Batch</th><th>Dept</th><th>Role</th><th>Location</th><th>Donations</th><th>Actions</th></tr></thead>
                  <tbody>
                    ${list.map(a => `
                      <tr>
                        <td>${a.name}</td><td>${a.batch}</td><td>${a.dept}</td><td>${a.role}</td><td>${a.location}</td>
                        <td>${fmtINR(a.donations || 0)}</td>
                        <td>
                          <button class="btn btn-ghost btn-xs text-primary" data-edit="${a.id}">Edit</button>
                          <button class="btn btn-ghost btn-xs text-error" data-del="${a.id}">Delete</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title">Manage Events</h2>
              <div class="grid md:grid-cols-2 gap-3">
                ${DB.events.map(e => `
                  <div class="card bg-base-200">
                    <div class="card-body">
                      <h3 class="font-semibold">${e.title}</h3>
                      <p class="text-sm opacity-70">${e.date} · ${e.location}</p>
                      <progress class="progress progress-primary w-full" value="${e.attendees}" max="${e.capacity}"></progress>
                      <div class="flex gap-2 justify-end">
                        <button class="btn btn-xs" data-ev-edit="${e.id}">Edit</button>
                        <button class="btn btn-xs btn-error" data-ev-del="${e.id}">Remove</button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h3 class="card-title">Approve Interactions</h3>
              <div class="space-y-2">
                ${DB.approvals.map(ap => `
                  <div class="alert ${ap.status==='Approved'?'alert-success':'bg-base-200'}">
                    <i data-feather="shield"></i>
                    <span>${ap.type} — ${ap.refId}</span>
                    <div class="ml-auto flex gap-2">
                      <button class="btn btn-xs btn-primary" data-ap-ok="${ap.id}">Approve</button>
                      <button class="btn btn-xs btn-ghost" data-ap-rej="${ap.id}">Reject</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h3 class="card-title">Generate Reports</h3>
              <p class="text-sm opacity-70">Download key metrics for leadership.</p>
              <div class="flex gap-2">
                <button id="rep-overview" class="btn btn-outline btn-sm">Overview (CSV)</button>
                <button id="rep-donations" class="btn btn-outline btn-sm">Donations (CSV)</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    qq('[data-del]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-del');
      DB.alumni = DB.alumni.filter(a => a.id !== id);
      persistDB(); renderAdmin(); toast('Alumni removed');
    });
    qq('[data-edit]').forEach(b => b.onclick = () => { toast('Open edit drawer (demo)'); });

    qq('[data-ev-del]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-ev-del');
      DB.events = DB.events.filter(e => e.id !== id); persistDB(); renderAdmin(); toast('Event removed');
    });
    qq('[data-ev-edit]').forEach(b => b.onclick = () => { toast('Open event editor (demo)'); });

    qq('[data-ap-ok]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-ap-ok');
      const ap = DB.approvals.find(a => a.id === id);
      if (ap) { ap.status = 'Approved'; persistDB(); renderAdmin(); toast('Approved'); }
    });
    qq('[data-ap-rej]').forEach(b => b.onclick = () => {
      const id = b.getAttribute('data-ap-rej');
      DB.approvals = DB.approvals.filter(a => a.id !== id);
      persistDB(); renderAdmin(); toast('Rejected');
    });

    q('#rep-overview').onclick = () => {
      const csv = [
        'Metric,Value',
        `Alumni,${DB.alumni.length}`,
        `Events,${DB.events.length}`,
        `Donations,${DB.alumni.reduce((s,a)=>s+(a.donations||0),0)}`
      ].join('\n');
      download('overview_report.csv', csv, 'text/csv');
    };
    q('#rep-donations').onclick = () => {
      const csv = ['Date,Amount', ...DB.donationsLedger.map(d => `${d.date},${d.amount}`)].join('\n');
      download('donations_report.csv', csv, 'text/csv');
    };
  }

  function renderAnalytics() {
    q('#content').innerHTML = `
      <section class="grid gap-6 lg:grid-cols-3">
        <div class="card bg-base-100 shadow lg:col-span-2">
          <div class="card-body">
            <h2 class="card-title">Mentorships by Top Alumni</h2>
            <canvas id="chart-mentors" height="120"></canvas>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Internship Fill Rate</h2>
            <canvas id="chart-intern" height="120"></canvas>
          </div>
        </div>
      </section>
    `;
    const top = [...DB.alumni].sort((a,b)=> (b.mentorships||0)-(a.mentorships||0)).slice(0,5);
    activeCharts.push(new Chart(q('#chart-mentors'), {
      type: 'bar',
      data: { labels: top.map(a=>a.name), datasets: [{ label: 'Mentorships', data: top.map(a=>a.mentorships||0), backgroundColor: '#10b981' }] },
      options: { plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
    }));
    activeCharts.push(new Chart(q('#chart-intern'), {
      type: 'doughnut',
      data: { labels: ['Open Roles', 'Filled'], datasets: [{ data: [8, 12], backgroundColor: ['#f59e0b','#3b82f6'] }] },
      options: { plugins:{legend:{position:'bottom'}} }
    }));
  }

  function renderLeaderboards() {
    const donors = [...DB.alumni].sort((a,b)=>(b.donations||0)-(a.donations||0)).slice(0,5);
    const mentors = [...DB.alumni].sort((a,b)=>(b.mentorships||0)-(a.mentorships||0)).slice(0,5);
    q('#content').innerHTML = `
      <section class="grid gap-6 md:grid-cols-2">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Top Donors</h2>
            <ul class="menu bg-base-200 rounded-box">
              ${donors.map((a,i)=> `<li><a><span class="kbd kbd-xs">${i+1}</span> ${a.name}<span class="ml-auto font-semibold">${fmtINR(a.donations||0)}</span></a></li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Top Mentors</h2>
            <ul class="menu bg-base-200 rounded-box">
              ${mentors.map((a,i)=> `<li><a><span class="kbd kbd-xs">${i+1}</span> ${a.name}<span class="ml-auto font-semibold">${a.mentorships||0}</span></a></li>`).join('')}
            </ul>
          </div>
        </div>
      </section>
    `;
  }

  function renderMessages(show = false, prefillUserId = null) {
    const thread = DB.messages = DB.messages || [];
    const body = `
      <div class="space-y-2">
        ${thread.slice(-20).map(m => `
          <div class="chat ${m.me ? 'chat-end' : 'chat-start'}">
            <div class="chat-bubble ${m.me ? 'chat-bubble-primary' : ''}">${m.text}</div>
            <div class="chat-footer opacity-60">${m.ts}</div>
          </div>
        `).join('')}
      </div>
    `;
    showMessagesModal('Direct Messages', body, true);
    if (prefillUserId) q('#message-input').value = `@${prefillUserId} `;

    q('#message-send').onclick = () => {
      const val = q('#message-input').value.trim(); if (!val) return;
      thread.push({ me: true, text: val, ts: nowStr() }); persistDB();
      renderMessages(false); q('#message-input').value = '';
    };
  }

  function renderSettings() {
    q('#content').innerHTML = `
      <section class="grid gap-6 md:grid-cols-2">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Appearance</h2>
            <div class="flex gap-2">
              <button class="btn" data-theme="light">Light</button>
              <button class="btn" data-theme="dark">Dark</button>
              <button class="btn" data-theme="corporate">Corporate</button>
              <button class="btn" data-theme="forest">Forest</button>
            </div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Storage</h2>
            <button id="btn-reset" class="btn btn-outline btn-error">Reset Demo Data</button>
          </div>
        </div>
      </section>
    `;
    qq('[data-theme]').forEach(b => b.onclick = () => document.documentElement.setAttribute('data-theme', b.getAttribute('data-theme')));
    q('#btn-reset').onclick = () => { localStorage.removeItem('alumni_portal_db'); location.reload(); };
  }
  function renderAbout(){ q('#content').innerHTML = `<div class="prose"><h2>About</h2><p>Centralized Digital Alumni Engagement Platform to bridge Alumni, Students, Faculty, and Admin.</p></div>`; }
  function renderPrivacy(){ q('#content').innerHTML = `<div class="prose"><h2>Privacy</h2><p>This demo stores data locally in your browser via localStorage.</p></div>`; }
  function renderHelp(){ q('#content').innerHTML = `<div class="prose"><h2>Help</h2><p>Use the sidebar to navigate. Reset demo data from Settings.</p></div>`; }

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast toast-top toast-end z-50';
    el.innerHTML = `<div class="alert alert-success"><span>${msg}</span></div>`;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 1500);
  }
  function download(name, content, mime='text/plain') {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    URL.revokeObjectURL(a.href);
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('load', () => {
    initChrome();
    if (!location.hash) location.hash = '#/overview';
    render();
  });
})();
