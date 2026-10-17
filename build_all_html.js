const fs = require('fs');
const path = require('path');

function getRelRoot(filePath) {
  const dir = path.dirname(filePath);
  const rel = path.relative(dir, '.').replace(/\\/g, '/');
  return rel ? (rel.endsWith('/') ? rel : rel + '/') : './';
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function htmlBoilerplate(title, relRoot, bodyContent, scriptContent = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Fynd ScopeDesk</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'floral-white': '#FFFCF2',
            'silver': '#CCC5B9',
            'charcoal-brown': '#403D39',
            'carbon-black': '#252422',
            'spicy-paprika': '#EB5E28',
          },
          fontFamily: {
            sans: ['Manrope', 'sans-serif'],
            display: ['Fraunces', 'serif'],
          }
        }
      }
    };
  </script>
  <style>
    :root {
      --floral-white: #FFFCF2;
      --silver: #CCC5B9;
      --charcoal-brown: #403D39;
      --carbon-black: #252422;
      --spicy-paprika: #EB5E28;
    }
    body {
      background-color: #FFFCF2;
      color: #252422;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid #CCC5B9;
      background: #FFFCF2;
      color: #403D39;
    }
    .badge-paprika {
      background: #EB5E28;
      color: #FFFFFF;
      border-color: #EB5E28;
    }
    .badge-carbon {
      background: #252422;
      color: #FFFCF2;
      border-color: #252422;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .btn-primary {
      background-color: #EB5E28;
      color: #FFFFFF;
      border: 1px solid #EB5E28;
    }
    .btn-primary:hover {
      background-color: #252422;
      border-color: #252422;
    }
    .btn-secondary {
      background-color: #FFFCF2;
      color: #252422;
      border: 1px solid #CCC5B9;
    }
    .btn-secondary:hover {
      background-color: #CCC5B9;
    }
    .btn-dark {
      background-color: #252422;
      color: #FFFCF2;
      border: 1px solid #252422;
    }
    .btn-dark:hover {
      background-color: #403D39;
    }
  </style>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="min-h-screen bg-floral-white flex flex-col">
  <!-- Global Top Bar -->
  <header class="border-b border-silver bg-white px-6 py-3">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="${relRoot}index.html" class="font-display font-bold text-xl text-carbon-black tracking-tight flex items-center gap-2">
          <span>Fynd ScopeDesk</span>
        </a>
        <span class="badge badge-carbon">[Standalone HTML]</span>
      </div>
      <nav class="flex items-center gap-4 text-xs font-semibold">
        <a href="${relRoot}index.html" class="text-charcoal-brown hover:text-spicy-paprika">Main App</a>
        <a href="${relRoot}app/(client)/client/page.html" class="text-charcoal-brown hover:text-spicy-paprika">Client Portal</a>
        <a href="${relRoot}app/(freelancer)/freelancer/page.html" class="text-charcoal-brown hover:text-spicy-paprika">Freelancer Portal</a>
        <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="text-charcoal-brown hover:text-spicy-paprika">Unified Workspace</a>
      </nav>
    </div>
  </header>

  <!-- Main Content Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-6">
    <div id="root">
      ${bodyContent}
    </div>
  </main>

  <footer class="border-t border-silver bg-white text-center py-4 text-xs text-charcoal-brown">
    <div class="max-w-7xl mx-auto flex items-center justify-between px-6">
      <span>Fynd ScopeDesk - Standalone View</span>
      <span>5-Color Palette: Floral White, Silver, Charcoal Brown, Carbon Black, Spicy Paprika</span>
      <span>Zero Emojis</span>
    </div>
  </footer>

  ${scriptContent ? `<script type="text/babel">\n${scriptContent}\n</script>` : ''}
</body>
</html>`;
}

// 1. app/layout.html
function buildAppLayout() {
  const filePath = 'app/layout.html';
  const relRoot = getRelRoot(filePath);
  const content = `
    <div class="max-w-4xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm">
      <div class="flex items-center justify-between border-b border-silver pb-4 mb-6">
        <div>
          <span class="badge badge-paprika mb-2">[Layout Root]</span>
          <h1 class="text-2xl font-display font-bold text-carbon-black">Root Application Shell (layout.tsx)</h1>
          <p class="text-xs text-charcoal-brown">Typography tokens: Fraunces (Headings) &amp; Manrope (Body)</p>
        </div>
        <a href="${relRoot}app/page.html" class="btn btn-primary">Open Landing Page →</a>
      </div>

      <div class="space-y-6">
        <div class="bg-floral-white border border-silver rounded-xl p-5">
          <h3 class="font-bold text-sm text-carbon-black mb-2">Design Tokens &amp; Theme Palette</h3>
          <div class="grid grid-cols-5 gap-3 text-center text-xs font-bold">
            <div class="p-3 rounded-lg border border-silver bg-[#FFFCF2] text-carbon-black">#FFFCF2<br><span class="text-[10px] font-normal">Floral White</span></div>
            <div class="p-3 rounded-lg border border-silver bg-[#CCC5B9] text-carbon-black">#CCC5B9<br><span class="text-[10px] font-normal">Silver</span></div>
            <div class="p-3 rounded-lg border border-silver bg-[#403D39] text-white">#403D39<br><span class="text-[10px] font-normal">Charcoal Brown</span></div>
            <div class="p-3 rounded-lg border border-silver bg-[#252422] text-white">#252422<br><span class="text-[10px] font-normal">Carbon Black</span></div>
            <div class="p-3 rounded-lg border border-silver bg-[#EB5E28] text-white">#EB5E28<br><span class="text-[10px] font-normal">Spicy Paprika</span></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="border border-silver rounded-xl p-5 bg-white">
            <h4 class="font-bold text-sm text-carbon-black mb-2">Client Routes (app/(client)/)</h4>
            <ul class="text-xs space-y-2 text-charcoal-brown">
              <li>• <a href="${relRoot}app/(client)/client/page.html" class="text-spicy-paprika hover:underline font-semibold">Client Dashboard (page.html)</a></li>
              <li>• <a href="${relRoot}app/(client)/client/jobs/page.html" class="text-spicy-paprika hover:underline font-semibold">Client Jobs List (page.html)</a></li>
              <li>• <a href="${relRoot}app/(client)/client/jobs/new/page.html" class="text-spicy-paprika hover:underline font-semibold">Post a Job (page.html)</a></li>
              <li>• <a href="${relRoot}app/(client)/client/projects/[id]/page.html" class="text-spicy-paprika hover:underline font-semibold">Project Overview &amp; SOW (page.html)</a></li>
            </ul>
          </div>

          <div class="border border-silver rounded-xl p-5 bg-white">
            <h4 class="font-bold text-sm text-carbon-black mb-2">Freelancer Routes (app/(freelancer)/)</h4>
            <ul class="text-xs space-y-2 text-charcoal-brown">
              <li>• <a href="${relRoot}app/(freelancer)/freelancer/page.html" class="text-spicy-paprika hover:underline font-semibold">Freelancer 3-Column Portal (page.html)</a></li>
              <li>• <a href="${relRoot}app/(freelancer)/freelancer/jobs/page.html" class="text-spicy-paprika hover:underline font-semibold">Jobs Discovery (page.html)</a></li>
              <li>• <a href="${relRoot}app/(freelancer)/freelancer/profile/page.html" class="text-spicy-paprika hover:underline font-semibold">Profile &amp; Privacy Guard (page.html)</a></li>
              <li>• <a href="${relRoot}app/(freelancer)/freelancer/projects/[id]/page.html" class="text-spicy-paprika hover:underline font-semibold">Project Workspace (page.html)</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Root Layout', relRoot, content), 'utf8');
}

// 2. app/page.html (Landing & Auth)
function buildAppPage() {
  const filePath = 'app/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function AuthApp() {
      const [role, setRole] = React.useState('freelancer');
      const [tab, setTab] = React.useState('login');
      const [handle, setHandle] = React.useState('Freelancer_Dev');

      const handleRoleChange = (newRole) => {
        setRole(newRole);
        setHandle(newRole === 'freelancer' ? 'Freelancer_Dev' : 'Client_A');
      };

      const handleSubmit = (e) => {
        e.preventDefault();
        if (role === 'freelancer') {
          window.location.href = '${relRoot}app/(freelancer)/freelancer/page.html';
        } else {
          window.location.href = '${relRoot}app/(client)/client/page.html';
        }
      };

      return (
        <div class="max-w-md mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm">
          <div class="text-center mb-6">
            <span class="badge badge-paprika mb-2">[Authentication]</span>
            <h1 class="text-2xl font-display font-bold text-carbon-black">Fynd ScopeDesk</h1>
            <p class="text-xs text-charcoal-brown mt-1">Privacy-First Freelancer Discovery &amp; Scope Change Desk</p>
          </div>

          <div class="flex bg-floral-white p-1 rounded-full border border-silver mb-6">
            <button
              type="button"
              onClick={() => setTab('login')}
              class={'flex-1 py-1.5 text-xs font-bold rounded-full transition-all ' + (tab === 'login' ? 'bg-carbon-black text-white' : 'text-charcoal-brown')}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              class={'flex-1 py-1.5 text-xs font-bold rounded-full transition-all ' + (tab === 'signup' ? 'bg-carbon-black text-white' : 'text-charcoal-brown')}
            >
              Sign Up (Anonymous)
            </button>
          </div>

          <form onSubmit={handleSubmit} class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-charcoal-brown mb-2">Select Workspace Role</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleChange('freelancer')}
                  class={'p-3 rounded-xl border text-center transition-all ' + (role === 'freelancer' ? 'border-spicy-paprika bg-floral-white ring-1 ring-spicy-paprika' : 'border-silver bg-white hover:bg-floral-white')}
                >
                  <span class="block text-xs font-extrabold text-carbon-black mb-1">[Freelancer]</span>
                  <span class="block text-[11px] text-charcoal-brown">Find jobs &amp; negotiate scope</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('client')}
                  class={'p-3 rounded-xl border text-center transition-all ' + (role === 'client' ? 'border-spicy-paprika bg-floral-white ring-1 ring-spicy-paprika' : 'border-silver bg-white hover:bg-floral-white')}
                >
                  <span class="block text-xs font-extrabold text-carbon-black mb-1">[Client]</span>
                  <span class="block text-[11px] text-charcoal-brown">Post jobs &amp; approve orders</span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-charcoal-brown mb-1">Anonymous Platform Display Name</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
                class="w-full px-3 py-2 border border-silver rounded-lg text-sm bg-floral-white font-semibold text-carbon-black focus:outline-none focus:border-carbon-black"
              />
              <p class="text-[11px] text-charcoal-brown mt-1.5">
                [Privacy Guarantee] No personal email or phone number is stored, requested, or exposed.
              </p>
            </div>

            <button type="submit" class="w-full btn btn-primary py-3 text-sm">
              {role === 'freelancer' ? 'Enter as Freelancer → (Open Portal)' : 'Enter as Client → (Open Portal)'}
            </button>
          </form>
        </div>
      );
    }
    ReactDOM.render(<AuthApp />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Sign In / Sign Up', relRoot, '', script), 'utf8');
}

// 3. app/(client)/layout.html
function buildClientLayout() {
  const filePath = 'app/(client)/layout.html';
  const relRoot = getRelRoot(filePath);
  const content = `
    <div class="max-w-4xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm">
      <div class="flex items-center justify-between border-b border-silver pb-4 mb-6">
        <div>
          <span class="badge badge-carbon mb-2">[Client Shell]</span>
          <h1 class="text-2xl font-display font-bold text-carbon-black">Client Shell Layout ((client)/layout.tsx)</h1>
          <p class="text-xs text-charcoal-brown">Navigation wrapper for client dashboard, job management, and project SOW change desk.</p>
        </div>
        <a href="${relRoot}app/(client)/client/page.html" class="btn btn-primary">Open Client Dashboard →</a>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <a href="${relRoot}app/(client)/client/page.html" class="p-5 border border-silver rounded-xl bg-floral-white hover:border-carbon-black transition-all">
          <span class="badge badge-paprika mb-2">[Dashboard]</span>
          <h3 class="font-bold text-sm text-carbon-black">Client Dashboard</h3>
          <p class="text-xs text-charcoal-brown mt-1">Overview of active projects, recent jobs, and pending change orders.</p>
        </a>
        <a href="${relRoot}app/(client)/client/jobs/new/page.html" class="p-5 border border-silver rounded-xl bg-floral-white hover:border-carbon-black transition-all">
          <span class="badge badge-carbon mb-2">[Post Job]</span>
          <h3 class="font-bold text-sm text-carbon-black">Post a Job</h3>
          <p class="text-xs text-charcoal-brown mt-1">Create a new job specification with budget, deadline, and deliverables.</p>
        </a>
        <a href="${relRoot}app/(client)/client/projects/[id]/page.html" class="p-5 border border-silver rounded-xl bg-floral-white hover:border-carbon-black transition-all">
          <span class="badge badge-paprika mb-2">[Projects]</span>
          <h3 class="font-bold text-sm text-carbon-black">Project Workspace</h3>
          <p class="text-xs text-charcoal-brown mt-1">Inspect SOW v1, upload amendments, and review ScopeDesk changes.</p>
        </a>
      </div>
    </div>
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Client Layout', relRoot, content), 'utf8');
}

// 4. app/(client)/client/page.html
function buildClientDashboardPage() {
  const filePath = 'app/(client)/client/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function ClientDashboard() {
      return (
        <div class="space-y-6">
          <div class="flex items-center justify-between bg-white border border-silver rounded-2xl p-6">
            <div>
              <span class="badge badge-carbon mb-2">[Role: Client_A]</span>
              <h1 class="text-2xl font-display font-bold text-carbon-black">Client Dashboard</h1>
              <p class="text-xs text-charcoal-brown">Manage your active contracts, baseline SOWs, and scope change approvals.</p>
            </div>
            <a href="${relRoot}app/(client)/client/jobs/new/page.html" class="btn btn-primary">+ Post New Job</a>
          </div>

          <!-- Metrics Grid -->
          <div class="grid grid-cols-4 gap-4">
            <div class="bg-white border border-silver rounded-xl p-4">
              <div class="text-xs text-charcoal-brown">Active Projects</div>
              <div class="text-2xl font-extrabold text-carbon-black mt-1">1</div>
              <div class="text-[11px] text-spicy-paprika mt-1 font-semibold">1 Freelancer Engaged</div>
            </div>
            <div class="bg-white border border-silver rounded-xl p-4">
              <div class="text-xs text-charcoal-brown">Committed Capacity</div>
              <div class="text-2xl font-extrabold text-carbon-black mt-1">8h / 10h</div>
              <div class="text-[11px] text-charcoal-brown mt-1">2h remaining capacity</div>
            </div>
            <div class="bg-white border border-silver rounded-xl p-4">
              <div class="text-xs text-charcoal-brown">Pending Scope Requests</div>
              <div class="text-2xl font-extrabold text-spicy-paprika mt-1">2</div>
              <div class="text-[11px] text-charcoal-brown mt-1">R1: Payment Checkout (6h)</div>
            </div>
            <div class="bg-white border border-silver rounded-xl p-4">
              <div class="text-xs text-charcoal-brown">Total SOW Value</div>
              <div class="text-2xl font-extrabold text-carbon-black mt-1">₹16,000</div>
              <div class="text-[11px] text-charcoal-brown mt-1">Before tax</div>
            </div>
          </div>

          <!-- My Projects List -->
          <div class="bg-white border border-silver rounded-2xl p-6">
            <h2 class="text-lg font-bold text-carbon-black mb-4 flex items-center justify-between">
              <span>My Projects</span>
              <span class="text-xs font-semibold text-charcoal-brown">1 active</span>
            </h2>
            <div class="border border-silver rounded-xl p-4 hover:border-carbon-black transition-all flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <a href="${relRoot}app/(client)/client/projects/[id]/page.html" class="font-bold text-carbon-black text-sm hover:text-spicy-paprika">
                    Project P1: Responsive Landing Page &amp; Contact Form
                  </a>
                  <span class="badge badge-carbon">[SOW v1 Locked]</span>
                </div>
                <div class="text-xs text-charcoal-brown">
                  Freelancer: <strong>Freelancer_Dev</strong> &nbsp;|&nbsp; Rate: ₹1,000/hr &nbsp;|&nbsp; Capacity: 10h Baseline
                </div>
              </div>
              <div class="flex items-center gap-3">
                <a href="${relRoot}app/(client)/client/projects/[id]/page.html" class="btn btn-secondary text-xs">View Project</a>
                <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="btn btn-primary text-xs">Open ScopeDesk Workspace →</a>
              </div>
            </div>
          </div>

          <!-- My Jobs List -->
          <div class="bg-white border border-silver rounded-2xl p-6">
            <h2 class="text-lg font-bold text-carbon-black mb-4 flex items-center justify-between">
              <span>My Job Posts</span>
              <a href="${relRoot}app/(client)/client/jobs/page.html" class="text-xs text-spicy-paprika hover:underline font-bold">View all →</a>
            </h2>
            <div class="border border-silver rounded-xl p-4 flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-bold text-sm text-carbon-black">Senior React &amp; Next.js Developer</span>
                  <span class="badge">[Active - Candidate Selected]</span>
                </div>
                <p class="text-xs text-charcoal-brown">Budget: ₹10,000 before tax &nbsp;|&nbsp; Deadline: Oct 28, 2026</p>
              </div>
              <a href="${relRoot}app/(client)/client/jobs/[id]/page.html" class="btn btn-secondary text-xs">Review Details</a>
            </div>
          </div>
        </div>
      );
    }
    ReactDOM.render(<ClientDashboard />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Client Dashboard', relRoot, '', script), 'utf8');
}

// 5. app/(client)/client/jobs/page.html
function buildClientJobsPage() {
  const filePath = 'app/(client)/client/jobs/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function ClientJobs() {
      const jobs = [
        { id: 'job_1', title: 'Senior React & Next.js Developer', budget: 10000, deadline: '2026-10-28', status: 'IN PROGRESS', applicants: 3 },
        { id: 'job_2', title: 'E-Commerce Checkout Integration', budget: 15000, deadline: '2026-11-05', status: 'OPEN', applicants: 5 },
        { id: 'job_3', title: 'AI Assistant Semantic Parser', budget: 20000, deadline: '2026-11-12', status: 'OPEN', applicants: 2 }
      ];

      return (
        <div class="space-y-6">
          <div class="flex items-center justify-between bg-white border border-silver rounded-2xl p-6">
            <div>
              <span class="badge badge-carbon mb-2">[Client Jobs Management]</span>
              <h1 class="text-2xl font-display font-bold text-carbon-black">My Posted Jobs</h1>
              <p class="text-xs text-charcoal-brown">Manage listings, view applicants, and initiate project contracts.</p>
            </div>
            <a href="${relRoot}app/(client)/client/jobs/new/page.html" class="btn btn-primary">+ Post New Job</a>
          </div>

          <div class="space-y-4">
            {jobs.map((j) => (
              <div key={j.id} class="bg-white border border-silver rounded-xl p-5 hover:border-carbon-black transition-all flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-carbon-black text-sm">{j.title}</span>
                    <span class="badge badge-carbon">[{j.status}]</span>
                  </div>
                  <div class="text-xs text-charcoal-brown">
                    Budget: ₹{j.budget.toLocaleString()} before tax &nbsp;|&nbsp; Deadline: {j.deadline} &nbsp;|&nbsp; Applicants: {j.applicants}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <a href="${relRoot}app/(client)/client/jobs/[id]/page.html" class="btn btn-secondary text-xs">Review Applicants ({j.applicants})</a>
                  <a href="${relRoot}app/(client)/client/jobs/new/page.html" class="btn btn-dark text-xs">Edit Job</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    ReactDOM.render(<ClientJobs />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('My Jobs', relRoot, '', script), 'utf8');
}

// 6. app/(client)/client/jobs/new/page.html
function buildClientNewJobPage() {
  const filePath = 'app/(client)/client/jobs/new/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function NewJobForm() {
      const [title, setTitle] = React.useState('');
      const [desc, setDesc] = React.useState('');
      const [budget, setBudget] = React.useState(10000);
      const [deadline, setDeadline] = React.useState('2026-10-31');
      const [submitted, setSubmitted] = React.useState(false);

      const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
          window.location.href = '${relRoot}app/(client)/client/jobs/page.html';
        }, 1500);
      };

      return (
        <div class="max-w-2xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm">
          <div class="mb-6 border-b border-silver pb-4">
            <span class="badge badge-paprika mb-2">[Job Creation]</span>
            <h1 class="text-2xl font-display font-bold text-carbon-black">Post a New Job</h1>
            <p class="text-xs text-charcoal-brown mt-1">Define clear deliverables and scope boundaries to prevent scope creep.</p>
          </div>

          {submitted ? (
            <div class="p-6 bg-floral-white border border-silver rounded-xl text-center space-y-3">
              <span class="badge badge-paprika font-bold text-sm">[Job Posted]</span>
              <h3 class="text-lg font-bold text-carbon-black">Job Created Successfully!</h3>
              <p class="text-xs text-charcoal-brown">Redirecting to My Jobs catalog...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} class="space-y-5">
              <div>
                <label class="block text-xs font-bold text-charcoal-brown mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js Landing Page &amp; WebRTC Calling Workspace"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  class="w-full px-3 py-2 border border-silver rounded-lg text-sm bg-floral-white focus:outline-none focus:border-carbon-black font-semibold"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-charcoal-brown mb-1">Scope Description &amp; Deliverables</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Describe included features (e.g. 1 landing page, contact form) and explicit exclusions..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  class="w-full px-3 py-2 border border-silver rounded-lg text-sm bg-floral-white focus:outline-none focus:border-carbon-black"
                ></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-charcoal-brown mb-1">Budget (INR, before tax)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    class="w-full px-3 py-2 border border-silver rounded-lg text-sm bg-floral-white focus:outline-none focus:border-carbon-black font-semibold"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-charcoal-brown mb-1">Project Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    class="w-full px-3 py-2 border border-silver rounded-lg text-sm bg-floral-white focus:outline-none focus:border-carbon-black font-semibold"
                  />
                </div>
              </div>

              <div class="pt-4 flex items-center justify-between border-t border-silver">
                <a href="${relRoot}app/(client)/client/jobs/page.html" class="btn btn-secondary text-xs">Cancel</a>
                <button type="submit" class="btn btn-primary text-xs">Publish Job Listing →</button>
              </div>
            </form>
          )}
        </div>
      );
    }
    ReactDOM.render(<NewJobForm />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Post a Job', relRoot, '', script), 'utf8');
}

// 7. app/(client)/client/jobs/[id]/page.html
function buildClientJobDetailPage() {
  const filePath = 'app/(client)/client/jobs/[id]/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function ClientJobDetail() {
      const applicants = [
        { id: 'app_1', name: 'Freelancer_Dev', rate: 1000, pitch: 'Expert in Next.js, WebRTC, and scope change contracts. Built 14 verified projects.', verified: true },
        { id: 'app_2', name: 'Dev_Alex', rate: 1200, pitch: 'Full stack engineer with experience in privacy-first architectures.', verified: false }
      ];

      return (
        <div class="space-y-6">
          <div class="bg-white border border-silver rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <span class="badge badge-paprika">[Job Status: OPEN]</span>
              <a href="${relRoot}app/(client)/client/jobs/page.html" class="text-xs text-charcoal-brown hover:underline">← Back to My Jobs</a>
            </div>
            <h1 class="text-2xl font-display font-bold text-carbon-black">Senior React &amp; Next.js Developer</h1>
            <p class="text-xs text-charcoal-brown mt-1">Budget: ₹10,000 before tax &nbsp;|&nbsp; Baseline Capacity: 10 Hours @ ₹1,000/hr &nbsp;|&nbsp; Deadline: Oct 28, 2026</p>
          </div>

          <div class="bg-white border border-silver rounded-2xl p-6">
            <h2 class="text-lg font-bold text-carbon-black mb-4">Applicants ({applicants.length})</h2>
            <div class="space-y-4">
              {applicants.map((a) => (
                <div key={a.id} class="border border-silver rounded-xl p-5 bg-floral-white flex items-center justify-between">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-carbon-black">{a.name}</span>
                      {a.verified && <span class="badge badge-carbon">[Verified Pro]</span>}
                    </div>
                    <p class="text-xs text-charcoal-brown max-w-xl">{a.pitch}</p>
                    <div class="text-xs text-charcoal-brown font-semibold">Proposed Rate: ₹{a.rate}/hr before tax</div>
                  </div>
                  <a href="${relRoot}app/(client)/client/projects/[id]/page.html" class="btn btn-primary text-xs">Accept &amp; Open Workspace →</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    ReactDOM.render(<ClientJobDetail />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Job Details', relRoot, '', script), 'utf8');
}

// 8. app/(client)/client/projects/[id]/page.html
function buildClientProjectDetailPage() {
  const filePath = 'app/(client)/client/projects/[id]/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function ClientProjectOverview() {
      return (
        <div class="space-y-6">
          <div class="flex items-center justify-between bg-white border border-silver rounded-2xl p-6">
            <div>
              <span class="badge badge-carbon mb-2">[Client Project Workspace]</span>
              <h1 class="text-2xl font-display font-bold text-carbon-black">Project P1: Responsive Landing Page</h1>
              <p class="text-xs text-charcoal-brown">Freelancer: <strong>Freelancer_Dev</strong> &nbsp;|&nbsp; Rate: ₹1,000/hr before tax</p>
            </div>
            <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="btn btn-primary">Open Live Workspace (Chat + Call + ScopeDesk) →</a>
          </div>

          <!-- Capacity Meter -->
          <div class="bg-white border border-silver rounded-2xl p-6">
            <h2 class="text-base font-bold text-carbon-black mb-4 flex items-center justify-between">
              <span>Effort Capacity &amp; Scope Health</span>
              <span class="badge badge-paprika">8h Committed / 10h Cap</span>
            </h2>
            <div class="grid grid-cols-4 gap-4 text-center">
              <div class="bg-floral-white border border-silver rounded-xl p-4">
                <div class="text-xs text-charcoal-brown">Available Baseline</div>
                <div class="text-xl font-bold text-carbon-black mt-1">10h</div>
              </div>
              <div class="bg-floral-white border border-silver rounded-xl p-4">
                <div class="text-xs text-charcoal-brown">Committed Hours</div>
                <div class="text-xl font-bold text-spicy-paprika mt-1">8h</div>
              </div>
              <div class="bg-floral-white border border-silver rounded-xl p-4">
                <div class="text-xs text-charcoal-brown">Remaining Capacity</div>
                <div class="text-xl font-bold text-carbon-black mt-1">2h</div>
              </div>
              <div class="bg-floral-white border border-silver rounded-xl p-4">
                <div class="text-xs text-charcoal-brown">Approved Change Value</div>
                <div class="text-xl font-bold text-carbon-black mt-1">₹6,000</div>
              </div>
            </div>
          </div>

          <!-- SOW Versioning & Scope Comparison -->
          <div class="grid grid-cols-2 gap-6">
            <div class="bg-white border border-silver rounded-2xl p-6">
              <h3 class="font-bold text-carbon-black text-sm mb-3">SOW v1 Baseline Boundaries</h3>
              <div class="space-y-3">
                <div class="p-3 bg-floral-white border border-silver rounded-xl text-xs">
                  <strong class="text-carbon-black block mb-1">[Included Scope]</strong>
                  <ul class="list-disc pl-4 space-y-1 text-charcoal-brown">
                    <li>One landing page</li>
                    <li>Contact form validation</li>
                  </ul>
                </div>
                <div class="p-3 bg-floral-white border border-silver rounded-xl text-xs">
                  <strong class="text-carbon-black block mb-1">[Explicit Exclusions]</strong>
                  <ul class="list-disc pl-4 space-y-1 text-charcoal-brown">
                    <li>Payment checkout gateway (Requires Scope Change Order)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="bg-white border border-silver rounded-2xl p-6">
              <h3 class="font-bold text-carbon-black text-sm mb-3">Actions &amp; Amendments</h3>
              <div class="space-y-3">
                <a href="${relRoot}app/(client)/client/projects/AmendmentUpload.html" class="block p-4 border border-silver rounded-xl bg-floral-white hover:border-carbon-black transition-all">
                  <div class="font-bold text-xs text-carbon-black">[Upload Amendment SOW]</div>
                  <p class="text-[11px] text-charcoal-brown mt-1">Upload .pdf, .txt, or .md SOW to compare with baseline v1.</p>
                </a>
                <a href="${relRoot}app/(client)/client/projects/ChangeOrderReview.html" class="block p-4 border border-silver rounded-xl bg-floral-white hover:border-carbon-black transition-all">
                  <div class="font-bold text-xs text-carbon-black">[Review Change Orders (R1, R2)]</div>
                  <p class="text-[11px] text-charcoal-brown mt-1">Approve or reject extra deliverables before work starts.</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }
    ReactDOM.render(<ClientProjectOverview />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Project Workspace', relRoot, '', script), 'utf8');
}

// 9. app/(client)/client/projects/AmendmentUpload.html
function buildAmendmentUploadPage() {
  const filePath = 'app/(client)/client/projects/AmendmentUpload.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function AmendmentUploadView() {
      const [fileName, setFileName] = React.useState('');
      const [isAnalyzing, setIsAnalyzing] = React.useState(false);
      const [diffResult, setDiffResult] = React.useState(null);

      const handleSimulateUpload = () => {
        setFileName('SOW_Amendment_v2.pdf');
        setIsAnalyzing(true);
        setTimeout(() => {
          setIsAnalyzing(false);
          setDiffResult({
            baselineItems: ['one landing page', 'contact form'],
            newItems: [
              { label: 'Payment checkout integration', classification: 'exclusion_override', hours: 6, cost: 6000 },
              { label: 'Fix broken contact form submit', classification: 'defect_rework', hours: 2, cost: 0 }
            ]
          });
        }, 1200);
      };

      return (
        <div class="max-w-3xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm space-y-6">
          <div class="border-b border-silver pb-4">
            <span class="badge badge-paprika mb-2">[SOW Comparison Engine]</span>
            <h1 class="text-2xl font-display font-bold text-carbon-black">Upload Amended SOW (AmendmentUpload.tsx)</h1>
            <p class="text-xs text-charcoal-brown mt-1">Upload an amended SOW (.pdf, .txt, .md). The rules engine will compare against baseline v1.</p>
          </div>

          <div
            onClick={handleSimulateUpload}
            class="border-2 border-dashed border-silver rounded-2xl p-10 text-center bg-floral-white hover:border-carbon-black cursor-pointer transition-all space-y-2"
          >
            <span class="badge badge-carbon text-sm">[SOW Dropzone]</span>
            <div class="font-bold text-carbon-black text-sm">Click here to simulate uploading an Amended SOW (.pdf)</div>
            <div class="text-xs text-charcoal-brown">Max size 500 KB · Only selectable text PDF, TXT, or MD accepted</div>
          </div>

          {isAnalyzing && (
            <div class="p-6 text-center text-xs text-charcoal-brown bg-floral-white border border-silver rounded-xl">
              Parsing amendment and diffing deliverables against baseline SOW v1...
            </div>
          )}

          {diffResult && (
            <div class="border border-silver rounded-xl p-5 bg-floral-white space-y-4">
              <div class="flex items-center justify-between">
                <span class="font-bold text-sm text-carbon-black">[Comparison Results: {fileName}]</span>
                <span class="badge badge-paprika font-bold">2 Changes Detected</span>
              </div>

              <div class="space-y-3">
                {diffResult.newItems.map((item, idx) => (
                  <div key={idx} class="bg-white border border-silver rounded-lg p-3 flex items-center justify-between text-xs">
                    <div>
                      <strong class="text-carbon-black">{item.label}</strong>
                      <span class="block text-[11px] text-charcoal-brown font-semibold mt-0.5">
                        {item.classification === 'exclusion_override' ? '[Alert: Explicit Exclusion Override]' : '[Internal Defect Rework: Effort logged, ₹0 cost]'}
                      </span>
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-carbon-black">{item.hours}h</div>
                      <div class="text-spicy-paprika font-extrabold">₹{item.cost.toLocaleString()} before tax</div>
                    </div>
                  </div>
                ))}
              </div>

              <div class="pt-2 flex justify-end">
                <a href="${relRoot}app/(client)/client/projects/ChangeOrderReview.html" class="btn btn-primary text-xs">Proceed to Change Order Review →</a>
              </div>
            </div>
          )}
        </div>
      );
    }
    ReactDOM.render(<AmendmentUploadView />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Amendment SOW Upload', relRoot, '', script), 'utf8');
}

// 10. app/(client)/client/projects/ChangeOrderReview.html
function buildChangeOrderReviewPage() {
  const filePath = 'app/(client)/client/projects/ChangeOrderReview.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function ChangeOrderReviewView() {
      const [items, setItems] = React.useState([
        { id: 'R1', text: 'Add payment checkout', hours: 6, rate: 1000, total: 6000, status: 'pending', anomaly: '[Alert: Exclusion Override]' },
        { id: 'R2', text: 'Fix broken contact form', hours: 2, rate: 0, total: 0, status: 'pending', anomaly: '[Defect Rework: ₹0]' }
      ]);

      const handleApprove = (id) => {
        setItems(items.map(it => it.id === id ? { ...it, status: 'approved' } : it));
      };

      const handleReject = (id) => {
        setItems(items.map(it => it.id === id ? { ...it, status: 'rejected' } : it));
      };

      return (
        <div class="max-w-4xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm space-y-6">
          <div class="flex items-center justify-between border-b border-silver pb-4">
            <div>
              <span class="badge badge-paprika mb-2">[Review Desk]</span>
              <h1 class="text-2xl font-display font-bold text-carbon-black">Change Order Review (ChangeOrderReview.tsx)</h1>
              <p class="text-xs text-charcoal-brown mt-1">Review new items with hours, rate before tax, and pricing assumptions.</p>
            </div>
            <a href="${relRoot}app/(client)/client/projects/[id]/page.html" class="text-xs text-charcoal-brown hover:underline">← Project Workspace</a>
          </div>

          <table class="w-full text-left text-xs border border-silver rounded-xl overflow-hidden">
            <thead class="bg-floral-white border-b border-silver text-carbon-black font-bold">
              <tr>
                <th class="p-3">Request ID &amp; Item</th>
                <th class="p-3">Anomaly Flag</th>
                <th class="p-3 text-right">Hours</th>
                <th class="p-3 text-right">Pre-Tax Total</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-silver">
              {items.map((it) => (
                <tr key={it.id} class="hover:bg-floral-white/50">
                  <td class="p-3">
                    <strong class="text-carbon-black">{it.id}:</strong> {it.text}
                  </td>
                  <td class="p-3">
                    <span class="badge badge-carbon">{it.anomaly}</span>
                  </td>
                  <td class="p-3 text-right font-bold text-carbon-black">{it.hours}h</td>
                  <td class="p-3 text-right font-bold text-spicy-paprika">₹{it.total.toLocaleString()}</td>
                  <td class="p-3 text-right">
                    {it.status === 'pending' ? (
                      <div class="flex items-center justify-end gap-2">
                        <button onClick={() => handleApprove(it.id)} class="btn btn-primary py-1 px-3 text-xs">[Approve]</button>
                        <button onClick={() => handleReject(it.id)} class="btn btn-secondary py-1 px-3 text-xs">[Reject]</button>
                      </div>
                    ) : (
                      <span class={'badge font-bold ' + (it.status === 'approved' ? 'badge-carbon' : 'badge-paprika')}>
                        [{it.status.toUpperCase()}]
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    ReactDOM.render(<ChangeOrderReviewView />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Change Order Review', relRoot, '', script), 'utf8');
}

// 11. app/(freelancer)/layout.html
function buildFreelancerLayout() {
  const filePath = 'app/(freelancer)/layout.html';
  const relRoot = getRelRoot(filePath);
  const content = `
    <div class="max-w-4xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm">
      <div class="flex items-center justify-between border-b border-silver pb-4 mb-6">
        <div>
          <span class="badge badge-carbon mb-2">[Freelancer Shell]</span>
          <h1 class="text-2xl font-display font-bold text-carbon-black">Freelancer Shell Layout ((freelancer)/layout.tsx)</h1>
          <p class="text-xs text-charcoal-brown">Global shell for Freelancer job discovery, profile, and active project change desk.</p>
        </div>
        <a href="${relRoot}app/(freelancer)/freelancer/page.html" class="btn btn-primary">Open Freelancer Portal →</a>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <a href="${relRoot}app/(freelancer)/freelancer/page.html" class="p-5 border border-silver rounded-xl bg-floral-white hover:border-carbon-black transition-all">
          <span class="badge badge-paprika mb-2">[3-Column Portal]</span>
          <h3 class="font-bold text-sm text-carbon-black">Main Portal</h3>
          <p class="text-xs text-charcoal-brown mt-1">Task List panel, Dashboard / Jobs / Profile tabs, and Notifications.</p>
        </a>
        <a href="${relRoot}app/(freelancer)/freelancer/jobs/page.html" class="p-5 border border-silver rounded-xl bg-floral-white hover:border-carbon-black transition-all">
          <span class="badge badge-carbon mb-2">[Jobs Discovery]</span>
          <h3 class="font-bold text-sm text-carbon-black">Jobs Catalog</h3>
          <p class="text-xs text-charcoal-brown mt-1">Domain categories, scope boundaries, and one-click application.</p>
        </a>
        <a href="${relRoot}app/(freelancer)/freelancer/profile/page.html" class="p-5 border border-silver rounded-xl bg-floral-white hover:border-carbon-black transition-all">
          <span class="badge badge-paprika mb-2">[Profile]</span>
          <h3 class="font-bold text-sm text-carbon-black">Profile &amp; Privacy</h3>
          <p class="text-xs text-charcoal-brown mt-1">Hourly rate, effort capacity, competency badges, and contact privacy.</p>
        </a>
      </div>
    </div>
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Freelancer Layout', relRoot, content), 'utf8');
}

// 12. app/(freelancer)/freelancer/page.html (Main 3-Column Portal)
function buildFreelancerPortalPage() {
  const filePath = 'app/(freelancer)/freelancer/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function FreelancerPortal() {
      const [tab, setTab] = React.useState('dashboard');
      const [tasks, setTasks] = React.useState([
        { id: 't1', label: '1 Landing Page Layout & CSS Tokens', hours: 4, completed: true, isScope: false },
        { id: 't2', label: 'Contact Form Client Validation', hours: 2, completed: true, isScope: false },
        { id: 't3', label: 'Add payment checkout (R1)', hours: 6, completed: false, isScope: true },
        { id: 't4', label: 'Fix contact form defect rework (R2)', hours: 2, completed: false, isScope: true }
      ]);

      const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
      };

      const committedHours = 8;
      const baselineCap = 10;
      const remainingHours = 2;

      return (
        <div class="space-y-6">
          <!-- Top Sub-Navigation Tabs -->
          <div class="flex items-center justify-between bg-white border border-silver rounded-2xl p-4">
            <div class="flex items-center gap-2 bg-floral-white p-1 rounded-full border border-silver">
              <button
                onClick={() => setTab('dashboard')}
                class={'px-4 py-1.5 rounded-full text-xs font-bold transition-all ' + (tab === 'dashboard' ? 'bg-carbon-black text-white' : 'text-charcoal-brown')}
              >
                Dashboard
              </button>
              <button
                onClick={() => setTab('jobs')}
                class={'px-4 py-1.5 rounded-full text-xs font-bold transition-all ' + (tab === 'jobs' ? 'bg-carbon-black text-white' : 'text-charcoal-brown')}
              >
                Jobs (Drill-Down Flow)
              </button>
              <button
                onClick={() => setTab('profile')}
                class={'px-4 py-1.5 rounded-full text-xs font-bold transition-all ' + (tab === 'profile' ? 'bg-carbon-black text-white' : 'text-charcoal-brown')}
              >
                Profile
              </button>
            </div>
            <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="btn btn-primary text-xs">
              [Open Project Workspace] →
            </a>
          </div>

          <!-- 3-Column Layout -->
          <div class="grid grid-cols-12 gap-6">
            <!-- Left Sidebar: Task List Panel -->
            <div class="col-span-3 bg-white border border-silver rounded-2xl p-5 space-y-5">
              <div>
                <span class="badge badge-paprika mb-1">[Tasks]</span>
                <h3 class="font-bold text-sm text-carbon-black">Task List Panel</h3>
                <p class="text-[11px] text-charcoal-brown">Committed work items &amp; milestones</p>
              </div>

              <!-- Capacity Box -->
              <div class="bg-floral-white border border-silver rounded-xl p-3">
                <div class="flex justify-between items-baseline mb-1">
                  <span class="text-[10px] font-bold text-charcoal-brown uppercase">Remaining Effort</span>
                  <span class="text-xs font-extrabold text-carbon-black">{remainingHours}h / {baselineCap}h</span>
                </div>
                <div class="w-full h-2 bg-silver rounded-full overflow-hidden mb-2">
                  <div class="h-full bg-spicy-paprika" style={{ width: '80%' }}></div>
                </div>
                <div class="flex justify-between text-[10px] text-charcoal-brown">
                  <span>Rate: ₹1,000/hr</span>
                  <span>Cap: 10h</span>
                </div>
              </div>

              <!-- Task Checklist -->
              <div class="space-y-2">
                <div class="text-[11px] font-bold text-carbon-black">Committed Deliverables:</div>
                {tasks.map(t => (
                  <label key={t.id} class="flex items-start gap-2 p-2 rounded-lg border border-silver bg-floral-white text-xs cursor-pointer">
                    <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} class="mt-0.5" />
                    <span class={t.completed ? 'line-through text-charcoal-brown' : 'font-semibold text-carbon-black'}>
                      {t.label}
                      {t.isScope && <span class="block text-[10px] text-spicy-paprika font-bold">[Change: +{t.hours}h]</span>}
                    </span>
                  </label>
                ))}
              </div>

              <!-- Milestones -->
              <div class="border-t border-silver pt-3 space-y-1.5 text-xs text-charcoal-brown">
                <div class="font-bold text-carbon-black mb-1">Milestones:</div>
                <div>[Done] M1: SOW &amp; Wireframes</div>
                <div>[Active] M2: Contact Form Validation</div>
                <div>[Pending] M3: Scope Change R1 Approval</div>
              </div>
            </div>

            <!-- Center Column: Tab Content -->
            <div class="col-span-6 space-y-6">
              {tab === 'dashboard' && (
                <div class="space-y-6">
                  <!-- Active Contract Card -->
                  <div class="bg-white border border-silver rounded-2xl p-6">
                    <div class="flex items-center justify-between mb-3">
                      <div>
                        <span class="badge badge-carbon">[Active Contract]</span>
                        <h2 class="text-lg font-bold text-carbon-black mt-1">Project P1: Responsive Landing Page</h2>
                      </div>
                      <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="btn btn-primary text-xs">[Open Workspace]</a>
                    </div>
                    <p class="text-xs text-charcoal-brown leading-relaxed mb-4">
                      Build a high-performance landing page and contact form under a strict 10-hour capacity ceiling.
                      Includes browser-native WebRTC calls, WhatsApp Meta-AI assistant (@AI), and ScopeDesk variance pricing.
                    </p>
                    <div class="p-3 bg-floral-white border border-silver rounded-xl text-xs flex justify-between">
                      <div>
                        <strong>In-Scope:</strong> 1 landing page, contact form &nbsp;|&nbsp; <strong>Excluded:</strong> payment checkout
                      </div>
                      <div class="font-bold text-carbon-black">₹10,000 baseline</div>
                    </div>
                  </div>

                  <!-- Pending Actions Card -->
                  <div class="bg-white border border-silver rounded-2xl p-6">
                    <h3 class="text-sm font-bold text-carbon-black mb-3">Pending ScopeDesk Actions</h3>
                    <div class="space-y-3">
                      <div class="p-3 bg-floral-white border border-silver rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <strong class="text-carbon-black">Request R1: &quot;Add payment checkout&quot; (6h)</strong>
                          <div class="text-[11px] text-charcoal-brown">Explicit Exclusion Override · Quote: ₹6,000 before tax</div>
                        </div>
                        <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="btn btn-secondary text-xs">Review in Workspace →</a>
                      </div>
                      <div class="p-3 bg-floral-white border border-silver rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <strong class="text-carbon-black">Request R2: &quot;Fix our broken contact form&quot; (2h)</strong>
                          <div class="text-[11px] text-charcoal-brown">Internal Defect Rework · Billable Quote: ₹0 (Effort logged)</div>
                        </div>
                        <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="btn btn-secondary text-xs">Review in Workspace →</a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'jobs' && (
                <div class="bg-white border border-silver rounded-2xl p-6">
                  <h2 class="text-lg font-bold text-carbon-black mb-2">Freelancer Job Discovery</h2>
                  <p class="text-xs text-charcoal-brown mb-4">Filter by category and inspect baseline SOW deliverables.</p>
                  <a href="${relRoot}components/jobs/JobsDrillDown.html" class="btn btn-primary text-xs">Open Dedicated Jobs Catalog Drill-Down →</a>
                </div>
              )}

              {tab === 'profile' && (
                <div class="bg-white border border-silver rounded-2xl p-6 space-y-4">
                  <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-full bg-carbon-black text-floral-white flex items-center justify-center font-bold text-lg">FD</div>
                    <div>
                      <h2 class="text-lg font-bold text-carbon-black">Freelancer_Dev</h2>
                      <span class="badge badge-carbon">[Privacy-First Platform Profile]</span>
                    </div>
                  </div>
                  <div class="grid grid-cols-3 gap-3 text-center text-xs">
                    <div class="bg-floral-white border border-silver p-3 rounded-xl">
                      <div class="text-charcoal-brown">Hourly Rate</div>
                      <div class="font-extrabold text-carbon-black text-sm mt-0.5">₹1,000/hr</div>
                    </div>
                    <div class="bg-floral-white border border-silver p-3 rounded-xl">
                      <div class="text-charcoal-brown">Weekly Capacity</div>
                      <div class="font-extrabold text-carbon-black text-sm mt-0.5">10 Hours</div>
                    </div>
                    <div class="bg-floral-white border border-silver p-3 rounded-xl">
                      <div class="text-charcoal-brown">Rating</div>
                      <div class="font-extrabold text-spicy-paprika text-sm mt-0.5">4.9 / 5.0</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <!-- Right Sidebar: Notifications Panel -->
            <div class="col-span-3 bg-white border border-silver rounded-2xl p-5 space-y-4">
              <div>
                <span class="badge badge-carbon mb-1">[Alerts]</span>
                <h3 class="font-bold text-sm text-carbon-black">Notifications Panel</h3>
                <p class="text-[11px] text-charcoal-brown">Real-time workspace &amp; call alerts</p>
              </div>

              <div class="space-y-3">
                <div class="p-3 bg-floral-white border border-silver rounded-xl text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="badge badge-paprika text-[10px]">[Scope Request]</span>
                    <span class="text-[10px] text-charcoal-brown">5m ago</span>
                  </div>
                  <strong class="text-carbon-black block">Request R1 Received</strong>
                  <p class="text-charcoal-brown text-[11px]">Client_A requested "Add payment checkout" (6h) flagged as Exclusion Override.</p>
                </div>

                <div class="p-3 bg-floral-white border border-silver rounded-xl text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="badge badge-carbon text-[10px]">[Call Ready]</span>
                    <span class="text-[10px] text-charcoal-brown">12m ago</span>
                  </div>
                  <strong class="text-carbon-black block">WebRTC Peer Room Ready</strong>
                  <p class="text-charcoal-brown text-[11px]">Audio call channel projectFor(P1) available for live discussion.</p>
                </div>

                <div class="p-3 bg-floral-white border border-silver rounded-xl text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="badge text-[10px]">[SOW Locked]</span>
                    <span class="text-[10px] text-charcoal-brown">1h ago</span>
                  </div>
                  <strong class="text-carbon-black block">Baseline SOW v1 Confirmed</strong>
                  <p class="text-charcoal-brown text-[11px]">Included: 1 landing page, contact form. Excluded: payment checkout.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    ReactDOM.render(<FreelancerPortal />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Freelancer Portal', relRoot, '', script), 'utf8');
}

// 13. app/(freelancer)/freelancer/jobs/page.html
function buildFreelancerJobsPage() {
  const filePath = 'app/(freelancer)/freelancer/jobs/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function FreelancerJobsView() {
      const domains = [
        { id: 'all', label: 'All Domains' },
        { id: 'web', label: 'Web Development' },
        { id: 'design', label: 'UI/UX Design' },
        { id: 'ai', label: 'AI/ML & Data' },
        { id: 'ecommerce', label: 'E-Commerce' }
      ];

      return (
        <div class="space-y-6">
          <div class="flex items-center justify-between bg-white border border-silver rounded-2xl p-6">
            <div>
              <span class="badge badge-paprika mb-2">[Job Catalog]</span>
              <h1 class="text-2xl font-display font-bold text-carbon-black">Discover Jobs</h1>
              <p class="text-xs text-charcoal-brown">Inspect verified baseline SOWs, rates, and explicit exclusions.</p>
            </div>
            <a href="${relRoot}app/(freelancer)/freelancer/page.html" class="btn btn-secondary text-xs">← Back to Portal</a>
          </div>

          <div class="flex gap-2">
            {domains.map(d => (
              <button key={d.id} class="px-4 py-1.5 border border-silver rounded-full text-xs font-bold bg-white hover:bg-floral-white text-carbon-black">
                {d.label}
              </button>
            ))}
          </div>

          <div class="space-y-4">
            <div class="bg-white border border-silver rounded-2xl p-6 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="badge badge-carbon">[Web Development]</span>
                  <h3 class="font-bold text-base text-carbon-black">Responsive Landing Page &amp; WebRTC Calling</h3>
                </div>
                <span class="text-sm font-extrabold text-carbon-black">₹10,000 (₹1,000/hr)</span>
              </div>
              <p class="text-xs text-charcoal-brown leading-relaxed">
                Build a modern responsive landing page, contact form validation, and integrate browser-native WebRTC calling.
              </p>
              <div class="pt-2 flex justify-between items-center border-t border-silver">
                <span class="text-xs text-charcoal-brown">Client: Client_A · Baseline: 10 Hours</span>
                <a href="${relRoot}app/(freelancer)/freelancer/jobs/[id]/page.html" class="btn btn-primary text-xs">Inspect SOW &amp; Apply →</a>
              </div>
            </div>
          </div>
        </div>
      );
    }
    ReactDOM.render(<FreelancerJobsView />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Jobs Discovery', relRoot, '', script), 'utf8');
}

// 14. app/(freelancer)/freelancer/jobs/[id]/page.html
function buildFreelancerJobDetailPage() {
  const filePath = 'app/(freelancer)/freelancer/jobs/[id]/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function FreelancerJobDetail() {
      return (
        <div class="max-w-3xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm space-y-6">
          <div class="flex items-center justify-between border-b border-silver pb-4">
            <div>
              <span class="badge badge-carbon mb-2">[Job Details &amp; SOW Scope]</span>
              <h1 class="text-2xl font-display font-bold text-carbon-black">Responsive Landing Page &amp; WebRTC Calling</h1>
              <p class="text-xs text-charcoal-brown mt-1">Client: Client_A &nbsp;|&nbsp; Rate: ₹1,000/hr &nbsp;|&nbsp; 10h Baseline</p>
            </div>
            <a href="${relRoot}app/(freelancer)/freelancer/jobs/page.html" class="text-xs text-charcoal-brown hover:underline">← Back to Jobs</a>
          </div>

          <!-- Scope Breakdown -->
          <div class="bg-floral-white border border-silver rounded-xl p-5 space-y-4">
            <h3 class="font-bold text-sm text-carbon-black">[SOW] Baseline Scope &amp; Legal Exclusions</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-xs font-bold text-carbon-black mb-2">[Included] INCLUDED SCOPE:</div>
                <ul class="text-xs text-charcoal-brown space-y-1 list-disc pl-4">
                  <li>One responsive landing page</li>
                  <li>Contact form validation</li>
                </ul>
              </div>
              <div>
                <div class="text-xs font-bold text-carbon-black mb-2">[Excluded] EXCLUDED SCOPE (Out of scope):</div>
                <ul class="text-xs text-charcoal-brown space-y-1 list-disc pl-4">
                  <li class="line-through">Payment checkout integration</li>
                  <span class="text-[10px] text-charcoal-brown block">(Requires approved Scope Change Order @ ₹1,000/hr)</span>
                </ul>
              </div>
            </div>
          </div>

          <!-- Action CTA -->
          <div class="pt-4 flex justify-end">
            <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="btn btn-primary text-sm py-3 px-6">
              [Open] [ Accept Job / Open Project Workspace ] →
            </a>
          </div>
        </div>
      );
    }
    ReactDOM.render(<FreelancerJobDetail />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Job Details & Scope', relRoot, '', script), 'utf8');
}

// 15. app/(freelancer)/freelancer/profile/page.html
function buildFreelancerProfilePage() {
  const filePath = 'app/(freelancer)/freelancer/profile/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function FreelancerProfileView() {
      const [saved, setSaved] = React.useState(false);
      const [rate, setRate] = React.useState(1000);
      const [bio, setBio] = React.useState('Full-stack engineer specialized in Next.js, WebRTC, and scope change negotiation.');

      const handleSubmit = (e) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      };

      return (
        <div class="max-w-2xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm space-y-6">
          <div class="border-b border-silver pb-4">
            <span class="badge badge-paprika mb-2">[Freelancer Profile]</span>
            <h1 class="text-2xl font-display font-bold text-carbon-black">Platform Profile &amp; Privacy Guard</h1>
            <p class="text-xs text-charcoal-brown mt-1">Personal contact information is never exposed to external parties.</p>
          </div>

          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-charcoal-brown mb-1">Anonymous Display Name</label>
              <input type="text" disabled value="Freelancer_Dev" class="w-full px-3 py-2 border border-silver rounded-lg text-sm bg-silver/20 font-bold text-carbon-black" />
            </div>

            <div>
              <label class="block text-xs font-bold text-charcoal-brown mb-1">Standard Hourly Rate (INR)</label>
              <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} class="w-full px-3 py-2 border border-silver rounded-lg text-sm bg-floral-white font-bold" />
            </div>

            <div>
              <label class="block text-xs font-bold text-charcoal-brown mb-1">Professional Bio &amp; Pitch</label>
              <textarea rows="3" value={bio} onChange={(e) => setBio(e.target.value)} class="w-full px-3 py-2 border border-silver rounded-lg text-sm bg-floral-white"></textarea>
            </div>

            <div class="p-3 bg-floral-white border border-silver rounded-xl text-xs text-charcoal-brown">
              [Privacy] <strong>Privacy Guard Guarantee:</strong> All client communications remain within the Fynd ScopeDesk environment. Browser-native WebRTC peer signaling is encrypted and ephemeral.
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button type="submit" class="btn btn-primary text-xs">Save Profile Changes</button>
              {saved && <span class="text-xs font-bold text-carbon-black">[OK] Profile saved successfully.</span>}
            </div>
          </form>
        </div>
      );
    }
    ReactDOM.render(<FreelancerProfileView />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Freelancer Profile', relRoot, '', script), 'utf8');
}

// 16. app/(freelancer)/freelancer/projects/[id]/page.html
function buildFreelancerProjectDetailPage() {
  const filePath = 'app/(freelancer)/freelancer/projects/[id]/page.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function FreelancerProjectView() {
      return (
        <div class="space-y-6">
          <div class="flex items-center justify-between bg-white border border-silver rounded-2xl p-6">
            <div>
              <span class="badge badge-paprika mb-2">[Project View]</span>
              <h1 class="text-2xl font-display font-bold text-carbon-black">Project P1: Responsive Landing Page</h1>
              <p class="text-xs text-charcoal-brown">Client: Client_A &nbsp;|&nbsp; Committed: 8h of 10h baseline</p>
            </div>
            <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="btn btn-primary">[Live] Unified Workspace →</a>
          </div>

          <div class="bg-white border border-silver rounded-2xl p-6">
            <h3 class="font-bold text-sm text-carbon-black mb-3">Project Deliverables &amp; Change Orders</h3>
            <div class="space-y-2 text-xs">
              <div class="p-3 border border-silver rounded-lg bg-floral-white flex justify-between">
                <span>[M1] Baseline Landing Page &amp; Wireframes</span>
                <span class="badge badge-carbon">[Done]</span>
              </div>
              <div class="p-3 border border-silver rounded-lg bg-floral-white flex justify-between">
                <span>[M2] Contact Form Client Validation</span>
                <span class="badge badge-carbon">[Active]</span>
              </div>
              <div class="p-3 border border-silver rounded-lg bg-floral-white flex justify-between">
                <span>[M3] Scope Request R1: Payment Checkout (6h)</span>
                <span class="badge badge-paprika">[Pending Client Approval]</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    ReactDOM.render(<FreelancerProjectView />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Project Details', relRoot, '', script), 'utf8');
}

// 17. components/ui/index.html
function buildUiComponentsPage() {
  const filePath = 'components/ui/index.html';
  const relRoot = getRelRoot(filePath);
  const content = `
    <div class="max-w-4xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm space-y-6">
      <div class="border-b border-silver pb-4">
        <span class="badge badge-carbon mb-2">[UI Design System]</span>
        <h1 class="text-2xl font-display font-bold text-carbon-black">UI Component Library (components/ui/index.tsx)</h1>
        <p class="text-xs text-charcoal-brown mt-1">Reusable enterprise components strictly adhering to the 5 designated colors and zero emojis.</p>
      </div>

      <!-- Buttons -->
      <div class="space-y-2">
        <h3 class="font-bold text-xs text-charcoal-brown uppercase">Button Variants</h3>
        <div class="flex gap-3">
          <button class="btn btn-primary text-xs">Primary CTA (Spicy Paprika)</button>
          <button class="btn btn-dark text-xs">Dark Neutral (Carbon Black)</button>
          <button class="btn btn-secondary text-xs">Secondary Outline (Silver)</button>
        </div>
      </div>

      <!-- Badges -->
      <div class="space-y-2">
        <h3 class="font-bold text-xs text-charcoal-brown uppercase">Badge Variants</h3>
        <div class="flex gap-2">
          <span class="badge badge-paprika">[Alert / Warning]</span>
          <span class="badge badge-carbon">[Carbon Primary]</span>
          <span class="badge">[Neutral Silver]</span>
        </div>
      </div>

      <!-- Cards -->
      <div class="space-y-2">
        <h3 class="font-bold text-xs text-charcoal-brown uppercase">Card Component</h3>
        <div class="p-5 border border-silver rounded-xl bg-floral-white">
          <h4 class="font-bold text-sm text-carbon-black mb-1">Standard Card Container</h4>
          <p class="text-xs text-charcoal-brown">Used across project workspaces, job listings, and modal overlays.</p>
        </div>
      </div>
    </div>
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('UI System', relRoot, content), 'utf8');
}

// 18. components/shell/TopBar.html
function buildTopBarPage() {
  const filePath = 'components/shell/TopBar.html';
  const relRoot = getRelRoot(filePath);
  const content = `
    <div class="max-w-4xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm space-y-6">
      <div class="border-b border-silver pb-4">
        <span class="badge badge-paprika mb-2">[TopBar Component]</span>
        <h1 class="text-2xl font-display font-bold text-carbon-black">Application TopBar (TopBar.tsx)</h1>
        <p class="text-xs text-charcoal-brown mt-1">Global header component. Case C35 removed, call section relocated exclusively into chats.</p>
      </div>

      <!-- TopBar Preview -->
      <div class="border border-silver rounded-xl p-4 bg-floral-white flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="font-display font-bold text-lg text-carbon-black">Fynd ScopeDesk</span>
          <span class="badge badge-carbon">[Role: Freelancer_Dev]</span>
        </div>
        <div class="flex items-center gap-4 text-xs font-semibold text-charcoal-brown">
          <a href="${relRoot}app/(freelancer)/freelancer/page.html" class="hover:text-spicy-paprika">Portal</a>
          <a href="${relRoot}app/(freelancer)/freelancer/jobs/page.html" class="hover:text-spicy-paprika">Jobs</a>
          <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="hover:text-spicy-paprika">Workspace</a>
        </div>
      </div>
    </div>
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('TopBar Component', relRoot, content), 'utf8');
}

// 19. components/chat/Chat.html
function buildChatPage() {
  const filePath = 'components/chat/Chat.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function ChatComponentView() {
      const [messages, setMessages] = React.useState([]);
      const [input, setInput] = React.useState('');

      const send = (txt) => {
        const textToSend = txt || input;
        if (!textToSend.trim()) return;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages([...messages, { id: Date.now(), sender: 'Freelancer_Dev', text: textToSend, time: now }]);
        setInput('');
      };

      return (
        <div class="max-w-3xl mx-auto bg-white border border-silver rounded-2xl p-6 shadow-sm flex flex-col h-[600px]">
          <div class="border-b border-silver pb-3 mb-4 flex items-center justify-between">
            <div>
              <span class="badge badge-paprika mb-1">[Project Chat]</span>
              <h1 class="text-lg font-bold text-carbon-black">Project Workspace Chat (Chat.tsx)</h1>
            </div>
            <span class="text-xs text-charcoal-brown">Privacy Guard Active</span>
          </div>

          <div class="flex-1 overflow-y-auto space-y-3 p-4 bg-floral-white border border-silver rounded-xl mb-4">
            {messages.length === 0 ? (
              <div class="h-full flex flex-col items-center justify-center text-center p-6 text-charcoal-brown space-y-2">
                <span class="badge badge-carbon">[Empty Workspace Chat]</span>
                <p class="text-xs">Type a message or click below to start discussion.</p>
                <button onClick={() => send('Hello! I reviewed the SOW v1 deliverables and I am ready to start.')} class="btn btn-secondary text-xs">
                  Say Hello
                </button>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} class="bg-white border border-silver p-3 rounded-xl max-w-md text-xs space-y-1">
                  <div class="flex justify-between font-bold text-carbon-black text-[11px]">
                    <span>{m.sender}</span>
                    <span class="text-charcoal-brown font-normal">{m.time}</span>
                  </div>
                  <div>{m.text}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} class="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message or @AI scope query..."
              class="flex-1 px-3 py-2 border border-silver rounded-lg text-xs bg-floral-white focus:outline-none focus:border-carbon-black font-semibold"
            />
            <button type="submit" class="btn btn-primary text-xs">Send</button>
          </form>
        </div>
      );
    }
    ReactDOM.render(<ChatComponentView />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Chat Component', relRoot, '', script), 'utf8');
}

// 20. components/call/Call.html
function buildCallPage() {
  const filePath = 'components/call/Call.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function CallComponentView() {
      const [callCount, setCallCount] = React.useState(0);
      const [inCall, setInCall] = React.useState(false);
      const [paywall, setPaywall] = React.useState(false);

      const startCall = () => {
        if (callCount >= 5) {
          setPaywall(true);
        } else {
          setInCall(true);
        }
      };

      const endCall = () => {
        setInCall(false);
        const next = callCount + 1;
        setCallCount(next);
        if (next >= 5) {
          setPaywall(true);
        }
      };

      return (
        <div class="max-w-2xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm space-y-6 text-center">
          <div class="border-b border-silver pb-4">
            <span class="badge badge-carbon mb-2">[WebRTC Calling]</span>
            <h1 class="text-2xl font-display font-bold text-carbon-black">In-App WebRTC Call (Call.tsx)</h1>
            <p class="text-xs text-charcoal-brown mt-1">Freemium audio calling gate (5 free calls per workspace) and video Pro paywall.</p>
          </div>

          <div class="p-6 bg-floral-white border border-silver rounded-xl space-y-4">
            <div class="text-xs font-bold text-carbon-black">
              Calls Quota: <span class="text-spicy-paprika">{callCount}/5 Calls Used</span>
            </div>

            {inCall ? (
              <div class="space-y-4">
                <div class="w-20 h-20 mx-auto rounded-full bg-carbon-black text-floral-white flex items-center justify-center font-bold text-sm animate-pulse">
                  [In Call]
                </div>
                <div class="text-xs text-charcoal-brown">Encrypted peer session active with Client_A</div>
                <button onClick={endCall} class="btn btn-primary text-xs">End Call</button>
              </div>
            ) : (
              <button onClick={startCall} class="btn btn-primary text-sm py-3 px-6">
                [Call] Start Call
              </button>
            )}
          </div>

          {paywall && (
            <div class="p-6 border-2 border-spicy-paprika rounded-xl bg-floral-white space-y-3">
              <span class="badge badge-paprika font-bold">[LOCKED]</span>
              <h3 class="text-base font-bold text-carbon-black">5 Free Calls Limit Reached</h3>
              <p class="text-xs text-charcoal-brown">Upgrade to Pro Seat (₹499/mo) for unlimited audio &amp; HD video calling.</p>
              <button onClick={() => { setPaywall(false); setCallCount(0); }} class="btn btn-dark text-xs">
                [Upgrade Pro Seat (Demo Unlock)]
              </button>
            </div>
          )}
        </div>
      );
    }
    ReactDOM.render(<CallComponentView />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Call Component', relRoot, '', script), 'utf8');
}

// 21. components/changes/ChangeList.html
function buildChangeListPage() {
  const filePath = 'components/changes/ChangeList.html';
  const relRoot = getRelRoot(filePath);
  const content = `
    <div class="max-w-3xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm space-y-6">
      <div class="border-b border-silver pb-4">
        <span class="badge badge-paprika mb-2">[Change Orders]</span>
        <h1 class="text-2xl font-display font-bold text-carbon-black">Change Orders Audit List (ChangeList.tsx)</h1>
        <p class="text-xs text-charcoal-brown mt-1">Audit trail of scope changes, hours, and pre-tax commercial terms.</p>
      </div>

      <div class="space-y-3">
        <div class="p-4 border border-silver rounded-xl bg-floral-white flex items-center justify-between text-xs">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <strong class="text-carbon-black text-sm">R1: Add payment checkout</strong>
              <span class="badge badge-carbon">[Approved v2]</span>
            </div>
            <div class="text-charcoal-brown">6h committed · ₹6,000 before tax · Reason: Explicit Exclusion Override</div>
          </div>
          <span class="badge badge-paprika font-bold">+6h</span>
        </div>

        <div class="p-4 border border-silver rounded-xl bg-floral-white flex items-center justify-between text-xs">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <strong class="text-carbon-black text-sm">R2: Fix contact form defect rework</strong>
              <span class="badge badge-carbon">[Defect Logged]</span>
            </div>
            <div class="text-charcoal-brown">2h effort · ₹0 billed · Reason: Internal Defect Rework</div>
          </div>
          <span class="badge font-bold">0h billed</span>
        </div>
      </div>
    </div>
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('ChangeList Component', relRoot, content), 'utf8');
}

// 22. components/sow/SowUpload.html
function buildSowUploadPage() {
  const filePath = 'components/sow/SowUpload.html';
  const relRoot = getRelRoot(filePath);
  const content = `
    <div class="max-w-2xl mx-auto bg-white border border-silver rounded-2xl p-8 shadow-sm space-y-6 text-center">
      <div class="border-b border-silver pb-4">
        <span class="badge badge-carbon mb-2">[SOW Ingestion]</span>
        <h1 class="text-2xl font-display font-bold text-carbon-black">Baseline SOW Upload (SowUpload.tsx)</h1>
        <p class="text-xs text-charcoal-brown mt-1">Upload baseline Statement of Work to lock project deliverables.</p>
      </div>

      <div class="p-8 border-2 border-dashed border-silver rounded-xl bg-floral-white space-y-3">
        <span class="badge badge-paprika text-xs">[Dropzone]</span>
        <h3 class="font-bold text-sm text-carbon-black">Drop Baseline SOW (.pdf, .txt, .md)</h3>
        <p class="text-xs text-charcoal-brown">Extract deliverables and lock v1 baseline effort capacity.</p>
        <button class="btn btn-primary text-xs">Browse Document</button>
      </div>
    </div>
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('SOW Upload Component', relRoot, content), 'utf8');
}

// 23. components/jobs/JobsDrillDown.html
function buildJobsDrillDownPage() {
  const filePath = 'components/jobs/JobsDrillDown.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function JobsDrillDownView() {
      const [domain, setDomain] = React.useState('all');
      const jobs = [
        { id: 'j1', domain: 'web', title: 'Responsive Landing Page & WebRTC Calling', rate: 1000, hours: 10, budget: 10000 },
        { id: 'j2', domain: 'web', title: 'Full Stack Next.js Contract', rate: 1200, hours: 20, budget: 24000 },
        { id: 'j3', domain: 'design', title: 'Design System & Figma Tokens', rate: 1100, hours: 15, budget: 16500 },
        { id: 'j4', domain: 'ai', title: 'NLP Scope Extraction Assistant', rate: 1500, hours: 25, budget: 37500 },
        { id: 'j5', domain: 'ecommerce', title: 'Headless Storefront Integration', rate: 1300, hours: 30, budget: 39000 }
      ];

      const filtered = domain === 'all' ? jobs : jobs.filter(j => j.domain === domain);

      return (
        <div class="space-y-6">
          <div class="flex items-center justify-between bg-white border border-silver rounded-2xl p-6">
            <div>
              <span class="badge badge-paprika mb-2">[Jobs Catalog Drill-Down]</span>
              <h1 class="text-2xl font-display font-bold text-carbon-black">Job Catalog &amp; Domain Categories</h1>
              <p class="text-xs text-charcoal-brown">Filter opportunities across domains with verified SOW terms.</p>
            </div>
            <a href="${relRoot}components/workspace/UnifiedWorkspace.html" class="btn btn-primary text-xs">Open Workspace →</a>
          </div>

          <div class="flex gap-2 bg-white p-3 border border-silver rounded-xl">
            {['all', 'web', 'design', 'ai', 'ecommerce'].map(d => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                class={'px-4 py-1.5 rounded-full text-xs font-bold transition-all ' + (domain === d ? 'bg-carbon-black text-white' : 'bg-floral-white text-charcoal-brown border border-silver')}
              >
                {d === 'all' ? 'All Domains' : d.toUpperCase()}
              </button>
            ))}
          </div>

          <div class="space-y-4">
            {filtered.map(j => (
              <div key={j.id} class="bg-white border border-silver rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="badge badge-carbon">[{j.domain.toUpperCase()}]</span>
                    <strong class="text-carbon-black text-sm">{j.title}</strong>
                  </div>
                  <div class="text-xs text-charcoal-brown">
                    Rate: ₹{j.rate}/hr &nbsp;|&nbsp; Capacity: {j.hours}h &nbsp;|&nbsp; Budget: ₹{j.budget.toLocaleString()} before tax
                  </div>
                </div>
                <a href="${relRoot}app/(freelancer)/freelancer/jobs/[id]/page.html" class="btn btn-secondary text-xs">View SOW Details →</a>
              </div>
            ))}
          </div>
        </div>
      );
    }
    ReactDOM.render(<JobsDrillDownView />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Jobs Drill-Down', relRoot, '', script), 'utf8');
}

// 24. components/workspace/UnifiedWorkspace.html
function buildUnifiedWorkspacePage() {
  const filePath = 'components/workspace/UnifiedWorkspace.html';
  const relRoot = getRelRoot(filePath);
  const script = `
    function UnifiedWorkspaceView() {
      const [messages, setMessages] = React.useState([]);
      const [chatInput, setChatInput] = React.useState('');
      const [scopeVersion, setScopeVersion] = React.useState(1);
      const [remainingHours, setRemainingHours] = React.useState(2);
      const [requests, setRequests] = React.useState([
        { id: 'R1', text: 'Add payment checkout', hours: 6, cost: 6000, status: 'pending', flag: 'Explicit Exclusion Override' },
        { id: 'R2', text: 'Fix broken contact form', hours: 2, cost: 0, status: 'pending', flag: 'Internal Defect Rework' }
      ]);

      const handleSendMessage = (customText) => {
        const text = customText || chatInput;
        if (!text.trim()) return;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { id: Date.now(), sender: 'Freelancer_Dev', text, time: now }]);
        setChatInput('');
      };

      const handleAiExtract = () => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [
          ...prev,
          { id: Date.now(), sender: 'Freelancer_Dev', text: '@AI Analyze chat and quote scope variance', time: now },
          { id: Date.now() + 1, sender: 'Meta_AI', text: '[@AI] Scanned messages against SOW v1.\\n\\n• Baseline Included: "one landing page", "contact form"\\n• Baseline Excluded: "payment checkout"\\n\\nDetected Exclusion Override: R1 ("Add payment checkout") for 6h @ ₹1,000/hr = ₹6,000 before taxes.', time: now }
        ]);
      };

      const handleApprove = (id) => {
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
        setScopeVersion(v => v + 1);
      };

      const handleReject = (id) => {
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
        setScopeVersion(v => v + 1);
      };

      return (
        <div class="grid grid-cols-12 gap-6 h-[720px]">
          <!-- Left: Chat Panel -->
          <div class="col-span-7 bg-white border border-silver rounded-2xl flex flex-col overflow-hidden">
            <div class="p-4 border-b border-silver flex items-center justify-between bg-floral-white">
              <div>
                <span class="badge badge-paprika mb-1">[Project Chat]</span>
                <h2 class="font-bold text-sm text-carbon-black">Chat with Client_A</h2>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge badge-carbon">[Quota: 0/5 Calls Used]</span>
                <a href="${relRoot}components/call/Call.html" class="btn btn-secondary text-xs py-1 px-3">[Call] Start Call</a>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-floral-white/30">
              {messages.length === 0 ? (
                <div class="h-full flex flex-col items-center justify-center text-center p-6 text-charcoal-brown space-y-2">
                  <span class="badge badge-carbon">[Empty Workspace Chat]</span>
                  <p class="text-xs">Type below or trigger @AI assistant.</p>
                  <button onClick={() => handleSendMessage('Hello Client_A! Ready to start on the landing page.')} class="btn btn-secondary text-xs">
                    Say Hello
                  </button>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} class={'p-3 rounded-xl max-w-lg text-xs space-y-1 ' + (m.sender === 'Meta_AI' ? 'bg-floral-white border-2 border-spicy-paprika mx-auto' : 'bg-white border border-silver')}>
                    <div class="flex justify-between font-bold text-carbon-black text-[11px]">
                      <span>{m.sender}</span>
                      <span class="text-charcoal-brown font-normal">{m.time}</span>
                    </div>
                    <div class="whitespace-pre-wrap">{m.text}</div>
                  </div>
                ))
              )}
            </div>

            <!-- Quick AI Bar -->
            <div class="p-2 border-t border-silver bg-floral-white flex gap-2">
              <button onClick={handleAiExtract} class="btn btn-secondary py-1 text-xs">@AI Extract Scope Requests</button>
              <button onClick={() => handleSendMessage('@AI Compare Baseline SOW v1')} class="btn btn-secondary py-1 text-xs">@AI Compare Baseline</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} class="p-3 border-t border-silver flex gap-2 bg-white">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type message or @AI query..."
                class="flex-1 px-3 py-2 border border-silver rounded-lg text-xs bg-floral-white font-semibold focus:outline-none"
              />
              <button type="submit" class="btn btn-primary text-xs">Send</button>
            </form>
          </div>

          <!-- Right: ScopeDesk Drawer -->
          <div class="col-span-5 bg-white border border-silver rounded-2xl p-5 flex flex-col overflow-y-auto space-y-4">
            <div class="flex items-center justify-between border-b border-silver pb-3">
              <div>
                <span class="badge badge-carbon">[Scope Engine]</span>
                <h3 class="font-bold text-base text-carbon-black mt-1">ScopeDesk (SOW v{scopeVersion})</h3>
              </div>
              <span class="badge badge-paprika font-bold">{remainingHours}h remaining</span>
            </div>

            <!-- Boundaries -->
            <div class="p-3 bg-floral-white border border-silver rounded-xl text-xs space-y-2">
              <div class="font-bold text-carbon-black">SOW v1 Scope Boundaries:</div>
              <div class="flex gap-2">
                <span class="badge badge-carbon">[In: landing page, form]</span>
                <span class="badge badge-paprika">[Out: payment checkout]</span>
              </div>
            </div>

            <!-- Requests -->
            <div class="space-y-3 flex-1 overflow-y-auto">
              <div class="font-bold text-xs text-carbon-black">Change Orders ({requests.length}):</div>
              {requests.map(r => (
                <div key={r.id} class="p-3 border border-silver rounded-xl bg-floral-white text-xs space-y-2">
                  <div class="flex justify-between items-center">
                    <strong class="text-carbon-black">{r.id}: {r.text}</strong>
                    <span class="badge">{r.status.toUpperCase()}</span>
                  </div>
                  <div class="text-[11px] text-spicy-paprika font-bold">{r.flag}</div>
                  <div class="flex justify-between text-[11px] text-charcoal-brown">
                    <span>Effort: {r.hours}h</span>
                    <span>Cost: ₹{r.cost.toLocaleString()} before tax</span>
                  </div>
                  {r.status === 'pending' ? (
                    <div class="flex justify-end gap-2 pt-1 border-t border-silver">
                      <button onClick={() => handleApprove(r.id)} class="btn btn-primary py-1 px-3 text-xs">[Approve]</button>
                      <button onClick={() => handleReject(r.id)} class="btn btn-secondary py-1 px-3 text-xs">[Reject]</button>
                    </div>
                  ) : (
                    <div class="text-[11px] text-charcoal-brown font-bold text-right">[{r.status === 'approved' ? 'Committed into SOW' : 'Rejected - 0h booked'}]</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    ReactDOM.render(<UnifiedWorkspaceView />, document.getElementById('root'));
  `;
  ensureDir(filePath);
  fs.writeFileSync(filePath, htmlBoilerplate('Unified Workspace', relRoot, '', script), 'utf8');
}

// Generate all 24 files
console.log('Generating all 24 HTML files...');
buildAppLayout();
buildAppPage();
buildClientLayout();
buildClientDashboardPage();
buildClientJobsPage();
buildClientNewJobPage();
buildClientJobDetailPage();
buildClientProjectDetailPage();
buildAmendmentUploadPage();
buildChangeOrderReviewPage();
buildFreelancerLayout();
buildFreelancerPortalPage();
buildFreelancerJobsPage();
buildFreelancerJobDetailPage();
buildFreelancerProfilePage();
buildFreelancerProjectDetailPage();
buildUiComponentsPage();
buildTopBarPage();
buildChatPage();
buildCallPage();
buildChangeListPage();
buildSowUploadPage();
buildJobsDrillDownPage();
buildUnifiedWorkspacePage();

console.log('All 24 HTML files successfully created!');
