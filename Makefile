.PHONY: install dev-api dev-web dev test evaluate cluster duplicates clean docker-up docker-down

# Setup virtual environment and dependencies
install:
	/opt/homebrew/bin/python3.11 -m venv .venv
	.venv/bin/pip install --upgrade pip setuptools wheel
	.venv/bin/pip install -r apps/api/requirements.txt
	cd apps/web && npm install

# Run FastAPI backend locally
dev-api:
	OPENCLIP_OFFLINE=true PYTHONPATH=. .venv/bin/uvicorn apps.api.app.main:app --host 0.0.0.0 --port 8000 --reload

# Run Next.js frontend locally
dev-web:
	cd apps/web && npm run dev

# Run test suite
test:
	OPENCLIP_OFFLINE=true PYTHONPATH=. .venv/bin/pytest apps/api/tests/ -v

# Index sample images
sample-data:
	.venv/bin/python scripts/generate_sample_images.py
	OPENCLIP_OFFLINE=true PYTHONPATH=. .venv/bin/python -m app.cli index ./data/sample

# Run ML evaluation benchmark
evaluate:
	OPENCLIP_OFFLINE=true PYTHONPATH=. .venv/bin/python -m app.cli evaluate

# Run image clustering
cluster:
	OPENCLIP_OFFLINE=true PYTHONPATH=. .venv/bin/python -m app.cli cluster

# Run duplicate detection
duplicates:
	OPENCLIP_OFFLINE=true PYTHONPATH=. .venv/bin/python -m app.cli find-duplicates

# Docker container management
docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down

clean:
	rm -rf .pytest_cache
	find . -type d -name __pycache__ -exec rm -rf {} +
