import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const brandingChanges={
  "manifest.json": [
    [
      "TapCalc workspace pre-alpha26; legacy calculator retained",
      "TapCalc V.3, build 26; legacy calculator available"
    ],
    [
      "\"name\": \"TapCalc\"",
      "\"name\": \"TapCalc V.3\""
    ],
    [
      "\"short_name\": \"TapCalc\"",
      "\"short_name\": \"TapCalc V.3\""
    ]
  ],
  "pre-alpha/index.html": [
    [
      "<title>TapCalc Pre-Alpha 26</title>",
      "<title>TapCalc V.3</title>"
    ],
    [
      "<span class=\"edition\">PRE-ALPHA 26</span>",
      "<span class=\"edition\">BUILD 26</span>"
    ],
    [
      "A new workspace, taking shape.",
      "Your jobs and references, in one workspace."
    ],
    [
      "<span class=\"experiment-detail\">Experimental jobs save separately on this device.</span>",
      "<span class=\"experiment-detail\">Working copies save on this device.</span>"
    ],
    [
      ">Pre-Alpha saves <span",
      ">Working copies <span"
    ],
    [
      "Pre-Alpha working copies save separately on this device.",
      "Working copies save separately on this device."
    ],
    [
      "<span class=\"release\">DESIGN STUDY / 01</span>",
      "<span class=\"release\">FIELD WORKSPACE</span>"
    ],
    [
      "Open a past job and try it in the new workspace.",
      "Open a saved job or continue a working copy."
    ],
    [
      "name=\"apple-mobile-web-app-title\" content=\"TapCalc\"",
      "name=\"apple-mobile-web-app-title\" content=\"TapCalc V.3\""
    ],
    [
      "aria-label=\"TapCalc Home\"",
      "aria-label=\"TapCalc V.3 Home\""
    ],
    [
      "</span>TapCalc<span class=\"edition\">",
      "</span>TapCalc V.3<span class=\"edition\">"
    ]
  ],
  "pre-alpha/workspace.mjs": [
    [
      "'SHARED JOB / PRE-ALPHA WORKING COPY'",
      "'SHARED JOB / LOCAL WORKING COPY'"
    ],
    [
      "'DEVICE JOB / PRE-ALPHA WORKING COPY'",
      "'DEVICE JOB / LOCAL WORKING COPY'"
    ],
    [
      "'PRE-ALPHA JOB'",
      "'LOCAL WORKING COPY'"
    ],
    [
      "equipment-specific calculations are still being connected in Pre-Alpha.",
      "equipment-specific calculations are not available in this workspace."
    ],
    [
      "Your experimental working copies will appear here.",
      "Your working copies will appear here."
    ],
    [
      "and its measurements from this Pre-Alpha working copy?",
      "and its measurements from this working copy?"
    ],
    [
      "calculations are still being connected in this design study.",
      "calculations are not connected in this workspace."
    ]
  ],
  "pre-alpha/presentation.mjs": [
    [
      "source==='device'?'Device save':'Pre-Alpha copy'",
      "source==='device'?'Device save':'Working copy'"
    ]
  ],
  "pre-alpha/eta.mjs": [
    [
      "Cutting-time ETA is only connected for standard Hot Tap stages in Pre-Alpha.",
      "Cutting-time ETA is only connected for standard Hot Tap stages."
    ]
  ],
  "pre-alpha/review.mjs": [
    [
      "Equipment-specific calculations are not connected in Pre-Alpha. Saved values are for review only.",
      "Equipment-specific calculations are not connected in this workspace. Saved values are for review only."
    ],
    [
      "Saved actual POP is retained but is not applied in Pre-Alpha. Results use the setup measurements.",
      "Saved actual POP is retained but is not applied in this workspace. Results use the setup measurements."
    ]
  ],
  "pre-alpha/references.mjs": [
    [
      "SUPPLEMENT.fieldChecklistNote",
      "fieldChecklistNote",
      2
    ],
    [
      "SUPPLEMENT.stopMathNote",
      "stopMathNote",
      2
    ],
    [
      "extracted reference text is available with the pre-alpha offline assets.",
      "extracted reference text is available with the workspace offline assets."
    ],
    [
      "import {helperFields,helperReference,PIVOT_NOTES,FOLDING_NOTES,UWIRE_NOTES} from './reference-helpers.mjs?v=pre-alpha26';",
      "import {helperFields,helperReference,PIVOT_NOTES,FOLDING_NOTES,UWIRE_NOTES} from './reference-helpers.mjs?v=pre-alpha26';\nconst fieldChecklistNote=SUPPLEMENT.fieldChecklistNote.replace('this pre-alpha study','this workspace').replace('pre-alpha edits','working-copy edits');\nconst stopMathNote=SUPPLEMENT.stopMathNote.replace('the pre-alpha general','the general');"
    ]
  ],
  "pre-alpha/modern-view.mjs": [
    [
      "escape(item.record.meta?.version||'an unrecorded build')",
      "escape(String(item.record.meta?.version||'an unrecorded build').replace(/^pre-alpha(\\d+)$/,'TapCalc build $1'))"
    ]
  ],
  "index.html": [
    [
      "<title>TapCalc</title>",
      "<title>TapCalc V.3</title>"
    ],
    [
      "name=\"apple-mobile-web-app-title\" content=\"TapCalc\"",
      "name=\"apple-mobile-web-app-title\" content=\"TapCalc V.3\""
    ],
    [
      "<h1>TapCalc</h1>",
      "<h1>TapCalc V.3</h1>"
    ]
  ],
  "pre-alpha/exports.mjs": [
    [
      "const lines=['TapCalc','Job: '",
      "const lines=['TapCalc V.3','Job: '"
    ],
    [
      "<title>TapCalc</title>",
      "<title>TapCalc V.3</title>"
    ],
    [
      "<h1>TapCalc</h1>",
      "<h1>TapCalc V.3</h1>"
    ],
    [
      "ctx.fillText('TapCalc',50,68)",
      "ctx.fillText('TapCalc V.3',50,68)"
    ]
  ]
};
const originalHashes={
  "manifest.json": "479a51a3de2ccee5c46c661591395031a6126b6241ec3a612d4640b05c38f763",
  "pre-alpha/index.html": "65c4bdaf0112c3c84a884a833bd78c78f2839c4180560fa6fc752388d8234e9f",
  "pre-alpha/workspace.mjs": "7c022f517bf6c0267cd4cd87d142bf705eb412e40282b15916236c1caab2f3f7",
  "pre-alpha/presentation.mjs": "a4ce6bafdd4fc12afb2ceca143e6c3a170314c05b7ed64e6b573768e5e311aa6",
  "pre-alpha/eta.mjs": "4965f21715256b1999f4196f372d4f6131177c35c503c86a8edef46f40cb105f",
  "pre-alpha/review.mjs": "d7ad56dec76c203d679e6348c32ea8c214f594d734e9d1b90b4a67b4f75d3a03",
  "pre-alpha/references.mjs": "63c47ac3a690033ab6fa28ec7be3f45c3ebc1c2c31904e468732a059dda2d885",
  "pre-alpha/modern-view.mjs": "461ee6a9e6de0644f792ef6c1bc5126446a21c92bf132d965464f81d300a5daa",
  "index.html": "0bd867f99dab99483894b03289b02c8f0230f8818df3eaf2736c8bd352d1f008",
  "pre-alpha/exports.mjs": "746b0e28292dd874a714899b0971eb0638ad7e503efff9ce6dd833ff535c54a0"
};
export function restoreBranding(path,source){for(const [before,after,count=1]of [...(brandingChanges[path]||[])].reverse()){assert.equal(source.split(after).length,count+1,'Exact approved display-only branding: '+path);source=source.split(after).join(before);}return source;}
for(const [path,pin]of Object.entries(originalHashes)){const source=readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');assert.equal(createHash('sha256').update(restoreBranding(path,source)).digest('hex'),pin,'Preserve every nonbranding byte from passed60e0546: '+path);}
const manifest=JSON.parse(readFileSync(new URL('../manifest.json',import.meta.url),'utf8'));assert.equal(manifest.name,'TapCalc V.3');assert.equal(manifest.short_name,'TapCalc V.3');assert.equal(manifest.id,'./measurement-card.html?v=3.0.0-livefix21');assert.equal(manifest.start_url,'./pre-alpha/?v=pre-alpha26');assert.equal(manifest.scope,'./');
console.log('PASS launch branding: exact reversible display-only labels against passed60e0546; build token, routes, installed identity, data/working-copy identifiers, warnings and legacy fallback preserved.');

const {modernSnapshotMarkup}=await import('../pre-alpha/modern-view.mjs');
for(const version of ['pre-alpha26','pre-alpha17','old-build<&>']){const item={record:{meta:{version},preAlphaCapture:{job:{title:'Synthetic branding',operations:[]},operations:[]}}},before=JSON.stringify(item),markup=modernSnapshotMarkup({item});assert.equal(JSON.stringify(item),before,'Captured record bytes stay unchanged');assert.ok(markup.includes(version.startsWith('pre-alpha')?'Captured with TapCalc build '+version.slice(9):'Captured with old-build&lt;&amp;&gt;'),'Format only known build branding; escape unknown provenance');assert.ok(markup.includes('Complete preserved snapshot'),'Raw original record remains available');}

const {buildExportText,printDocument}=await import('../pre-alpha/exports.mjs');assert.equal(buildExportText({title:'Synthetic V.3',operations:[]}).split('\n')[0],'TapCalc V.3');assert.match(printDocument('Synthetic only'),/<title>TapCalc V\.3<\/title>/);assert.match(printDocument('Synthetic only'),/<h1>TapCalc V\.3<\/h1>/);
