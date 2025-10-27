/**
 * Config command - Manage configuration
 */
import { Command } from 'commander';
import { withErrorHandling } from '../utils/errors';
export function configCommand() {
    return new Command('config')
        .description('Manage Identro Eval configuration')
        .option('--show', 'Show current configuration')
        .option('--edit', 'Edit configuration')
        .action(withErrorHandling(async (options) => {
        console.log('Config management - TODO: Implement');
    }));
}
//# sourceMappingURL=config.js.map