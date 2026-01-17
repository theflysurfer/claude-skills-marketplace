#!/usr/bin/env node
/**
 * Test the cleanPromptForRouting function
 */

function cleanPromptForRouting(prompt) {
    let cleaned = prompt;

    // Remove skill injection patterns (from previous routing)
    cleaned = cleaned.replace(/🔧 Skill ".*?" activated[\s\S]*?(?=\n\n[^#-]|$)/g, '');

    // Remove <skill> tags and their content
    cleaned = cleaned.replace(/<skill[^>]*>[\s\S]*?<\/skill>/gi, '');

    // Remove content in triple quotes
    cleaned = cleaned.replace(/"""[\s\S]*?"""/g, '');

    // Remove code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');

    // Remove large quoted blocks (>100 chars)
    cleaned = cleaned.replace(/"([^"]{100,})"/g, '');

    // Remove YAML frontmatter
    cleaned = cleaned.replace(/---[\s\S]*?---/g, '');

    // Remove skill doc headers
    cleaned = cleaned.replace(/^#+ .*(?:Quick Start|Prerequisites|Usage|Commands|API).*$/gm, '');

    return cleaned.trim();
}

// Test case 1: User citing previous skill output
const test1 = `c'est hyper faux : "
● 🔧 Skill "julien-workflow-queuing-background-tasks" activated

  Je vais d'abord comprendre ce qu'est Planotator et pourquoi il n'a pas été déclenché.
"

`;

console.log('=== TEST 1: Quoted skill output ===');
console.log('Original length:', test1.length);
const cleaned1 = cleanPromptForRouting(test1);
console.log('Cleaned length:', cleaned1.length);
console.log('Cleaned:', JSON.stringify(cleaned1));
console.log('');

// Test case 2: Normal prompt should pass through
const test2 = "commit mes changements";
console.log('=== TEST 2: Normal prompt ===');
console.log('Original:', test2);
console.log('Cleaned:', cleanPromptForRouting(test2));
console.log('');

// Test case 3: Code blocks should be removed
const test3 = `Help me understand this:
\`\`\`javascript
function queue_task() {
    return background_job;
}
\`\`\`
How does it work?`;

console.log('=== TEST 3: Code blocks ===');
console.log('Original length:', test3.length);
const cleaned3 = cleanPromptForRouting(test3);
console.log('Cleaned:', cleaned3);
console.log('');

// Test case 4: Skill tag content
const test4 = `<skill name="test">
---
name: test
triggers:
  - background task
  - queue job
---
# Test Skill
This is a test.
</skill>

What should I do?`;

console.log('=== TEST 4: Skill tag ===');
console.log('Original length:', test4.length);
const cleaned4 = cleanPromptForRouting(test4);
console.log('Cleaned:', cleaned4);
