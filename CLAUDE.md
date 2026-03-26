# CLAUDE.md - Project A

## Project Overview
Python learning project. Beginner-level, exploratory codebase.

## Tech Stack
- **Language**: Python
- **Entry point**: `main.py`

## Development Guidelines
- Follow PEP 8 conventions
- Use type hints for function signatures
- Keep code simple and readable — this is a learning project
- Prefer clear variable names over comments
- Keep flat file structure until complexity warrants packages
- No unnecessary abstractions

## Setup
```bash
pip install pytest ruff
```

## Common Commands
```bash
# Run the project
python main.py

# Run tests
pytest

# Lint
ruff check .

# Format
ruff format .
```

## Testing
- Use `pytest` for all tests
- Place test files alongside source as `test_<module>.py`
- Run a single test: `pytest test_<module>.py -v`

## Conventions
- Commit messages: imperative mood, concise (e.g., "Add user input handling")
- One feature per commit
