## SMDR Project (Svelte 5 CMS - as of 2025-12-21)

**Project Path**: `/home/es/Prj/digiteco/repo/smdr/`
**Type**: Markdown-based CMS built with SvelteKit
**Primary Function**: Content management and markdown editing interface

### Project Stack
- **Frontend**: SvelteKit + Svelte 5, Tailwind CSS, shadcn-svelte
- **Backend**: Node.js/SvelteKit API routes
- **Database**: (TBD)
- **File Handling**: XHR-based upload with progress tracking (100MB limit)
- **File Types**: MIME validation for images, documents, PDFs

### Route Structure
- `/` - Home page
- `/(auth)` - Authentication routes
- `/edit/[...slug]` - Main dual-editor edit page (fully documented)
- `/assets` - Asset management
- `/api` - Backend endpoints
- `/contatti` - Contact management
- `/[...slug]` - Dynamic content routing


### Letta Integration (New Features - 2026-01-08)
**Goal**: Seamless integration with Letta for AI memory and document indexing.

**Key Features**:
1.  **Indexing & File Upload**:
    - **Direct File Upload**: `IndexFileDialog` allows uploading files directly from the browser for indexing.
    - **Legacy Support**: Replaces previous server-path-only inputs with actual file transfer handling.
2.  **Memory Manager**:
    - **Project ID**: Configured via env (`PROJECT_ID`) to scope all operations.
    - **Auto-Sync**: Document synchronization respects global project settings.
3.  **Folder Management & Sync**:
    - **Automatic Attachment**: Agents are automatically linked to the project folder (`semantic_search_files`).
    - **Smart Renaming**: Changing `LETTA_FOLDER_NAME` in Admin UI triggers a re-link of all agents.
    - **Sync Deletion**: Deleting a file in the CMS automatically removes the corresponding document from the Letta index.

### Edit Page (`/edit/[...slug]`)

**`+page.server.ts`** - Server Actions:
- `load()`: Returns children, md_only, frontmatter, slug, listAssets (md/pdf/img)
- `frontmatter`: Saves title, description, slug, updatedAt to YAML frontmatter
- `save`: Saves markdown content, preserves frontmatter
- `upload`: Handles file uploads (discriminates .md vs assets)
- `delete`: Removes files from filesystem

**`+page.svelte`** - UI Components:
- Dual-editor toggle: TuiEditor (rich) ↔ Crepe (lightweight)
- Resizable panes: 80% editor / 20% assets panel
- Auto-save: Every 300s (5 min) with confirmation dialog
- Metadata form: Title, directory, description, auto-generated slug
- Command menu: Save, Preview (Eye), New file (FilePlus), Editor toggle, Index File (New)
- Slug auto-generation: From title + directory path

### Components Reviewed
- **Nav.svelte** - Responsive header with dropdown menus
- **SideNav.svelte** - Collapsible sidebar with nested navigation
- **UploadForm.svelte** - File upload with validation/progress tracking
- **TuiEditor.svelte** - Rich markdown editor with plugins (table merge, code syntax, chart, UML)
- **Crepe.svelte** - Lightweight markdown editor
- **Assets.svelte** - Asset management and preview panel
- **IndexFileDialog.svelte** - Dialog for uploading files to Letta index

### Utilities
- **utils.ts** - `cn()` helper for class merging
- **upload store** - XHR-based progress tracking
- **file types config** - MIME validation, 100MB limit

### Other Route Pages
- **/home**: Features a `Gallery` component displaying links passed from data.
- **/contatti**:
  - Interactive Map (Customer HQ via `svelte-maplibre`).
  - `Guestbook` component for user comments.
  - Markdown content rendering via `MarkdocRenderer`.
  - Edit mode pencil icon (visible to authenticated users).
- **/assets**: Static asset management route.
- **/admin/letta**: Administration panel for Letta integration.
  - **Configuration**: UI to manage `LETTA_API_KEY`, `BASE_URL`, `PROJECT_ID`, and `FOLDER_NAME`.
  - **Sync Manager**: Triggers full synchronization of `webdocs/` directory.
  - **Status Dashboard**: Displays current project folder connection and integration status.
  - **Actions**:
    - `saveConfig`: Updates `.env` and re-links agents.
    - `syncMemory`: Iterates through all markdown files and uploads them to Letta.
    - `indexContent`: Handles file/directory indexing (Browser & Legacy modes).

### API Endpoints
- **Core**:
  - `/api/nav/menu`: Returns navigation menu structure.
  - `/api/links`: Returns link data for the gallery.
  - `/api/upload`: Handles file uploads (mapped to `filesystem-service`).
  - `/api/guestbook`: Manages guestbook entries.
- **Letta Integration** (`/api/letta/*`):
  - `/api/letta/chat`: Handles chat interactions with Letta agents.
  - `/api/letta/stats`: Retrieves agent statistics.
  - `/api/letta/sync`: Manages file synchronization status.
  - `/api/letta/sync-directory`: Handles directory-level sync operations.

### Database & Persistence
- **ORM**: Prisma
- **Database Engine**: SQLite
- **Schema**:
  - `User`: Stores credentials and tokens (`id`, `username`, `passwordHash`, `userAuthToken`, `roleId`).
  - `Roles`: Defines user roles (e.g., ADMIN, USER).
- **Prisma Integration**: Singleton instance exported from `$lib/server/database`.

### Authentication & Security
- **Type**: Custom Session-Based Authentication (Not Lucia).
- **Mechanism**:
  - `hooks.server.ts` intercepts all requests.
  - Validates `session` cookie against `User.userAuthToken` in database.
  - Populates `event.locals.user` if valid.
- **Modes** (Configurable via `AUTH_MODE`):
  - `edit-only` (Default): Protects only routes starting with `/edit`.
  - `all-protected`: Protects entire app except public routes (`/login`, `/register`, `/api`, etc.).
- **Security**:
  - Password hashing (implied by `passwordHash` field).
  - Role-based access control readiness in schema (`Roles` model).

### Documentation Status (as of 2026-01-08)
- [x] Project stack and technology overview
- [x] Route structure and key pages
- [x] Edit page architecture (+page.server.ts, +page.svelte)
- [x] Component architecture (Nav, SideNav, TuiEditor, Crepe, Assets, IndexFileDialog)
- [x] Letta Integration features
- [x] Utility functions and stores
- [x] API endpoints documentation
- [x] Database schema and data models
- [x] Authentication flow and security model
- [x] Other route pages (home, contatti, assets, [slug], t)
- [ ] Deployment configuration

---

## SMDR Git Branch Strategy (as of 2025-12-22 13:30 UTC)

### Branch Structure
- **master**: Base comune, sviluppo principale, codice generico
- **digiteco**: Personalizzazione per DigitEco s.r.l.

### Branch-Specific Customizations (Code Only - webdocs excluded)

#### **master** (Generic Base)
**Layout** (`src/routes/+layout.svelte`):
- Logo: `/logo.png` (w-24)
- Navbar: Standard fixed white background
- No homepage-specific styling

**Homepage** (`src/routes/home/+page.svelte`):
- Simple Gallery component
- No hero section

**Server** (`src/routes/+layout.server.ts`):
- Data structure: `{ items, mainNav, sideNav }`
- Loads menu from `/api/links/menu`

---

#### **digiteco** (DigitEco Customization)
**Layout** (`src/routes/+layout.svelte`):
- Logo: `/logo-digiteco-testo.png` (w-48)
- Navbar: Conditional transparent/absolute on homepage with `isHome` logic
- Dynamic styling: white text on homepage, normal on other pages

**Homepage** (`src/routes/home/+page.svelte`):
- Full hero section with background image (`/bg-home.jpg`)
- Slogan: "Innovazione al servizio dell'ambiente"
- Cookie consent banner
- Company info footer overlay
- CTA buttons for services/contacts

**Server** (`src/routes/+layout.server.ts`):
- Data structure: `{ navmenu, sidenav }` (different naming)
- Does NOT load from `/api/links/menu`

---

### Development Workflow (Current Strategy)
1.  **Feature development**: Create feature branches from master
2.  **Merge to master**: Test and merge generic features
3.  **Cherry-pick to customizations**: Apply commits to digiteco/savl branches
4.  **Never commit**: Brand-specific content to master
5.  **Content management**: webdocs/ directory always different per branch (excluded from analysis)

### Key Compatibility Notes (Updated 2025-12-22 13:47 UTC)
- **All three branches now use unified data structure** (as of 2025-12-22):
  - Returns: `{ navmenu, sidenav }` (2 properties)
  - All load from `/api/nav/menu` endpoint (parses webdocs/menu.md)
  - menu.md format: `* [title](link)` (bullet list required)
- **digiteco** has extensive homepage customization requiring isHome reactive logic
- **savl** is fully compatible with master (identical +layout.server.ts, minimal UI changes)
- All three share the same aesthetic improvements (Nav, SideNav, UserNav components)
- **Development workflow**: Feature branches from master → merge to master → cherry-pick to digiteco/savl