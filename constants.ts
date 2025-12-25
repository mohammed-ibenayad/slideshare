import { Presentation, PresentationFramework, PrivacyMode } from './types';

export const MOCK_PRESENTATIONS: Presentation[] = [
  {
    id: '1',
    title: 'The Future of Web Components',
    description: 'A deep dive into Shadow DOM, Custom Elements, and how they shape the modern web landscape.',
    authorId: 'u1',
    authorName: 'Sarah Jenkins',
    thumbnailUrl: 'https://picsum.photos/seed/web/400/225',
    framework: PresentationFramework.REVEAL_JS,
    privacy: PrivacyMode.PUBLIC,
    views: 12500,
    uploadedAt: '2023-10-15T10:00:00Z',
    tags: ['web', 'javascript', 'frontend'],
    slides: [
      `
      <div style="background:#111; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;">
        <h1 style="font-size:3rem; margin-bottom:1rem;">Web Components 2024</h1>
        <p>The standard is evolving.</p>
        <div style="margin-top:2rem; padding:1rem; border:1px solid #333;">Slide 1 of 3</div>
      </div>
      `,
      `
      <div style="background:#111; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;">
        <h2 style="font-size:2.5rem; margin-bottom:1rem;">Shadow DOM</h2>
        <p>Encapsulation is key.</p>
        <div style="margin-top:2rem; padding:1rem; border:1px solid #333;">Slide 2 of 3</div>
      </div>
      `,
      `
      <div style="background:#111; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;">
        <h2 style="font-size:2.5rem; margin-bottom:1rem;">Custom Elements</h2>
        <p>Define your own tags.</p>
        <div style="margin-top:2rem; padding:1rem; border:1px solid #333;">Slide 3 of 3</div>
      </div>
      `
    ]
  },
  {
    id: '2',
    title: 'Q3 Financial Overview (Redacted)',
    description: 'Quarterly results for internal stakeholders. Sensitive data has been obfuscated.',
    authorId: 'u2',
    authorName: 'Finance Dept',
    thumbnailUrl: 'https://picsum.photos/seed/finance/400/225',
    framework: PresentationFramework.CUSTOM,
    privacy: PrivacyMode.SAMPLE_OBFUSCATED,
    views: 340,
    uploadedAt: '2023-11-01T08:30:00Z',
    tags: ['finance', 'internal', 'q3'],
    slides: [
      `
      <div style="background:#f0f9ff; color:#0f172a; height:100vh; padding:40px; font-family:serif;">
        <h1 style="color:#0369a1;">Quarterly Report</h1>
        <p>Revenue: $XXX,XXX (Obfuscated)</p>
        <p>Growth: XX%</p>
      </div>
      `
    ]
  },
  {
    id: '3',
    title: 'UX Design Principles for VR',
    description: 'Adapting 2D design patterns for 3D spatial environments.',
    authorId: 'u3',
    authorName: 'Marcus Chen',
    thumbnailUrl: 'https://picsum.photos/seed/vr/400/225',
    framework: PresentationFramework.IMPRESS_JS,
    privacy: PrivacyMode.PUBLIC,
    views: 8900,
    uploadedAt: '2023-09-20T14:15:00Z',
    tags: ['ux', 'design', 'vr'],
    slides: [
      `
      <div style="background:linear-gradient(to right, #4f46e5, #9333ea); color:white; height:100vh; display:flex; align-items:center; justify-content:center;">
        <h1>Thinking Spatially</h1>
      </div>
      `
    ]
  },
  {
    id: '4',
    title: 'Introduction to Rust',
    description: 'Memory safety without garbage collection. Why everyone is switching.',
    authorId: 'u4',
    authorName: 'Alex Rustacean',
    thumbnailUrl: 'https://picsum.photos/seed/rust/400/225',
    framework: PresentationFramework.REVEAL_JS,
    privacy: PrivacyMode.PUBLIC,
    views: 45000,
    uploadedAt: '2023-12-05T09:00:00Z',
    tags: ['rust', 'systems', 'programming'],
    slides: [`<h1>Rust</h1><p>Blazingly fast.</p>`]
  }
];