# CONCEPT COMMERCE - Startup Scripts

Quick start scripts to run the full CONCEPT COMMERCE stack.

## Quick Start

### Start Everything
```bash
./start.sh
```

This will:
- Start the Fashion Query API on port 3001
- Start the Frontend on port 3000
- Check that both services are running
- Display access URLs and process IDs

### Stop Everything
```bash
./stop.sh
```

This will:
- Stop both the API and Frontend servers
- Free up ports 3000 and 3001
- Clean up PID files

## Manual Start (Alternative)

If you prefer to run the servers in separate terminals:

### Terminal 1 - API (Port 3001)
```bash
cd fashion_query_api
PORT=3001 npm run dev
```

### Terminal 2 - Frontend (Port 3000)
```bash
cd frontend
npm run dev
```

## Logs

When using `./start.sh`, logs are saved to:
- `logs/api.log` - Fashion Query API logs
- `logs/frontend.log` - Frontend logs

View logs in real-time:
```bash
tail -f logs/api.log
tail -f logs/frontend.log
```

## Troubleshooting

### Ports Already in Use
The `start.sh` script automatically kills processes on ports 3000 and 3001.

To manually free ports:
```bash
lsof -ti:3001 | xargs kill -9  # Kill API
lsof -ti:3000 | xargs kill -9  # Kill Frontend
```

### Server Won't Start
1. Check the logs in `logs/` directory
2. Make sure environment variables are set in `.env.local` files:
   - `fashion_query_api/.env.local` - Database credentials
   - `frontend/.env.local` - Google Maps API key

### Restart After Code Changes
Some changes require a restart:
```bash
./stop.sh
./start.sh
```

## Access URLs

Once started:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **API Endpoint:** http://localhost:3001/api/v1/query

## Process Management

### Check if servers are running
```bash
lsof -i:3000  # Check Frontend
lsof -i:3001  # Check API
```

### View process IDs
When `start.sh` is running, PIDs are saved to:
- `.api.pid` - API process ID
- `.frontend.pid` - Frontend process ID

### Kill specific server
```bash
kill $(cat .api.pid)       # Stop API only
kill $(cat .frontend.pid)  # Stop Frontend only
```

## Running in Background

To run servers in background without keeping terminal open:

```bash
./start.sh &
disown
```

To stop when running in background:
```bash
./stop.sh
```

## Development Workflow

1. **First time setup:**
   ```bash
   cd fashion_query_api && npm install
   cd ../frontend && npm install
   cd ..
   ```

2. **Daily development:**
   ```bash
   ./start.sh
   # Open http://localhost:3000 in browser
   # Make changes to code
   # Servers will hot-reload automatically
   ```

3. **End of day:**
   ```bash
   ./stop.sh
   ```

## Notes

- Both servers support hot-reload, so code changes will reflect automatically
- Environment variables are loaded from `.env.local` files
- Logs are appended, not overwritten (delete `logs/` folder to clear)
- The start script will wait up to 30 seconds for each server to be ready
