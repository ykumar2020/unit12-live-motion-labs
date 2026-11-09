# Version 2 verification

Verified November 9, 2026. Eight production builds passed. Four normalization unit tests passed. All 26 Chromium checks passed: actual live requests, response checksums, animated scenes, controls, mobile panning, reduced motion and controlled provider outages with no saved fallback.

Seven upstream endpoints returned HTTP 200 with usable records during the live audit. Evidence is summarized in evidence/verification.json. These checks establish the recorded result, not future availability of third-party free services.

The public deployment uses /labs/1/ through /labs/8/ and /api/data/:key. Local development still uses ports 5281-5288. Run npm run audit:live to verify current upstream availability and npm run test:browser with local servers running to repeat browser checks.
