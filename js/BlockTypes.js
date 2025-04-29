/**
 * Enumeration of all available block types in the game.
 * This centralized list ensures consistent block type usage across the codebase.
 */
export const BlockTypes = {
	GRASS: 'grass',
	DIRT: 'dirt',
	STONE: 'stone',
	BEDROCK: 'bedrock',
	WATER: 'water',
	LAVA: 'lava'
};

/**
 * Get an array of all available block types.
 * @returns {string[]} Array containing all block type strings
 */
export function getAllBlockTypes() {
	return Object.values(BlockTypes);
}

/**
 * Get an array of solid block types (blocks that have collision).
 * @returns {string[]} Array containing solid block type strings
 */
export function getSolidBlockTypes() {
	return [BlockTypes.GRASS, BlockTypes.DIRT, BlockTypes.STONE, BlockTypes.BEDROCK];
}

/**
 * Get an array of liquid block types (blocks that don't have collision).
 * @returns {string[]} Array containing liquid block type strings
 */
export function getLiquidBlockTypes() {
	return [BlockTypes.WATER, BlockTypes.LAVA];
}

/**
 * Check if a block type is solid.
 * @param {string} blockType - The block type to check
 * @returns {boolean} True if the block is solid, false otherwise
 */
export function isSolidBlockType(blockType) {
	return getSolidBlockTypes().includes(blockType);
}