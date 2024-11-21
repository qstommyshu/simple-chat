// tests/autoCompleteUrl.tests.ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import {autoCompleteUrl} from "../utils/index.ts";

Deno.test("autoCompleteUrl should return an empty string for invalid URLs", () => {
  assertEquals(autoCompleteUrl("invalid-url"), "");
});

Deno.test("autoCompleteUrl should complete URLs with missing protocol", () => {
  assertEquals(autoCompleteUrl("www.example.com"), "https://www.example.com");
});

Deno.test("autoCompleteUrl should complete URLs with missing subdomain", () => {
  assertEquals(autoCompleteUrl("example.com"), "https://www.example.com");
});

Deno.test("autoCompleteUrl should handle URLs with full structure", () => {
  assertEquals(autoCompleteUrl("http://example.com/path"), "http://www.example.com/path");
});