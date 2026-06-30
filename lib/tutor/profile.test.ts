// Runnable check for name detection. Run: node lib/tutor/profile.test.ts
import assert from "node:assert/strict";
import { detectName } from "./profile.ts";

assert.equal(detectName("call me Liz, not Elizabeth"), "Liz", "call me X");
assert.equal(detectName("my name is matt"), "Matt", "my name is X (capitalizes)");
assert.equal(detectName("please call me Sam!"), "Sam", "please call me X");
assert.equal(detectName("I'm confused about loops"), null, "no false positive on I'm X");
assert.equal(detectName("hello there"), null, "no name mentioned");

console.log("profile.test: all assertions passed ✓");
