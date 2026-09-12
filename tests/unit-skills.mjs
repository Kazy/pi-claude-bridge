import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderSkillsBlock, selectedToolsCanRead, skillReadToolForMcp } from "../src/skills.js";

function skill(name, { disabled = false } = {}) {
	return {
		name,
		description: `${name} description`,
		filePath: `/skills/${name}/SKILL.md`,
		baseDir: `/skills/${name}`,
		sourceInfo: { source: "test", scope: "temporary", origin: "top-level" },
		disableModelInvocation: disabled,
	};
}

describe("skills block rendering", () => {
	it("formats skills and names the MCP read tool for provider queries", () => {
		const result = renderSkillsBlock([skill("browser")], "mcp");
		assert.ok(result?.startsWith("The following skills"));
		assert.match(result, /Use the read tool \(mcp__custom-tools__read\)/);
		assert.match(result, /<location>\/skills\/browser\/SKILL\.md<\/location>/);
	});

	it("names pi.read inside fabric_exec when Fabric is the only reader", () => {
		const result = renderSkillsBlock([skill("browser")], "fabric");
		assert.match(result, /Use `pi.read\(path\)` inside mcp__custom-tools__fabric_exec to load a skill's file/);
		assert.doesNotMatch(result, /mcp__custom-tools__read\b/);
		assert.match(result, /<location>\/skills\/browser\/SKILL\.md<\/location>/);
	});

	it("picks the reader from the MCP tool names, read before fabric_exec", () => {
		assert.equal(skillReadToolForMcp(["bash", "read", "fabric_exec"]), "mcp");
		assert.equal(skillReadToolForMcp(["fabric_exec"]), "fabric");
		assert.equal(skillReadToolForMcp(["bash", "edit"]), "none");
		assert.equal(skillReadToolForMcp([]), "none");
	});

	it("keeps skills when Pi selected read or fabric_exec, drops them otherwise", () => {
		assert.equal(selectedToolsCanRead(undefined), true);
		assert.equal(selectedToolsCanRead(["read", "bash"]), true);
		assert.equal(selectedToolsCanRead(["fabric_exec"]), true);
		assert.equal(selectedToolsCanRead(["bash", "edit"]), false);
		assert.equal(selectedToolsCanRead([]), false);
	});


	it("keeps the native read-tool instruction for AskClaude", () => {
		const result = renderSkillsBlock([skill("browser")], "native");
		assert.match(result, /Use the read tool to load/);
		assert.doesNotMatch(result, /mcp__custom-tools__read/);
	});

	it("emits nothing without a usable reader or visible skills", () => {
		assert.equal(renderSkillsBlock([skill("browser")], "none"), undefined);
		assert.equal(renderSkillsBlock([], "mcp"), undefined);
		assert.equal(renderSkillsBlock([skill("hidden", { disabled: true })], "mcp"), undefined);
	});

	it("uses Pi's XML escaping", () => {
		const escaped = skill("browser");
		escaped.description = "read <this> & that";
		assert.match(renderSkillsBlock([escaped], "native"), /read &lt;this&gt; &amp; that/);
	});
});
