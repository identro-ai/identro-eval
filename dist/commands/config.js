"use strict";
/**
 * Config command - Manage configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommand = configCommand;
const commander_1 = require("commander");
const errors_1 = require("../utils/errors");
function configCommand() {
    return new commander_1.Command('config')
        .description('Manage Identro Eval configuration')
        .option('--show', 'Show current configuration')
        .option('--edit', 'Edit configuration')
        .action((0, errors_1.withErrorHandling)(async (options) => {
        console.log('Config management - TODO: Implement');
    }));
}
//# sourceMappingURL=config.js.map