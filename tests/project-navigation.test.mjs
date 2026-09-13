import test from "node:test";
import assert from "node:assert/strict";
import { projectHref, projectFromLocation, isPlainNavigation } from "../src/projectNavigation.js";
import { projects } from "../src/projects.js";

test("project URLs retain the originating route, parameters and section", () => {
  const location = new URL("https://portfolio.test/services?source=referral#contact");
  assert.equal(projectHref(projects[2], location), "/services?source=referral&project=wise-digital-cards#contact");
});

test("selection follows URLs, including Back to a section and invalid IDs", () => {
  assert.equal(projectFromLocation(projects, new URL("https://portfolio.test/?project=wise-digital-cards#work")), projects[2]);
  assert.equal(projectFromLocation(projects, new URL("https://portfolio.test/#work")), null);
  assert.equal(projectFromLocation(projects, new URL("https://portfolio.test/?project=missing")), null);
});

test("project navigation preserves native modified clicks and middle clicks", () => {
  assert.equal(isPlainNavigation({button: 0}), true);
  for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey", "defaultPrevented"]) {
    assert.equal(isPlainNavigation({button: 0, [modifier]: true}), false);
  }
  assert.equal(isPlainNavigation({button: 1}), false);
});

test("approved order, film and single Wise still stay intact", () => {
  assert.deepEqual(projects.slice(0,3).map(project => project.id), ["wise-future-store-london", "hublot-tourbillion", "wise-digital-cards"]);
  assert.equal(projects[2].youtubeId, "_EC-MCCvu5s");
  assert.equal(projects[2].gallery.length, 1);
  assert.match(projects[2].gallery[0], /transactions-universal/);
});
