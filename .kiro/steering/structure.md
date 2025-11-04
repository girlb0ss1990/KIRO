# Project Structure

## Current Organization

```
.
├── .kiro/
│   └── steering/          # AI assistant guidance documents
│       ├── product.md     # Product overview and purpose
│       ├── tech.md        # Technology stack and commands
│       └── structure.md   # Project organization (this file)
└── .vscode/
    └── settings.json      # VSCode configuration
```

## Steering Rules Directory
The `.kiro/steering/` directory contains markdown files that guide AI assistant behavior:

- **Always included**: All steering files are automatically included in AI context
- **Conditional inclusion**: Can be configured with front-matter for specific file patterns
- **Manual inclusion**: Can be referenced explicitly using `#` context keys

## VSCode Configuration
- **settings.json**: Contains Kiro-specific configurations
- **MCP Integration**: Currently disabled via `kiroAgent.configureMCP: "Disabled"`

## Future Structure Considerations
As the project grows, consider organizing code into:

- `src/` - Source code
- `tests/` - Test files
- `docs/` - Documentation
- `config/` - Configuration files
- `scripts/` - Build and utility scripts

## File Naming Conventions
- Use lowercase with hyphens for directories: `my-component/`
- Use descriptive names that clearly indicate purpose
- Keep steering files focused and single-purpose
- Update this structure document as the project evolves