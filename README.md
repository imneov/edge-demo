# Edge Demo - Real-time Monitoring

A Next.js-based demo application for edge computing real-time data inference and monitoring.

## Features

- Real-time data source visualization with image thumbnails
- Edge node status monitoring and metrics display
- Inference result visualization with overlay effects
- Configurable backend API endpoint via environment variables
- Support for calling prediction API with REST interface

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm (recommended) or npm

### Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment file and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:4003](http://localhost:4003) to view the demo.

### Building for Production

```bash
pnpm build
pnpm start
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t edge-demo:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://172.16.0.8:19000 \
  .
```

### Run Docker Container

```bash
docker run -p 4003:4003 \
  -e NEXT_PUBLIC_API_URL=http://172.16.0.8:19000 \
  edge-demo:latest
```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL for edge inference (default: `http://localhost:8000`)

## API Integration

The demo expects the backend API to provide the following endpoints:

### Health Check

```
GET /health
```

Returns status of the model and service.

### Prediction

```
POST /predict
Content-Type: application/json

{
  "imageUrl": "http://example.com/image.png",
  "imageId": "001"
}
```

Returns prediction result:

```json
{
  "message": "lost circulation",
  "prediction": 1,
  "probability": 0.8803
}
```

## Architecture

This is a Next.js application using:

- **App Router**: Modern Next.js routing
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Client-side rendering**: For real-time updates and interactivity

## Project Structure

```
edge-demo/
├── app/                  # Next.js app directory
│   ├── page.tsx         # Main demo page (client component)
│   ├── layout.tsx       # Root layout
│   └── globals.css      # Global styles
├── public/              # Static assets
├── Dockerfile           # Docker build configuration
├── next.config.ts       # Next.js configuration
└── package.json         # Dependencies
```

## Development

### Running Tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm type-check
```

## License

This project is part of the edge computing platform.
