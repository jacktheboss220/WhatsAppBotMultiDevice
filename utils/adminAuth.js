import { createHash, timingSafeEqual } from "crypto";

const sha = (s) => createHash("sha256").update(String(s)).digest();

// Fails closed: an unset/blank ADMIN_PASSWORD never matches (previously undefined === undefined logged in).
export const checkAdminPassword = (input) => {
	const expected = process.env.ADMIN_PASSWORD;
	if (!expected || typeof input !== "string") return false;
	return timingSafeEqual(sha(input), sha(expected));
};

// ponytail: in-memory per-process limiter (resets on restart, one instance only). Use Redis if you scale out.
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const fails = new Map(); // ip -> { count, resetAt }

export const loginBlocked = (ip) => {
	const e = fails.get(ip);
	if (!e) return false;
	if (Date.now() > e.resetAt) return fails.delete(ip), false;
	return e.count >= MAX_FAILS;
};

export const recordLoginFail = (ip) => {
	if (fails.size > 1000) for (const [k, v] of fails) if (Date.now() > v.resetAt) fails.delete(k);
	const e = fails.get(ip);
	if (e && Date.now() <= e.resetAt) e.count++;
	else fails.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS });
};

export const clearLoginFails = (ip) => fails.delete(ip);

// Google login gate: a non-empty, not-explicitly-unverified email that is on GOOGLE_ALLOWED_EMAILS.
// An empty/unset list allows nobody (it used to be [""], which let a profile with no email in).
export const isAllowedGoogleProfile = (profile, allowedCsv) => {
	const e = profile?.emails?.[0];
	const email = String(e?.value || "").trim().toLowerCase();
	if (!email || e?.verified === false) return false;
	const allowed = String(allowedCsv || "")
		.split(",")
		.map((x) => x.trim().toLowerCase())
		.filter(Boolean);
	return allowed.includes(email);
};

// Self-check: `bun utils/adminAuth.js`
if (import.meta.main) {
	const assert = (await import("assert")).strict;
	delete process.env.ADMIN_PASSWORD;
	assert.equal(checkAdminPassword(undefined), false, "unset password must not accept undefined");
	assert.equal(checkAdminPassword(""), false, "unset password must not accept empty");
	process.env.ADMIN_PASSWORD = "";
	assert.equal(checkAdminPassword(""), false, "blank password must not accept empty");
	process.env.ADMIN_PASSWORD = "s3cret";
	assert.equal(checkAdminPassword("s3cret"), true);
	assert.equal(checkAdminPassword("wrong"), false);
	assert.equal(checkAdminPassword({ $ne: 1 }), false, "non-string rejected");
	for (let i = 0; i < MAX_FAILS; i++) {
		assert.equal(loginBlocked("1.2.3.4"), false);
		recordLoginFail("1.2.3.4");
	}
	assert.equal(loginBlocked("1.2.3.4"), true, "blocked after MAX_FAILS");
	assert.equal(loginBlocked("5.6.7.8"), false, "other IPs unaffected");
	clearLoginFails("1.2.3.4");
	assert.equal(loginBlocked("1.2.3.4"), false, "cleared on success");
	const ok = { emails: [{ value: "Me@Example.com", verified: true }] };
	assert.equal(isAllowedGoogleProfile(ok, "a@x.com, me@example.com"), true, "case/space-insensitive match");
	assert.equal(isAllowedGoogleProfile(ok, "a@x.com"), false, "not on list");
	assert.equal(isAllowedGoogleProfile(ok, ""), false, "empty list allows nobody");
	assert.equal(isAllowedGoogleProfile(ok, undefined), false, "unset list allows nobody");
	assert.equal(isAllowedGoogleProfile({ emails: [] }, ""), false, "no-email profile no longer matches [''] ");
	assert.equal(isAllowedGoogleProfile({}, ",,"), false);
	assert.equal(isAllowedGoogleProfile({ emails: [{ value: "me@example.com", verified: false }] }, "me@example.com"), false, "unverified email rejected");
	console.log("adminAuth ok");
}
