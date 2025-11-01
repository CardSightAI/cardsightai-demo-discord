# CardSight AI Discord Bot Demo

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-7289da)](https://discord.js.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED)](https://www.docker.com/)
[![CardSight AI](https://img.shields.io/badge/Powered%20by-CardSight%20AI-FF6B6B)](https://cardsight.ai)

A Discord bot that demonstrates [CardSight AI](https://cardsight.ai)'s powerful card identification capabilities. Upload an image of a trading card and get instant AI-powered identification results!

## Features

- **AI-Powered Card Identification** - Instantly identify trading cards from images
- **Multi-Card Detection** - Identify multiple cards in a single image
- **Confidence Levels** - See how confident the AI is in its identification
- **Rich Discord Embeds** - Beautiful, informative responses with card details
- **Professional Error Handling** - User-friendly error messages and logging
- **TypeScript** - Fully typed for better developer experience
- **Docker Support** - Easy deployment with containerization

## Prerequisites

- Node.js 24.0 or higher
- npm or yarn package manager
- Discord account and server
- CardSight AI account (free tier available)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/CardSightAI/cardsightai-demo-discord.git
cd cardsightai-demo-discord
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Get Your API Keys

#### Discord Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section in the left sidebar
4. Click "Reset Token" and copy the token (save it securely!)
5. Under "Privileged Gateway Intents", enable:
   - Server Members Intent (if you want to see member counts)
   - Message Content Intent (not required for slash commands)

#### Discord Application ID

1. In the same application, go to "General Information"
2. Copy the "Application ID"

#### CardSight AI API Key

1. Sign up for free at [CardSight AI](https://cardsight.ai)
2. Go to your CardSight AI [API Keys](https://app.cardsight.ai/)
3. Create a new API key and copy it

### 4. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your favorite editor
nano .env  # or vim, code, etc.
```

Add your keys to the `.env` file:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_application_id_here
CARDSIGHTAI_API_KEY=your_cardsight_api_key_here
```

### 5. Build and Run

#### Development Mode (with hot reload)
```bash
npm run dev
```

#### Production Mode
```bash
# Build the TypeScript code
npm run build

# Start the bot
npm start
```

### 6. Invite the Bot to Your Server

1. Go to your application in the [Discord Developer Portal](https://discord.com/developers/applications)
2. Go to "OAuth2" > "URL Generator"
3. Select scopes:
   - `bot`
   - `applications.commands`
4. Select bot permissions:
   - Send Messages
   - Embed Links
   - Attach Files
   - Use Slash Commands
5. Copy the generated URL and open it in your browser
6. Select your server and click "Authorize"

## Usage

Once the bot is in your server, use the `/identify` command:

1. Type `/identify` in any channel where the bot has permissions
2. Attach an image of a trading card
3. Press Enter
4. The bot will identify the card and display the results!

### Example Response

```
📸 Card Identified!
═══════════════════════

Card Details
Name: Mike Trout
Card Number: 27
Year: 2023

Set Information
Set: Topps Chrome
Release: 2023 Topps Chrome Baseball
Manufacturer: Topps

Confidence
🟢 High

Powered by CardSight AI • 0.7s
```

## Docker Deployment

### Using Docker

```bash
# Build the image
docker build -t cardsight-discord-bot .

# Run the container
docker run -d \
  --name cardsight-bot \
  --env-file .env \
  cardsight-discord-bot
```

### Using Docker Compose

```bash
# Start the bot
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the bot
docker-compose down
```

## Project Structure

```
cardsightai-demo-discord/
├── src/
│   ├── commands/         # Discord slash commands
│   │   └── identify.ts   # /identify command implementation
│   ├── events/          # Discord event handlers
│   │   ├── ready.ts     # Bot startup handler
│   │   └── interactionCreate.ts  # Command interaction handler
│   ├── utils/           # Utility functions
│   │   ├── logger.ts    # Winston logger configuration
│   │   ├── cardsight.ts # CardSight API wrapper
│   │   └── embedBuilder.ts  # Discord embed formatters
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts     # Shared types
│   ├── config/          # Configuration management
│   │   └── index.ts     # Environment variable handling
│   └── index.ts         # Main bot entry point
├── .env.example         # Environment variable template
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile          # Docker container definition
├── package.json        # Node.js dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## Extending the Bot

This demo bot provides a solid foundation for building more advanced features. Here are some ideas:

### Add More Commands

Create new command files in `src/commands/`:

```typescript
// src/commands/search.ts
import { SlashCommandBuilder } from 'discord.js';

export const searchCommand = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search for cards'),

  async execute(interaction) {
    // Your command logic here
  }
};
```

### Use More CardSight AI Features

The CardSight AI SDK supports many more features:

- **Catalog Search** - Search through millions of cards
- **Collection Management** - Track card collections
- **Pack Simulations** - Open virtual packs
- **Natural Language Search** - Use AI to search with queries like "rookie cards from 2023"

Example:

```typescript
// Search for cards
const results = await cardsightClient.catalog.cards.list({
  year: 2023,
  manufacturer: 'Topps',
  take: 10
});

// Natural language search
const aiResults = await cardsightClient.ai.query({
  query: "Mike Trout rookie cards"
});
```

## Troubleshooting

### Bot is offline
- Check that your Discord token is correct in `.env`
- Ensure the bot has been invited to your server
- Check logs for error messages: `npm run dev`

### "Authentication failed" error
- Verify your CardSight API key is correct
- Ensure your CardSight account is active
- Check if you've exceeded API limits

### Cards not being identified
- Ensure the image is clear and well-lit
- Try with a single card first
- Check that the file size is under 8MB
- Verify the image format is supported (JPEG, PNG, WebP)

### Commands not showing up
- Wait a few minutes for Discord to register commands globally
- Try kicking and re-inviting the bot
- Check bot permissions in your server

## Configuration Options

All configuration is done through environment variables in `.env`:

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DISCORD_TOKEN` | Yes | Discord bot token | - |
| `DISCORD_CLIENT_ID` | Yes | Discord application ID | - |
| `CARDSIGHTAI_API_KEY` | Yes | CardSight AI API key | - |
| `CARDSIGHTAI_TIMEOUT` | No | API timeout in milliseconds | 30000 |
| `LOG_LEVEL` | No | Logging level (error/warn/info/debug) | info |
| `NODE_ENV` | No | Environment (development/production) | development |

## Security

### Important Security Practices

**⚠️ NEVER commit your `.env` file to version control!**

The `.env` file contains sensitive credentials (API keys, tokens) and must never be committed to Git. This file is already included in `.gitignore` to prevent accidental commits.

### Credential Management

1. **Use `.env.example` as a template** - Copy it to `.env` and fill in your actual credentials
2. **Regenerate credentials if exposed** - If you accidentally commit credentials, regenerate them immediately:
   - Discord: Go to Developer Portal → Your App → Bot → Reset Token
   - CardSight AI: Go to Dashboard → API Keys → Revoke and create new key
3. **Use environment variables in production** - Never hardcode credentials in your code

## Support

- **CardSight AI Documentation**: [docs.cardsight.ai](https://cardsight.ai/documentation)
- **Discord.js Guide**: [discordjs.guide](https://discordjs.guide)
- **Issues**: [GitHub Issues](https://github.com/CardSightAI/cardsightai-demo-discord/issues)
- **CardSight AI Support**: [support@cardsight.ai](mailto:support@cardsight.ai)
- **Security Issues**: [security@cardsight.ai](mailto:security@cardsight.ai)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Discord.js](https://discord.js.org/)
- Powered by [CardSight AI](https://cardsight.ai)
- Written in [TypeScript](https://www.typescriptlang.org/)

---

Made with ❤️ by [CardSight AI](https://cardsight.ai)