import { formatSkillsForPrompt, type Skill } from "@earendil-works/pi-coding-agent";

export const MCP_SERVER_NAME = "custom-tools";
export const MCP_TOOL_PREFIX = `mcp__${MCP_SERVER_NAME}__`;

export type SkillReadTool = "mcp" | "fabric" | "native" | "none";

// pi-fabric full code mode hides Pi's read tool and exposes fabric_exec as the
// only reader, so a skill file is opened with pi.read inside that tool.
const FABRIC_TOOL = "fabric_exec";

export function skillReadToolForMcp(toolNames: Iterable<string>): SkillReadTool {
	const names = new Set(toolNames);
	if (names.has("read")) return "mcp";
	if (names.has(FABRIC_TOOL)) return "fabric";
	return "none";
}

export function selectedToolsCanRead(selectedTools: readonly string[] | undefined): boolean {
	return !selectedTools || selectedTools.includes("read") || selectedTools.includes(FABRIC_TOOL);
}

export function renderSkillsBlock(skills: Skill[], readTool: SkillReadTool): string | undefined {
	if (readTool === "none" || skills.length === 0) return undefined;
	const block = formatSkillsForPrompt(skills).trim();
	if (!block) return undefined;
	if (readTool === "mcp") return rewriteSkillsBlock(block);
	if (readTool === "fabric") return rewriteSkillsBlockForFabric(block);
	return block;
}

export function rewriteSkillsBlock(skillsBlock: string): string {
	return skillsBlock.replace(
		"Use the read tool to load a skill's file",
		`Use the read tool (mcp__${MCP_SERVER_NAME}__read) to load a skill's file`,
	);
}

export function rewriteSkillsBlockForFabric(skillsBlock: string): string {
	return skillsBlock.replace(
		"Use the read tool to load a skill's file",
		`Use \`pi.read(path)\` inside ${MCP_TOOL_PREFIX}${FABRIC_TOOL} to load a skill's file`,
	);
}
