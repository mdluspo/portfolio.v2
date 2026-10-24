# Martin Luspo — Portfolio v2

An interactive car-dashboard portfolio built with JavaScript, CSS, and Vite.

## Development

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

```sh
npm test         # Motion, content, and DOM navigation checks
npm run build   # Production output in dist/
npm run preview # Serve the production build locally
```

## Project layout

```text
index.html                  Page markup and dialog templates
src/
  main.js                   Application startup, input, and view coordination
  driving/                  Camera, speed, suspension, steering, and crash logic
  animations/               Ignition, pins, USB flight, and dialog motion
  projects/                 Project catalogue and case study page rendering
  content/case-studies/      Case study text and page content
  scene/                    Dashboard technology pin rendering
  styles/
    base.css                Site, dashboard, and shared paper styling
    objects.css             Tablet, inspectable ID, and shortcut menu
    case-studies.css        Binder, page turns, typography, and photo layouts
public/
  assets/                   Artwork, photos, fonts, and project screenshots
  documents/                Downloadable resume
tests/                      Automated tests
```

## Editing content

- Edit project names, descriptions, previews, and links in `src/projects/projects.js`.
- Edit eLife's pages in `src/content/case-studies/elife.js`. Each array entry is one paper page; two pages form a spread. Its spread count is calculated from the content.
- Update dialog and scene markup in `index.html`.
- Keep stylesheet links in their current order: base, objects, then case studies. The order preserves the existing visual overrides.

Files in `public/` are served from the site root. For example, `public/assets/egov_group.png` is referenced as `/assets/egov_group.png`. Asset URLs remain stable during source organization.

The navigation test uses a simulated DOM and animation timing. It checks application transitions, not browser rendering. Visually check the intro, dashboard, project dialogs, and case study page turns after layout changes.

`dist/`, `node_modules/`, `.npm-cache/`, and `.asset-tools/` are ignored. `.asset-tools/` contains local asset preparation scripts and earlier visual checks; maintained application checks belong in `tests/`.
