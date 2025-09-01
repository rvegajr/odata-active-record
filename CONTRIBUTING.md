# Contributing to OData Active Record

Thank you for your interest in contributing to OData Active Record! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 10.0.0
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/odata-active-record.git
   cd odata-active-record
   ```
3. Install dependencies:
   ```bash
   npm run install:all
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

### Building

```bash
# Build all packages
npm run build

# Clean build artifacts
npm run clean
```

## Project Structure

```
odata-active-record/
├── packages/
│   ├── odata-active-record-contracts/  # Type definitions and interfaces
│   ├── odata-active-record-core/       # Core implementation
│   └── odata-active-record-astro/      # Astro integration
├── examples/                           # Usage examples
└── docs/                              # Documentation
```

## Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 3. Commit Your Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new interface generation feature"
git commit -m "fix: resolve type inference issue"
git commit -m "docs: update README with new examples"
```

### 4. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

## Code Style Guidelines

### TypeScript

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Testing

- Write unit tests for all new functionality
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Aim for high test coverage

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Include usage examples
- Update interface generation guide if needed

## Pull Request Guidelines

### Before Submitting

1. Ensure all tests pass
2. Run linting and fix any issues
3. Update documentation if needed
4. Test your changes thoroughly

### PR Description

Include:
- Description of changes
- Motivation for changes
- Testing performed
- Breaking changes (if any)
- Screenshots (if UI changes)

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

### Publishing

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release tag
4. Publish to npm

## Getting Help

- Open an issue for bugs or feature requests
- Join our discussions for questions
- Check existing issues and PRs

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## License

By contributing to OData Active Record, you agree that your contributions will be licensed under the MIT License.
