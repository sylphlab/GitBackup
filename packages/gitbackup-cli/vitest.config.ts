import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Specify the directory/files to include for testing
    include: ['src/**/*.test.ts'],
    // Optionally, explicitly exclude directories if needed
    // exclude: ['node_modules', 'dist', 'backup', '.git'],
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'], // Choose reporters
      include: ['src/**'], // Specify files/directories to include
      exclude: [ // Specify files/directories to exclude
        'node_modules/**',
        'dist/**',
        'backup/**', // Although unlikely inside package, good practice
        '**/*.test.ts', // Exclude test files
        'src/main.ts', // Exclude main entry point for now
      ],
      all: true, // Include untested files in the report
    },
  },
});