# Kanji Card

A modern web application for learning Japanese kanji characters through interactive flashcards.

## Features

- Interactive flashcard system for learning kanji
- Modern and responsive user interface
- Progress tracking
- Spaced repetition learning algorithm

## Tech Stack

- Frontend: React with TypeScript
- Styling: Tailwind CSS
- State Management: React Context API
- Build Tool: Vite

## Getting Started

### Option 1: Using Docker (Recommended)

1. Create a `config.toml` file from the template:

```bash
cp config.toml.template config.toml
```

2. Edit the `config.toml` file and replace the placeholder values:
   - `your-api-key-here` with your OpenRouter API key
   - `your-secret-key-here` with your JWT secret key

3. Pull the Docker image:

```bash
docker pull ghcr.io/yurvon-screamo/kanji_card:latest
```

4. Run the container with the config file:

```bash
docker run -p 8080:8080 -v $(pwd)/config.toml:/app/config.toml ghcr.io/yurvon-screamo/kanji_card:latest
```

The application will be available at `http://localhost:8080`

### Option 2: Local Development

#### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

#### Installation

1. Clone the repository:

```bash
git clone https://github.com/yurvon-screamo/kanji_card.git
cd kanji_card
```

2. Create a `config.toml` file from the template:

```bash
cp config.toml.template config.toml
```

3. Edit the `config.toml` file and replace the placeholder values as described above.

4. Install dependencies:

```bash
npm install
# or
yarn install
```

5. Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Mozilla Public License 2.0 (MPL-2.0) - see the LICENSE file for details.
