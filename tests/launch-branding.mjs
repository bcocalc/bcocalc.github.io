import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const brandingChanges={
  "manifest.json": [
    [
      "TapCalc workspace pre-alpha26; legacy calculator retained",
      "TapCalc build 26; legacy calculator available"
    ]
  ],
  "pre-alpha/index.html": [
    [
      "<title>TapCalc Pre-Alpha 26</title>",
      "<title>TapCalc</title>"
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
  ]
};
const originalHashes={
  "manifest.json": "479a51a3de2ccee5c46c661591395031a6126b6241ec3a612d4640b05c38f763",
  "pre-alpha/index.html": "65c4bdaf0112c3c84a884a833bd78c78f2839c4180560fa6fc752388d8234e9f",
  "pre-alpha/workspace.mjs": "7c022f517bf6c0267cd4cd87d142bf705eb412e40282b15916236c1caab2f3f7",
  "pre-alpha/presentation.mjs": "a4ce6bafdd4fc12afb2ceca143e6c3a170314c05b7ed64e6b573768e5e311aa6",
  "pre-alpha/eta.mjs": "4965f21715256b1999f4196f372d4f6131177c35c503c86a8edef46f40cb105f",
  "pre-alpha/review.mjs": "d7ad56dec76c203d679e6348c32ea8c214f594d734e9d1b90b4a67b4f75d3a03",
  "pre-alpha/references.mjs": "63c47ac3a690033ab6fa28ec7be3f45c3ebc1c2c31904e468732a059dda2d885"
};
export function restoreBranding(path,source){for(const [before,after,count=1]of [...(brandingChanges[path]||[])].reverse()){assert.equal(source.split(after).length,count+1,'Exact approved display-only branding: '+path);source=source.split(after).join(before);}return source;}
for(const [path,pin]of Object.entries(originalHashes)){const source=readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');assert.equal(createHash('sha256').update(restoreBranding(path,source)).digest('hex'),pin,'Preserve every nonbranding byte from passed60e0546: '+path);}
const manifest=JSON.parse(readFileSync(new URL('../manifest.json',import.meta.url),'utf8'));assert.equal(manifest.name,'TapCalc');assert.equal(manifest.short_name,'TapCalc');assert.equal(manifest.id,'./measurement-card.html?v=3.0.0-livefix21');assert.equal(manifest.start_url,'./pre-alpha/?v=pre-alpha26');assert.equal(manifest.scope,'./');
console.log('PASS launch branding: exact reversible display-only labels against passed60e0546; build token, routes, installed identity, data/working-copy identifiers, warnings and legacy fallback preserved.');
